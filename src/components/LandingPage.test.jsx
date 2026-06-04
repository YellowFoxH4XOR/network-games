import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from './LandingPage.jsx';

const STALL = { slug: 'stall-1', name: 'Stall 1' };

// LandingPage is now the screen players land on straight after login (the
// HomePage chooser was removed along with Visualize), so it must carry the
// stall switcher and correctly gate completed games.
describe('LandingPage (root screen after login)', () => {
  it('offers both games and fires onSelectGame for a fresh player', () => {
    const onSelectGame = vi.fn();
    render(<LandingPage username="tester" stall={STALL} onSelectGame={onSelectGame} onChangeStall={vi.fn()} />);
    expect(screen.getAllByText('PLAY NOW')).toHaveLength(2);
    fireEvent.click(screen.getByText('Network Quiz'));
    expect(onSelectGame).toHaveBeenCalledWith('quiz');
  });

  it('greys out a completed game: shows its score and ignores clicks', () => {
    localStorage.setItem('sns_tester_stall-1_quiz', JSON.stringify({ score: 42, playedAt: 1 }));
    const onSelectGame = vi.fn();
    render(<LandingPage username="tester" stall={STALL} onSelectGame={onSelectGame} onChangeStall={vi.fn()} />);

    expect(screen.getByText('✓ DONE')).toBeInTheDocument();
    // 42 shows in BOTH the total-score summary and the quiz card's badge.
    expect(screen.getAllByText('42').length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByText('Network Quiz'));
    expect(onSelectGame).not.toHaveBeenCalledWith('quiz');
    // The other game stays playable.
    expect(screen.getAllByText('PLAY NOW')).toHaveLength(1);
    fireEvent.click(screen.getByText('Word Search'));
    expect(onSelectGame).toHaveBeenCalledWith('wordsearch');
  });

  it('hosts the stall switcher: the stall pill opens the modal', () => {
    render(<LandingPage username="tester" stall={STALL} onSelectGame={vi.fn()} onChangeStall={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Change stall code'));
    expect(screen.getByText('Switch stall')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('STALL CODE')).toBeInTheDocument();
  });

  it('closes the switcher after a successful switch (parent stays on this screen)', async () => {
    const onChangeStall = vi.fn(async () => ({ ok: true }));
    render(<LandingPage username="tester" stall={STALL} onSelectGame={vi.fn()} onChangeStall={onChangeStall} />);
    fireEvent.click(screen.getByTitle('Change stall code'));
    fireEvent.change(screen.getByPlaceholderText('STALL CODE'), { target: { value: 'X7K2QF' } });
    fireEvent.click(screen.getByText('Switch →'));
    await vi.waitFor(() => {
      expect(screen.queryByText('Switch stall')).not.toBeInTheDocument();
    });
    expect(onChangeStall).toHaveBeenCalledWith('X7K2QF');
  });
});
