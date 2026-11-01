import { useEffect, useRef, useState } from 'react';
import { Emblem } from './Emblem.jsx';

// Mounts the Three.js scene once the Work section is within a viewport of the screen, feeds it the scroll
// coordinate from `store`, and keeps the static emblem on screen until the first frame (or for good if WebGL fails).
export function SceneCanvas({ store, theme, compact, fallbackId }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const canvas = canvasRef.current;
    let cancelled = false;
    let unsubscribe = () => {};
    let resizeObserver;
    let visibility;

    const start = async () => {
      try {
        const { createWorkScene } = await import('./workScene.js');
        if (cancelled) return;
        const scene = createWorkScene(canvas, {
          theme: document.documentElement.dataset.theme,
          compact,
          onLost: () => setStatus('failed'),
        });
        sceneRef.current = scene;
        scene.setScene(store.get());
        scene.renderNow();
        unsubscribe = store.subscribe((value) => scene.setScene(value));
        resizeObserver = new ResizeObserver(() => scene.resize());
        resizeObserver.observe(canvas);
        // Tells the scene when the canvas is really on screen, so Aki's assembly plays where it is seen, and when
        // it is fully off screen (ratio 0), so the assembly can reset out of sight and replay on return.
        visibility = new IntersectionObserver(([entry]) => {
          scene.setInView(entry.intersectionRatio >= 0.4);
          if (entry.intersectionRatio === 0) scene.resetIntro();
        }, { threshold: [0, 0.4] });
        visibility.observe(canvas);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('failed');
      }
    };

    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      start();
    }, { rootMargin: '100% 0px' });
    io.observe(canvas);

    return () => {
      cancelled = true;
      io.disconnect();
      unsubscribe();
      resizeObserver?.disconnect();
      visibility?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [store, compact]);

  // Theme changes restyle the live scene; it is not rebuilt.
  useEffect(() => { sceneRef.current?.setTheme(theme); }, [theme]);

  return (
    <div className="scene" data-status={status}>
      <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true" hidden={status === 'failed'} />
      {status !== 'ready' && <div className="scene-fallback"><Emblem id={fallbackId} /></div>}
    </div>
  );
}
