export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '40px 20px',
      marginTop: '40px',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--muted)',
      opacity: 0.5,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 5 }}>
        <div style={{ width: 40, height: 1, background: "var(--center-divider-gradient)" }} />
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--cyan)", opacity: 0.6 }} />
        <div style={{ width: 40, height: 1, background: "var(--center-divider-gradient)" }} />
      </div>
      © 2026 · CRAFTED WITH PRECISION
    </footer>
  );
}
