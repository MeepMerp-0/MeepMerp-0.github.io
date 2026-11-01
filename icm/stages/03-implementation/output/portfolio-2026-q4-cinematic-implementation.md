---
run_id: portfolio-2026-q4-cinematic
stage: 03-implementation
state: READY
revision: "implementation r4; application code at f145246db979f9bc89ae1866fc65609d04f8f640"
scope: "Portfolio application implementation run (not documentation maintenance)"
source_branch: docs/icm-portfolio-workspace
source_commit: "297138f73fabccee5c90df7d153159ffc7a36140 at run creation; reconciled to 6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8, then to 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6, on user request"
working_branch: feat/portfolio-cinematic-rework
pr_base: docs/icm-portfolio-workspace
inputs:
  - "icm/stages/02-specification/output/portfolio-2026-q4-cinematic-spec.md (spec r3)"
  - "icm/shared/*, icm/prompts/rework-portfolio.md, stage contracts at 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6"
evidence: "Developer checks below; integrated results in Stage 04"
owner: "Opus 5.5 (architecture authority)"
updated: 2026-11-01
open_decisions:
  - "AVAILABILITY wording vs About copy (brief)"
  - "SEO metadata alignment (brief)"
blockers: []
---

# Implementation record: cinematic rework

## Branch, base, and reconciliation

- `feat/portfolio-cinematic-rework` was created once, from `origin/docs/icm-portfolio-workspace` at `297138f73fabccee5c90df7d153159ffc7a36140`, the exact commit fetched at run creation.
- During implementation the owner advanced the docs branch to `6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8` ("synchronize cinematic portfolio requirements and master prompt") and asked for this run to pull it. The feature branch had no commits yet, so the update was a fast-forward of the branch pointer; no committed work was rebased or rewritten.
- That commit edited six shared ICM files this run had also edited locally (`implement-demos.md`, `demo-boundary.md`, `demo-catalog.md`, `design-preferences.md`, `proof-register.md`, `run-contract.md`). The owner's versions cover the same decisions (protected robot with scoped chat styling, no canned Aki demo, optional or omitted INNERCIRCLE concept, Three.js authorization, branch workflow), so this run's local edits to those files were discarded and the owner's text kept.
- Later the owner advanced the docs branch again, to `98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6` ("require the cinematic Three.js hero"), and asked for this run to pull it and realign. The three feature commits (demos, rework, contact intent) had not been pushed, so they were rebased onto that commit at the owner's request. It is documentation only, and the rebase had no conflicts.
- The new commit turns the CSS-only Hero of brief r2 into a requirement for a lightweight real Three.js Hero, separate from Aki's robot, with the actions View Work and Contact. Brief r3, spec r3 and task T9 follow it.
- Stale-input check: brief and spec were rechecked against 6a2c204. No brief claim changed. The spec gained the required lineage fields and was corrected where it described an earlier plan (theme boot script, strip height, WebGL fallback, removed View Transition). The new contract also makes the 320/360/390/768/820/1024/1440 matrix and per-request demo evidence explicit; Stage 04 covers them.

## Authorized scope and task results

