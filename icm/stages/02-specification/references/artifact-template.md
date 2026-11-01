# Specification template

Use `icm/stages/02-specification/output/<run-id>-spec.md` only for an actual run. Record [run identity, artifact metadata, status, and human edits](../../../shared/run-contract.md#run-identity), including the imported brief revision. This template contains no approved task.

## Product outcome and scope

Describe visitor problem, target outcomes, authorized scope, exclusions, and facts requiring proof. Cite the selected brief and [success measures](../../../shared/portfolio-strategy.md#success-measures).

## Observable behavior and acceptance

| Area / flow | Visitor-visible behavior | Responsive or motion behavior | Acceptance evidence | Open decision |
| --- | --- | --- | --- | --- |

Specify the Hero and Work-to-About journey; primary navigation labels Work, About, Process, Contact; confirmed Work order Aki, INNERCIRCLE, Payroll/Attendance, FuturoHub; About capabilities; Process Understand, Shape, Build, Verify; and Contact's existing backend contract. Align Hero to approved headline/subtitle and specify the [scene directions](../../../shared/design-preferences.md#work-scene-directions) with their distinct evidence and simulation boundaries. Specify Premium Cinematic light/dark, real Three.js geometry/materials/lights/camera for capable Hero and overall Work, scoped shared integration if absent, and reuse of existing motion tools; the whole INNERCIRCLE chapter may be 2D/3D/hybrid. Define native page-scroll arrival, pin, continued-scroll scrub, idle pause, reverse, About release, chapter buttons, Skip to About, keyboard control, semantic DOM outside canvas, and loading/error/WebGL/reduced-motion ordinary-flow fallback. Exclude wheel/touch cancellation, body lock, timed freezes, scroll writes in handlers, and an internal preview viewport as the production pattern. Include lifecycle/disposal, resize, offscreen rendering, and measured performance acceptance.

Specify original **live** Aki robot assets, geometry, proportions, materials, colors, animation, launcher appearance, placement, and behavior as preserved. Separately specify the decorative faithful Work assembly with approved public asset/license provenance and no live state or fake assistant. Restrict live-assistant changes to chat-panel presentation CSS, responsive geometry, internal overflow, existing theme binding, and minimal presentational markup with copy/semantics/IDs/refs/events intact. Require streaming, knowledge/FAQ/greetings, voice-to-editable-transcript review before explicit send, retry/cancel, consent/privacy/region/session/storage/provider/quota contracts, keyboard/focus/mobile flows, and theme changes without conversation/state/scroll reset. Do not modify protected functional/backend paths or add a canned Aki demo. Refer to [policy authority](../../../shared/model-routing.md#architecture-security-and-final-authority).

Make the responsive matrix explicit: 320, 360, 390, 768, 820, 1024, 1440 px in both themes, plus orientation, viewport height, zoom, keyboard, touch, and reduced motion. Require no horizontal scroll, clipping, or collision among navigation, Work, theme control, robot, and chat composer/close controls.

## Content and evidence contract

List proposed copy/claims with their proof register citation and affected surfaces. Identify any unresolved claim as blocked; do not invent outcomes or expand INNERCIRCLE disclosure.

## Architecture and interface contracts

State boundaries, data/UI contracts, compatibility, and architecture authority. The confirmed Hero and overall Work Three.js requirements justify a scoped shared addition if absent; preserve Aki dependency versions and behavior. Define changed-file allowlists, protected functional/backend paths, shared CSS/provider/data side-effect checks, and one owner per shared file. Keep demo-only CSP separate from live Aki. Record future app branch creation from the fetched exact latest `origin/docs/icm-portfolio-workspace` SHA on a new unique feature branch, with a draft PR targeting that docs branch; [branch workflow](../../../shared/run-contract.md#branch-workflow) governs. Do not treat this docs-only revision as an app run.

## Demo contract, when selected

Record eligible concept aliases, opaque public evidence IDs, fictional flow and visible labels, synthetic fixture schema, local in-memory adapter, Reset/error states, and prohibited permission behavior. Exclude a mock Aki widget. Identify public source and actual build/export allowlists, target revision, direct and embedded modes, demo-only network/CSP policy, navigation/storage/message rules, keyboard/mobile/reduced-motion acceptance, and evidence for each attempted request. Keep private provenance outside this artifact and preserve live Aki. Apply the [demo boundary](../../../shared/demo-boundary.md#runtime-isolation) and [release checklist](../../../references/demo-release-checklist.md#browser-and-interaction-review); leave unresolved mandatory gates blocked.

## Task plan

| Task ID | Description | Priority | Risk | Model / effort | Dependencies | Owned files | Deliverable | Acceptance | Verification | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Record actual substitutions per task: assigned model, unavailable model if any, substitute, reason, verified effort, and authority retained. Use [routing and substitution policy](../../../shared/model-routing.md#model-availability-and-substitution); do not claim unavailable verification.

## Build checkpoint and audit

Record steering, authorized decisions, blockers, and the audit checks from the executing stage. Identify which tasks are ready for Stage 03 and which remain blocked.
