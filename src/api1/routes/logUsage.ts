import { checkBasicAuth } from '../../helpers/authorizationChecks';
import { db } from '../../helpers/db';
import { logError } from '../../helpers/logger';
import { inputSanitizer } from '../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const logUsage = async (req: any, res: any): Promise<void> => {
  try {
    const logType = inputSanitizer.getString(req.body?.logType);
    if (!logType) return res.status(401).end();

    const basicAuth = await checkBasicAuth(req, { returningDeviceId: true });
    if (!basicAuth.granted) return res.status(401).end();

    // db request
    await db.query('INSERT INTO usage_logs (device_id, log_type, group_id) VALUES ($1,$2, $3)', [
      basicAuth.deviceId,
      logType,
      basicAuth.groupId,
    ]);

    return res.status(204).end();
  } catch (e) {
    logError('logUsage', e);
    return res.status(400).end();
  }
};
