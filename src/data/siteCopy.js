// Page copy for the hero, About, Process and Contact. Facts come from portfolioData.js; work arrangements were
// confirmed by Jason for this rework. Aki does not read this file, so editing it does not change Aki's answers.
import { EXPERIENCE, PERSONAL } from './portfolioData.js';

export const HERO = {
  eyebrow: `${PERSONAL.name} · ${PERSONAL.title}`,
  location: 'Abu Dhabi, UAE',
  headline: ['From inputs', 'to impact.'],
  lead: 'I build full-stack applications, AI agents, and workflows that turn complex processes into useful software.',
  availability: 'Open to full-time roles: on-site or hybrid in the UAE, or remote with international teams.',
  focus: ['Full-stack web apps and MVPs', 'AI agents and workflow automation', 'Business systems, dashboards and APIs'],
  // The three layers the Hero scene travels through, in order.
  stages: [
    { name: 'Inputs', description: 'Requests, messages and records arrive.' },
    { name: 'Intelligence', description: 'Agents sort, decide and route the work.' },
    { name: 'Application', description: 'Useful software people rely on.' },
  ],
};

export const ABOUT = {
  title: 'Interfaces, logic, AI, and the business around them.',
  intro: [
    `I'm Jason, an ${PERSONAL.title} based in Abu Dhabi. I like taking slow, manual processes and turning them into clear software that people are comfortable relying on.`,
    'Most useful problems cross layers. I work from the screen a person touches, through the application logic and APIs behind it, to the AI workflow that drafts or routes work, and the approvals and records that keep a business in control of it.',
  ],
  arrangements: [
    { label: 'Looking for', value: 'Full-time AI or software engineering roles' },
    { label: 'Arrangement', value: 'On-site or hybrid in the UAE, or remote with international teams' },
    { label: 'Also open to', value: 'Well-scoped freelance work and partnerships' },
    { label: 'Based in', value: 'Abu Dhabi, United Arab Emirates' },
  ],
  experience: EXPERIENCE.map(({ company, role, period, engagement }) => ({
    company, role: engagement ? `${role} (${engagement})` : role, period,
  })),
  capabilities: [
    {
      id: 'fullstack',
      label: 'Full-stack apps & MVPs',
      body: 'Web and mobile applications from data model to interface: React and React Native with Node.js and PostgreSQL, Next.js with Supabase, and Laravel with Livewire and MySQL.',
      evidence: 'Timekeeping, Payroll & Attendance; INNERCIRCLE (current work); ERP-style admin dashboard at CliqueHA',
    },
    {
      id: 'agents',
      label: 'AI agents & automation',
      body: 'Multi-agent workflows with LangGraph.js and n8n, where the model can draft and route work but scoped access and human approval decide what happens. Aki adds a portfolio assistant on Cloudflare Workers with provider fallbacks.',
      evidence: 'INNERCIRCLE (current work); Aki',
    },
    {
      id: 'systems',
      label: 'Business systems & APIs',
      body: 'Operational tools with role-based access, audit trails, reporting, and integrations with outside APIs, built for the people who run the process every day.',
      evidence: 'INNERCIRCLE; ERP-style admin dashboard at CliqueHA',
    },
    {
      id: 'delivery',
      label: 'Planning & delivery',
      body: 'Turning a loose request into flows, technical boundaries and a plan, then shipping in small, reviewable steps with the checks written down.',
      evidence: 'Capstone project leadership; this rework',
    },
  ],
};

export const PROCESS_STEPS = [
  {
    id: 'understand',
    label: 'Understand',
    summary: 'Problem, users, constraints',
    focus: 'Clarify the problem, who it is for, what constrains it, and what matters most.',
    output: 'A short written brief: the problem, users, constraints, and priorities everyone agrees on.',
  },
  {
    id: 'shape',
    label: 'Shape',
    summary: 'Flows and boundaries',
    focus: 'Define the user flows, the technical boundaries, and an implementation plan in small steps.',
    output: 'Flows, a data and API outline, and a task plan with clear acceptance checks.',
  },
  {
    id: 'build',
    label: 'Build',
    summary: 'The useful core first',
    focus: 'Implement the core that delivers value, then iterate on working behaviour rather than on slides.',
    output: 'Working software in reviewable increments, demonstrated early.',
  },
  {
    id: 'verify',
    label: 'Verify',
    summary: 'Function, access, speed, edges',
    focus: 'Check functionality, accessibility, performance, and edge cases, and write down what was actually tested.',
    output: 'Test results, known limits, and a release that a person signs off.',
  },
];

// The contact form has no intent field, so an intent only fills the visible, editable "What is this about?" field.
export const CONTACT_INTENTS = [
  { id: 'fulltime', label: 'Full-time role' },
  { id: 'freelance', label: 'Freelance project' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'other', label: 'Something else' },
];
