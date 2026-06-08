// ─── models/portfolioData.js ───

export const PERSONAL = {
  name: 'Jason Selerio',
  title: 'Software Developer',
  tagline: 'Building Business-Driven Systems That Scale.',
  headline: 'I deliver business-driven web solutions that solve complex challenges through modern development, prioritizing performance, scalability, and user experience.',
  email: 'Jselerio15@gmail.com',
  phone: '(+63) 927-858-6049',
  linkedin: 'https://linkedin.com/in/Jason-Selerio',
  github: 'https://github.com/MeepMerp-0',
  location: 'Quezon City, NCR, Philippines',
};

export const SERVICES = [
  { label: 'Full-Stack Development', anim: 'driftA', dur: '17s', delay: '0s', x: '7%', y: '20%' },
  { label: 'React / React Native', anim: 'driftB', dur: '20s', delay: '4s', x: '70%', y: '14%' },
  { label: 'Workflow Automation', anim: 'driftC', dur: '15s', delay: '8s', x: '78%', y: '60%' },
  { label: 'ERP & Admin Systems', anim: 'driftA', dur: '19s', delay: '2s', x: '4%', y: '65%' },
  { label: 'RBAC / Permissions', anim: 'driftB', dur: '13s', delay: '6s', x: '60%', y: '80%' },
  { label: 'Laravel / Livewire', anim: 'driftC', dur: '22s', delay: '11s', x: '18%', y: '82%' },
  { label: 'Node.js / Supabase', anim: 'driftA', dur: '16s', delay: '9s', x: '84%', y: '36%' },
  { label: 'Responsive UI Engineering', anim: 'driftB', dur: '21s', delay: '3s', x: '5%', y: '44%' },
];

export const ABOUT_PARAGRAPHS = [
  "Hello 👋, I’m Jason Selerio, a full-stack software developer based in Quezon City, Philippines, currently finishing my Bachelor of Science in Information Technology at STI College Muñoz-EDSA, expected in July 2026. I build operational systems that turn complex business requirements into clean, maintainable, and scalable software.",
  "One of the projects I’m most proud of is a full-stack timekeeping and payroll platform I helped lead, which reduced processing time from 5–10 days to instant generation. I built it using React, React Native, Node.js, PostgreSQL, and Supabase, with real-time face recognition and GPS tracking.",
  "At CliqueHA Information Service OPC, I worked across five Agile cross-functional teams, building new modules, improving WordPress performance, and producing structured documentation for both clients and internal teams. I care about building systems that are reliable, practical, and designed for long-term use — not just demos.",
  "I care about systems that are reliable, scalable, and built with the long game in mind — not just demos.",
];

export const STATS = [
  { value: '7+', label: 'Projects Shipped' },
  { value: '5', label: 'Agile Teams Joined' },
  { value: 'BSIT', label: '@STI College' },
  { value: '2026', label: 'Graduating' },
];

