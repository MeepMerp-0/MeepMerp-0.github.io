// components/ProfilePortal.jsx
import { useState } from 'react';

const LIGHT_SRC = "https://pub-c10ba7365a8240d2a24c50e217e1da90.r2.dev/personal/profile-avatar-github/jdsW.jpg";
const DARK_SRC = "https://pub-c10ba7365a8240d2a24c50e217e1da90.r2.dev/personal/profile-avatar-github/jdsB.jpg";
const LIGHT_FALLBACK = "/dp-white.jpg";
const DARK_FALLBACK = "/dp-black.jpg";

export default function ProfilePortal({ size = 300, opacity = 1 }) {
  const [lightImgErrored, setLightImgErrored] = useState(false);
  const [darkImgErrored, setDarkImgErrored] = useState(false);
  const outerR = size / 2 + Math.max(8, size * 0.07);
  const innerR = size / 2 + Math.max(4, size * 0.03);
  const svgSize = outerR * 2 + 20;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  return (
    <div
      className="pp-wrapper"
      style={{ width: svgSize, height: svgSize, flexShrink: 0, opacity }}
    >
      <svg width={svgSize} height={svgSize} className="pp-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={`pp-gc-${size}`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`pp-gb-${size}`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--accent-border)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--accent-border)" strokeWidth="1" />
      </svg>

      <div
        className="pp-orbit-outer"
        style={{
          position: 'absolute',
          width: outerR * 2,
          height: outerR * 2,
          top: cy - outerR,
          left: cx - outerR,
          pointerEvents: 'none',
          animation: 'orbitCW 60s linear infinite',
        }}
      >
        <div style={{
          position: 'absolute',
          left: '50%', top: 0,
          width: 6, height: 6,
          marginLeft: -3, marginTop: -3,
          borderRadius: '50%',
          background: 'var(--cyan)',
          boxShadow: '0 0 4px var(--cyan), 0 0 10px var(--cyan)',
        }} />
      </div>

      <div
        className="pp-orbit-inner"
        style={{
          position: 'absolute',
          width: innerR * 2,
          height: innerR * 2,
          top: cy - innerR,
          left: cx - innerR,
          pointerEvents: 'none',
          animation: 'orbitCCW 40s linear infinite',
        }}
      >
        <div style={{
          position: 'absolute',
          left: '50%', top: 0,
          width: 4, height: 4,
          marginLeft: -2, marginTop: -2,
          borderRadius: '50%',
          background: 'var(--blue)',
          boxShadow: '0 0 4px var(--blue), 0 0 8px var(--blue)',
        }} />
      </div>

      <div
        className="pp-breath-ring"
        style={{ width: size, height: size, marginTop: -(size / 2), marginLeft: -(size / 2) }}
      />

      <div
        className="pp-avatar"
        style={{ width: size, height: size, marginTop: -(size / 2), marginLeft: -(size / 2) }}
      >
        <img
          src={lightImgErrored ? LIGHT_FALLBACK : LIGHT_SRC}
          alt="Jason Selerio"
          width={size}
          height={size}
          loading="lazy"
          className="pp-img pp-img-light"
          onError={(e) => {
            if (!e.target.dataset.fallback) {
              e.target.dataset.fallback = 'true';
              setLightImgErrored(true);
            }
          }}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
        <img
          src={darkImgErrored ? DARK_FALLBACK : DARK_SRC}
          alt="Jason Selerio"
          width={size}
          height={size}
          loading="lazy"
          className="pp-img pp-img-dark"
          onError={(e) => {
            if (!e.target.dataset.fallback) {
              e.target.dataset.fallback = 'true';
              setDarkImgErrored(true);
            }
          }}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
}