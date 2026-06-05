// views/ContactView.jsx
// Contact info cards: staggered pop-up reveal.
// Form: fade-up with slight delay.
// Motion whileInView for all entrance animations.

import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Linkedin, Github } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import Footer from '../components/Footer.jsx';
import { CONTACT_INFO, PERSONAL } from '../models/portfolioData.js';

const ICON_MAP = { mail: Mail, phone: Phone, linkedin: Linkedin, github: Github };

function ContactCard({ icon, label, value, href, delay }) {
  const [hov, setHov] = useState(false);
  const Icon = ICON_MAP[icon] || Mail;

  return (
    <ScrollReveal variant="popUp" delay={delay}>
      <motion.a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        animate={{
          borderColor: hov ? 'var(--cyan)' : 'var(--border-subtle)',
          background: hov ? 'var(--nav-hover-bg)' : 'var(--item-bg)',
        }}
        transition={{ duration: 0.35 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '18px 22px',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          background: 'var(--item-bg)',
          backdropFilter: 'blur(8px)',
          textDecoration: 'none',
          cursor: 'pointer',
          boxShadow: hov ? 'var(--shadow-hover)' : 'none',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: hov ? 'var(--accent-bg-hover)' : 'var(--border-subtle)',
          border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.35s',
        }}>
          <Icon size={18} color="var(--cyan)" strokeWidth={1.5} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--muted)', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 3,
          }}>{label}</div>
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 13.5,
            color: hov ? 'var(--cyan)' : 'var(--text)',
            transition: 'color 0.3s',
          }}>{value}</div>
        </div>
      </motion.a>
    </ScrollReveal>
  );
}

export default function ContactView() {
  const [vals, setVals] = useState({ name: '', email: '', purpose: '', message: '' });
  const [focused, setFocused] = useState(null);
  const [sent, setSent] = useState(false);
  const [btnHov, setBtnHov] = useState(false);

  const fieldStyle = f => ({
    width: '100%',
    background: focused === f ? 'var(--nav-hover-bg)' : 'var(--item-bg)',
    border: `1px solid ${focused === f ? 'var(--cyan)' : 'var(--border-subtle)'}`,
    borderRadius: 7,
    padding: '13px 15px',
    color: 'var(--text)', fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.3s ease, background 0.3s ease',
    boxShadow: focused === f ? '0 0 0 3px var(--accent-glow)' : 'none',
  });

  return (
    <section
      id="contact"
      style={{
        minHeight: '100%',
        width: '100%',

        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          padding: '40px clamp(24px,5vw,72px) 80px',
        }}
      >
        <SectionHeading
          tag="Contact"
          title="Start a Conversation"
          subtitle="Have a project, an opportunity, or just want to connect?"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(300px,1fr))',
            gap: 40,
          }}
        >
          {/* Contact info cards */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <ScrollReveal variant="fromLeft" delay={0}>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  lineHeight: 1.82,
                  marginBottom: 8,
                }}
              >
                I'm currently open to full-time roles,
                freelance engagements, and collaborative
                projects. The best way to reach me is via
                email or LinkedIn.
              </p>
            </ScrollReveal>

            {CONTACT_INFO.map((info, i) => (
              <ContactCard
                key={info.label}
                {...info}
                delay={0.08 + i * 0.07}
              />
            ))}

            <ScrollReveal
              variant="fadeUp"
              delay={0.45}
            >
              <div
                style={{
                  display: 'inline-flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 14px',
                  background: 'var(--glow-1)',
                  border:
                    '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--cyan)',
                    opacity: 0.7,
                  }}
                />

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    color: 'var(--muted)',
                  }}
                >
                  {PERSONAL.location}
                </span>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact form */}
          <ScrollReveal variant="fromRight" delay={0.12}>
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: '44px', textAlign: 'center',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  background: 'var(--glow-1)',
                }}
              >
                <div style={{ fontSize: 34, marginBottom: 14, color: 'var(--cyan)', opacity: 0.8 }}>✦</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 10, color: 'var(--cyan)' }}>
                  Message Transmitted
                </h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: 14 }}>
                  Thanks for reaching out. I'll reply within 24 hours.
                </p>
              </motion.div>
            ) : (
              <div style={{
                background: 'var(--nav-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 18, padding: '38px',
                backdropFilter: 'blur(14px)',
                position: 'relative', overflow: 'hidden',
                boxShadow: 'var(--shadow)',
              }}>
                {/* Top accent */}
                <div style={{
                  position: 'absolute', top: 0, left: '18%', right: '18%', height: 1,
                  background: 'var(--center-divider-gradient)',
                  opacity: 1,
                }} />

                {/* Name & Email Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {['name', 'email'].map(f => (
                    <div key={f}>
                      <label style={{
                        display: 'block', marginBottom: 7,
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: 'var(--muted)', opacity: 0.85,
                      }}>{f === 'name' ? 'Your Name' : 'Email'}</label>
                      <input
                        type={f === 'email' ? 'email' : 'text'}
                        value={vals[f]}
                        onChange={e => setVals(v => ({ ...v, [f]: e.target.value }))}
                        onFocus={() => setFocused(f)}
                        onBlur={() => setFocused(null)}
                        placeholder={f === 'name' ? 'Juan Dela Cruz' : 'you@example.com'}
                        style={fieldStyle(f)}
                      />
                    </div>
                  ))}
                </div>

                {/* Purpose Input */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 7, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', opacity: 0.85 }}>
                    Purpose / Title
                  </label>
                  <input
                    type="text"
                    value={vals.purpose}
                    onChange={e => setVals(v => ({ ...v, purpose: e.target.value }))}
                    onFocus={() => setFocused('purpose')}
                    onBlur={() => setFocused(null)}
                    placeholder="e.g. Freelance Project, Job Opportunity"
                    style={fieldStyle('purpose')}
                  />
                </div>

                {/* Message Input */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 7, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', opacity: 0.85 }}>
                    Message
                  </label>
                  <textarea
                    value={vals.message}
                    onChange={e => setVals(v => ({ ...v, message: e.target.value }))}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                    placeholder="Describe your project or opportunity..."
                    rows={5}
                    style={{ ...fieldStyle('message'), resize: 'vertical', minHeight: 112 }}
                  />
                </div>

                {/* Transmit Button */}
                <button
                  onClick={() => { if (vals.name && vals.email && vals.purpose && vals.message) setSent(true); }}
                  onMouseEnter={() => setBtnHov(true)}
                  onMouseLeave={() => setBtnHov(false)}
                  style={{
                    background: btnHov ? 'var(--accent-bg-hover)' : 'var(--accent-glow)',
                    border: '1px solid var(--accent-border-hover)',
                    borderRadius: 7,
                    padding: '13px 34px',
                    color: 'var(--cyan)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600, fontSize: 12, letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'background 0.35s ease, opacity 0.35s ease',
                    opacity: btnHov ? 1 : 0.85,
                    width: '100%',
                  }}
                >
                  TRANSMIT MESSAGE
                </button>
              </div>
            )}
          </ScrollReveal>
        </div>
      </div>

      {/* Footer becomes part of page flow */}
      <div
        style={{
          marginTop: 'auto',
        }}
      >
        <Footer />
      </div>
    </section>
  );
}