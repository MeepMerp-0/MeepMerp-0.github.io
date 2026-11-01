import { useLayoutEffect, useRef, useState } from 'react';
import { activeStage, signalAt, stageWeights, typeAt } from '../components/hero/heroMotion.js';
import { useMedia, webglAvailable } from './useWorkProgress.js';

// Pinned needs a screen big enough for the copy, the labels and some art; the fit measurement below decides the rest.
export const HERO_PINNED_QUERY = '(min-width: 360px) and (min-height: 560px)';
// Same condition as the wide layout in global.css: the art is a column beside the copy.
const WIDE_QUERY = '(min-width: 900px) and (orientation: landscape)';
const MIN_ART = 180;
// The stage's vertical padding and row gaps in global.css (40 px on phones, less on wide stages), plus a little slack.
const PADDING = 42;
const FOOT_ROW = 44;
const HYSTERESIS = 16;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const headerHeight = () => document.querySelector('.site-header')?.offsetHeight || 72;

// The progress value, held outside React so a scroll frame re-renders nothing.
function createProgressStore() {
  let value = 0;
  const listeners = new Set();
  return {
    get: () => value,
    set(next) {
      if (next === value) return;
      value = next;
      listeners.forEach((fn) => fn(next));
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

// Mode, progress and the properties that follow it. Reads the scroll position and never writes it, apart from one
// layout compensation when the mode flips while the Hero is above the viewport. No wheel or touch handling.
export function useHeroProgress() {
  const heroRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const copyRef = useRef(null);
  const labelsRef = useRef(null);
  const footRef = useRef(null);
  const probeRef = useRef(null);
  // Live, so switching the setting mid-visit gives the still layout without a reload.
  const reduceMotion = useMedia('(prefers-reduced-motion: reduce)');
  const [mode, setMode] = useState('still');
  const [active, setActive] = useState(0);
  const [store] = useState(createProgressStore);

  // Mode: settled before first paint, so a deep link is placed against the final layout. The measurement uses the
  // content's own heights, which do not depend on the mode, so the result cannot flip-flop by itself.
  useLayoutEffect(() => {
    const hero = heroRef.current;
    const allowed = !reduceMotion && webglAvailable();
    const fits = window.matchMedia(HERO_PINNED_QUERY);
    const wide = window.matchMedia(WIDE_QUERY);

    const evaluate = () => {
      const current = hero.dataset.mode || 'still';
      let next = 'still';
      if (allowed && fits.matches) {
        const needed = copyRef.current.offsetHeight + labelsRef.current.offsetHeight
          + Math.max(footRef.current.offsetHeight, FOOT_ROW) + (wide.matches ? 0 : MIN_ART) + PADDING;
        // The probe is 100svh, so a mobile URL bar showing or hiding does not change the answer.
        const available = probeRef.current.offsetHeight - headerHeight();
        next = current === 'pinned'
          ? (needed > available ? 'still' : 'pinned')
          : (needed < available - HYSTERESIS ? 'pinned' : 'still');
      }
      if (next === current) return;
      if (hero.getBoundingClientRect().bottom <= 0) {
        // The Hero is entirely above the viewport: keep the visitor on the same content.
        const before = trackRef.current.offsetHeight;
        hero.dataset.mode = next;
        window.scrollBy({ top: trackRef.current.offsetHeight - before, behavior: 'instant' });
      } else {
        hero.dataset.mode = next;
      }
      setMode(next);
    };

    evaluate();
    window.addEventListener('resize', evaluate);
    const observer = new ResizeObserver(evaluate);
    [copyRef, labelsRef, footRef, probeRef].forEach((ref) => observer.observe(ref.current));
    const header = document.querySelector('.site-header');
    if (header) observer.observe(header);
    return () => {
      window.removeEventListener('resize', evaluate);
      observer.disconnect();
    };
  }, [reduceMotion]);

  // Progress: 0 in still mode. In pinned mode it is read on scroll and size changes, coalesced to one frame.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const apply = (p) => {
      const { lift, accent } = typeAt(p);
      const weights = stageWeights(p);
      const set = (name, value) => stage.style.setProperty(name, String(value));
      set('--hero-p', p);
      weights.forEach((w, i) => set(`--hero-w${i}`, w));
      set('--hero-lift', `${lift}px`);
      set('--hero-accent', accent);
      set('--hero-signal', signalAt(p));
      setActive(activeStage(p));
    };
    const unsubscribe = store.subscribe(apply);

    if (mode !== 'pinned') {
      store.set(0);
      apply(store.get());
      return unsubscribe;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      const track = trackRef.current.getBoundingClientRect();
      const range = track.height - stage.offsetHeight;
      store.set(range > 0 ? clamp((headerHeight() - track.top) / range, 0, 1) : 0);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };

    // On mount too: a deep link or restored scroll position lands mid-track before any scroll event.
    measure();
    apply(store.get());
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(trackRef.current);
    const header = document.querySelector('.site-header');
    if (header) observer.observe(header);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
      unsubscribe();
    };
  }, [mode, store]);

  return { heroRef, trackRef, stageRef, copyRef, labelsRef, footRef, probeRef, mode, active, store };
}
