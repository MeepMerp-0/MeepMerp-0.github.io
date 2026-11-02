import { PERSONAL, PROJECTS, SKILL_GROUPS, AVAILABILITY, WHATSAPP_URL } from './portfolioData.js';

const aiProjects = PROJECTS.filter((p) => ['innercircle-operations', 'aki', 'workflow'].includes(p.id));

// Fixed answers built from portfolioData; links are the only non-text content.
export const AKI_FAQ = [
  {
    id: 'hire',
    label: 'Is Jason open to new work?',
    answer: `Yes. Jason is looking for a full-time role as an ${AVAILABILITY.fullTime} and is also open to freelance work: ${AVAILABILITY.freelance[0].toLowerCase()}${AVAILABILITY.freelance.slice(1)}. Reach out through the contact form, WhatsApp, or email ${PERSONAL.email}.`,
    links: [{ label: 'Contact form', href: '#contact' }, { label: 'WhatsApp', href: WHATSAPP_URL }, { label: 'Email Jason', href: `mailto:${PERSONAL.email}` }],
  },
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
];

// Sent to /v1/session and compared with the legal page and the Worker; never copied from a Worker response.
export const AKI_CONSENT_VERSION = '2026-10-28.1';

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
  voiceNotice: "Voice chat uses your browser's own speech service (for example Google in Chrome, Microsoft in Edge, Apple in Safari), which hears what you say. I only get the text. When you finish speaking, or tap stop, your words go in the box for you to check and send.",
  voiceNoticeServer: "This browser has no speech service of its own, so your recording goes to my server and on to Groq, or Cloudflare as a backup, to become text. I only use the text. When you finish speaking, or tap stop, your words go in the box for you to check and send.",
  micBlocked: "I can't hear you: microphone access is blocked. Allow it in your browser settings, or type instead.",
  voiceFailed: "Voice didn't work in this browser just now. Try again, or type instead.",
  voiceNetwork: "I can't reach your browser's speech service. Some browsers switch it off; voice works in Chrome, Edge and Safari. You can still type.",
  voiceBusy: 'Voice is busy right now. Try again shortly, or type instead.',
  voiceDown: "Voice isn't available right now. You can still type.",
  listening: 'Listening\u2026',
  // Screen readers only: what a voice turn left in the box.
  voiceReady: (text) => `In the box, ready to send: ${text}`,
  head: { ok: 'Aki \u00B7 Here to help', typing: 'Aki \u00B7 Typing\u2026', busy: 'Aki \u00B7 Busy', down: 'Aki \u00B7 Not connected' }
};

// Single source for the welcome screen and its smoke test.
export const AKI_WELCOME_COPY = {
  eyebrow: 'One quick thing before we start',
  headingTop: 'Hey there!',
  headingBottom: "I'm Aki.",
  intro: "I'm Jason's AI portfolio assistant. I'm an AI, not Jason. Ask me about Jason's projects, experience or tech stack.",
  accept: { title: 'I accept the Terms of Use.', link: 'Terms of Use', body: 'Required to chat.' },
  gemini: {
    title: 'Use Google Gemini for my answers (optional).',
    body: 'I understand that my conversation may be processed by Google Gemini and, under its free-tier terms, may be used for service improvement, including human review. Ticked by default. Untick it and Groq answers instead, with Cloudflare Workers AI as a backup.',
  },
  // Owner decision D23: pre-ticked wherever the card is shown (eligible regions only).
  geminiDefault: true,
  storage: {
    unknown: '\u{1F4BE} Chats stay in this browser for 7 days (until you close the tab in the EEA, UK and Switzerland). Clear anytime.',
    default_on: '\u{1F4BE} Chats stay in this browser for 7 days. Clear anytime.',
    opt_in: '\u{1F4BE} Chats stay in this browser until you close the tab. Clear anytime.',
  },
  noteGemini: "Your messages are answered by an AI provider: Google Gemini if this box stays ticked, otherwise Groq, with Cloudflare Workers AI as a backup and, if the box stays ticked, Google's Gemma as a last resort. Please don't share personal or sensitive information.",
  noteGroq: "Your messages are answered by Groq, an AI provider, with Cloudflare Workers AI as a backup. Please don't share personal or sensitive information.",
  continueLabel: 'Continue to Aki \u2192',
  checking: 'Checking\u2026',
  notNow: 'Not now',
  hint: 'Accept the Terms of Use to continue.',
  verifying: 'One moment: Cloudflare is checking this browser before the chat opens.',
  privacy: 'Privacy',
  terms: 'Terms of use',
};
