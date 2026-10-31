# Implementation handoff template

Use `icm/stages/03-implementation/output/<run-id>-implementation.md` only for an actual run. Apply [run metadata and status](../../../shared/run-contract.md#artifact-metadata); identify the imported spec revision and implementation revision.

## Authorized scope and task results

| Task ID | Owned files changed | Implemented behavior | Status | Deviation or blocker |
| --- | --- | --- | --- | --- |

Link to the selected spec's acceptance criteria. Explain any approved contract decision and who held authority under [policy](../../../shared/model-routing.md#architecture-security-and-final-authority).

## Visitor and Aki behavior

Summarize the implemented journey, selected cinematic behavior and fallbacks, content evidence, and Aki preservation. Note any flow still incomplete without implying it passed.

## Checkpoint and developer evidence

Record the build checkpoint, steering, source revision, changed-file list or diff reference, and focused checks actually run with results. Follow [verification policy](../../../shared/model-routing.md#verification-and-acceptance); mark unrun checks `NOT TESTED` with reasons.

## Audit and validation handoff

Record the audit checks from the executing stage as pass/fail with evidence. Identify changed behavior, risk boundaries, known gaps, and environment needs for Stage 04. State whether any release action occurred.
