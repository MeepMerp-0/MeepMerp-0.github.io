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

## Process

1. Import the selected run's latest human-edited spec. Check source revision and invalidate task evidence made stale by edits. Inspect the active repository instructions and relevant code before changing it.
2. Implement only ready tasks inside their owned file scopes, sequencing dependent contracts and shared-file writers. Escalate any behavior or security-contract change to the architecture authority under [policy](../../shared/model-routing.md#architecture-security-and-final-authority).
3. Preserve the specified Aki entry point, transcript review-before-send, consent/session/region/storage safeguards, and keyboard/focus/mobile behavior. Keep claims consistent with their approved evidence; record any blocked public claim.
4. Show a build checkpoint with the working path through the site, cinematic scenes and fallbacks, affected Aki flows, changed files, and gaps. Apply steering within authorized scope.
5. Review the diff and run focused developer checks appropriate to changed behavior using [verification policy](../../shared/model-routing.md#verification-and-acceptance). Record only checks actually run; Stage 04 owns integrated validation.
6. Audit before saving the selected run's [implementation handoff](references/artifact-template.md). Leave incomplete tasks draft/blocked with concrete reasons.

## Checkpoints

- **Build:** Demonstrate implemented visitor paths, responsive/motion behavior, Aki preservation, changed scope, and known gaps under [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if every changed file maps to a ready task and owner; **fail** for unapproved behavior, shared-file collisions, or silent contract changes.
- **Pass** if implemented content is evidence-bound and Aki's required flows remain intact; **fail** if either is lost in the redesign.
- **Pass** if actual revision, diff, and focused check results are recorded; **fail** for claimed but unrun checks or hidden incomplete work.
- **Pass** if work is reviewable without a release action; **fail** if merge, deploy, or production activity is treated as implementation verification.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Implementation record | `icm/stages/03-implementation/output/<run-id>-implementation.md` (generated for a selected run) | Stage 04 validates the recorded revision, scope, and gaps against the current spec. |
