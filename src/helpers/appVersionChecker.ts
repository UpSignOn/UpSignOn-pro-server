export const isStrictlyLowerVersion = (a: string | null, thanB: string): boolean => {
  if (!a) return false;
  const aV = a.split('.').map((n) => parseInt(n));
  if (aV[1] == null) aV[1] = 0;
  if (aV[2] == null) aV[2] = 0;
  const bV = thanB.split('.').map((n) => parseInt(n));

  if (aV[0] > bV[0]) return false;
  if (aV[0] < bV[0]) return true;
  if (aV[0] === bV[0]) {
    if (bV[1] == null) return false;
    if (aV[1] > bV[1]) return false;
    if (aV[1] < bV[1]) return true;
    if (aV[1] === bV[1]) {
      if (bV[2] == null) return false;
      if (aV[2] >= bV[2]) return false;
      if (aV[2] < bV[2]) return true;
    }
  }
  // unreachable
  return true;
};
