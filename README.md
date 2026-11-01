# Jason Selerio — AI & Full-Stack Engineer

[Visit the portfolio](https://meepmerp-0.github.io/) · [GitHub](https://github.com/MeepMerp-0) · [Email](mailto:jason.selerio@gmail.com)

Personal portfolio built with React and Vite, with Aki, a chat assistant running on a Cloudflare Worker.

## Run locally

```bash
npm ci
npm run dev   # http://localhost:8888
npm test      # unit tests for the site and the Aki Worker
```

## Editing content

Content lives in `src/data/`:

- `portfolioData.js`: profile, experience, projects, skills and contact details
- `siteCopy.js`: hero, About, Process and Contact copy that only the page uses
- `workScenes.js`: the four Work chapters, built from the projects in `portfolioData.js`
- `akiFaq.js`: Aki's quick answers, messages and consent copy
- `akiGreetings.js`: Aki's greetings

Aki's Worker builds its prompt in `worker/src/knowledge.js` from `portfolioData.js` and the full work history in
`worker/src/experience.js`. Editing `siteCopy.js` or `workScenes.js` does not change what Aki knows.

The Work section renders a Three.js scene (`src/components/work/workScene.js`) that follows page scroll, with
vector fallbacks for reduced motion and missing WebGL. The fictional demos it opens are standalone pages in
`public/demos/`; they make no network requests and store nothing.

## Deploy

Push to `main` to publish to GitHub Pages.
