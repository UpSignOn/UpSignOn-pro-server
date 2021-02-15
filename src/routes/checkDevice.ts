import { db } from '../helpers/connection';
import { isExpired } from '../helpers/dateHelper';

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
        `<p>Succès : vous pouvez maintenant accéder à votre espace confidentiel UpSignOn PRO à partir de l\'appareil ${dbRes.rows[0].device_name}.</p>`,
      );
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
