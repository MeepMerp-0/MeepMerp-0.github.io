---
run_id: portfolio-2026-q4-hero-depth
stage: 04-verification
state: READY
revision: "verification r3; follow-ups tested at e52bd63, reference rebuild at 758f14d, earlier rows at f46c9b1"
scope: "Portfolio application implementation run: the Hero and its hand-over to Work only"
source_branch: feat/portfolio-cinematic-rework
source_commit: "ad9d1254a6c7f8c3a46d5363deac7378147c3a6b"
working_branch: feat/hero-depth-flow-type
pr_base: feat/portfolio-cinematic-rework
inputs:
  - "icm/stages/02-specification/output/portfolio-2026-q4-hero-depth-spec.md (spec r2)"
  - "icm/stages/03-implementation/output/portfolio-2026-q4-hero-depth-implementation.md (r5)"
---

# Verification record: Depth, Flow and Type Hero

## Environment

- Node 26.13.0 and npm 11.20.0 on WSL. Headless Chromium 1248 with software WebGL, run against `vite preview` of the production build.
- Probes block every request outside the page. Heavy checks ran one at a time.
- Captures of the Hero compare the canvas region and the stage's computed properties. They do not use whole-viewport screenshots, because Aki's launcher animates on its own; for those captures the probe hid Aki's elements in the page, without changing any file.

## Commands

| Check | Result |
| --- | --- |
| `npm test` | 276/276. This includes `heroMotion.test.js`: signal, determinism, stage order, core clearance and framing at aspect ratios 0.97, 1.2, 1.74 and 1.76. |
| `eslint .` | No problems |
| `npm run build` | Passes. Only the existing warning about chunks over 500 kB. |
| Smoke suite (`scripts/verify-scroll-preview.mjs`) | Passes on the final build, including the 43 Aki steps |

## Browser viewport checks

| Item (spec §8) | Result | Evidence |
| --- | --- | --- |
| 1. Still at load | PASS | Canvas and stage properties identical 2 s apart at rest: 1440 × 900 dark, 390 × 844 light, 412 × 915 dark |
| 2. Forward through all three stages | PASS | At nine progress values the canvas differs at each step. `aria-current` moves Inputs, Intelligence, Application. Signal 0.5 at p = 0.5 and 1 at p = 1. The headline lifts 0 to −16 px (halved on phones). |
| 3. Exact hold | PASS | Canvas and properties identical 1 s after scrolling stops, at the same three sizes |
| 4. Reverse restores | PASS | Scrolling back gives identical canvas captures at every progress value. p = 0.37 is identical after a forward and back run. |
| 5. Release into Work and anchors | PASS | The track is 230svh. Work's top meets the header (73 px desktop, 65 px phone) as the track ends. Skip to Work, View Work, Contact and the header links land correctly, including Skip from mid-sequence. The deep links are covered by the smoke suite. |
| 6. Theme mid-sequence | PASS | scrollY 684 to 684 and p 0.5503 to 0.5503 at 1440; 639 to 639 at 390. The canvas, Hero and stage nodes are the same objects (no remount). |
| 7. Widths, overflow, overlap, contrast | PASS | Sizes: 320 × 700, 360 × 780, 390 × 844, 412 × 915, 768 × 1024, 1024 × 768, 1440 × 900, 1920 × 1080 and 844 × 390, in both themes. Horizontal overflow 0 at p = 0, 0.5 and 1, no overlapping text, Hero text at least 4.5:1 against the page. |
| 9. Clear of Aki | PASS | At 390 × 844 and 412 × 915, both themes, p = 0, 0.5 and 1: no stage label, cue, Skip link or copy text intersects Aki's launcher or greeting bubble. Desktop 1024, 1440 and 1920: the bubble covers no plate text. |
| Mode stability | PASS | Widths 360–380 × heights 780–860 × text at 100–115 %, scrolled through the whole track (72 configurations, plus 32 near the threshold): no mode flip during scrolling and no `scrollBy` call |
| Keyboard | PASS | Tab order: skip link, wordmark, navigation, theme toggle, Let's talk, View Work, Contact, Skip to Work, then Work. Focus is visible on each. |
| Composition | PASS (reviewed by eye) | Contact sheets at 1440 × 900 and 390 × 844, both themes, p = 0, 0.25, 0.5, 0.75 and 1. Overview with depth, a close core, then the application reveal. |

## Simulated fallback checks

| Case | Result | Evidence |
| --- | --- | --- |
| Reduced motion | PASS | Still layout at 1440 × 900 and 390 × 844, with one frame at p = 0, all content present, overflow 0 |
| Short screens | PASS | 1440 × 500, 844 × 390 and 390 × 560 are still |
| Enlarged text | PASS | At 150 % and 200 % browser zoom, and with injected larger text, the layout goes still. The live switch keeps the scroll position. |
| No WebGL (`--disable-webgl`) | PASS | Still layout with the SVG art; every string and link present |
| Context loss (`WEBGL_lose_context`) | PASS | `data-art` goes to `svg`, the mode and scrollY are unchanged, and the draw count stays at 131 through later scrolling (the scene is torn down) |
| Scripts blocked (built preview) | PASS | The static block shows the identity, headline, lead, focus list, availability and three 48 px links, in theme colours, with no overflow |
| Pixel ratio change (emulated) | PASS | The canvas buffer follows the device scale factor (721 to 1081 to 901 px) with the CSS size unchanged |
| Mode flip with the Hero above the viewport | PASS | Work stays within about 0.2 px with the browser's scroll anchoring, and exactly without it |

