# GEMINI.md — Jason Selerio Portfolio

> Project context for Gemini CLI. Read this before editing any file.

## What this project is

A cinematic, dark sci-fi HUD React portfolio for Jason Selerio — a full-stack software developer. Built with Vite + React 18, Motion 11 for animations, and Lucide React for icons. No router; navigation is scroll-driven.

## Run it

```bash
npm install       # installs all deps including motion + lucide-react
npm run dev       # dev server → http://localhost:5173
npm run build     # production build
npm run preview   # preview production build locally
```

## File map — read before touching anything

| File | Role | Edit for |
|---|---|---|
| `src/models/portfolioData.js` | **Single source of truth** for all content | Copy changes, new projects, skill updates |
| `src/controllers/useScrollController.js` | Scroll state: nav visibility, active section, scroll-to | Navigation logic changes |
| `src/App.jsx` | Root layout, sentinel-based auto-scroll, section order | Adding/removing sections, layout changes |
| `src/views/HeroView.jsx` | Landing: Motion `useScroll` zoom parallax, service bubbles, hero card | Hero copy, portal zoom behavior |
| `src/views/AboutView.jsx` | About: bio paragraphs, skill marquee, proficiency bars, stats | About content |
| `src/views/ProjectsView.jsx` | Projects: staggered alternating left/right card reveals | Project cards, layout |
| `src/views/ContactView.jsx` | Contact: info cards, form, success state | Contact content, form behavior |
| `src/components/HudFrame.jsx` | Fixed HUD overlay: corner brackets + fiber-optic sweep lines | Frame animation timing, colors |
| `src/components/AmbientBg.jsx` | Fixed background: glow orbs + dot grid + static base border lines | Background ambiance |
| `src/components/ServiceBubble.jsx` | Floating chips on hero — Motion `animate` y/x keyframe levitation | Bubble positions, labels, float paths |
| `src/components/ProfilePortal.jsx` | Circular profile image with orbital rings | Profile image, ring timing |
| `src/components/FloatingNav.jsx` | Nav bar — Motion `AnimatePresence` spring slide | Nav items, styling |
| `src/components/SkillMarquee.jsx` | Right-to-left infinite tech logo marquee | Logo list (sourced from `portfolioData`) |
| `src/components/TechBar.jsx` | Proficiency bar — Motion `useInView` width fill | Bar styling |
| `src/components/ScrollReveal.jsx` | Reusable `whileInView` wrapper with variant system | Shared reveal behavior |
| `src/components/ScrollIndicator.jsx` | Scroll hint: bouncing dot + cascading chevrons — pure Motion | Scroll hint visibility |
| `src/components/SectionHeading.jsx` | Section title block with animated accent line | Heading layout |
| `src/styles/global.css` | Design tokens, CSS resets, keyframe definitions, marquee animation | Colors, fonts, keyframes |

## Content updates — always go here first

All text, personal info, projects, skills, logos, and contact details live in one file:

```
src/models/portfolioData.js
```

Exported constants:

- `PERSONAL` — name, tagline, headline, email, phone, linkedin, github, location
- `SERVICES` — floating bubble labels + positions + float animation config
- `ABOUT_PARAGRAPHS` — bio paragraphs array (renders in order)
- `STATS` — stat blocks (value + label pairs)
- `MARQUEE_LOGOS` — tech logo name + devicon CDN image URL pairs
- `PROFICIENCY` — skill label + percentage (0–100) pairs
- `PROJECTS` — project cards: id, tag, title, desc, tech[], accent, status, year, highlights[]
- `CONTACT_INFO` — icon key, label, display value, href

**Never hardcode copy in views or components.** Import from `portfolioData.js` instead.

## Design tokens — always use CSS variables

Defined in `src/styles/global.css` under `:root`:

```css
--bg:          #1d1e22   /* Main background */
--cyan:        #00e5ff   /* Primary accent / glow */
--blue:        #1565ff   /* Secondary accent */
--azure:       #0ea5e9   /* Tertiary accent */
--electric:    #3b82f6   /* Quaternary accent */
--soft:        #7dd3fc   /* Soft blue */
--text:        #e8edf5   /* Body text */
--muted:       #8899aa   /* Subdued text */
--font-display: 'Orbitron', sans-serif    /* Sci-fi headings */
--font-body:    'Syne', sans-serif        /* Body / copy */
--font-mono:    'JetBrains Mono', mono    /* Labels / tags */
```

Never use raw hex values in components. Always reference the variable.

## Animation rules — do not break these

This project spent significant effort making animations GPU-safe and smooth. Follow these strictly:

**Allowed animated properties:** `transform` (translate, scale, rotate), `opacity`

**Never animate:** `top`, `left`, `width`, `height`, `filter`, `box-shadow`, `background-color` in loops

