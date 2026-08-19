import { useRef, useState } from 'react';
import { readJSON } from '../lib/storage.js';
import { stallGames, gameStorageKey } from '../data.js';

/* ── Everything the landing page needs to present one game, keyed by the game id
      used in the scores table. Which of these a stall shows comes from
      stallGames() — the line-up lives in src/data.js, not in slug comparisons
      scattered through the markup below. ── */
const GAME_DEFS = {
  quiz: {
    route: 'quiz',
    title: 'Network Quiz',
    chip: 'QUIZ',
    color: 'var(--green)',
    glow: 'var(--green-glow)',
    iconBg: 'var(--success-soft)',
    bar: 'var(--grad-green)',
    playColor: 'var(--green-dim)',
    doneTag: 'tag-green',
    desc: '5 random questions on protocols, ports & OSI fundamentals.',
    tags: ['5 MCQ', '30s / Q', 'Time Bonus'],
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="11" stroke={c} strokeWidth="1.6"/>
        <path d="M10.5 10.2C10.5 8.8 11.6 7.7 13 7.7s2.5 1.1 2.5 2.5c0 1.5-1.5 2.2-2.5 3.3" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="13" cy="17.5" r="1.2" fill={c}/>
      </svg>
    ),
    rules: [
      '5 random multiple-choice questions',
      '30 seconds per question — no answer scores 0',
      'Correct answer: 10 pts + speed bonus (faster = more)',
      'Max 100 pts',
    ],
  },
  wordsearch: {
    route: 'wordsearch',
    title: 'Word Search',
    chip: 'SEARCH',
    color: 'var(--cyan)',
    glow: 'var(--cyan-glow)',
    iconBg: 'var(--cyan-glow)',
    bar: 'linear-gradient(135deg, var(--cyan), var(--blue))',
    playColor: 'var(--cyan)',
    doneTag: 'tag-cyan',
    desc: 'Find 10 networking terms hidden in a 10 × 10 grid. Any direction.',
    tags: ['10 × 10', '5 MIN', 'All Directions'],
    footer: '50 NETWORKING KEYWORDS · RANDOMLY GENERATED',
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="3" y="3" width="20" height="20" rx="5" stroke={c} strokeWidth="1.6"/>
        <line x1="3" y1="10" x2="23" y2="10" stroke={c} strokeWidth="0.6" opacity="0.4"/>
        <line x1="3" y1="16" x2="23" y2="16" stroke={c} strokeWidth="0.6" opacity="0.4"/>
        <line x1="10" y1="3" x2="10" y2="23" stroke={c} strokeWidth="0.6" opacity="0.4"/>
        <line x1="16" y1="3" x2="16" y2="23" stroke={c} strokeWidth="0.6" opacity="0.4"/>
        <line x1="5" y1="7" x2="21" y2="21" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
      </svg>
    ),
    rules: [
      'Find 10 networking terms in a 10 × 10 grid',
      'Words run in any direction',
      '5-minute timer · 10 pts per word',
      'Finish early for a time bonus — max 130 pts',
    ],
  },
  memory: {
    route: 'memory',
    title: 'Network Memory Match',
    chip: 'MEMORY',
    color: 'var(--green)',
    glow: 'var(--green-glow)',
    iconBg: 'var(--success-soft)',
    bar: 'var(--grad-green)',
    playColor: 'var(--green-dim)',
    doneTag: 'tag-green',
    desc: 'Match network infrastructure cards before the time runs out!',
    tags: ['4 × 4 Grid', 'Combo Multipliers', '60s Speed'],
    footer: '8 PAIRS OF NETWORK GEAR · DEALT AT RANDOM',
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="3" y="3" width="9" height="9" rx="2" stroke={c} strokeWidth="1.6" fill="none"/>
        <rect x="14" y="3" width="9" height="9" rx="2" stroke={c} strokeWidth="1.6" fill="none"/>
        <rect x="3" y="14" width="9" height="9" rx="2" stroke={c} strokeWidth="1.6" fill="none"/>
        <rect x="14" y="14" width="9" height="9" rx="2" stroke={c} strokeWidth="1.6" fill="var(--green-glow)"/>
      </svg>
    ),
    rules: [
      '4 × 4 grid of network infrastructure items',
      '60 seconds countdown timer',
      'Combo multipliers + speed clear bonus',
      'Max 200 pts',
    ],
  },
  ztp: {
    route: 'ztp',
    title: 'ZTP Basketball',
    chip: 'ZTP BALL',
    color: 'var(--cyan)',
    glow: 'var(--cyan-glow)',
    iconBg: 'var(--cyan-glow)',
    bar: 'linear-gradient(135deg, var(--cyan), var(--blue))',
    playColor: 'var(--cyan)',
    doneTag: 'tag-cyan',
    desc: 'Slingshot provisioning actions into the correct ZTP stage hoops!',
    tags: ['4 Stages', 'Slingshot Aim', '5 Shots'],
    footer: 'AIM FOR THE RIGHT STAGE · MISS THE HOOPS AND SCORE NOTHING',
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="10" stroke={c} strokeWidth="1.6" fill="none" />
        <path d="M 3 13 Q 13 6 23 13" fill="none" stroke={c} strokeWidth="1" />
        <path d="M 3 13 Q 13 20 23 13" fill="none" stroke={c} strokeWidth="1" />
        <line x1="13" y1="3" x2="13" y2="23" stroke={c} strokeWidth="1" />
      </svg>
    ),
    rules: [
      'Slingshot 5 provisioning actions into 4 stage hoops',
      '40 pts per correct goal',
      '−10 pts for landing in the wrong stage hoop',
      'Between the hoops is an airball — 0 pts, no penalty',
      'Max 200 pts',
    ],
  },
};

