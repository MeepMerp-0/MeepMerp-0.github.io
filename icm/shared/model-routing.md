## Development model routing

This policy governs development of `MeepMerp-0/MeepMerp-0.github.io`: the React/Vite portfolio, Aki's browser UI and Cloudflare Worker, contact integrations, and delivery workflows.

Use the model assigned to each role for the active development host. Run every model, including substitutes, at **high reasoning effort or higher**; never use low, medium, or minimal effort. Verify the host's actual reasoning setting rather than relying on a prompt to simulate it.

These assignments govern development sessions only. They do not select or change Aki's deployed chat or speech models, provider order, eligibility rules, or quotas.

| Role | Claude | Codex |
| --- | --- | --- |
| Adviser | Fable 5.1 | Astra |
| Architecture, security, and final authority | Opus 5.5 | 6.1 Sol |
| Primary implementation workhorse | Sonnet 5.5 | 6 Sol |
| Small, repetitive tasks | Haiku 5.5 Fast | 6 Luna |

### Portfolio context

Work within the repository's existing JavaScript/JSX structure and dependencies. Introducing TypeScript, another framework, a database service, or an additional test framework requires an explicit architectural decision tied to the task.

| Area | Existing locations |
| --- | --- |
| Page composition and sections | `src/App.jsx`, `src/sections/` |
| Shared UI, hooks, styling, and motion | `src/components/`, `src/hooks/`, `src/styles/global.css`, component CSS, `src/utils/motion.js` |
| Portfolio content and quick answers | `src/data/portfolioData.js`, `workflowStages.js`, `akiFaq.js`, `akiGreetings.js` |
| Aki UI, chat state, and voice | `src/components/aki/`, `src/services/akiClient.js`, `akiVoice.js`, `src/services/aki/` |
| Aki Worker, providers, and persistent limits | `worker/src/`, `worker/wrangler.toml` |
| Contact form and backend adapters | `src/components/contact/`, `src/services/contactForm.js` |
| Public metadata and Aki notice | `index.html`, `public/aki-legal.html` |
| Verification and deployment | `package.json`, `worker/test/`, colocated `*.test.js`, `scripts/verify-scroll-preview.mjs`, `.github/workflows/` |

Treat technologies described in project case studies as portfolio content. They are not automatically dependencies or architectural requirements of this repository.

### Adviser

Consult Fable 5.1 for Claude or Astra for Codex for a second opinion on:

- Major changes to the portfolio's information hierarchy, visual direction, or presentation to recruiters and clients.
- High-stakes Aki architecture, privacy, security, provider, or operating-cost decisions.
- Tradeoffs between animation, accessibility, responsiveness, and performance.
- Problems or architectural disagreements the architecture model cannot resolve.

The adviser recommends; the architecture model decides and remains accountable. Ordinary implementation and mechanical edits do not require a separate adviser consultation.

### Architecture, security, and final authority

Assign Opus 5.5 for Claude or 6.1 Sol for Codex to:

- Decomposing work, defining acceptance criteria, assigning file ownership, and coordinating integration.
- Component/service boundaries, shared state, dependencies, Vite configuration, and changes spanning the frontend and Worker.
- Aki session issuance and validation, HMAC signatures, signed history, expiry, consent versions, region eligibility, and browser-storage rules.
- Turnstile validation, origin/CORS policy, CSP, request validation, upload limits, safe response rendering, and permitted assistant links. Origin restrictions must not be treated as sufficient authentication by themselves.
- Provider credentials, signing secrets, development/production isolation, and public-versus-secret configuration. Keep private credentials out of `VITE_*` values, browser bundles, committed files, fixtures, and logs.
- Durable Object storage and migration safety; atomic quota decisions; turn IDs, leases, queues, concurrency, retries, refunds, provider pauses, and counter resets.
- Runtime provider selection and fallback contracts, consent and region checks on every relevant route, provider data exposure, request budgets, and timeout/cancellation behavior.
- Voice capture and transcription boundaries, microphone disclosure, audio handling, and compatibility between browser and server limits.
- Aki knowledge and prompt boundaries, private-project filtering, and any change that expands the information sent to a provider.
- Changes to contact-backend contracts, deployment workflows, production configuration, or compatibility between Worker and site releases.
- Reviewing high-risk implementations, resolving architectural conflicts, and performing the final review of the complete branch and release readiness.

The architecture model owns the contracts and acceptance of these boundaries. The implementation model may implement an approved design; it must escalate changes that alter the approved behavior.

