---
run_id: portfolio-2026-q4-cinematic
stage: 05-review
state: READY
revision: "review r6; reviewed code 1d801de363a97406ab3ce1fee2808abf98e6d158"
scope: "Portfolio application implementation run (not documentation maintenance)"
source_branch: docs/icm-portfolio-workspace
source_commit: "297138f73fabccee5c90df7d153159ffc7a36140 at run creation; reconciled to 6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8, then to 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6, on user request"
working_branch: feat/portfolio-cinematic-rework
pr_base: docs/icm-portfolio-workspace
inputs:
  - "brief r3, spec r3, implementation r2, verification r2 (this run)"
  - "git diff 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6..d630305a278d763e88db20cf3306eb81f5837468"
  - "Integrated review: ten independent reviewer passes over that diff (functional, accessibility, Aki boundary, content claims, security and disclosure, performance), each finding then checked by a separate skeptic before acceptance"
evidence: "Stage 04 record"
owner: "Opus 5.5 (architecture authority)"
updated: 2026-11-01
open_decisions:
  - "Owner: whether AVAILABILITY (read by Aki) should change to match the About copy"
  - "Owner: whether to align index.html SEO description and JSON-LD with the new hero"
blockers: []
---

# Architecture review: cinematic rework

## Visitor problem, authorized scope, and outcome

Recruiters and hiring managers had to read a long single-column page to find the role, the evidence, and the contact route. The page now answers those three questions in order:

- **Hero.** States the role, the location and the full-time intent, with View Work and Contact. A lightweight Three.js sculpture sits beside the copy on capable devices.
- **Work.** Presents four projects in a scroll-driven Three.js sequence. Every project's copy stays readable as normal DOM outside the canvas.
- **About.** A short story, the arrangements, the experience timeline and selectable capabilities.
- **Process.** Four steps: Understand, Shape, Build, Verify.
- **Contact.** Leads with full-time roles and keeps the existing backend.

Two fictional demos show the timekeeping and website work without touching any service.

- **Exclusions.** Aki's runtime, Worker, services, data and dependencies. The contact backend. SEO metadata. Deployment.
- **Claim sources.** All project and profile text derives from `portfolioData.js` (`PROJECTS`, `EXPERIENCE`, `PERSONAL`), which is unchanged. INNERCIRCLE copy stays within its existing public summary, and its sculpture is an abstract colonnade.

## Realignment with 98a55dc

The owner's docs commit `98a55dc` made a lightweight real Three.js Hero a requirement. The three local feature commits were rebased onto it at the owner's request; they had not been pushed. Task T9 added the Hero. This review confirms it against the new Stage 05 contract:

- **Real Three.js Hero, observed in a browser.** On every tested width and theme the Hero canvas reached `ready` and drew real geometry, metal and glass materials, lights and a perspective camera. Screenshots were reviewed in both themes.
- **Separate from the Work scene.** The Hero has its own scene and canvas. Both use one shared studio module, so there is a single Three.js version and chunk.
- **Readable without WebGL.** With WebGL disabled, and after a forced context loss, the title, role, View Work and Contact remain and the CSS sculpture is shown.
- **Never Aki's robot.** The sculpture is authored from boxes, tori, a sphere and a cylinder. It does not import or reference any Aki file. The robot's canvas hash, launcher rectangle and style chain are unchanged.
- **Fallback and performance limits are recorded** in Stage 04.

## Scene realignment (r3)

At the owner's request, commit `072511e` matches the Hero sculpture to its headline and gives each Work chapter a sculpture of its project (Stage 03 T11). Review points:

- **Aki likeness.** The owner asked for the Work sculpture to look like the robot. It is a separate Three.js model in the robot's colours. The launcher robot is not imported, changed, recoloured or moved; its canvas hash is unchanged. The Hero remains unrelated to the robot, as `98a55dc` requires.
- **Claims.** The Timekeeping wording comes from the owner's description and the existing `PROJECTS` highlights. The FuturoHub workflow-automation wording follows the owner's instruction and supersedes R14's web-only framing. No metrics, clients or outcomes were added.
- **Performance.** Still render on demand; no idle loop. The studio chunk grew by about 21 kB (RoundedBoxGeometry and the new scene code).
- **Follow-up `f145246`.** The camera on narrow stages now fits each sculpture, and the timekeeping demo follows the scene's proximity, tap, face-check and automatic-log flow.
  - The demo stays fictional and local: no device APIs, unchanged CSP, invented guards and posts.
  - Its payroll disclaimers are unchanged.
- **Website workflow (`4a26708`).** The website demo shows a simulated workflow behind its form, matching the FuturoHub chapter.
  - The business is still invented and is labelled as not a FuturoHub site.
  - The demo claims no real integration and sends nothing.
