// Which games each stall runs, and the honest ceiling for each game. Mirrors
// STALL_GAMES in src/data.js — keep the two in sync (src/test/games.test.js
// asserts they match, along with the caps in src/lib/scoring.js).
//
// The leading underscore keeps Vercel from exposing this as a route.

// Honest maxima: quiz = 5 × (10 + ⌊30/3⌋) = 100; wordsearch = 10×10 + ⌊300/10⌋ = 130;
// memory = clamped in-game to 200; ztp = 5 shots × 40 = 200.
// Capping at the real ceiling stops a forged score from out-ranking honest play.
export const MAX_SCORE = { quiz: 100, wordsearch: 130, memory: 200, ztp: 200 };

export const GAMES = Object.keys(MAX_SCORE);

export const STALL_GAMES = {
  'stall-1': ['quiz', 'wordsearch'],
  'stall-2': ['quiz', 'wordsearch'],
  'stall-3': ['memory', 'ztp'],
};

// True when `game` is one this stall actually runs.
//
// Without this, the game list alone is the only gate, so a stall-1 player could
// post memory + ztp scores their booth never offers and add 400 points no
// honest player there can earn. Stalls the client doesn't know about (added to
// the DB later) accept any known game rather than being locked out entirely —
// a new booth stops scoring the moment this map goes stale otherwise.
export function stallRunsGame(stall, game) {
  const games = STALL_GAMES[stall];
  return games ? games.includes(game) : GAMES.includes(game);
}