/* ── Modal to switch stalls by entering a new code ── */
function StallSwitcher({ current, onSubmit, onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) { setError('Enter a stall code'); return; }
    setBusy(true); setError('');
    const r = await onSubmit(c);
    if (r?.error) { setError(r.error); setBusy(false); return; }
    // Close explicitly — the parent stays on the games screen after a switch,
    // so we can't rely on navigation to unmount this modal.
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'color-mix(in oklch, var(--ink) 62%, transparent)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
        animation: 'fadeIn 0.2s var(--ease-out)',
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
        className="glass-strong"
        style={{ width: '100%', maxWidth: 360, padding: 22, animation: 'stampIn 0.4s var(--ease-spring)' }}
      >
        <div className="label" style={{ marginBottom: 6 }}>Switch stall</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>
          You’re in <strong style={{ color: 'var(--text)' }}>{current?.name || '—'}</strong>. Enter another
          stall’s code to load its games.
        </p>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          placeholder="STALL CODE"
          autoComplete="off" autoCapitalize="characters" spellCheck="false" maxLength={32} autoFocus
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--bg)', border: '1px solid var(--b2)', borderRadius: 'var(--r-md)',
            fontSize: 16, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.12em', boxShadow: 'var(--shadow-sm)',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}>⚠ {error}</div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 600,
            background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--text2)', cursor: 'pointer',
          }}>Cancel</button>
          <button type="submit" disabled={busy} style={{
            flex: 1, padding: '12px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 700,
            background: 'var(--grad-green)', border: 'none', color: 'var(--on-accent)',
            boxShadow: '0 8px 24px -8px var(--green-glow2)', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1,
          }}>{busy ? 'Switching…' : 'Switch →'}</button>
        </div>
      </form>
    </div>
  );
}