Keep validation claims precise: request-count caps do not by themselves guarantee free usage; a client recording limit does not prove server-side duration enforcement; aborting a browser request does not prove cancellation of provider work already submitted.

### Primary implementation workhorse

Assign Sonnet 5.5 for Claude or 6 Sol for Codex to:

- Implementing and refining Hero, Work, About, Process, and Contact sections.
- Building reusable React components, hooks, responsive styles, theme behavior, navigation, and motion within the established design.
- Implementing Aki's welcome, chat, composer, service-status, error, and voice interfaces under approved contracts.
- Preserving keyboard access, focus return, screen-reader announcements, reduced-motion preferences, and light/dark theme behavior.
- Updating portfolio records, project presentation, quick answers, and greetings using supplied or verified facts.
- Implementing contact adapters, frontend services, Worker routes, and provider adapters under contracts approved by the architecture model.
- Writing focused regression tests for changed behavior and running the relevant unit, browser, and local Worker checks.
- Debugging failures, addressing review findings, and refactoring duplication within the task's agreed scope.

Preserve the existing voice interaction: transcribed words go into the composer for the visitor to review and explicitly send. Changes to that behavior require an explicit product decision and architecture review.

Do not invent employers, roles, dates, metrics, project outcomes, testimonials, or public availability of private work. When facts change, check the corresponding portfolio data, Aki quick answers, `worker/src/experience.js`, `worker/src/knowledge.js`, and static SEO metadata in `index.html` for consistency. Update only the surfaces affected.

### Small, repetitive tasks

Assign Haiku 5.5 Fast for Claude or 6 Luna for Codex to:

- Small README and development-documentation edits.
- Applying exact, approved copy or metadata changes to named records.
- Task-ledger updates and mechanical formatting corrections.
- Fully specified import, naming, or JavaScript/JSDoc corrections.
- Repetitive component or navigation edits that preserve IDs, link targets, focus behavior, and public contracts.
- Low-risk fixture or test-data maintenance under an explicit checklist.

Do not give these models independent decisions about authentication, authorization, consent or legal copy, browser storage, provider disclosure, secrets, CSP/CORS, Turnstile, quotas, concurrency, Durable Object migrations, microphone/audio handling, or deployment.

A short diff is not automatically low risk. Classify changes by their effect on behavior and authority, not by their line count.

### Model availability and substitution

Before delegation, verify that the active host exposes the assigned model and supports high reasoning effort or higher. Resolve the names in the table to actual selectable model IDs; the table is a requested routing policy, not proof of availability.

Check Codex Router models, including any currently offered free options, only when that router is available. Verify current availability and pricing before describing a model as free.

If an assigned model is unavailable:

- Report the unavailable model, proposed substitute, reason, and verified reasoning setting.
- Use the closest authorized equivalent and record the substitution with the task.
- Preserve the original role's authority and risk restrictions. An implementation or lightweight model must not acquire architectural or security authority merely because another model is unavailable.
- If no authorized, suitably capable substitute exists, mark the affected decision blocked and continue independent work that is already authorized.

Do not silently downgrade reasoning effort or claim that a model or reviewer ran when it did not.

### Development orchestration

Before implementation, Opus 5.5 for Claude or 6.1 Sol for Codex must inspect the relevant code and repository instructions, identify the visitor-facing problem, and decompose the authorized work into bounded tasks with explicit acceptance criteria.

Each task must record:

- Task ID and description.
- Priority and risk level.
- Assigned model and reasoning effort; any substitution.
- Dependencies.
- Files or modules affected and their assigned owner.
- Expected deliverable.
- Observable acceptance criteria.
- Verification procedure and required evidence.
- Completion status and unresolved blockers.

Keep this proportional: a small change can use one task record. Separate UI, content, Worker/security, and verification work when they can be reviewed independently.

Parallelize independent Sonnet 5.5 and Haiku 5.5 Fast tasks for Claude, or 6 Sol and 6 Luna tasks for Codex, where practical. Parallel writers must use separate worktrees and non-overlapping file scopes.

Assign one writer at a time to shared files such as `src/data/portfolioData.js`, `src/styles/global.css`, `src/App.jsx`, `worker/wrangler.toml`, package manifests/lockfiles, and deployment workflows. Coordinate frontend/Worker contracts, consent-version rollouts, and Durable Object migrations before editing; sequence dependent tasks.

### Verification and acceptance

Use the repository's existing tooling. Node.js 22 or newer is required. For implementation changes, follow the relevant checks in `.github/workflows/portfolio-quality.yml`:

