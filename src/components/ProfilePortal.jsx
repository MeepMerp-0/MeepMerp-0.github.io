// components/ProfilePortal.jsx
export default function ProfilePortal({ size = 300, opacity = 1, photoSrc }) {
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
      `}</style>

      <div style={{
        position: 'relative',
        width: svgSize,
        height: svgSize,
        flexShrink: 0,
        opacity,
      }}>

        {/*
         * WHY SVG animateTransform:
         * ─────────────────────────
         * Every CSS approach tried so far either:
         *   (a) hid the dots behind the avatar when the animation wasn't applied
         *   (b) relied on parent-child transform inheritance that breaks on desktop
         *
         * SVG animateTransform type="rotate" with explicit "angle cx cy" syntax
         * is self-contained, has no transform-origin ambiguity, creates no new
         * stacking context, and is unaffected by ancestor CSS transforms.
         * It's the browser-native API designed exactly for this use case.
         *
         * Dot starts at its SVG position (e.g. cx, cy - outerR = 12 o'clock)
         * and animateTransform rotates it around (cx, cy) — the circle center.
         */}
        <svg
          width={svgSize}
          height={svgSize}
          style={{ position: 'absolute', inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow filters — namespaced with size to avoid multi-instance collisions */}
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

          {/* Outer ring */}
          <circle
            cx={cx} cy={cy} r={outerR}
            fill="none"
            stroke="var(--accent-border)"
            strokeWidth="1"
          />

          {/* Inner ring */}
          <circle
            cx={cx} cy={cy} r={innerR}
            fill="none"
            stroke="var(--accent-border)"
            strokeWidth="1"
          />

          {/*
           * Outer dot — CW orbit, starts at 12 o'clock.
           * cx, cy - outerR = top of the outer ring.
           * animateTransform rotates from 0→360 around (cx, cy).
           */}
          <circle
            cx={cx}
            cy={cy - outerR}
            r={3}
            fill="var(--cyan)"
            filter={`url(#pp-gc-${size})`}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="28s"
              repeatCount="indefinite"
            />
          </circle>

          {/*
           * Inner dot — CCW orbit, starts at 6 o'clock.
           * cx, cy + innerR = bottom of the inner ring.
           * animateTransform rotates from 0→-360 (counter-clockwise).
           */}
          <circle
            cx={cx}
            cy={cy + innerR}
            r={2}
            fill="var(--blue)"
            filter={`url(#pp-gb-${size})`}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`-360 ${cx} ${cy}`}
              dur="18s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        {/* Breath ring — HTML div so pp-breath CSS animation works cleanly */}
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