| Task ID | Owned files changed | Implemented behavior | Status | Deviation or blocker |
| --- | --- | --- | --- | --- |
| T0 | none (private scratch only) | Baseline at 297138f: tests, lint, build, Aki smoke suite, robot pixel hash, hashes of 64 Aki/Worker/data files | done | none |
| T1 | `icm/stages/0[1-5]-*/output/portfolio-2026-q4-cinematic-*.md` | Five stage records, one run ID | done | shared ICM edits dropped in favour of 6a2c204 |
| T2 | `src/styles/global.css`, `src/sections/{Hero,About,Process,Contact}.jsx`, `src/components/Header.jsx`, `src/hooks/useMobileMenu.js`, `src/data/siteCopy.js`, `index.html`, `public/theme-boot.js`, `src/App.jsx` | Token-based light and dark themes; header measures its height into `--header-h`; theme set before first paint; hero, About capability tabs, Process steps, Contact layout | done | a theme cross-fade was built and then removed (see Stage 04, failure F1) |
| T3 | `src/sections/Work.jsx`, `src/components/work/*`, `src/hooks/useWorkProgress.js`, `src/data/workScenes.js`, `package.json`, `package-lock.json` | Pinned, strip and static Work modes; Three.js scene with four sculptures; chapter controls, skip link, live announcement, emblem fallback | done | none |
| T4 | `public/demos/timekeeping/*` | Fictional timekeeping and illustrative payroll demo | done | none |
| T5 | `public/demos/website/*` | Fictional client website demo | done | none |
| T6 | Aki chat block of `src/styles/global.css` | Chat panel presentation in both themes | done | none |
| T7 | `src/components/contact/*` | Intent selector that fills the editable purpose field; failure message with retry and email | done | none |
| T8 | stage 04 and 05 records | Verification and review | see Stage 04/05 | none |
| T9 | `src/components/three/studio.js` (new), `src/components/hero/heroScene.js` (new), `src/sections/Hero.jsx`, `src/components/work/workScene.js`, `src/App.jsx`, Hero block of `src/styles/global.css` | Lightweight Three.js Hero sharing one studio module with Work; Work scene refactored onto the studio without visual change | done | none |
| T10 | `src/hooks/useWorkProgress.js`, `src/sections/{Work,Hero,Contact}.jsx`, `src/components/work/{ProjectPanel,DemoDialog}.jsx`, `src/data/{workScenes,siteCopy}.js`, `public/demos/website/website.js`, `src/styles/global.css` | Fixes for the integrated review findings listed in Stage 05 | done | none |
| A1 | none | Adviser opinion on the Work stage, adopted: hidden inactive panels plus a live line, per-panel overflow, 100svh per chapter, measured header, progress kept outside React, pixel budget, emblem until first frame, short-height static mode | done | none |

Deleted as superseded by the new sections: `src/components/PortfolioWorkflow.{jsx,css}`, `src/components/NoteEntries.jsx`, `src/data/workflowStages.js`, `src/sections/ProjectRow.jsx`.

## Visitor and Aki behavior

- **Journey.** Hero, Work, About, Process, Contact. Primary navigation reads Work, About, Process, Contact. The hero states the role, location and full-time intent, with View Work and Contact actions.
- **Hero sculpture.** A brushed-gold slab beside a glass pane, held by two rings, with a small orb on a stone plinth. It is authored in code, with no model files, and shares the studio's lights, materials and palette with Work.
  - It loads by dynamic import after the `load` event, once the browser is idle, so it never delays the copy or actions.
  - It renders once, then only when scroll progress, theme or size changes while the Hero is visible. With reduced motion it draws one still frame and does not listen to scroll; the setting is followed live.
  - The CSS sculpture is the placeholder until the first frame and stays as the fallback when WebGL is missing or the context is lost.
  - The camera steps back on portrait canvases so the rings stay in frame.
- **Work, pinned mode** (at least 900 × 640 with an aspect ratio of at least 6:5, motion allowed, WebGL available). The stage sticks under the header for a track of stage height plus 4 × 100svh. A passive scroll listener, coalesced to one `requestAnimationFrame`, reads the track position and derives a continuous chapter coordinate. Only the integer chapter is React state; the coordinate goes to the scene through a small store. The handler never writes the scroll position and never cancels events. The scene renders only when the coordinate, size or theme changes, so it is still when scrolling stops. Scrolling up reverses the same mapping. After FuturoHub the track ends and the stage scrolls away with About directly below.
- **Scene.** `three@0.186.1`, pinned exactly and loaded by dynamic import when Work comes within one viewport. Renderer, lights, materials and palette come from the shared studio. It uses real geometry, `MeshStandardMaterial`/`MeshPhysicalMaterial`, key, rim and ambient lights, a procedural `RoomEnvironment` reflection map, and a perspective camera with a view offset so the sculpture sits beside the copy. The four sculptures are:
  - Aki: a faceted core in a glass shell with orbiting rings.
  - INNERCIRCLE: an abstract colonnade around a ring, so no interface is depicted.
  - Timekeeping: a dial whose hands follow scroll, beside a ledger stack.
  - FuturoHub: a grid of blocks.

  Hand-over is a vertical exchange with a slight camera dip and a cross-fade of the key-light colour. The pixel ratio is capped at 1.5 (1 when compact) and by a pixel budget. Resources are disposed on unmount. On context loss the emblem is shown.
