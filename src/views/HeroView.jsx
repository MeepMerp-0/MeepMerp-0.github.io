import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Minus, Copy, X, Sun, Moon } from 'lucide-react';

import ScrollIndicator from '../components/ScrollIndicator';
import ProfilePortal from '../components/ProfilePortal.jsx';
import ServiceBubble from '../components/ServiceBubble.jsx';
import TypingIndicator from '../components/TypingIndicator.jsx';
import useDeviceType from '../hooks/useDeviceType.js';

import avatar from '../assets/avatar.jpg';

import {
  PERSONAL,
  SERVICES,
} from '../models/portfolioData.js';

export default function HeroView({
  theme,
  onToggleTheme,
}) {
  const [bubblesVisible, setBubblesVisible] =
    useState(false);

  const isTouchDevice =
    useDeviceType();

  const [screenWidth, setScreenWidth] =
    useState(
      () =>
        typeof window !==
          'undefined'
          ? window.innerWidth
          : 1024
    );

  const [isNarrow, setIsNarrow] =
    useState(
      () =>
        typeof window !==
        'undefined' &&
        window.innerWidth <= 768
    );

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(
        window.innerWidth
      );

      setIsNarrow(
        window.innerWidth <= 768
      );
    };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () =>
      window.removeEventListener(
        'resize',
        handleResize
      );
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => setBubblesVisible(true),
      600
    );

    return () =>
      clearTimeout(t);
  }, []);

  return (
    <section
      id="home"
      style={{
        width: '100%',
        minHeight: '100svh',
        position: 'relative',

        display: 'flex',
        flexDirection: 'column',

        alignItems: 'center',
        justifyContent: 'center',

        padding: isNarrow
          ? '60px 0 24px'
          : '0',

        overflow: 'hidden',
      }}
    >
      {!isNarrow && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {SERVICES.map(
            (
              service,
              index
            ) => (
              <ServiceBubble
                key={
                  service.label
                }
                {...service}
                visible={
                  bubblesVisible
                }
                index={index}
              />
            )
          )}
        </div>
      )}

      <motion.div
        className="hero-card"
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.8,
          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
        style={{
          display: 'flex',

          flexDirection:
            isNarrow
              ? 'column'
              : 'row',

          alignItems:
            'center',

          justifyContent:
            'center',

          gap: isNarrow
            ? 16
            : 'clamp(28px,5vw,68px)',

          padding: isNarrow
            ? '44px 18px 20px'
            : 'clamp(28px,4vw,52px)',

          background:
            'var(--card-bg)',

          backdropFilter:
            'blur(22px)',

          border:
            '1px solid var(--border-subtle)',

          borderRadius:
            isNarrow
              ? 18
              : 22,

          boxShadow:
            'var(--shadow)',

          width: '90vw',

          maxWidth:
            isNarrow
              ? 360
              : 820,

          overflow: 'hidden',

          position:
            'relative',

          zIndex: 2,

          textAlign:
            isNarrow
              ? 'center'
              : 'left',
        }}
      >
        {!isNarrow && (
          <div
            style={{
              position:
                'absolute',

              top: 12,
              right: 14,

              display:
                'flex',

              gap: 8,

              alignItems:
                'center',

              opacity: 0.8,
            }}
          >
            <button
              onClick={
                onToggleTheme
              }
              style={{
                background:
                  'rgba(255,255,255,0.05)',

                border:
                  '1px solid var(--border-subtle)',

                borderRadius:
                  '50%',

                width: 26,
                height: 26,

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                cursor:
                  'pointer',

                color:
                  'var(--cyan)',

                marginRight: 6,

                padding: 0,
              }}
            >
              {theme ===
                'dark' ? (
                <Sun
                  size={14}
                />
              ) : (
                <Moon
                  size={14}
                />
              )}
            </button>

            <div
              style={{
                display:
                  'flex',

                gap: 8,

                opacity: 0.6,
              }}
            >
              <Minus
                size={16}
              />

              <Copy
                size={14}
                style={{
                  transform:
                    'scaleX(-1)',
                }}
              />

              <X size={16} />
            </div>
          </div>
        )}

        {isNarrow && (
          <div
            style={{
              position:
                'absolute',

              top: 12,
              right: 12,

              zIndex: 10,
            }}
          >
            <button
              onClick={
                onToggleTheme
              }
              style={{
                background:
                  'rgba(255,255,255,0.05)',

                border:
                  '1px solid var(--border-subtle)',

                borderRadius:
                  '50%',

                width: 34,
                height: 34,

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                cursor:
                  'pointer',

                color:
                  'var(--cyan)',

                padding: 0,
              }}
            >
              {theme ===
                'dark' ? (
                <Sun
                  size={16}
                />
              ) : (
                <Moon
                  size={16}
                />
              )}
            </button>
          </div>
        )}

        <motion.div
          layoutId="portal-image"
          transition={{
            duration: 1,
            ease: [
              0.16,
              1,
              0.3,
              1,
            ],
          }}
          style={{
            flexShrink: 0,
          }}
        >
          <ProfilePortal
            size={
              isNarrow
                ? screenWidth <
                  380
                  ? 130
                  : 150
                : 300
            }
            opacity={1}
            photoSrc={avatar}
          />
        </motion.div>

        <div
          style={{
            flex: isNarrow
              ? '0 0 auto'
              : '1 1 270px',

            minWidth:
              isNarrow
                ? 0
                : 250,

            width:
              isNarrow
                ? '100%'
                : undefined,

            display:
              'flex',

            flexDirection:
              'column',

            alignItems:
              isNarrow
                ? 'center'
                : 'flex-start',
          }}
        >
          <TypingIndicator />

          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
              duration: 0.6,
            }}
            style={{
              fontFamily:
                'var(--font-display)',

              fontSize:
                isNarrow
                  ? 'clamp(15px,4.5vw,20px)'
                  : 'clamp(21px,3.4vw,34px)',

              lineHeight:
                1.15,

              marginBottom:
                isNarrow
                  ? 12
                  : 18,

              textAlign:
                isNarrow
                  ? 'center'
                  : 'left',

              overflowWrap:
                'break-word',

              wordBreak:
                'break-word',
            }}
          >
            {PERSONAL.tagline}
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.35,
              duration: 0.6,
            }}
            style={{
              color:
                'var(--muted)',

              lineHeight:
                isNarrow
                  ? 1.65
                  : 1.8,

              textAlign:
                isNarrow
                  ? 'center'
                  : 'left',

              fontSize:
                isNarrow
                  ? '14px'
                  : undefined,

              paddingInline:
                isNarrow
                  ? 4
                  : 0,
            }}
          >
            {PERSONAL.headline}
          </motion.p>
        </div>
      </motion.div>

      <ScrollIndicator
        visible
        touchDevice={
          isTouchDevice
        }
      />
    </section>
  );
}