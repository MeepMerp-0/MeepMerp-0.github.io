import { useLayoutEffect, useRef, useState } from 'react';

const clamp01 = (value) => Math.min(1, Math.max(0, value));

// Progress through the track (0..1) split into `count` equal steps.
export function stepAt(p, count) {
  return Math.min(count - 1, Math.floor(clamp01(p) * count));
}

// Drives a "still" block: the stage sticks under the header while the page scrolls through the track, and the
// scroll position alone picks the step. Like useWorkProgress it only reads scroll, never writes it from a scroll
// handler. Reduced motion, or a stage too tall for the viewport, gets plain flow with click-only steps.
export function useScrollSteps({ count, trackRef, stageRef }) {
  const [pinned, setPinned] = useState(false);
  const [index, setIndex] = useState(0);
  const pinnedNow = useRef(false);
  // While a button's smooth scroll runs, the chosen step stays selected instead of flicking through the others.
  const jump = useRef(null);
  const remeasure = useRef(() => {});
  const endHold = useRef(() => {});
  const stick = useRef(0);

  // A layout effect, so the first mode decision is in place before paint and a deep link or restored scroll
  // position is placed against the final page height.
  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const headerHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))
      || document.querySelector('.site-header')?.offsetHeight || 0;

    const measure = () => {
      frame = 0;
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return;
      const header = headerHeight();
      const stageHeight = stage.offsetHeight;
      // The stage is the same in both modes and for every step (its panes share one cell), so the fit depends
      // only on the screen. The screen height is 100svh from the probe rather than innerHeight, which changes as a
      // phone's address bar hides. The 32px of slack before leaving stops a stage just over the limit flickering.
      const screen = track.querySelector('.steps-probe')?.offsetHeight || window.innerHeight;
      const room = screen - header - stageHeight - 48;
      // The stage sticks centred in the space under the header, at least 24px below it. Progress is read from the
      // same line, so step 1 starts as the stage sticks.
      stick.current = header + Math.max(24, (screen - header - stageHeight) / 2);
      track.style.setProperty('--stick-top', `${stick.current}px`);
      const fits = !reduce.matches && room >= (pinnedNow.current ? -32 : 0);
      track.style.setProperty('--stage-h', `${stageHeight}px`);
      if (fits !== pinnedNow.current) {
        pinnedNow.current = fits;
        // Set on the element too: React runs pending effects, such as the initial #hash scroll, before it
        // renders this state, so the track must already have its final height by then.
        track.dataset.pinned = String(fits);
        setPinned(fits);
        // The track's height changes with the mode; its ResizeObserver reads the step once it has.
        return;
      }
      if (!fits) return;
      const p = (stick.current - track.getBoundingClientRect().top) / Math.max(1, track.offsetHeight - stageHeight);
      const next = stepAt(p, count);
      if (jump.current !== null) {
        if (next !== jump.current) return;
        jump.current = null;
      }
      setIndex(next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    remeasure.current = schedule;

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduce.addEventListener('change', schedule);
    const observer = new ResizeObserver(schedule);
    if (stageRef.current) observer.observe(stageRef.current);
    // The track changes height when pinning switches on, which moves the position the step is read from.
    if (trackRef.current) observer.observe(trackRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reduce.removeEventListener('change', schedule);
      observer.disconnect();
    };
  }, [count, trackRef, stageRef]);

  // Show the chosen step at once; pinned, also smooth-scroll to its midpoint. The hold ends when the scroll
  // settles, or after 1.5 s if the visitor takes over.
  const goTo = (i) => {
    endHold.current();
    setIndex(i);
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!pinnedNow.current || !track || !stage) return;
    const start = track.getBoundingClientRect().top + window.scrollY - stick.current;
    jump.current = i;
    let timer = 0;
    const stop = () => {
      window.clearTimeout(timer);
      window.removeEventListener('scrollend', release);
      endHold.current = () => {};
    };
    // A second choice before this scroll settles replaces this hold instead of ending it early.
    endHold.current = stop;
    function release() {
      stop();
      jump.current = null;
      remeasure.current();
    }
    timer = window.setTimeout(release, 1500);
    window.addEventListener('scrollend', release);
    window.scrollTo({ top: start + ((i + 0.5) / count) * (track.offsetHeight - stage.offsetHeight), behavior: 'smooth' });
  };

  return { pinned, index, goTo };
}
