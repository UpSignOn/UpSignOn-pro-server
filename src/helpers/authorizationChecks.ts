/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../helpers/connection';
import { accessCodeHash } from '../helpers/accessCodeHash';

export const checkBasicAuth = async (
  req: any,
  options?: {
    returningUserPublicKey?: true;
    returningData?: true;
    returningDeviceId?: true;
    checkIsManagerForItemId?: number;
    checkIsRecipientForItemId?: number;
  },
): Promise<
  | {
      userEmail: string;
      deviceUId: string;
      userId: number;
      sharingPublicKey: null | string;
      encryptedData: null | string;
      deviceId: null | number;
      granted: true;
      groupId: number;
    }
  | { granted: false }
> => {
  const groupId = parseInt(req.params.groupId || 1);

  let userEmail = req.body?.userEmail;
  const deviceUId = req.body?.deviceId;
  const deviceAccessCode = req.body?.deviceAccessCode;

  userEmail = userEmail.toLowerCase();

  if (!userEmail || typeof userEmail !== 'string') return { granted: false };
  if (!deviceUId) return { granted: false };
  if (!deviceAccessCode) return { granted: false };

  const publicKeySelect = options?.returningUserPublicKey
    ? 'u.sharing_public_key AS sharing_public_key,'
    : '';
  const dataSelect = options?.returningData ? 'u.encrypted_data AS encrypted_data,' : '';
  const deviceIdSelect = options?.returningDeviceId ? 'ud.id AS device_id,' : '';

  const accountManagerOrRecipientJoin =
    options?.checkIsManagerForItemId || options?.checkIsRecipientForItemId
      ? 'INNER JOIN shared_account_users AS sau ON u.id = sau.user_id'
      : '';
  const accountManagerWhere = options?.checkIsManagerForItemId
    ? 'AND sau.is_manager=true AND sau.shared_account_id=$4'
    : '';
  const accountManagerParam = options?.checkIsManagerForItemId
    ? [options.checkIsManagerForItemId]
    : [];
  const accountRecipientWhere = options?.checkIsRecipientForItemId
    ? 'AND sau.shared_account_id=$4'
    : '';
  const accountRecipientParam = options?.checkIsRecipientForItemId
    ? [options.checkIsRecipientForItemId]
    : [];

  // Request DB
  const dbRes = await db.query(
    `SELECT
      ${publicKeySelect}
      ${dataSelect}
      ${deviceIdSelect}
      u.id AS user_id,
      ud.access_code_hash AS access_code_hash
    FROM user_devices AS ud
    INNER JOIN users AS u ON ud.user_id = u.id
    ${accountManagerOrRecipientJoin}
    WHERE
      u.email=$1
      AND ud.device_unique_id = $2
      AND ud.authorization_status='AUTHORIZED'
      AND u.group_id=$3
      ${accountManagerWhere}
      ${accountRecipientWhere}
      `,
    [userEmail, deviceUId, groupId, ...accountManagerParam, ...accountRecipientParam],
  );

  if (!dbRes || dbRes.rowCount === 0) return { granted: false };

  // Check access code
  const isAccessGranted = await accessCodeHash.asyncIsOk(
    deviceAccessCode,
    dbRes.rows[0].access_code_hash,
  );
  if (!isAccessGranted) return { granted: false };

  return {
    userEmail,
    deviceUId,
    userId: dbRes.rows[0].user_id,
    sharingPublicKey: dbRes.rows[0].sharing_public_key,
    encryptedData: dbRes.rows[0].encrypted_data,
    deviceId: dbRes.rows[0].device_id,
    granted: true,
    groupId,
  };
};
