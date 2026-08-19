import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SpinWheel from './SpinWheel.jsx';
import { SPIN_TOPICS } from '../data.js';

const STALL = { slug: 'stall-1', name: 'Stall 1' };

// Math.random → 0 makes every spin land on topic 0 (Switches) and pick that
// pool's first question; fake timers drive the wheel animation and countdown.
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// The component shuffles option order, so recover the question on screen by
// matching its text against the topic pool — then read options off that object.
function shownQuestion() {
  const q = SPIN_TOPICS[0].questions.find((item) => screen.queryByText(item.question));
  expect(q, 'a Switches question should be on screen').toBeTruthy();
  return q;
}

describe('SpinWheel', () => {
  it('spins, lands on a topic, and serves one question from it', () => {
    render(<SpinWheel username="tester" stall={STALL} onBack={() => {}} />);
    fireEvent.click(screen.getByText(/SPIN THE WHEEL/));
    expect(screen.getByText(/SPINNING/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3700));
    // Wheel gone, a Switches question with its topic chip on screen.
    expect(screen.getByText(/◈ SWITCHES/)).toBeInTheDocument();
    shownQuestion();
  });

  it('scores a correct answer like a quiz question (10 + speed bonus)', () => {
    render(<SpinWheel username="tester" stall={STALL} onBack={() => {}} />);
    fireEvent.click(screen.getByText(/SPIN THE WHEEL/));
    act(() => vi.advanceTimersByTime(3700));
    const q = shownQuestion();
    fireEvent.click(screen.getByText(q.options[q.correct]));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('+20 pts')).toBeInTheDocument(); // full clock
  });

  it('awards nothing for a wrong answer', () => {
    render(<SpinWheel username="tester" stall={STALL} onBack={() => {}} />);
    fireEvent.click(screen.getByText(/SPIN THE WHEEL/));
    act(() => vi.advanceTimersByTime(3700));
    const q = shownQuestion();
    const wrong = q.options.find((_, i) => i !== q.correct);
    fireEvent.click(screen.getByText(wrong));
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+ pts/)).not.toBeInTheDocument();
  });

  it('returns to the wheel for the next spin after feedback', () => {
    render(<SpinWheel username="tester" stall={STALL} onBack={() => {}} />);
    fireEvent.click(screen.getByText(/SPIN THE WHEEL/));
    act(() => vi.advanceTimersByTime(3700));
    const q = shownQuestion();
    fireEvent.click(screen.getByText(q.options[q.correct]));
    act(() => vi.advanceTimersByTime(1900));
    expect(screen.getByText(/SPIN 2 OF 3/)).toBeInTheDocument();
    expect(screen.getByText(/SPIN THE WHEEL/)).toBeInTheDocument();
  });

  it('shows the "already completed" screen when a score is cached for this stall', () => {
    localStorage.setItem(
      'sns_tester_stall-1_spin',
      JSON.stringify({ score: 64, answers: [], playedAt: 1 }),
    );
    render(<SpinWheel username="tester" stall={STALL} onBack={() => {}} />);
    expect(screen.getByText('Already Completed')).toBeInTheDocument();
    expect(screen.getByText('64')).toBeInTheDocument();
  });

  it('does not crash on a corrupt cached value (guards readJSON)', () => {
    localStorage.setItem('sns_tester_stall-1_spin', '{not valid json');
    expect(() =>
      render(<SpinWheel username="tester" stall={STALL} onBack={() => {}} />),
    ).not.toThrow();
    expect(screen.queryByText('Already Completed')).not.toBeInTheDocument();
  });
});
