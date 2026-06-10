# Architecture

## Overview

Jason Selerio — Portfolio is a React SPA with a dark sci-fi HUD aesthetic, built using Vite and featuring Motion-powered animations.

## Key Components

### Scroll Navigation

The scroll navigation feature enables automatic page transition from Home to About when scrolling to the bottom of the viewport.

```
src/
  hooks/
    useScrollNavigate.jsx     # Listens for scroll events, triggers navigation
  components/
    ScrollIndicator.jsx       # Visual progress indicator during scroll
  controllers/
    useScrollController.js    # Additional scroll state management
```

#### Data Flow

1. `useScrollNavigate` hook attaches a scroll event listener on mount
2. On each scroll, it calculates: `scrollY + innerHeight >= scrollHeight`
3. When condition is met, it navigates to `/about` via React Router
4. `ScrollIndicator` renders a progress bar showing scroll percentage
5. Both hooks clean up listeners on unmount to prevent memory leaks

#### Integration Points

- `App.jsx` initializes the scroll navigation hook at the root level
- Works in conjunction with React Router v6's `useNavigate`
- `ScrollIndicator` appears in the Hero view as a visual cue

## Project Structure

```
jason-portfolio/
├── src/
│   ├── components/     # Reusable UI atoms
│   ├── views/          # Page sections (Hero, About, Projects, Contact)
│   ├── hooks/          # Custom React hooks
│   ├── controllers/    # State management logic
│   └── models/         # Content data and types
```

## Animation System

All Motion animations use `transform` and `opacity` only to avoid layout thrashing. Respects `prefers-reduced-motion` for accessibility.