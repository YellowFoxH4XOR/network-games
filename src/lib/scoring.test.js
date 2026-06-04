import { describe, it, expect } from 'vitest';
import {
  quizPoints,
  wordsearchTimeBonus,
  QUIZ_MAX,
  WORDSEARCH_MAX,
} from './scoring.js';

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

// These caps must equal MAX_SCORE in api/score.js. If a game's scoring changes,
// this test fails and reminds you to update the server cap — otherwise a forged
// score at the old (higher) cap could beat every honest player.
describe('honest maxima match the server caps', () => {
  it('quiz max is 100', () => {
    expect(QUIZ_MAX).toBe(100);
  });
  it('word search max is 130', () => {
    expect(WORDSEARCH_MAX).toBe(130);
  });
});
