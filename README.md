# Jason Selerio — AI & Full-Stack Engineer

[Visit the portfolio](https://meepmerp-0.github.io/) · [GitHub](https://github.com/MeepMerp-0) · [Email](mailto:jason.selerio@gmail.com)

A personal portfolio for Jason Selerio, an **AI & Full-Stack Engineer** based in Abu Dhabi, UAE. The site showcases applied agentic AI, full-stack business systems, selected client websites, and the engineering work behind them.

> **Two different stacks:** This *portfolio website* is built with React and Vite. Technologies such as LangGraph.js, Next.js, TypeScript, Supabase, and Coolify refer to **professional projects**, not necessarily to the portfolio's own implementation.

## Selected experience

- **INNERCIRCLE° — Lead AI & Full-Stack Engineer (freelance, May 2026–present).** Developing a real estate operations platform with Next.js, TypeScript, and Supabase across CRM, finance, reporting, and property analysis. Designing LangGraph.js multi-agent workflows with scoped API access, checkpoints, and human approval; integrating AI services, external APIs, n8n, role-based access control, audit trails, and self-hosted deployment.
- **FuturoHub — part-time web development (current; start date not specified).** Contributing to [FuturoHub](https://futurohub.ae/), [El Mejor](https://elmejor.futurohub.ae/), [Cup Section](https://cup-section.futurohub.ae/), and six additional website samples: [01](https://sample1.futurohub.ae/), [02](https://sample2.futurohub.ae/), [03](https://sample3.futurohub.ae/), [04](https://sample4.futurohub.ae/), [05](https://sample5.futurohub.ae/), [06](https://sample6.futurohub.ae/). The FuturoHub company site's repository documents an Astro/Tailwind/React implementation; the other websites may use different stacks.
- **Freelance — Full-Stack Developer (February 2026–present).** Client websites, business systems, web/mobile development, integrations, and ongoing maintenance.
- **CliqueHA Information Services OPC — Software Developer Intern (February–May 2026).** Laravel/Livewire work, production troubleshooting, and technical documentation.
- **JsquarEd Co. Ltd. — Desktop Application Developer (July 2024–August 2025).** Inventory software and business integrations with C# and SQL Server.

These roles and descriptions reflect the experience details shared for this portfolio. Client work without a public demo is clearly labeled; no restricted application access, internal code, or fabricated results are published. The FuturoHub start date has not been invented.

## What the site includes

- **Home:** a direct AI & full-stack engineering introduction, practical focus areas, and résumé link.
- **Work:** an evidence-first index of current engagements, shipped systems, public sites, and private projects. FuturoHub's main sites have direct links; its six sample variations are grouped in an expandable list.
- **About:** real roles, dates where provided, contributions, and a concise technical toolkit.
- **Process:** a five-stage AUDIT → DESIGN → BUILD → TEST → SHIP panel inspired by an editor-style reference. The role instructions in `.github/agents/` are documentation, **not** autonomous services running on this site.
- **Contact:** email and GitHub links plus a form using the existing configurable backend.
- **Accessibility:** semantic content, natural scrolling, skip link, keyboard-accessible controls, responsive layout, high-contrast light/dark themes, and reduced-motion support.

The design intentionally avoids stock screenshots, floating blobs, template-style animations, unverifiable performance claims, and elaborate decorations. More detail: [DESIGN_NOTES.md](DESIGN_NOTES.md).

## Technology

| Area | Portfolio implementation |
| --- | --- |
| UI | React 19, plain JSX, Lucide icons |
| Build | Vite 8, Node.js 22+ |
| Styling | Plain CSS custom properties and responsive rules |
| Content | `src/data/portfolioData.js` |
| Contact | `useContactForm` + configurable form service |
| Automation | GitHub Actions for PR checks, screenshot smoke tests, and Pages deployment |

The lockfile also contains dependencies that remain from earlier iterations of the website. Their presence does not mean they are all used by the redesigned UI.

## Project layout

```text
src/
├── App.jsx                         # Active single-page site: all visitor sections
├── data/portfolioData.js           # Personal info, experience, projects, work samples
├── components/
│   ├── PortfolioWorkflow.jsx       # Interactive process panel
│   └── PortfolioWorkflow.css
├── hooks/useContactForm.js         # Form state, validation and rate limiting
├── services/formService.js         # Backend adapter
├── config/formBackend.js           # Form backend selection
└── styles/global.css               # Active editorial design and responsive styling
api/contact.js                      # Serverless endpoint for compatible hosting (not Pages)
.github/
├── agents/                          # Optional AI role instructions
├── prompts/                         # Reusable portfolio improvement prompt
└── workflows/
    ├── portfolio-quality.yml        # PR verification and screenshots
    └── deploy.yml                   # GitHub Pages publishing
public/                              # Static assets
```

Some older views/components are retained in the repository but are **not rendered** by the current `src/App.jsx`. Do not edit those expecting live-site changes.

## Run locally

Prerequisite: **Node.js 22 or newer** and npm.

```bash
git clone https://github.com/MeepMerp-0/MeepMerp-0.github.io.git
cd MeepMerp-0.github.io
npm ci
npm run dev
```

The Vite development server is configured at [http://localhost:8888](http://localhost:8888). To verify production output:

```bash
npx eslint src/App.jsx src/data/portfolioData.js
npm run build
npm run preview
```

The preview uses Vite's default local preview port (normally 4173). A successful build checks compilation but does not prove that external site links or a live contact backend work.

## Contact backend and secrets

Copy `.env.example` into a local `.env` only if you need to test sending messages. The default frontend provider is Google Apps Script, which requires `VITE_FORM_SCRIPT_URL` (and optionally `VITE_FORM_BACKEND=appscript`). Other providers are configured in `src/config/formBackend.js`.

- Values prefixed with `VITE_` are embedded into the client bundle: **never place passwords, API secrets, or private credentials in them**.
- GitHub Pages hosts static files; it **does not execute** the Node serverless endpoint at `api/contact.js`. Server-side SMTP/API providers require compatible external hosting.
- The form includes validation, a honeypot and client-side rate limiting. Delivery requires a correctly configured, reachable backend; if it fails, the website offers an email link.
- Never commit real `.env` files or private client data.

## CI, visual previews and deployment

The PR workflow (`.github/workflows/portfolio-quality.yml`) runs `npm ci`, ESLint on the PR's modified JS/JSX files, `npm run build`, and a headless Chrome rendering smoke test. It uploads desktop/mobile screenshots as a short-lived GitHub Actions artifact for review. These are not a substitute for manual keyboard, theme, live-link, device-width or contact-delivery testing.

The GitHub Pages workflow (`.github/workflows/deploy.yml`) runs on pushes to `main` and publishes the built `dist/` directory. The repository also has a manual `npm run deploy` command. Review pull requests before merging to avoid unintentionally publishing changes.

## Maintaining content

All recruiter-facing facts live in `src/data/portfolioData.js`. When updating them:

1. Match the current CV and verify dates, responsibilities, role wording, project links, and outcomes.
2. Keep INNERCIRCLE° labeled **freelance** and FuturoHub labeled **part-time**, unless the engagement changes. Do not invent FuturoHub's start date.
3. Keep private/internal projects private; do not fabricate demos, analytics, screenshots or metrics.
4. For grouped website samples, maintain `links` and `samples` on the FuturoHub project. Attribute Astro/Tailwind/React only to the documented company site, not automatically to every sample.
5. Update portfolio metadata in `index.html` when public positioning changes. Review both themes and mobile before shipping.
6. The résumé button uses the existing `PERSONAL.cvDownloadUrl` PDF location. Reference-only CV design links are **not** intended to become public portfolio links.

## Contact

[Portfolio](https://meepmerp-0.github.io/) · [GitHub](https://github.com/MeepMerp-0) · [Email](mailto:jason.selerio@gmail.com)
