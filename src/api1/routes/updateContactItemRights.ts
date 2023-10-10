import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { PREVENT_V1_API_WHEN_V2_DATA, checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const updateContactItemRights = async (req: any, res: any): Promise<void> => {
  try {
    const contactId = inputSanitizer.getNumberOrNull(req.body?.contactId);
    const itemId = inputSanitizer.getNumberOrNull(req.body?.itemId);
    const isManager = inputSanitizer.getBoolean(req.body.isManager);
    if (contactId == null) return res.status(401).end();
    if (itemId == null) return res.status(401).end();
    if (typeof isManager === 'undefined') return res.status(401).end();

    const basicAuth = await checkBasicAuth(req, { checkIsManagerForItemId: itemId });
    if (!basicAuth.granted) return res.status(401).end();

    const hasDataV2Res = await db.query(
      'SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1',
      [basicAuth.userId],
    );
    if (PREVENT_V1_API_WHEN_V2_DATA && hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({ error: 'deprecated_app' });
    }

    if (basicAuth.userId === contactId) {
      // prevent someone from removing oneself their manager rights
      // to make sure there is always at least one manager for each item
      return res.status(401).end();
    }

    const updateRes = await db.query(
      'UPDATE shared_account_users AS sau SET is_manager=$1 FROM shared_accounts AS sa WHERE sau.shared_account_id=sa.id AND sau.shared_account_id=$2 AND sau.user_id=$3 AND sa.group_id=$4 AND sa.shared_folder_id IS NULL',
      [isManager, itemId, contactId, basicAuth.groupId],
    );

    if (updateRes.rowCount !== 1) return res.status(400).end();

    return res.status(200).end();
  } catch (e) {
    logError('updateContactRights', e);
    return res.status(400).end();
  }
};
