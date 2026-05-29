import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { stallKeywords } from '../data.js';
import TopBar from './TopBar.jsx';
import { saveScore } from '../lib/saveScore.js';
import { useCountUp } from '../lib/useCountUp.js';

const GRID_SIZE  = 10;
const WORD_COUNT = 10;
const GAME_TIME  = 300;

const WORD_COLORS = [
  'oklch(0.55 0.13 158)', 'oklch(0.54 0.10 210)', 'oklch(0.65 0.13 78)', 'oklch(0.57 0.16 25)', 'oklch(0.54 0.14 295)',
  'oklch(0.58 0.14 335)', 'oklch(0.55 0.11 178)', 'oklch(0.62 0.14 55)', 'oklch(0.52 0.12 270)', 'oklch(0.52 0.12 250)',
];

const DIRS = [
  { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
  { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 },
];

/**
 * Generate a word search grid.
 *  - Picks a random subset so word selection differs every run
 *  - Tries multiple placements per word and prefers ones that OVERLAP existing
 *    letters (crossings make it visibly harder than separated words)
 *  - Fills empty cells with letters weighted toward the alphabet that appears
 *    in the placed words, so filler doesn't stand out as obviously fake
 */
function genPuzzle(keywords) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  // Random subset → different words every game.
  const valid = keywords.filter(w => w.length <= GRID_SIZE);
  const shuffled = [...valid].sort(() => Math.random() - 0.5);
  const candidates = shuffled.slice(0, Math.min(WORD_COUNT * 3, shuffled.length));
  // Place longest first — they're hardest to fit, so they need first pick.
  candidates.sort((a, b) => b.length - a.length);

  const placed = [];

  for (const word of candidates) {
    if (placed.length >= WORD_COUNT) break;

    // Score every legal placement by overlap count, then pick the best.
    // For the FIRST few words there's nothing to overlap, so we fall back
    // to a random legal position.
    let bestCells = null;
    let bestOverlap = -1;
    const tryCount = 220;

    for (let t = 0; t < tryCount; t++) {
      const d  = DIRS[Math.floor(Math.random() * DIRS.length)];
      const sr = Math.floor(Math.random() * GRID_SIZE);
      const sc = Math.floor(Math.random() * GRID_SIZE);

      let fit = true;
      let overlap = 0;
      const cells = [];
      for (let i = 0; i < word.length; i++) {
        const r = sr + i * d.dr, c = sc + i * d.dc;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) { fit = false; break; }
        const existing = grid[r][c];
        if (existing !== null) {
          if (existing !== word[i]) { fit = false; break; }
          overlap++;
        }
        cells.push({ r, c });
      }
      if (!fit) continue;

      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestCells = cells;
        // Excellent placement — two or more crossings is great, take it.
        if (overlap >= 2) break;
      }
    }

    if (bestCells) {
      bestCells.forEach((p, i) => { grid[p.r][p.c] = word[i]; });
      placed.push(word);
    }
  }

  // Weighted filler: bias toward letters that already appear in placed words.
  // This makes the filler blend in, so the eye can't quickly dismiss "fake"
  // letters and has to actually scan for words.
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const freq = Object.fromEntries([...ALPHA].map(c => [c, 1]));
  for (const word of placed) {
    for (const ch of word) freq[ch] += 3;
  }
  const pool = [];
  for (const ch of ALPHA) {
    const n = freq[ch];
    for (let i = 0; i < n; i++) pool.push(ch);
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return { grid, words: placed };
}

function selCells(s, e) {
  if (!s || !e) return [];
  const dr = e.r - s.r, dc = e.c - s.c;
  if (!dr && !dc) return [{ r: s.r, c: s.c }];
  const a  = Math.atan2(dr, dc);
  const sn = Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
  const sr = Math.round(Math.sin(sn)), sc = Math.round(Math.cos(sn));
  const dist = Math.max(Math.abs(dr), Math.abs(dc));
  const out = [];
  for (let i = 0; i <= dist; i++) {
    const r = s.r + i * sr, c = s.c + i * sc;
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) out.push({ r, c });
    else break;
  }
  return out;
}

