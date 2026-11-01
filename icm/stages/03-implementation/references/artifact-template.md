# Implementation handoff template

Use `icm/stages/03-implementation/output/<run-id>-implementation.md` only for an actual app run. Apply [run metadata and status](../../../shared/run-contract.md#artifact-metadata); identify the latest imported spec revision, exact docs-base SHA fetched at run creation, SAME run's unique feature branch, and implementation revision. Preserve prior run artifacts and recorded base; branch creation occurs once, with direct-entry creation only if no run branch exists yet. Do not take over unrelated work or silently recreate/rebase the run if remote docs moved; assess stale inputs explicitly. This docs-only synchronization is not implementation evidence. See [branch workflow](../../../shared/run-contract.md#branch-workflow).

## Authorized scope and task results

| Task ID | Owned files changed | Implemented behavior | Status | Deviation or blocker |
| --- | --- | --- | --- | --- |

Link to the selected spec's acceptance criteria. Explain any approved contract decision and who held authority under [policy](../../../shared/model-routing.md#architecture-security-and-final-authority).

## Visitor and Aki behavior

Summarize the implemented Hero, Work, About, Process, Contact journey and primary navigation labels Work, About, Process, Contact; final headline-aligned Hero; the four approved [Work scene directions](../../../shared/design-preferences.md#work-scene-directions); native page-scroll pin/scrub/idle/reverse/release; chapter controls and Skip to About; real Three.js Hero and overall Work on capable devices; semantic DOM and ordinary-flow fallbacks. Record actual lifecycle, resize, offscreen, and measurement work, plus incomplete flows. Describe the live robot/launcher baseline separately from the decorative Work likeness and allowed chat-panel presentation changes. List functional/backend Aki and contact paths checked as unchanged, indirect shared-style/provider/data risks checked, and any deviation requiring authority. Preserve transcript review before explicit send and existing live contracts.

## Checkpoint and developer evidence

Record the build checkpoint, steering, public target revision, changed-file allowlist and diff, dependency version/provenance decisions, and focused checks actually run with results. Include Aki visual baseline by theme/viewport and scoped chat diff allowlist; do not demand byte identity for permitted chat styles. Follow [verification policy](../../../shared/model-routing.md#verification-and-acceptance); mark unrun checks `NOT TESTED` with reasons.

## Demo public-boundary handoff, when selected

Record independently authored eligible concepts, synthetic fixtures/local in-memory adapters, reviewed public source and actual build/export allowlists and manifests, exact target hash/revision, and sanitized public evidence IDs. No canned Aki demo. State the source/build/export/history/log human review and private-pattern scan results before any public push, draft PR, or attachment. Keep private paths, revisions, inspection notes, raw scans, and HARs outside this artifact and public checkout. List missing mandatory gates as `NOT TESTED` and their readiness effect under the [build/export boundary](../../../shared/demo-boundary.md#build-and-export-boundary).

## Audit and validation handoff

Record the audit checks from the executing stage as pass/fail with evidence. Identify changed behavior, risk boundaries, known gaps, and environment needs for Stage 04. State whether any release action occurred.
