// components/ProfilePortal.jsx

export default function ProfilePortal({
  size = 300,
  opacity = 1,
  photoSrc,
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        opacity,
        willChange: 'opacity',
      }}
    >
      {/* Outer orbit ring */}
      <div
        style={{
          position: 'absolute',
          inset: -Math.max(8, size * 0.07),
          borderRadius: '50%',
          border: '1px solid var(--accent-border)',
          animation: 'orbitCW 28s linear infinite',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -3,
            left: '50%',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--cyan)',
            opacity: 0.85,
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Inner orbit ring */}
      <div
        style={{
          position: 'absolute',
          inset: -Math.max(4, size * 0.03),
          borderRadius: '50%',
          border: '1px solid var(--accent-border)',
          animation: 'orbitCCW 18s linear infinite',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: -3,
            left: '50%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--blue)',
            opacity: 0.75,
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Breath ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1.5px solid var(--accent-border-hover)',
          animation: 'ringBreath 8s ease-in-out infinite',
        }}
      />

      {/* Avatar */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1.5px solid var(--accent-border-hover)',
          boxShadow: 'var(--shadow)',
          background:
            'linear-gradient(145deg,var(--bg2),var(--bg3))',
        }}
      >
        {photoSrc ? (
          <img
            src={photoSrc}
            alt="Jason Selerio"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}