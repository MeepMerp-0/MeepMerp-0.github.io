---
run_id: portfolio-2026-q4-hero-depth
stage: 03-implementation
state: READY
revision: "implementation r4; application code at 758f14d"
scope: "Portfolio application implementation run: the Hero and its hand-over to Work only"
source_branch: feat/portfolio-cinematic-rework
source_commit: "ad9d1254a6c7f8c3a46d5363deac7378147c3a6b"
working_branch: feat/hero-depth-flow-type
pr_base: feat/portfolio-cinematic-rework
inputs:
  - "icm/stages/02-specification/output/portfolio-2026-q4-hero-depth-spec.md (spec r2)"
---

# Implementation record: Depth, Flow and Type Hero

## Baseline

- Remote ref checked: `origin/feat/portfolio-cinematic-rework` is at `ad9d125`, the head of draft PR #16. "feat/portfolio" in conversation refers to this branch; no other portfolio feature branch exists on the remote.
- Working branch: `feat/hero-depth-flow-type`, created from `ad9d125`. The working tree was clean.

## Model routing

| Role | Requested | Used | Notes |
| --- | --- | --- | --- |
| Adviser | Fable 5.1 | Fable 5.1, high effort | Available in this environment |
| Architecture, security, final authority | Opus 5.5 | Opus 5.5 (the orchestrating session) | Wrote the spec and the motion contract, and does the final review |
| Primary implementation | Sonnet 5.5 | Sonnet 5.5, high effort | |
| Small, repetitive tasks | Haiku 5.5 Fast | Haiku 5.5, high effort | Fast output is an Opus-only option here, so standard Haiku 5.5 is the substitute. It gets only fully specified, low-risk tasks. |
| Codex column (Astra, 6.1 Sol, 6 Sol, 6 Luna) | | Not used | Codex models are not available in this Claude Code environment |

These assignments cover development only. Aki's runtime models and configuration are untouched.

## Tasks

Parallel writers use separate worktrees and do not share files. Heavy checks (build, lint, tests, browsers) run one at a time, in T6 only.

| ID | Task | Priority / risk | Model | Depends on | Files | Deliverable | Acceptance | Verification | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | Brief, spec and motion contract | P0 / medium | Opus 5.5 | none | ICM stages 01, 02 and 03; `src/components/hero/heroMotion.js` and its test | Deterministic motion functions | Pure functions; camera clears the core at every `p` and aspect ratio | `node --test`, 5/5 | done |
| T2 | Adviser review of the spec | P0 / low | Fable 5.1 | T1 | none (read-only) | Second opinion on consequential decisions | Each point accepted or declined with a reason | Spec r2, "Adviser review" table | done |
| T3 | Three.js scene | P0 / medium | Sonnet 5.5 | T1, T2 | `src/components/hero/heroScene.js`, `heroMotion.js` (keyframes and `HERO_FOV`), `heroMotion.test.js` (projection test) | Inputs, core, application, copper route, signal, camera | Spec §5 | T6 screenshots, determinism probe | done (ae66233; camera retuned in 0cdd6f7) |
| T4 | Hero component, progress, modes, styles and fallback art | P0 / medium | Sonnet 5.5 | T1, T2 | `src/sections/Hero.jsx`, `src/components/hero/HeroFallbackArt.jsx`, `src/hooks/useHeroProgress.js`, `src/hooks/useWorkProgress.js` (exports only), `src/data/siteCopy.js` (Hero copy), `src/styles/global.css` (the `.hero` block only) | Pinned and still Hero | Spec §2–4 and §7 | T6 probes | done (97a9124; fixes in 7a9bd87, 6f1d9e9, c5a8638, 76d485a, f46c9b1) |
| T5 | Static content when JavaScript fails | P2 / low | Haiku 5.5 | T4 | `index.html` | Readable identity and links before mounting, using the Hero's classes | Spec §6; no inline style or script | T6: page with scripts blocked | done (1f89e53) |
| T6 | Integration, smoke-suite update, verification and fixes | P0 / medium | Sonnet 5.5 | T3, T4, T5 | `scripts/verify-scroll-preview.mjs` (Hero selectors), fixes in T3 and T4 files | Evidence for every acceptance item | Spec §8 | Stage 04 | done (737a0f4 and Stage 04) |
| T7 | Integrated review | P0 / medium | Opus 5.5, with a Fable 5.1 second opinion | T6 | none (read-only) | Findings, then fixes by Sonnet | No open high-severity finding | Stage 05 | done (Stage 05) |

T3 and T4 run in parallel in separate worktrees with no shared file. T5 copies T4's markup and classes, so it runs after T4 has merged.

## What was built

