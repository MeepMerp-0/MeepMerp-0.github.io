# Portfolio design preferences

## Confirmed direction

The user selected **option D: Premium Cinematic**. Use strong editorial typography, deliberate spacing, sculptural geometry, restrained material effects, and purposeful motion. Dark mode uses warm charcoal, ivory, and champagne/gold; light mode uses warm ivory/stone, dark ink, and contrasted bronze/gold. Design both intentionally; do not invert the page to obtain light mode. These are requirements for the rework, not claims that the current site implements them.

Use HTML/CSS/JavaScript or another suitable inspectable interface for design examples and comparisons. Do not generate images as examples.

Use approved public or independently authored assets. Private screenshots and unreviewed assets are excluded. Fictional demonstrations follow the [catalog](demo-catalog.md#presentation) and its disclosure boundary; visual polish does not establish production behavior.

## Page and project order

The confirmed page is **Hero → Work → About → Process → Contact**; primary navigation is **Work, About, Process, Contact**. Preserve useful IDs/deep links and account for sticky headers. The hero states the verified role and value proposition with a clear Work action and contact path. About is concise and evidence-based. Process uses **Understand → Shape → Build → Verify**, with selectable details and no second lengthy pin. Contact prioritizes full-time opportunities, with freelance and partnership paths; preserve its existing backend contract and truthful validation/pending/success/failure states. Do not send real messages during verification.

The confirmed Work sequence is **Aki → INNERCIRCLE → Timekeeping, Payroll & Attendance → FuturoHub**. Each scene retains readable semantic project text and actions outside the canvas. The scene directions below are visual contracts, not claims that private products have those interfaces or behaviors. Exact geometry, camera, and timing remain specification decisions.

## Work scene directions

| Chapter | Confirmed visual direction | Claim boundary |
| --- | --- | --- |
| Aki | Separated shapes fall and assemble into a recognizable, faithful likeness of the original Aki robot. Assembly follows native scroll, settles when scrolling stops, and reverses on upward scroll. | Identify this as a decorative view of the real public project, not fictional assistant data. The live launcher, robot assets, animations, state, and chat functionality/copy remain unchanged; scoped chat-panel styling remains allowed. No second assistant or simulated conversation. Inspect the approved public robot rendering, asset and license/dependency provenance before choosing a reveal technique. Do not assume a GLB exists. |
| INNERCIRCLE | A central AI coordinator with floating fictional task/dashboard panes and visible handoffs to specialist agent nodes, in the premium cinematic palette. The whole chapter may be 2D, 3D, or hybrid while the overall capable-device Work showcase retains actual Three.js. | Independent concept inside the existing high-level public summary; no private UI, task topology, permissions, architecture, or production workflow claim. |
| Timekeeping, Payroll & Attendance | A fictional guard approaches an illustrative proximity area, taps a phone, passes a stylized image/biometric-check step, and a synthetic attendance row appears in a local web dashboard. | Visual simulation only: no real proximity/GPS, camera/face capture, biometric analysis, authentication, device permission, network, storage, payroll action, or compliance claim. Use fresh abstract people/records, visible simulated labels and Reset. |
| FuturoHub | A fictional web experience triggers an automation diagram: connected nodes/paths progress to subsequent local actions. | Reflect the verified public **websites and automations** offering without claiming Jason built every advertised flow. Invent the trigger, process, condition, and action sequence; no live lead, integration, or client data. |

## Three.js Hero

The capable-device Hero **must use a lightweight actual Three.js sculpture** to carry the established Premium Cinematic depth, metallic material treatment, and cinematic lighting. Align its visual meaning with the final approved headline/subtitle, using the current [public headline](../../src/data/portfolioData.js) as the evidence baseline: inputs, connections, or orchestration resolving into a coherent business application are suitable motifs. Do not freeze existing copy as the only possible wording or assert unverified skills. Reuse the scoped Three.js integration/version chosen for Work; do not add another rendering stack. The Hero sculpture is separate from Aki: do not reuse, reconstruct, modify, recolor, or move the original robot, model, assets, or launcher. An earlier design example conveys a motif only; it is not evidence of a tested Hero renderer or an exact geometry/camera/timing specification.

Keep the verified title, role, **View Work**, and **Contact** as immediately readable, semantic DOM, usable before and without WebGL. Hero scrolls normally into the pinned Work section, without a second long pin, wheel/touch cancellation, body lock, or a scroll trap. Specify responsive camera framing and text/art separation, including short heights, across the seven widths and both themes. Reduced motion uses a useful static presentation; loading, WebGL failure, and context loss leave the text/actions available. Do not block first content on 3D loading. Suspend rendering offscreen and clean up renderer and scene resources. Exact sculpture, camera, and timing are implementation choices within this contract.

## Aki preservation

**Preserve the live robot; restyle only the chat interface.** Keep the original live robot assets/model, geometry, proportions, colors, materials, facial features, expressions, animations, interactions, branding, launcher appearance/behavior/placement, and existing responsive/theme behavior. Do not redraw, regenerate, recolor, rebuild, replace, or filter that live robot to match a new palette. The isolated decorative Work assembly above is expressly allowed and does not authorize altering the live robot or chat functionality.

Allow scoped chat-panel surfaces, typography, spacing, borders, shadows, header/status presentation, message bubbles, composer/buttons, existing visual states, focus indicators, responsive geometry/internal overflow, and binding to the existing theme state. Minimal presentational markup is allowed while preserving semantics, identifiers, refs, event wiring, safe rendering, and existing copy/labels/disclosures. Do not create a competing theme provider or storage mechanism.

Preserve conversation/streaming/request contracts, state, prompts/knowledge/FAQs/greetings, providers/runtime models/fallbacks/quotas, credentials, authentication, consent/privacy/session/region/storage rules, error/cancellation/retry/recovery, microphone handling, and **editable transcription before explicit send**. Preserve keyboard/focus/screen-reader behavior. Worker, service logic, configuration, backend integrations, and Aki-related dependency versions/behavior are outside this rework. Broad duties in [model routing](model-routing.md#architecture-security-and-final-authority) do not expand this authorized scope; [proof limits](proof-register.md#aki) still apply.

Inspect shared imports/data, inherited styles, variables, root classes, providers, transforms, stacking contexts, clipping, overflow, scroll/pointer handlers, and bundling effects. New portfolio/chat styling must not indirectly change the robot or assistant behavior. Theme changes must not remount Aki, reset its session/conversation, interrupt requests, or shift the page. Solve conflicts in the surrounding redesign; record an unavoidable functional change as a separate task.

No separate canned Aki walkthrough, simulated voice UI, duplicate assistant, or replacement mock is authorized. Existing controlled test mocks are verification facilities, not a replacement product. Establish a live robot/behavior baseline, an allowlist of chat presentation changes, and checks in both themes/representative viewports. Intentional chat styling and the isolated decorative assembly are expected; live robot changes or functional regressions fail. Do not require all Aki presentation files to be byte-identical or alter existing functional tests merely to accept regressions.

## Three.js and motion

The normal capable-device **main Work showcase must use actual Three.js geometry, materials, lights, and camera rendering**. A scoped Three.js addition shared by Hero and Work is authorized for future implementation if absent; record compatible versions and the integration decision, preserving Aki-related versions and behavior. Reuse existing Motion utilities where suitable. Do not silently substitute CSS-only artwork, add competing animation libraries without need, or treat this documentation revision as a dependency installation.

Use native production **page scrolling**: Work arrives normally, pins, advances its objects/camera/project sequence with continued scrolling, pauses at the current progress when scrolling stops, reverses when scrolling upward, then releases into About. Provide keyboard-operable chapters and Skip to About. No wheel/touch cancellation, body lock, timed freeze, scroll trap, or repositioning from the scroll handler. An inline preview's fixed-height internal viewport is not the production page architecture. No perpetual ambient animation is required.

Keep visual enhancements progressive. Specify loading/error and WebGL/context-failure handling, container-based camera resizing, renderer/resource disposal, off-screen suspension, and useful semantic fallbacks. Reduced motion uses ordinary-flow or equivalent static project content without pin/scrub/rotation/parallax/smooth-scroll effects. Preserve all four projects and navigation when rendering is unavailable. Verify actual Three.js behavior; a source example or CSS effect is not evidence of a working browser renderer.

## Responsive and theme acceptance

Check **320, 360, 390, 768, 820, 1024, and 1440px in both light and dark themes**. Include portrait/landscape where relevant, resize/browser-height changes, increased text size/zoom, keyboard/touch, reduced motion, and the on-screen keyboard. Record actual observations and `NOT TESTED` reasons; CSS declarations or a build do not prove this matrix passed.

Adapt typography, navigation, artwork, camera framing, stage height, and pin distance. Avoid horizontal overflow, clipped or overlapping copy, hidden controls, and collisions with Aki. Provide comfortable separated touch targets and hover-independent actions. On constrained devices use a shorter comfortable sequence or an ordinary project layout with the same evidence/actions; do not hide content to fit.

Apply both themes to every redesigned section, navigation/control/overlay, form state, new Three.js composition, included demo, and Aki's chat panel. Use semantic tokens and the established theme state/preference mechanism, respecting system preference until an existing user choice applies. Keep readable text, control/focus boundaries, and state contrast. Theme switching must not reload/reset interactions, lose scroll position, break scene geometry, or change the robot beyond its existing theme behavior. Do not change Aki's storage keys.

The chat panel must fit desktop/tablet/mobile bounds and safe areas, wrap messages/links/formatted content, and keep close/composer/send/voice controls reachable when the keyboard opens. Messages may scroll internally without pushing the composer out of reach. Test the original robot separately from the intentionally restyled chat.

## Proposed defaults

Within the confirmed Hero and Work contracts, exact sculpture choices, camera framing, lighting/composition, transition timing, and capability-selector presentation remain design proposals. They must support the recruiter path, readable content, accessibility, and measured performance. Do not present these choices as new project facts or validated production behavior.

## Decisions for specification

Set exact copy, asset provenance, Hero and Work scene timing/distance, compatible shared Three.js integration/version, responsive compositions, measured performance budgets, failure/reduced-motion states, and observable acceptance evidence. Check the [existing site map](repo-map.md#existing-design-and-constants); no framework/TypeScript/database/test-stack migration or unrelated dependency upgrade is implied. The page order, Work order, real Three.js Hero and Work requirements, Aki scope, two themes, and viewport matrix are confirmed and must not be reopened as unspecified choices.
