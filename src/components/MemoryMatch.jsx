import { useState, useEffect, useCallback, useRef } from 'react';
import TopBar from './TopBar.jsx';
import { saveScore } from '../lib/saveScore.js';
import { useCountUp } from '../lib/useCountUp.js';
import { readJSON } from '../lib/storage.js';
import { shuffle } from '../data.js';
import {
  MEMORY_MAX,
  MEMORY_COMBO_CAP,
  memoryPairPoints,
  memoryClearBonus,
} from '../lib/scoring.js';

// 8 Pairs = 16 Cards (4x4 Grid)
const NETWORK_ITEMS = [
  {
    id: 'server',
    name: 'Server',
    color: '#10b981',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="5" width="24" height="6" rx="2" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="1" fill="#10b981" />
        <circle cx="12" cy="8" r="1" fill="#f59e0b" />
        <rect x="4" y="13" width="24" height="6" rx="2" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
        <circle cx="8" cy="16" r="1" fill="#10b981" />
        <circle cx="12" cy="16" r="1" fill="#10b981" />
        <rect x="4" y="21" width="24" height="6" rx="2" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
        <circle cx="8" cy="24" r="1" fill="#10b981" />
        <circle cx="12" cy="24" r="1" fill="#ef4444" />
      </svg>
    ),
  },
  {
    id: 'switch',
    name: 'Switch',
    color: '#6366f1',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="10" width="26" height="12" rx="3" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
        <rect x="6" y="14" width="3" height="4" rx="0.5" fill="#6366f1" />
        <rect x="11" y="14" width="3" height="4" rx="0.5" fill="#10b981" />
        <rect x="16" y="14" width="3" height="4" rx="0.5" fill="#6366f1" />
        <rect x="21" y="14" width="3" height="4" rx="0.5" fill="#f59e0b" />
      </svg>
    ),
  },
  {
    id: 'router',
    name: 'Router',
    color: '#06b6d4',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <path d="M7 10 L7 4 M25 10 L25 4 M12 10 L12 6" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
        <rect x="4" y="10" width="24" height="14" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="1.5" />
        <circle cx="9" cy="17" r="1.5" fill="#10b981" />
        <circle cx="16" cy="17" r="1.5" fill="#06b6d4" />
        <circle cx="23" cy="17" r="1.5" fill="#10b981" />
      </svg>
    ),
  },
  {
    id: 'firewall',
    name: 'Firewall',
    color: '#ef4444',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <path d="M16 4 L26 8 V16 C26 22 20 27 16 29 C12 27 6 22 6 16 V8 L16 4 Z" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
        <path d="M16 11 C16 11 13 14 13 17 C13 18.6 14.3 20 16 20 C17.7 20 19 18.6 19 17 C19 14 16 11 16 11 Z" fill="#f97316" />
      </svg>
    ),
  },
  {
    id: 'terraform',
    name: 'Terraform',
    color: '#a855f7',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <path d="M8 6 L15 10 V17 L8 13 Z M17 10 L24 6 V13 L17 17 Z M17 19 L24 15 V22 L17 26 Z M8 15 L15 19 V26 L8 22 Z" fill="#581c87" stroke="#a855f7" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'ansible',
    name: 'Ansible',
    color: '#8b5cf6',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" fill="#2e1065" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M16 8 L10 23 H13 L16 15.5 L19 23 H22 L16 8 Z" fill="#c084fc" />
      </svg>
    ),
  },
  {
    id: 'access_point',
    name: 'Access Point',
    color: '#14b8a6',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="22" r="2.5" fill="#14b8a6" />
        <path d="M11 17 A7 7 0 0 1 21 17" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 12 A13 13 0 0 1 25 12" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M3 7 A18 18 0 0 1 29 7" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'python_script',
    name: 'Python Script',
    color: '#eab308',
    icon: (
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <path d="M15.5 4 C11 4 10 5.5 10 7.5 V10 H16 V11 H8 C5.5 11 4 13 4 16.5 C4 20 5.5 21 8 21 H10 V19 C10 16.5 11.5 15 14 15 H18 V14 C18 11.5 16.5 10 14 10 H10 V7.5 C10 6 11.5 5 15.5 5 C19.5 5 21 6 21 7.5 V9 H23 V7.5 C23 5.5 22 4 17.5 4 Z" fill="#eab308" />
        <circle cx="12" cy="7" r="1" fill="#1e293b" />
        <path d="M16.5 28 C21 28 22 26.5 22 24.5 V22 H16 V21 H24 C26.5 21 28 19 28 15.5 C28 12 26.5 11 24 11 H22 V13 C22 15.5 20.5 17 18 17 H14 V18 C14 20.5 15.5 22 18 22 H22 V24.5 C22 26 20.5 27 16.5 27 C12.5 27 11 26 11 24.5 V23 H9 V24.5 C9 26.5 10 28 14.5 28 Z" fill="#3b82f6" />
        <circle cx="20" cy="25" r="1" fill="#1e293b" />
      </svg>
    ),
  },
];

