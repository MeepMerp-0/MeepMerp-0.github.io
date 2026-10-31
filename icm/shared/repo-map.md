# Repository map

## Source snapshot

This map was checked against `MeepMerp-0/MeepMerp-0.github.io` at commit [`2e124d7eee0b0c4bf57a24d20a575a683e400218`](https://github.com/MeepMerp-0/MeepMerp-0.github.io/tree/2e124d7eee0b0c4bf57a24d20a575a683e400218). Reinspect the active branch before implementation. Project and technology descriptions below are source observations, not new product requirements.

## Application map

| Area | Source locations |
| --- | --- |
| Page composition and sections | [App](../../src/App.jsx), [sections](../../src/sections/) |
| Shared UI, motion, styles | [components](../../src/components/), [hooks](../../src/hooks/), [global CSS](../../src/styles/global.css), [motion utility](../../src/utils/motion.js) |
| Portfolio copy and project records | [portfolio data](../../src/data/portfolioData.js), [workflow stages](../../src/data/workflowStages.js) |
| Aki chat, launcher, voice | [Aki components](../../src/components/aki/), [client](../../src/services/akiClient.js), [voice](../../src/services/akiVoice.js), [service modules](../../src/services/aki/) |
| Aki backend | [Worker source](../../worker/src/), [Worker config](../../worker/wrangler.toml) |
| Contact | [contact UI](../../src/components/contact/), [service](../../src/services/contactForm.js) |
| Public notice and metadata | [Aki notice](../../public/aki-legal.html), [HTML entry](../../index.html) |

## Demo source boundary

The project aliases `payroll-web`, `payroll-mobile`, `innercircle`, `futurohub`, and `aki-portfolio` are listed in the [demo catalog](demo-catalog.md#source-aliases). They are routing labels, not public private-repository pointers. An operator may hold exact private mappings and provenance outside this public repository. Inspect only bounded, necessary, nonsecret material read-only under the [demo boundary](demo-boundary.md#source-inspection); do not run private code or copy it into the demo. Reinspect this public portfolio branch before selecting integration points.

## Existing design and constants

The snapshot is a React/Vite JavaScript and JSX app with `motion` already listed in [package.json](../../package.json). The existing page and styling must be inspected in the active checkout before a cinematic redesign is specified in detail. The new selected direction is not implemented by this workspace. Preserve existing IDs, deep links, Aki behavior, and public contracts unless an approved spec explicitly changes them.

## Commands and release

Inspect the active [package scripts](../../package.json), [PR quality workflow](../../.github/workflows/portfolio-quality.yml), [deployment workflow](../../.github/workflows/deploy.yml), and [PR template](../../.github/pull_request_template.md) before checking or releasing a change. Apply the canonical [verification](model-routing.md#verification-and-acceptance) and [final review and release](model-routing.md#final-review-and-release) policy to the affected work.
