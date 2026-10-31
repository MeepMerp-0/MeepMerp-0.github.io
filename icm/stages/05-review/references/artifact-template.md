# Architecture review template

Use `icm/stages/05-review/output/<run-id>-review.md` only for an actual run. Apply [run identity, metadata, status, and checkpoint rules](../../../shared/run-contract.md#run-identity). Name the current spec, implementation, verification, and branch revisions.

## Visitor problem, authorized scope, and outcome

Explain the concrete visitor problem and expected behavior in PR-ready language. State implemented scope, exclusions, and source evidence for public claims.

## Architecture and integrated review

| Boundary / task | Diff or evidence reviewed | Finding and severity | Owner / resolution | Status |
| --- | --- | --- | --- | --- |

Cover changed content, motion/accessibility, Aki preservation, frontend/Worker contracts, and other applicable high-risk boundaries under [final authority](../../../shared/model-routing.md#final-review-and-release).

## Acceptance and verification limits

| Acceptance criterion | Verification result and revision | Remaining failure or `NOT TESTED` reason | Readiness effect |
| --- | --- | --- | --- |

Do not convert a local build into evidence of live behavior. Link the selected verification record.

## PR and release handoff

Draft the PR summary in the repository template's terms: visitor problem, authorized scope, acceptance, reviewer findings, and untested items. Record branch/PR reference if one exists, compatibility and release order where relevant, blockers, required merge/deploy approval or earlier explicit authorization, whether that approval is satisfied, and whether deployment actually occurred. Follow [release policy](../../../shared/model-routing.md#final-review-and-release).

## Demo publication decision, when selected

Record final authority's decision for the exact proposed public file allowlist, target hash/revision, sanitized export and browser-network evidence IDs/results, and visitor-facing fictional labels. Review the claim ceiling explicitly: no invented metrics, security/payroll legality guarantees, live integration, or private feature parity; INNERCIRCLE stays at its existing public summary level. State required export/network `PASS`, `FAIL`, or `NOT TESTED` with readiness effect. Keep raw private provenance and scan/HAR material private. Confirm public-boundary review preceded any public push or draft PR, and name separate authorization for merge, main push, deployment, or messages under the [demo release decision](../../../shared/demo-boundary.md#release-decision).

## Checkpoint, audit, and final status

Record steering and the audit checks from the executing stage with evidence. State the [run-contract status](../../../shared/run-contract.md#status) and name the next authorized action.
