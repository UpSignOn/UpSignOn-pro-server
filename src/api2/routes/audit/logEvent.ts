import { checkBasicAuth2 } from '../../helpers/authorizationChecks';
import { db } from '../../../helpers/db';
import { logError } from '../../../helpers/logger';
import { inputSanitizer } from '../../../helpers/sanitizer';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const logEvent = async (req: any, res: any): Promise<void> => {
  try {
    const event = inputSanitizer.getString(req.body?.event);
    if (!event) return res.status(403).end();

    // TODO do not delete devices to allow keeping the audit track
    const basicAuth = await checkBasicAuth2(req, { returningDeviceId: true });
    if (!basicAuth.granted) return res.status(401).end();

    // db request
    await db.query(
      'INSERT INTO event_logs (device_id, user_email, event, group_id) VALUES ($1,$2, $3, $4)',
      [basicAuth.deviceId, basicAuth.userEmail, event, basicAuth.groupId],
    );

    return res.status(204).end();
  } catch (e) {
    logError(req.body?.userEmail, 'logEvent', e);
    return res.status(400).end();
  }
};
