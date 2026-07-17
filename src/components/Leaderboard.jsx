import { useState, useEffect } from 'react';
import TopBar from './TopBar.jsx';

const RANK_COLOR = {
  1: 'var(--amber)',
  2: 'var(--cyan)',
  3: 'var(--violet)',
};

function Row({ entry, isMe }) {
  const color = RANK_COLOR[entry.rank] || 'var(--text3)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 16px', borderRadius: 'var(--r-md)',
      background: isMe ? 'var(--green-glow)' : 'var(--bg2)',
      border: `1px solid ${isMe ? 'color-mix(in oklch, var(--green) 32%, transparent)' : 'var(--b1)'}`,
      boxShadow: isMe ? '0 0 24px var(--green-glow), var(--shadow-sm)' : 'var(--shadow-sm)',
    }}>
      <span className="mono" style={{
        width: 30, textAlign: 'center', flexShrink: 0,
        fontSize: 16, fontWeight: 800, color,
      }}>
        {entry.rank}
      </span>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700,
        color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        @{entry.username}
        {isMe && <span className="tag tag-green" style={{ marginLeft: 8 }}>YOU</span>}
      </span>
      <span className="mono" style={{ fontSize: 16, fontWeight: 800, color, flexShrink: 0 }}>
        {entry.score}
      </span>
    </div>
  );
}

function Toggle({ mode, setMode }) {
  const opt = (key, label) => (
    <button
      onClick={() => setMode(key)}
      style={{
        flex: 1, padding: '10px 10px', borderRadius: 'var(--r-full)', cursor: 'pointer',
        fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
        background: mode === key ? 'var(--grad-green)' : 'transparent',
        color: mode === key ? 'var(--on-accent)' : 'var(--text2)',
        border: 'none',
        boxShadow: mode === key ? '0 6px 18px -6px var(--green-glow2)' : 'none',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      background: 'var(--s1)', border: '1px solid var(--b1)',
      borderRadius: 'var(--r-full)',
    }}>
      {opt('stall', 'This stall')}
      {opt('overall', 'Overall')}
    </div>
  );
}

export default function Leaderboard({ username, stall, onBack }) {
  const [mode, setMode]   = useState('stall');
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    // 'This stall' needs a stall; if we somehow don't have one, fall back to overall.
    const effectiveMode = mode === 'stall' && !stall?.slug ? 'overall' : mode;
    let cancelled = false;
    const params = new URLSearchParams({ username: username || '', mode: effectiveMode });
    if (effectiveMode === 'stall') params.set('stall', stall.slug);
    fetch(`/api/rankings?${params.toString()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then(data => { if (!cancelled) setState({ status: 'ready', data }); })
      .catch(() => { if (!cancelled) setState({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [username, mode, stall]);

  const { status, data } = state;
  const meInTop = data?.me && data.top.some(t => t.username === data.me.username);
  const heading = mode === 'overall'
    ? 'TOP 5 · ALL STALLS'
    : `TOP 5 · ${(data?.stallName || stall?.name || 'STALL').toUpperCase()}`;

  return (
    <div className="screen" style={{ padding: '0 0 32px' }}>
      <TopBar onBack={onBack} title="Leaderboard" />

      <div style={{ padding: '20px 22px 0', animation: 'fadeUp 0.5s var(--ease-out)' }}>
        <Toggle mode={mode} setMode={setMode} />
      </div>

      <div style={{ padding: '18px 22px 0', animation: 'fadeUp 0.5s var(--ease-out)' }}>
        <div className="divider">{heading}</div>
      </div>

      <div style={{ padding: '16px 22px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {status === 'loading' && (
          <p className="mono" style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: '24px 0' }}>
            Loading rankings…
          </p>
        )}

        {status === 'error' && (
          <p className="mono" style={{ textAlign: 'center', color: 'var(--red)', fontSize: 12, padding: '24px 0' }}>
            Couldn’t load the leaderboard. Try again.
          </p>
        )}

        {status === 'ready' && data.top.length === 0 && (
          <p className="mono" style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: '24px 0' }}>
            No scores yet — be the first to play.
          </p>
        )}

        {status === 'ready' && data.top.map(entry => (
          <Row key={entry.username} entry={entry} isMe={data.me?.username === entry.username} />
        ))}
      </div>

      {/* Your position — only when ranked but outside the top 5 */}
      {status === 'ready' && data.me && !meInTop && (
        <>
          <div style={{ padding: '22px 22px 0' }}>
            <div className="divider">YOUR POSITION</div>
          </div>
          <div style={{ padding: '16px 22px 0' }}>
            <Row entry={data.me} isMe />
          </div>
        </>
      )}

      {/* Unranked hint */}
      {status === 'ready' && !data.me && data.top.length > 0 && (
        <p className="mono" style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 11, padding: '22px 22px 0', lineHeight: 1.7 }}>
          Play a challenge to earn your spot on the board.
        </p>
      )}

      {status === 'ready' && (
        <p className="mono" style={{ textAlign: 'center', color: 'var(--text4)', fontSize: 10, padding: '24px 22px 0', letterSpacing: '0.08em' }}>
          {data.totalPlayers} PLAYER{data.totalPlayers === 1 ? '' : 'S'} RANKED · {mode === 'overall' ? 'ACROSS ALL STALLS' : 'THIS STALL'}
        </p>
      )}
    </div>
  );
}
