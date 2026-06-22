import { useEffect, useRef } from 'react';
import { createCircuitRenderer } from '../utils/canvasCircuitRenderer.js';

export default function AmbientBg({ theme = 'dark' }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  const isDesktopFinePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  useEffect(() => {
    if (!isDesktopFinePointer) return; // skip entirely on touch devices

    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = createCircuitRenderer({
      canvas,
      theme,
      isDesktopFinePointer: true,
      prefersReducedMotion: false,
    });
    rendererRef.current = renderer;
    renderer.start();

    return () => renderer.stop();
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.updateTheme(theme);

    if (theme !== 'light') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [theme]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {isDesktopFinePointer && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'auto',
          }}
        />
      )}
      {/* glow blobs */}
      <div className="cyber-glow" style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 560, height: 560, borderRadius: '50%',
        background: 'var(--glow-1)', zIndex: 0,
        animation: 'glowBreathe 24s ease-in-out infinite',
        willChange: 'opacity',
      }} />
      <div className="cyber-glow" style={{
        position: 'absolute', bottom: '18%', right: '6%',
        width: 680, height: 680, borderRadius: '50%',
        background: 'var(--glow-2)', zIndex: 0,
        animation: 'glowBreathe 24s ease-in-out infinite',
        willChange: 'opacity',
      }} />
      <div className="cyber-glow" style={{
        position: 'absolute', top: '52%', left: '42%',
        width: 380, height: 380, borderRadius: '50%',
        background: 'var(--glow-3)', zIndex: 0,
        animation: 'glowBreathe 24s ease-in-out infinite',
        willChange: 'opacity',
      }} />
      {/* pixel grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'var(--pixel-grid)',
        backgroundSize: 'var(--pixel-grid-size)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
      {/* scanline */}
      <div className="cyber-scanline" style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'var(--scanline-gradient)',
        opacity: 'var(--scanline-opacity)',
        animation: 'scanlineSweep 32s linear infinite',
        zIndex: 2,
        pointerEvents: 'none',
      }} />
      {/* dot/grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'var(--bg-pattern)',
        backgroundSize: 'var(--bg-pattern-size)',
        opacity: theme === 'light' ? 0.85 : 'var(--dot-opacity)',
        zIndex: 1,
      }} />
    </div>
  );
}