---
run_id: portfolio-2026-q4-cinematic
stage: 02-specification
state: READY
revision: spec r3
scope: "Portfolio application implementation run (not documentation maintenance)"
source_branch: docs/icm-portfolio-workspace
source_commit: "297138f73fabccee5c90df7d153159ffc7a36140 at run creation; reconciled to 6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8, then to 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6, on user request (see Stage 03)"
working_branch: feat/portfolio-cinematic-rework
pr_base: docs/icm-portfolio-workspace
inputs:
  - "icm/stages/01-strategy-content/output/portfolio-2026-q4-cinematic-brief.md (brief r3)"
  - "Source commit 297138f73fabccee5c90df7d153159ffc7a36140 on branch feat/portfolio-cinematic-rework"
  - "icm/shared/*, icm/prompts/rework-portfolio.md and stage templates at 6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8 (rechecked in r2) and 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6 (r3: real Three.js Hero, Contact action label)"
evidence: "Baseline at 297138f: npm test 269/269, eslint clean, build ok, scripts/verify-scroll-preview.mjs passed (43 Aki steps, 25 screenshots); robot canvas reduced-motion frame hash 769e31257e57cc48 at 1440, 768 and 390 px in both themes"
owner: "Opus 5.5 (architecture authority)"
updated: 2026-11-01
open_decisions:
  - "AVAILABILITY wording vs new About copy (see brief)"
  - "SEO metadata alignment (see brief)"
blockers: []
---

# Specification: cinematic rework

## Product outcome and scope

Recruiters and hiring managers understand role, focus, four pieces of evidence, and the contact route within one scroll of the page, in either theme and on any viewport. In scope: page sections, navigation, theme tokens, Work sequence with Three.js, two fictional demos, Aki chat-panel presentation, Contact intent, ICM records, browser checks. Out of scope: Aki functions, Worker, service modules, consent/storage behaviour, the contact backend, deployment.

## Observable behaviour and acceptance

| Area / flow | Visitor-visible behaviour | Responsive / motion | Acceptance evidence |
| --- | --- | --- | --- |
| Header | Wordmark, Work · About · Process · Contact, theme toggle (labelled), Let's talk | ≤ 830 px: menu button; opens with focus on first link, Escape and link click close, focus returns | verify script navigation step at 320–1440 px |
| Anchors | `#home #work #about #process #contact` land below the sticky header | `scroll-padding-top` = header height | verify script section spacing checks |
| Hero | Name, role, location, explicit value proposition, View Work + Contact, all semantic DOM readable before and without WebGL | Lightweight Three.js sculpture beside the copy (below it on narrow screens), loaded after the load event when the browser is idle; turns slightly with scroll while the Hero is visible, renders nothing offscreen; one still frame under reduced motion; CSS version of the sculpture as placeholder and as fallback on WebGL failure or context loss; scrolls normally into Work, no pin | probe: status, chunk start after `loadEventEnd`, draw counts while visible and offscreen, art never over the headline, overflow, at the seven widths plus short heights in both themes; WebGL disabled; context loss |
| Work, pinned mode (≥ 900 × 640, aspect ≥ 6:5, motion allowed, WebGL available) | Stage sticks under header; scrolling advances Aki → INNERCIRCLE → Timekeeping → FuturoHub; stopping holds; scrolling up reverses; after FuturoHub the stage releases into About | Three.js camera/object/light driven by scroll progress; render on demand only; copy crossfades only at chapter boundaries | browser probe: stage `top` constant during track, chapter index follows scroll both directions, canvas pixels change with scroll and hold when idle, About follows |
| Work chapter controls | 4 buttons with `aria-current="step"`; activating scrolls to that chapter; "Skip to About" link | keyboard operable; inactive panels `hidden` (removed from reading and Tab order); a polite live line announces "Project N of 4" | probe: Tab order, Enter on chapter 3 moves active index to 2 |
| Work, strip mode (narrow or short-wide) | Articles flow normally; compact sticky Three.js strip above them follows the article in view | strip `min(26svh, 220px)`, DPR ≤ 1 | probe at 390 × 844 and 768 × 1024 |
| Work, static mode (reduced motion, WebGL unavailable, or viewport height < 500) | All four articles in ordinary flow with static vector emblems; no canvas | no scroll-scrubbed movement | probe with `prefers-reduced-motion: reduce` and 1440 × 450 |
| Work, scene load failure or context loss | Same layout as the current mode; the project's vector emblem replaces the canvas, all copy and controls unchanged | emblem also shows until the first frame renders | probe: forced context loss |
| Demos | "Open fictional demo" opens a native modal dialog with a sandboxed iframe; Close and Escape return focus; "Open standalone" link | full-screen sheet on phones | probes: network attempts, storage, CSP, Reset |
| About | Human introduction, work arrangements, experience timeline, selectable capabilities (tabs) whose content is also understandable without interaction | motion entrances; tab change transition | screenshot, keyboard check |
| Process | Understand · Shape · Build · Verify; selecting a step reveals focus and expected output | not pinned; short transitions | keyboard check |
| Contact | Intent selector (Full-time role default, Freelance project, Partnership, Something else) that fills the editable "What is this about?" field; validation, pending, failure with email fallback, success only after a successful backend response | form usable with keyboard open on mobile | controlled fetch interception: success and failure; no real message sent |
| Themes | Every surface, control, demo, and the chat panel designed for both themes; no flash (`/theme-boot.js`, loaded from 'self' in `<head>`, sets theme before paint); toggle keeps scroll, Work geometry, and Aki state | instant swap (a View Transition cross-fade was tried and removed: Chrome sized its snapshot to include the scrollbar, giving a 6 px horizontal overflow during the fade) | probe: toggle mid-Work keeps scrollY and chapter; Aki messages persist |
| Aki robot | Unchanged artwork, size, placement, animation, launcher behaviour | none | robot canvas hash equals baseline in both themes at 1440/768/390; computed filter/opacity/transform chain unchanged |
| Aki chat | Portfolio-styled panel in both themes; all existing controls reachable; messages wrap; log scrolls; composer stays in reach | existing breakpoints and constants kept | verify script Aki suite (43 steps) passes unchanged |

