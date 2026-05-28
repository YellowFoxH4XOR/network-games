const FINGERPRINT_KEY = 'sns_fp';
const LEGACY_FINGERPRINT_KEY = 'sns_fp_legacy';
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

function removeStorage(key) {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Nothing to clean up if storage is unavailable.
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

function rememberLegacyFingerprint(value) {
  if (!value || isModernFingerprint(value)) return;
  writeStorage(LEGACY_FINGERPRINT_KEY, value);
}

/**
 * Returns a per-browser-install identifier.
 *
 * The previous implementation used deterministic hardware signals. Same-model
 * phones on the same network could produce the same value, so `/api/me` could
 * incorrectly restore another player's username. A stored random ID makes the
 * identity unique to this browser install instead.
 */
export async function getFingerprint() {
  const stored = readStorage(FINGERPRINT_KEY);
  if (isModernFingerprint(stored)) return stored;

  rememberLegacyFingerprint(stored);

  const fingerprint = `${MODERN_PREFIX}${toHex(randomBytes(16))}`;
  writeStorage(FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}

export function getLegacyFingerprint() {
  const stored = readStorage(FINGERPRINT_KEY);
  if (stored && !isModernFingerprint(stored)) return stored;
  return readStorage(LEGACY_FINGERPRINT_KEY);
}

export function clearLegacyFingerprint() {
  removeStorage(LEGACY_FINGERPRINT_KEY);
}
