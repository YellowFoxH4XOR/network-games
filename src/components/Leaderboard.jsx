import { useState, useEffect } from 'react';
import TopBar from './TopBar.jsx';

const RANK_COLOR = {
  1: 'var(--green)',
  2: 'var(--cyan)',
  3: 'var(--blue)',
};

function Row({ entry, isMe }) {
  const color = RANK_COLOR[entry.rank] || 'var(--text3)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 16px', borderRadius: 0,
      background: isMe ? 'var(--green-glow)' : 'var(--bg2)',
      border: `1px solid ${isMe ? 'color-mix(in oklch, var(--green) 32%, transparent)' : 'var(--b1)'}`,
      boxShadow: 'var(--shadow-sm)',
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

export default function Leaderboard({ username, onBack }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rankings?username=${encodeURIComponent(username || '')}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then(data => { if (!cancelled) setState({ status: 'ready', data }); })
      .catch(() => { if (!cancelled) setState({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [username]);

  const { status, data } = state;
  const meInTop = data?.me && data.top.some(t => t.username === data.me.username);

  return (
    <div className="screen" style={{ padding: '0 0 32px' }}>
      <TopBar onBack={onBack} title="Leaderboard" />

      <div style={{ padding: '20px 22px 0', animation: 'fadeUp 0.5s var(--ease-out)' }}>
        <div className="divider">TOP 5 · OVERALL</div>
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
          {data.totalPlayers} PLAYER{data.totalPlayers === 1 ? '' : 'S'} RANKED · COMBINED SCORE
        </p>
      )}
    </div>
  );
}