// Flaticon CDN SVG images for the marquee
export const MARQUEE_LOGOS = [
  { name: 'React', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'React Native', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Laravel', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg' },
  { name: 'Node.js', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { name: 'TypeScript', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'JavaScript', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'PHP', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
  { name: 'MySQL', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
  { name: 'PostgreSQL', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'Supabase', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg' },
  { name: 'Git', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { name: 'Docker', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'HTML5', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { name: 'CSS3', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { name: 'Java', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
  { name: 'Vue.js', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
  { name: 'Flutter', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg' },
  { name: 'Vercel', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg' },
  { name: 'Redis', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' },
  { name: 'Linux', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
  { name: 'Next.js', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'Claude', img: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude-color.svg' },
  { name: 'Gemini', img: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini-color.svg' },
  { name: 'Perplexity', img: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/perplexity-color.svg' },
  { name: 'Codex', img: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/codex-color.svg' }
];

export const PROFICIENCY = [
  { label: 'React / Frontend Systems', pct: 96 },
  { label: 'React Native / Mobile Dev', pct: 92 },
  { label: 'Node.js / API Development', pct: 94 },
  { label: 'Laravel / Livewire', pct: 95 },
  { label: 'MySQL / Data Management', pct: 93 },
];

export const PROJECTS = [
  {
    id: 'erp-dashboard',
    tag: 'CliqueHA · Software Developer Intern',
    title: 'ERP-Style Admin Dashboard',
    desc: 'Designed and built an ERP-style admin interface with role-based access control, module-level permission gating, audit trails, and a filterable activity log. Built to mirror real operational platforms used in workforce management.',
    tech: ['React', 'Laravel', 'Livewire', 'MySQL', 'RBAC', 'Docker', 'Documentation'],
    accent: 'var(--electric)',
    status: 'Completed',
    year: '2026',
    highlights: [
      'Module-level permission gating',
      'Audit trail / activity log',
      'Advanced search & filter system',
      'Role management panel',
    ],
  },
  {
    id: 'wordpress',
    tag: 'CliqueHA · Software Developer Intern',
    title: 'WordPress Performance & Module Build',
    desc: 'Focused on responsive layouts, page load optimization, and structured client documentation to support ongoing system rollout.',
    tech: ['WordPress', 'HTML', 'JavaScript', 'CSS3'],
    accent: 'var(--azure)',
    status: 'Delivered',
    year: '2026',
    highlights: [
      'Responsive layout implementation',
      'Page speed optimization'
    ],
  },
  {
    id: 'workflow',
    tag: 'Personal · Automation',
    title: 'AI & Workflow Automation',
    desc: 'Built an AI-driven workflow automation system using n8n with webhook-triggered pipelines, approval routing logic, email and notification integration, OAuth/API connectivity, and cross-platform automation. Designed to streamline lead handling, business workflows, and chatbot-assisted processes while reducing manual coordination across operational teams.',
    tech: ['n8n', 'ngrok', 'SQLite', 'Docker', 'APIs'],
    accent: 'var(--soft)',
    status: 'Completed',
    year: '2026',
    highlights: [
      'Webhook-triggered automation pipelines',
      'Approval routing logic',
      'Email/notification integration',
      'OAuth and API connectivity',
      'AI chatbots integrations',
      'AI-supported lead and business workflows',
      'AI-driven workflow automation',
      'Cross-platform automation solutions'
    ],
  }, {
    id: 'thesis',
    tag: 'Thesis · Lead Developer',
    title: 'Timekeeping & Payroll System',
    desc: 'Full-stack web and mobile platform for security guard attendance and payroll. Reduced processing time from 5–10 days to instant generation. Features real-time facial recognition via React Native Vision Camera and face-api.js, GPS-based attendance logging, row-level security on Supabase, and a responsive admin dashboard deployed on Vercel.',
    tech: ['React', 'React Native', 'Node.js', 'PostgreSQL', 'SQLite', 'Supabase', 'face-api.js'],
    accent: 'var(--cyan)',
    status: 'Completed',
    year: '2025–2026',
    highlights: [
      'Real-time facial recognition attendance',
      'GPS tracking for field compliance',
      'Instant payroll generation (was 5–10 days)',
      'Role-based access control',
      'Supabase real-time sync + RLS',
    ],
  }, {
    id: 'wedding',
    tag: 'Personal · Full-Stack Developer',
    title: 'Wedding Invitation & RSVP Platform',
    desc: 'Created website for a friend’s wedding to centralize event information, RSVPs, and coordination. Features a custom-built RSVP system with real-time updates to google sheets, and a gallery fetched from google photos. The platform streamlined communication and planning for the couple and their guests.',
    tech: ['React', 'Vercel', 'Google Sheets AppScript', 'Google Photos'],
    accent: 'var(--electric)',
    status: 'Completed',
    year: '2026',
    site: 'https://www.shesmydeamondhesmyjem.site/',
    highlights: [
      'Custom-built RSVP system',
      'Real-time updates to Google Sheets',
      'Gallery fetched from Google Photos',
    ],
  }
];

export const CONTACT_INFO = [
  { icon: 'mail', label: 'Email', value: 'Jselerio15@gmail.com', href: 'mailto:Jselerio15@gmail.com' },
  { icon: 'phone', label: 'Phone', value: '(+63) 927-858-6049', href: 'tel:+639278586049' },
  { icon: 'linkedin', label: 'LinkedIn', value: 'LinkedIn.com/in/Jason-Selerio', href: 'https://linkedin.com/in/jason-selerio' },
  { icon: 'github', label: 'GitHub', value: 'GitHub.com/MeepMerp-0', href: 'https://github.com/MeepMerp-0' },
];
