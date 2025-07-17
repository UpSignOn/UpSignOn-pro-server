import Joi from 'joi';
import https from 'https';
import jwt, { GetPublicKeyOrSecret, JwtPayload } from 'jsonwebtoken';
import { URLSearchParams } from 'url';
import { logError } from '../../../helpers/logger';
import { db } from '../../../helpers/db';
import jwksClient from 'jwks-rsa';
import { MicrosoftGraph } from 'ms-entra-for-upsignon';
import { getGroupIds } from '../../helpers/bankUUID';
import { getEmailAuthorizationStatus } from '../../helpers/emailAuthorization';
import { SessionStore } from '../../../helpers/sessionStore';

export const authenticateWithOpenidAuthCode = async (req: any, res: any) => {
  try {
    const safeBody: {
      openidConfigurationUrl: string;
      scope: string;
      authCode: string;
      redirectUri: string;
      codeVerifier: string;
    } = Joi.attempt(
      req.body,
      Joi.object({
        openidConfigurationUrl: Joi.string().uri().required(),
        scope: Joi.string().required(),
        authCode: Joi.string().required(),
        redirectUri: Joi.string().required(),
        codeVerifier: Joi.string().required(),
      }),
    );

    const groupIds = await getGroupIds(req);

    // check that the openidConfigurationUrl is indeed associated with this bank
    const bankConfigRes = await db.query(
      `SELECT client_id FROM bank_sso_config WHERE bank_id=$1 AND openid_configuration_url=$2`,
      [groupIds.internalId, safeBody.openidConfigurationUrl],
    );
    if (bankConfigRes.rowCount == null || bankConfigRes.rowCount === 0) {
      res.status(400).end();
      return;
    }
    const clientId = bankConfigRes.rows[0]!.client_id;

    const openidConfig = await fetchOpenIdConfig(safeBody.openidConfigurationUrl);

    // EXCHANGE CODE FOR ACCESS_TOKEN
    let tokenJson: AccessTokenType | { error: string; error_description: string };
    try {
      tokenJson = await postTokenEndpoint({
        token_endpoint: openidConfig.token_endpoint,
        client_id: clientId,
        scope: safeBody.scope,
        code: safeBody.authCode,
        redirect_uri: safeBody.redirectUri,
        code_verifier: safeBody.codeVerifier,
      });
    } catch (err) {
      res.status(400).json({ error: err });
      return;
    }

    if (tokenJson.hasOwnProperty('error_description')) {
      // @ts-ignore
      const msg = tokenJson.error_description;
      logError('authenticateWithOpenidAuthCode postTokenEndpoint fail', msg);
      res.status(400).json({ error: msg });
      return;
    }

    // CHECK SIGNATURES
    const client = jwksClient({
      jwksUri: openidConfig.jwks_uri,
      requestHeaders: {
        'user-agent': 'upsignon-pro-server',
      },
    });
    const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
      client.getSigningKey(header.kid, function (err, key) {
        if (err) {
          callback(err);
        } else {
          const signingKey = key!.getPublicKey();
          callback(null, signingKey);
        }
      });
    };

    // NB : ms_entra does not sign access_token with the publicized keys.
    // Only id_tokens can be verified for ms_entra.

    // verify idToken
    let decodedIdToken: string | JwtPayload;
    try {
      decodedIdToken = await new Promise((resolve, reject) => {
        const opts: jwt.VerifyOptions = {
          algorithms: openidConfig.id_token_signing_alg_values_supported,
        };
        jwt.verify(tokenJson.id_token, getKey, opts, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            // @ts-ignore
            resolve(decoded);
          }
        });
      });
    } catch (e) {
      res.status(400).json({ error: `Invalid id_token signature ${e}` });
      return;
    }

    let decodedAccessToken = null;
    try {
      decodedAccessToken = jwt.decode(tokenJson.access_token);
    } catch (e) {
      // All access token are not necessarily JWT compliant, as documented by Microsoft.
      // We must not depend on that.
    }
    const accessTokenExp =
      typeof decodedAccessToken == 'object' && decodedAccessToken?.exp
        ? decodedAccessToken?.exp
        : null;

    // extract email
    let userEmail: string | null = null;
    if (typeof decodedIdToken == 'string') {
      // maybe the accessToken will contain an email
      if (decodedAccessToken && typeof decodedAccessToken == 'object') {
        userEmail = decodedAccessToken.email;
      }
    } else {
      userEmail = decodedIdToken.email;
    }

    if (!userEmail) {
      res
        .status(400)
        .json({ error: 'Authentication successfull but not email was found in token.' });
      return;
    }

    // make sure email address is allowed
    const existingVaults = await db.query('SELECT id FROM users WHERE email=$1 AND group_id=$2', [
      userEmail,
      groupIds.internalId,
    ]);
    const existingVaultId = existingVaults.rows.length > 0 ? existingVaults.rows[0].id : null;
    if (!existingVaultId) {
      const userMSEntraId = await MicrosoftGraph.getUserId(groupIds.internalId, userEmail);
      const emailAuthStatus = await getEmailAuthorizationStatus(
        userEmail,
        userMSEntraId,
        groupIds.internalId,
      );
      if (emailAuthStatus == 'UNAUTHORIZED') {
        return res
          .status(400)
          .json({ error: 'User is SSO authenticated but not allowed on this bank.' });
      }
    }

    const openidSession = await SessionStore.createOpenIdSession(
      {
        groupId: groupIds.internalId,
        accessToken: tokenJson.access_token,
        userEmail,
      },
      accessTokenExp,
    );
    const nonce = typeof decodedIdToken == 'string' ? null : decodedIdToken.nonce;
    res.status(200).json({
      openidSession,
      email: userEmail,
      nonce,
    });
  } catch (e) {
    logError('authenticateWithOpenidAuthCode', e);
    res.status(400).end();
  }
};

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
const fetchOpenIdConfig = async (
  openid_configuration_url: string,
): Promise<{
  token_endpoint: string;
  jwks_uri: string;
  id_token_signing_alg_values_supported: jwt.Algorithm[];
}> => {
  return new Promise((resolve, reject) => {
    const configUri = new URL(openid_configuration_url);
    const openidConfigReq = https.request(
      configUri,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          const errorMessage = `Failed to fetch OpenID configuration. Status code: ${res.statusCode}`;
          logError('fetchOpenIdConfig', errorMessage);
          reject(new Error(errorMessage));
          return;
        }
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    openidConfigReq.on('error', (error) => {
      logError('fetchOpenIdConfig error', error);
      reject();
    });
    openidConfigReq.end();
  });
};

type AccessTokenType = {
  token_type: string;
  scope: string;
  access_token: string;
  id_token: string;
  aud: string;
  iss: string;
};

const postTokenEndpoint = async (params: {
  token_endpoint: string;
  client_id: string;
  scope: string;
  code: string;
  redirect_uri: string;
  code_verifier: string;
}): Promise<AccessTokenType> => {
  return new Promise((resolve, reject) => {
    const searchParams = new URLSearchParams({
      client_id: params.client_id,
      scope: params.scope,
      code: params.code,
      redirect_uri: params.redirect_uri,
      grant_type: 'authorization_code',
      code_verifier: params.code_verifier,
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': searchParams.toString().length,
      },
    };

    const tokenReq = https.request(params.token_endpoint, options, (tokenRes) => {
      let responseData = '';
      tokenRes.on('data', (chunk) => {
        responseData += chunk;
      });
      tokenRes.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve(json);
        } catch (err) {
          logError('postTokenEndpoint', err);
          reject('Invalid JSON response from IDP');
        }
      });
    });

    tokenReq.on('error', (error: any) => {
      logError('postTokenEndpoint', error);
      reject('Error with IDP');
    });

    tokenReq.write(searchParams.toString());
    tokenReq.end();
  });
};
