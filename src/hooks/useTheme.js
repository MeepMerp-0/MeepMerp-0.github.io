import { useEffect, useState } from 'react';

const THEME_KEY = 'theme-choice';
const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)';

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage may be unavailable; the website still works without it.
  }
  return window.matchMedia(LIGHT_SCHEME_QUERY).matches ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Follow the system theme until the visitor picks one with the toggle.
  useEffect(() => {
    const media = window.matchMedia(LIGHT_SCHEME_QUERY);
    const follow = (event) => {
      try { if (window.localStorage.getItem(THEME_KEY)) return; } catch { /* optional */ }
      setTheme(event.matches ? 'light' : 'dark');
    };
    media.addEventListener('change', follow);
    return () => media.removeEventListener('change', follow);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try { window.localStorage.setItem(THEME_KEY, next); } catch { /* optional */ }
    setTheme(next);
  };

  return { theme, toggleTheme };
}
