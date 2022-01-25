import { sendDeviceRequestEmail } from '../helpers/sendDeviceRequestEmail';
import { logError } from '../helpers/logger';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const testEmail = async (req: any, res: any) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) return res.status(400).send('Please provide your email in the url.');

    await sendDeviceRequestEmail(userEmail, 'DEVICE TEST', 'TEST', 'TEST', '123456', new Date());

    // Return res
    return res.status(200).send('An email should have been sent to your email address.');
  } catch (e) {
    logError('testEmail', e);
    res.status(400).send();
  }
};
