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
- `workflowStages.js`: the stages in the Process section
- `akiFaq.js`: Aki's quick answers, messages and consent copy
- `akiGreetings.js`: Aki's greetings

Aki's Worker builds its prompt in `worker/src/knowledge.js` from `portfolioData.js` and the full work history in
`worker/src/experience.js`.

## Deploy

Push to `main` to publish to GitHub Pages.
