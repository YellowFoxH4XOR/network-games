import { useState, useEffect, useCallback } from 'react';

const MEDAL = ['🥇', '🥈', '🥉'];

function RankRow({ rank, username, score, color, delay = 0 }) {
  const isTop3 = rank <= 3;
  const tint = (amount) => `color-mix(in oklch, ${color} ${amount}%, transparent)`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 16px', borderRadius: 14,
      background: isTop3 ? tint(8) : 'var(--s1)',
      border: `1px solid ${isTop3 ? tint(20) : 'var(--b1)'}`,
      animation: `fadeUp 0.4s var(--ease-out) ${delay}s both`,
      transition: 'background 0.2s',
    }}>
      {/* Rank */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
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

      {/* Username */}
      <span style={{
        flex: 1, fontSize: 14, fontWeight: 700,
        color: isTop3 ? 'var(--text)' : 'var(--text2)',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.02em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        @{username}
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

function Board({ title, data, color, icon, loading }) {
  const tint = (amount) => `color-mix(in oklch, ${color} ${amount}%, transparent)`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Board header */}
      <div style={{
        padding: '16px 20px',
        background: tint(8),
        border: `1px solid ${tint(20)}`,
        borderRadius: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: tint(15), border: `1px solid ${tint(25)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</div>
          <div className="label" style={{ color, opacity: 0.8, marginTop: 2 }}>TOP 10 SCORES</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className="mono" style={{ fontSize: 11, color, fontWeight: 700 }}>{data.length} entries</span>
        </div>
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: color, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }}/>
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
          No entries yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((row, i) => (
            <RankRow
              key={row.username}
              rank={i + 1}
              username={row.username}
              score={row.score}
              color={color}
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = sessionStorage.getItem('sns_admin_token') || '';
    try {
      const res = await fetch('/api/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.status === 401) { onLogout(); return; }
      const json = await res.json();
      setData(json);
      setLast(new Date());
    } catch {
      setData({ quiz: [], wordsearch: [], combined: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const tabs = [
    { id: 'combined',    label: 'Combined',   icon: '🏆', color: 'var(--amber)' },
    { id: 'quiz',        label: 'Quiz',        icon: '❓', color: 'var(--green)' },
    { id: 'wordsearch',  label: 'Word Search', icon: '🔍', color: 'var(--cyan)' },
  ];

  const activeTab = tabs.find(t => t.id === tab);
  const boardData = data ? (tab === 'combined' ? data.combined : data[tab]) : [];

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
            <span style={{ color: 'var(--text)' }}>Leaderboard</span>
          </div>
          <div className="label" style={{ marginTop: 3 }}>
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: 'var(--s2)', border: '1px solid var(--b2)',
              color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--s3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--s2)'}
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
            Refresh
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: 'var(--danger-soft)', border: '1px solid color-mix(in oklch, var(--red) 22%, transparent)',
              color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--red) 15%, transparent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--danger-soft)'}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px 0' }}>

        {/* Stats strip */}
        {data && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            marginBottom: 24, animation: 'fadeUp 0.5s var(--ease-out)',
          }}>
            {[
              { label: 'Total Players', value: data.combined.length, color: 'var(--violet)' },
              { label: 'Quiz Entries',  value: data.quiz.length,      color: 'var(--green)' },
              { label: 'Search Entries', value: data.wordsearch.length, color: 'var(--cyan)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: '14px 16px', background: 'var(--s2)',
                border: '1px solid var(--b1)', borderRadius: 14, textAlign: 'center',
              }}>
                <div className="mono" style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
                <div className="label" style={{ marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: '4px', background: 'var(--s1)', borderRadius: 14, border: '1px solid var(--b1)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px',
                background: tab === t.id ? 'var(--s3)' : 'transparent',
                border: tab === t.id ? `1px solid var(--b2)` : '1px solid transparent',
                borderRadius: 11, cursor: 'pointer',
                color: tab === t.id ? 'var(--text)' : 'var(--text3)',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s var(--ease-out)',
              }}
            >
              <span>{t.icon}</span>
              <span style={{ display: 'none', ['@media(minWidth:360px)']: { display: 'inline' } }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Active board */}
        <Board
          key={tab}
          title={`${activeTab.icon} ${activeTab.label}`}
          data={boardData}
          color={activeTab.color}
          icon={activeTab.icon}
          loading={loading}
        />

        {/* Footer */}
        <div className="mono" style={{ textAlign: 'center', fontSize: 10, color: 'var(--text4)', marginTop: 32, letterSpacing: '0.08em', lineHeight: 1.8 }}>
          ADMIN@SNSDAYS.COM · AUTO-REFRESHES EVERY 30s<br/>
          EMAILS PARTIALLY MASKED FOR PRIVACY
        </div>
      </div>
    </div>
  );
}
