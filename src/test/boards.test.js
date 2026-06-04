import { describe, it, expect } from 'vitest';
import { buildBoard, buildBoards } from '../../api/_boards.js';

const row = (username, stall, game, score, created_at = '2026-06-04T10:00:00Z') =>
  ({ username, stall, game, score, created_at });

describe('buildBoard', () => {
  it('sorts each game by score desc, breaking ties by earliest submission', () => {
    const rows = [
      row('late',  'stall-1', 'quiz', 50, '2026-06-04T12:00:00Z'),
      row('early', 'stall-1', 'quiz', 50, '2026-06-04T09:00:00Z'),
      row('top',   'stall-1', 'quiz', 90),
    ];
    const b = buildBoard(rows);
    expect(b.quiz.map((r) => r.username)).toEqual(['top', 'early', 'late']);
  });

  it('combined sums a player’s games together', () => {
    const rows = [
      row('akki', 'stall-1', 'quiz', 40),
      row('akki', 'stall-1', 'wordsearch', 60),
      row('bob',  'stall-1', 'quiz', 70),
    ];
    const b = buildBoard(rows);
    expect(b.combined[0]).toEqual({ username: 'akki', score: 100 });
    expect(b.combined[1]).toEqual({ username: 'bob', score: 70 });
  });

  it('caps lists at 10 but reports counts from ALL rows (stats stay accurate past 10)', () => {
    const rows = Array.from({ length: 15 }, (_, i) => row(`p${i}`, 'stall-1', 'quiz', i));
    const b = buildBoard(rows);
    expect(b.quiz).toHaveLength(10);
    expect(b.quizEntries).toBe(15);
    expect(b.totalPlayers).toBe(15);
  });

  it('keeps the stall on game rows so cross-stall views can label them', () => {
    const b = buildBoard([row('akki', 'stall-2', 'quiz', 10)]);
    expect(b.quiz[0].stall).toBe('stall-2');
  });
});

describe('buildBoards', () => {
  it('scopes per-stall boards to that stall’s rows only', () => {
    const rows = [
      row('akki', 'stall-1', 'quiz', 40),
      row('bob',  'stall-2', 'quiz', 90),
    ];
    const boards = buildBoards(rows, ['stall-1', 'stall-2']);
    expect(boards.all.quizEntries).toBe(2);
    expect(boards['stall-1'].quiz.map((r) => r.username)).toEqual(['akki']);
    expect(boards['stall-2'].quiz.map((r) => r.username)).toEqual(['bob']);
  });

  it('a player who plays multiple stalls is summed across them in "all" only', () => {
    const rows = [
      row('akki', 'stall-1', 'quiz', 40),
      row('akki', 'stall-2', 'quiz', 50),
    ];
    const boards = buildBoards(rows, ['stall-1', 'stall-2']);
    expect(boards.all.combined[0]).toEqual({ username: 'akki', score: 90 });
    expect(boards['stall-1'].combined[0]).toEqual({ username: 'akki', score: 40 });
  });
});
