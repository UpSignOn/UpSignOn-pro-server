/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

export const checkBasicAuth = async (
  req: any,
): Promise<
  { userEmail: string; deviceId: string; userId: number; granted: true } | { granted: false }
> => {
  let userEmail = req.body?.userEmail;
  const deviceId = req.body?.deviceId;
  const deviceAccessCode = req.body?.deviceAccessCode;

  userEmail = userEmail.toLowerCase();

  if (!userEmail || typeof userEmail !== 'string') return { granted: false };
  if (!deviceId) return { granted: false };
  if (!deviceAccessCode) return { granted: false };

  // Request DB
  const dbRes = await db.query(
    `SELECT users.id AS userid, user_devices.access_code_hash AS access_code_hash FROM user_devices INNER JOIN users ON user_devices.user_id = users.id WHERE users.email=$1 AND user_devices.device_unique_id = $2 AND user_devices.authorization_status='AUTHORIZED'`,
    [userEmail, deviceId],
  );

  if (!dbRes || dbRes.rowCount === 0) return { granted: false };

  // Check access code
  const isAccessGranted = await accessCodeHash.asyncIsOk(
    deviceAccessCode,
    dbRes.rows[0].access_code_hash,
  );
  if (!isAccessGranted) return { granted: false };

  return { userEmail, deviceId, userId: dbRes.rows[0].userid, granted: true };
};
