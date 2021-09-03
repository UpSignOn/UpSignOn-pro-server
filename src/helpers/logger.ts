export const logInfo = (...m: any[]): void => {
  console.log(new Date().toISOString().split('.')[0] + ': ', ...m);
};

export const logError = (...m: any[]): void => {
  console.error(new Date().toISOString().split('.')[0] + ': ', ...m);
};
