import { db } from '../../helpers/db';

export type GroupIds = {
  publicId: string;
  internalId: number;
  usesDeprecatedIntId: boolean;
};

/// This function transforms uuidv4 group id into integer group id
/// and maintains backwards compatibility with previous id format
export const getGroupIds = async (req: any): Promise<GroupIds> => {
  const rawId = req.params.bankUUID;
  let internalId, publicId;
  let usesDeprecatedIntId = false;
  if (typeof rawId === 'undefined' || rawId == null || rawId === 'undefined') {
    // this is the deprecated default integer group id 1
    internalId = 1;
  } else {
    const intId = Number.parseInt(rawId);
    if (!Number.isNaN(intId)) {
      // this is the deprecated integer group id
      internalId = intId;
    } else if (typeof rawId !== 'string' || rawId.length != 36) {
      throw new Error('Bad groupId in req.params: ' + rawId);
    } else {
      publicId = rawId;
    }
  }

  if (internalId != null) {
    // NB : usage of internal group ids for new banks is deprecated since 2025-04-08.
    // Let's allow this only for banks created before that date.
    const gRes = await db.query(
      "SELECT public_id FROM groups WHERE id=$1 AND created_at <= '2025-04-08'",
      [internalId],
    );
    if (gRes.rows.length === 1) {
      usesDeprecatedIntId = true;
      publicId = gRes.rows[0].public_id;
    } else {
      throw new Error(`Group id ${internalId} not found.`);
    }
  } else {
    const gRes = await db.query('SELECT id FROM groups WHERE public_id=$1', [publicId]);
    if (gRes.rows.length === 1) {
      internalId = gRes.rows[0].id;
    } else {
      throw new Error(`Group public id ${publicId} not found.`);
    }
  }

  return {
    internalId,
    publicId,
    usesDeprecatedIntId,
  };
};
