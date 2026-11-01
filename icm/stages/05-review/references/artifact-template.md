# Architecture review template

Use `icm/stages/05-review/output/<run-id>-review.md` only for an actual run. Apply [run identity, metadata, status, and checkpoint rules](../../../shared/run-contract.md#run-identity). Name the current spec, implementation, verification, and branch revisions.

## Visitor problem, authorized scope, and outcome

Explain the concrete visitor problem and expected behavior in PR-ready language. State implemented scope, exclusions, and source evidence for public claims.

## Architecture and integrated review

| Boundary / task | Diff or evidence reviewed | Finding and severity | Owner / resolution | Status |
| --- | --- | --- | --- | --- |

Cover public claim evidence, native-scroll Work/Three.js behavior and fallback, responsive/accessibility evidence, original robot/launcher baseline, scoped chat-panel presentation diff, protected Aki frontend/backend contracts, contact behavior, and indirect shared-style/provider/data/dependency effects under [final authority](../../../shared/model-routing.md#final-review-and-release). Separate pre-existing findings from regressions.

## Acceptance and verification limits

| Acceptance criterion | Verification result and revision | Remaining failure or `NOT TESTED` reason | Readiness effect |
| --- | --- | --- | --- |

Do not convert a local build into evidence of live behavior. Link the selected verification record.

## PR and release handoff

Draft the PR summary in the repository template's terms: visitor problem, authorized scope, acceptance, reviewer findings, and untested items. Distinguish this docs-only sync on `docs/icm-portfolio-workspace` with draft PR base `main` from the future app implementation on a new unique feature branch pinned to the fetched latest `origin/docs/icm-portfolio-workspace` SHA, with draft PR base `docs/icm-portfolio-workspace`. Record actual branch/base/PR refs, compatibility and release order, blockers, separate merge/deploy approval or earlier authorization, and whether deployment occurred. Follow [release policy](../../../shared/model-routing.md#final-review-and-release).

## Demo publication decision, when selected

Record final authority's decision for exact public source and actual build/export allowlists, target revision, sanitized scan/human-review and browser request-attempt evidence, and visible fictional/local/no-real-action labels. Exclude canned Aki demos. Review claim ceiling: no invented metrics, payroll/legal/security guarantee, real integration, or private feature parity; INNERCIRCLE stays at its public summary level and defaults to an abstract scene. State mandatory export/network `PASS`, `FAIL`, or `NOT TESTED` and release-readiness effect. Keep raw private provenance and scan/HAR material private. Confirm review preceded any public push, draft PR, or attachment, and record separate authority for merge, main push, deployment, or messages under the [demo release decision](../../../shared/demo-boundary.md#release-decision).

## Checkpoint, audit, and final status

Record steering and the audit checks from the executing stage with evidence. State the [run-contract status](../../../shared/run-contract.md#status) and name the next authorized action.
