// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const getConfig = async (req: any, res: any): Promise<void> => {
  return res.status(200).json({
    // TODO
    displayName: 'MonPtitShop',
  });
};
