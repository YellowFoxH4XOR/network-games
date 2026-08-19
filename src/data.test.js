import { describe, it, expect } from 'vitest';
import {
  QUIZ_QUESTIONS,
  NETWORK_KEYWORDS,
  STALL_SLUGS,
  stallQuiz,
  stallKeywords,
  quizRound,
  shuffle,
  SPIN_TOPICS,
  spinQuestion,
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

describe('spin wheel topics', () => {
  it('has 8 topics, each pool drawn from the main question bank', () => {
    expect(SPIN_TOPICS).toHaveLength(8);
    for (const t of SPIN_TOPICS) {
      expect(t.label).toBeTruthy();
      expect(t.questions.length).toBeGreaterThan(0);
      for (const q of t.questions) {
        expect(QUIZ_QUESTIONS).toContain(q);
      }
    }
  });

  it('spinQuestion serves a question from the landed topic with options intact', () => {
    for (let t = 0; t < SPIN_TOPICS.length; t++) {
      const q = spinQuestion(t);
      const src = SPIN_TOPICS[t].questions.find(s => s.question === q.question);
      expect(src, 'question should come from the topic pool').toBeTruthy();
      // Options are shuffled but must be the same set, with `correct` remapped.
      expect([...q.options].sort()).toEqual([...src.options].sort());
      expect(q.options[q.correct]).toBe(src.options[src.correct]);
    }
  });

  it('spinQuestion skips excluded questions until the pool is exhausted', () => {
    const pool = SPIN_TOPICS[0].questions;
    const allButOne = pool.slice(1).map(q => q.question);
    for (let i = 0; i < 20; i++) {
      expect(spinQuestion(0, allButOne).question).toBe(pool[0].question);
    }
    // Fully exhausted → falls back to the whole pool rather than crashing.
    const all = pool.map(q => q.question);
    expect(pool.map(q => q.question)).toContain(spinQuestion(0, all).question);
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
