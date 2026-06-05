// components/HudFrame.jsx
// Fixed fiber-optic sweep: pill is position:absolute, starts at left:-260px,
// animates to translateX(100vw) via fiberH keyframe. Overflow:hidden on track clips it.
// Vertical same logic with fiberV.

export default function HudFrame() {
  // Corner brackets
  const corners = [
    { top: 18, left: 18, borderTop: '1.5px solid var(--cyan)', borderLeft: '1.5px solid var(--cyan)', delay: '0s' },
    { top: 18, right: 18, borderTop: '1.5px solid var(--cyan)', borderRight: '1.5px solid var(--cyan)', delay: '2s' },
    { bottom: 18, left: 18, borderBottom: '1.5px solid var(--cyan)', borderLeft: '1.5px solid var(--cyan)', delay: '4s' },
    { bottom: 18, right: 18, borderBottom: '1.5px solid var(--cyan)', borderRight: '1.5px solid var(--cyan)', delay: '6s' },
  ];

  // Vertical fiber lines
  const vLines = [
    { left: 19, dur: '18s', delay: '3s', op: 0.55, pillColor: 'linear-gradient(180deg,transparent,var(--fiber-color-1) 30%,var(--fiber-color-2) 60%,transparent)' },
    { right: 19, dur: '22s', delay: '9s', op: 0.45, pillColor: 'linear-gradient(180deg,transparent,var(--fiber-color-3) 35%,var(--fiber-color-4) 65%,transparent)' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}>

      {/* ── Corner brackets — opacity breath ── */}
      {corners.map(({ delay, ...s }, i) => (
        <div key={i} style={{
          position: 'absolute', width: 30, height: 30,
          animation: `bracketBreath 12s ease-in-out infinite`,
          animationDelay: delay,
          willChange: 'opacity',
          ...s,
        }} />
      ))}

      {/* ── Static tick marks ── */}
      {[0.18, 0.38, 0.62, 0.82].map((pos, i) => (
        <div key={`tt${i}`} style={{
          position: 'absolute', top: 19,
          left: `${pos * 100}%`, transform: 'translateX(-50%)',
          width: i % 2 === 0 ? 20 : 8, height: 1.5,
          background: 'var(--cyan)', opacity: 'var(--tick-opacity)',
        }} />
      ))}
      {[0.18, 0.38, 0.62, 0.82].map((pos, i) => (
        <div key={`tb${i}`} style={{
          position: 'absolute', bottom: 19,
          left: `${pos * 100}%`, transform: 'translateX(-50%)',
          width: i % 2 === 0 ? 20 : 8, height: 1.5,
          background: 'var(--cyan)', opacity: 'var(--tick-opacity)',
        }} />
      ))}

      {/* ── Vertical fiber-optic sweeps ── */}
      {vLines.map((cfg, i) => {
        const { dur, delay, op, pillColor, ...pos } = cfg;
        return (
          <div key={`vf${i}`} style={{
            position: 'absolute', ...pos, top: 0, bottom: 0,
            width: 2, overflow: 'hidden', opacity: op,
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0,
              width: '100%', height: 180,
              background: pillColor,
              animation: `fiberV ${dur} linear infinite`,
              animationDelay: delay,
              willChange: 'transform,opacity',
            }} />
          </div>
        );
      })}
    </div>
  );
}
