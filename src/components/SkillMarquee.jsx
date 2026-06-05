import { MARQUEE_LOGOS } from '../models/portfolioData.js';

function LogoItem({ name, img }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8,
      padding: '0 28px',
      flexShrink: 0,
    }}>
      <div style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--item-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: 8,
        transition: 'border-color 0.3s, background 0.3s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent-border-hover)';
          e.currentTarget.style.background = 'var(--accent-bg-hover)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.background = 'var(--item-bg)';
        }}
      >
        <img
          src={img}
          alt={name}
          width={28}
          height={28}
          style={{ objectFit: 'contain', filter: 'brightness(0.92) saturate(1.1)' }}
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<span style="font-size:10px;font-family:var(--font-mono);color:var(--cyan);font-weight:600">${name.slice(0, 3).toUpperCase()}</span>`;
          }}
        />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--muted)',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}>{name}</span>
    </div>
  );
}

export default function SkillMarquee() {
  // Duplicate array directly to make a seamless loop
  const track = [...MARQUEE_LOGOS, ...MARQUEE_LOGOS];

  return (
    <div style={{ marginBottom: 48 }}>
      {/* 1. Self-contained Keyframes style block injection */}
      <style>{`
        @keyframes forcedMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .forced-track-container {
          display: flex !important;
          width: max-content !important;
          animation: forcedMarquee 30s linear infinite !important;
          will-change: transform;
        }
      `}</style>

      {/* Title Header */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9, color: 'var(--cyan)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        marginBottom: 18, opacity: 0.65,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ opacity: 0.4 }}>◆</span>
        Tech Stack
        <span style={{ flex: 1, height: 1, background: 'var(--divider-gradient)' }} />
      </div>

      {/* Outer Viewport Box */}
      <div
        style={{
          position: 'relative',
          paddingBottom: 4,
          overflow: 'hidden',
          width: '100%',
          maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
        }}
      >
        {/* Animated Slide Track */}
        <div
          className="forced-track-container"
          style={{ alignItems: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.animationPlayState = 'paused'; }}
          onMouseLeave={e => { e.currentTarget.style.animationPlayState = 'running'; }}
        >
          {track.map((logo, i) => (
            <LogoItem key={`${logo.name}-${i}`} {...logo} />
          ))}
        </div>
      </div>

      {/* Bottom accent rule */}
      <div style={{ height: 1, background: 'var(--center-divider-gradient)', marginTop: 20 }} />
    </div>
  );
}