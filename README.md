# Jason Selerio — Software Engineer

Personal portfolio for Jason Selerio, a software engineer focused on full-stack
development, AI workflow automation, responsive interfaces, and practical
business systems.

The site presents selected work, professional experience, technical skills,
and contact options in a responsive React interface with light and dark themes.

## Highlights

- Responsive portfolio sections for hero, about, projects, and contact.
- Animated interactions powered by Motion.
- Theme switching with system preference detection.
- Project data maintained centrally in `src/data/portfolioData.js`.
- Contact form integrations for Google Apps Script, SMTP, and related services.
- GitHub Pages deployment through `gh-pages`.

## Tech Stack

- React 19 and React Router 7
- Vite 8
- Motion and Lucide React
- Plain CSS with custom properties and responsive layout rules
- Node.js serverless contact endpoint in `api/`

## Project Structure

```text
src/
├── components/   # Reusable interface components
├── views/        # Page-level sections
├── hooks/        # Shared React hooks
├── services/     # Contact and external-service logic
├── data/         # Portfolio content
├── styles/       # Shared theme and animation styles
└── utils/        # Small reusable helpers
api/              # Serverless contact endpoint
public/           # Static images, icons, and resume files
```

## Local Development

Requires Node.js 22 or newer.

```bash
git clone https://github.com/MeepMerp-0/jason-selerio-portfolio.git
cd jason-selerio-portfolio
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use `npx eslint .` for
linting and `npm run build` to verify the production bundle. No automated test
suite is currently configured.

## Configuration

Copy `.env.example` to `.env` and add only the credentials required by the selected contact backend. Keep `.env` private and never commit secrets. Avatar
URLs and fallback images are configured in
`src/components/ProfilePortal.jsx`.

## Deployment

Build and preview locally with `npm run build` and `npm run preview`. Publish
the `dist/` directory to GitHub Pages with:

```bash
npm run deploy
```

## Contact

- Email: [jason.selerio@gmail.com](mailto:jason.selerio@gmail.com)
- Website: [meepmerp-0.github.io](https://meepmerp-0.github.io)
- GitHub: [github.com/MeepMerp-0](https://github.com/MeepMerp-0)
