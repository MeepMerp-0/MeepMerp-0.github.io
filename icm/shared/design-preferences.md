# Portfolio design preferences

## Confirmed direction

The user selected **option D: Premium Cinematic**. Use strong editorial typography, deliberate spacing, sculptural geometry, restrained material effects, and purposeful motion. Dark mode uses warm charcoal, ivory, and champagne/gold; light mode uses warm ivory/stone, dark ink, and contrasted bronze/gold. Design both intentionally; do not invert the page to obtain light mode. These are requirements for the rework, not claims that the current site implements them.

Use HTML/CSS/JavaScript or another suitable inspectable interface for design examples and comparisons. Do not generate images as examples.

Use approved public or independently authored assets. Private screenshots and unreviewed assets are excluded. Fictional demonstrations follow the [catalog](demo-catalog.md#presentation) and its disclosure boundary; visual polish does not establish production behavior.

## Page and project order

The confirmed page is **Hero → Work → About → Process → Contact**; primary navigation is **Work, About, Process, Contact**. Preserve useful IDs/deep links and account for sticky headers. The hero states the verified role and value proposition with a clear Work action and contact path. About is concise and evidence-based. Process uses **Understand → Shape → Build → Verify**, with selectable details and no second lengthy pin. Contact prioritizes full-time opportunities, with freelance and partnership paths; preserve its existing backend contract and truthful validation/pending/success/failure states. Do not send real messages during verification.

The confirmed Work sequence is **Aki → INNERCIRCLE → Timekeeping, Payroll & Attendance → FuturoHub**. Each scene retains readable semantic project text and actions outside the canvas. INNERCIRCLE stays within its existing public high-level summary. Exact sculpture, copy, and timing remain specification decisions within these confirmed requirements.

## Three.js Hero

> Run `portfolio-2026-q4-hero-depth` (owner brief, November 2026) replaces the Hero with a bounded sticky sequence of about 230svh: Inputs, Intelligence and Application, driven only by native scroll. For that Hero, this supersedes "without a second long pin" below. Everything else in this section still applies. See that run's Stage 01 brief and Stage 02 spec.

The capable-device Hero **must use a lightweight actual Three.js sculpture** to carry the established Premium Cinematic depth, metallic material treatment, and cinematic lighting. Reuse the scoped Three.js integration/version chosen for Work; do not add another rendering stack. The sculpture is separate from Aki: do not reuse, reconstruct, modify, recolor, or move the original robot, model, assets, or launcher. An earlier design example conveys a motif only; it is not evidence of a tested Hero renderer or an exact geometry/camera/timing specification.

Keep the verified title, role, **View Work**, and **Contact** as immediately readable, semantic DOM, usable before and without WebGL. Hero scrolls normally into the pinned Work section, without a second long pin, wheel/touch cancellation, body lock, or a scroll trap. Specify responsive camera framing and text/art separation, including short heights, across the seven widths and both themes. Reduced motion uses a useful static presentation; loading, WebGL failure, and context loss leave the text/actions available. Do not block first content on 3D loading. Suspend rendering offscreen and clean up renderer and scene resources. Exact sculpture, camera, and timing are implementation choices within this contract.

## Aki preservation

**Preserve the robot; restyle only the chat interface.** Keep the original robot assets/model, geometry, proportions, colors, materials, facial features, expressions, animations, interactions, branding, launcher appearance/behavior/placement, and existing responsive/theme behavior. Do not redraw, regenerate, recolor, rebuild, replace, or filter the robot to match a new palette.

Allow scoped chat-panel surfaces, typography, spacing, borders, shadows, header/status presentation, message bubbles, composer/buttons, existing visual states, focus indicators, responsive geometry/internal overflow, and binding to the existing theme state. Minimal presentational markup is allowed while preserving semantics, identifiers, refs, event wiring, safe rendering, and existing copy/labels/disclosures. Do not create a competing theme provider or storage mechanism.

Preserve conversation/streaming/request contracts, state, prompts/knowledge/FAQs/greetings, providers/runtime models/fallbacks/quotas, credentials, authentication, consent/privacy/session/region/storage rules, error/cancellation/retry/recovery, microphone handling, and **editable transcription before explicit send**. Preserve keyboard/focus/screen-reader behavior. Worker, service logic, configuration, backend integrations, and Aki-related dependency versions/behavior are outside this rework. Broad duties in [model routing](model-routing.md#architecture-security-and-final-authority) do not expand this authorized scope; [proof limits](proof-register.md#aki) still apply.

Inspect shared imports/data, inherited styles, variables, root classes, providers, transforms, stacking contexts, clipping, overflow, scroll/pointer handlers, and bundling effects. New portfolio/chat styling must not indirectly change the robot or assistant behavior. Theme changes must not remount Aki, reset its session/conversation, interrupt requests, or shift the page. Solve conflicts in the surrounding redesign; record an unavoidable functional change as a separate task.

No separate canned Aki walkthrough, simulated voice UI, duplicate assistant, or replacement mock is authorized. Existing controlled test mocks are verification facilities, not a replacement product. Establish a robot/behavior baseline, an allowlist of chat presentation changes, and checks in both themes/representative viewports. Intentional chat styling differences are expected; robot changes or functional regressions fail. Do not require all Aki presentation files to be byte-identical or alter existing functional tests merely to accept regressions.

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
