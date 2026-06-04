import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WelcomeScreen from './WelcomeScreen.jsx';

// Routes fetch calls the way the real API would respond for a device that is
// ALREADY registered in stall-1 as "akki" with a finished quiz (42 pts).
function mockApi() {
  vi.stubGlobal('fetch', vi.fn(async (url, opts = {}) => {
    const body = opts.body ? JSON.parse(opts.body) : {};
    const json = (data, status = 200) =>
      ({ ok: status < 400, status, json: async () => data });

    if (String(url).includes('/api/me')) {
      return body.stall
        ? json({ registered: true, knownDevice: true, username: 'akki',
                 playedStalls: ['stall-1'], quiz: { score: 42 }, wordsearch: null })
        : json({ registered: false, knownDevice: true, username: 'akki',
                 playedStalls: ['stall-1'] });
    }
    if (String(url).includes('/api/stall')) {
      return json({ valid: true, stall: { slug: 'stall-1', name: 'Stall 1' } });
    }
    if (String(url).includes('/api/register')) {
      return json({ error: 'already_registered', field: 'device' }, 409);
    }
    throw new Error(`unmocked fetch: ${url}`);
  }));
}

beforeEach(mockApi);
afterEach(() => vi.unstubAllGlobals());

// The old behaviour dead-ended at an "Access Denied" screen. A returning
// device must instead be let back INTO the stall, with the DB's username and
// its scores re-cached so completed games render greyed-out, not replayable.
describe('WelcomeScreen — returning device re-enters its own stall', () => {
  it('lets the device back in with its DB username and cached score', async () => {
    const onContinue = vi.fn();
    render(<WelcomeScreen onContinue={onContinue} />);

    // Device lookup pre-fills and locks the username.
    await screen.findByDisplayValue('akki');

    fireEvent.change(screen.getByPlaceholderText('STALL CODE'), {
      target: { value: 'X7K2QF' },
    });
    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith('akki', { slug: 'stall-1', name: 'Stall 1' });
    });

    // No dead end…
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    // …and the synced cache is what makes LandingPage grey out the quiz.
    expect(localStorage.getItem('sns_stall')).toBe('stall-1');
    expect(JSON.parse(localStorage.getItem('sns_akki_stall-1_quiz')).score).toBe(42);
    expect(localStorage.getItem('sns_akki_stall-1_ws')).toBeNull(); // word search still playable
  });
});
