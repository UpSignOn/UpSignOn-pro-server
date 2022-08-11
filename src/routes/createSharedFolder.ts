import { db } from '../helpers/db';
import { logError } from '../helpers/logger';
import { isStrictlyLowerVersion } from '../helpers/appVersionChecker';
import { checkBasicAuth } from '../helpers/authorizationChecks';
import { inputSanitizer } from '../helpers/sanitizer';

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
