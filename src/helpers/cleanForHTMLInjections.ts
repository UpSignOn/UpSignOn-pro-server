export function cleanForHTMLInjections(unsafeInput: string) {
  return unsafeInput?.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
