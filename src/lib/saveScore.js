export async function saveScore(username, game, score) {
  if (!username || username === 'admin') return;
  try {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, game, score }),
    });
  } catch {
    // Score already saved to localStorage — fail silently
  }
}
