import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const checkUserPublicKey = async (req: any, res: any) => {
  try {
    // Get params
    const userEmail = req.body?.userEmail;
    const deviceId = req.body?.deviceId;
    const deviceAccessCode = req.body?.deviceAccessCode;
    const publicKey = req.body?.publicKey;

    // Check params
    if (!userEmail) return res.status(401).end();
    if (!deviceId) return res.status(401).end();
    if (!deviceAccessCode) return res.status(401).end();
    if (!publicKey) return res.status(401).end();

    // Request DB
    const dbRes = await db.query(
      `SELECT
        users.sharing_public_key AS sharing_public_key,
        user_devices.access_code_hash AS access_code_hash
      FROM user_devices
      INNER JOIN users
      ON user_devices.user_id = users.id
      WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND user_devices.authorization_status='AUTHORIZED'`,
      [userEmail, deviceId],
    );

    if (!dbRes || dbRes.rowCount === 0) return res.status(401).end();

    // Check access code
    const isAccessGranted = await accessCodeHash.asyncIsOk(
      deviceAccessCode,
      dbRes.rows[0].access_code_hash,
    );
    if (!isAccessGranted) return res.status(401).end();

    let matchingKeys = true;
    if (dbRes.rows[0].sharing_public_key !== publicKey) {
      matchingKeys = false;
      const message = `WARNING! POTENTIAL HACK DETECTED!\nThe public key for user ${userEmail} that was found in the database did not match the public key registered in the user's private space. The database public key was\n\n${dbRes.rows[0].sharing_public_key}\n\nwhile the user's expected public key was\n\n${publicKey}\n\nA database request to update the public key for this user with his expected public key will be made right after this message.\nIt is possible that the hacker has been able to read the passwords of all the accounts that are shared with ${userEmail}.`;
      console.log(message);
      console.error(message);
      await db.query('UPDATE users SET sharing_public_key = $1 WHERE email=$2', [
        publicKey,
        userEmail,
      ]);
    }
    // Return res
    return res.status(200).json({ matchingKeys });
  } catch (e) {
    console.error(e);
    return res.status(400).end();
  }
};
