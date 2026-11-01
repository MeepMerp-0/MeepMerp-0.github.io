# Repository map

## Source snapshot

This map was checked against `MeepMerp-0/MeepMerp-0.github.io` at commit [`2e124d7eee0b0c4bf57a24d20a575a683e400218`](https://github.com/MeepMerp-0/MeepMerp-0.github.io/tree/2e124d7eee0b0c4bf57a24d20a575a683e400218). On `feat/portfolio-cinematic-rework`, the application map below also reflects the cinematic rework (run `portfolio-2026-q4-cinematic`). Reinspect the active branch before implementation. Project and technology descriptions below are source observations, not new product requirements.

## Application map

| Area | Source locations |
| --- | --- |
| Page composition and sections | [App](../../src/App.jsx), [sections](../../src/sections/) |
| Hero and its Three.js sculpture | [Hero section](../../src/sections/Hero.jsx), [hero scene](../../src/components/hero/heroScene.js), [shared studio](../../src/components/three/studio.js) |
| Work sequence and Three.js scene | [Work section](../../src/sections/Work.jsx), [work components](../../src/components/work/), [scroll progress](../../src/hooks/useWorkProgress.js) |
| Shared UI, motion, styles | [components](../../src/components/), [hooks](../../src/hooks/), [global CSS](../../src/styles/global.css), [motion utility](../../src/utils/motion.js) |
| Portfolio copy and project records | [portfolio data](../../src/data/portfolioData.js) (also read by Aki), [page copy](../../src/data/siteCopy.js), [Work chapters](../../src/data/workScenes.js) |
| Fictional demos | [demo pages](../../public/demos/) |
| Aki chat, launcher, voice | [Aki components](../../src/components/aki/), [client](../../src/services/akiClient.js), [voice](../../src/services/akiVoice.js), [service modules](../../src/services/aki/) |
| Aki backend | [Worker source](../../worker/src/), [Worker config](../../worker/wrangler.toml) |
| Contact | [contact UI](../../src/components/contact/), [service](../../src/services/contactForm.js) |
| Public notice and metadata | [Aki notice](../../public/aki-legal.html), [HTML entry](../../index.html), [theme boot](../../public/theme-boot.js) |

## Demo source boundary

The project aliases `payroll-web`, `payroll-mobile`, `innercircle`, `futurohub`, and `aki-portfolio` are listed in the [demo catalog](demo-catalog.md#source-aliases). They are routing labels, not public private-repository pointers. An operator may hold exact private mappings and provenance outside this public repository. Inspect only bounded, necessary, nonsecret material read-only under the [demo boundary](demo-boundary.md#source-inspection); do not run private code or copy it into the demo. Reinspect this public portfolio branch before selecting integration points.

## Existing design and constants

The snapshot is a React/Vite JavaScript and JSX app with `motion` already listed in [package.json](../../package.json). Inspect the active checkout before implementation. On this branch `three@0.186.1` is installed for the Hero and Work scenes, which share one studio module; preserve Aki-related versions/behavior. Preserve useful IDs/deep links and public contracts. Aki's original robot/launcher and functional/backend behavior are protected; only scoped chat presentation, responsive geometry, existing theme binding, and minimal presentational markup are permitted. Shared data/style/provider consumers must be checked for indirect effects.

## Commands and release

Inspect the active [package scripts](../../package.json), [PR quality workflow](../../.github/workflows/portfolio-quality.yml), [deployment workflow](../../.github/workflows/deploy.yml), and [PR template](../../.github/pull_request_template.md) before checking or releasing a change. Apply the canonical [verification](model-routing.md#verification-and-acceptance) and [final review and release](model-routing.md#final-review-and-release) policy to the affected work.

The [branch workflow](run-contract.md#branch-workflow) distinguishes authorized direct documentation maintenance from future implementation on a new branch based on the exact latest fetched documentation commit. Inspect actual workflow triggers for that PR base; absence of an automatic run is not a passed CI result. Documentation validation does not establish application or browser behavior.
