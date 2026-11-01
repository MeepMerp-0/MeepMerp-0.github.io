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
| Demo runs only | [public/private evidence](../../shared/demo-boundary.md#public-and-private-evidence), [build/export boundary](../../shared/demo-boundary.md#build-and-export-boundary), [runtime isolation](../../shared/demo-boundary.md#runtime-isolation), [evidence handling](../../references/demo-release-checklist.md#evidence-handling), [source/build review](../../references/demo-release-checklist.md#source-and-build-review), [browser review](../../references/demo-release-checklist.md#browser-and-interaction-review) | Named sections only | Verify the public export and observable isolated runtime with private findings kept private. |

## Process

1. Import the latest human-edited spec and implementation record for the selected run. Compare revisions and changed files with the active branch; invalidate evidence for earlier revisions or altered acceptance criteria.
2. Derive a risk-based matrix from changed behavior and the [canonical verification policy](../../shared/model-routing.md#verification-and-acceptance). Include content/link review for pure documentation changes; do not add a test suite for them.
3. Run relevant existing checks in the appropriate environment and inspect observed results. For the future app rework, use a real browser at 320, 360, 390, 768, 820, 1024, and 1440 px in both light and dark themes, plus orientation, short/changed viewport height and zoom, keyboard, touch, and reduced motion. Observe no clipping, overlap, or horizontal scroll; navigation, theme, Hero, Work, and Aki must not collide. Verify actual Three.js Hero rendering and metallic/lit depth on capable devices, title/role/View Work/Contact usable before and without WebGL, responsive camera/text separation, normal scroll into Work without a second pin, useful static/loading/WebGL/context-loss fallback, offscreen suspension, and cleanup. Verify Work's native scroll pin/scrub/pause/reverse/release, chapter controls and Skip to About, WebGL/loading/error/context-loss/reduced-motion fallback, resize and offscreen behavior. An earlier example and a build are not browser evidence. Measure performance before stating numeric claims.
4. Verify each [Work scene](../../shared/design-preferences.md#work-scene-directions) against its visual and claim boundary: faithful Aki assembly/end state, idle settle/upward reverse, conceptual INNERCIRCLE handoffs, simulated attendance sequence/Reset and reduced-motion steps without device access, and local FuturoHub node progression without real integrations. Compare the original **live** Aki robot and launcher against baseline by theme and viewport, separately from the decorative scene and scoped chat-panel diff allowlist. Test functional/frontend/backend file identity where required and exercise live chat, streaming, voice transcript editing before explicit send, retry/cancel, consent, privacy, region, sessions, focus, and mobile composer/close reachability with controlled services. Theme changes must preserve scroll, state, and conversation. Record pre-existing issues separately. Do not mark intentional panel styling as a robot regression.
5. Record each observation with command or procedure, environment, tested revision, expected result, actual result, and evidence location. Mark unexercised or blocked areas `NOT TESTED` with a reason; distinguish local checks from production behavior.
6. Report failures to implementation ownership and validate fixes on the new revision. Do not carry a prior pass forward after code or human-edited acceptance changes.
7. Audit before saving the selected run's [verification record](references/artifact-template.md). A partial record can be draft with explicit gaps.

For a demo run, inspect the exact public target revision and complete source/build/export surface, including source maps, assets, metadata, licenses, history, and logs. Keep raw private-pattern matches, scan output, HAR files, and exact source provenance outside public checkout/build/export/logs; publish only sanitized evidence IDs, target hashes, and outcomes. Browser-check direct and embedded entry, all interactions, Reset, errors, inputs, navigation, storage, permissions, and messages. Observe network requests and attempted requests, including blocked attempts: reviewed bundled assets may load, but no unapproved external or production attempt may pass. Verify fictional labels and the live parent-page Aki independently. Missing mandatory export or network tooling is `NOT TESTED` and blocks demo publication readiness. Use the [public handoff checklist](../../references/demo-release-checklist.md#public-handoff).

## Checkpoints

- **Build:** Present failures, evidence gaps, changed acceptance, and the next bounded verification action under [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if every result names the actual revision and environment; **fail** for stale or unattributed evidence.
- **Pass** if changed behavior has relevant observations or an explicit `NOT TESTED` reason; **fail** for assumed coverage or a claimed pass from a build alone.
- **Pass** if failures remain visible and fixes are retested; **fail** for unverified fixes or hidden blockers.
- **Pass** if docs-only work receives content/link review and releases are excluded from checks; **fail** for invented tests or deployment as validation.
- **Demo runs:** Pass only with attributable export and network evidence for the exact revision and no unapproved request attempts; fail for raw private results in a public artifact, missing required evidence, or checks inferred from a build.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Verification record | `icm/stages/04-verification/output/<run-id>-verification.md` (generated for a selected run) | Stage 05 reviews the tested revision, failures, and `NOT TESTED` scope. |
