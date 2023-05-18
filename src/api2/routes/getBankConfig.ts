import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getBankConfig = async (req: any, res: any): Promise<void> => {
    try {
        // TODO do not use a number ?
        const groupId = inputSanitizer.getNumber(req.params.groupId, 1);

        const nameRes = await db.query('SELECT name FROM groups WHERE id=$1', [groupId]);
        if (nameRes.rowCount === 0) {
            throw new Error('bad group');
        }
        return res.status(200).json({
            bankName: nameRes.rows[0].name,
        });
    } catch (e) {
        logError('getConfig', e);
        return res.status(400).end();
    }
};
