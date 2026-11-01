# Verification record template

Use `icm/stages/04-verification/output/<run-id>-verification.md` only for an actual run. Apply [run metadata, status, and stale-input handling](../../../shared/run-contract.md#artifact-metadata). Name the specification, implementation, and tested revisions.

## Scope and environment

List changed behavior, applicable risk boundaries, tooling and controlled services, and any environment limits. Derive coverage from [verification policy](../../../shared/model-routing.md#verification-and-acceptance).

## Observed evidence

| Acceptance / risk | Command or procedure | Runtime environment | Revision | Expected | Observed result | Evidence location | Result (`PASS` / `FAIL` / `NOT TESTED`) and reason |
| --- | --- | --- | --- | --- | --- | --- | --- |

For `NOT TESTED`, state why the procedure could not or should not run. Do not infer live service or device behavior from local checks. For the future app, record the exact 320/360/390/768/820/1024/1440 px × light/dark browser matrix; orientation, viewport height, zoom, keyboard, touch, reduced motion; no clipping/overlap/horizontal scroll; native scroll pin/scrub/idle/reverse/release and Skip to About; loading/error/WebGL fallback; resize/offscreen/lifecycle observations; and measured performance rather than unsupported numbers.

Record original Aki robot/launcher visual baseline comparisons per theme and viewport separately from permitted chat-panel presentation diffs. Exercise chat streaming, greetings/FAQ, editable voice transcript before explicit send, retry/cancel, consent/privacy/region/session/storage and mobile composer/close controls. Verify theme changes preserve conversation, scroll, and state. Record relevant frontend/backend functional-file identity or scoped diff checks, Aki dependency preservation, and pre-existing issues separately. Test Contact without sending real messages.

## Demo export and browser evidence, when selected

Record the reviewed public source and actual build/export allowlist/file manifest, exact target hash, and sanitized evidence IDs/results for scans, human review, maps, assets, metadata, licenses, history, and logs. Use the observed-evidence table for direct and embedded entry, every control, Reset/errors/inputs, keyboard/mobile/reduced motion, navigation, storage, permissions/messages, network requests, and attempted requests including CSP-blocked attempts. Record approved bundled-asset destinations verbatim; describe unapproved/private destinations only by category or opaque evidence ID. Keep raw hosts, URLs, queries, headers, payloads, pattern matches, and HARs outside public artifacts. Only reviewed bundled assets may load. Verify fictional labels and the real parent-page Aki independently. Missing mandatory export or network tooling is `NOT TESTED` and blocks demo release readiness under the [checklist](../../../references/demo-release-checklist.md#evidence-handling).

## Failures, fixes, and remaining gaps

For each failure, link the owning task, fix revision if any, and retest evidence. List unresolved blockers and their effect on acceptance.

## Checkpoint and audit

Record steering and the audit checks from the executing stage with pass/fail evidence. State whether the tested revision is ready for architecture review, with precise limits; do not convert `NOT TESTED` into a pass.
