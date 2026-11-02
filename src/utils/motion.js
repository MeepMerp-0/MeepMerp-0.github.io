// The site's main easing curve: a fast start that settles gently into place. global.css repeats it once as
// cubic-bezier(.22, 1, .36, 1).
export const EASE_OUT = [0.22, 1, 0.36, 1];

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// One frame of a left-to-right decode at progress k (0..1). Letters and digits not yet settled become random glyphs;
// everything else stays, so a monospace label keeps its width and its break points.
export function scrambleFrame(text, k, random = Math.random) {
  const chars = [...text];
  const settled = Math.floor(k * chars.length);
  return chars.map((ch, i) => (i < settled || !/[a-z0-9]/i.test(ch) ? ch : GLYPHS[Math.floor(random() * GLYPHS.length)])).join('');
}
