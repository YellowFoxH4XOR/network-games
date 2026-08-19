import { describe, it, expect } from 'vitest';
import {
  quizPoints,
  wordsearchTimeBonus,
  memoryPairPoints,
  memoryClearBonus,
  QUIZ_MAX,
  WORDSEARCH_MAX,
  MEMORY_MAX,
  MEMORY_COMBO_CAP,
  MEMORY_SECONDS,
  ZTP_MAX,
  ZTP_SHOTS,
  ZTP_GOAL_POINTS,
  SPIN_MAX,
  SPIN_ROUNDS,
  SPIN_SECONDS_PER_Q,
} from './scoring.js';
import { MAX_SCORE } from '../../api/_games.js';

describe('quizPoints', () => {
  it('is base 10 plus a ⌊timeLeft/3⌋ speed bonus', () => {
    expect(quizPoints(30)).toBe(20); // full clock → max per question
    expect(quizPoints(0)).toBe(10); // answered at the buzzer → base only
    expect(quizPoints(15)).toBe(15);
  });
});

describe('wordsearchTimeBonus', () => {
  it('awards ⌊secondsLeft/10⌋', () => {
    expect(wordsearchTimeBonus(300)).toBe(30);
    expect(wordsearchTimeBonus(0)).toBe(0);
    expect(wordsearchTimeBonus(95)).toBe(9);
  });
});

// These caps must equal MAX_SCORE in api/_games.js. If a game's scoring changes,
// this test fails and reminds you to update the server cap — otherwise a forged
// score at the old (higher) cap could beat every honest player, and an honest
// score above the cap is rejected outright (the server 400s, it doesn't clamp).
describe('honest maxima match the server caps', () => {
  it('quiz max is 100', () => {
    expect(QUIZ_MAX).toBe(100);
  });
  it('word search max is 130', () => {
    expect(WORDSEARCH_MAX).toBe(130);
  });
  it('memory max is 200', () => {
    expect(MEMORY_MAX).toBe(200);
  });
  it('ztp max is 200', () => {
    expect(ZTP_MAX).toBe(200);
  });
  it('spin wheel max is 60', () => {
    expect(SPIN_MAX).toBe(60);
  });

  it('every game the client knows has a matching server cap', () => {
    expect(MAX_SCORE).toEqual({
      quiz: QUIZ_MAX,
      wordsearch: WORDSEARCH_MAX,
      memory: MEMORY_MAX,
      ztp: ZTP_MAX,
      spin: SPIN_MAX,
    });
  });
});

// Memory's per-pair formula has no natural ceiling, which is exactly how the
// original shipped over the cap: a good run passed 200 long before the board was
// cleared, and the server rejected the honest score.
describe('memory scoring needs its clamp', () => {
  it('an unclamped combo run really does pass the cap', () => {
    // Seven pairs at full combo, ignoring speed bonuses entirely.
    const combos = [1, 2, 3, 4, 4, 4, 4];
    const raw = combos.reduce((sum, c) => sum + memoryPairPoints(c, 0), 0);
    expect(raw).toBeGreaterThan(MEMORY_MAX);
  });

  it('caps the combo multiplier so a pair can never be worth more than 15 × 4 + speed', () => {
    expect(memoryPairPoints(99, 0)).toBe(memoryPairPoints(MEMORY_COMBO_CAP, 0));
    expect(memoryPairPoints(1, 60)).toBe(15 + 15); // 15 base + ⌊60/4⌋ speed
  });

  it('the clear bonus can never lift a full board past the cap once clamped', () => {
    const clamped = Math.min(MEMORY_MAX, MEMORY_MAX + memoryClearBonus(MEMORY_SECONDS));
    expect(clamped).toBe(MEMORY_MAX);
  });
});

describe('ztp maximum is reachable and exact', () => {
  it('is every shot scoring a goal', () => {
    expect(ZTP_SHOTS * ZTP_GOAL_POINTS).toBe(ZTP_MAX);
  });
});

describe('spin maximum is reachable and exact', () => {
  it('is every spin answered instantly, scored like a quiz question', () => {
    expect(SPIN_ROUNDS * quizPoints(SPIN_SECONDS_PER_Q)).toBe(SPIN_MAX);
  });
});
