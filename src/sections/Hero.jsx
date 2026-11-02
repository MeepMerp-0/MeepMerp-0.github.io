import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { HeroFallbackArt } from '../components/hero/HeroFallbackArt.jsx';
import { HERO } from '../data/siteCopy.js';
import { useHeroProgress } from '../hooks/useHeroProgress.js';
import { webglAvailable } from '../hooks/useWorkProgress.js';

// Three.js starts only after the page has loaded and the browser is idle, so it never delays the copy or actions.
// Returns a function that cancels the wait.
const whenIdle = (fn) => {
  let cancel = () => {};
  const go = () => {
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(fn, { timeout: 1500 });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(fn, 200);
      cancel = () => window.clearTimeout(id);
    }
  };
  if (document.readyState === 'complete') {
    go();
  } else {
    window.addEventListener('load', go, { once: true });
    cancel = () => window.removeEventListener('load', go);
  }
  return () => cancel();
};

// One element tree in both modes: only data-mode and data-art change, so a mode flip never remounts the canvas.
// Pinned: a tall track with a sticky stage whose scene, labels and type follow scroll progress. Still: ordinary flow
// with one frame at progress 0. The inline art shows until the first WebGL frame and whenever WebGL fails or is lost.
export function Hero({ theme }) {
  const { heroRef, trackRef, stageRef, copyRef, labelsRef, footRef, cueRef, skipRef, probeRef, mode, active, store } = useHeroProgress();
  const [art, setArt] = useState('svg');
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  // The scene is created once. Theme and progress reach it through setTheme and the store, never a remount.
  useEffect(() => {
    if (!webglAvailable()) return undefined;
    const canvas = canvasRef.current;
    let cancelled = false;
    let scene;
    let unsubscribe;
    let resizeObserver;
    let dppx;
    let onDppx;

    // A change of device pixel ratio (browser zoom, moving the window to another display) can leave the canvas's CSS
    // size alone, so the observer stays silent. Each resolution query matches one value, so re-arm after every change.
    const watchDppx = () => {
      dppx = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      onDppx = () => { scene?.resize(); watchDppx(); };
      dppx.addEventListener('change', onDppx, { once: true });
    };
    const unwatchDppx = () => dppx?.removeEventListener('change', onDppx);

    // Releases the scene and everything listening to it. Used on unmount, on a creation error and on context loss.
    const teardown = () => {
      unsubscribe?.();
      resizeObserver?.disconnect();
      unwatchDppx();
      scene?.dispose();
      unsubscribe = undefined;
      resizeObserver = undefined;
      dppx = undefined;
      scene = undefined;
      sceneRef.current = null;
    };

    const cancelIdle = whenIdle(async () => {
      try {
        const { createHeroScene } = await import('../components/hero/heroScene.js');
        if (cancelled) return;
        scene = createHeroScene(canvas, {
          theme: document.documentElement.dataset.theme,
          // Context loss: stop rendering for good and show the inline art. The mode stays, so the page does not move.
          onLost: () => { teardown(); setArt('svg'); },
        });
        sceneRef.current = scene;
        scene.setProgress(store.get());
        unsubscribe = store.subscribe(scene.setProgress);
        resizeObserver = new ResizeObserver(() => scene.resize());
        resizeObserver.observe(canvas);
        watchDppx();
        scene.renderNow();
        setArt('canvas');
      } catch {
        // Only the art changes. The layout mode stays, so a late failure cannot collapse the track under the visitor.
        teardown();
        if (!cancelled) setArt('svg');
      }
    });

    return () => {
      cancelled = true;
      cancelIdle();
      teardown();
    };
  }, [store]);

  useEffect(() => { sceneRef.current?.setTheme(theme); }, [theme]);

  const pinned = mode === 'pinned';

  return (
    <section ref={heroRef} className="hero" id="home" aria-labelledby="hero-title" data-mode={mode} data-art={art}>
      <span ref={probeRef} className="hero-probe" aria-hidden="true" />
      <div ref={trackRef} className="hero-track">
        <div ref={stageRef} className="hero-stage shell">
          <div ref={copyRef} className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span className="status-dot" aria-hidden="true" />{HERO.eyebrow} · {HERO.location}
            </p>
            <h1 id="hero-title">
              {HERO.headline.map((line, i) => (
                <span key={line} className={i === 1 ? 'hero-line-accent' : undefined}>{line}</span>
              ))}
            </h1>
            <p className="hero-lead">{HERO.lead}</p>
            <ul className="hero-focus" aria-label="What I build">
              {HERO.focus.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="hero-actions">
              <a className="button button-solid" href="#work">View Work <ArrowRight size={18} aria-hidden="true" /></a>
              <a className="button button-ghost" href="#contact">Contact</a>
            </div>
            <p className="hero-availability">{HERO.availability}</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <HeroFallbackArt />
            <canvas ref={canvasRef} className="hero-canvas" />
          </div>
          <div ref={labelsRef} className="hero-labels">
            <div className="hero-labels-body">
              <div className="hero-rail" aria-hidden="true">
                <span className="hero-rail-fill" />
                <span className="hero-rail-mark" />
              </div>
              <ol className="hero-stages" aria-label="From inputs to impact">
                {HERO.stages.map(({ name, description }, i) => (
                  <li key={name} aria-current={pinned && i === active ? 'step' : undefined}>
                    <span className="hero-stage-head">
                      <span className="hero-stage-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="hero-stage-name">{name}</span>
                      <span className="hero-now"><span className="hero-now-shape" aria-hidden="true" />Now</span>
                    </span>
                    <span className="hero-stage-desc">{description}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div ref={footRef} className="hero-foot">
            <a ref={skipRef} className="hero-skip" href="#work">Skip to Work</a>
            <span ref={cueRef} className="hero-cue"><ArrowDown size={14} aria-hidden="true" />Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>
  );
}
