# Portfolio ICM workspace

This folder adapts [Interpretable Context Methodology](references/source-and-adaptations.md) to the portfolio in this repository. It provides selective context, five stage contracts, and Markdown output locations for a run. It is documentation, not an automation engine or a change to the live site.

The [complete saved implementation prompt](prompts/rework-portfolio.md) carries the current requirements: Premium Cinematic light/dark presentation, Hero → Work → About → Process → Contact, a lightweight real Three.js Hero and a separate real Three.js pinned Work sequence, desktop/tablet/mobile acceptance, safe fictional demos, and the original Aki robot/runtime preserved with scoped chat-panel styling. These are implementation requirements, not completed or browser-verified features. Conversation previews are not committed application code.

## Start here

From the repository root, ask your agent to **read `icm/AGENTS.md`**, then give one request:

> Read `icm/AGENTS.md`, `icm/CONTEXT.md`, and `icm/prompts/rework-portfolio.md`. Execute the portfolio rework on a new feature branch from the exact latest fetched `origin/docs/icm-portfolio-workspace`, follow all five stages, and prepare a reviewed draft PR back to that documentation branch. Preserve Aki's robot and functionality; restyle only its chat panel. Do not merge or deploy.

> Read `icm/AGENTS.md` and `icm/CONTEXT.md`. Set up this portfolio workflow using what is already confirmed, and tell me only which decisions are still open.

> Read `icm/AGENTS.md` and `icm/CONTEXT.md`. Start run `portfolio-2026-q4` at Stage 01 for the mid-level engineering job search. Create a reviewable strategy and content brief using the confirmed goals and public proof rules.

> Read `icm/AGENTS.md` and `icm/CONTEXT.md`. Report the status of run `portfolio-2026-q4` from its artifact metadata and evidence. Identify stale or blocked work.

> Read `icm/AGENTS.md` and `icm/prompts/implement-demos.md`. Build only the authorized non-Aki fictional demos using the catalog and available operator-held source mappings. Keep private evidence outside the public checkout. Run the applicable five stages without expanding into a full redesign, then stop before merge or deployment.

The `icm/AGENTS.md` instruction is explicit because its directory scope does not automatically reach sibling `src/` and `worker/` paths. When later changing code, keep the instruction in the request and follow the repository's own rules too.

## Branches and maintenance

Future implementation follows the [branch workflow](shared/run-contract.md#branch-workflow): fetch and record the exact documentation-base commit, create a new unique feature branch (preferred `feat/portfolio-cinematic-rework`), and target its draft PR at `docs/icm-portfolio-workspace`. Do not reuse/overwrite an existing branch or silently fall back to `main`.

The user explicitly authorized this **documentation-only synchronization directly on `docs/icm-portfolio-workspace`**. It updates ICM guidance and the existing draft documentation PR, without changing application/Aki code, dependencies, workflows, or previews. This maintenance exception does not authorize future application work directly on that branch. Merge and deployment remain separate actions.

## How a run moves

| Stage | Handoff artifact | Decision it supports |
| --- | --- | --- |
| [01 Strategy & Content](stages/01-strategy-content/CONTEXT.md) | `<run-id>-brief.md` | Audience, message, evidence, and content |
| [02 Specification](stages/02-specification/CONTEXT.md) | `<run-id>-spec.md` | Layout, behavior, motion, and acceptance criteria |
| [03 Implementation](stages/03-implementation/CONTEXT.md) | `<run-id>-implementation.md` | Changed code and exact scope |
| [04 Verification](stages/04-verification/CONTEXT.md) | `<run-id>-verification.md` | Checks actually run and observed results |
| [05 Review](stages/05-review/CONTEXT.md) | `<run-id>-review.md` | Findings, remaining risks, and release readiness |

Each artifact lives in its stage's `output/` folder and records its state, evidence, input revisions, and open decisions. You may edit a handoff; downstream work must then recheck what changed. [Status rules](shared/run-contract.md#status) distinguish a draft from verified completion.

The [setup profile](setup/profile.md) has the confirmed direction and source pointers. Consult [references/validation-checklist.md](references/validation-checklist.md) for quality checks. Merge and deployment retain the repository's human approval boundary; writing these docs does not release anything.

For demos, read the [catalog](shared/demo-catalog.md) and [boundary](shared/demo-boundary.md) before source inspection. The [demo compatibility prompt](prompts/implement-demos.md) selects the authorized subset of the master contract, and the [demo release checklist](references/demo-release-checklist.md) governs public-export readiness. A private source mapping belongs with the operator, never in public artifacts. No canned Aki walkthrough is part of this scope.
