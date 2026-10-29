// HMAC-SHA256 over Web Crypto, with text secrets and unpadded base64url signatures.

// A base64url HMAC-SHA256: 32 bytes in 43 characters.
export const SIG_RE = /^[A-Za-z0-9_-]{43}$/;

const enc = new TextEncoder();
export const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hmacKey = (secret) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function hmac(secret, text) {
  return b64u(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text)));
}

export async function hmacOk(secret, text, sig) {
  try {
    return await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(text));
  } catch {
    return false;
  }
}