| Area | Result |
| --- | --- |
| Structure | `src/sections/Hero.jsx` renders one element tree. `.hero` carries `data-mode` (`pinned` or `still`) and `data-art` (`canvas` or `svg`), and CSS chooses the layout from them. Pinned mode is a 230svh track with a sticky stage under the header. |
| Progress and modes | `src/hooks/useHeroProgress.js`. Progress is read from native scroll and kept in a store outside React. It sets `--hero-p`, `--hero-w0..2`, `--hero-lift`, `--hero-accent` and `--hero-signal` on the stage, and `aria-current="step"` on the active stage. The mode is decided in a layout effect from a fit measurement that does not depend on the mode or on progress, with 48 px of hysteresis. |
| Motion contract | `src/components/hero/heroMotion.js`: pure functions of progress, camera keyframes and `HERO_FOV`. `heroMotion.test.js` covers monotonic signal, determinism, stage order, core clearance and the framing rules at four aspect ratios. |
| Scene | `src/components/hero/heroScene.js`, on the shared studio. Inputs are an instanced tile grid with copper "request" tiles. Intelligence is a ribbed torus core with an inner shell. Application is an abstract panel with cards and a bar chart. One copper route runs through all three, with a travelled overlay and a signal. Rendering happens only on change. Disposal releases the GPU context. |
| Fallback art | `src/components/hero/HeroFallbackArt.jsx`: an inline SVG of the same three layers, coloured by tokens. It shows before the first frame, without WebGL and after context loss. |
| Copy | `src/data/siteCopy.js` `HERO`: the headline "From inputs / to impact.", the approved supporting line, and three stage labels with one-line descriptions. The focus list is kept. Aki does not read this file. |
| Without JavaScript | `index.html` puts the Hero copy, focus list and email, GitHub and CV links inside `#root`, using the Hero's classes. React replaces it on mount. |
| Styles | The old Hero block in `src/styles/global.css` is replaced. Every selector starts with `.hero`. |
| Phones | Order: copy, cue, labels, art band, then Skip to Work at the left, so Aki's fixed launcher and greeting bubble cover only decorative art. |
| Smoke suite | `scripts/verify-scroll-preview.mjs`: the Hero selectors now match the new markup. A fixed 1.5 s wait after an Aki Contact link is replaced by a wait for the scroll to stop, because the longer page makes the smooth scroll take longer. The Aki checks are otherwise unchanged. |

## Deviations from spec r2

- **Stage emphasis.** It is shown by a copper tick, the name colour and the "Now" marker. The stage text stays at full contrast, because fading it to 55 % would fail 4.5:1.
- **Pinning on phones.** It works at 390 × 844 and 412 × 915 in both themes. Phones 360 px wide and shorter than 828 px, and 320 × 568, fit only the still layout. That is about 105 px short at 360 × 780, without hiding content or shrinking the art band below 180 px.
- **Skip to Work on phones.** The visible link is its text height (about 20 px), with a 44 px tap target from a pseudo-element, so its box stays clear of Aki's greeting bubble.
- **The first mode decision** on a page uses the plain limit, so a screen inside the hysteresis band starts pinned. Later decisions use 48 px of hysteresis, so a screen resized into that band stays still until reload.
- **The no-JavaScript block** offers email, GitHub and CV links instead of View Work and Contact, because the sections those anchors target do not exist without JavaScript.

Nothing under `src/components/aki/`, `src/services/aki*`, `worker/` or any `.aki` selector changed. No dependency, network request or telemetry was added.

## Reference image rebuild (T8, owner request)

The owner supplied a reference image and asked that the Hero look like it (spec r3).

| Commit | Model | Change |
| --- | --- | --- |
| `3f55a1e` | Sonnet 5.5 | The scene is rebuilt as the reference panorama:<br>• Inputs: a framed 5 × 5 tile panel with bronze tiles and the signal on a tile.<br>• Intelligence: a core of 120 radial fins between a ticked outer ring with 12 spokes and a thin inner ring, around a bevelled hexagon with "AI" drawn on a canvas texture.<br>• Application: a framed panel with three rows.<br>• One copper route that starts as a faint line.<br>• Scene labels "01 / INPUTS", "02 / INTELLIGENCE" and "03 / APPLICATION". |
| `225628f` | Sonnet 5.5 | Camera:<br>• a near-frontal overview matching the image;<br>• a close-up on the hexagon at a 22° angle, so the fins show their depth;<br>• an end view opened out to the right on Application.<br>Framing tests are rewritten to these rules. |
| `f63e4bc` | Sonnet 5.5 | `HeroFallbackArt` is a flat SVG of the same image, coloured by tokens. The art column takes a wider share of the stage. |
| `758f14d` | Opus 5.5 (a two-line polish after the visual review) | The signal is absorbed into the hexagon instead of sitting on the "AI" text. Scene labels of inactive stages fade out once the camera leaves the overview, so cut-off fragments never show at the frame edge. |

The page structure, progress, modes, copy and label plate are unchanged.
