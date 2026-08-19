import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MemoryMatch from './MemoryMatch.jsx';
import { MEMORY_MAX } from '../lib/scoring.js';

const STALL = { slug: 'stall-3', name: 'Stall 3' };
const KEY = 'sns_tester_stall-3_memory';

const saved = vi.hoisted(() => vi.fn());
vi.mock('../lib/saveScore.js', () => ({ saveScore: saved }));

beforeEach(() => {
  vi.useFakeTimers();
  saved.mockClear();
});
afterEach(() => vi.useRealTimers());

// The board renders 16 cards as plain divs; grab them by their fixed aspect
// ratio, the same way a player picks them out visually.
function cardEls(container) {
  return [...container.querySelectorAll('div')].filter(
    (d) => d.style.aspectRatio === '1' || d.style.aspectRatio === '1 / 1',
  );
}

// Reveals every card's identity by probing them two at a time, then returns a
// map of card index → name. Probing costs game time (mismatches stay up 900ms)
// but no points, which is exactly how a strong player learns the board.
function learnDeck(container) {
  const names = [];
  const live = cardEls(container);
  for (let i = 0; i < live.length; i += 2) {
    fireEvent.click(live[i]);
    fireEvent.click(live[i + 1]);
    names[i] = live[i].textContent;
    names[i + 1] = live[i + 1].textContent;
    act(() => vi.advanceTimersByTime(1000));
  }
  return names;
}

describe('MemoryMatch scoring', () => {
  it('never saves a score above the server cap, even when the clock runs out', () => {
    // Regression: the cap used to be applied only on the cleared-board path, so
    // a strong run that ran out of time saved 200+ and the server rejected it
    // outright — the score vanished and the one-attempt gate stayed locked.
    //
    // This reproduces that run: learn the board, then match all but the last
    // pair at full combo (15 × 4 per pair) and let the timer expire. The base
    // points alone are far past the cap.
    const { container } = render(<MemoryMatch username="tester" stall={STALL} onBack={() => {}} />);
    const names = learnDeck(container);

    const byName = new Map();
    names.forEach((name, idx) => {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(idx);
    });
    const pairs = [...byName.values()].filter((idxs) => idxs.length === 2);
    expect(pairs.length).toBeGreaterThanOrEqual(7);

    // Every pair but one — leaving the board uncleared so the game can only end
    // on the timer.
    for (const [a, b] of pairs.slice(0, -1)) {
      const live = cardEls(container);
      fireEvent.click(live[a]);
      fireEvent.click(live[b]);
    }
    act(() => vi.advanceTimersByTime(70_000));

    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    expect(stored, 'a finished game must persist a result').toBeTruthy();
    expect(stored.pairs).toBeLessThan(8); // the board really was left uncleared
    expect(stored.score).toBeLessThanOrEqual(MEMORY_MAX);

    expect(saved).toHaveBeenCalledTimes(1);
    const [, , game, score] = saved.mock.calls[0];
    expect(game).toBe('memory');
    expect(score).toBeLessThanOrEqual(MEMORY_MAX);
    expect(score).toBeGreaterThan(0);
  });

  it('saves a cleared board exactly once, at the cap or below', () => {
    const { container } = render(<MemoryMatch username="tester" stall={STALL} onBack={() => {}} />);
    const names = learnDeck(container);

    const byName = new Map();
    names.forEach((name, idx) => {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(idx);
    });
    for (const [a, b] of [...byName.values()].filter((i) => i.length === 2)) {
      const live = cardEls(container);
      fireEvent.click(live[a]);
      fireEvent.click(live[b]);
    }
    // The win persists immediately; the 500ms delay is only the screen change.
    expect(saved).toHaveBeenCalledTimes(1);
    expect(saved.mock.calls[0][3]).toBeLessThanOrEqual(MEMORY_MAX);

    act(() => vi.advanceTimersByTime(70_000));
    expect(saved).toHaveBeenCalledTimes(1); // the expiring timer must not re-save
  });

  it('keeps a won game when the player leaves during the result animation', () => {
    // Regression: the win was only persisted after a 500ms transition timer, so
    // navigating away inside that window discarded a finished game — the score
    // was lost and the one-attempt gate re-opened.
    const { container, unmount } = render(<MemoryMatch username="tester" stall={STALL} onBack={() => {}} />);
    const names = learnDeck(container);

    const byName = new Map();
    names.forEach((name, idx) => {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(idx);
    });
    for (const [a, b] of [...byName.values()].filter((i) => i.length === 2)) {
      const live = cardEls(container);
      fireEvent.click(live[a]);
      fireEvent.click(live[b]);
    }
    unmount(); // straight away, inside the 500ms window

    expect(localStorage.getItem(KEY), 'a won game must already be persisted').toBeTruthy();
    expect(saved).toHaveBeenCalledTimes(1);
  });

  it('saves once when the clock runs out, under the cap', () => {
    render(<MemoryMatch username="tester" stall={STALL} onBack={() => {}} />);
    act(() => vi.advanceTimersByTime(61_000));
    expect(saved).toHaveBeenCalledTimes(1);
    const [, , game, score] = saved.mock.calls[0];
    expect(game).toBe('memory');
    expect(score).toBe(0); // nothing matched
    expect(JSON.parse(localStorage.getItem(KEY)).score).toBe(0);
  });

  it('shows the "already completed" screen when a score is cached for this stall', () => {
    localStorage.setItem(KEY, JSON.stringify({ score: 180, pairs: 8, playedAt: 1 }));
    render(<MemoryMatch username="tester" stall={STALL} onBack={() => {}} />);
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(saved).not.toHaveBeenCalled();
  });

  it('does not crash on a corrupt cached value (guards readJSON)', () => {
    localStorage.setItem(KEY, '{not valid json');
    expect(() =>
      render(<MemoryMatch username="tester" stall={STALL} onBack={() => {}} />),
    ).not.toThrow();
  });

  it('leaving mid-game fires no state update from a pending flip timer', () => {
    const errors = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a));
    const { container, unmount } = render(<MemoryMatch username="tester" stall={STALL} onBack={() => {}} />);
    const els = cardEls(container);
    fireEvent.click(els[0]);
    fireEvent.click(els[1]); // may be a mismatch → schedules the 900ms reset
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(errors).toHaveLength(0);
    spy.mockRestore();
  });
});
