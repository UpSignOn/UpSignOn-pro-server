import libsodium from 'libsodium-wrappers';

export const toBase64 = (bytes: Uint8Array): string => {
  return libsodium.to_base64(bytes, libsodium.base64_variants.ORIGINAL);
};
export const fromBase64 = (string: string): Uint8Array => {
  return libsodium.from_base64(string, libsodium.base64_variants.ORIGINAL);
};
