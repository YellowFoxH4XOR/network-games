export default function TopBar({ onBack, title, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: '1px solid var(--b1)',
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      animation: 'fadeDown 0.4s var(--ease-out)',
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--text2)', fontSize: 13, fontWeight: 600,
          padding: '8px 12px', borderRadius: 10,
          background: 'var(--bg2)', border: '1px solid var(--b1)',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          transition: 'all 0.2s var(--ease-out)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text2)'; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
        {title}
      </span>

      <div style={{ minWidth: 80, display: 'flex', justifyContent: 'flex-end' }}>
        {right || ''}
      </div>
    </div>
  );
}
