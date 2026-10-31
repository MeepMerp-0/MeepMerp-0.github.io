# 02: Specification

## Purpose

Convert the selected human-edited brief into observable product behavior, contracts, and bounded tasks. Specify what the portfolio must do before choosing new libraries or prescribing arbitrary implementation detail.

## Inputs

| Source | File / location | Section / scope | Why |
| --- | --- | --- | --- |
| Selected brief | `icm/stages/01-strategy-content/output/<run-id>-brief.md` (generated prerequisite) | Latest human-edited run only | Establish the approved creative and content intent. |
| Strategy and design | [success measures](../../shared/portfolio-strategy.md#success-measures), [open decisions](../../shared/portfolio-strategy.md#open-decisions), [Aki preservation](../../shared/design-preferences.md#aki-preservation), [decisions for specification](../../shared/design-preferences.md#decisions-for-specification) | Named sections only | Convert outcomes and Aki constraints into acceptance criteria. |
| Evidence and source | [evidence rules](../../shared/proof-register.md#evidence-rules), [application map](../../shared/repo-map.md#application-map), [existing design and constants](../../shared/repo-map.md#existing-design-and-constants) | Named sections only | Bound claims and identify candidate code ownership. |
| Development policy | [portfolio context](../../shared/model-routing.md#portfolio-context), [architecture authority](../../shared/model-routing.md#architecture-security-and-final-authority), [orchestration](../../shared/model-routing.md#development-orchestration), [model substitution](../../shared/model-routing.md#model-availability-and-substitution) | Named sections only | Route decisions and record tasks under the canonical policy. |
| Run rules | [artifact metadata](../../shared/run-contract.md#artifact-metadata), [task records](../../shared/run-contract.md#task-records), [human edits and stale inputs](../../shared/run-contract.md#human-edits-and-stale-inputs), [checkpoints and authority](../../shared/run-contract.md#checkpoints-and-authority) | Named sections only | Keep the spec current and actionable. |
| Demo runs only | [independent authoring and synthetic data](../../shared/demo-boundary.md#independent-authoring-and-synthetic-data), [build and export boundary](../../shared/demo-boundary.md#build-and-export-boundary), [runtime isolation](../../shared/demo-boundary.md#runtime-isolation), [claims and Aki](../../shared/demo-boundary.md#claims-and-aki), [catalog](../../shared/demo-catalog.md#source-aliases) | Named sections only | Specify safe behavior, fixtures, interfaces, isolation, and proof before implementation. |

## Process

1. Import the selected run's latest human-edited brief. Compare its recorded input revision with current sources; invalidate stale evidence and resolve relevant edits before specifying.
2. Define the visitor-visible behavior, content boundaries, responsive and reduced-motion behavior, and acceptance evidence for each changed area. Separate confirmed facts from proposed copy.
3. Specify Aki preservation as observable criteria: a discoverable launcher; chat and voice transcript review before explicit send; consent, session, region, and browser-storage safeguards; keyboard, focus, and mobile usability. Refer to [architecture authority](../../shared/model-routing.md#architecture-security-and-final-authority) for security detail rather than restating it.
4. Have the architecture authority set the component and service contracts, task boundaries, scoped file owners, dependencies, risk, model/effort, and verification needs. Record actual model substitutions under [policy](../../shared/model-routing.md#model-availability-and-substitution).
5. At a build checkpoint, show the behavior matrix, creative tradeoffs, Aki flows, task plan, and decisions still open. Continue work within established authority; escalate changed contracts as prescribed by policy.
6. Audit before saving the selected run's [specification](references/artifact-template.md). Mark unresolved criteria as draft or blocked, not complete.

For a demo run, turn the selected capability into an observable fictional flow with synthetic fixtures, local canned adapters, reset/error states, and explicit permissions. Specify the public export allowlist and target build, direct and embedded entry modes, navigation, storage, CSP/network policy, reduced motion, natural mobile scrolling, and keyboard behavior. Acceptance must cover absence of production calls and unapproved request attempts, even when the browser blocks them. Keep the demo adapter separate from real Aki and preserve Aki's review-before-explicit-send, privacy, region, and consent behavior. Assign architecture authority to isolation, export, and any security decision; mark missing required tooling or decisions as blockers to publication readiness. Apply the [demo release checklist](../../references/demo-release-checklist.md#source-and-build-review) and [browser review](../../references/demo-release-checklist.md#browser-and-interaction-review) to acceptance, without copying their full policy here.

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
