// views/ContactView.jsx

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Phone,
  Linkedin,
  Github,
} from 'lucide-react';

import SectionHeading from '../components/SectionHeading.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import Footer from '../components/Footer.jsx';

import {
  CONTACT_INFO,
  PERSONAL,
} from '../models/portfolioData.js';

const ICON_MAP = {
  mail: Mail,
  phone: Phone,
  linkedin: Linkedin,
  github: Github,
};

function navigateToHref(href) {
  if (!href) return;

  if (href.startsWith('http')) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  location.href = href;
}

function ContactCard({ icon, label, value, href, delay }) {
  const [hov, setHov] = useState(false);
  const [copied, setCopied] = useState(false);

  const Icon = ICON_MAP[icon] || Mail;

  function handleClick(e) {
    e.preventDefault();

    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
        navigateToHref(href);
      }, 900);
    });
  }

  return (
    <ScrollReveal variant="popUp" delay={delay}>
      <motion.a
        href={href}
        onClick={handleClick}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        animate={{
          borderColor: copied
            ? 'var(--cyan)'
            : hov
              ? 'var(--cyan)'
              : 'var(--border-subtle)',
          background: hov ? 'var(--nav-hover-bg)' : 'var(--item-bg)',
        }}
        transition={{ duration: 0.35 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '18px 20px',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          background: 'var(--item-bg)',
          backdropFilter: 'blur(8px)',
          textDecoration: 'none',
          cursor: 'pointer',
          boxShadow: hov ? 'var(--shadow-hover)' : 'none',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            minWidth: 40,
            borderRadius: 8,
            background: hov ? 'var(--accent-bg-hover)' : 'var(--border-subtle)',
            border: '1px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color="var(--cyan)" strokeWidth={1.5} />
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13.5,
              color: hov ? 'var(--cyan)' : 'var(--text)',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {value}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 6 }}
          animate={
            copied
              ? { opacity: 1, scale: 1, x: 0 }
              : { opacity: 0, scale: 0.8, x: 6 }
          }
          transition={{ duration: 0.2 }}
          style={{
            flexShrink: 0,
            display: copied ? 'flex' : 'none',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 20,
            background: 'var(--accent-bg-hover)',
            border: '1px solid var(--accent-border)',
            pointerEvents: 'none',
            maxWidth: '40%',
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--cyan)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--cyan)',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}
          >
            COPIED
          </span>
        </motion.div>
      </motion.a>
    </ScrollReveal>
  );
}

function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof globalThis !== 'undefined' && globalThis.innerWidth <= bp
  );

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !globalThis.matchMedia) return;

    const mq = globalThis.matchMedia(`(max-width:${bp}px)`);
    const handler = (e) => setIsMobile(e.matches);

    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, [bp]);

  return isMobile;
}

export default function ContactView() {
  const [vals, setVals] = useState({
    name: '',
    email: '',
    purpose: '',
    message: '',
  });

  const [focused, setFocused] = useState(null);
  const [sent, setSent] = useState(false);
  const [btnHov, setBtnHov] = useState(false);

  const isMobile = useIsMobile();

  const fieldStyle = (f) => ({
    width: '100%',
    background: focused === f ? 'var(--nav-hover-bg)' : 'var(--item-bg)',
    border: `1px solid ${focused === f ? 'var(--cyan)' : 'var(--border-subtle)'}`,
    borderRadius: 7,
    padding: '13px 15px',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
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
          padding: isMobile ? '24px 16px 56px' : '40px clamp(16px,4vw,72px) 80px',
          boxSizing: 'border-box',
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
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            gap: 'clamp(24px,4vw,40px)',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <ScrollReveal variant="fromLeft" delay={0}>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  lineHeight: 1.82,
                  marginBottom: 8,
                }}
              >
                I'm currently open to full-time roles, freelance engagements,
                and collaborative projects. The best way to reach me is via
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

            <ScrollReveal variant="fadeUp" delay={0.45}>
              <div
                style={{
                  display: 'inline-flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 14px',
                  background: 'var(--glow-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  marginTop: 4,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--cyan)',
                    opacity: 0.7,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    color: 'var(--muted)',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {PERSONAL.location}
                </span>
              </div>
            </ScrollReveal>
          </div>

          <div style={{ minWidth: 0 }}>
            <ScrollReveal variant="fromRight" delay={0.12}>
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  style={{
                    padding: 'clamp(24px,5vw,44px)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 14,
                    background: 'var(--glow-1)',
                  }}
                >
                  <div style={{ fontSize: 34, marginBottom: 14, color: 'var(--cyan)' }}>
                    ✦
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      marginBottom: 10,
                      color: 'var(--cyan)',
                    }}
                  >
                    Message Transmitted
                  </h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
                    Thanks for reaching out. I'll reply within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <div
                  style={{
                    background: 'var(--nav-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 18,
                    padding: 'clamp(20px,4vw,38px)',
                    backdropFilter: 'blur(14px)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow)',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '18%',
                      right: '18%',
                      height: 1,
                      background: 'var(--center-divider-gradient)',
                    }}
                  />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                      gap: 16,
                      marginBottom: 16,
                    }}
                  >
                    {['name', 'email'].map((f) => (
                      <div key={f} style={{ minWidth: 0 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: 7,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'var(--muted)',
                          }}
                        >
                          {f === 'name' ? 'Name' : 'Email'}
                        </label>
                        <input
                          placeholder={f === 'name' ? 'Your name' : 'you@example.com'}
                          type={f === 'email' ? 'email' : 'text'}
                          value={vals[f]}
                          onChange={(e) => setVals((v) => ({ ...v, [f]: e.target.value }))}
                          onFocus={() => setFocused(f)}
                          onBlur={() => setFocused(null)}
                          style={fieldStyle(f)}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: 7,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Subject
                    </label>
                    <input
                      placeholder="Purpose / Title"
                      value={vals.purpose}
                      onChange={(e) => setVals((v) => ({ ...v, purpose: e.target.value }))}
                      onFocus={() => setFocused('purpose')}
                      onBlur={() => setFocused(null)}
                      style={fieldStyle('purpose')}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: 7,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Message
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Describe your project or opportunity..."
                      value={vals.message}
                      onChange={(e) => setVals((v) => ({ ...v, message: e.target.value }))}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused(null)}
                      style={{ ...fieldStyle('message'), resize: 'vertical' }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (vals.name && vals.email && vals.purpose && vals.message) {
                        setSent(true);
                      }
                    }}
                    onMouseEnter={() => setBtnHov(true)}
                    onMouseLeave={() => setBtnHov(false)}
                    style={{
                      width: '100%',
                      background: btnHov ? 'var(--accent-bg-hover)' : 'var(--accent-glow)',
                      border: '1px solid var(--accent-border-hover)',
                      borderRadius: 7,
                      padding: '14px 20px',
                      color: 'var(--cyan)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    TRANSMIT MESSAGE
                  </button>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Footer />
      </div>
    </section>
  );
}