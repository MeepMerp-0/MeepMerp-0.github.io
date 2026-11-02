# Jason Selerio — Portfolio

[Live site](https://meepmerp-0.github.io/) · [Email](mailto:jason.selerio@gmail.com)

The site is React 19, Vite 8, Three.js and `motion`, styled with plain CSS. Aki, the chat assistant, runs as a Cloudflare Worker.

## Quick start

Node 26 or later.

```bash
npm ci
npm run dev        # http://localhost:8888
npm test           # site and Worker unit tests (node --test)
npm run build      # production build in dist/
```

To run Aki locally, run `npm ci --prefix worker` once. Then copy `worker/.dev.vars.example` to `worker/.dev.vars`, and start the Worker with `npm run aki:dev`.

## Layout

```
src/
  sections/     Hero, Work, About, Process, Contact
  components/   UI, hero/ and work/ Three.js scenes, aki/ chat, contact/ form
  hooks/        scroll progress for the Hero, Work and the still blocks, plus theme and nav
  data/         all page copy and portfolio content
  styles/       global.css, with theme tokens and animations
worker/         Aki API (Cloudflare Worker + Durable Object limiter)
public/demos/   standalone demo pages, with no network requests
scripts/        verify-scroll-preview.mjs, a headless Chrome smoke suite
```

To edit the content, change the files in `src/data/`. Aki's knowledge comes from `portfolioData.js` and `worker/src/experience.js`.

## How the motion works

The scenes follow scroll position and never write it, so the same scroll position always renders the same frame.

- **Hero** uses `useHeroProgress`. On phones the Hero's 3D scene sits behind the text as a background.
- **Work** uses `useWorkProgress`, which drives one Three.js scene where Aki's pieces fall into place.
- **About** and **Process** use `useScrollSteps`, which pins a block and steps it from 1 to 4.
- **Text motion** comes from `src/components/TextMotion.jsx` and `src/hooks/useReveal.js`, with the CSS in `global.css`. Headings rise word by word, monospace labels scramble into place, body copy reads in line by line, and link labels roll on hover. Each entrance plays once, when its block scrolls into view. Screen readers get the full text from a `.sr-only` copy.
- With `prefers-reduced-motion`, nothing moves and every section shows a still layout.

## Environment

`.env.example` lists the site's build variables, and `worker/.dev.vars.example` lists the Worker's secrets. Never commit the real files (`.env`, `worker/.dev.vars`).

## Checks and deploy

```bash
node_modules/.bin/eslint src
npx vite preview --port 4173 --strictPort &
CHROME_BIN=/path/to/chrome node scripts/verify-scroll-preview.mjs
```

A push to `main` runs `.github/workflows/deploy.yml`. It tests and deploys the Worker with Wrangler, then builds the site and publishes it to `gh-pages`.
