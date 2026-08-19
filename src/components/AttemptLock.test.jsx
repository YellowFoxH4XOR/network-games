import { StrictMode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import Quiz from './Quiz.jsx';
import WordSearch from './WordSearch.jsx';
import SpinWheel from './SpinWheel.jsx';
import { QUIZ_QUESTIONS } from '../data.js';

// Walking out of a game used to leave nothing behind, so the landing page
// offered a fresh board and a player could restart until they liked their score.
// Starting a game now claims the one attempt, and leaving finalises it.

const saved = vi.hoisted(() => vi.fn());
vi.mock('../lib/saveScore.js', () => ({ saveScore: saved }));

beforeEach(() => {
  vi.useFakeTimers();
  saved.mockClear();
});
afterEach(() => vi.useRealTimers());

const stallFor = (slug) => ({ slug, name: slug });

// The sticky TopBar's back control — the first button on the screen. Matching on
// the word alone would also hit the "Back to Dashboard" button on result screens.
const topBarBack = () => within(document.body).getAllByRole('button')[0];

describe('an attempt is claimed as soon as a game starts', () => {
  it.each([
    ['quiz', Quiz, 'stall-2', 'sns_p_stall-2_quiz'],
    ['wordsearch', WordSearch, 'stall-2', 'sns_p_stall-2_ws'],
    ['spin', SpinWheel, 'stall-1', 'sns_p_stall-1_spin'],
  ])('%s writes its cache key on the first render', (_name, Game, slug, key) => {
    expect(localStorage.getItem(key)).toBeNull();
    render(<Game username="p" stall={stallFor(slug)} onBack={() => {}} />);
    // Present immediately: a reload mid-game must not hand back a fresh board.
    expect(localStorage.getItem(key)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(key)).inProgress).toBe(true);
  });

  it.each([
    ['quiz', Quiz, 'stall-2', 'sns_p_stall-2_quiz'],
    ['wordsearch', WordSearch, 'stall-2', 'sns_p_stall-2_ws'],
    ['spin', SpinWheel, 'stall-1', 'sns_p_stall-1_spin'],
  ])('%s re-opens as already played, not as a new round', (_name, Game, slug, key) => {
    const first = render(<Game username="p" stall={stallFor(slug)} onBack={() => {}} />);
    first.unmount(); // the player walks out mid-game

    const stored = JSON.parse(localStorage.getItem(key));
    expect(stored.abandoned, 'leaving should finalise the attempt').toBe(true);

    render(<Game username="p" stall={stallFor(slug)} onBack={() => {}} />);
    expect(screen.getAllByText(/Already Completed/i).length).toBeGreaterThan(0);
  });
});

describe('an abandoned run keeps the points already earned', () => {
  it('banks the score from questions answered before leaving', () => {
    const { unmount } = render(<Quiz username="p" stall={stallFor('stall-2')} onBack={() => {}} />);

    // Answer the first question correctly, on a full clock: 10 + ⌊30/3⌋ = 20.
    const q = QUIZ_QUESTIONS.find((item) => screen.queryByText(item.question));
    fireEvent.click(screen.getByText(q.options[q.correct]));
    expect(screen.getByText('+20 pts')).toBeInTheDocument();

    unmount(); // leaves with four questions unanswered

    const stored = JSON.parse(localStorage.getItem('sns_p_stall-2_quiz'));
    expect(stored.score).toBe(20);
    expect(stored.abandoned).toBe(true);
    expect(saved).toHaveBeenCalledWith('p', 'stall-2', 'quiz', 20);
  });

  it('finishing normally records the real result, not an abandoned one', () => {
    render(<Quiz username="p" stall={stallFor('stall-2')} onBack={() => {}} />);
    for (let i = 0; i < 5; i++) {
      const q = QUIZ_QUESTIONS.find((item) => screen.queryByText(item.question));
      fireEvent.click(screen.getByText(q.options[q.correct]));
      act(() => vi.advanceTimersByTime(2000));
    }
    const stored = JSON.parse(localStorage.getItem('sns_p_stall-2_quiz'));
    expect(stored.score).toBe(100);      // five correct on a full clock
    expect(stored.abandoned).toBeUndefined();
    expect(stored.answers).toHaveLength(5);
    expect(saved).toHaveBeenCalledTimes(1);
  });
});

