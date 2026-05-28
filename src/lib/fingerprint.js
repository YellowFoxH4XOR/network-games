const FINGERPRINT_KEY = 'sns_fp';
const MODERN_PREFIX = 'fp2_';

function readStorage(key) {
  try {
    return globalThis.localStorage?.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorage(key, value) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Some private browsing modes reject localStorage writes.
  }
}

function toHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomBytes(size) {
  const bytes = new Uint8Array(size);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function isModernFingerprint(value) {
  return typeof value === 'string' && value.startsWith(MODERN_PREFIX);
}

/**
 * Returns a per-browser-install identifier.
 *
 * A random ID stored in localStorage — NOT derived from hardware. Two identical
 * devices (e.g. two iPhone 14s) on the same network each get their own value,
 * because each browser install has its own localStorage. Any non-modern value
 * left over from an earlier build is discarded and replaced.
 */
export async function getFingerprint() {
  const stored = readStorage(FINGERPRINT_KEY);
  if (isModernFingerprint(stored)) return stored;

  const fingerprint = `${MODERN_PREFIX}${toHex(randomBytes(16))}`;
  writeStorage(FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}
