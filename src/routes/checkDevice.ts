import { db } from '../helpers/connection';
import { isExpired } from '../helpers/dateHelper';
import { logError } from '../helpers/logger';

/**
 * Returns
 * - 200 invalid link
 * - 200 expired link
 * - 200 success
 * - 400
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkDevice = async (req: any, res: any) => {
  try {
    // Extract query parameters
    const requestId = req.query?.requestId;
    const requestToken = req.query?.requestToken;

    res.set('Content-Type', 'text/html');
    if (!requestId || !requestToken)
      return res.status(200).send("<p>Erreur : ce lien n'est plus valide.</p>");

    // Request db
    const dbRes = await db.query(
      'SELECT authorization_code, auth_code_expiration_date, authorization_status, device_name FROM user_devices WHERE id=$1',
      [requestId],
    );
    if (
      dbRes.rowCount === 0 ||
      dbRes.rows[0].authorization_code !== requestToken ||
      dbRes.rows[0].authorization_status !== 'PENDING'
    )
      return res.status(200).send("<p>Erreur : ce lien n'est plus valide.</p>");
    if (isExpired(dbRes.rows[0].auth_code_expiration_date))
      return res
        .status(200)
        .send('<p>Erreur : ce lien a expiré, veuillez renouveller la demande dans UpSignOn.</p>');

    await db.query(
      "UPDATE user_devices SET (authorization_status, authorization_code, auth_code_expiration_date) = ('AUTHORIZED', null, null) WHERE id=$1",
      [requestId],
    );
    return res
      .status(200)
      .send(
        `<!DOCTYPE html><html lang="fr"><body style="display:flex; justify-content: center; align-items:center;"><div style="max-width: 500px;"><h1>Votre appareil ${dbRes.rows[0].device_name} est maintenant autorisé !</h1><h3>Retournez dans l'application UpSignOn pour accéder à votre espace confidentiel PRO.</h3></div></body></html>`,
      );
  } catch (e) {
    logError('checkDevice', e);
    return res.status(400).end();
  }
};
