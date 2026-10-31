# Implementation handoff template

Use `icm/stages/03-implementation/output/<run-id>-implementation.md` only for an actual run. Apply [run metadata and status](../../../shared/run-contract.md#artifact-metadata); identify the imported spec revision and implementation revision.

## Authorized scope and task results

| Task ID | Owned files changed | Implemented behavior | Status | Deviation or blocker |
| --- | --- | --- | --- | --- |

Link to the selected spec's acceptance criteria. Explain any approved contract decision and who held authority under [policy](../../../shared/model-routing.md#architecture-security-and-final-authority).

## Visitor and Aki behavior

Summarize the implemented journey, selected cinematic behavior and fallbacks, content evidence, and Aki preservation. Note any flow still incomplete without implying it passed.

## Checkpoint and developer evidence

Record the build checkpoint, steering, public target revision, changed-file list or diff reference, and focused checks actually run with results. Follow [verification policy](../../../shared/model-routing.md#verification-and-acceptance); mark unrun checks `NOT TESTED` with reasons.

## Demo public-boundary handoff, when selected

Record the independently authored staging scope, synthetic fixtures/local adapters, reviewed public export allowlist and file manifest, exact target hash/revision, and sanitized public evidence IDs. State the pre-publication source/build/export/history/log review result and whether any public push or draft PR occurred after that review. Keep private source paths, revisions, inspection notes, raw scans, and HAR files outside this artifact and the public checkout. List missing gates as `NOT TESTED` and describe their readiness effect under the [build/export boundary](../../../shared/demo-boundary.md#build-and-export-boundary).

## Audit and validation handoff

Record the audit checks from the executing stage as pass/fail with evidence. Identify changed behavior, risk boundaries, known gaps, and environment needs for Stage 04. State whether any release action occurred.
