import { logError } from '../../../helpers/logger';
import { SessionStore } from '../../../helpers/sessionStore';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const disconnect2 = async (req: any, res: any) => {
  try {
    await SessionStore.disconnectSession(req.body?.deviceSession);
    logError(req.body?.userEmail, 'disconnect2 OK');
  } catch (e) {
    console.error('Disconnect error', e);
  }
  res.status(204).end();
};
