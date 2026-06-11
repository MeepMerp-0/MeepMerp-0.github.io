// views/ContactView.jsx

import { useState } from 'react';
import { motion } from 'motion/react';

import SectionHeading from '../components/SectionHeading.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import Footer from '../components/Footer.jsx';
import ContactCard from '../components/ContactCard.jsx';

import {
  CONTACT_INFO,
  PERSONAL,
} from '../data/portfolioData.js';
import { submitContactForm } from '../services/formService.js';
import { useContactForm } from '../hooks/useContactForm.js';
import { useIsMobile } from '../hooks/useIsMobile.js';

// Sanitize error messages to prevent information leakage
function sanitizeError(error) {
  if (!error) return 'An error occurred';
  const sanitized = error
    .replace(/stack trace[\s\S]*/gi, '')
    .replace(/at\s+.*\(.*\):/gi, '')
    .replace(/Error:\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return sanitized || 'Submission failed. Please try again.';
}

export default function ContactView() {
  const {
    values,
    focused,
    sent,
    loading,
    error,
    showAsterisk,
    handleChange,
    handleFocus,
    handleBlur,
    handleSubmit,
    reset,
    MAX_MESSAGE_LENGTH,
  } = useContactForm(submitContactForm);

  const [btnHov, setBtnHov] = useState(false);
  const isMobile = useIsMobile();

  const fieldStyle = (f) => ({
    width: '100%',
    background: 'var(--item-bg)',
    border: `1px solid ${focused === f ? 'var(--cyan)' : showAsterisk[f] ? 'var(--fireorange)' : 'var(--border-subtle)'}`,
    borderRadius: 7,
    padding: '13px 15px',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease',
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
                  textAlign: 'justify',
                  wordBreak: 'break-word',
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
              ) : error ? (
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
                    ⚠
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      marginBottom: 10,
                      color: 'var(--cyan)',
                    }}
                  >
                    Transmission Failed
                  </h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
                    {sanitizeError(error)}
                  </p>
                  <button
                    onClick={() => {
                      reset();
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
                    TRY AGAIN
                  </button>
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
                            fontSize: 12,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'var(--muted)',
                          }}
                        >
                          {f === 'name' ? 'Name' : 'Email'}{showAsterisk[f] && <span style={{ color: 'var(--fireorange)' }}>*</span>}
                        </label>
                        <input
                          placeholder={f === 'name' ? 'Your name' : 'you@example.com'}
                          type={f === 'email' ? 'email' : 'text'}
                          value={values[f]}
                          onChange={(e) => handleChange(f)(e.target.value)}
                          onFocus={handleFocus(f)}
                          onBlur={handleBlur}
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
                        fontSize: 12,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Subject{showAsterisk.purpose && <span style={{ color: 'var(--fireorange)' }}>*</span>}
                    </label>
                    <input
                      placeholder="Purpose / Title"
                      value={values.purpose}
                      onChange={(e) => handleChange('purpose')(e.target.value)}
                      onFocus={handleFocus('purpose')}
                      onBlur={handleBlur}
                      style={fieldStyle('purpose')}
                    />
                  </div>

                  <div style={{ position: 'absolute', left: '-9999px' }}>
                    <label htmlFor="website-hp" aria-hidden="true">
                      Website
                    </label>
                    <input
                      id="website-hp"
                      type="text"
                      tabIndex={-1}
                      value={values.website}
                      onChange={(e) => handleChange('website')(e.target.value)}
                      style={{ width: '1px', height: '1px', padding: 0, margin: 0, overflow: 'hidden', position: 'absolute' }}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: 7,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                      }}
                    >
                      Message{showAsterisk.message && <span style={{ color: 'var(--fireorange)' }}>*</span>}
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Describe your project or opportunity..."
                      value={values.message}
                      onChange={(e) => handleChange('message')(e.target.value)}
                      onFocus={handleFocus('message')}
                      onBlur={handleBlur}
                      style={{ ...fieldStyle('message'), resize: 'vertical' }}
                    />
                    <div style={{
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: values.message.length >= MAX_MESSAGE_LENGTH ? 'var(--cyber-red)'
                        : values.message.length >= MAX_MESSAGE_LENGTH * 0.8 ? 'var(--fireorange)'
                          : values.message.length >= MAX_MESSAGE_LENGTH * 0.6 ? 'var(--yellow)'
                            : 'var(--cyan)',
                      marginTop: 4
                    }}>
                      {values.message.length > MAX_MESSAGE_LENGTH ? 'Message exceeds maximum length' : `${values.message.length}/${MAX_MESSAGE_LENGTH}`}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    onMouseEnter={() => !loading && setBtnHov(true)}
                    onMouseLeave={() => setBtnHov(false)}
                    style={{
                      width: '100%',
                      background: loading
                        ? 'var(--item-bg)'
                        : btnHov
                          ? 'var(--accent-bg-hover)'
                          : 'var(--accent-glow)',
                      border: '1px solid var(--accent-border-hover)',
                      borderRadius: 7,
                      padding: '14px 20px',
                      color: loading
                        ? 'var(--muted)'
                        : 'var(--cyan)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'TRANSMITTING...' : 'TRANSMIT MESSAGE'}
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