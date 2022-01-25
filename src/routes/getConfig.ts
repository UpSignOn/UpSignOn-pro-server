import { db } from '../helpers/connection';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getConfig = async (req: any, res: any): Promise<void> => {
  try {
    const groupId = parseInt(req.params.groupId || 1);

    const nameRes = await db.query('SELECT name FROM groups WHERE id=$1', [groupId]);
    if (nameRes.rowCount === 0) {
      throw new Error('bad group');
    }
    return res.status(200).json({
      displayName: nameRes.rows[0].name,
      setupV2: true,
    });
  } catch (e) {
    logError('getConfig', e);
    return res.status(400).end();
  }
};