- **Strip mode** (narrow, portrait, or wide but short). The articles flow normally, under a sticky canvas band of `min(26svh, 220px)` that follows the article in view.
- **Static mode** (reduced motion, WebGL unavailable, or height below 500px). Articles appear in ordinary flow with authored SVG emblems and no canvas.
- **Chapter controls.** Four buttons with `aria-current="step"`. Activating one smooth-scrolls to that chapter's position. "Skip to About" links to `#about`. A chapter jump announces and highlights only its destination. Inactive panels are `hidden`. A polite live line announces "Project N of 4: title".
- **Demos.** "Open fictional demo" opens a native modal `<dialog>` with an `<iframe sandbox="allow-scripts" referrerpolicy="no-referrer">`, created only while the dialog is open. The header shows Fictional, Local only and No real action labels, plus a Standalone link and Close.
- **Contact.** Four intents, with Full-time role as the default. An intent fills the purpose field only while that field is empty or still holds another intent's label, so typed text is kept. The backend call, its payload fields and the success test are unchanged. "Message sent." appears only when the backend reports success.
- **Theme.** The existing `useTheme` hook and its `theme-choice` key are still the only theme state. `public/theme-boot.js` applies the saved or system theme before first paint. Changing the theme restyles the live Three.js scene without rebuilding it.

**Aki robot and launcher.** No Aki JavaScript, service, Worker, data or dependency file changed: 62 of 64 baseline hashes match, and the two differences are `package.json` and `package-lock.json`, which only add `three`. In `global.css` the original `.aki`, `.aki-launcher`, `.aki-bubble*` and `aki-bubble-in` rules are byte-identical. One rule was added after them that pins the bubble's original token values (see below). The robot's reduced-motion canvas hash and launcher rectangle match the baseline at 1440, 768 and 390px in both themes (Stage 04).

**Chat presentation allowlist (CSS only, scoped to `.aki-panel` and descendants).**
- Panel surface with blur, border, shadow and radius 18. `PANEL_RADIUS_PX` stays 18, matching `Panel.jsx`.
- Header height and gold hairline; status-line colour.
- Bubble radii and colours from panel-scoped tokens.
- Composer border and focus ring.
- Chip and control colours, keeping their 32/40px sizes.
- The panel's close button (`.aki .icon-button`): 34px instead of 32px, radius 10px instead of 8px, border from the chat line token. The shared `.icon-button` hover also gains a stronger border.
- The mobile block keeps the existing `.aki` and launcher geometry.

Inherited effects: the greeting bubble's rules read page tokens that the rework redefined, so its original values for `--bg`, `--text`, `--font-body` and `--font-mono` are pinned on `.aki-bubble` in both themes. Its computed styles match a baseline build of `98a55dc` (Stage 04). The focus ring uses the new signal colour. No markup was added.

## Scene realignment (T11, owner request)

The owner asked for the 3D to follow the Hero wording and to show each project. Commit `072511e`:

