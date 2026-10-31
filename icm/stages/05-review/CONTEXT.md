# 05: Architecture review and handoff

## Purpose

Review the integrated change, evidence, and remaining risk under final architecture authority. Produce a concrete PR/release handoff without merging or deploying automatically.

## Inputs

| Source | File / location | Section / scope | Why |
| --- | --- | --- | --- |
| Selected specification | `icm/stages/02-specification/output/<run-id>-spec.md` (generated prerequisite) | Latest human-edited run, scope and acceptance | Judge the agreed outcome. |
| Implementation record | `icm/stages/03-implementation/output/<run-id>-implementation.md` (generated prerequisite) | Latest human-edited run, revision, deviations | Review actual code and contract changes. |
| Verification record | `icm/stages/04-verification/output/<run-id>-verification.md` (generated prerequisite) | Latest human-edited run, observed evidence | Assess pass, failure, and `NOT TESTED` limits. |
| Final policy | [architecture authority](../../shared/model-routing.md#architecture-security-and-final-authority), [verification and acceptance](../../shared/model-routing.md#verification-and-acceptance), [final review and release](../../shared/model-routing.md#final-review-and-release) | Named sections only | Assign final decision and preserve human release approval. |
| Source context | [source snapshot](../../shared/repo-map.md#source-snapshot), [commands and release](../../shared/repo-map.md#commands-and-release), [evidence rules](../../shared/proof-register.md#evidence-rules) | Named sections only | Check branch reality, release impact, and public claims. |
| Run rules | [artifact metadata](../../shared/run-contract.md#artifact-metadata), [human edits and stale inputs](../../shared/run-contract.md#human-edits-and-stale-inputs), [status](../../shared/run-contract.md#status), [checkpoints and authority](../../shared/run-contract.md#checkpoints-and-authority) | Named sections only | Keep final judgment tied to current inputs. |

## Process

1. Import only the selected run's latest human-edited records and inspect the actual integrated diff. Confirm that spec, implementation, and verification revisions align; invalidate stale evidence.
2. Have the architecture authority review task closure, contracts, content consistency, Aki preservation, accessibility and motion, security boundaries, and relevant test results. Recheck the active branch's release behavior.
3. Resolve review findings with owners and seek new verification for changes. Keep unresolved failures and `NOT TESTED` items visible with their effect on readiness.
4. Prepare a PR handoff using the repository's template: visitor problem, authorized scope, acceptance, review findings, evidence, and limits. State compatibility/release order when frontend and Worker both change.
5. Apply [final review and release policy](../../shared/model-routing.md#final-review-and-release) to separate review readiness from merge/deploy authorization. Record the exact approval still required, or the earlier explicit approval that satisfies it; do not perform a release as part of this stage.
6. Audit before saving the selected run's [review record](references/artifact-template.md). A blocked review must state the blocking criteria.

## Checkpoints

- **Build/final:** Present the integrated diff, visitor outcome, Aki and security findings, verification limits, PR handoff, and release decision for steering under [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if final authority reviews the current diff and evidence; **fail** for an outdated revision or unreviewed high-risk boundary.
- **Pass** if failures, `NOT TESTED` items, and blockers appear in the handoff; **fail** if readiness implies they passed.
- **Pass** if the PR description states visitor problem, scope, acceptance, and findings; **fail** if reviewers must reconstruct them from stage history.
- **Pass** if merge/deploy authorization and actual release status are explicit; **fail** if review completion is treated as release permission.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Architecture review and PR/release handoff | `icm/stages/05-review/output/<run-id>-review.md` (generated for a selected run) | Human reviewers receive the concrete diff, evidence, blockers, and approval status. |
