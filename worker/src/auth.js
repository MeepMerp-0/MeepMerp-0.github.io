// Who is asking: the signed session that records what the visitor agreed to, and the visitor's limiter key.

import { SIG_RE, b64u, hmac, hmacOk, unb64u } from './hmac.js';

// The first notices that named the chat backups (Workers AI, Gemma) and audio reaching Aki's server. Versions are
// dates, so they compare as text: a session agreed under an older notice never reaches what it was not told about.
export const BACKUP_NOTICE = '2026-10-21.1';
export const VOICE_NOTICE = '2026-10-28.1';

export const signSession = async (secret, claims) => {
  const payload = b64u(new TextEncoder().encode(JSON.stringify(claims)));
  return `${payload}.${await hmac(secret, `aki-session\n${payload}`)}`;
};

export async function verifySession(secret, token, now) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !SIG_RE.test(parts[1])) return null;
  if (!(await hmacOk(secret, `aki-session\n${parts[0]}`, parts[1]))) return null;
  try {
    const { sid, exp, cv, g } = JSON.parse(new TextDecoder().decode(unb64u(parts[0])));
    // Tokens minted before the consent gate have no cv or g, so they are refused (addendum §2).
    return typeof sid === 'string' && Number.isSafeInteger(exp) && exp > now && typeof cv === 'string' && typeof g === 'boolean'
      ? { sid, exp, cv, g }
      : null;
  } catch {
    return null;
  }
}

/** IPv4 as is; IPv6 reduced to its /64 prefix, so one IPv6 customer network is one visitor (B2). */
export function ipPrefix(ip) {
  const s = String(ip).trim().toLowerCase().split('%')[0];
  if (!s.includes(':')) return s;
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1];
  const [head, tail] = s.split('::');
  const groups = (x) => (x ? x.split(':').flatMap((g) => (g.includes('.') ? ['0', '0'] : [g])) : []);
  const h = groups(head);
  const t = groups(tail);
  const all = tail === undefined ? h : [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return `${all.slice(0, 4).map((g) => (parseInt(g, 16) || 0).toString(16)).join(':')}::/64`;
}

// The IP prefix under the IP secret, so the limiter keys visitors without storing an address.
export const visitorKey = (config, ip) => hmac(config.ipSecret, ipPrefix(ip));
