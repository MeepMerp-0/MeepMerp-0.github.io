// components/SectionHeading.jsx
import ScrollReveal from './ScrollReveal.jsx';

export default function SectionHeading({ tag, title, subtitle }) {
  return (
    <div style={{ marginBottom: 64 }}>
      <ScrollReveal variant="fromLeft" delay={0}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10, color: 'var(--cyan)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 14,
          opacity: 0.85,
        }}>
          <span style={{ opacity: 0.5 }}>◆</span>
          {tag}
          <span
            style={{
              width: 'clamp(120px,18vw,260px)',
              height: 1,
              background: 'var(--divider-gradient)',
            }}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp" delay={0.08}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px,5vw,50px)',
          fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1,
          background: 'var(--heading-gradient)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 18,
        }}>{title}</h2>
      </ScrollReveal>

      {subtitle && (
        <ScrollReveal variant="fadeUp" delay={0.16}>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 520, lineHeight: 1.78 }}>
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
