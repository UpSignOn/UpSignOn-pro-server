import bcrypt from 'bcrypt';

const asyncHash = async (accessCode: string): Promise<string> => {
  return await bcrypt.hash(accessCode, 10);
};

const asyncIsOk = async (accessCode: string, accessCodeHash: string): Promise<boolean> => {
  return await bcrypt.compare(accessCode, accessCodeHash);
};

export const accessCodeHash = {
  asyncHash,
  asyncIsOk,
};