## Source review

- **Aki is untouched.** `git diff ad9d125..HEAD` is empty for `src/components/aki/`, `src/services/`, `worker/` and the package files. No CSS rule targets `.aki`.
- **Aki's launcher** canvas hash is `769e31257e57cc48` at 1440, 768 and 390 px in both themes, unchanged.
- **Scroll handling.** No wheel or touch handlers, no snapping, and no scroll writes in scroll handlers. Nothing driven by progress has a transition or animation.
- **Lifecycle.** The scene is created once (safe under StrictMode) and disposed on unmount and on context loss. A creation error releases the studio.
- **No new requests.** No new dependency, network request or telemetry.

## Not tested and limits

- **Real devices and GPUs:** NOT TESTED. All of the above ran in headless Chromium with software WebGL. Touch scrolling was checked only as native scrolling, with no device.
- **Phones narrower than 390 px or shorter than 828 px** use the still layout. 360 × 780 is about 105 px short of fitting.
- **Hysteresis:** a screen resized into the 48 px band after load stays still until reload.
- **Pixel ratio changes** were emulated. Headless Chrome delivered one return to 1× only on the next change.
- **Large resizes** (1440 × 900 to 1440 × 500, and phone rotation): About moved by thousands of pixels. The likely cause is Work switching between its pinned and strip layouts, a behaviour that predates this run. This was not confirmed; the Hero's own mode flip stays within 0.2 px.
- **195 × 422** (200 % zoom of a 390 px phone, below the 320 px floor) has 119 px of horizontal overflow. It was not compared with the previous build.
- **The no-JavaScript block** uses the Hero's own classes to keep the change small. It no longer shows before React mounts; see the r3 checks below.

## Reference rebuild checks (after `3f55a1e`)

| Check | Kind | Result |
| --- | --- | --- |
| `npm test` (276), `eslint .`, `npm run build` | Command | PASS. Re-run after `758f14d` too: tests 276/276, lint clean, build passes. |
| Smoke suite | Command | PASS at `f63e4bc`. `758f14d` changes only scene materials and the signal's scale, and the smoke suite was not rerun after it. |
| Determinism (rest, hold, reverse, p = 0.37 round trip) | Browser viewport | PASS: 1440 × 900 dark and 390 × 844 light at `f63e4bc`; 1440 × 900 light and dark at `758f14d` |
| Overflow at 320, 360, 390, 768, 1024, 1440, 1920 and 844 × 390, both themes | Browser viewport | PASS, 0 |
| Aki: launcher hash ×6, and clearance at 390 and 412 px | Browser viewport | PASS: `769e31257e57cc48`, no intersections |
| Reduced motion, no WebGL, context loss, 150 % and 200 % text | Simulated fallback | PASS |
| Match to the reference | Visual review by Sonnet 5.5 and Opus 5.5 | Layout, tile grid, rings and fins, the AI hexagon, the route, the Application panel and the labels match at p = 0. The light theme follows the same composition. Lit materials make the colours close to the reference but not exact. |

Remaining limits:

- **Empty space in the art column.** The art column is taller than the 2.4:1 panorama, so at p = 0 there is empty space above and below it.
- **Small text on phones.** The scene labels are small there; they are decorative, and the HTML stage list carries the names.
- **Hairline spokes.** The spokes are 1 px lines, so in the close-up they look thinner than the fins.

## Owner follow-up checks (r3, at `e52bd63`)

| Check | Kind | Result |
| --- | --- | --- |
| `npm test` (277), `eslint .`, `npm run build` | Command | PASS |
| Smoke suite | Command | PASS (all checks, including the 43 Aki steps) |
| Determinism at 1440 × 900 dark: rest, hold, reverse, p = 0.37 round trip | Browser viewport | PASS |
| Zoom-out: p = 0, 0.2, 0.45, 0.6, 0.72, 0.85, 0.94 and 1 at 1440 × 900 dark and 390 × 844 light | Browser viewport, reviewed by eye | PASS. The camera ends on the whole row, wider than the opening, and holds from 0.94. All three scene labels are back at p = 1. No cut-off label at any of these values; at p = 0.6 only "03 / APPLICATION" shows. |
| Aki replay in the Work scene, 1440 and 390 | Browser viewport | PASS: (a) Hero to Aki replays; (b) INNERCIRCLE back to Aki replays; (c) up into the Hero and back replays; (d) a partly visible chapter does not restart or flash; (e) idle after the intro. Launcher hash `769e31257e57cc48` ×6, unchanged. |
| Refresh with scripts on, dev server and built preview | Browser viewport | PASS. Sampled every frame from the new document until the app mounted: the static block was hidden in every frame (16 frames on dev, 4 on the build), never visible. |
| Scripts blocked (app never mounts) | Simulated fallback | PASS: hidden at 1.5 s, visible at 5 s |
| Scripts turned off | Simulated fallback | PASS: visible at once |

The 4 s reveal means that if the app script fails, a visitor waits up to 4 s before the static content shows.
