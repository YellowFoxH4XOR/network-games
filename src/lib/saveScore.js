export async function saveScore(username, stall, game, score) {
  if (!username || !stall) return;
  const u = username.toLowerCase();
  if (u === 'admin') return;
  try {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username: u, stall, game, score }),
    });
  } catch {
    // Score already saved to localStorage — fail silently
  }
}
