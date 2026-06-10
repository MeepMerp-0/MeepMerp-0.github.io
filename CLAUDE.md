# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev        # Start Vite dev server on port 8888
npm run build      # Build for production
npm run preview    # Preview production build locally
npm test           # Run Jest tests (alias: npm test)
npm test src/hooks/__tests__/useScrollNavigate.test.jsx  # Run single test file
```

## Project Structure

**Architecture**: React SPA with Vite bundler, dark sci-fi HUD aesthetic, scroll-zoom portal transitions.

**Key directories**:
- `src/views/` — Page sections: HeroView, AboutView, ProjectsView, ContactView
- `src/components/` — Reusable UI: AmbientBg, HudFrame, FloatingNav, ProfilePortal, ScrollReveal, SkillMarquee, TechBar, ScrollIndicator
- `src/models/portfolioData.js` — All content data (personal, projects, skills)
- `src/controllers/useScrollController.js` — Scroll state management (portal zoom, nav visibility, section tracking)
- `src/hooks/useScrollNavigate.jsx` — Auto-scroll navigation hook

**Routing**: React Router v7 with 4 named sections (home, about, projects, contact). Section changes trigger motion page transitions.

## Key Patterns

**Motion animations**: Use `motion/react` (not framer-motion) for all entrance animations. All use `transform` and `opacity` only — no layout thrashing.

**Scroll behavior**: `useScrollController` manages portal scale/opacity based on scroll position. Navigation auto-shows after hero. Auto-navigation from home to about when scrolling to bottom.

**Design tokens**: Defined in `src/styles/global.css` with CSS custom properties for colors (`--cyan`, `--azure`, `--electric`, `--soft`, `--bg`).

## Tech Stack

- React 18 + React Router 7
- Motion (framer-motion successor) for animations
- Vite 8 for bundling
- Jest + React Testing Library for tests
- Deploy: Vercel (port configured to 8888 locally)

## About Git commands

- Do not put any git commands in the plans
- Do not run any git commands, the user will handle it personally.

## Project structure

```
jason-selerio-portfolio/
├── index.html
├── package.json
├── vite.config.js
├── babel.config.js
├── jest.config.js
├── CLAUDE.md
├── README.md
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Root: composes all layers
    ├── App.css
    ├── index.css
    ├── setupTests.js
    │
    ├── models/
    │   └── portfolioData.js      # All content: personal, projects, skills, contact
    │
    ├── controllers/
    │   └── useScrollController.js  # Scroll state: portal zoom, nav, section tracking
    │
    ├── hooks/
    │   ├── useScrollNavigate.jsx   # Auto-scroll navigation hook
    │   └── __tests__/useScrollNavigate.test.jsx
    │
    ├── components/             # Reusable UI atoms
    │   ├── AmbientBg.jsx         # Fixed glow orbs + dot grid
    │   ├── HudFrame.jsx          # Corner brackets + orbital sweep lines
    │   ├── FloatingNav.jsx       # Motion-animated floating nav bar
    │   ├── ServiceBubble.jsx     # Drifting service chips on hero
    │   ├── ProfilePortal.jsx     # Circular image with orbital rings
    │   ├── ScrollReveal.jsx      # Reusable whileInView motion wrapper
    │   ├── SectionHeading.jsx    # Animated section title block
    │   ├── SkillMarquee.jsx      # Right-to-left logo marquee
    │   ├── TechBar.jsx           # Animated proficiency bar
    │   └── ScrollIndicator.jsx   # Progress bar at bottom
    │
    ├── views/                  # Page sections
    │   ├── HeroView.jsx        # Landing: portal + bubbles + hero card
    │   ├── AboutView.jsx       # About: bio + marquee + proficiency
    │   ├── ProjectsView.jsx    # Projects: staggered alternating cards
    │   └── ContactView.jsx     # Contact: cards + form
    │
    └── styles/
        └── global.css          # Design tokens, resets, keyframes, marquee
```