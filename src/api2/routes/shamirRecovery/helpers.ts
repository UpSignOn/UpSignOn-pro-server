import { db } from '../../../helpers/db';

export const findShamirConfigId = async (userId: number): Promise<number | null> => {
  const configIdRes = await db.query(
    `SELECT sc.id as id
    FROM shamir_configs as sc
    INNER JOIN shamir_recipients as sr ON sr.shamir_config_id=sc.id
    INNER JOIN shamir_shares as ss ON ss.shamir_recipient_id = sr.user_id
    INNER JOIN users as u ON u.id = ss.user_id
    WHERE u.id=$1
    LIMIT 1
    `,
    [userId],
  );
  return configIdRes.rowCount == 1 ? configIdRes.rows[0].id : null;
};

export const findShamirRecipientIdForConfig = async (
  recipientUserId: number,
  configId: number,
): Promise<number | null> => {
  const dbRes = await db.query(
    `SELECT sr.id as id
    FROM shamir_recipients as sr
    WHERE sr.shamir_config_id=$1
    AND sr.user_id=$2
    LIMIT 1
    `,
    [configId, recipientUserId],
  );
  return dbRes.rowCount == 1 ? dbRes.rows[0].id : null;
};

export const isShamirRecoveryReady = async (
  configId: number,
  targetUserId: number,
): Promise<boolean> => {
  const checkConfigRes = await db.query('SELECT min_shares FROM shamir_configs WHERE id=$1', [
    configId,
  ]);
  const minShares = checkConfigRes.rows[0].min_shares;
  const sharesRes = await db.query(
    'SELECT encrypted_approved_share FROM shamir_shares WHERE user_id=$1 AND encrypted_approved_share IS NOT NULL',
    [targetUserId],
  );
  return sharesRes.rowCount != null && sharesRes.rowCount >= minShares;
};

export const findShamirRecipientUniqueEmailsForTargetUserId = async (
  targetUserId: number,
): Promise<string[]> => {
  const dbRes = await db.query(
    `SELECT DISTINCT u.email as email
    FROM users as u
    INNER JOIN shamir_recipients as sr ON sr.user_id = u.id
    INNER JOIN shamir_shares as ss ON ss.shamir_recipient_id = sr.id
    WHERE
      ss.user_id=$1
    `,
    [targetUserId],
  );
  return dbRes.rows.map((a) => a.email);
};
