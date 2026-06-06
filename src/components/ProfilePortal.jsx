// components/ProfilePortal.jsx
export default function ProfilePortal({ size = 300, opacity = 1, photoSrc }) {
  const outerR = size / 2 + Math.max(8, size * 0.07);
  const innerR = size / 2 + Math.max(4, size * 0.03);
  const containerSize = outerR * 2 + 20;

  return (
    <>
      <style>{`
        @keyframes pp-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pp-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes pp-breath {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 0.18; transform: scale(1.04); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        width: containerSize,
        height: containerSize,
        flexShrink: 0,
        opacity,
      }}>

        {/* Outer orbit ring — CW */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: outerR * 2, height: outerR * 2,
          marginTop: -outerR, marginLeft: -outerR,
          borderRadius: '50%',
          border: '1px solid var(--accent-border)',
          animation: 'pp-cw 28s linear infinite',
        }}>
          {/* Dot sits at top of ring, orbits with parent rotation */}
          <div style={{
            position: 'absolute',
            top: -4, left: '50%',
            marginLeft: -3,
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'var(--cyan)',
            boxShadow: '0 0 6px var(--cyan)',
          }} />
        </div>

        {/* Inner orbit ring — CCW */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: innerR * 2, height: innerR * 2,
          marginTop: -innerR, marginLeft: -innerR,
          borderRadius: '50%',
          border: '1px solid var(--accent-border)',
          animation: 'pp-ccw 18s linear infinite',
        }}>
          <div style={{
            position: 'absolute',
            bottom: -3, left: '50%',
            marginLeft: -2,
            width: 4, height: 4,
            borderRadius: '50%',
            background: 'var(--blue)',
            boxShadow: '0 0 4px var(--blue)',
          }} />
        </div>

        {/* Breath ring */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: size, height: size,
          marginTop: -(size / 2), marginLeft: -(size / 2),
          borderRadius: '50%',
          border: '1.5px solid var(--accent-border-hover)',
          animation: 'pp-breath 8s ease-in-out infinite',
        }} />

        {/* Avatar */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: size, height: size,
          marginTop: -(size / 2), marginLeft: -(size / 2),
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1.5px solid var(--accent-border-hover)',
          boxShadow: 'var(--shadow)',
          background: 'linear-gradient(145deg, var(--bg2), var(--bg3))',
        }}>
          {photoSrc && (
            <img
              src={photoSrc}
              alt="Jason Selerio"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

      </div>
    </>
  );
}