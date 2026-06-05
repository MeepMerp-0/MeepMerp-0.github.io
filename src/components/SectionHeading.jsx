// components/SectionHeading.jsx

import ScrollReveal from './ScrollReveal.jsx';

export default function SectionHeading({
  tag,
  title,
  subtitle,
}) {
  return (
    <div
      style={{
        marginBottom: 'clamp(36px, 6vw, 64px)',
      }}
    >
      <ScrollReveal
        variant="fromLeft"
        delay={0}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--cyan)',

            letterSpacing: '0.2em',
            textTransform: 'uppercase',

            marginBottom: 14,

            display: 'flex',
            alignItems: 'center',
            gap: 14,

            opacity: 0.85,

            flexWrap: 'nowrap',
          }}
        >
          <span
            style={{
              opacity: 0.5,
              flexShrink: 0,
            }}
          >
            ◆
          </span>

          <span
            style={{
              flexShrink: 0,
            }}
          >
            {tag}
          </span>

          <span
            style={{
              width: 'clamp(80px, 18vw, 260px)',
              height: 1,

              background:
                'var(--divider-gradient)',

              flexShrink: 1,
            }}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal
        variant="fadeUp"
        delay={0.08}
      >
        <h2
          style={{
            fontFamily:
              'var(--font-display)',

            fontSize:
              'clamp(28px, 5vw, 50px)',

            fontWeight: 700,

            letterSpacing: '-0.02em',

            lineHeight: 1.1,

            background:
              'var(--heading-gradient)',

            WebkitBackgroundClip:
              'text',

            WebkitTextFillColor:
              'transparent',

            marginBottom: 18,
          }}
        >
          {title}
        </h2>
      </ScrollReveal>

      {subtitle && (
        <ScrollReveal
          variant="fadeUp"
          delay={0.16}
        >
          <p
            style={{
              color: 'var(--muted)',

              fontSize:
                'clamp(13px, 2vw, 15px)',

              maxWidth: 520,

              lineHeight: 1.78,

              margin: 0,
            }}
          >
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}