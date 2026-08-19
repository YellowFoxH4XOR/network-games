// Leaderboard aggregation, kept pure so it's unit-testable. The leading
// underscore keeps Vercel from exposing this as a route; it's import-only.

import { GAMES } from './_games.js';

const TOP_N = 10;

// Ties: higher score first; equal scores → earlier submission wins.
function byScoreThenTime(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));
}

/**
 * Build one leaderboard "board" from raw score rows
 * ({ username, stall, game, score, created_at }).
 *
 * Returns top-10 lists per game (rows keep their stall so the UI can label
 * cross-stall views) plus a combined list (sum of a player's games) and the
 * full counts — counts come from ALL rows, not the sliced top-10, so the admin
 * stats are accurate past 10 players.
 */
export function buildBoard(rows) {
  const game = (g) =>
    rows
      .filter((r) => r.game === g)
      .sort(byScoreThenTime)
      .slice(0, TOP_N)
      .map(({ username, score, stall }) => ({ username, score, stall }));

  const totals = {};
  for (const r of rows) {
    totals[r.username] = (totals[r.username] || 0) + r.score;
  }
  const combined = Object.entries(totals)
    .map(([username, score]) => ({ username, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  // One board and one entry count per known game, so adding a game to
  // api/_games.js is all it takes for the console to show it.
  const perGame = {};
  for (const g of GAMES) {
    perGame[g] = game(g);
    perGame[`${g}Entries`] = rows.filter((r) => r.game === g).length;
  }

  return {
    combined,
    ...perGame,
    totalPlayers: Object.keys(totals).length,
  };
}

// One board per scope: 'all' plus one per stall slug.
export function buildBoards(rows, slugs) {
  const boards = { all: buildBoard(rows) };
  for (const slug of slugs) {
    boards[slug] = buildBoard(rows.filter((r) => r.stall === slug));
  }
  return boards;
}
