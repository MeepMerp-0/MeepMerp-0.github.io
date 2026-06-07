// components/ProfilePortal.jsx

const LIGHT_SRC = "https://pub-c10ba7365a8240d2a24c50e217e1da90.r2.dev/personal/profile-avatar-github/jdsW.jpg";
const DARK_SRC = "https://pub-c10ba7365a8240d2a24c50e217e1da90.r2.dev/personal/profile-avatar-github/jdsB.jpg";

export default function ProfilePortal({ size = 300, opacity = 1 }) {
  const outerR = size / 2 + Math.max(8, size * 0.07);
  const innerR = size / 2 + Math.max(4, size * 0.03);
  const svgSize = outerR * 2 + 20;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  return (
    <>
      <style>{`
        @keyframes pp-breath {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.18; }
        }
        .pp-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.6s ease;
        }
        /* Default: dark theme shows dark image */
        .pp-img-light { opacity: 0; }
        .pp-img-dark  { opacity: 1; }

        /* Light theme: swap */
        [data-theme="light"] .pp-img-light { opacity: 1; }
        [data-theme="light"] .pp-img-dark  { opacity: 0; }

        /* System preference fallback (no data-theme set) */
        @media (prefers-color-scheme: light) {
          :not([data-theme]) .pp-img-light { opacity: 1; }
          :not([data-theme]) .pp-img-dark  { opacity: 0; }
        }
      `}</style>

      <div style={{
        position: 'relative',
        width: svgSize,
        height: svgSize,
        flexShrink: 0,
        opacity,
      }}>

        <svg
          width={svgSize}
          height={svgSize}
          style={{ position: 'absolute', inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id={`pp-gc-${size}`} x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={`pp-gb-${size}`} x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--accent-border)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--accent-border)" strokeWidth="1" />

          <circle cx={cx} cy={cy - outerR} r={3} fill="var(--cyan)" filter={`url(#pp-gc-${size})`}>
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="28s" repeatCount="indefinite" />
          </circle>

          <circle cx={cx} cy={cy + innerR} r={2} fill="var(--blue)" filter={`url(#pp-gb-${size})`}>
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${cx} ${cy}`} to={`-360 ${cx} ${cy}`} dur="18s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Breath ring */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: size, height: size,
          marginTop: -(size / 2), marginLeft: -(size / 2),
          borderRadius: '50%',
          border: '1.5px solid var(--accent-border-hover)',
          animation: 'pp-breath 8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Avatar with crossfade */}
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
          <img src={LIGHT_SRC} alt="Jason Selerio" className="pp-img pp-img-light" />
          <img src={DARK_SRC} alt="Jason Selerio" className="pp-img pp-img-dark" />
        </div>

      </div>
    </>
  );
}