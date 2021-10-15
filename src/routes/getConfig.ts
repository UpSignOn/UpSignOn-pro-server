import env from '../helpers/env';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getConfig = async (req: any, res: any): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    displayName: env.ORGANISATION_NAME,
  });
};
