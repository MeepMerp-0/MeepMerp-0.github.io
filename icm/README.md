# Portfolio ICM workspace

This folder adapts [Interpretable Context Methodology](references/source-and-adaptations.md) to the portfolio in this repository. It provides selective context, five stage contracts, and Markdown output locations for a run. It is documentation, not an automation engine or a change to the live site.

## Start here

From the repository root, ask your agent to **read `icm/AGENTS.md`**, then give one request:

> Read `icm/AGENTS.md` and `icm/CONTEXT.md`. Set up this portfolio workflow using what is already confirmed, and tell me only which decisions are still open.

> Read `icm/AGENTS.md` and `icm/CONTEXT.md`. Start run `portfolio-2026-q4` at Stage 01 for the mid-level engineering job search. Create a reviewable strategy and content brief using the confirmed goals and public proof rules.

> Read `icm/AGENTS.md` and `icm/CONTEXT.md`. Report the status of run `portfolio-2026-q4` from its artifact metadata and evidence. Identify stale or blocked work.

The `icm/AGENTS.md` instruction is explicit because its directory scope does not automatically reach sibling `src/` and `worker/` paths. When later changing code, keep the instruction in the request and follow the repository's own rules too.

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
