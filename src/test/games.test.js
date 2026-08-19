import { describe, it, expect } from 'vitest';
import { GAMES, STALL_GAMES as SERVER_STALL_GAMES, stallRunsGame } from '../../api/_games.js';
import { STALL_GAMES, STALL_SLUGS, stallGames, GAME_KEY_SUFFIX, gameStorageKey } from '../data.js';

// The client decides which games a stall shows; the server decides which games a
// stall may post. If the two lists drift, players either see a game whose score
// is rejected, or a game they were never offered starts counting.
describe('client and server agree on each stall’s line-up', () => {
  it('the two STALL_GAMES maps are identical', () => {
    expect(SERVER_STALL_GAMES).toEqual(STALL_GAMES);
  });

  it('every configured stall slug has a line-up', () => {
    for (const slug of STALL_SLUGS) {
      expect(STALL_GAMES[slug], `${slug} has no games`).toBeTruthy();
      expect(STALL_GAMES[slug].length).toBeGreaterThan(0);
    }
  });

  it('every game named in a line-up is one the server knows', () => {
    for (const games of Object.values(STALL_GAMES)) {
      for (const game of games) expect(GAMES).toContain(game);
    }
  });

  it('every known game has a storage suffix, so no result is written to `undefined`', () => {
    for (const game of GAMES) expect(GAME_KEY_SUFFIX[game]).toBeTruthy();
  });
});

describe('stallRunsGame', () => {
  it('accepts a game the stall offers', () => {
    expect(stallRunsGame('stall-3', 'memory')).toBe(true);
    expect(stallRunsGame('stall-2', 'quiz')).toBe(true);
    expect(stallRunsGame('stall-1', 'spin')).toBe(true);
  });

  it('rejects a game the stall does not offer, which is the forged-score path', () => {
    // A stall-1 player posting the stall-3 games would add 400 points that no
    // honest player at their booth can earn.
    expect(stallRunsGame('stall-1', 'memory')).toBe(false);
    expect(stallRunsGame('stall-1', 'ztp')).toBe(false);
    expect(stallRunsGame('stall-1', 'quiz')).toBe(false);
    expect(stallRunsGame('stall-3', 'quiz')).toBe(false);
    expect(stallRunsGame('stall-2', 'spin')).toBe(false);
  });

  it('lets a stall added to the DB later still score, rather than locking it out', () => {
    expect(stallRunsGame('stall-9', 'quiz')).toBe(true);
    expect(stallRunsGame('stall-9', 'not-a-game')).toBe(false);
  });
});

describe('stallGames', () => {
  it('returns the configured line-up', () => {
    expect(stallGames('stall-1')).toEqual(['spin']);
    expect(stallGames('stall-2')).toEqual(['quiz', 'wordsearch']);
    expect(stallGames('stall-3')).toEqual(['memory', 'ztp']);
  });

  it('gives every stall a line-up no other stall runs', () => {
    // Each booth is meant to feel distinct; overlapping line-ups would also let
    // one player bank the same game twice by walking to another stall.
    const all = Object.values(STALL_GAMES).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('falls back to stall-1’s line-up for an unknown slug', () => {
    expect(stallGames('nope')).toEqual(STALL_GAMES['stall-1']);
  });
});

describe('gameStorageKey', () => {
  it('builds the key each game caches its result under', () => {
    expect(gameStorageKey('akki', 'stall-3', 'memory')).toBe('sns_akki_stall-3_memory');
    expect(gameStorageKey('akki', 'stall-3', 'ztp')).toBe('sns_akki_stall-3_ztp');
  });

  it('keeps word search on its historical `_ws` suffix', () => {
    // Renaming this would orphan every score already cached on a player's device.
    expect(gameStorageKey('akki', 'stall-1', 'wordsearch')).toBe('sns_akki_stall-1_ws');
  });
});