- Install locked dependencies with `npm ci` when setting up the checkout or after lockfile changes.
- Run `npm test` for the integrated frontend-helper and Worker test suite. `npm run aki:test` is available for focused Worker iteration.
- Run `npx eslint` with the actual changed JavaScript/JSX paths. The current package has no `npm run lint` script.
- Run `npm run build` to check the production site build.
- For browser checks, start `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` after building. With Chrome/Chromium available and `CHROME_BIN` configured as needed, run `node scripts/verify-scroll-preview.mjs` in another terminal and inspect the resulting `ui-previews/` images.
- For changes involving Cloudflare bindings, SQLite-backed Durable Object behavior, or Worker configuration, install Worker dependencies with `npm ci --prefix worker` and use `npm run aki:dev` for an appropriate local smoke check. Pure Node tests alone do not establish Cloudflare runtime behavior.

Apply verification to the changed behavior and honor the repository's CI gates. Documentation-only changes need content/link review, not newly invented test suites. Reuse existing checks and add tests for concrete regressions or risk boundaries.

For relevant UI changes, verify 360px, 768px, and desktop layouts; navigation and deep links; keyboard/focus behavior; light/dark themes; reduced motion; and the affected contact or Aki flow. Check loading, unavailable, validation, and recovery states as applicable. Use controlled test backends for contact and provider flows; do not send real messages or consume live provider services without authorization.

For relevant Worker changes, require focused evidence for invalid/expired sessions, consent-version changes, region/provider eligibility, duplicate or concurrent turns, quota exhaustion, fallback/refusal behavior, and request/upload limits. Test the changed boundary rather than assuming existing coverage proves it.

Treat the scripted Aki browser checks as controlled UI verification. Live provider behavior, deployed secrets, microphone behavior on actual target devices, and production configuration require their own evidence when affected. Mark anything not exercised as `NOT TESTED` with the reason.

### Final review and release

Opus 5.5 for Claude or 6.1 Sol for Codex performs the final integrated review, including critical/high-risk boundaries, content consistency, relevant test results, visual evidence, and remaining limitations.

Follow `.github/pull_request_template.md`: document the visitor problem, authorized scope, acceptance criteria, reviewer findings, and untested items. Preserve its human-approval requirement for merge and deployment; an existing explicit approval for the action satisfies that requirement.

A push to `main` triggers production delivery: the workflow deploys the Worker first, then builds and publishes the portfolio to GitHub Pages. Treat merges/pushes to `main`, `npm run deploy`, and `npm run aki:deploy` as release actions, not verification commands.

For changes spanning Aki's frontend and Worker, review release order and backward compatibility. Coordinate `src/data/akiFaq.js`, `public/aki-legal.html`, and `worker/wrangler.toml` when the notice version changes; use the supported overlap of accepted versions during rollout and retire the old version deliberately.

Report what changed, why, which checks actually ran, their results, any unresolved risks, and whether deployment occurred. Do not report a passing build as proof that the live site, contact backend, or AI providers were tested.

### Repository reference

Tailored to [MeepMerp-0/MeepMerp-0.github.io at commit `2e124d7`](https://github.com/MeepMerp-0/MeepMerp-0.github.io/tree/2e124d7eee0b0c4bf57a24d20a575a683e400218). Recheck paths, commands, and deployment behavior against the active branch before implementation.

Source files: [package scripts](https://github.com/MeepMerp-0/MeepMerp-0.github.io/blob/2e124d7eee0b0c4bf57a24d20a575a683e400218/package.json), [content records](https://github.com/MeepMerp-0/MeepMerp-0.github.io/blob/2e124d7eee0b0c4bf57a24d20a575a683e400218/src/data/portfolioData.js), [Aki knowledge](https://github.com/MeepMerp-0/MeepMerp-0.github.io/blob/2e124d7eee0b0c4bf57a24d20a575a683e400218/worker/src/knowledge.js), [Worker configuration](https://github.com/MeepMerp-0/MeepMerp-0.github.io/blob/2e124d7eee0b0c4bf57a24d20a575a683e400218/worker/wrangler.toml), [PR checks](https://github.com/MeepMerp-0/MeepMerp-0.github.io/blob/2e124d7eee0b0c4bf57a24d20a575a683e400218/.github/workflows/portfolio-quality.yml), [deployment workflow](https://github.com/MeepMerp-0/MeepMerp-0.github.io/blob/2e124d7eee0b0c4bf57a24d20a575a683e400218/.github/workflows/deploy.yml), and [PR template](https://github.com/MeepMerp-0/MeepMerp-0.github.io/blob/2e124d7eee0b0c4bf57a24d20a575a683e400218/.github/pull_request_template.md).
