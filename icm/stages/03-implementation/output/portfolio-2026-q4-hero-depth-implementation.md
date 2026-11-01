---
run_id: portfolio-2026-q4-hero-depth
stage: 03-implementation
state: DRAFT
revision: "implementation r1 (task plan)"
scope: "Portfolio application implementation run: the Hero and its hand-over to Work only"
source_branch: feat/portfolio-cinematic-rework
source_commit: "ad9d1254a6c7f8c3a46d5363deac7378147c3a6b"
working_branch: feat/hero-depth-flow-type
pr_base: feat/portfolio-cinematic-rework
inputs:
  - "icm/stages/02-specification/output/portfolio-2026-q4-hero-depth-spec.md (spec r1)"
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
| T2 | Adviser review of the spec | P0 / low | Fable 5.1 | T1 | none (read-only) | Second opinion on consequential decisions | Each point accepted or declined with a reason | Recorded below | pending |
| T3 | Three.js scene | P0 / medium | Sonnet 5.5 | T1, T2 | `src/components/hero/heroScene.js`, `heroMotion.js` (tuning only, tests kept green) | Inputs, core, application, copper route, signal, camera | Spec §5 | T6 screenshots, determinism probe | pending |
| T4 | Hero component, progress, modes, styles and fallback art | P0 / medium | Sonnet 5.5 | T1, T2 | `src/sections/Hero.jsx`, `src/components/hero/hero.css`, `src/components/hero/HeroFallbackArt.jsx`, `src/hooks/useHeroProgress.js`, `src/hooks/useWorkProgress.js` (exports only), `src/data/siteCopy.js` (Hero copy), `src/styles/global.css` (remove Hero rules) | Pinned and still Hero | Spec §2–4 and §7 | T6 probes |
| T5 | Static content when JavaScript fails | P2 / low | Haiku 5.5 | T1 | `index.html`, `.no-js-fallback` block appended to `src/styles/global.css` | Readable identity and links before mounting | Spec §6; no inline style or script | T6: page with scripts blocked | pending |
| T6 | Integration, smoke-suite update, verification and fixes | P0 / medium | Sonnet 5.5 | T3, T4, T5 | `scripts/verify-scroll-preview.mjs` (Hero selectors), fixes in T3 and T4 files | Evidence for every acceptance item | Spec §8 | Stage 04 | pending |
| T7 | Integrated review | P0 / medium | Opus 5.5, with a Fable 5.1 second opinion | T6 | none (read-only) | Findings, then fixes by Sonnet | No open high-severity finding | Stage 05 | pending |

T4 and T5 both touch `global.css`, so they are sequenced: T5 appends its own block at the end of the file only after T4 has merged.
