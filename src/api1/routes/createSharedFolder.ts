import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { isStrictlyLowerVersion } from '../../helpers/appVersionChecker';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const createSharedFolder = async (req: any, res: any): Promise<void> => {
  try {
    const appVersion = inputSanitizer.getString(req.body?.appVersion);
    if (isStrictlyLowerVersion(appVersion, '4.5.0')) {
      return res.status(403).send({ error: 'deprecated_app' });
    }

    const folderName = inputSanitizer.getString(req.body?.sharedFolderName);
    if (!folderName) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req);
    if (!basicAuth.granted) return res.status(401).end();



    const hasDataV2Res = await db.query("SELECT length(encrypted_data_2) AS data2_length FROM users WHERE id=$1", [basicAuth.userId]);
    if(hasDataV2Res.rows[0].data2_length > 0) {
      return res.status(403).json({error: 'deprecated_app'});
    }

    const inserted = await db.query(
      'INSERT INTO shared_folders (name, group_id) VALUES ($1, $2) RETURNING id',
      [folderName, basicAuth.groupId],
    );
    const newSharedFolderId = inserted.rows[0].id;

    res.status(200).json({ newSharedFolderId });
  } catch (e) {
    logError('share', e);
    return res.status(400).end();
  }
};
