export const isExpired = (expirationDate: Date): boolean =>
  expirationDate.getTime() < new Date().getTime();

export const getExpirationDate = (): string => {
  const expDuration = 10 * 60 * 1000; // 10 minutes
  const expDate: number = Date.now() + expDuration;
  const res = new Date();
  res.setTime(expDate);
  return res.toISOString();
};

export const extractTime = (date: string): string => {
  const dateObject = new Date(date);
  return `${dateObject.getHours()}:${dateObject.getMinutes()}`;
};