/* ── Modal listing the rules for THIS stall's games ── */
function RulesModal({ games, onClose }) {
  const sections = [
    ...games.map(g => ({
      title: GAME_DEFS[g].title.toUpperCase(),
      color: GAME_DEFS[g].color,
      rules: GAME_DEFS[g].rules,
    })),
    {
      title: 'GENERAL',
      color: 'var(--text2)',
      rules: [
        'One attempt per challenge — scores are permanent',
        'Scores count toward your stall’s leaderboard',
        'Check RANKS for per-stall and overall standings',
      ],
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'color-mix(in oklch, var(--ink) 62%, transparent)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
        animation: 'fadeIn 0.2s var(--ease-out)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="glass-strong"
        style={{ width: '100%', maxWidth: 400, padding: 22, maxHeight: '85dvh', overflowY: 'auto', animation: 'stampIn 0.4s var(--ease-spring)' }}
      >
        <div className="label" style={{ marginBottom: 14 }}>Rules</div>
        {sections.map(({ title, color, rules }) => (
          <div key={title} style={{ marginBottom: 16 }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: '0.1em' }}>{title}</span>
            <ul style={{ margin: '7px 0 0', paddingLeft: 0, listStyle: 'none' }}>
              {rules.map(r => (
                <li key={r} style={{
                  fontSize: 13, color: 'var(--text2)', lineHeight: 1.5,
                  padding: '3px 0 3px 14px', position: 'relative',
                }}>
                  <span style={{ position: 'absolute', left: 0, color }}>▸</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button onClick={onClose} style={{
          width: '100%', padding: '12px', borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 700,
          background: 'var(--grad-green)', border: 'none', color: 'var(--on-accent)',
          boxShadow: '0 8px 24px -8px var(--green-glow2)', cursor: 'pointer',
        }}>Got it</button>
      </div>
    </div>
  );
}

function TiltCard({ children, style, onClick, disabled }) {
  const ref = useRef(null);

  const onMove = (e) => {
    if (disabled) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${y * -6}deg) rotateY(${x * 6}deg) translateZ(4px)`;
  };
  const onLeave = () => {
    ref.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  };

  return (
    <div
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="tilt-card"
      style={{ cursor: disabled ? 'default' : 'pointer', ...style }}
    >
      {children}
    </div>
  );
}

function ScoreBadge({ score, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      animation: 'popIn 0.5s var(--ease-spring)',
    }}>
      <span className="mono" style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {score}
      </span>
      <span className="label" style={{ color, opacity: 0.7, marginTop: 2 }}>pts</span>
    </div>
  );
}

/* ── One challenge card, driven entirely by its GAME_DEFS entry. `data` is the
      cached result read once by the parent, so every part of the card agrees on
      whether the game is done. ── */
function GameCard({ def, data, onPlay, delay }) {
  const done = !!data;
  const iconColor = done ? 'var(--text4)' : def.color;
  return (
    <TiltCard
      disabled={done}
      onClick={onPlay}
      style={{ animation: `fadeUp 0.6s var(--ease-out) ${delay}s both` }}
    >
      <div style={{
        background: 'var(--bg2)',
        border: `1px solid ${done ? 'var(--b1)' : `color-mix(in oklch, ${def.color} 45%, transparent)`}`,
        borderRadius: 'var(--r-lg)', overflow: 'hidden',
        boxShadow: done ? 'var(--shadow-sm)' : `0 0 34px ${def.glow}, var(--shadow)`,
        opacity: done ? 0.62 : 1,
        transition: 'opacity 0.3s, box-shadow 0.3s',
      }}>
        {!done && <div style={{ height: 3, background: def.bar }} />}

        <div style={{ padding: '20px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--r-md)', flexShrink: 0,
              background: done ? 'var(--s2)' : def.iconBg,
              border: `1px solid ${done ? 'var(--b1)' : `color-mix(in oklch, ${def.color} 22%, transparent)`}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {def.icon(iconColor)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: done ? 'var(--text2)' : 'var(--text)' }}>
                  {def.title}
                </span>
                {done
                  ? <ScoreBadge score={data.score} color={def.color} />
                  : <span className="dot dot-a" style={{ width: 10, height: 10 }}></span>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 12 }}>
                {def.desc}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {def.tags.map(t => <span key={t} className="tag tag-dim">{t}</span>)}
                {done && <span className={`tag ${def.doneTag}`}>✓ DONE</span>}
              </div>
            </div>
          </div>
        </div>

        {!done && (
          <div style={{
            padding: '11px 20px', borderTop: `1px solid color-mix(in oklch, ${def.color} 12%, transparent)`,
            background: `color-mix(in oklch, ${def.color} 5%, var(--bg2))`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="mono" style={{ fontSize: 11, color: def.playColor, fontWeight: 800, letterSpacing: '0.1em' }}>PLAY NOW</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke={def.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </TiltCard>
  );
}

export default function LandingPage({ username, stall, onSelectGame, onChangeStall }) {
  const [switching, setSwitching] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const slug  = stall?.slug || 'stall-1';
  const games = stallGames(slug);

  // Read each cached result once, here, and pass it down. Re-reading inside the
  // markup means a card's border, badge and footer can disagree with each other.
  const gameData  = Object.fromEntries(
    games.map(g => [g, readJSON(gameStorageKey(username, slug, g))])
  );
  const total     = games.reduce((sum, g) => sum + (gameData[g]?.score || 0), 0);
  const anyDone   = games.some(g => gameData[g]);
  const allDone   = games.every(g => gameData[g]);

  return (
    <div className="screen" style={{ padding: '0 0 32px' }}>
      {switching && (
        <StallSwitcher
          current={stall}
          onSubmit={onChangeStall}
          onClose={() => setSwitching(false)}
        />
      )}
      {showRules && <RulesModal games={games} onClose={() => setShowRules(false)} />}
      {/* Header */}
      <div style={{
        padding: '18px 22px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fadeDown 0.5s var(--ease-out)',
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            <span className="grad-text">Network</span>{' '}
            <span style={{ color: 'var(--text)' }}>Games</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.04em' }}>
              @{username}
            </span>
            {stall && (
              <button
                onClick={() => setSwitching(true)}
                title="Change stall code"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 'var(--r-full)', cursor: 'pointer',
                  background: 'var(--green-glow)', border: '1px solid color-mix(in oklch, var(--green) 35%, transparent)',
                }}
              >
                <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--green-dim)', letterSpacing: '0.08em' }}>
                  {stall.name.toUpperCase()}
                </span>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M11.5 6A4.5 4.5 0 103 9.5M11.5 2v4h-4" stroke="var(--green-dim)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowRules(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer',
              background: 'var(--s1)', border: '1px solid var(--b1)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.2s var(--ease-out)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--s1)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="1.5" width="10" height="11" stroke="var(--green)" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="mono" style={{ fontSize: 9, color: 'var(--green-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>RULES</span>
          </button>
          <button
            onClick={() => onSelectGame('leaderboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer',
              background: 'var(--s1)', border: '1px solid var(--b1)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.2s var(--ease-out)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--s1)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 2h8v3a4 4 0 01-8 0V2z" stroke="var(--green)" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M11 3h1.5a1.5 1.5 0 01-1.5 2.5M3 3H1.5A1.5 1.5 0 003 5.5" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M7 9v2M5 12h4" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span className="mono" style={{ fontSize: 9, color: 'var(--green-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>RANKS</span>
          </button>

          {/* Dev Mode Reset Button */}
          {import.meta.env.DEV && (
            <button
              onClick={() => {
                Object.keys(localStorage).forEach(k => {
                  if (k.startsWith('sns_') && k !== 'sns_user' && k !== 'sns_stall' && k !== 'sns_stall_name' && k !== 'sns_fp') {
                    localStorage.removeItem(k);
                  }
                });
                window.location.reload();
              }}
              title="Reset played games (Dev Mode)"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 'var(--r-full)', cursor: 'pointer',
                background: 'var(--danger-soft)', border: '1px solid color-mix(in oklch, var(--red) 30%, transparent)',
              }}
            >
              <span className="mono" style={{ fontSize: 9, color: 'var(--red)', fontWeight: 700 }}>RESET</span>
            </button>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 13px', borderRadius: 'var(--r-full)',
            background: 'var(--s1)', border: '1px solid var(--b1)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          }}>
            <span className="dot dot-g" style={{ width: 6, height: 6 }}></span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--green-dim)', fontWeight: 700, letterSpacing: '0.1em' }}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Score summary */}
      {anyDone && (
        <div style={{ padding: '18px 22px 0', animation: 'fadeUp 0.5s var(--ease-out) 0.08s both' }}>
          <div className="grad-border">
            <div style={{ background: 'var(--bg2)', borderRadius: 'calc(var(--r-lg) - 1.5px)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="label">Total Score</span>
                  <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, marginTop: 4 }} className="grad-text">
                    {total}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  {games.map(g => {
                    const def  = GAME_DEFS[g];
                    const done = !!gameData[g];
                    return (
                      <div key={g} style={{ textAlign: 'center' }}>
                        <span style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: done ? def.color : 'var(--text4)',
                          boxShadow: done ? `0 0 10px ${def.color}` : 'none',
                          display: 'block', margin: '0 auto 5px',
                          transition: 'all 0.3s',
                        }}/>
                        <span className="label" style={{ fontSize: 9 }}>{def.chip}</span>
                        {done && <div className="mono" style={{ fontSize: 11, color: def.color, fontWeight: 700, marginTop: 2 }}>{gameData[g].score}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {allDone && (
                <div style={{
                  marginTop: 14, padding: '9px 14px',
                  background: 'var(--green-glow)', borderRadius: 'var(--r-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  border: '1px solid color-mix(in oklch, var(--green) 22%, transparent)',
                  animation: 'fadeIn 0.5s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="led-pulse"/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dim)', letterSpacing: '0.02em' }}>
                      All stall challenges completed
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--green-dim)' }}>
                    Total: {total} pts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ padding: '24px 22px 14px', animation: 'fadeUp 0.5s var(--ease-out) 0.12s both' }}>
        <div className="divider">SELECT A CHALLENGE</div>
      </div>

      {/* Cards */}
      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {games.map((g, i) => (
          <GameCard
            key={g}
            def={GAME_DEFS[g]}
            data={gameData[g]}
            onPlay={() => onSelectGame(GAME_DEFS[g].route)}
            delay={0.18 + i * 0.08}
          />
        ))}
      </div>

      <div className="mono" style={{
        textAlign: 'center', fontSize: 10, color: 'var(--text4)',
        padding: '24px 22px 0', letterSpacing: '0.08em', lineHeight: 1.8,
        animation: 'fadeIn 0.6s ease 0.4s both',
      }}>
        {/* Only the blurbs for games this stall actually runs. */}
        {games.map(g => GAME_DEFS[g].footer).filter(Boolean).map(line => (
          <span key={line}>{line}<br/></span>
        ))}
        ONE ATTEMPT PER CHALLENGE · SCORES ARE PERMANENT
      </div>
    </div>
  );
}
