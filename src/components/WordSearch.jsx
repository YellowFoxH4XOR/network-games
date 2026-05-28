import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NETWORK_KEYWORDS } from '../data.js';
import TopBar from './TopBar.jsx';
import { saveScore } from '../lib/saveScore.js';

const GRID_SIZE  = 12;
const WORD_COUNT = 10;
const GAME_TIME  = 300;

const WORD_COLORS = [
  '#00FF87', '#00D4FF', '#FFB800', '#FF4747', '#A855F7',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#4F8EF7',
];

const DIRS = [
  { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
  { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 },
];

function genPuzzle() {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const kw   = [...NETWORK_KEYWORDS].sort(() => Math.random() - 0.5).filter(w => w.length <= GRID_SIZE);
  kw.sort((a, b) => b.length - a.length);
  const placed = [];

  for (const word of kw) {
    if (placed.length >= WORD_COUNT) break;
    let ok = false;
    const sd = [...DIRS].sort(() => Math.random() - 0.5);
    for (let t = 0; t < 100 && !ok; t++) {
      const d = sd[t % 8];
      const sr = Math.floor(Math.random() * GRID_SIZE);
      const sc = Math.floor(Math.random() * GRID_SIZE);
      let fit = true;
      const cells = [];
      for (let i = 0; i < word.length; i++) {
        const r = sr + i * d.dr, c = sc + i * d.dc;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) { fit = false; break; }
        if (grid[r][c] !== null && grid[r][c] !== word[i]) { fit = false; break; }
        cells.push({ r, c });
      }
      if (fit) {
        cells.forEach((p, i) => { grid[p.r][p.c] = word[i]; });
        placed.push(word);
        ok = true;
      }
    }
  }

  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c]) grid[r][c] = L[Math.floor(Math.random() * 26)];

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
  const out  = [];
  for (let i = 0; i <= dist; i++) {
    const r = s.r + i * sr, c = s.c + i * sc;
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) out.push({ r, c });
    else break;
  }
  return out;
}

