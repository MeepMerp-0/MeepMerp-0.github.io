# 02: Specification

## Purpose

Convert the selected human-edited brief into observable product behavior, contracts, and bounded tasks. Specify what the portfolio must do before choosing new libraries or prescribing arbitrary implementation detail.

## Inputs

| Source | File / location | Section / scope | Why |
| --- | --- | --- | --- |
| Selected brief | `icm/stages/01-strategy-content/output/<run-id>-brief.md` (generated prerequisite) | Latest human-edited run only | Establish the approved creative and content intent. |
| Strategy and design | [success measures](../../shared/portfolio-strategy.md#success-measures), [open decisions](../../shared/portfolio-strategy.md#open-decisions), [Three.js Hero](../../shared/design-preferences.md#threejs-hero), [Aki preservation](../../shared/design-preferences.md#aki-preservation), [decisions for specification](../../shared/design-preferences.md#decisions-for-specification) | Named sections only | Convert outcomes, Hero rendering, and Aki constraints into acceptance criteria. |
| Evidence and source | [evidence rules](../../shared/proof-register.md#evidence-rules), [application map](../../shared/repo-map.md#application-map), [existing design and constants](../../shared/repo-map.md#existing-design-and-constants) | Named sections only | Bound claims and identify candidate code ownership. |
| Development policy | [portfolio context](../../shared/model-routing.md#portfolio-context), [architecture authority](../../shared/model-routing.md#architecture-security-and-final-authority), [orchestration](../../shared/model-routing.md#development-orchestration), [model substitution](../../shared/model-routing.md#model-availability-and-substitution) | Named sections only | Route decisions and record tasks under the canonical policy. |
| Run rules | [artifact metadata](../../shared/run-contract.md#artifact-metadata), [task records](../../shared/run-contract.md#task-records), [human edits and stale inputs](../../shared/run-contract.md#human-edits-and-stale-inputs), [checkpoints and authority](../../shared/run-contract.md#checkpoints-and-authority) | Named sections only | Keep the spec current and actionable. |
| Demo runs only | [independent authoring and synthetic data](../../shared/demo-boundary.md#independent-authoring-and-synthetic-data), [build and export boundary](../../shared/demo-boundary.md#build-and-export-boundary), [runtime isolation](../../shared/demo-boundary.md#runtime-isolation), [claims and Aki](../../shared/demo-boundary.md#claims-and-aki), [catalog](../../shared/demo-catalog.md#source-aliases) | Named sections only | Specify safe behavior, fixtures, interfaces, isolation, and proof before implementation. |

## Process

1. Import the selected run's latest human-edited brief. Compare its recorded input revision with current sources; invalidate stale evidence and resolve relevant edits before specifying.
2. Define observable Hero, Work, About, Process, and Contact behavior; primary navigation labels are Work, About, Process, Contact. Specify the lightweight actual [Three.js Hero contract](../../shared/design-preferences.md#threejs-hero) with the shared scoped integration, immediate semantic title/role/actions, responsive camera/text separation, static and failure paths, and resource lifecycle; choose exact geometry/camera/timing without using Aki's robot. Set Work chapters to Aki, INNERCIRCLE, Payroll/Attendance, FuturoHub. Specify real Three.js geometry, materials, lights, and camera on capable devices in the main Work scene, using a scoped dependency addition if absent. Reuse existing motion tools. Describe native page scroll arriving at a pin, scrubbing while scrolling continues, pausing when idle, reversing, and releasing into About; include chapter buttons, Skip to About, keyboard access, semantic DOM outside canvas, and ordinary-flow loading/error/WebGL/reduced-motion fallback. No wheel/touch cancellation, body lock, timed freeze, or scroll writes inside handlers. Earlier internal-viewport preview mechanics are not the production contract.
3. Specify the original Aki robot and launcher as visually and behaviorally preserved. Limit permitted changes to chat-panel CSS, visual states, responsive geometry, internal overflow, existing theme binding, and minimal presentational markup preserving copy, semantics, IDs, refs, and event wiring. Preserve streaming, knowledge/FAQ, greetings, voice capture, editable transcript review before explicit send, error/retry/cancel, consent/privacy/region, sessions, storage, providers, quotas, and backend contracts. Keep protected functional and security paths outside the task allowlist. Test panel refinements for keyboard reachability at narrow widths and theme changes without state, scroll, or conversation reset. Refer to [architecture authority](../../shared/model-routing.md#architecture-security-and-final-authority) for security detail.
4. Have the architecture authority set the component and service contracts, task boundaries, scoped file owners, dependencies, risk, model/effort, and verification needs. Record actual model substitutions under [policy](../../shared/model-routing.md#model-availability-and-substitution).
5. At a build checkpoint, show the behavior matrix, creative tradeoffs, Aki flows, task plan, and decisions still open. Continue work within established authority; escalate changed contracts as prescribed by policy.
6. Audit before saving the selected run's [specification](references/artifact-template.md). Mark unresolved criteria as draft or blocked, not complete.

For a demo run, specify only an eligible independent fictional concept: synthetic payroll/attendance without statutory, GPS, biometric, camera, permission, or real-payroll behavior; fresh fictional FuturoHub with no real lead; or an abstract INNERCIRCLE scene within the public summary ceiling. Do not specify a canned Aki walkthrough, mock assistant, or second widget. Define local in-memory state, Reset, visible fictional/local/no-real-action labels, direct and embedded modes, source/export allowlists, and strict demo-only CSP and network boundaries without breaking live Aki. Acceptance covers every attempted request, including CSP-blocked attempts; only reviewed bundled assets may load. Assign architecture authority to isolation and export. Missing required tooling or decisions block demo release readiness while independent work continues. Apply the [demo release checklist](../../references/demo-release-checklist.md#source-and-build-review) and [browser review](../../references/demo-release-checklist.md#browser-and-interaction-review).

## Checkpoints

- **Build:** Review observable outcomes, the recruiter path, selected cinematic interactions and fallbacks, Aki preservation, task ownership, and evidence needed for acceptance under [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if each task has observable acceptance, owned files, dependencies, and verification; **fail** for unowned shared files or vague deliverables.
- **Pass** if Aki's discovery, review-before-send, safeguards, and accessibility are explicit; **fail** if any are silently removed or weakened.
- **Pass** if new architecture/dependency decisions are justified and authorized by the canonical policy; **fail** for premature library/framework selection or implementation detail without a behavioral reason.
- **Pass** if claims remain evidence-bound and the input brief is current; **fail** if stale human edits or disputed facts are treated as approved.
- **Demo runs:** Pass if synthetic behavior, export allowlist, runtime isolation, entry modes, and browser acceptance are testable; fail for an implied live integration, production call, or an unowned security boundary.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Product/engineering specification | `icm/stages/02-specification/output/<run-id>-spec.md` (generated for a selected run) | Stage 03 implements only its authorized, current tasks and contracts. |
