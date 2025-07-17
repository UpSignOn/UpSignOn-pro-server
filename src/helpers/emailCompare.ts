export function isEmailEquivalentTo(emailA: string, emailB: string): boolean {
  const normalizedEmailA = emailA.trim().toLowerCase();
  const normalizedEmailB = emailB.trim().toLowerCase();

  if (normalizedEmailA == normalizedEmailB) {
    return true;
  }

  const baseEmailA = _removeEmailExtension(normalizedEmailA);
  const baseEmailB = _removeEmailExtension(normalizedEmailB);

  return baseEmailA == baseEmailB;
}

function _removeEmailExtension(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex == -1) return email;

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex);

  const plusIndex = localPart.indexOf('+');
  if (plusIndex == -1) return email;

  const baseLocalPart = localPart.substring(0, plusIndex);
  return baseLocalPart + domain;
}