const W = {
  page: { display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100dvh', paddingBottom: 36 },
  backFull: {
    width: '100%', padding: '16px', background: 'var(--s2)',
    border: '1px solid var(--b1)', borderRadius: 16,
    color: 'var(--text2)', fontSize: 14, fontWeight: 600,
    fontFamily: 'inherit', textAlign: 'center', cursor: 'pointer',
  },
};

export default function WordSearch({ username, onBack }) {
  const key = 'sns_' + (username || 'anon') + '_ws';

  const [done, setDone]           = useState(false);
  const [prevScore, setPrevScore] = useState(0);
  const [prevFound, setPrevFound] = useState(0);
  const [prevTotal, setPrevTotal] = useState(0);

  const [pz, setPz]         = useState(null);
  const [found, setFound]   = useState({});
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
  const tRef = useRef(null);

  useEffect(() => {
    const s = localStorage.getItem(key);
    if (s) {
      const d = JSON.parse(s);
      setDone(true); setPrevScore(d.score || 0);
      setPrevFound(d.found || 0); setPrevTotal(d.total || 0);
    }
  }, [key]);

  const init = useCallback(() => {
    setPz(genPuzzle()); setFound({}); setFCells({});
    setDs(null); setDe(null); setSel(false);
    setTime(GAME_TIME); setScore(0); setGState('playing');
  }, []);

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
      setGState('finished');
      setCelebrate(true);
    }
  }, [found, pz]);

  useEffect(() => {
    if (gState !== 'finished' || !pz) return;
    const fw = Object.keys(found).length;
    localStorage.setItem(key, JSON.stringify({ score, found: fw, total: pz.words.length, playedAt: Date.now() }));
    saveScore(username, 'wordsearch', score);
  }, [gState]);

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
      setFound(f => ({ ...f, [m]: col }));
      const nc = { ...fCells };
      cells.forEach(c => { nc[`${c.r},${c.c}`] = col; });
      setFCells(nc);
      setScore(s => s + 10);
      setFlash(col); setTimeout(() => setFlash(null), 600);
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
        <div style={{ padding: '0 24px', animation: 'fadeUp 0.5s var(--ease-out)' }}>
          <div className="glass" style={{ padding: '44px 28px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, background: 'var(--s2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '1px solid var(--b2)',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="14" width="20" height="14" rx="4" stroke="var(--text3)" strokeWidth="1.5"/>
                <path d="M10 14v-4a6 6 0 0112 0v4" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text2)', marginBottom: 6, letterSpacing: '-0.02em' }}>Already Completed</div>
            <div className="label" style={{ marginBottom: 32 }}>One attempt per player — your score is final</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <div style={{ background: 'var(--green-glow)', borderRadius: 20, padding: '18px 28px', border: '1px solid rgba(0,255,135,0.15)', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: 'var(--green)', lineHeight: 1, letterSpacing: '-0.04em' }}>{prevScore}</div>
                <div className="label" style={{ color: 'var(--green)', opacity: 0.8, marginTop: 6 }}>Points</div>
              </div>
              <div style={{ background: 'var(--cyan-glow)', borderRadius: 20, padding: '18px 28px', border: '1px solid rgba(0,212,255,0.15)', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: 'var(--cyan)', lineHeight: 1, letterSpacing: '-0.04em' }}>{prevFound}/{prevTotal}</div>
                <div className="label" style={{ color: 'var(--cyan)', opacity: 0.8, marginTop: 6 }}>Found</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px' }}>
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
      <div style={W.page}>
        <TopBar onBack={onBack} title="Results" />
        <div style={{ padding: '0 24px', animation: 'scaleIn 0.45s var(--ease-out)' }}>

          <div className="grad-border" style={{ marginBottom: 16 }}>
            <div style={{ background: 'var(--bg2)', borderRadius: 19, padding: '28px 24px', textAlign: 'center' }}>
              {/* Word result dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {pz.words.map((w, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: found[w] ? `${found[w]}18` : 'rgba(255,71,71,0.08)',
                    border: `1px solid ${found[w] ? `${found[w]}35` : 'rgba(255,71,71,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: found[w] || 'var(--red)',
                  }}>
                    {found[w] ? '✓' : '✗'}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 24, fontWeight: 800, color: allF ? 'var(--green)' : 'var(--amber)', marginBottom: 20, letterSpacing: '-0.02em' }}>
                {allF ? '🎯 All Words Found!' : "⏱ Time's Up!"}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                <div style={{ background: 'var(--green-glow)', borderRadius: 16, padding: '18px 32px', border: '1px solid rgba(0,255,135,0.15)' }}>
                  <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: 'var(--green)', lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</div>
                  <div className="label" style={{ color: 'var(--green)', opacity: 0.8, marginTop: 6 }}>Points</div>
                </div>
                <div style={{ background: 'var(--cyan-glow)', borderRadius: 16, padding: '18px 32px', border: '1px solid rgba(0,212,255,0.15)' }}>
                  <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: 'var(--cyan)', lineHeight: 1, letterSpacing: '-0.04em' }}>{fc}</div>
                  <div className="label" style={{ color: 'var(--cyan)', opacity: 0.8, marginTop: 6 }}>Found</div>
                </div>
              </div>
            </div>
          </div>

          {/* Missed words */}
          {pz.words.length - fc > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="label" style={{ marginBottom: 10 }}>Missed Words</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {pz.words.filter(w => !found[w]).map(w => (
                  <span key={w} className="mono tag" style={{
                    background: 'rgba(255,71,71,0.06)',
                    border: '1px solid rgba(255,71,71,0.15)',
                    color: 'var(--red)', fontSize: 11, padding: '5px 10px',
                  }}>{w}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '0 24px' }}>
          <button onClick={onBack} style={W.backFull}>← Back to Dashboard</button>
        </div>
      </div>
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
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '-0.02em' }}>{score}</span>
          </div>
        }
      />

      {/* Timer */}
      <div style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 5, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: tC, borderRadius: 3,
              transition: 'width 1s linear, background 0.5s',
              boxShadow: `0 0 16px ${tC === 'var(--red)' ? 'var(--red-glow)' : tC === 'var(--amber)' ? 'var(--amber-glow)' : 'var(--green-glow)'}`,
            }} />
          </div>
          <span className="mono" style={{ fontSize: 16, color: tC, fontWeight: 700, minWidth: 52, textAlign: 'right', letterSpacing: '0.02em', textShadow: `0 0 10px ${tC}` }}>
            {fmt(time)}
          </span>
        </div>

        {/* Word progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          {pz.words.map((w, i) => (
            <div key={i} style={{
              width: found[w] ? 20 : 6, height: 6,
              borderRadius: 3,
              background: found[w] ? found[w] : 'var(--text4)',
              boxShadow: found[w] ? `0 0 8px ${found[w]}50` : 'none',
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
        style={{ padding: '0 8px', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        onMouseMove={onMove}
        onTouchMove={onMove}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: 1.5,
          width: '100%', maxWidth: 440, margin: '0 auto',
          background: flash ? `${flash}06` : 'var(--s1)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1.5px solid ${flash ? flash + '30' : 'var(--b1)'}`,
          borderRadius: 18, padding: 5,
          boxShadow: flash
            ? `0 0 40px ${flash}18, var(--shadow), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `var(--shadow), inset 0 1px 0 rgba(255,255,255,0.04)`,
          transition: 'border-color 0.4s, box-shadow 0.4s, background 0.4s',
          animation: shake ? 'shakeX 0.42s' : 'none',
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
                  aspectRatio: '1', borderRadius: 6,
                  fontSize: 'clamp(10px, 2.3vw, 14px)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: f || active ? 800 : 500,
                  color: f ? '#fff' : active ? 'var(--green)' : 'var(--text2)',
                  background: f
                    ? `${f}22`
                    : active ? 'rgba(0,255,135,0.14)' : 'transparent',
                  textShadow: f
                    ? `0 0 12px ${f}`
                    : active ? '0 0 10px var(--green)' : 'none',
                  border: `1px solid ${active ? 'rgba(0,255,135,0.3)' : f ? `${f}28` : 'transparent'}`,
                  transform: active ? 'scale(1.14)' : 'scale(1)',
                  transition: 'transform 0.08s var(--ease-out), background 0.12s, color 0.12s, text-shadow 0.12s',
                  cursor: 'crosshair', lineHeight: 1,
                  boxShadow: active ? '0 0 8px rgba(0,255,135,0.2)' : 'none',
                }}
              >
                {ch}
              </div>
            );
          }))}
        </div>
      </div>

      {/* Word list */}
      <div style={{ padding: '0 24px' }}>
        <div className="label" style={{ marginBottom: 12 }}>Target Words</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {pz.words.map((w, i) => {
            const isF = !!found[w];
            const col = WORD_COLORS[i % WORD_COLORS.length];
            return (
              <span key={w} className="mono" style={{
                padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                background: isF ? `${col}12` : 'var(--s2)',
                border: `1px solid ${isF ? `${col}30` : 'var(--b1)'}`,
                color: isF ? col : 'var(--text3)',
                textDecoration: isF ? 'line-through' : 'none',
                opacity: isF ? 0.6 : 1,
                transition: 'all 0.35s var(--ease-out)',
                letterSpacing: '0.04em',
                textShadow: isF ? `0 0 12px ${col}50` : 'none',
              }}>
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
