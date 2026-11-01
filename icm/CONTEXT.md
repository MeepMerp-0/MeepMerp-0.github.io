# ICM portfolio workflow router

This is a documentation workspace for planning and reviewing a portfolio rework. Read a single stage contract for the task at hand, then only the specific sections and artifacts named in that contract. Shared references are guidance; previous outputs are run-specific inputs.

| Request | Route |
| --- | --- |
| `setup` or clarify known context | [setup/profile.md](setup/profile.md) and [portfolio strategy](shared/portfolio-strategy.md) |
| `status` or resume a run | [run contract](shared/run-contract.md#status), then the run's output metadata |
| Execute the complete portfolio rework | [saved master prompt](prompts/rework-portfolio.md), then the five stages below for one run |
| Update ICM guidance only | [branch workflow](shared/run-contract.md#branch-workflow) and the affected canonical references; do not imply an implementation run |
| Define audience, message, and proof | [01 Strategy & Content](stages/01-strategy-content/CONTEXT.md) |
| Specify interaction, motion, accessibility, and content | [02 Specification](stages/02-specification/CONTEXT.md) |
| Implement an approved spec in repository code | [03 Implementation](stages/03-implementation/CONTEXT.md) |
| Gather test and review evidence | [04 Verification](stages/04-verification/CONTEXT.md) |
| Decide readiness and next action | [05 Review](stages/05-review/CONTEXT.md) |
| Build portfolio demos | [demo catalog](shared/demo-catalog.md#source-aliases) and [demo boundary](shared/demo-boundary.md#scope-and-authority), then Stage 01 through Stage 05 for one run; apply the [demo release checklist](references/demo-release-checklist.md#evidence-handling) |

Choose the earliest stage affected by a changed goal, design decision, public claim, or code contract. Follow the [human-edit and stale-input rule](shared/run-contract.md#human-edits-and-stale-inputs) before reusing downstream outputs. A stage artifact is a reviewable handoff, not proof that later work happened.

The [current design contract](shared/design-preferences.md) records the confirmed order, real Three.js Work requirement, pin/reverse/release behavior, two themes/seven-width matrix, and protected robot/runtime with chat-only styling. For a demo-only request, use `prompts/implement-demos.md` as a scoped compatibility entry; it does not authorize a full redesign or an Aki walkthrough.
