import { getFingerprint } from './fingerprint.js';

export async function saveScore(username, stall, game, score) {
  if (!username || !stall) return;
  const u = username.toLowerCase();
  if (u === 'admin') return;
  try {
    // Send the device fingerprint so the server can confirm this score comes
    // from the device that registered the player (see api/score.js).
    const fingerprint = await getFingerprint();
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username: u, stall, game, score, fingerprint }),
    });
    if (!res.ok) {
      // The score is still cached in localStorage; surface the rejection so a
      // silently-dropped server save is visible in the console (don't fail mute).
      console.warn('[saveScore] server rejected score:', res.status);
    }
  } catch {
    // Network error — score already saved to localStorage, fail quietly.
  }
}
