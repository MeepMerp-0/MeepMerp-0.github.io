import { useState } from 'react';

export default function CloseButton({ onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: 'none',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: hover ? 'var(--cyber-red)' : 'var(--muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 22,
        transition: 'color 0.15s ease',
      }}
      aria-label="Close"
    >
      ×
    </button>
  );
}