## Content and evidence contract

New presentation copy lives in `src/data/workScenes.js` and `src/data/siteCopy.js`. It references `PROJECTS`, `PERSONAL`, `EXPERIENCE`, and `AVAILABILITY` without editing them, so Aki's knowledge, FAQ, and Worker prompt are unchanged. All project claims paraphrase the existing public records (brief, "Claims and evidence limits").

## Architecture and interface contracts

- **Three.js (approved, `three@0.186.1`, exact):** dynamic import from `src/components/work/workScene.js`, created only when the Work track is within one viewport, the mode is pinned or strip, and a WebGL context is created. Interface: `createWorkScene(canvas, { theme, compact, onLost }) → { setScene(s), setTheme(t), resize(), renderNow(), dispose() }`, where `s` is the continuous chapter coordinate 0–3. Pinned track height = stage + 4 × 100svh. No textures or model files; geometry, `MeshPhysicalMaterial`/`MeshStandardMaterial`, lights, and a procedural `RoomEnvironment` reflection map. Pixel ratio ≤ 1.5 (≤ 1 compact). Context loss switches to the static fallback.
- **Shared studio and Hero scene:** `src/components/three/studio.js` holds the renderer, lights, material set, theme palette, pixel budget and context-loss handling for both scenes, so Vite emits one shared lazy Three.js chunk. `src/components/hero/heroScene.js`: `createHeroScene(canvas, { theme, onLost }) → { setProgress(p), setTheme(t), resize(), renderNow(), dispose() }`, where `p` is 0–1 Hero scroll progress. Rendering is on demand only; an `IntersectionObserver` stops scroll-driven renders offscreen; resources are disposed on unmount or when reduced motion changes.
- **Scroll progress:** `useWorkProgress` hook, passive scroll listener with `requestAnimationFrame`, plus resize and `ResizeObserver`; reads geometry only, never writes scroll position, never cancels events.
- **Theme:** existing `useTheme` remains the single source; `public/theme-boot.js`, a blocking same-origin script in `<head>`, sets `data-theme` before paint from the same `theme-choice` key or the system preference. The existing CSP already allows 'self', so it is unchanged.
- **Demos:** static files under `public/demos/<name>/`, own meta CSP (`default-src 'none'`, `connect-src 'none'`, `form-action 'none'`, `object/frame/worker-src 'none'`, `script-src 'self'`, `style-src 'self'`), embedded with `sandbox="allow-scripts"` only. Parent page CSP is unchanged, so Aki's approved connections keep working.
- **Aki:** CSS edits under `.aki-panel` and its descendants only, plus no JS changes. `PANEL_RADIUS_PX` stays 18 so CSS and `Panel.jsx` remain in step. `.aki`, `.aki-launcher`, `.aki-bubble` rules are untouched; because the bubble reads page tokens that the rework redefines, its original token values are pinned on `.aki-bubble` so it renders as before.

