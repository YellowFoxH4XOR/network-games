import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Quiz from './Quiz.jsx';
import { QUIZ_QUESTIONS } from '../data.js';

const STALL = { slug: 'stall-1', name: 'Stall 1' };

// Fake timers freeze the 30s countdown at 30, so the speed bonus is deterministic
// (quizPoints(30) === 20) and the feedback auto-advance doesn't fire mid-assert.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// The component shuffles question + option order, so we recover the exact
// question on screen by matching its (unique) question text against the source
// data — then read its correct/wrong options from that same object.
function shownQuestion() {
  const q = QUIZ_QUESTIONS.find((item) => screen.queryByText(item.question));
  expect(q, 'a known question should be on screen').toBeTruthy();
  return q;
}

describe('Quiz scoring', () => {
  it('awards 10 + ⌊timeLeft/3⌋ for a correct answer (20 with a full clock)', () => {
    render(<Quiz username="tester" stall={STALL} onBack={() => {}} />);
    const q = shownQuestion();
    fireEvent.click(screen.getByText(q.options[q.correct]));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('+20 pts')).toBeInTheDocument();
  });

  it('awards nothing for a wrong answer', () => {
    render(<Quiz username="tester" stall={STALL} onBack={() => {}} />);
    const q = shownQuestion();
    const wrong = q.options.find((_, i) => i !== q.correct);
    fireEvent.click(screen.getByText(wrong));
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+ pts/)).not.toBeInTheDocument();
  });

  it('shows the "already completed" screen when a score is cached for this stall', () => {
    localStorage.setItem(
      'sns_tester_stall-1_quiz',
      JSON.stringify({ score: 42, answers: [], playedAt: 1 }),
    );
    render(<Quiz username="tester" stall={STALL} onBack={() => {}} />);
    expect(screen.getByText('Already Completed')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('does not crash on a corrupt cached value (guards readJSON)', () => {
    localStorage.setItem('sns_tester_stall-1_quiz', '{not valid json');
    expect(() =>
      render(<Quiz username="tester" stall={STALL} onBack={() => {}} />),
    ).not.toThrow();
    // Falls through to a playable round rather than the "already completed" screen.
    expect(screen.queryByText('Already Completed')).not.toBeInTheDocument();
  });
});
