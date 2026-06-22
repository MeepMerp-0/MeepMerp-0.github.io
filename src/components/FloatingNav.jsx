// components/FloatingNav.jsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

const NAV_ITEMS = [
  'Home',
  'About',
  'Projects',
  'Contact',
];

export default function FloatingNav({
  visible,
  activeSection,
  onNav,
  theme,
  onToggleTheme,
}) {
  const [hov, setHov] = useState(null);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          aria-label="Site navigation"
          initial={{
            y: -80,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            y: -80,
            opacity: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 28,
          }}
          style={{
            position: 'fixed',
            top: 8,
            left: 0,
            right: 0,

            zIndex: 100,

            display: 'flex',
            justifyContent: 'center',

            padding: '8px',

            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',

              gap: 4,

              background: 'var(--nav-bg)',

              backdropFilter: 'blur(20px)',

              border: '1px solid var(--border)',

              borderRadius: 24,

              padding: '4px',

              boxShadow: 'var(--shadow)',

              width: 'min(95vw, 620px)',

              overflow: 'hidden',
            }}
          >
            {/* Status Indicator */}
            <div
              style={{
                width: 7,
                height: 7,

                borderRadius: '50%',

                background: 'var(--cyan)',

                opacity: 0.8,

                boxShadow:
                  '0 0 8px var(--accent-glow)',

                marginLeft: 6,

                flexShrink: 0,
              }}
            />

            {/* Navigation Items */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',

                flex: 1,

                justifyContent: 'space-evenly',

                minWidth: 0,
              }}
            >
              {NAV_ITEMS.map((item) => {
                const active =
                  activeSection ===
                  item.toLowerCase();

                const hovered =
                  hov === item;

                return (
                  <button className="cyber-glitch"
                    key={item}
                    onClick={() =>
                      onNav(
                        item.toLowerCase()
                      )
                    }
                    onMouseEnter={() =>
                      setHov(item)
                    }
                    onMouseLeave={() =>
                      setHov(null)
                    }
                    style={{
                      background: active
                        ? 'var(--nav-active-bg)'
                        : hovered
                          ? 'var(--nav-hover-bg)'
                          : 'transparent',

                      border: `1px solid ${active
                        ? 'var(--nav-border)'
                        : 'transparent'
                        }`,

                      borderRadius: 18,

                      color: active
                        ? 'var(--cyan)'
                        : hovered
                          ? 'var(--text)'
                          : 'var(--muted)',

                      fontFamily:
                        'var(--font-body)',

                      fontWeight:
                        active
                          ? 600
                          : 400,

                      fontSize:
                        'clamp(10px, 2vw, 13px)',

                      letterSpacing:
                        '0.02em',

                      padding:
                        '8px clamp(6px, 1.5vw, 18px)',

                      minHeight: 36,

                      flex: 1,

                      whiteSpace:
                        'nowrap',

                      cursor: 'pointer',

                      transition:
                        'all 0.3s ease',

                      minWidth: 0,
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div
              style={{
                width: 1,
                height: 18,

                background:
                  'var(--border)',

                margin: '0 4px',

                flexShrink: 0,
              }}
            />

            {/* Theme Toggle */}
            <button className="cyber-glitch"
              onClick={onToggleTheme}
              style={{
                background:
                  'transparent',

                border: 'none',

                color:
                  'var(--muted)',

                cursor: 'pointer',

                padding: '8px',

                display: 'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                flexShrink: 0,

                transition:
                  'color 0.3s ease',
              }}
              onMouseEnter={(e) =>
              (e.currentTarget.style.color =
                'var(--cyan)')
              }
              onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                'var(--muted)')
              }
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}