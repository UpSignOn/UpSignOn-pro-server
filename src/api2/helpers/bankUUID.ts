import { db } from '../../helpers/db';

export type BankIds = {
  publicId: string;
  internalId: number;
  usesDeprecatedIntId: boolean;
};

export class BadBankIdException extends Error {}

/// This function transforms uuidv4 group id into integer group id
/// and maintains backwards compatibility with previous id format
export const getBankIds = async (req: any): Promise<BankIds> => {
  const rawId = req.params.bankUUID;
  let internalId, publicId;
  let usesDeprecatedIntId = false;
  if (typeof rawId === 'undefined' || rawId == null || rawId === 'undefined') {
    // this is the deprecated default integer group id 1
    internalId = 1;
  } else if (rawId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)) {
    publicId = rawId;
  } else if (rawId.match(/^[1-9][0-9]{0,3}$/)) {
    internalId = Number.parseInt(rawId);
  } else {
    throw new BadBankIdException('Bad groupId in req.params: ' + rawId);
  }

  if (internalId != null) {
    // NB : usage of internal group ids for new banks is deprecated since 2025-04-08.
    // Let's allow this only for banks created before that date.
    const gRes = await db.query(
      "SELECT public_id FROM banks WHERE id=$1 AND created_at <= '2025-04-08'",
      [internalId],
    );
    if (gRes.rows.length === 1) {
      usesDeprecatedIntId = true;
      publicId = gRes.rows[0].public_id;
    } else {
      throw new BadBankIdException(`Group id ${internalId} not found.`);
    }
  } else {
    const gRes = await db.query('SELECT id FROM banks WHERE public_id=$1', [publicId]);
    if (gRes.rows.length === 1) {
      internalId = gRes.rows[0].id;
    } else {
      throw new BadBankIdException(`Group public id ${publicId} not found.`);
    }
  }

  return {
    internalId,
    publicId,
    usesDeprecatedIntId,
  };
};
