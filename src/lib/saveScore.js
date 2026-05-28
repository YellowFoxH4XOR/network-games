export async function saveScore(username, game, score) {
  if (!username) return;
  const u = username.toLowerCase();
  if (u === 'admin') return;
  try {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username: u, game, score }),
    });
  } catch {
    // Score already saved to localStorage — fail silently
  }
}
