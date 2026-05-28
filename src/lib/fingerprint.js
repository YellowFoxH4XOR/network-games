/**
 * Generates a device fingerprint that is stable ACROSS BROWSERS on the same
 * physical device. We deliberately avoid:
 *   - navigator.userAgent  (literally different per browser)
 *   - canvas / WebGL hash  (different font stack + GL driver per browser)
 *   - navigator.language   (can differ across browsers)
 *
 * Inputs are hardware-level signals that are identical regardless of which
 * browser the user opens us in. This is critical for the "one device = one
 * play" guarantee: switching from Safari to Chrome must produce the SAME hash.
 *
 * Tradeoff: two phones of the same model in the same timezone produce
 * identical fingerprints. We rely on the UNIQUE(ip) DB constraint and the
 * fingerprint UNIQUE constraint to catch the realistic cases.
 */
export async function getFingerprint() {
  try {
    const parts = [
      // Screen — stable per physical device
      `${screen.width}x${screen.height}`,
      `${screen.availWidth}x${screen.availHeight}`,
      String(screen.colorDepth || 0),
      String(screen.pixelDepth || 0),
      String(window.devicePixelRatio || 1),

      // Hardware capabilities
      String(navigator.hardwareConcurrency || 0),
      String(navigator.deviceMemory || 0),
      String(navigator.maxTouchPoints || 0),

      // Locale (timezone is stable per device unless user travels)
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',

      // Platform (deprecated but stable per OS install)
      navigator.platform || '',

      // OS-level data when available (UA Client Hints API)
      navigator.userAgentData?.platform || '',
      String(navigator.userAgentData?.mobile ?? ''),
    ];

    const raw = parts.join('||');
    const encoded = new TextEncoder().encode(raw);
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
    const hex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hex.slice(0, 24);
  } catch {
    // Fallback: random per-install token (defeats cross-browser stability,
    // but only triggers if SubtleCrypto fails — very rare)
    const key = 'sns_device_fp';
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const fallback = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(key, fallback);
    return fallback;
  }
}
