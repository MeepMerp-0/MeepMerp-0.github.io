// components/FloatingNav.jsx
// Uses Motion (motion.dev) for the slide-in animation.
// AnimatePresence handles mount/unmount gracefully.

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

const NAV_ITEMS = ['Home', 'About', 'Projects', 'Contact'];

export default function FloatingNav({ visible, activeSection, onNav, theme, onToggleTheme }) {
  const [hov, setHov] = useState(null);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          aria-label="Site navigation"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 100,
            display: 'flex', justifyContent: 'center',
            padding: '14px 0',
            pointerEvents: 'auto',
          }}
        >
          <div style={{
            display: 'flex', gap: 2, alignItems: 'center',
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: 40,
            padding: '5px 8px',
            boxShadow: 'var(--shadow)',
          }}>
            {/* Cyan status pip */}
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--cyan)', opacity: 0.8,
              boxShadow: '0 0 8px var(--accent-glow)',
              margin: '0 8px 0 6px',
            }} />

            {NAV_ITEMS.map(item => {
              const active = activeSection === item.toLowerCase();
              const hovered = hov === item;
              return (
                <button
                  key={item}
                  onClick={() => onNav(item.toLowerCase())}
                  onMouseEnter={() => setHov(item)}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    background: active ? 'var(--nav-active-bg)' : hovered ? 'var(--nav-hover-bg)' : 'transparent',
                    border: `1px solid ${active ? 'var(--nav-border)' : 'transparent'}`,
                    borderRadius: 22,
                    color: active ? 'var(--cyan)' : hovered ? 'var(--text)' : 'var(--muted)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: active ? 600 : 400,
                    fontSize: 13, letterSpacing: '0.02em',
                    padding: '6px 18px',
                    cursor: 'pointer',
                    transition: 'color 0.3s ease, background 0.3s ease, border-color 0.3s ease',
                  }}
                >{item}</button>
              );
            })}

            {/* Theme Toggle */}
            <div style={{
              width: 1, height: 20, background: 'var(--border)', margin: '0 8px'
            }} />

            <button
              onClick={onToggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
