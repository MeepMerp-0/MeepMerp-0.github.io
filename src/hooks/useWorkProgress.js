import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Pinned needs a landscape stage, so the sculpture sits beside the copy rather than behind it; strip needs room for a canvas band above flowing articles.
const PINNED_QUERY = '(min-width: 900px) and (min-height: 640px) and (min-aspect-ratio: 6/5)';
const STRIP_QUERY = '(min-height: 500px)';

function useMedia(query) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

// Whether this browser can create a WebGL context at all (checked once, then released).
let webgl;
function webglAvailable() {
  if (webgl === undefined) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      webgl = Boolean(gl);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

// 'pinned' (sticky stage), 'strip' (sticky canvas band over flowing articles) or 'static' (flow, no canvas).
// Reduced motion and missing WebGL both get ordinary flow. The media queries are live, so changing the
// reduced-motion setting mid-visit switches the layout without a reload.
export function useWorkMode() {
  const reduceMotion = useMedia('(prefers-reduced-motion: reduce)');
  const pinned = useMedia(PINNED_QUERY);
  const strip = useMedia(STRIP_QUERY);
  if (reduceMotion || !webglAvailable()) return 'static';
  if (pinned) return 'pinned';
  return strip ? 'strip' : 'static';
}

// The continuous scene coordinate, held outside React so a scroll frame re-renders nothing.
function createSceneStore() {
  let scene = 0;
  const listeners = new Set();
  return {
    get: () => scene,
    set(value) {
      if (value === scene) return;
      scene = value;
      listeners.forEach((fn) => fn(value));
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Reads the scroll position and never writes it: no wheel or touch handling, no scroll locking.
// `scene` is a continuous chapter coordinate in [0, count - 1] kept outside React, so a scroll frame re-renders
// nothing; only the integer `active` chapter is state.
export function useWorkProgress({ mode, count, trackRef, stageRef, articleRefs }) {
  const [active, setActive] = useState(0);
  const [store] = useState(createSceneStore);
  // While a chapter button's smooth scroll is under way, the chosen chapter stays active instead of flicking
  // through (and announcing) the chapters in between.
  const jump = useRef(null);
  const remeasure = useRef(() => {});

  useEffect(() => {
    if (mode === 'static') return undefined;
    let frame = 0;
    const headerHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;

    const measure = () => {
      frame = 0;
      let scene;
      let chapter;
      if (mode === 'pinned') {
        const track = trackRef.current?.getBoundingClientRect();
        const stage = stageRef.current?.offsetHeight;
        if (!track || !stage) return;
        const p = clamp((headerHeight() - track.top) / Math.max(1, track.height - stage), 0, 1);
        chapter = Math.min(count - 1, Math.floor(p * count));
        // Each chapter's midpoint is its sculpture's resting place.
        scene = clamp(p * count - 0.5, 0, count - 1);
      } else {
        // The article crossing the middle of the reading area leads; the band follows it continuously.
        const top = headerHeight() + (stageRef.current?.offsetHeight || 0);
        const mid = top + (window.innerHeight - top) / 2;
        const rects = articleRefs.current.map((el) => el?.getBoundingClientRect()).filter(Boolean);
        if (!rects.length) return;
        let index = rects.findIndex((r) => r.top <= mid && r.bottom > mid);
        if (index < 0) index = mid < rects[0].top ? 0 : rects.length - 1;
        const r = rects[index];
        chapter = index;
        scene = clamp(index + (mid - r.top) / Math.max(1, r.height) - 0.5, 0, count - 1);
      }
      if (jump.current !== null) {
        if (chapter !== jump.current) { store.set(scene); return; }
        jump.current = null;
      }
      setActive(chapter);
      store.set(scene);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    remeasure.current = schedule;

    // On mount too: a #work deep link or restored scroll position lands mid-track before any scroll event.
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [mode, count, trackRef, stageRef, articleRefs, store]);

  // Where the window should be for a chapter to sit at its midpoint (pinned mode only).
  const chapterTop = (index) => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return null;
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const start = track.getBoundingClientRect().top + window.scrollY - headerH;
    return start + ((index + 0.5) / count) * (track.offsetHeight - stage.offsetHeight);
  };

  // Chapter buttons: show the chosen chapter at once and smooth-scroll to its midpoint. The hold ends when the
  // scroll settles, or after 1.5 s if the visitor takes over.
  const goToChapter = (index) => {
    setActive(index);
    const top = chapterTop(index);
    if (top === null) return;
    jump.current = index;
    let timer = 0;
    const release = () => {
      window.clearTimeout(timer);
      window.removeEventListener('scrollend', release);
      jump.current = null;
      remeasure.current();
    };
    timer = window.setTimeout(release, 1500);
    window.addEventListener('scrollend', release);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return { active, store, goToChapter };
}