const GAME_TIME = 60; // 60s countdown

function shuffleDeck() {
  return shuffle(
    NETWORK_ITEMS.flatMap((item) => [
      { uid: item.id + '_1', itemId: item.id, ...item },
      { uid: item.id + '_2', itemId: item.id, ...item },
    ])
  );
}

export default function MemoryMatch({ username, stall, onBack }) {
  const slug = stall?.slug || 'stall-3';
  const key = 'sns_' + (username || 'anon') + '_' + slug + '_memory';

  const [game] = useState(() => {
    const cached = readJSON(key);
    return {
      done: !!cached,
      prevScore: cached?.score || 0,
      deck: cached ? [] : shuffleDeck(),
    };
  });
  const { done, prevScore, deck } = game;

  const [flipped, setFlipped] = useState([]); // [index1, index2]
  const [matched, setMatched] = useState([]); // [itemId1, itemId2, ...]
  const [combo, setCombo] = useState(1);
  const [pairsCount, setPairsCount] = useState(0);
  const [time, setTime] = useState(GAME_TIME);
  const [score, setScore] = useState(0);
  const [gState, setGState] = useState('playing');
  const [lockBoard, setLockBoard] = useState(false);
  const timerRef = useRef(null);
  const savedRef = useRef(false);
  const winRef = useRef(null);
  const mismatchRef = useRef(null);

  // Writes the result exactly once. Called the moment the outcome is known —
  // on the win, or when the clock runs out — so no completed game is lost to a
  // pending animation timeout.
  const finish = useCallback((finalScore, pairs) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const safeScore = Math.min(MEMORY_MAX, Math.max(0, finalScore));
    localStorage.setItem(
      key,
      JSON.stringify({
        score: safeScore,
        pairs,
        timeTaken: GAME_TIME - time,
        playedAt: Date.now(),
      })
    );
    saveScore(username, slug, 'memory', safeScore);
  }, [key, time, username, slug]);

  // Clear pending animation timers on unmount so they can't fire setState on an
  // unmounted component.
  useEffect(() => () => {
    clearTimeout(winRef.current);
    clearTimeout(mismatchRef.current);
  }, []);

  const animScore = useCountUp(score, 400);

  // Timer loop
  useEffect(() => {
    if (gState !== 'playing' || done) return;
    timerRef.current = setInterval(() => {
      setTime((p) => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          setGState('finished');
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gState, done]);

  // Save on game over. The win path already persisted via finish(); this covers
  // the clock running out, and finish() is idempotent.
  useEffect(() => {
    if (gState !== 'finished') return;
    finish(score, pairsCount);
  }, [gState, score, pairsCount, finish]);

  const handleCardClick = (index) => {
    if (lockBoard || gState !== 'playing' || done) return;
    if (flipped.includes(index) || matched.includes(deck[index].itemId)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setLockBoard(true);
      const [i1, i2] = newFlipped;
      const card1 = deck[i1];
      const card2 = deck[i2];

      if (card1.itemId === card2.itemId) {
        // MATCH!
        const newPairs = pairsCount + 1;
        setMatched((prev) => [...prev, card1.itemId]);
        setPairsCount(newPairs);

        // Every accrual is clamped to MEMORY_MAX, not just the win path: a
        // combo run can pass 200 well before the board is cleared, and the
        // server rejects (rather than clamps) anything above its cap.
        const addedScore = memoryPairPoints(combo, time);
        let runningScore = Math.min(MEMORY_MAX, score + addedScore);
        setScore(runningScore);
        setCombo((c) => Math.min(c + 1, MEMORY_COMBO_CAP));

        setFlipped([]);
        setLockBoard(false);

        // Check Win Condition
        if (newPairs === NETWORK_ITEMS.length) {
          clearInterval(timerRef.current);
          runningScore = Math.min(MEMORY_MAX, runningScore + memoryClearBonus(time));
          setScore(runningScore);
          // Persist as soon as the win is decided. The 500ms delay below is
          // only the screen transition; saving after it would lose a finished
          // game if the player navigated away inside that window.
          finish(runningScore, newPairs);
          winRef.current = setTimeout(() => setGState('finished'), 500);
        }
      } else {
        // MISMATCH
        setCombo(1); // Reset combo
        mismatchRef.current = setTimeout(() => {
          setFlipped([]);
          setLockBoard(false);
        }, 900);
      }
    }
  };

  /* ── Already Played View ── */
  if (done) {
    return (
      <div className="screen" style={{ paddingBottom: 36 }}>
        <TopBar onBack={onBack} title="Network Memory Match" />
        <div style={{ padding: '0 22px', animation: 'fadeUp 0.5s var(--ease-out)' }}>
          <div className="glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--r-lg)',
                background: 'var(--bg2)',
                border: '1px solid var(--b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="5" y="12" width="18" height="13" rx="3" stroke="var(--text3)" strokeWidth="1.5" />
                <path d="M9 12V9a5 5 0 0110 0v3" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              Already Completed
            </div>
            <div className="label" style={{ marginBottom: 28 }}>
              One attempt per player — your score is final
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
              <div
                style={{
                  background: 'var(--green-glow)',
                  borderRadius: 'var(--r-lg)',
                  padding: '16px 26px',
                  border: '1px solid color-mix(in oklch, var(--green) 20%, transparent)',
                  textAlign: 'center',
                }}
              >
                <div className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--green-dim)' }}>
                  {prevScore}
                </div>
                <div className="label" style={{ color: 'var(--green-dim)', opacity: 0.8, marginTop: 4 }}>
                  Points
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 22px 0' }}>
          <button onClick={onBack} className="btn-secondary" style={{ width: '100%' }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Game Finished Screen ── */
  if (gState === 'finished') {
    const isWin = pairsCount === NETWORK_ITEMS.length;
    return (
      <div className="screen" style={{ paddingBottom: 36 }}>
        <TopBar onBack={onBack} title="Results" />
        <div style={{ padding: '0 22px', animation: 'scaleIn 0.45s var(--ease-out)' }}>
          <div className="grad-border" style={{ marginBottom: 16 }}>
            <div style={{ background: 'var(--bg2)', borderRadius: 'calc(var(--r-lg) - 1.5px)', padding: '28px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: isWin ? 'var(--green-dim)' : 'var(--amber)', marginBottom: 16 }}>
                {isWin ? '🎉 Topology Matched!' : "⏱ Time's Up!"}
              </div>
              <div className="mono" style={{ fontSize: 44, fontWeight: 800, color: 'var(--green-dim)', marginBottom: 6 }}>
                {animScore}
              </div>
              <div className="label" style={{ color: 'var(--text3)', marginBottom: 20 }}>
                FINAL SCORE ({pairsCount}/{NETWORK_ITEMS.length} PAIRS)
              </div>
            </div>
          </div>
          <button onClick={onBack} className="btn-secondary" style={{ width: '100%' }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Main Gameplay Screen ── */
  return (
    <div className="screen" style={{ paddingBottom: 36 }}>
      <TopBar
        onBack={onBack}
        title="Network Memory Match"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="label">SCORE</span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--green-dim)' }}>
              {animScore}
            </span>
          </div>
        }
      />

      {/* Stats Bar */}
      <div style={{ padding: '0 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: 'var(--s1)', padding: '6px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--b1)' }}>
            <span className="label" style={{ fontSize: 9, display: 'block' }}>COMBO</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: 'var(--cyan)' }}>
              x{combo}
            </span>
          </div>
          <div style={{ background: 'var(--s1)', padding: '6px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--b1)' }}>
            <span className="label" style={{ fontSize: 9, display: 'block' }}>PAIRS</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)' }}>
              {pairsCount}/{NETWORK_ITEMS.length}
            </span>
          </div>
        </div>

        {/* Circular Countdown Timer */}
        <div style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--s2)" strokeWidth="3" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={time <= 15 ? 'var(--red)' : 'var(--green)'}
              strokeWidth="3"
              strokeDasharray={113}
              strokeDashoffset={113 - (113 * time) / GAME_TIME}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>
          <span className="mono" style={{ position: 'absolute', fontSize: 13, fontWeight: 800, color: time <= 15 ? 'var(--red)' : 'var(--text)' }}>
            {time}
          </span>
        </div>
      </div>

      {/* 4x4 Card Grid */}
      <div style={{ padding: '0 22px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          {deck.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(card.itemId);
            const isMatched = matched.includes(card.itemId);

            return (
              <div
                key={card.uid}
                onClick={() => handleCardClick(idx)}
                style={{
                  aspectRatio: '1',
                  perspective: 1000,
                  cursor: isMatched ? 'default' : 'pointer',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Card Back (Hidden pattern) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg2)',
                      border: '1.5px solid var(--green)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" opacity="0.3">
                      <circle cx="12" cy="12" r="8" stroke="var(--green)" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="12" cy="12" r="3" fill="var(--green)" />
                    </svg>
                  </div>

                  {/* Card Front (Item content) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      borderRadius: 'var(--r-md)',
                      background: isMatched ? 'color-mix(in oklch, var(--green) 12%, var(--bg2))' : 'var(--bg2)',
                      border: `1.5px solid ${isMatched ? 'var(--green)' : card.color}`,
                      boxShadow: isMatched ? '0 0 16px var(--green-glow)' : 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                      gap: 4,
                    }}
                  >
                    {card.icon}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--text)',
                        textAlign: 'center',
                        lineHeight: 1.1,
                      }}
                    >
                      {card.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
