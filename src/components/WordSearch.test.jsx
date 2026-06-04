import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WordSearch from './WordSearch.jsx';

const STALL = { slug: 'stall-1', name: 'Stall 1' };

describe('WordSearch', () => {
  it('renders a playable grid for a fresh stall', () => {
    render(<WordSearch username="tester" stall={STALL} onBack={() => {}} />);
    // The target-words header proves a puzzle was generated and we are playing.
    expect(screen.getByText('Target Words')).toBeInTheDocument();
    expect(screen.queryByText('Already Completed')).not.toBeInTheDocument();
  });

  it('shows the "already completed" screen with the cached score/progress', () => {
    localStorage.setItem(
      'sns_tester_stall-1_ws',
      JSON.stringify({ score: 55, found: 8, total: 10, playedAt: 1 }),
    );
    render(<WordSearch username="tester" stall={STALL} onBack={() => {}} />);
    expect(screen.getByText('Already Completed')).toBeInTheDocument();
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('does not crash on a corrupt cached value (guards readJSON)', () => {
    localStorage.setItem('sns_tester_stall-1_ws', 'broken{');
    expect(() =>
      render(<WordSearch username="tester" stall={STALL} onBack={() => {}} />),
    ).not.toThrow();
    expect(screen.queryByText('Already Completed')).not.toBeInTheDocument();
  });
});
