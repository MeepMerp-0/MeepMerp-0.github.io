# 03: Implementation

## Purpose

Implement the current authorized specification in bounded tasks and prepare a reviewable branch. Keep release actions outside this stage.

## Inputs

| Source | File / location | Section / scope | Why |
| --- | --- | --- | --- |
| Selected specification | `icm/stages/02-specification/output/<run-id>-spec.md` (generated prerequisite) | Latest human-edited run, ready tasks only | Define authorized behavior, contracts, and ownership. |
| Source map | [source snapshot](../../shared/repo-map.md#source-snapshot), [application map](../../shared/repo-map.md#application-map), [commands and release](../../shared/repo-map.md#commands-and-release) | Named sections only | Recheck the active checkout and locate work. |
| Development policy | [portfolio context](../../shared/model-routing.md#portfolio-context), [implementation role](../../shared/model-routing.md#primary-implementation-workhorse), [orchestration](../../shared/model-routing.md#development-orchestration), [architecture authority](../../shared/model-routing.md#architecture-security-and-final-authority) | Named sections only | Preserve role boundaries, shared-file ownership, and Aki contracts. |
| Run rules | [artifact metadata](../../shared/run-contract.md#artifact-metadata), [task records](../../shared/run-contract.md#task-records), [human edits and stale inputs](../../shared/run-contract.md#human-edits-and-stale-inputs), [status](../../shared/run-contract.md#status), [checkpoints and authority](../../shared/run-contract.md#checkpoints-and-authority) | Named sections only | Track implementation against the current spec. |
| Demo runs only | [source inspection](../../shared/demo-boundary.md#source-inspection), [independent authoring](../../shared/demo-boundary.md#independent-authoring-and-synthetic-data), [build/export boundary](../../shared/demo-boundary.md#build-and-export-boundary), [runtime isolation](../../shared/demo-boundary.md#runtime-isolation), [source/build checklist](../../references/demo-release-checklist.md#source-and-build-review) | Named sections only | Keep private inspection apart from public authoring and check the public boundary before publication. |

## Process

1. Import the selected run's latest human-edited spec. Check source revision and invalidate task evidence made stale by edits. For the future portfolio implementation, verify and continue on the SAME run's already-created unique feature branch and recorded docs-base SHA, preserving Stage 01/02 artifacts. Only on direct stage entry with no run branch yet, fetch latest `origin/docs/icm-portfolio-workspace`, record its exact SHA, and create the new branch once (prefer `feat/portfolio-cinematic-rework`, add a suffix if occupied; never take over unrelated work). Do not recreate, reset, or silently change the pinned base mid-run; assess stale inputs explicitly if the remote docs branch moved. Current authorized docs-only maintenance stays on its docs branch. Inspect active instructions and code; see [branch workflow](../../shared/run-contract.md#branch-workflow).
2. Implement only ready tasks inside their owned file scopes, sequencing dependent contracts and shared-file writers. For the rework, use the same scoped Three.js integration for the approved-headline-aligned Hero and separate pinned [Work scenes](../../shared/design-preferences.md#work-scene-directions); keep Hero semantic text/actions ready before WebGL and scrolling ordinary into Work. Hero must not reuse Aki's robot; Work may contain only the approved isolated faithful assembly. Escalate any behavior or security-contract change to the architecture authority under [policy](../../shared/model-routing.md#architecture-security-and-final-authority).
3. Preserve the original **live** Aki robot assets, geometry, proportions, materials, colors, animations, launcher appearance, placement, and behavior. Inspect approved public rendering and license/dependency provenance for the separate Work likeness; do not assume a GLB or connect it to live state. Restrict live chat-panel presentation edits to the spec's scoped CSS and minimal presentational markup. Preserve the live frontend/backend conversation, streaming, voice, privacy, consent, session, provider, quota, and contact contracts. Check shared CSS variables, providers, data, transforms, overflow, z-index, and dependencies for indirect regressions. Keep claims evidence-bound; do not sync Aki knowledge solely because portfolio copy changed.
4. Show a build checkpoint with the working path through the site, cinematic scenes and fallbacks, affected Aki flows, changed files, and gaps. Apply steering within authorized scope.
5. Review the diff and run focused developer checks appropriate to changed behavior using [verification policy](../../shared/model-routing.md#verification-and-acceptance). Record only checks actually run; Stage 04 owns integrated validation.
6. Audit before saving the selected run's [implementation handoff](references/artifact-template.md). Leave incomplete tasks draft/blocked with concrete reasons.

For a demo run, inspect authorized sources only in their private context and keep exact provenance and raw findings there. Author anew in isolated staging outside private checkouts from the approved public spec, using synthetic fixtures and local in-memory adapters for eligible concepts only; do not clone and redact private code, UI, records, or assets. Do not make a canned Aki demo. Record a reviewed export allowlist, target revision/hash, and changed-file manifest. Review source, actual build/export, maps, assets, metadata, licenses, history, and logs for private spill before any public push, draft PR, or attachment; a public commit itself discloses content. Only the reviewed allowlist may move to that destination. Missing mandatory export or network evidence blocks demo release readiness while independent work continues.

## Checkpoints

- **Build:** Demonstrate implemented visitor paths, responsive/motion behavior, Aki preservation, changed scope, and known gaps under [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if every changed file maps to a ready task and owner; **fail** for unapproved behavior, shared-file collisions, or silent contract changes.
- **Pass** if implemented content is evidence-bound and Aki's required flows remain intact; **fail** if either is lost in the redesign.
- **Pass** if actual revision, diff, and focused check results are recorded; **fail** for claimed but unrun checks or hidden incomplete work.
- **Pass** if work is reviewable without a release action; **fail** if merge, deploy, or production activity is treated as implementation verification.
- **Demo runs:** Pass if independently authored files and synthetic adapters match the reviewed manifest and the public-boundary check precedes any public push or draft PR; fail if private material is copied into public history or a gate is treated as passed without evidence.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Implementation record | `icm/stages/03-implementation/output/<run-id>-implementation.md` (generated for a selected run) | Stage 04 validates the recorded revision, scope, and gaps against the current spec. |