## Task plan

| Task ID | Description | Priority | Risk | Model / effort | Dependencies | Owned files | Acceptance | Verification | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T0 | Baseline: tests, lint, build, browser smoke, robot hash | P0 | low | Opus 5.5 / host default (see substitution) | none | none | Baseline recorded | logs in private scratch | done |
| T1 | ICM policy and stage records | P0 | low | Opus 5.5 | T0 | `icm/**` | Stage 01–05 records. This run's earlier edits to shared ICM policy were dropped in favour of the owner's 6a2c204 synchronization, which covers them | link review | done |
| T2 | Theme tokens, global styles, header, hero, About, Process, Contact | P0 | medium | Opus 5.5 (single writer of shared CSS) | T1 | `src/styles/global.css`, `src/sections/*`, `src/components/{Header,Footer,SectionIntro,Reveal}.jsx`, `src/hooks/useTheme.js`, `index.html`, `src/data/siteCopy.js` | Behaviour table rows above | verify script + screenshots | done |
| T3 | Work sequence and Three.js scene | P0 | high | Opus 5.5 | T2 tokens | `src/sections/Work.jsx`, `src/components/work/**`, `src/hooks/useWorkProgress.js`, `src/data/workScenes.js`, `package*.json` | Pinned/strip/static rows | probe script | done |
| T4 | Timekeeping fictional demo | P1 | medium | Sonnet 5.5 / high | T1 | `public/demos/timekeeping/**` | Demo rules | network/storage/CSP probe | done |
| T5 | Fictional website demo | P1 | medium | Sonnet 5.5 / high | T1 | `public/demos/website/**` | Demo rules | same | done |
| T6 | Aki chat panel restyle | P0 | high | Opus 5.5 | T2 tokens | Aki block of `src/styles/global.css` | Allowlist only; Aki suite passes; robot hash unchanged | verify script, robot probe | done |
| T7 | Contact intent | P1 | medium | Opus 5.5 | T2 | `src/components/contact/*` | Backend payload unchanged in shape | unit test + intercepted submit | done |
| T8 | Verification and review | P0 | high | Opus 5.5 | all | stage 04/05 records (the existing verify script is run unchanged) | Stage 04/05 | commands recorded | done |
| T9 | Lightweight Three.js Hero (98a55dc requirement) | P0 | medium | Opus 5.5 | T3 | `src/sections/Hero.jsx`, `src/components/hero/*`, `src/components/three/*`, `src/components/work/workScene.js`, Hero block of `src/styles/global.css`, `src/App.jsx` | Hero row above | hero probe, context-loss probe | done |
| T10 | Integrated review findings | P0 | medium | Opus 5.5 | T8 | files named in Stage 05 | Stage 05 findings closed | targeted probes, full rerun | done |
| A1 | Adviser consult on Work stage | P1 | low | Fable 5.1 / high | none | none | Written opinion considered | recorded in Stage 03 | done |

**Substitutions and limits.** Codex models are not available in this host. The architecture session runs on Opus 5.5 (`claude-opus-5-5`); the host does not expose its reasoning-effort setting to the session, so "high" cannot be verified for it. Subagents were launched with `effort: high`. Haiku 5.5 Fast was not used. Opus 5.5 kept the shared-file and Aki-adjacent work (T2, T3, T6, T7) to keep one writer for `global.css` and the Aki boundary; Sonnet 5.5 took the independent demo modules.

## Build checkpoint and audit

- Each task has acceptance, owned files, dependencies, verification: **pass**.
- Aki discovery, review-before-send, safeguards, accessibility explicit: **pass**.
- New dependency (`three`) justified by explicit user requirement and recorded: **pass**.
- Claims evidence-bound, brief current: **pass**.
- Demo isolation, entry modes, and browser acceptance testable: **pass**.