| Area | Change |
| --- | --- |
| Hero | Sculpture rebuilt to match "AI systems and full-stack apps, built for real work": an interface pane, a logic slab and two data discs, with an AI orb linked into the stack, on a plinth. Scroll parts the layers and circles the orb. Loading, fallback and render-on-demand rules unchanged. |
| Aki | A 3D likeness of the robot's TV head (shell, screen, block eyes, ears, antenna) in the launcher's shell, trim and LED colours, assembled from pieces that fall into place as the chapter opens. The owner asked for this likeness. The launcher robot is a separate 2D canvas from `robot-heads` and is not imported, changed, recoloured or moved. |
| INNERCIRCLE | An AI core hands task cards to four agents inside an arc of floating dashboard panels, after the owner's reference image. Abstract: no product screens or data. |
| Timekeeping | A guard walks into the phone's proximity ring, taps the phone, a face scan verifies them, and the entry travels to a web dashboard row. Generic figure, no real person or screen. |
| FuturoHub | A workflow graph: a website form and a chat start it, an assistant node routes the request, three actions fire and the owner is told. Pulses run along the links in order. |
| Scroll coordinate | Runs from -0.5 to count - 0.5 so Aki can assemble before its midpoint and FuturoHub can finish after it. Camera, hand-overs and chapter state still use the 0 to count - 1 range. |
| Emblems | Static fallbacks redrawn to match each new sculpture. |
| Copy | Timekeeping approach names the proximity check, face verification on the phone and automatic logging (owner's description; consistent with `PROJECTS` highlights). FuturoHub title, role, context and approach add workflow automation on the owner's instruction. `portfolioData.js` unchanged, so Aki's answers are unchanged. |

Build: studio chunk 568.7 kB (142.5 kB gzip), workScene 8.8 kB, heroScene 1.8 kB.

Follow-up `f145246` (owner request):

- **Narrow stages.** On phones and the strip band, the camera moves in until the current sculpture just fits. Each sculpture declares its width and height, and the camera blends between them during a hand-over. Wide pinned stages keep their framing.
- **Timekeeping demo.** The check-in card now follows the scene's flow:
  1. Walk into range of the post.
  2. Tap to clock in.
  3. A simulated face check runs; it is immediate under reduced motion.
  4. The entry is logged and Friday is marked on the dashboard grid automatically, so the totals update.

  Clock-out repeats the check. The staff are invented guards, and the posts are fictional. No location, camera or device data is read, and the CSP is unchanged.

## Checkpoint and developer evidence

- Unit tests: `npm test`, 270/270 (baseline 269, plus one `purposeForIntent` test).
- Lint: `eslint .` reports no problems.
- Build: `npm run build`. Main JS 454 kB (151 kB gzip). CSS 41 kB (9 kB gzip). Lazy chunks: shared Three.js studio 548 kB (137 kB gzip; Vite's 500 kB warning applies to this lazy chunk only), `workScene` 4 kB, `heroScene` 1.4 kB. No source maps.
- Dependency: `three@0.186.1` (MIT), exact pin. The lockfile diff adds only that package. Aki-related versions (`robot-heads 0.3.0`, `motion`, React) are unchanged.

## Demo public-boundary handoff

- **Authoring.** Both demos were written from the public spec alone, by Sonnet 5.5 subagents in isolated worktrees, with invented people, businesses and rates. No private source was inspected for this run, so there are no private evidence IDs.
- **Public allowlist.** `public/demos/timekeeping/{index.html,timekeeping.css,timekeeping.js}` and `public/demos/website/{index.html,website.css,website.js}`. The build copies them unchanged to `dist/demos/`.
- **Policy.** Each page sets a meta CSP: `default-src 'none'`, scripts and styles from `'self'`, `img-src data:`, and `connect-src`, `form-action`, `frame-src`, `worker-src`, `object-src` and `font-src` all `'none'`.
- **Static review.**
  - No `fetch`, XHR, WebSocket, storage, cookie, service worker, permission, `postMessage`, `window.open` or `location` writes appear in demo code.
  - The timekeeping demo has no form element.
  - The website demo's send button is `type="button"`.
- Runtime request-attempt evidence is in Stage 04.

## Audit and validation handoff

- Every changed file maps to a task above, with Opus 5.5 as the single writer of shared files: **pass**.
- Claims stay within the public records, and Aki's runtime files are unchanged: **pass**.
- Revision, diff and developer checks are recorded: **pass**.
- No merge, deploy or production action occurred: **pass**.
- For Stage 04: the full viewport and theme matrix, scroll behaviour, WebGL fallback, demo request attempts, contact states with a controlled backend, and the Aki smoke suite.
