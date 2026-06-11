// hooks/useScrollNavigation.js

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

const SECTIONS = [
  'home',
  'about',
  'projects',
  'contact',
];

const SWITCH_COOLDOWN = 500;
const EDGE_HOLD_DELAY = 350;

export function useScrollNavigation(pageRefs, setPageKeys) {
  const [activeSection, setActiveSection] = useState('home');
  const [navVisible, setNavVisible] = useState(false);

  // Scroll to top when active section changes
  useEffect(() => {
    const page = pageRefs[activeSection]?.current;
    if (page) {
      page.scrollTop = 0;
    }
  }, [activeSection, pageRefs]);

  // Lock mechanism
  const lockedRef = useRef(false);

  // Section navigation logic
  const activeSectionRef = useRef('home');
  const edgeReachedAt = useRef(null);
  const touchStartY = useRef(0);

  // Keep ref in sync
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const canLeavePage = useCallback(
    (direction) => {
      const page = pageRefs[activeSectionRef.current]?.current;

      if (!page) {
        return true;
      }

      const atTop = page.scrollTop <= 5;
      const atBottom =
        page.scrollTop + page.clientHeight >= page.scrollHeight - 5;
      const atEdge = direction > 0 ? atBottom : atTop;

      if (!atEdge) {
        edgeReachedAt.current = null;
        return false;
      }

      const now = Date.now();

      if (edgeReachedAt.current === null) {
        edgeReachedAt.current = now;
        return false;
      }

      return now - edgeReachedAt.current >= EDGE_HOLD_DELAY;
    },
    [pageRefs]
  );

  const navigateTo = useCallback(
    (target) => {
      if (!SECTIONS.includes(target)) {
        return;
      }
      if (target === activeSectionRef.current) {
        return;
      }
      activeSectionRef.current = target;
      setActiveSection(target);
      setNavVisible(target !== 'home');
    },
    []
  );

  const shift = useCallback(
    (dir) => {
      const current = SECTIONS.indexOf(activeSectionRef.current);
      const next = current + dir;
      if (next < 0 || next >= SECTIONS.length) {
        return;
      }
      navigateTo(SECTIONS[next]);
    },
    [navigateTo]
  );

  // Touch handlers
  const onTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (lockedRef.current) {
        return;
      }
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 60) {
        return;
      }
      const direction = diff > 0 ? 1 : -1;
      if (canLeavePage(direction)) {
        shift(direction);
        edgeReachedAt.current = null;
      }
    },
    [shift, canLeavePage]
  );

  // Keyboard handler
  const onKeyDown = useCallback(
    (e) => {
      if (lockedRef.current) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (canLeavePage(1)) {
          e.preventDefault();
          shift(1);
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (canLeavePage(-1)) {
          e.preventDefault();
          shift(-1);
        }
      }
    },
    [shift, canLeavePage]
  );

  // Wheel event handler
  useEffect(() => {
    const page = pageRefs[activeSection]?.current;

    if (!page) {
      return;
    }

    const handleWheel = (e) => {
      if (lockedRef.current) {
        e.preventDefault();
        return;
      }

      if (Math.abs(e.deltaY) < 25) {
        return;
      }

      const direction = e.deltaY > 0 ? 1 : -1;

      if (!canLeavePage(direction)) {
        return;
      }

      e.preventDefault();
      shift(direction);
      edgeReachedAt.current = null;
    };

    page.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      page.removeEventListener('wheel', handleWheel);
    };
  }, [activeSection, pageRefs, lockedRef, canLeavePage, shift, edgeReachedAt]);

  // Touch events
  useEffect(() => {
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchEnd]);

  // Keyboard events
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  const scrollTo = useCallback(
    (section) => {
      setPageKeys((prev) => ({
        ...prev,
        [section]: prev[section] + 1,
      }));

      const page = pageRefs[section]?.current;
      if (page) {
        page.scrollTop = 0;
      }
      navigateTo(section);
    },
    [pageRefs, navigateTo, setPageKeys]
  );

  return {
    activeSection,
    navVisible,
    scrollTo,
  };
}