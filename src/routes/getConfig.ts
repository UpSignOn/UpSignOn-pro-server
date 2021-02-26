import env from '../helpers/env';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getConfig = async (req: any, res: any): Promise<void> => {
  return res.status(200).json({
    displayName: env.DISPLAY_NAME_IN_APP,
  });
};
