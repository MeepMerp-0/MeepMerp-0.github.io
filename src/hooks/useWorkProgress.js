import { useEffect, useState, useSyncExternalStore } from 'react';

// Pinned needs room for the stage and its copy; strip needs room for a canvas band above flowing articles.
const PINNED_QUERY = '(min-width: 900px) and (min-height: 640px)';
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

// 'pinned' (sticky stage), 'strip' (sticky canvas band over flowing articles) or 'static' (flow, no canvas).
export function useWorkMode(reduceMotion) {
  const pinned = useMedia(PINNED_QUERY);
  const strip = useMedia(STRIP_QUERY);
  if (reduceMotion) return 'static';
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
      setActive(chapter);
      store.set(scene);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };

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

  return { active, setActive, store, chapterTop };
}
