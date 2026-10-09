# Portfolio repository guidance

This is a React 19 / Vite 8 portfolio deployed to GitHub Pages. Use Node.js 22. Four main sections are composed in src/App.jsx and src/hooks/useScrollNavigation.js; content is in src/data/portfolioData.js and dark/light CSS tokens are in src/styles/global.css.

- Preserve navigation, theme switching, project links and the contact flow.
- Start with a real visitor problem, small scope and verifiable acceptance criteria. Ask before changing facts, contact details or project metrics.
- Prefer semantic JSX, keyboard access, visible focus, mobile layouts (360px/768px/desktop) and reduced-motion support.
- Keep existing dependencies; never commit secrets/.env values or add third-party tracking/AI calls without approval.
- Run npm ci, npm run build, and ESLint on changed JS/JSX if available. State untested items accurately.
- Use .github/prompts/improve-portfolio.prompt.md for the five-stage process and .github/agents/ for specialist instructions. These definitions are **not** automatically running AI services. The human owner approves scope, merge and deployment.
