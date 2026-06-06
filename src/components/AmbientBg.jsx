// components/AmbientBg.jsx — remove the Static base border lines block entirely
export default function AmbientBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 560, height: 560, borderRadius: '50%',
        background: 'var(--glow-1)',
        animation: 'glowBreathe 20s ease-in-out infinite',
        willChange: 'opacity',
      }} />
      <div style={{
        position: 'absolute', bottom: '18%', right: '6%',
        width: 680, height: 680, borderRadius: '50%',
        background: 'var(--glow-2)',
        animation: 'glowBreathe 24s ease-in-out infinite',
        animationDelay: '7s', willChange: 'opacity',
      }} />
      <div style={{
        position: 'absolute', top: '52%', left: '42%',
        width: 380, height: 380, borderRadius: '50%',
        background: 'var(--glow-3)',
        animation: 'glowBreathe 17s ease-in-out infinite',
        animationDelay: '12s', willChange: 'opacity',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'var(--bg-pattern)',
        backgroundSize: 'var(--bg-pattern-size)',
        opacity: 'var(--dot-opacity)',
      }} />
    </div>
  );
}