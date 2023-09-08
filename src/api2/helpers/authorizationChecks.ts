/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../../helpers/db';
import { inputSanitizer } from '../../helpers/sanitizer';
import { SessionStore } from '../../helpers/sessionStore';

export const checkBasicAuth2 = async (
  req: any,
  options?: {
    returningUserPublicKey?: true;
    returningData?: true;
    returningDeviceId?: true;
    checkIsManagerForVaultId?: number;
    checkIsRecipientForVaultId?: number;
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
  const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

  const deviceSession = inputSanitizer.getString(req.body?.deviceSession);
  const userEmail = inputSanitizer.getLowerCaseString(req.body?.userEmail);
  const deviceUId = inputSanitizer.getString(req.body?.deviceId);

  if (!userEmail) return { granted: false };
  if (!deviceUId) return { granted: false };
  if (!deviceSession) return { granted: false };

  if (deviceSession) {
    const isSessionOK = await SessionStore.checkSession(deviceSession, {
      userEmail,
      deviceUniqueId: deviceUId,
      groupId,
    });
    if (!isSessionOK) return { granted: false };
  }

  const publicKeySelect = options?.returningUserPublicKey
    ? 'u.sharing_public_key AS sharing_public_key,'
    : '';
  const dataSelect = options?.returningData ? 'u.encrypted_data_2 AS encrypted_data_2,' : '';
  const deviceIdSelect = options?.returningDeviceId ? 'ud.id AS device_id,' : '';

  const accountManagerOrRecipientJoin =
    options?.checkIsManagerForVaultId || options?.checkIsRecipientForVaultId
      ? 'INNER JOIN shared_vault_recipients AS svr ON u.id = svr.user_id'
      : '';
  const accountManagerOrRecipientWhere = options?.checkIsRecipientForVaultId || options?.checkIsManagerForVaultId
    ? 'AND svr.shared_vault_id=$4'
    : '';
  const accountManagerOrRecipientParam = options?.checkIsManagerForVaultId || options?.checkIsRecipientForVaultId
    ? [options.checkIsManagerForVaultId || options.checkIsRecipientForVaultId]
    : [];
  const accountRecipientWhere = options?.checkIsRecipientForVaultId
    ? 'AND svr.is_manager=true'
    : '';

  // Request DB
  const dbRes = await db.query(
    `SELECT
      ${publicKeySelect}
      ${dataSelect}
      ${deviceIdSelect}
      u.id AS user_id,
      char_length(ud.device_public_key) > 0 AS has_device_public_key
    FROM user_devices AS ud
    INNER JOIN users AS u ON ud.user_id = u.id
    ${accountManagerOrRecipientJoin}
    WHERE
      u.email=$1
      AND ud.device_unique_id = $2
      AND ud.authorization_status='AUTHORIZED'
      AND u.group_id=$3
      ${accountManagerOrRecipientWhere}
      ${accountRecipientWhere}
      `,
    [userEmail, deviceUId, groupId, ...accountManagerOrRecipientParam],
  );

  if (!dbRes || dbRes.rowCount === 0) return { granted: false };

  return {
    userEmail,
    deviceUId,
    userId: dbRes.rows[0].user_id,
    sharingPublicKey: dbRes.rows[0].sharing_public_key,
    encryptedData: dbRes.rows[0].encrypted_data_2,
    deviceId: dbRes.rows[0].device_id,
    granted: true,
    groupId,
  };
};