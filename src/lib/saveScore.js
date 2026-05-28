export async function saveScore(email, game, score) {
  if (!email || email === 'admin@snsdays.com') return;
  try {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, game, score }),
    });
  } catch {
    // Score already saved to localStorage — fail silently
  }
}
