import { useState, useEffect, useCallback } from 'react';

const MEDAL = ['🥇', '🥈', '🥉'];

const EMPTY_ONE = {
  combined: [], quiz: [], wordsearch: [], memory: [], ztp: [], spin: [],
  totalPlayers: 0, quizEntries: 0, wordsearchEntries: 0, memoryEntries: 0, ztpEntries: 0, spinEntries: 0,
};
const EMPTY_DATA = { stalls: [], boards: { all: EMPTY_ONE } };

// Fetch the admin console data ({ stalls, boards, fetchedAt }). Returns the
// string 'unauthorized' on a 401 so the caller can log the admin out.
async function loadBoard() {
  const token = sessionStorage.getItem('sns_admin_token') || '';
  const res = await fetch('/api/leaderboard', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) return 'unauthorized';
  if (!res.ok) throw new Error(`status ${res.status}`); // e.g. 500 → caller keeps prior data
  return res.json();
}

function RankRow({ rank, username, score, color, tag, delay = 0 }) {
  const isTop3 = rank <= 3;
  const tint = (amount) => `color-mix(in oklch, ${color} ${amount}%, transparent)`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 16px', borderRadius: 'var(--r-md)',
      background: isTop3 ? tint(8) : 'var(--s1)',
      border: `1px solid ${isTop3 ? tint(20) : 'var(--b1)'}`,
      animation: `fadeUp 0.4s var(--ease-out) ${delay}s both`,
      transition: 'background 0.2s',
    }}>
      {/* Rank */}
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--r-xs)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isTop3 ? tint(18) : 'var(--s2)',
        border: `1px solid ${isTop3 ? tint(30) : 'var(--b1)'}`,
        fontSize: isTop3 ? 16 : 13,
        fontFamily: isTop3 ? 'inherit' : "'JetBrains Mono', monospace",
        fontWeight: 700,
        color: isTop3 ? color : 'var(--text3)',
      }}>
        {isTop3 ? MEDAL[rank - 1] : rank}
      </div>

      {/* Username (+ stall tag on cross-stall views) */}
      <span style={{
        flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700,
        color: isTop3 ? 'var(--text)' : 'var(--text2)',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.02em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        @{username}
        {tag && (
          <span style={{
            marginLeft: 8, padding: '2px 7px', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.08em', color: 'var(--text3)',
            background: 'var(--s2)', border: '1px solid var(--b1)',
            verticalAlign: 'middle',
          }}>
            {tag.toUpperCase()}
          </span>
        )}
      </span>

      {/* Score */}
      <span style={{
        fontSize: 16, fontWeight: 800,
        color: isTop3 ? color : 'var(--text3)',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '-0.02em',
        textShadow: isTop3 ? `0 0 12px ${tint(40)}` : 'none',
      }}>
        {score}
      </span>
    </div>
  );
}

