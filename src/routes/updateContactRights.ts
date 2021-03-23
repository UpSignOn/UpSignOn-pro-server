import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateContactRights = async (req: any, res: any): Promise<void> => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const contactId = req.body?.contactId;
    const itemId = req.body?.itemId;
    const isManager = req.body.isManager;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!contactId) return res.status(401).end();
    if (!itemId) return res.status(401).end();
    if (typeof isManager === 'undefined') return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        u.id AS user_id,
        ud.access_code_hash AS access_code_hash
      FROM user_devices AS ud
      INNER JOIN users AS u ON ud.user_id = u.id
      INNER JOIN shared_account_users AS sau ON u.id = sau.user_id
      WHERE
        u.email=$1
        AND ud.device_unique_id = $2
        AND sau.shared_account_id = $3
        AND sau.is_manager = true
        AND ud.authorization_status = 'AUTHORIZED'`,
      [userEmail, deviceId, itemId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    if (dbRes.rows[0].user_id === contactId) {
      // prevent someone from removing oneself their manager rights
      // to make sure there is always at least one manager for each item
      return res.status(401).end();
    }
    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    const updateRes = await db.query(
      'UPDATE shared_account_users SET is_manager=$1 WHERE shared_account_id=$2 AND user_id=$3',
      [isManager, itemId, contactId],
    );

    if (updateRes.rowCount !== 1) return res.status(400).end();

    return res.status(200).end();
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