- **Palettes and motion (`1d801de`).**
  - Each sculpture now has its own dark and light palette.
  - Aki's assembly is a one-time timed animation, not scroll-driven. It is the only timed animation in the Work scene, and drawing stops when it ends.
  - The guard scans their face on their own phone.
  - The FuturoHub graph shows channel triggers and an if/else gate. The icons are generic, and the page copy is unchanged, so no new claims were added.
- Verification: Stage 04 "Scene realignment checks".

## Architecture and integrated review

| Boundary / task | Diff or evidence reviewed | Finding and severity | Owner / resolution | Status |
| --- | --- | --- | --- | --- |
| Public claims | `src/data/workScenes.js`, `src/data/siteCopy.js` vs `portfolioData.js` | Three wording findings, fixed (R12–R14 below). No new metrics, employers, dates or outcomes remain. | Opus 5.5 | pass |
| Native-scroll Work and Three.js | `useWorkProgress.js`, `Work.jsx`, `SceneCanvas.jsx`, `workScene.js`, `studio.js`; Stage 04 scroll, idle, resize, WebGL and context-loss rows | Read-only passive listeners, no scroll writes in handlers, render on change only, disposal, context loss handled. Review found a panel scroll trap, pinning on portrait stages and pinning without WebGL; all fixed (R1, R3, R4). | Opus 5.5 | pass |
| Hero Three.js | `Hero.jsx`, `heroScene.js`, `studio.js`; Stage 04 Hero rows | Loads after `load` and idle, draws only while visible, never over the headline, CSS fallback kept. Its reduced-motion setting was read once; now live (R15). | Opus 5.5 | pass |
| Scene cost | Stage 04 performance row | Setup of both scenes is main-thread work, measured only under software WebGL. Real-GPU cost not measured. | Opus 5.5; measure on real hardware later | accepted limit (low) |
| Responsive and accessibility | Stage 04 matrix, chapter, skip, deep link, strip focus, contrast rows | No overflow at any tested size. Findings R2, R6, R8–R11 fixed. | Opus 5.5 | pass |
| Robot, launcher and greeting bubble | Stage 04 robot and bubble rows | Robot and launcher unchanged in 6 cases. The bubble had taken new page tokens; its original values are now pinned and its computed styles match the baseline build (R5). | Opus 5.5 | pass |
| Chat-panel presentation diff | `global.css` Aki block | CSS only. Width 360→372, chat height 520→540, tokens and radii, close button 32→34 px with radius 10. `PANEL_RADIUS_PX` 18 kept. No markup or JS change. | — | pass |
| Protected Aki functions | 62/64 hashes identical; existing smoke suite (43 Aki steps) | No functional file changed; the suite passes unchanged | — | pass |
| Contact | `src/components/contact/*`, `Contact.jsx`; Stage 04 contact row | Same backend call and success rule. Truthful pending, error and success states. One request per submit. WhatsApp link name fixed (R10). | — | pass |
| Theme | `useTheme.js`, `public/theme-boot.js`; Stage 04 theme rows | Single theme state and same storage key. No remount on toggle. Embedded demos follow the saved theme. CSP unchanged. | — | pass |
| Dependencies | `package.json`, lockfile | Adds only `three@0.186.1` (MIT, exact), shared by Hero and Work. Aki-related versions unchanged. | — | pass |
| Demos | `public/demos/**`; Stage 04 demo rows | Independent fictional content. Default-deny CSP, minimal sandbox. No request attempts beyond own files. Reset works. Labels visible. Menu focus fixed (R11). Escape from inside the frame does not close the dialog. | Accept; Close button and Shift+Tab available | pass (low limitation) |
| Disclosure | Changeset and `dist/` scan, hand-reviewed | No private paths, hosts, keys or internal material in tracked files or build output | — | pass |
| Pre-existing (not regressions) | — | Built CSP embeds the Aki origin from the local `.env` (normal build behaviour). AVAILABILITY wording differs from the new About copy; left unchanged because Aki reads it. | Owner decisions listed above | recorded |

### Integrated review findings

Each finding below was confirmed by a separate skeptic pass before it was accepted. All were fixed in `636d708`, `06d2e1d` or `d630305` and retested (Stage 04).

