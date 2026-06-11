// components/ContactCard.jsx

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Phone,
  Linkedin,
  Github,
} from 'lucide-react';

import ScrollReveal from './ScrollReveal.jsx';

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

export default ContactCard;