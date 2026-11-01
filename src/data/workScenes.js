// The four Work chapters, in scroll order. Copy paraphrases the public records in portfolioData.js and stays inside
// their disclosure limits (icm/shared/proof-register.md). PROJECTS itself is not edited: Aki's prompt reads it.
import { EMAIL_URL, EXPERIENCE, PROJECTS } from './portfolioData.js';

const project = (id) => PROJECTS.find((p) => p.id === id);
const AKI = project('aki');
const INNERCIRCLE = project('innercircle-operations');
const PAYROLL = project('thesis');
const FUTUROHUB = project('futurohub-sites');
const INNERCIRCLE_ROLE = EXPERIENCE.find((e) => e.company === 'INNERCIRCLE°');

export const WORK_SCENES = [
  {
    id: 'aki',
    chapter: 'Aki',
    title: 'Aki, the assistant on this page',
    role: 'Personal project · designed and built end to end · 2026',
    context: 'Visitors should be able to ask about my work in their own words instead of hunting through sections.',
    built: AKI.desc,
    approach: AKI.highlights,
    tech: AKI.tech,
    result: 'Live on this portfolio. The robot in the corner is the real assistant, not a demo.',
    askAki: true,
    links: [{ label: 'Worker source on GitHub', href: AKI.site, external: true }],
  },
  {
    id: 'innercircle',
    chapter: 'INNERCIRCLE',
    title: INNERCIRCLE.title,
    role: `${INNERCIRCLE_ROLE.company} · ${INNERCIRCLE_ROLE.role} · ${INNERCIRCLE_ROLE.period}`,
    context: 'Current company work on real estate operations, where AI assistance has to stay accountable to people.',
    built: INNERCIRCLE.desc,
    approach: INNERCIRCLE.highlights,
    tech: INNERCIRCLE.tech,
    result: `In progress. ${INNERCIRCLE.clickMessage}`,
    links: [{ label: 'Ask about this work', href: `${EMAIL_URL}?subject=INNERCIRCLE%20work%20enquiry` }],
  },
  {
    id: 'payroll',
    chapter: 'Timekeeping',
    title: 'Timekeeping, Payroll & Attendance',
    role: 'Capstone project · Lead Developer & Project Leader · 2025',
    context: 'Guard attendance and payroll were handled slowly, with days between the end of a period and a payroll run.',
    built: PAYROLL.desc,
    approach: ['Real-time attendance verification', 'Near-instant payroll generation', 'Supabase real-time sync with RLS',
      'Responsive admin dashboard'],
    tech: PAYROLL.tech,
    result: `${PAYROLL.metrics[0].label}: ${PAYROLL.metrics[0].value}.`,
    links: [{ label: 'Project site', href: PAYROLL.site, external: true }],
    demo: {
      src: 'demos/timekeeping/index.html',
      title: 'Fictional timekeeping and payroll demo',
      note: 'A separate illustration with invented people and numbers. It is not the delivered system and makes no payroll, tax, or compliance calculation.',
    },
  },
  {
    id: 'futurohub',
    chapter: 'FuturoHub',
    title: FUTUROHUB.title,
    role: 'FuturoHub · Freelance web development · Current',
    context: 'A growing company needed its web presence and a set of related sites built and kept moving.',
    built: FUTUROHUB.desc,
    approach: FUTUROHUB.highlights,
    tech: FUTUROHUB.tech,
    techNote: FUTUROHUB.techContext,
    result: 'Live sites, linked below.',
    links: FUTUROHUB.links.map((link) => ({ ...link, external: true })),
    samples: FUTUROHUB.samples,
    demo: {
      src: 'demos/website/index.html',
      title: 'Fictional client website illustration',
      note: 'An invented business, written for this portfolio. It is not a FuturoHub site and its form sends nothing.',
    },
  },
];
