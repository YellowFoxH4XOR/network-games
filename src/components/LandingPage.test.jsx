import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from './LandingPage.jsx';

// Stall 2 runs the quiz pair; stall 1 runs the wheel; stall 3 the arcade games.
const STALL = { slug: 'stall-2', name: 'Stall 2' };
const STALL1 = { slug: 'stall-1', name: 'Stall 1' };
const STALL3 = { slug: 'stall-3', name: 'Stall 3' };

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
    localStorage.setItem('sns_tester_stall-2_quiz', JSON.stringify({ score: 42, playedAt: 1 }));
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

  it('offers stall 1 the wheel alone, and reads as complete once it is played', () => {
    const onSelectGame = vi.fn();
    const { unmount } = render(<LandingPage username="tester" stall={STALL1} onSelectGame={onSelectGame} onChangeStall={vi.fn()} />);
    expect(screen.getAllByText('PLAY NOW')).toHaveLength(1);
    expect(screen.queryByText('Network Quiz')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Spin Wheel'));
    expect(onSelectGame).toHaveBeenCalledWith('spin');
    unmount();

    // A single-game stall counts as fully complete on that one result.
    localStorage.setItem('sns_tester_stall-1_spin', JSON.stringify({ score: 40, playedAt: 1 }));
    render(<LandingPage username="tester" stall={STALL1} onSelectGame={vi.fn()} onChangeStall={vi.fn()} />);
    expect(screen.getByText('✓ DONE')).toBeInTheDocument();
    expect(screen.queryByText('PLAY NOW')).not.toBeInTheDocument();
    expect(screen.getByText('All stall challenges completed')).toBeInTheDocument();
  });

  // Stall 3 runs an entirely different pair of games. Before the line-up moved
  // into STALL_GAMES this branch had no coverage at all, because every test
  // here pinned stall-1.
  it('offers stall 3 its own games, not the quiz pair', () => {
    const onSelectGame = vi.fn();
    render(<LandingPage username="tester" stall={STALL3} onSelectGame={onSelectGame} onChangeStall={vi.fn()} />);
    expect(screen.getAllByText('PLAY NOW')).toHaveLength(2);
    expect(screen.queryByText('Network Quiz')).not.toBeInTheDocument();
    expect(screen.queryByText('Word Search')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Network Memory Match'));
    expect(onSelectGame).toHaveBeenCalledWith('memory');
    fireEvent.click(screen.getByText('ZTP Basketball'));
    expect(onSelectGame).toHaveBeenCalledWith('ztp');
  });

  it('gates a completed stall-3 game and totals only that stall’s games', () => {
    localStorage.setItem('sns_tester_stall-3_memory', JSON.stringify({ score: 150, playedAt: 1 }));
    // A score cached for another stall's game must not leak into this total.
    localStorage.setItem('sns_tester_stall-3_quiz', JSON.stringify({ score: 99, playedAt: 1 }));
    const onSelectGame = vi.fn();
    render(<LandingPage username="tester" stall={STALL3} onSelectGame={onSelectGame} onChangeStall={vi.fn()} />);

    expect(screen.getByText('✓ DONE')).toBeInTheDocument();
    expect(screen.queryByText('99')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Network Memory Match'));
    expect(onSelectGame).not.toHaveBeenCalledWith('memory');
    expect(screen.getAllByText('PLAY NOW')).toHaveLength(1);
  });

  it('announces completion only when every game of the stall is played', () => {
    localStorage.setItem('sns_tester_stall-3_memory', JSON.stringify({ score: 150, playedAt: 1 }));
    const { unmount } = render(<LandingPage username="tester" stall={STALL3} onSelectGame={vi.fn()} onChangeStall={vi.fn()} />);
    expect(screen.queryByText('All stall challenges completed')).not.toBeInTheDocument();
    unmount();

    localStorage.setItem('sns_tester_stall-3_ztp', JSON.stringify({ score: 40, playedAt: 1 }));
    render(<LandingPage username="tester" stall={STALL3} onSelectGame={vi.fn()} onChangeStall={vi.fn()} />);
    expect(screen.getByText('All stall challenges completed')).toBeInTheDocument();
    expect(screen.getByText('Total: 190 pts')).toBeInTheDocument();
  });

  it('shows each stall only the rules for the games it runs', () => {
    render(<LandingPage username="tester" stall={STALL3} onSelectGame={vi.fn()} onChangeStall={vi.fn()} />);
    fireEvent.click(screen.getByText('RULES'));
    expect(screen.getByText('ZTP BASKETBALL')).toBeInTheDocument();
    expect(screen.queryByText('NETWORK QUIZ')).not.toBeInTheDocument();
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
