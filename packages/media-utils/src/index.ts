export function buildSignedUrl(storageKey: string) {
  return `https://storage.local/${encodeURIComponent(storageKey)}`;
}
