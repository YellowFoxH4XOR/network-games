/**
 * Generates a stable device fingerprint using browser characteristics.
 * Uses SubtleCrypto SHA-256 for hashing — available in all modern browsers.
 * Falls back to a localStorage-persisted random ID if crypto fails.
 */
export async function getFingerprint() {
  try {
    // Canvas fingerprint — GPU/font rendering differs per device
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.fillStyle = '#00ff87';
    ctx.fillRect(0, 0, 80, 20);
    ctx.fillStyle = '#020204';
    ctx.fillText('SNS◆FP', 2, 2);
    const canvasHash = canvas.toDataURL().slice(-60);

    const parts = [
      navigator.userAgent,
      navigator.language || '',
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      String(navigator.hardwareConcurrency || 0),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform || '',
      canvasHash,
    ];

    const raw = parts.join('||');
    const encoded = new TextEncoder().encode(raw);
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
    const hex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hex.slice(0, 24);
  } catch {
    // Graceful fallback: persist a random token in localStorage
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