// The app mounts under StrictMode, which in development mounts, tears down and
// remounts every component. That simulated teardown runs the same cleanup as a
// real one, so anything one-shot in there fires before the player has done
// anything — this is exactly how the first version of the lock banked 0 points
// for a player who had already scored.
describe('under StrictMode, as the app actually runs', () => {
  it('still banks the real score rather than the pre-play 0', () => {
    const { unmount } = render(
      <Quiz username="p" stall={stallFor('stall-2')} onBack={() => {}} />,
      { wrapper: StrictMode },
    );

    const q = QUIZ_QUESTIONS.find((item) => screen.queryByText(item.question));
    fireEvent.click(screen.getByText(q.options[q.correct]));
    unmount();

    const stored = JSON.parse(localStorage.getItem('sns_p_stall-2_quiz'));
    expect(stored.score, 'the simulated teardown must not consume the save').toBe(20);
  });

  it('claims the attempt exactly as it does outside StrictMode', () => {
    render(
      <Quiz username="p" stall={stallFor('stall-2')} onBack={() => {}} />,
      { wrapper: StrictMode },
    );
    expect(localStorage.getItem('sns_p_stall-2_quiz')).toBeTruthy();
  });
});

describe('leaving a game in progress asks first', () => {
  it('does not navigate away on the first Back press', () => {
    const onBack = vi.fn();
    render(<Quiz username="p" stall={stallFor('stall-2')} onBack={onBack} />);
    fireEvent.click(topBarBack());
    expect(onBack).not.toHaveBeenCalled();
    expect(screen.getByText('Leave this challenge?')).toBeInTheDocument();
  });

  it('stays put when the player chooses to keep playing', () => {
    const onBack = vi.fn();
    render(<Quiz username="p" stall={stallFor('stall-2')} onBack={onBack} />);
    fireEvent.click(topBarBack());
    fireEvent.click(screen.getByText('Keep playing'));
    expect(onBack).not.toHaveBeenCalled();
    expect(screen.queryByText('Leave this challenge?')).not.toBeInTheDocument();
  });

  it('leaves once the player confirms', () => {
    const onBack = vi.fn();
    render(<Quiz username="p" stall={stallFor('stall-2')} onBack={onBack} />);
    fireEvent.click(topBarBack());
    fireEvent.click(screen.getByText('Leave'));
    expect(onBack).toHaveBeenCalled();
  });

  it('banks the score before navigating, so the dashboard shows it right away', () => {
    // The dashboard reads the stored result as it renders, and React runs an
    // unmount cleanup only after that render — so finalising in the cleanup
    // alone left the player looking at a stale 0 until something re-rendered.
    const seen = [];
    const onBack = () => seen.push(localStorage.getItem('sns_p_stall-2_quiz'));
    render(<Quiz username="p" stall={stallFor('stall-2')} onBack={onBack} />);

    const q = QUIZ_QUESTIONS.find((item) => screen.queryByText(item.question));
    fireEvent.click(screen.getByText(q.options[q.correct]));

    fireEvent.click(topBarBack());
    fireEvent.click(screen.getByText('Leave'));

    expect(JSON.parse(seen[0]).score, 'score must be stored before navigation').toBe(20);
  });

  it('does not ask once the game is already played', () => {
    localStorage.setItem('sns_p_stall-2_quiz', JSON.stringify({ score: 42, playedAt: 1 }));
    const onBack = vi.fn();
    render(<Quiz username="p" stall={stallFor('stall-2')} onBack={onBack} />);
    fireEvent.click(topBarBack());
    expect(onBack).toHaveBeenCalled();
  });
});
