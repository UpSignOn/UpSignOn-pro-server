import { sendDeviceRequestEmail } from '../helpers/sendDeviceRequestEmail';
import env from '../helpers/env';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const testEmail = async (req: any, res: any) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) return res.status(400).send('Please provide your email in the url.');

    sendDeviceRequestEmail(
      userEmail,
      'DEVICE TEST',
      'TEST',
      'TEST',
      env.API_PUBLIC_HOSTNAME,
      'ID',
      'CODE',
      true,
    );

    // Return res
    return res.status(204).send('An email should have been sent to your email address.');
  } catch (e) {
    console.error('testEmail', e);
    res.status(400).end();
  }
};
