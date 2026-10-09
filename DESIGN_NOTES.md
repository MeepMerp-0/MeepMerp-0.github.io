# Portfolio redesign / field notes

## Direction: evidence over effects
This portfolio uses an editorial "field notes" visual language: warm paper/ink palettes, one deliberate botanical accent, serif display type with a plain sans-serif body, narrow mono metadata, honest project rows and minimal motion. No floating service bubbles, glass panels, looping marquees, invented screenshots, simulated agents, inflated claims, ornamental progress bars or generic "AI gradient" treatments.

## Real workflows
1. A recruiter opens the home page, reads the job focus, jumps to Work, scans eight projects (the current shortlist), opens a demo and finds contact details.
2. A client finds a relevant operational project, checks the responsibilities/technology and reaches the working form or email fallback.
3. A keyboard user can reach every visible control in document order; no invisible sections remain mounted behind opacity.
4. A mobile visitor can open/close navigation, switch theme and fill the form without horizontal scrolling.

## Design decisions
- **Navigation:** stable sticky header with real hash anchors, skip link, visible mobile menu and native scrolling; no full-screen scroll traps.
- **Work:** project entries, current work labels, and FuturoHub's grouped public website links are sourced from `src/data/portfolioData.js`; don't invent images or new metrics. Keep INNERCIRCLE° work labeled private and ongoing. Don't assume the same stack applies to every FuturoHub sample.
- **Process:** keep the interactive 5-step panel inspired by the supplied screenshot, but use it to demonstrate a workflow rather than pretend to have live autonomous agents.
- **Theme:** dark by default when the operating system prefers dark; user choice persists when storage is available. Light variant uses #1a6541 on #eeece3 (>5:1 contrast), replacing the previous lower-contrast accent.
- **Contact:** reuse `useContactForm` and `submitContactForm` (configured backend), preserve honeypot and rate limiting. Leave send-success confirmation visible until explicitly dismissed. Never invent a working backend when secrets are absent.
- **Motion:** use the existing `motion/react` dependency only for brief first-load hero text, one-time section-heading scroll reveals, small translate-only project-row entrances (never hide focusable project links), and fast process-stage content changes. CSS handles link/nav/button hover feedback. Honor `prefers-reduced-motion` through `useReducedMotion()` and global CSS; no decorative loops, scroll hijacking or layout-jarring effects.
- **Maintainability:** React 19, Vite 8, Lucide icons already installed. No new packages or external fonts, images or tracking. The title is AI & Full-Stack Engineer; actual CV responsibilities have priority over generic AI claims. INNERCIRCLE° is part-time, FuturoHub freelance (no guessed start date), and the existing résumé PDF remains the only public CV link.

## Acceptance checks before merge
- [ ] On desktop and 360px/768px mobile, project rows and nav fit without horizontal scrolling.
- [ ] Every anchor points to a visible section; Escape/menu closing, Tab order and focus indicators are usable.
- [ ] Text and accent remain legible in dark and light themes.
- [ ] Hero and section reveals run once without obstructing links, process transitions stay readable, and reduced-motion users see static content with no entrance transforms.
- [ ] Form validation, rate-limits, failure fallback and successful submissions behave with the *actual* deployment backend.
- [ ] All public website links, including FuturoHub, El Mejor, Cup Section and samples 01–06, open as expected; private work is labeled; no extra portfolio claims.
- [ ] Current CV positioning, part-time versus freelance arrangements, and the unchanged PDF destination are verified.
- [ ] GitHub Actions installs dependencies, lints **changed JS/JSX**, builds the production bundle.
- [ ] Human approves the redesign and checks the published site after merge.

The GitHub Actions check is not a substitute for a browser, screen reader, or live-form test.
