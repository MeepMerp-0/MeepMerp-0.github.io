# Validation checklist

Use this checklist on a stage handoff and again on the integrated change. Record the actual result and evidence in that run's artifact; do not turn this list into an invented test suite.

## Context and traceability

- The request loaded the selected stage's required sections and the current revisions of its inputs; it did not assume all shared files were needed.
- The artifact has the [required metadata](../shared/run-contract.md#artifact-metadata), accurate state, input revisions, open decisions, and exact evidence or `NOT TESTED` reasons.
- A human edit to an earlier output has been compared with downstream work and stale items have been rechecked.
- Links and anchors resolve in the active repository. Source claims cite a path and revision; proposals are labeled.
- For demo work, private provenance stays in operator-held evidence; public handoffs contain only aliases, safe evidence IDs, and public revision hashes under the [demo boundary](../shared/demo-boundary.md#public-and-private-evidence). This overrides a generic source-path requirement above.
- Branch records follow the [branch workflow](../shared/run-contract.md#branch-workflow): exact fetched documentation-base commit, new unique feature branch and draft PR back to that base for future application work. Explicit direct documentation maintenance is labeled separately; it does not claim application-stage execution or retarget the documentation PR.

## Content and disclosure

- The primary hiring goal is mid-level full-time interviews, with secondary outcomes subordinate in the message. Arrangements and markets match [strategy](../shared/portfolio-strategy.md#hiring-target) without invented rankings.
- Project facts, availability, dates, role titles, and metrics come from verified records. INNERCIRCLE stays inside the [public disclosure ceiling](../shared/proof-register.md#innercircle).
- Aki's original robot/launcher assets, appearance, materials/colors, proportions, animations, placement, and behavior are preserved. Authorized chat-panel visual changes have an explicit file/behavior allowlist, including scoped styles, responsive geometry, existing theme binding, and minimal presentational markup.
- Aki copy/disclosures, knowledge/prompts, conversation/streaming/request/error/recovery, providers/quotas, consent/privacy/session/region/storage, Worker/services/configuration, and functional/backend behavior remain unchanged. Editable voice transcription still requires review and explicit send. Keyboard/focus/screen-reader semantics and mobile usability have observed evidence where exercised.
- Shared CSS/data/providers, ancestor transforms/overflow/stacking, and dependency versions are inspected for indirect Aki effects. A content change does not automatically update protected Aki answers or Worker knowledge/experience; conflicts become separate tasks. Compare the original robot baseline separately from intentional chat presentation changes.
- Demo copy identifies fictional workflows and synthetic data, creates no canned Aki walkthrough/replacement/duplicate, and does not expand INNERCIRCLE beyond its existing public summary. Existing controlled test mocks are verification facilities only.

## Design, implementation, and release

- The [confirmed design](../shared/design-preferences.md#confirmed-direction) includes Hero → Work → About → Process → Contact; Work scenes Aki → INNERCIRCLE → Timekeeping, Payroll & Attendance → FuturoHub. Copy/sculpture/timing details are proposals; these orders and the real Three.js Work requirement are not.
- The normal Work path uses actual Three.js geometry/materials/lights/camera. Native page scroll pins/scrubs/pauses/reverses/releases into About; chapter/skip controls work. No wheel/touch interception, body lock, timed freeze, scroll-handler repositioning, or preview-style internal production viewport. Reduced-motion/unavailable-renderer paths retain all project DOM content and navigation.
- Record a **320, 360, 390, 768, 820, 1024, 1440px × light/dark** evidence matrix, including relevant orientation/resize/browser-height, zoom, touch/keyboard, reduced motion, and on-screen-keyboard cases. Check no overlap/clipping/horizontal overflow, usable focus/contrast/controls, responsive canvas/camera, and no collisions with Aki. Mobile chat keeps its composer and close/send/voice controls reachable.
- Theme switching uses established state/preferences without remounting Aki, clearing messages/session, resetting interactions/scroll, or breaking scene geometry. Scene contrast, loading/failure/context behavior, resource cleanup, and off-screen rendering are verified rather than inferred from source.
- Verification follows the [existing repository checks](../shared/model-routing.md#verification-and-acceptance) relevant to the change, records exact results, and does not equate a build with live service testing.
- Final review identifies remaining risks, untested behavior, and release readiness. Merge and deployment follow the [release authority](../shared/model-routing.md#final-review-and-release).
- Demo review applies the [release checklist](demo-release-checklist.md#evidence-handling) to the entire public changeset, build, and export. A `NOT TESTED` gate blocks public-export readiness.

## Documentation-only validation

- All changed files are approved ICM Markdown; application/Aki/Worker code, dependencies, workflows, and previews remain unchanged.
- Model-routing assignments and the original license remain byte-identical, attribution stays intact, relative links/anchors resolve, and reference cycles are absent. Keep every `CONTEXT.md` below 80 lines and other workspace documents below 200 lines.
- Stage output folders contain only their empty-output markers unless an actual separately scoped run supplied evidence. Do not manufacture completed implementation artifacts.
- Review the full intended public documentation and PR text for private identifiers, provenance, raw findings, and credentials before uploading. Keep raw evidence outside the checkout.
- Report documentation checks separately. Build/browser/WebGL/theme/responsive/Aki/provider/demo-network behavior is **NOT TESTED by a documentation-only revision**; neither a saved prompt nor an isolated conversation example proves it.
