// components/ScrollIndicator.jsx

import {
  motion,
  AnimatePresence,
} from 'motion/react';

export default function ScrollIndicator({
  visible,
  touchDevice = false,
}) {
  const isMobile =
    touchDevice;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="scroll-indicator"
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 12,
          }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            position: 'fixed',
            bottom: 36,

            left: 0,
            right: 0,

            marginLeft: 'auto',
            marginRight: 'auto',

            width: 'max-content',

            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',

            gap: 10,

            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {/* Label */}
          <motion.span
            animate={{
              opacity: [0.4, 0.85, 0.4],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              fontFamily:
                'var(--font-mono)',

              fontSize: 9,

              color: 'var(--muted)',

              letterSpacing: '0.2em',

              textTransform:
                'uppercase',
            }}
          >
            {isMobile
              ? 'Swipe Up'
              : 'Scroll Down'}
          </motion.span>

          {/* Mobile */}
          {isMobile ? (
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {[0, 1, 2].map(
                (i) => (
                  <motion.div
                    key={i}
                    animate={{
                      opacity: [
                        0.15,
                        0.8,
                        0.15,
                      ],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat:
                        Infinity,
                      delay:
                        i * 0.18,
                    }}
                    style={{
                      width: 10,
                      height: 10,

                      borderLeft:
                        '1.5px solid var(--cyan)',

                      borderTop:
                        '1.5px solid var(--cyan)',

                      transform:
                        'rotate(45deg)',
                    }}
                  />
                )
              )}
            </motion.div>
          ) : (
            <>
              {/* Mouse */}
              <motion.div
                animate={{
                  borderColor: [
                    'rgba(0,229,255,0.25)',
                    'rgba(0,229,255,0.65)',
                    'rgba(0,229,255,0.25)',
                  ],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: 22,
                  height: 36,

                  border:
                    '1.5px solid rgba(0,229,255,0.35)',

                  borderRadius: 11,

                  display: 'flex',
                  alignItems:
                    'flex-start',

                  justifyContent:
                    'center',

                  padding:
                    '5px 0 0',

                  overflow:
                    'hidden',
                }}
              >
                <motion.div
                  animate={{
                    y: [0, 5, 0],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat:
                      Infinity,
                    ease:
                      'easeInOut',
                  }}
                  style={{
                    width: 4,
                    height: 7,

                    borderRadius: 2,

                    background:
                      'var(--cyan)',

                    opacity: 0.7,
                  }}
                />
              </motion.div>

              {/* Desktop arrows */}
              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',

                  alignItems:
                    'center',

                  gap: 2,

                  marginTop: -2,
                }}
              >
                {[0, 1, 2].map(
                  (i) => (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: [
                          0.1,
                          0.7,
                          0.1,
                        ],
                      }}
                      transition={{
                        duration: 1.4,
                        repeat:
                          Infinity,
                        delay:
                          i * 0.22,
                      }}
                      style={{
                        width: 8,
                        height: 8,

                        borderRight:
                          '1.5px solid var(--cyan)',

                        borderBottom:
                          '1.5px solid var(--cyan)',

                        transform:
                          'rotate(45deg)',
                      }}
                    />
                  )
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}