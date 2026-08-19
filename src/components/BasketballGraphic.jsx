// High-detail SVG Basketball Component with real leather texture gradients, seams & ribs
export function BasketballGraphic({ size = 56, rotation = 0 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 32% 32%, #f97316 0%, #c2410c 60%, #7c2d12 100%)',
        boxShadow: '0 8px 24px rgba(194, 65, 12, 0.5), inset 0 2px 5px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.05s linear',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 60 60" style={{ position: 'absolute', inset: 0 }}>
        {/* Basketball Black Rubber Seams */}
        <circle cx="30" cy="30" r="28.5" fill="none" stroke="#1c1917" strokeWidth="2.5" />
        
        {/* Horizontal Seam */}
        <line x1="1.5" y1="30" x2="58.5" y2="30" stroke="#1c1917" strokeWidth="2.5" />
        
        {/* Vertical Center Seam */}
        <line x1="30" y1="1.5" x2="30" y2="58.5" stroke="#1c1917" strokeWidth="2.5" />
        
        {/* Left Curved Rib */}
        <path d="M 12 4 C 24 16, 24 44, 12 56" fill="none" stroke="#1c1917" strokeWidth="2.5" />
        
        {/* Right Curved Rib */}
        <path d="M 48 4 C 36 16, 36 44, 48 56" fill="none" stroke="#1c1917" strokeWidth="2.5" />

        {/* Dynamic Specular Leather Highlight */}
        <ellipse cx="22" cy="16" rx="8" ry="4" fill="#ffffff" opacity="0.25" transform="rotate(-25 22 16)" />
      </svg>
    </div>
  );
}