**Keyframes** (defined in `global.css`) — for continuous CSS animations:
- `bracketBreath` — corner bracket opacity pulse (12s ease-in-out)
- `fiberH` / `fiberV` — fiber-optic light pills sweeping edges (14–22s linear)
- `orbitCW` / `orbitCCW` — orbital ring rotation (18s / 28s linear)
- `ringBreath` — profile ring scale + opacity pulse (8s ease-in-out)
- `glowBreathe` — ambient orb opacity pulse (17–24s ease-in-out)
- `scanGlide` — card hover scanline (3.5s linear)
- `marqueeRTL` — skill logo right-to-left scroll (32s linear)

**Motion library** (from `motion/react`) — for scroll-triggered and interactive animations:
- `useScroll` + `useTransform` + `useSpring` — hero zoom parallax in `HeroView`
- `AnimatePresence` — nav bar mount/unmount in `FloatingNav`, scroll hint in `ScrollIndicator`
- `whileInView` + `viewport={{ once:true }}` — section reveals in `ScrollReveal`
- `animate` with keyframe arrays — service bubble levitation in `ServiceBubble`
- `useInView` — proficiency bar fill trigger in `TechBar`
- `motion.div animate` — staggered stat blocks in `AboutView`, contact cards in `ContactView`

**Durations:**
- Ambient / continuous: 12s–32s
- Section reveals: 0.65s–0.9s
- UI transitions (hover, nav): 0.3s–0.5s
- Bubble float: 7s–11s per axis, `repeat: Infinity`, `ease: 'easeInOut'`

**`will-change`:** Only set on elements that are actively animating. Remove it from static elements.

**`prefers-reduced-motion`:** Already handled globally in `global.css`. Do not add per-component media queries.

## Scroll and navigation architecture

The page does **not** use React Router. Sections are identified by DOM `id` attributes:

```
#about  →  AboutView
#projects → ProjectsView
#contact →  ContactView
```

- `useScrollController` (hook) tracks nav visibility, active section via `IntersectionObserver`, and exposes `scrollTo(sectionId)`.
- `FloatingNav` is invisible until `scrollY > 45%` of `window.innerHeight`.
- `HeroView` uses a `200vh` sticky container. Motion `useScroll` on this ref drives the zoom parallax.
- Auto-advance between sections is handled by sentinel `<div>` elements in `App.jsx`:
  - `#sentinel-hero` → advances to `#about`
  - `#sentinel-about` → advances to `#projects`
  - `#sentinel-projects` → advances to `#contact`
  - These sentinels use `IntersectionObserver` with `threshold: 1.0`, guarded by a scroll direction check and a 1200ms lock to prevent double-fires.

## Component responsibilities — do not mix these

| Layer | Owns | Does not own |
|---|---|---|
| `models/` | Data shapes and content strings | Rendering, state, animation |
| `controllers/` | Scroll state, section tracking | Data, rendering |
| `views/` | Section layout and composition | Business logic, data fetching |
| `components/` | Reusable UI atoms | Section-specific layout |

## Adding a new project

1. Open `src/models/portfolioData.js`
2. Add an object to the `PROJECTS` array:

```js
{
  id:         'unique-id',
  tag:        'Category · Role',
  title:      'Project Title',
  desc:       'One to two sentence description.',
  tech:       ['Tech1', 'Tech2'],
  accent:     'var(--cyan)',            // or --azure, --electric, --soft
  status:     'Live',                  // Live / Production / Completed / Ongoing / Delivered
  year:       '2025',
  highlights: ['Feature one', 'Feature two'],
}
```

3. `ProjectsView` renders the array automatically — no component changes needed.

## Adding a tech logo to the marquee

1. Find the devicon slug at https://devicon.dev
2. Add to `MARQUEE_LOGOS` in `portfolioData.js`:

```js
{ name: 'TechName', img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/SLUG/SLUG-original.svg' }
```

3. `SkillMarquee` duplicates the array automatically for seamless looping — no component changes needed.

## Adding your profile photo

1. Place your photo in `src/assets/` (e.g., `photo.jpg`)
2. In `src/views/HeroView.jsx`, add:

```js
import myPhoto from '../assets/photo.jpg';
```

3. Pass it to the portal component:

```jsx
<ProfilePortal scale={1} opacity={1} photoSrc={myPhoto} />
```

`ProfilePortal` already has a conditional: if `photoSrc` is provided it renders an `<img>`, otherwise it shows the monogram SVG fallback.

## What Gemini should not do

- Do not animate `top`, `left`, `width`, or `height` in keyframes or Motion.
- Do not add `filter: blur()` to any animated element.
- Do not use `position: fixed` inside view components — only `AmbientBg` and `HudFrame` are fixed.
- Do not hardcode copy in views — all text goes in `portfolioData.js`.
- Do not use orange, yellow, red, or warm-tone accents anywhere. Palette is strictly cyan → blue.
- Do not add a router. Navigation is scroll-based via `scrollTo()` from `useScrollController`.
- Do not install additional animation libraries. Motion 11 handles all animation needs.
- Do not add `overflow: hidden` to `html` or `body` — the layout relies on native scroll for the parallax.
- Do not remove `sentinel-*` divs from `App.jsx` — they drive auto-advance between sections.
- Do not run any git commands.