/* ── Confetti burst component (CSS only) ── */
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    id: i,
    color: WORD_COLORS[i % WORD_COLORS.length],
    angle: (Math.random() * 360),
    distance: 120 + Math.random() * 180,
    delay: Math.random() * 0.15,
    size: 6 + Math.random() * 6,
    rotation: Math.random() * 720 - 360,
  })), []);

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      zIndex: 9998, overflow: 'hidden',
    }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: '50%', top: '40%',
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            boxShadow: `0 0 8px color-mix(in oklch, ${p.color} 50%, transparent)`,
            animation: `confettiBurst 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}s forwards`,
            ['--angle']: `${p.angle}deg`,
            ['--dist']: `${p.distance}px`,
            ['--rot']: `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}

const W = {
  page: { display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100dvh', paddingBottom: 36 },
  backFull: {
    width: '100%', padding: '15px', background: 'var(--bg2)',
    border: '1px solid var(--b1)', borderRadius: 0,
    color: 'var(--text2)', fontSize: 14, fontWeight: 600,
    fontFamily: 'inherit', textAlign: 'center', cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s var(--ease-out)',
  },
};

export default function WordSearch({ username, stall, onBack }) {
  const slug = stall?.slug || 'stall-1';
  const key = 'sns_' + (username || 'anon') + '_' + slug + '_ws';

  const [done, setDone]           = useState(false);
  const [prevScore, setPrevScore] = useState(0);
  const [prevFound, setPrevFound] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);

  const [pz, setPz]         = useState(null);
  const [found, setFound]   = useState({});
  // fCells stores { color, order, foundAt } per cell so we can stagger reveal animations
  const [fCells, setFCells] = useState({});
  const [ds, setDs]         = useState(null);
  const [de, setDe]         = useState(null);
  const [sel, setSel]       = useState(false);
  const [time, setTime]     = useState(GAME_TIME);
  const [score, setScore]   = useState(0);
  const [gState, setGState] = useState('playing');
  const [shake, setShake]   = useState(false);
  const [flash, setFlash]   = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [lastFoundWord, setLastFoundWord] = useState(null);
  const tRef = useRef(null);
  const savedRef = useRef(false);

  const animScore = useCountUp(score, 500);

  useEffect(() => {
    const s = localStorage.getItem(key);
    if (s) {
      const d = JSON.parse(s);
      setDone(true); setPrevScore(d.score || 0);
      setPrevFound(d.found || 0); setPrevTotal(d.total || 0);
    }
  }, [key]);

  const init = useCallback(() => {
    setPz(genPuzzle(stallKeywords(slug))); setFound({}); setFCells({});
    setDs(null); setDe(null); setSel(false);
    setTime(GAME_TIME); setScore(0); setGState('playing');
  }, [slug]);

  useEffect(() => { if (!done) init(); }, [init, done]);

  useEffect(() => {
    if (gState !== 'playing' || done) return;
    tRef.current = setInterval(() => {
      setTime(p => {
        if (p <= 1) { clearInterval(tRef.current); setGState('finished'); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(tRef.current);
  }, [gState, done]);

  useEffect(() => {
    if (!pz || gState === 'finished') return;
    if (Object.keys(found).length === pz.words.length && pz.words.length > 0) {
      clearInterval(tRef.current);
      setScore(s => s + Math.floor(time / 10));
      setTimeout(() => {
        setGState('finished');
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1800);
      }, 800);
    }
  }, [found, pz]);

  useEffect(() => {
    if (gState !== 'finished' || !pz || savedRef.current) return;
    savedRef.current = true;
    const fw = Object.keys(found).length;
    localStorage.setItem(key, JSON.stringify({
      score, found: fw, total: pz.words.length, playedAt: Date.now(),
    }));
    saveScore(username, slug, 'wordsearch', score);
  }, [gState, score, found, pz, key, username, slug]);

  const cur    = useMemo(() => (sel && ds ? selCells(ds, de || ds) : []), [sel, ds, de]);
  const cellAt = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y);
    return el?.dataset?.row !== undefined ? { r: +el.dataset.row, c: +el.dataset.col } : null;
  }, []);

  const onDown = useCallback((r, c, e) => {
    if (gState !== 'playing') return;
    e.preventDefault(); setSel(true); setDs({ r, c }); setDe({ r, c });
  }, [gState]);

  const onMove = useCallback(e => {
    if (!sel) return; e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const c = cellAt(x, y); if (c) setDe(c);
  }, [sel, cellAt]);

  const onUp = useCallback(() => {
    if (!sel || !ds || !pz) { setSel(false); return; }
    const cells = selCells(ds, de || ds);
    const w  = cells.map(c => pz.grid[c.r][c.c]).join('');
    const rv = w.split('').reverse().join('');
    const m  = pz.words.find(x => !found[x] && (x === w || x === rv));
    if (m) {
      const ci  = Object.keys(found).length;
      const col = WORD_COLORS[ci % WORD_COLORS.length];
      const orderedCells = w === m ? cells : [...cells].reverse();
      setFound(f => ({ ...f, [m]: col }));
      const nc = { ...fCells };
      const now = performance.now();
      orderedCells.forEach((c, i) => { nc[`${c.r},${c.c}`] = { color: col, order: i, foundAt: now }; });
      setFCells(nc);
      setScore(s => s + 10);
      setFlash(col);
      setLastFoundWord(m);
      setTimeout(() => setFlash(null), 700);
      setTimeout(() => setLastFoundWord(null), 1000);
    } else if (cells.length > 1) {
      setShake(true); setTimeout(() => setShake(false), 420);
    }
    setSel(false); setDs(null); setDe(null);
  }, [sel, ds, de, pz, found, fCells]);

  useEffect(() => {
    const up = () => { if (sel) onUp(); };
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [sel, onUp]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ── Already done ── */
  if (done) {
    return (
      <div style={W.page}>
        <TopBar onBack={onBack} title="Word Search" />
        <div style={{ padding: '0 22px', animation: 'fadeUp 0.5s var(--ease-out)' }}>
          <div className="glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 0, background: 'var(--bg2)',
              border: '1px solid var(--b2)', boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="5" y="12" width="18" height="13" rx="3" stroke="var(--text3)" strokeWidth="1.5"/>
                <path d="M9 12V9a5 5 0 0110 0v3" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>Already Completed</div>
            <div className="label" style={{ marginBottom: 28 }}>One attempt per player — your score is final</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--green-glow)', borderRadius: 0, padding: '16px 26px', border: '1px solid color-mix(in oklch, var(--green) 20%, transparent)', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--green-dim)', lineHeight: 1, letterSpacing: '-0.04em' }}>{prevScore}</div>
                <div className="label" style={{ color: 'var(--green-dim)', opacity: 0.8, marginTop: 6 }}>Points</div>
              </div>
              <div style={{ background: 'var(--cyan-glow)', borderRadius: 0, padding: '16px 26px', border: '1px solid color-mix(in oklch, var(--cyan) 20%, transparent)', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--cyan)', lineHeight: 1, letterSpacing: '-0.04em' }}>{prevFound}/{prevTotal}</div>
                <div className="label" style={{ color: 'var(--cyan)', opacity: 0.8, marginTop: 6 }}>Found</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 22px' }}>
          <button onClick={onBack} style={W.backFull}>← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!pz) return null;

  const fc   = Object.keys(found).length;
  const allF = fc === pz.words.length;
  const tC   = time <= 30 ? 'var(--red)' : time <= 60 ? 'var(--amber)' : 'var(--green)';
  const sSet = new Set(cur.map(c => `${c.r},${c.c}`));
  const pct  = (time / GAME_TIME) * 100;

  /* ── Results ── */
  if (gState === 'finished') {
    return (
      <>
        {celebrate && <Confetti />}
        <div style={W.page}>
          <TopBar onBack={onBack} title="Results" />
          <div style={{ padding: '0 22px', animation: 'scaleIn 0.45s var(--ease-out)' }}>
            <div className="grad-border" style={{ marginBottom: 16 }}>
              <div style={{ background: 'var(--bg2)', borderRadius: 0.5, padding: '26px 22px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                  {pz.words.map((w, i) => (
                    <div key={i} style={{
                      width: 30, height: 30, borderRadius: 0,
                      background: found[w] ? `color-mix(in oklch, ${found[w]} 15%, transparent)` : 'var(--danger-soft)',
                      border: `1px solid ${found[w] ? `color-mix(in oklch, ${found[w]} 34%, transparent)` : 'color-mix(in oklch, var(--red) 25%, transparent)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: found[w] || 'var(--red)',
                      animation: `popIn 0.4s var(--ease-spring) ${i * 0.04}s both`,
                    }}>
                      {found[w] ? '✓' : '✗'}
                    </div>
                  ))}
                </div>

                <div style={{
                  fontSize: 22, fontWeight: 800, color: allF ? 'var(--green-dim)' : 'var(--amber)',
                  marginBottom: 20, letterSpacing: '-0.02em',
                  animation: 'popIn 0.5s var(--ease-spring) 0.2s both',
                }}>
                  {allF ? '🎯 All Words Found!' : "⏱ Time's Up!"}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--green-glow)', borderRadius: 0, padding: '16px 28px', border: '1px solid color-mix(in oklch, var(--green) 20%, transparent)', animation: 'popIn 0.5s var(--ease-spring) 0.3s both' }}>
                    <div className="mono" style={{ fontSize: 38, fontWeight: 800, color: 'var(--green-dim)', lineHeight: 1, letterSpacing: '-0.04em' }}>{animScore}</div>
                    <div className="label" style={{ color: 'var(--green-dim)', opacity: 0.8, marginTop: 6 }}>Points</div>
                  </div>
                  <div style={{ background: 'var(--cyan-glow)', borderRadius: 0, padding: '16px 28px', border: '1px solid color-mix(in oklch, var(--cyan) 20%, transparent)', animation: 'popIn 0.5s var(--ease-spring) 0.4s both' }}>
                    <div className="mono" style={{ fontSize: 38, fontWeight: 800, color: 'var(--cyan)', lineHeight: 1, letterSpacing: '-0.04em' }}>{fc}</div>
                    <div className="label" style={{ color: 'var(--cyan)', opacity: 0.8, marginTop: 6 }}>Found</div>
                  </div>
                </div>
              </div>
            </div>

            {pz.words.length - fc > 0 && (
              <div style={{ marginBottom: 8, animation: 'fadeUp 0.5s var(--ease-out) 0.5s both' }}>
                <div className="label" style={{ marginBottom: 10 }}>Missed Words</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {pz.words.filter(w => !found[w]).map((w, i) => (
                    <span key={w} className="mono tag" style={{
                      background: 'var(--danger-soft)',
                      border: '1px solid color-mix(in oklch, var(--red) 20%, transparent)',
                      color: 'var(--red)', fontSize: 11, padding: '5px 10px',
                      animation: `popIn 0.35s var(--ease-spring) ${0.5 + i * 0.04}s both`,
                    }}>{w}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '0 22px' }}>
            <button onClick={onBack} style={W.backFull}>← Back to Dashboard</button>
          </div>
        </div>
      </>
    );
  }

  /* ── Playing ── */
  return (
    <div style={W.page}>
      <TopBar
        onBack={onBack}
        title="Word Search"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="label">SCORE</span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--cyan)', letterSpacing: '-0.02em' }}>{animScore}</span>
          </div>
        }
      />

      {/* Timer */}
      <div style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--s2)', borderRadius: 0, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: tC, borderRadius: 0,
              transition: 'width 1s linear, background 0.5s',
              boxShadow: `0 0 14px ${tC === 'var(--red)' ? 'var(--red-glow)' : tC === 'var(--amber)' ? 'var(--amber-glow)' : 'var(--green-glow)'}`,
            }} />
          </div>
          <span className="mono" style={{ fontSize: 16, color: tC, fontWeight: 800, minWidth: 52, textAlign: 'right', letterSpacing: '0.02em' }}>
            {fmt(time)}
          </span>
        </div>

        {/* Word progress segments */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          {pz.words.map((w, i) => (
            <div key={i} style={{
              width: found[w] ? 22 : 6, height: 6,
              borderRadius: 0,
              background: found[w] ? found[w] : 'var(--text4)',
              boxShadow: 'none',
              transition: 'all 0.4s var(--ease-spring)',
            }} />
          ))}
          <span className="mono" style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 10, fontWeight: 700 }}>
            {fc}/{pz.words.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{ padding: '0 12px', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        onMouseMove={onMove}
        onTouchMove={onMove}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: 3,
          width: '100%', maxWidth: 420, margin: '0 auto',
          background: flash ? `color-mix(in oklch, ${flash} 10%, var(--bg2))` : 'var(--bg2)',
          border: `2px solid ${flash ? flash : 'var(--b1)'}`,
          borderRadius: 0, padding: 8,
          boxShadow: flash
            ? `0 0 40px color-mix(in oklch, ${flash} 34%, transparent), 0 16px 40px color-mix(in oklch, var(--text) 10%, transparent)`
            : 'var(--shadow)',
          transition: 'border-color 0.4s, box-shadow 0.4s, background 0.4s',
          animation: shake ? 'shakeX 0.42s' : celebrate ? 'glowPulse 1.2s ease' : 'none',
        }}>
          {pz.grid.map((row, r) => row.map((ch, c) => {
            const k      = `${r},${c}`;
            const f      = fCells[k];
            const active = sSet.has(k);
            return (
              <div
                key={k}
                data-row={r}
                data-col={c}
                onMouseDown={e => onDown(r, c, e)}
                onTouchStart={e => onDown(r, c, e)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  aspectRatio: '1', borderRadius: 0,
                  fontSize: 'clamp(13px, 3vw, 18px)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: f || active ? 800 : 600,
                  color: f ? f.color : active ? 'var(--green-dim)' : 'var(--text)',
                  background: f
                    ? `color-mix(in oklch, ${f.color} 18%, transparent)`
                    : active ? 'var(--green-glow)' : 'var(--bg2)',
                  border: `1.5px solid ${active ? 'color-mix(in oklch, var(--green) 50%, transparent)' : f ? `color-mix(in oklch, ${f.color} 42%, transparent)` : 'transparent'}`,
                  transform: active ? 'scale(1.18)' : 'scale(1)',
                  transition: 'transform 0.12s var(--ease-out), background 0.15s, color 0.15s, border-color 0.15s',
                  cursor: 'crosshair', lineHeight: 1,
                  boxShadow: active
                    ? '0 3px 12px color-mix(in oklch, var(--green) 28%, transparent)'
                    : f ? `0 1px 3px color-mix(in oklch, ${f.color} 22%, transparent)`
                    : 'none',
                  animation: f ? `cellReveal 0.5s var(--ease-spring) ${f.order * 0.07}s both` : 'none',
                }}
              >
                {ch}
              </div>
            );
          }))}
        </div>
      </div>

      {/* Last found word toast */}
      {lastFoundWord && (
        <div style={{
          position: 'fixed', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px', borderRadius: 0,
          background: 'var(--bg2)', border: `2px solid ${WORD_COLORS[(Object.keys(found).length - 1) % WORD_COLORS.length]}`,
          boxShadow: 'var(--shadow-lg)',
          fontSize: 18, fontWeight: 800, letterSpacing: '0.05em',
          color: WORD_COLORS[(Object.keys(found).length - 1) % WORD_COLORS.length],
          fontFamily: "'JetBrains Mono', monospace",
          animation: 'toastPop 1s var(--ease-spring)',
          pointerEvents: 'none',
          zIndex: 100,
        }}>
          ✓ {lastFoundWord}
        </div>
      )}

      {/* Word list */}
      <div style={{ padding: '0 22px' }}>
        <div className="label" style={{ marginBottom: 10 }}>Target Words</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {pz.words.map((w, i) => {
            const isF = !!found[w];
            const col = WORD_COLORS[i % WORD_COLORS.length];
            return (
              <span key={w} className="mono" style={{
                padding: '6px 12px', borderRadius: 0, fontSize: 12, fontWeight: 700,
                background: isF ? `color-mix(in oklch, ${col} 14%, transparent)` : 'var(--bg2)',
                border: `1.5px solid ${isF ? `color-mix(in oklch, ${col} 32%, transparent)` : 'var(--b1)'}`,
                color: isF ? col : 'var(--text2)',
                textDecoration: isF ? 'line-through' : 'none',
                opacity: isF ? 0.8 : 1,
                transition: 'all 0.4s var(--ease-out)',
                letterSpacing: '0.04em',
                boxShadow: isF ? `2px 2px 0 0 ${col}` : 'var(--shadow-sm)',
                animation: isF ? 'wordFound 0.6s var(--ease-spring)' : 'none',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                {isF && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5L4.5 8L9 3" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="12" strokeDashoffset="12"
                      style={{ animation: 'drawCheck 0.4s var(--ease-out) 0.1s forwards' }}/>
                  </svg>
                )}
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
