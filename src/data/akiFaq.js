import { PERSONAL, PROJECTS, SKILL_GROUPS } from './portfolioData.js';

const aiProjects = PROJECTS.filter((p) => ['innercircle-operations', 'workflow'].includes(p.id));

// Fixed answers built from portfolioData; links are the only non-text content.
export const AKI_FAQ = [
  {
    id: 'ai',
    label: 'What AI systems has Jason built?',
    answer: `${aiProjects.map((p) => `${p.title}: ${p.desc}`).join(' ')} Some work is private and has no public demo.`,
    links: [{ label: 'See the work', href: '#work' }],
  },
  {
    id: 'stack',
    label: "What's Jason's tech stack?",
    answer: `Jason works with ${SKILL_GROUPS.flatMap((g) => g.items).join(', ')}.`,
    links: [{ label: 'About', href: '#about' }],
  },
  {
    id: 'contact',
    label: 'How can I contact Jason?',
    answer: `Use the contact form, or email ${PERSONAL.email}.`,
    links: [{ label: 'Contact form', href: '#contact' }, { label: 'Email Jason', href: `mailto:${PERSONAL.email}` }],
  },
];

// Sent to /v1/session and compared with the legal page and the Worker; never copied from a Worker response.
export const AKI_CONSENT_VERSION = '2026-10-16.5';

export const AKI_MESSAGES = {
  greetingHead: 'Hey there!',
  greetingBody: "I'm Aki, Jason's AI portfolio assistant. I can help with projects, experience, or the technologies Jason works with. Where should we start?",
  tryAsking: 'Try asking',
  typing: 'Aki is typing\u2026',
  failure: "Hmm, I can't reach my AI service right now \u{1F615} Here are some quick answers, or try again shortly.",
  quota: (at) => `Aki has used up today's free answers \u{1F64F} ${at ? `Free-text chat is back ${at}. ` : 'Try again tomorrow. '}The quick answers below still work.`,
  veryBusy: (n) => `Aki is very busy right now. Try again in ${n} seconds.`,
  retry: (n) => `Quick pause to keep things spam-free \u270B You can send another message in ${n} seconds.`,
  region: "Free-text chat isn't available in your region, but these quick answers are \u{1F30D}",
  blocked: "I can't help with that one. Try a question about Jason's work \u{1F642}",
  updated: 'Aki was just updated. Please reload the page to continue.',
  noCrypto: 'Free-text chat needs a newer browser. Quick answers are still available.',
  tooLong: 'That message is too long. Please shorten it.',
  empty: 'Type a message first.',
  head: { ok: 'Aki \u00B7 Here to help', typing: 'Aki \u00B7 Typing\u2026', busy: 'Aki \u00B7 Busy', down: 'Aki \u00B7 Not connected' }
};

// Single source for the welcome screen and its smoke test.
export const AKI_WELCOME_COPY = {
  eyebrow: 'One quick thing before we start',
  headingTop: 'Hey there!',
  headingBottom: "I'm Aki.",
  intro: "I'm Jason's AI portfolio assistant. I'm an AI, not Jason. Ask me about Jason's projects, experience or tech stack. This chat is for visitors aged 18 or older.",
  age: { title: 'I confirm I am 18 or older.', body: "Required to chat. It's a self-declaration; we don't check ID." },
  gemini: {
    title: 'Use Google Gemini for my answers (optional).',
    body: 'I understand that my conversation may be processed by Google Gemini and, under its free-tier terms, may be used for service improvement, including human review. Ticked by default. Untick it and Groq answers instead.',
  },
  // Owner decision D23: pre-ticked wherever the card is shown (eligible regions only).
  geminiDefault: true,
  storage: {
    unknown: '\u{1F4BE} Chats stay in this browser for 7 days (until you close the tab in the EEA, UK and Switzerland). Clear anytime.',
    default_on: '\u{1F4BE} Chats stay in this browser for 7 days. Clear anytime.',
    opt_in: '\u{1F4BE} Chats stay in this browser until you close the tab. Clear anytime.',
  },
  noteGemini: "Your messages are answered by an AI provider: Groq, or Google Gemini if this box stays ticked. Please don't share personal or sensitive information.",
  noteGroq: "Your messages are answered by Groq, an AI provider. Please don't share personal or sensitive information.",
  continueLabel: 'Continue to Aki \u2192',
  notNow: 'Not now',
  hint: 'Tick the 18+ box to continue.',
  privacy: 'Privacy',
  terms: 'Terms of use',
};
