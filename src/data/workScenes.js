// The four Work chapters, in scroll order. Copy paraphrases the public records in portfolioData.js and stays inside
// their disclosure limits. PROJECTS itself is not edited: Aki's prompt reads it.
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
    result: 'The robot in the corner of this page is Aki itself, not a separate demo.',
    // Shown instead when this build has no Aki connection, so the copy never points at a robot that is not there.
    resultWithoutAki: 'Aki is not connected in this build; its source is linked below.',
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
    approach: ['Proximity check before a guard can clock in', 'Biometric face authentication on the guard\'s phone',
      'Attendance logged to the web dashboard automatically', 'Near-instant payroll generation',
      'Supabase real-time sync with RLS'],
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
    title: 'FuturoHub Web and Workflow Automation',
    role: 'FuturoHub · Freelance web development and workflow automation · Current',
    context: 'FuturoHub needed its web presence, a collection of related sites and demos, and workflow automations that pass each request on to its next action, delivered as freelance work.',
    built: FUTUROHUB.desc,
    approach: [...FUTUROHUB.highlights, 'Workflow automations that route each request to its next action'],
    tech: FUTUROHUB.tech,
    techNote: FUTUROHUB.techContext,
    result: 'Live sites, linked below.',
    links: FUTUROHUB.links.map((link) => ({ ...link, external: true })),
    samples: FUTUROHUB.samples,
    demo: {
      src: 'demos/website/index.html',
      title: 'Fictional client website and workflow illustration',
      note: 'An invented business, written for this portfolio. It is not a FuturoHub site, and its form and simulated workflow send nothing.',
    },
  },
];
