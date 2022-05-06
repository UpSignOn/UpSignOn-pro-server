export const logInfo = (...m: any[]): void => {
  console.log(new Date().toISOString() + ': ', ...m);
};

export const logError = (...m: any[]): void => {
  console.error(new Date().toISOString() + ': ', ...m);
};
