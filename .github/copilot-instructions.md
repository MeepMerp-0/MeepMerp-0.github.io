# Portfolio codebase guidance

This is Jason Selerio's React 19 / Vite 8 portfolio, deployed to GitHub Pages with Node.js 22.

**Active UI**: `src/App.jsx` renders a normal document with a sticky header, Home, Work, About, Process, Contact, and footer. Main visual tokens and responsive rules are in `src/styles/global.css`. The screenshot-inspired five-stage interactive process is `src/components/PortfolioWorkflow.jsx` and `PortfolioWorkflow.css`. Project, experience and contact facts come from `src/data/portfolioData.js`. The contact form reuses `src/hooks/useContactForm.js` and `src/services/formService.js`. Older `src/views/`, ambient animations and full-page navigation components are legacy and **are not part of the active design**.

## Design constraints (anti-slop)
- Treat portfolio work as evidence. Preserve real links, titles, employers and the owner's project facts; label confidential work; never invent testimonials, screenshots, engagement results or availability.
- Maintain a restrained editorial look: readable typography, considered whitespace, few colors, thin dividers, semantic layouts. No gratuitous gradients, glows, glass cards, animated blobs, carousels or pseudo-dashboard meters.
- Real hash anchors and native scrolling; no invisible panels, focus traps or wheel interception. Validate navigation, theme, form, and mobile layout.
- Don't add dependencies, tracking, secret values or outbound AI calls without prior owner approval. Never commit an .env file.
- Run `npm ci`, `npm run build`, and ESLint on changed JS/JSX. Explicitly state which browser/form tests are not run.
- PRs require human approval; docs under `.github/agents/` are prompt roles, not a deployed multi-agent backend.
