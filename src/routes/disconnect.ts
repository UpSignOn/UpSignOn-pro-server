// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const disconnect = async (req: any, res: any) => {
  try {
    await req.session.destroy();
  } catch (e) {
    console.error('Disconnect error', e);
  }
  res.status(204).end();
};
