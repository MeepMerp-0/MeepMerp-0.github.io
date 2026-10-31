# Verification record template

Use `icm/stages/04-verification/output/<run-id>-verification.md` only for an actual run. Apply [run metadata, status, and stale-input handling](../../../shared/run-contract.md#artifact-metadata). Name the specification, implementation, and tested revisions.

## Scope and environment

List changed behavior, applicable risk boundaries, tooling and controlled services, and any environment limits. Derive coverage from [verification policy](../../../shared/model-routing.md#verification-and-acceptance).

## Observed evidence

| Acceptance / risk | Command or procedure | Runtime environment | Revision | Expected | Observed result | Evidence location | Result (`PASS` / `FAIL` / `NOT TESTED`) and reason |
| --- | --- | --- | --- | --- | --- | --- | --- |

For `NOT TESTED`, state why the procedure could not or should not run. Do not infer live service or device behavior from local checks.

## Demo export and browser evidence, when selected

Record the reviewed public allowlist/file manifest, exact target hash and build, and sanitized evidence IDs/results for source, export, maps, assets, metadata, licenses, history, and logs. Use the observed-evidence table for direct and embedded entry, each interaction, reset/error/inputs, keyboard/mobile/reduced motion, navigation, storage, permissions/messages, and network requests and attempted requests. Record approved public bundled-asset destinations verbatim; describe unapproved or private destinations only by category or opaque evidence ID in this public record. Keep exact hosts, URLs, queries, headers, and payloads in the private raw record. Local bundled asset loads are acceptable; unapproved external or production attempts fail. Verify fictional labels and real Aki independently. Keep raw private-pattern output and HAR outside public artifacts. Mark missing required export or network tooling `NOT TESTED` with publication-readiness effect, following the [demo checklist](../../../references/demo-release-checklist.md#evidence-handling).

## Failures, fixes, and remaining gaps

For each failure, link the owning task, fix revision if any, and retest evidence. List unresolved blockers and their effect on acceptance.

## Checkpoint and audit

Record steering and the audit checks from the executing stage with pass/fail evidence. State whether the tested revision is ready for architecture review, with precise limits; do not convert `NOT TESTED` into a pass.