function Board({ title, subtitle, rows, total, color, icon, loading, stallNames, showStallTags }) {
  const tint = (amount) => `color-mix(in oklch, ${color} ${amount}%, transparent)`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Board header */}
      <div style={{
        padding: '16px 20px',
        background: tint(8),
        border: `1px solid ${tint(20)}`,
        borderRadius: 'var(--r-lg)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--r-md)',
          background: tint(15), border: `1px solid ${tint(25)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</div>
          <div className="label" style={{ color, opacity: 0.8, marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className="mono" style={{ fontSize: 11, color, fontWeight: 700 }}>{total} entries</span>
        </div>
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }}/>
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
          No entries yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row, i) => (
            <RankRow
              // Cross-stall game boards can repeat a username (one row per
              // stall) — suffix the index to keep keys unique.
              key={`${row.username}-${i}`}
              rank={i + 1}
              username={row.username}
              score={row.score}
              color={color}
              tag={showStallTags && row.stall ? (stallNames[row.stall] || row.stall) : null}
              delay={i * 0.04}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminView({ onLogout }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLast] = useState(null);
  const [tab, setTab]         = useState('combined'); // 'combined' | 'quiz' | 'wordsearch'
  const [scope, setScope]     = useState('all');      // 'all' | stall slug
  const [confirmShuffle, setConfirmShuffle] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  // Used by the manual Refresh button and the auto-refresh interval. Every
  // state update happens after `await`, never synchronously. `loading` starts
  // true for the first paint, and the Refresh button flips it on at the call site.
  const fetchData = useCallback(async () => {
    try {
      const json = await loadBoard();
      if (json === 'unauthorized') { onLogout(); return; }
      setData(json);
      setLast(new Date());
    } catch {
      setData(prev => prev ?? EMPTY_DATA); // transient failure: keep what we have
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  // Initial load + 30s auto-refresh. The mount fetch runs inline so its state
  // updates only happen after `await` (never synchronously in the effect body),
  // and `alive` guards against setting state after unmount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const json = await loadBoard();
        if (!alive) return;
        if (json === 'unauthorized') { onLogout(); return; }
        setData(json);
        setLast(new Date());
      } catch {
        if (alive) setData(prev => prev ?? EMPTY_DATA); // keep prior data on a blip
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const id = setInterval(fetchData, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, [fetchData, onLogout]);

  // Regenerate every stall's entry code. Two-step confirm in the UI because old
  // codes stop working the moment this returns.
  const shuffleCodes = async () => {
    setShuffling(true);
    try {
      const token = sessionStorage.getItem('sns_admin_token') || '';
      const res = await fetch('/api/shuffle-codes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      setData(prev => prev ? {
        ...prev,
        stalls: prev.stalls.map(s => {
          const next = json.stalls.find(n => n.slug === s.slug);
          return next ? { ...s, code: next.code } : s;
        }),
      } : prev);
      setLast(new Date());
    } catch {
      // Old codes still shown; the next refresh shows the server's truth.
    } finally {
      setShuffling(false);
      setConfirmShuffle(false);
    }
  };

  const tabs = [
    { id: 'combined',    label: 'Combined',    icon: '🏆', color: 'var(--amber)' },
    { id: 'quiz',        label: 'Quiz',        icon: '❓', color: 'var(--green)' },
    { id: 'wordsearch',  label: 'Word Search', icon: '🔍', color: 'var(--cyan)' },
    { id: 'spin',        label: 'Spin Wheel',  icon: '🎡', color: 'var(--amber)' },
    { id: 'memory',      label: 'Memory',      icon: '🧠', color: 'var(--violet)' },
    { id: 'ztp',         label: 'ZTP Ball',    icon: '🏀', color: 'var(--amber)' },
  ];

  const activeTab = tabs.find(t => t.id === tab) || tabs[0];
  const stalls = data?.stalls ?? [];
  const stallNames = Object.fromEntries(stalls.map(s => [s.slug, s.name]));
  const board = data?.boards?.[scope] ?? data?.boards?.all ?? EMPTY_ONE;
  const scopeLabel = scope === 'all' ? 'ALL STALLS' : (stallNames[scope] || scope).toUpperCase();

  const btn = {
    padding: '8px 16px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
  };

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid var(--b1)',
        background: 'var(--chrome)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fadeDown 0.4s var(--ease-out)',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em' }}>
            <span className="grad-text">Admin</span>{' '}
            <span style={{ color: 'var(--text)' }}>Console</span>
          </div>
          <div className="label" style={{ marginTop: 3 }}>
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            style={{ ...btn, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--s2)'}
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
            Refresh
          </button>
          <button
            onClick={onLogout}
            style={{ ...btn, background: 'var(--danger-soft)', border: '1px solid color-mix(in oklch, var(--red) 22%, transparent)', color: 'var(--red)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--red) 15%, transparent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--danger-soft)'}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px 0' }}>

        {/* Stall entry codes */}
        {stalls.length > 0 && (
          <div style={{ marginBottom: 24, animation: 'fadeUp 0.5s var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <span className="label">STALL ENTRY CODES — SHARE AT EACH BOOTH</span>
              {!confirmShuffle ? (
                <button
                  onClick={() => setConfirmShuffle(true)}
                  style={{ ...btn, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text)' }}
                >
                  ⟳ Shuffle codes
                </button>
              ) : (
                <span style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={shuffleCodes}
                    disabled={shuffling}
                    style={{ ...btn, background: 'var(--red)', border: 'none', color: 'var(--ink)', boxShadow: '0 8px 22px -8px var(--red-glow)', opacity: shuffling ? 0.7 : 1, cursor: shuffling ? 'wait' : 'pointer' }}
                  >
                    {shuffling ? 'Shuffling…' : 'Confirm — old codes stop working'}
                  </button>
                  <button
                    onClick={() => setConfirmShuffle(false)}
                    disabled={shuffling}
                    style={{ ...btn, background: 'var(--bg2)', border: '1px solid var(--b2)', color: 'var(--text2)' }}
                  >
                    Cancel
                  </button>
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {stalls.map(s => (
                <div key={s.slug} style={{
                  padding: '14px 16px', background: 'var(--bg2)',
                  border: '1px solid var(--b2)', borderRadius: 'var(--r-lg)',
                  boxShadow: 'var(--shadow-sm)', textAlign: 'center',
                }}>
                  <div className="label" style={{ marginBottom: 8 }}>{s.name}</div>
                  <div className="mono" style={{
                    fontSize: 24, fontWeight: 800, letterSpacing: '0.18em',
                    color: 'var(--green-dim)', lineHeight: 1,
                  }}>
                    {s.code}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text4)', marginTop: 8, letterSpacing: '0.06em' }}>
                    {s.players} PLAYER{s.players === 1 ? '' : 'S'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stall scope selector */}
        {stalls.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: '4px', background: 'var(--s1)', borderRadius: 'var(--r-full)', border: '1px solid var(--b1)' }}>
            {[{ slug: 'all', name: 'All stalls' }, ...stalls].map(s => (
              <button
                key={s.slug}
                onClick={() => setScope(s.slug)}
                style={{
                  flex: 1, padding: '9px 8px',
                  background: scope === s.slug ? 'var(--s3)' : 'transparent',
                  border: scope === s.slug ? '1px solid var(--b2)' : '1px solid transparent',
                  borderRadius: 'var(--r-full)', cursor: 'pointer',
                  color: scope === s.slug ? 'var(--text)' : 'var(--text3)',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  transition: 'all 0.2s var(--ease-out)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Stats strip (scoped) */}
        {data && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10,
            marginBottom: 24, animation: 'fadeUp 0.5s var(--ease-out)',
          }}>
            {[
              { label: 'Players Scored', value: board.totalPlayers || 0,      color: 'var(--violet)' },
              { label: 'Quiz Entries',   value: board.quizEntries || 0,       color: 'var(--green)' },
              { label: 'Search Entries', value: board.wordsearchEntries || 0, color: 'var(--cyan)' },
              { label: 'Memory Entries', value: board.memoryEntries || 0,     color: 'var(--violet)' },
              { label: 'ZTP Entries',    value: board.ztpEntries || 0,        color: 'var(--amber)' },
              { label: 'Spin Entries',   value: board.spinEntries || 0,       color: 'var(--amber)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '14px 16px', background: 'var(--s2)',
                border: '1px solid var(--b1)', borderRadius: 'var(--r-md)', textAlign: 'center',
              }}>
                <div className="mono" style={{ fontSize: 24, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
                <div className="label" style={{ marginTop: 6, fontSize: 9 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: '4px', background: 'var(--s1)', borderRadius: 'var(--r-full)', border: '1px solid var(--b1)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px',
                background: tab === t.id ? 'var(--s3)' : 'transparent',
                border: tab === t.id ? `1px solid var(--b2)` : '1px solid transparent',
                borderRadius: 'var(--r-full)', cursor: 'pointer',
                color: tab === t.id ? 'var(--text)' : 'var(--text3)',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s var(--ease-out)',
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Active board */}
        <Board
          key={`${scope}-${tab}`}
          title={`${activeTab.icon} ${activeTab.label}`}
          subtitle={`TOP 10 · ${scopeLabel}`}
          // An API deployed before a game existed returns no key for it, so the
          // console must render an empty board rather than crash on undefined.
          rows={board[tab] ?? []}
          total={(tab === 'combined' ? board.totalPlayers : board[`${tab}Entries`]) ?? 0}
          color={activeTab.color}
          icon={activeTab.icon}
          loading={loading}
          stallNames={stallNames}
          showStallTags={scope === 'all' && tab !== 'combined'}
        />

        {/* Footer */}
        <div className="mono" style={{ textAlign: 'center', fontSize: 10, color: 'var(--text4)', marginTop: 32, letterSpacing: '0.08em', lineHeight: 1.8 }}>
          SNS ADMIN CONSOLE · AUTO-REFRESHES EVERY 30s<br/>
          SHUFFLING CODES TAKES EFFECT IMMEDIATELY — PLAYERS ALREADY INSIDE KEEP PLAYING
        </div>
      </div>
    </div>
  );
}
