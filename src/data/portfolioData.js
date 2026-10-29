// ─── data/portfolioData.js ───

// The header's "Let's talk" button and Aki's WhatsApp link both open this chat.
export const WHATSAPP_URL = 'https://wa.me/971504482694?text=Hi%20Jason%2C%20I%20saw%20your%20portfolio%20and%20I%27d%20like%20to%20talk%20about%20a%20project%20or%20opportunity.';

export const PERSONAL = {
  name: 'Jason Selerio',
  title: 'AI & Full-Stack Engineer',
  tagline: 'AI & Full-Stack Engineer',
  headline:
    'I design agentic AI workflows and full-stack business applications—from LangGraph.js orchestration and API integrations to Next.js, TypeScript, and Supabase platforms.',
  email: 'jason.selerio@gmail.com',
  phone: '+971504482694',
  github: 'https://github.com/MeepMerp-0',
  website: 'https://meepmerp-0.github.io',
  location: 'Reem Island, Abu Dhabi, United Arab Emirates',
};

// Recruiter-facing role and responsibilities, aligned with the supplied CV.
// Role names, dates, employment arrangement and outcomes must stay factual.
export const EXPERIENCE = [
  {
    company: 'INNERCIRCLE°',
    role: 'Lead AI & Full-Stack Engineer',
    period: 'May 2026 – Present',
    link: 'https://www.innercirclerealtors.com/',
    summary: 'Developing real estate operations software and LangGraph.js multi-agent workflows with scoped API access, human approvals, RBAC, audit trails, and Coolify deployment.',
  },
  {
    company: 'FuturoHub',
    role: 'Web Development',
    engagement: 'Freelance',
    period: 'Current',
    link: 'https://futurohub.ae/',
    summary: 'Contributing to the FuturoHub site and related web experiences, including El Mejor, Cup Section, and six sample websites.',
  },
  {
    company: 'Freelance',
    role: 'Full-Stack Developer',
    period: 'February 2026 – Present',
    summary: 'Client web and mobile applications, operational tools, API integrations, automation workflows, responsive design, and ongoing maintenance.',
  },
  {
    company: 'CliqueHA Information Services OPC',
    role: 'Software Developer Intern',
    period: 'February 2026 – May 2026',
    link: 'https://cliqueha.com/',
    summary: 'Laravel and Livewire features, production fixes, and documentation that reduced client onboarding time by 25% and improved team efficiency by 15%.',
  },
  {
    company: 'JsquarEd Co. Ltd.',
    role: 'Desktop Application Developer',
    period: 'July 2024 – August 2025',
    summary: 'Windows inventory and waybill tools developed with C# and SQL Server.',
  },
];

// What Jason is open to next: the About card and Aki's quick answer read it, and the About story below uses fullTime.
export const AVAILABILITY = {
  fullTime: 'AI / Automation Engineer',
  freelance: 'Well-scoped projects in AI workflows, automation, and full-stack builds',
};

// On-page About content is built from canonical role and experience records above.
// Changing the current engagement or professional title updates this copy as well.
// index.html maintains its own static SEO metadata and must be reviewed separately.
export const ABOUT_STORY = [
  `Hi, I'm Jason, an ${PERSONAL.title} based in Abu Dhabi. I enjoy taking slow, manual processes and turning them into clear, dependable software that people actually like using.`,
  "These days I'm especially into agentic AI and automation: orchestrating multi-agent workflows, connecting tools with n8n and APIs, and building the guardrails that let AI take on real work while people stay in control of the decisions that matter.",
  `My latest role is ${EXPERIENCE[0].role} at ${EXPERIENCE[0].company}, where I'm ${EXPERIENCE[0].summary.replace(/^Developing /, 'developing ')}`,
  `I'm now looking for a full-time role as an ${AVAILABILITY.fullTime}, and I'm also open to well-scoped freelance engagements. If you have a workflow worth automating or a team that could use this kind of help, I'd love to hear from you.`,
];

// Content for the homepage field notes and the editorial About toolkit.
export const FOCUS_AREAS = [
  { title: 'Agentic AI', description: 'LangGraph.js orchestration, scoped API access, and human approval.' },
  { title: 'Full-stack platforms', description: 'Next.js, TypeScript, and Supabase for real business operations.' },
  { title: 'Integration & delivery', description: 'n8n, external APIs, role-based access, audit trails, and Coolify.' },
];