| ID | Severity | Finding | Fix |
| --- | --- | --- | --- |
| R1 | medium | `overscroll-behavior: contain` on the pinned project panel stopped page scrolling at the panel's end | Removed |
| R2 | medium | In strip mode, keyboard focus could land under the sticky scene band | Scroll margin on focusable article items |
| R3 | medium | Pinned mode on tall, narrow stages put the sculpture behind the copy | Pinned also needs an aspect ratio of at least 6:5 |
| R4 | medium | With WebGL unavailable, Work stayed pinned with only an emblem | No WebGL selects static mode |
| R5 | low | The greeting bubble took the rework's page tokens | Original token values pinned on the bubble |
| R6 | low | "Ask Aki now" did nothing visible when the panel was already open | It focuses the open panel |
| R7 | low | Work's reduced-motion setting was read once | Live media query |
| R8 | low | A chapter jump announced every chapter it passed | Only the destination is announced and highlighted |
| R9 | low | The Standalone link's accessible name did not start with its visible label | Name starts with "Standalone" |
| R10 | low | Same for the WhatsApp link | Name starts with "Message on WhatsApp" |
| R11 | low | Choosing a link in the website demo's menu pulled focus back to the Menu button | Focus stays on the target |
| R12 | copy | Aki's result implied a live assistant even in builds without Aki | Separate wording when Aki is not connected |
| R13 | copy | About evidence named items that did not match the experience entries | Stack and evidence lists aligned with the records |
| R14 | copy | FuturoHub context characterised the company | Describes the freelance web work only |
| R15 | low | Hero's reduced-motion setting was read once (found while verifying R7) | Same live media query as Work |

Rejected by the skeptic pass, with reasons kept in the operator's notes: a suspected InstancedMesh leak, the launcher focus ring, `aria-pressed` versus tabs on About, tab-panel semantics, 42 px header buttons, and footer link targets.

## Acceptance and verification limits

| Acceptance criterion | Verification result and revision | Remaining failure or `NOT TESTED` reason | Readiness effect |
| --- | --- | --- | --- |
| Hero → Work → About → Process → Contact; nav Work/About/Process/Contact | pass, d630305 | — | none |
| Lightweight real Three.js Hero, readable before and without WebGL, ordinary scroll into Work | pass, d630305 (software WebGL) | Real GPUs not tested | review on real hardware before release |
| Work native-scroll pin/scrub/idle/reverse/release, keyboard chapters, skip | pass, 06d2e1d (Work code unchanged in d630305) | — | none |
| Real Three.js Work scene on capable devices; fallbacks | pass, 06d2e1d and d630305 (software WebGL) | Real GPUs not tested | review on real hardware before release |
| 320–1440 px × both themes; zoom; reduced motion | pass, d630305 | OS text scaling, real touch and devices NOT TESTED | none for draft PR |
| Robot and greeting bubble unchanged; chat restyled; Aki flows intact | pass, d630305 | Live providers and real voice NOT TESTED (not allowed) | none |
| Contact truthful states, no real sends | pass, 06d2e1d | — | none |
| Demo isolation, direct and embedded | pass, 06d2e1d | — | demos ready for review |
| Measured performance | measured, 06d2e1d | Lighthouse not run; no score claimed | none |

See the [Stage 04 record](../../04-verification/output/portfolio-2026-q4-cinematic-verification.md).

## PR and release handoff

**PR.** A draft PR from `feat/portfolio-cinematic-rework` into `docs/icm-portfolio-workspace`, following the repository template:

- **Visitor problem.** Recruiters had to read a long page to find the role, the evidence and the contact route.
- **Authorized scope.** As stated above.
- **Acceptance.** The criteria in the table above.
- **Reviewer findings.** Stage 04 F1–F5 and review R1–R15, all fixed and retested.
- **Untested items.** Real devices, real GPU cost, OS text scaling, live Aki providers, Lighthouse.

**Separate PRs.** This is the application implementation. It is not the docs-only synchronization on `docs/icm-portfolio-workspace`, which has its own draft PR to `main` (#15).

**Release order.** The docs PR lands first, then this branch, then `main`. Merge and deployment need the owner's separate approval. None occurred.

## Demo publication decision

**Decision.** The two demos are ready for review in the draft PR. Final authority reviewed:
- the public source and build allowlists (six files),
- the target revision d630305,
- the request-attempt evidence for direct and embedded entry,
- the visible labels.

The demos make no payroll, legal or security guarantee, imply no real integration, and claim no private feature parity. There is no canned Aki demo. Export and network gates: PASS. The disclosure review must be repeated on the final changeset before the push and the draft PR.

## Checkpoint, audit, and final status

- Findings and fixes recorded, with affected checks rerun: **pass**.
- Pre-existing items separated from regressions: **pass**.
- No merge, main push or deployment: **pass**.

**Status: READY.** Next authorized action: after the disclosure review, push the feature branch (no force) and open the draft PR. Neither has happened at this revision. Merge and deployment wait for the owner.
