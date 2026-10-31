# 04: Verification

## Purpose

Validate the actual changed revision against the current specification and repository policy. Preserve an explicit `NOT TESTED` result wherever evidence is unavailable.

## Inputs

| Source | File / location | Section / scope | Why |
| --- | --- | --- | --- |
| Selected specification | `icm/stages/02-specification/output/<run-id>-spec.md` (generated prerequisite) | Latest human-edited run, acceptance and verification fields | Define expected behavior and evidence. |
| Implementation record | `icm/stages/03-implementation/output/<run-id>-implementation.md` (generated prerequisite) | Latest human-edited run, revision, diff, gaps | Identify the exact work to validate. |
| Validation policy | [verification and acceptance](../../shared/model-routing.md#verification-and-acceptance), [final review and release](../../shared/model-routing.md#final-review-and-release) | Named sections only | Select existing checks and separate release from verification. |
| Source commands | [commands and release](../../shared/repo-map.md#commands-and-release), [source snapshot](../../shared/repo-map.md#source-snapshot) | Named sections only | Recheck available tooling on the active branch. |
| Run rules | [artifact metadata](../../shared/run-contract.md#artifact-metadata), [human edits and stale inputs](../../shared/run-contract.md#human-edits-and-stale-inputs), [status](../../shared/run-contract.md#status) | Named sections only | Tie evidence to the tested revision. |
| Checklist | [validation checklist](../../references/validation-checklist.md) | Full file | Cover applicable validation categories. |

## Process

1. Import the latest human-edited spec and implementation record for the selected run. Compare revisions and changed files with the active branch; invalidate evidence for earlier revisions or altered acceptance criteria.
2. Derive a risk-based matrix from changed behavior and the [canonical verification policy](../../shared/model-routing.md#verification-and-acceptance). Include content/link review for pure documentation changes; do not add a test suite for them.
3. Run relevant existing checks in the appropriate environment and inspect observed results. For UI, Aki, Worker, or contact changes, cover the affected flows and boundaries specified by policy using controlled services where needed.
4. Record each observation with command or procedure, environment, tested revision, expected result, actual result, and evidence location. Mark unexercised or blocked areas `NOT TESTED` with a reason; distinguish local checks from production behavior.
5. Report failures to implementation ownership and validate fixes on the new revision. Do not carry a prior pass forward after code or human-edited acceptance changes.
6. Audit before saving the selected run's [verification record](references/artifact-template.md). A partial record can be draft with explicit gaps.

## Checkpoints

- **Build:** Present failures, evidence gaps, changed acceptance, and the next bounded verification action under [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if every result names the actual revision and environment; **fail** for stale or unattributed evidence.
- **Pass** if changed behavior has relevant observations or an explicit `NOT TESTED` reason; **fail** for assumed coverage or a claimed pass from a build alone.
- **Pass** if failures remain visible and fixes are retested; **fail** for unverified fixes or hidden blockers.
- **Pass** if docs-only work receives content/link review and releases are excluded from checks; **fail** for invented tests or deployment as validation.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Verification record | `icm/stages/04-verification/output/<run-id>-verification.md` (generated for a selected run) | Stage 05 reviews the tested revision, failures, and `NOT TESTED` scope. |
