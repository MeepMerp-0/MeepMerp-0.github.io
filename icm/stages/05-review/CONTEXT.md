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
| Demo runs only | [public/private evidence](../../shared/demo-boundary.md#public-and-private-evidence), [claims and Aki](../../shared/demo-boundary.md#claims-and-aki), [release decision](../../shared/demo-boundary.md#release-decision), [public handoff](../../references/demo-release-checklist.md#public-handoff) | Named sections only | Judge the exact public package and safe visitor claims under final authority. |

## Process

1. Import only the selected run's latest human-edited records and inspect the actual integrated diff. Confirm that spec, implementation, and verification revisions align; invalidate stale evidence.
2. Have the architecture authority review task closure, contracts, content consistency, Aki preservation, accessibility and motion, security boundaries, and relevant test results. For the rework, confirm the lightweight real Three.js Hero and separate pinned Work scene both have observed browser evidence, Hero remains readable without WebGL and never reuses Aki's robot, and fallback/performance limits are recorded. Recheck the active branch's release behavior.
3. Resolve review findings with owners and seek new verification for changes. Keep unresolved failures and `NOT TESTED` items visible with their effect on readiness.
4. Prepare a PR handoff using the repository's template: visitor problem, authorized scope, acceptance, review findings, evidence, and limits. Keep the present docs-only synchronization on `docs/icm-portfolio-workspace` with its draft PR targeting `main`. For a later portfolio implementation, require the new unique feature branch based on the exact latest `origin/docs/icm-portfolio-workspace` SHA, and a draft PR targeting `docs/icm-portfolio-workspace`. State compatibility/release order if frontend and Worker both change.
5. Apply [final review and release policy](../../shared/model-routing.md#final-review-and-release) to separate review readiness from merge/deploy authorization. Record the exact approval still required, or the earlier explicit approval that satisfies it; do not perform a release as part of this stage.
6. Audit before saving the selected run's [review record](references/artifact-template.md). A blocked review must state the blocking criteria.

For a demo run, final architecture authority reviews the exact proposed public file allowlist, target hash/revision, actual build/export, sanitized source-scan and human-review outcomes, browser request attempts, and fictional visitor labels. Reject inflated metrics, payroll/legal/security claims, real integrations, and private feature parity. Keep INNERCIRCLE at its existing high-level public summary, normally an abstract scene. Keep raw private provenance and scan/HAR findings out of public source, outputs, PRs, attachments, and logs. Required export or network gates marked `NOT TESTED` block demo publication readiness while independent work continues. Complete public-boundary review before any public push, draft PR, or attachment; then apply separate authority to merge, main push, deployment, or messages.

## Checkpoints

- **Build/final:** Present the integrated diff, visitor outcome, Aki and security findings, verification limits, PR handoff, and release decision for steering under [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if final authority reviews the current diff and evidence; **fail** for an outdated revision or unreviewed high-risk boundary.
- **Pass** if failures, `NOT TESTED` items, and blockers appear in the handoff; **fail** if readiness implies they passed.
- **Pass** if the PR description states visitor problem, scope, acceptance, and findings; **fail** if reviewers must reconstruct them from stage history.
- **Pass** if merge/deploy authorization and actual release status are explicit; **fail** if review completion is treated as release permission.
- **Demo runs:** Pass if final authority approves the exact reviewed public package and bounded claims on sanitized evidence before publication; fail if material changes, private evidence, or missing export/network gates are hidden by a readiness claim.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Architecture review and PR/release handoff | `icm/stages/05-review/output/<run-id>-review.md` (generated for a selected run) | Human reviewers receive the concrete diff, evidence, blockers, and approval status. |
