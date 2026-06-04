import { describe, it, expect } from 'vitest';
import {
  QUIZ_QUESTIONS,
  NETWORK_KEYWORDS,
  STALL_SLUGS,
  stallQuiz,
  stallKeywords,
  quizRound,
  shuffle,
} from './data.js';

describe('quiz question data', () => {
  it('every question has exactly 4 distinct options and a valid correct index', () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4); // no duplicate options
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
    }
  });

  // The original bug: every correct answer was option A, so tapping the top
  // choice won every time. This guards against that authoring habit returning.
  it('the correct answer is NOT always the same option index', () => {
    const indices = new Set(QUIZ_QUESTIONS.map((q) => q.correct));
    expect(indices.size).toBeGreaterThan(1);
  });
});

describe('quizRound', () => {
  it('returns the requested number of questions', () => {
    expect(quizRound('stall-1', 5)).toHaveLength(5);
    expect(quizRound('stall-1', 3)).toHaveLength(3);
  });

  it('keeps `correct` pointing at the right option text after shuffling', () => {
    // For each question we can recover the original by matching option text,
    // and the shuffled `correct` must still select that same text.
    const byText = new Map(
      QUIZ_QUESTIONS.map((q) => [q.question, q.options[q.correct]]),
    );
    for (let i = 0; i < 50; i++) {
      for (const q of quizRound('stall-1', 5)) {
        expect(q.options[q.correct]).toBe(byText.get(q.question));
      }
    }
  });

  // The anti-cheat property: across many rounds the correct option lands in
  // every position, so a fixed-position guess can't beat the quiz.
  it('distributes the correct answer across all four positions over many rounds', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) {
      for (const q of quizRound('stall-2', 5)) seen.add(q.correct);
    }
    expect(seen).toEqual(new Set([0, 1, 2, 3]));
  });
});

describe('per-stall content partitioning', () => {
  it('splits the quiz into disjoint slices that cover every question exactly once', () => {
    const all = STALL_SLUGS.flatMap((s) => stallQuiz(s));
    expect(all).toHaveLength(QUIZ_QUESTIONS.length); // no question dropped or duplicated
    expect(new Set(all).size).toBe(QUIZ_QUESTIONS.length); // each appears once
  });

  it('gives every stall a non-empty quiz pool', () => {
    for (const s of STALL_SLUGS) {
      expect(stallQuiz(s).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('gives each stall a 25-word keyword window drawn from the master list', () => {
    for (const s of STALL_SLUGS) {
      const words = stallKeywords(s);
      expect(words.length).toBeGreaterThan(0);
      expect(words.length).toBeLessThanOrEqual(25);
      for (const w of words) expect(NETWORK_KEYWORDS).toContain(w);
    }
  });

  it('falls back to stall-1 content for an unknown slug', () => {
    expect(stallQuiz('does-not-exist')).toEqual(stallQuiz('stall-1'));
  });
});

describe('shuffle (Fisher–Yates)', () => {
  it('returns a new array with the same elements (nothing lost or added)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect(out).not.toBe(input); // does not mutate the original reference
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate its input', () => {
    const input = ['a', 'b', 'c'];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});