export const SKILL_GROUPS = [
  { label: '01 / AGENTIC AI', items: ['LangGraph.js', 'Multi-agent workflows', 'n8n', 'Human approvals'] },
  { label: '02 / FULL STACK', items: ['Next.js', 'TypeScript', 'React / React Native', 'Laravel / Livewire'] },
  { label: '03 / OPERATIONS', items: ['Supabase', 'API integrations', 'RBAC & audit trails', 'Coolify'] },
];

export const PROJECTS = [
  {
    id: 'innercircle-operations',
    tag: 'INNERCIRCLE° · Lead AI & Full-Stack Engineer',
    title: 'Real Estate Operations & Agentic AI',
    desc: 'Developing a real estate operations platform using Next.js, TypeScript, and Supabase for CRM, finance, reporting, and property analysis, alongside AI-assisted communication and document workflows.',
    tech: ['Next.js', 'TypeScript', 'Supabase', 'LangGraph.js', 'n8n', 'Coolify'],
    status: 'In progress',
    year: '2026',
    metrics: [],
    highlights: [
      'Multi-agent orchestration with scoped API access, checkpoints, and human approval',
      'Role-based access control, audit trails, and operational workflows',
      'External API integrations, automation, and self-hosted deployment',
    ],
    privateLabel: 'INTERNAL WORK / NO PUBLIC DEMO',
    clickMessage: 'Current company work. Application access and implementation details are not public.',
  },
  {
    id: 'aki',
    tag: 'Personal Project · AI & Full-Stack Engineer',
    title: 'Aki, Portfolio AI Assistant',
    desc: 'Built Aki, the chat assistant on this portfolio. It answers visitor questions from the portfolio’s own content through a Cloudflare Worker that keeps every API key off the site.',
    tech: ['React', 'Cloudflare Workers', 'Durable Objects', 'Gemini', 'Groq', 'Turnstile'],
    status: 'Completed',
    year: '2026',
    site: 'https://github.com/MeepMerp-0/MeepMerp-0.github.io/tree/main/worker',
    metrics: [],
    highlights: [
      'Gemini, Groq, and Workers AI fallbacks within free-tier daily caps',
      'Answers only from portfolio data, in the visitor’s language',
      'Terms acceptance, Turnstile bot checks, and region-aware privacy rules',
    ],
  },
  {
    id: 'futurohub-sites',
    tag: 'FuturoHub · Freelance web development',
    title: 'FuturoHub Web Experiences',
    desc: 'Freelance work on FuturoHub’s web presence and a collection of related sites and demos. Includes the company landing page, El Mejor, Cup Section, and six sample-site variants.',
    tech: ['Astro', 'Tailwind CSS', 'React'],
    techContext: 'Technologies verified for the FuturoHub company site; other sites may use different stacks.',
    status: 'In progress',
    year: 'Current',
    metrics: [],
    highlights: [
      'Company landing page and supporting web experiences',
      'El Mejor and Cup Section sites',
      'Six distinct sample websites',
    ],
    links: [
      { label: 'FuturoHub', href: 'https://futurohub.ae/' },
      { label: 'El Mejor', href: 'https://elmejor.futurohub.ae/' },
      { label: 'Cup Section', href: 'https://cup-section.futurohub.ae/' },
    ],
    samples: [
      { label: 'Sample 01', href: 'https://sample1.futurohub.ae/' },
      { label: 'Sample 02', href: 'https://sample2.futurohub.ae/' },
      { label: 'Sample 03', href: 'https://sample3.futurohub.ae/' },
      { label: 'Sample 04', href: 'https://sample4.futurohub.ae/' },
      { label: 'Sample 05', href: 'https://sample5.futurohub.ae/' },
      { label: 'Sample 06', href: 'https://sample6.futurohub.ae/' },
    ],
  },
  {
    id: 'christening-invitation',
    tag: 'Personal Project · Full-Stack Developer',
    title: 'Mobile Event Invitation Platform',
    desc: 'Created a mobile-friendly digital christening invitation that improved event information clarity and accessibility for guests.',
    tech: ['Canva'],
    accent: 'var(--soft)',
    status: 'Completed',
    year: '2026',
    site: 'https://remy-and-zoey.my.canva.site/',
    metrics: [],
    highlights: [
      'Mobile-friendly invitation design',
      'Improved event information clarity',
      'Simplified guest communication',
    ],
  },
  {
    id: 'erp-dashboard',
    tag: 'CliqueHA · Software Developer Intern',
    title: 'ERP-Style Admin Dashboard',
    desc: 'Designed and built an ERP-style admin interface with role-based access control, module-level permission gating, audit trails, and a filterable activity log for operational workflows.',
    tech: ['React', 'Laravel', 'Livewire', 'MySQL', 'RBAC', 'Docker', 'Documentation'],
    accent: 'var(--electric)',
    status: 'Completed',
    year: '2026',
    metrics: [
      { value: '5', label: 'Modules Built' },
      { value: '100%', label: 'RBAC Coverage' },
    ],
    highlights: [
      'Module-level permission gating',
      'Audit trail and activity log',
      'Advanced search and filter system',
      'Role management panel',
    ],
    clickMessage: 'Project under NDA contract - details available upon request',
  },
  {
    id: 'workflow',
    tag: 'Personal · Automation',
    title: 'AI & Workflow Automation',
    desc: 'Built an AI-assisted workflow automation system using n8n with webhook-triggered pipelines, approval routing, and API integrations to reduce repetitive manual work.',
    tech: ['n8n', 'ngrok', 'SQLite', 'Docker', 'APIs'],
    accent: 'var(--soft)',
    status: 'Completed',
    year: '2026',
    metrics: [
      { value: '10+', label: 'Workflows Automated' },
      { value: '90%', label: 'Time Saved' },
    ],
    highlights: [
      'Webhook-triggered automation pipelines',
      'Approval routing logic',
      'Email and notification integration',
      'OAuth and API connectivity',
      'AI chatbot integrations',
      'Cross-platform automation solutions',
    ],
    clickMessage: 'Personal project - not publicly accessible',
  },
  {
    id: 'wedding',
    tag: 'Personal Project · Full-Stack Developer',
    title: 'Wedding Invitation & RSVP Platform',
    desc: 'Built a wedding website used by 50+ guests, centralizing event details, RSVPs, and coordination with a custom real-time RSVP system and photo gallery.',
    tech: ['React', 'Google Apps Script', 'Vercel'],
    accent: 'var(--electric)',
    status: 'Completed',
    year: '2026',
    site: 'https://www.shesmydeamondhesmyjem.site/',
    metrics: [
      { value: '50+', label: 'Guests Served' },
      { value: '100%', label: 'Response Automated' },
    ],
    highlights: [
      'Custom-built RSVP system',
      'Real-time Google Sheets integration',
      'Dynamic Google Photos gallery',
      'Responsive lazy loading and optimization',
    ],
  },
  {
    id: 'thesis',
    tag: 'Capstone Project · Lead Developer & Project Leader',
    title: 'Web-Based Timekeeping and Payroll System with Mobile Solutions',
    desc: 'Engineered a full-stack web and mobile system for security guard attendance and payroll, cutting processing time from 5–10 days to instant generation.',
    tech: ['React', 'React Native', 'Node.js', 'PostgreSQL', 'SQLite'],
    accent: 'var(--cyan)',
    status: 'Completed',
    year: '2025',
    site: 'https://asseroglobal-phil.com/',
    metrics: [
      { value: '5+ days → instant', label: 'Payroll Processing' },
      { value: 'Real-time', label: 'Attendance Verification' },
    ],
    highlights: [
      'Real-time attendance verification',
      'Biometric face authentication',
      'GPS tracking for compliance',
      'Near-instant payroll generation',
      'Supabase real-time sync with RLS',
      'Responsive admin dashboard',
    ],
  },
  {
    id: '360-property-tour',
    tag: 'School Project · Developer',
    title: 'Interactive 360° Property Tour',
    desc: 'Prototyped an interactive 360° property tour that improves property browsing convenience through an immersive virtual walkthrough.',
    tech: ['Pixel Camera', 'PhotoSphere', 'Panolens', 'JavaScript', 'HTML'],
    accent: 'var(--azure)',
    status: 'Completed',
    year: '2024',
    site: 'https://appdev360.netlify.app/',
    metrics: [],
    highlights: [
      'Guided 360° camera capture workflow',
      'Stitched panoramic virtual walkthrough',
      'Cross-device property browsing experience',
    ],
  },
];

// Only Aki's Groq prompt reads these (worker/src/knowledge.js).
export const CONTACT_INFO = [
  { label: 'Email', value: 'jason.selerio@gmail.com' },
  { label: 'Phone', value: '+971 50 448 2694' },
  { label: 'Website', value: 'meepmerp-0.github.io' },
  { label: 'GitHub', value: 'github.com/MeepMerp-0' },
];
