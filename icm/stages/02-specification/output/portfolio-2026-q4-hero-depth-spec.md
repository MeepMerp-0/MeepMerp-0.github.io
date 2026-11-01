---
run_id: portfolio-2026-q4-hero-depth
stage: 02-specification
state: READY
revision: "spec r3 (owner reference image applied)"
scope: "Portfolio application implementation run: the Hero and its hand-over to Work only"
source_branch: feat/portfolio-cinematic-rework
source_commit: "ad9d1254a6c7f8c3a46d5363deac7378147c3a6b"
working_branch: feat/hero-depth-flow-type
pr_base: feat/portfolio-cinematic-rework
inputs:
  - "icm/stages/01-strategy-content/output/portfolio-2026-q4-hero-depth-brief.md (brief r1)"
---

# Specification: Depth, Flow and Type Hero

Architecture authority: Opus 5.5. This file is the build contract for the implementation tasks in Stage 03.

## 1. Rendering and dependencies

- Reuse the installed Three.js 0.187 and the shared studio in `src/components/three/studio.js` (renderer, room environment, `tones()` palettes, pixel budget, context-loss hook). No new dependency or second animation library.
- `motion/react` stays only where it already serves other sections. The Hero uses no timed animation, so it needs none.
- All motion is computed by `src/components/hero/heroMotion.js`, which holds pure functions of one progress value `p` in [0, 1]: `signalAt`, `activeStage`, `stageWeights`, `typeAt` and `cameraAt(p, aspect)`. Its tests are in `heroMotion.test.js`. Changing a keyframe there changes the scene, labels and type together.

## 2. Progress

`p = clamp((headerHeight - track.top) / (track.height - stage.height), 0, 1)`, where the track is the tall Hero wrapper and the stage is its sticky child. This is the same read-only measurement Work uses.

- It is read on `scroll` (passive), `resize` and a `ResizeObserver`, coalesced to one `requestAnimationFrame`. No handler writes the scroll position, and nothing cancels wheel or touch.
- `p` lives in a small store outside React, as Work's scene store does, so a scroll frame re-renders no component.
- Subscribers:
  - The scene: `setProgress(p)`. It renders only when `p`, size or theme changes.
  - The stage element's CSS custom properties: `--hero-p`, `--hero-w0`, `--hero-w1`, `--hero-w2`, `--hero-lift` (px) and `--hero-accent`, set with `style.setProperty`.
  - React state for the active stage index only, which updates `aria-current="step"` when the stage changes, not every frame. There is no live region.
- No CSS transition or animation on anything driven by progress, so the frame holds exactly when scrolling stops.

## 3. Modes

`.hero` carries two attributes. Pinned styles apply only under `[data-mode='pinned']`, which JavaScript sets, so CSS and JavaScript cannot disagree, and a page without JavaScript gets the still layout. Render one element tree in both modes; only the attributes change, so a mode flip never remounts the canvas.

**`data-mode`** is `pinned` or `still`. It decides the layout and is set only at these points:

- on mount, in a `useLayoutEffect`, so it is settled before `useInitialHashScroll` places a deep link;
- on resize;
- from a `ResizeObserver` on the copy block, which also catches root font-size changes.

Pinned requires all of these:

- reduced motion is not requested;
- `webglAvailable()` is true at mount (export it from `useWorkProgress.js`, do not duplicate it);
- `HERO_PINNED_QUERY = '(min-width: 360px) and (min-height: 560px)'` matches (one exported constant);
- the content fits, measured independently of the current mode:
  - `needed = copy.offsetHeight + labels.offsetHeight + cue.offsetHeight + minArt + padding`;
  - `available = innerHeight - headerHeight`;
  - `minArt` is 0 on wide stages, where the art is a column, and 180 px on narrow stages.

Hysteresis prevents flicker: go to still when `needed > available`, and come back to pinned only when `needed < available - 48`.

When the mode flips while the Hero is entirely above the viewport, the track height change is offset with one `window.scrollBy(0, delta)` in that layout step, so the visitor stays on the same content. This is a layout compensation on resize. It is never done in a scroll handler.

**`data-art`** is `canvas` or `svg`. Scene import failure, a creation error and context loss change only `data-art`. They never change `data-mode`, so a late failure cannot collapse the track under the visitor. With `svg`, `HeroFallbackArt` shows in the same place.

**Still** is ordinary flow. With `canvas`, the scene draws one frame at `p = 0`. Reduced motion, short screens and enlarged text all use still.

Changing theme must not remount the Hero, reset `p` or move the scroll position.

## 4. Layout and type

All Hero rules live in `src/styles/global.css`, where the old `.hero` block is, and every selector starts with `.hero`. Use `var(--header-h, 72px)` everywhere. The progress hook also observes `.site-header` with a `ResizeObserver` and re-measures when it changes. Keep `id="home"` on the outer `.hero`, and give `.hero` the stage background so the strip under a mobile URL bar matches it.

The track is `height: 230svh`. The stage is `position: sticky; top: var(--header-h, 72px); height: calc(100svh - var(--header-h, 72px))`. Work follows immediately after the track, so the release is the track's end.

**Wide stages** (at least 900 px wide and landscape):

- A copy column of about 44 % on the left and an art column of about 56 % holding the canvas on the right.
- The label plate spans both columns underneath. It sits outside the canvas.
- There is no scrim and no `setViewOffset`.

**Narrow or portrait stages:**

- The copy sits at the top, the canvas band (at least 180 px) in the middle, and the labels and cue at the bottom.
- The bottom-right 110 × 110 px stays clear of every Hero control and label, because Aki's launcher is fixed there and Aki does not move. Use right padding of about 100 px on the plate, and put the Skip link and cue on the left.

**Stage labels:**

- Semantic `<ol class="hero-stages">` with three `<li>`: number, name and a one-line description.
  - Inputs: "Requests, messages and records arrive."
  - Intelligence: "Agents sort, decide and route the work."
  - Application: "Useful software people rely on."
- They sit on a solid surface plate (`var(--surface)` with a border), with a thin copper progress rail whose marker is at `signalAt(p)`.
- Emphasis comes from `--hero-wN` (opacity 0.55 to 1 and the copper colour). The active stage also gets `aria-current="step"` and a visible "Now" marker made of text and a shape, so state is not shown by colour alone.
- In still mode the labels show at full strength, without the rail marker.

**Type:**

- The headline is the largest element. Its second line, "to impact.", uses the existing metal-gradient accent.
- Progress drives two things:
  - `translateY(var(--hero-lift))` on the headline block (at most 16 px);
  - the accent gradient's `background-position`, set by `--hero-accent`.
- The lead and actions never fade.

**Actions:**

- **View Work** (`#work`, primary) and **Contact** (`#contact`), as now.
- At the bottom left, a visible **Skip to Work** link (`#work`), at least 44 px tall, on every viewport.
- A scroll cue reading "Scroll to explore" with a static arrow, shown in pinned mode. It does not bounce.
- Anchors keep the site's native `scroll-behavior: smooth`. That scrolling is done by the browser and the scene follows the actual position at every step. Reduced motion already turns it off.

**Overflow and contrast:**

- No horizontal overflow from 320 px up.
- Text contrast at least 4.5:1 (3:1 for large type) against the page background, in both themes and at `p` = 0, 0.5 and 1.

## 5. Scene

`src/components/hero/heroScene.js` keeps the API `createHeroScene(canvas, { theme, onLost })` and returns `{ setProgress, setTheme, resize, renderNow, dispose }`. Rendering is on demand only: no idle loop, no timed motion and no IntersectionObserver. `setProgress` ignores unchanged values, so nothing is drawn once `p` stops changing.

**Palette** (`tones()` pairs, `[dark, light]`):

- Dark: warm charcoal surfaces, ivory tiles, champagne core.
- Light: warm stone surfaces, ink tiles, bronze core.
- Copper route: `#c47a45` / `#9a5426`. The signal glows warm ivory / deep bronze.

**Inputs** (around `[-4.2, 0.2, -1.5]`, extent x −6.2 to −2.2):

- An abstract grid of rounded tiles in a gently tilted plane, about 5 × 4, varied in height, a few marked as "requests".
- Use `InstancedMesh` to keep draw calls low.

**Intelligence** (the core at `CORE = [0, 0.4, -3]`, visual radius at most 1.4):

- A ribbed sculptural core: stacked lathe or torus ribs with a layered inner shell and visible depth.
- It is clearly not a robot and not Aki: no face, eyes, screen, antenna or limbs.

**Application** (around `[3.4, 0.2, -1.6]`, extent x 1.9 to 4.9):

- An abstract app surface: a rounded panel with a header bar, sidebar, cards and a small bar chart, all in the palette.
- No real product, logo, brand or text.

**Route and signal:**

- One continuous `CatmullRomCurve3` through the inputs, around the core and into the application, drawn as a copper `TubeGeometry`.
- After building the curve, compute `uCore` (the route parameter closest to `CORE`, sampled about 200 times). Map `s = signalAt(p)` to the route in two linear pieces:
  - `s ≤ 0.5` gives `u = s / 0.5 · uCore`;
  - otherwise `u = uCore + (s − 0.5) / 0.5 · (1 − uCore)`.
- A brighter overlay tube about 1.15 times the radius shows the travelled part, using `setDrawRange(0, floor(u · tubular) · radial · 6)` (index count).
- The signal is a small emissive sphere with a halo at `curve.getPointAt(u)`.

**Stage emphasis:** each layer's accent material brightens with `stageWeights(p)`, through emissive intensity or colour mix only. Its shape does not change.

**Camera:**

- `PerspectiveCamera` with fov 34 and near 0.1, positioned by `cameraAt(p, aspect)` from the canvas aspect ratio and pointed at its `target` every render.
- Retune `KEYS` in `heroMotion.js` so the frame is composed well:
  - the overview targets the scene's centre (about `[-0.4, 0.3, -2]`);
  - the close-up is about 6.5 to 7 units from the core;
  - the end view opens toward Application.
- Add a pure projection test in `heroMotion.test.js`, using a shared `HERO_FOV = 34` exported from `heroMotion.js`. At aspect ratios 0.97, 1.2 and 1.74 it checks that:
  - at `p` = 0 and 1, the layer extents (Inputs x −6.2 to −2.2, the core ±1.4, Application x 1.9 to 4.9, y about −1 to 1.4) project inside the frame with a 4 % margin;
  - at `p = 0.5`, the core's extent is inside.
- The existing tests stay green.
- Objects move by their depth because a real camera moves; nothing is done by scaling a finished image.

**Lifecycle:**

- `resize()` uses `studio.fit()` (pixel ratio and budget).
- `dispose()` releases geometry, materials and the renderer.
- Context loss calls `onLost`, which sets `data-art="svg"` only.

**Fallback art:** `src/components/hero/HeroFallbackArt.jsx` is an inline, decorative (`aria-hidden`) SVG of the same three layers and copper route. Its colours come from CSS tokens, so it follows both themes. It shows until the first WebGL frame and whenever `data-art` is `svg`. The swap is instant.

## 6. Without JavaScript

`index.html` puts static markup inside `#root`, which React replaces when it mounts:

- name, role, location;
- the headline and supporting line;
- links: email (`mailto:jason.selerio@gmail.com`), GitHub (`https://github.com/MeepMerp-0`) and the CV (`https://pub-c10ba7365a8240d2a24c50e217e1da90.r2.dev/personal/CV/CV_JasonSelerio.pdf`).

It reuses the still-mode Hero classes, so it looks like the mounted Hero's copy and the swap on a normal load is nearly invisible. It needs little or no CSS of its own, because the built stylesheet is linked from `index.html` and loads even when the script fails. No inline `style` attributes or scripts are allowed. Verify it against the build, with scripts blocked, not against the dev server.

## 7. Aki and other sections

- No change under `src/components/aki/`, `src/services/aki*`, `worker/`, Aki assets, or any CSS selector that matches Aki (`.aki*`).
- Hero CSS replaces the old `.hero` block in `global.css`, and every selector starts with `.hero`.
- The Work, About, Process and Contact sections are unchanged, except that Work's `useWorkProgress.js` exports `webglAvailable` and `useMedia` for reuse.
- No new network request, form, telemetry or external asset.

## 8. Acceptance (observable)

1. The page loads still. Nothing in the Hero moves without scrolling. Two captures 2 s apart at rest are identical. Captures compare the Hero canvas (`toDataURL`) and the computed transforms and custom properties of `.hero-stage`, not whole-viewport screenshots, which would include Aki's own idle animation.
2. Scrolling moves the signal from Inputs to Intelligence while the camera moves in, then to Application while the camera opens out. Labels and type follow.
3. Stopping holds the exact frame: the canvas pixels and the stage's DOM transforms and properties are identical 1 s later.
4. Scrolling back to an earlier position restores that earlier frame (the same pixels for the same scroll position and theme).
5. The sticky sequence ends and Work follows naturally. `#work`, Skip to Work, View Work and the navigation anchors all land correctly.
6. Toggling the theme mid-sequence keeps `scrollY` and `p`.
7. No horizontal overflow and readable contrast at 320, 360, 390, 768, 1024, 1440 and 1920 px, plus short landscape, in both themes.
8. Reduced motion, a short screen, 200 % text, no WebGL and context loss all give the still layout with every piece of content and every action.
9. At 320, 360 and 390 px, no Hero label or link overlaps Aki's launcher. Aki's launcher canvas hash stays `769e31257e57cc48` and the smoke suite's Aki steps pass.
10. `npm test`, `eslint .` and `npm run build` pass. The smoke suite passes, with its Hero selectors updated to the new markup.

## Adviser review (Fable 5.1) and decisions

| Point | Decision |
| --- | --- |
| Camera keyframes did not frame the scene; the close-up overfilled the frame | Accepted: fov 34, retuned keyframes and a projection test (§5) |
| Separate art column instead of a full-stage canvas with a scrim | Accepted (§4) |
| The mode check could oscillate, and late mode flips move the page | Accepted: a mode-independent measurement with hysteresis in a layout effect. One `scrollBy` compensation, only when a flip happens while the Hero is above the viewport (§3) |
| A late scene failure must not change the layout | Accepted: separate `data-art` attribute (§3) |
| The IntersectionObserver is redundant | Accepted: dropped (§5) |
| Compute the core's route parameter instead of tuning it; the overlay tube z-fights | Accepted (§5) |
| The no-JavaScript block flashes on load | Accepted: it reuses the Hero classes and is verified on the build (§6) |
| Aki's launcher covers the bottom-right of the stage on phones | Accepted: keep that corner clear, with a probe (§4, §8) |
| Stillness probes would catch Aki's idle animation | Accepted: compare the canvas and the stage properties only (§8) |
| Pin only on large landscape screens | Declined. The owner asked for the scroll sequence on mobile when the composition fits. The fit measurement, with a 180 px minimum art band, decides, and phones that do not fit get still. |
| `--header-h` is set after first paint | Accepted: fallbacks and a header `ResizeObserver` (§4) |
| `hero.css` would bundle before `global.css` | Accepted: Hero rules stay in `global.css` (§4, §7) |
| A mode switch must not remount the canvas | Accepted: one tree (§3) |
| Smooth anchor scrolling crosses the pin | Decided without asking: keep the site's native smooth anchors. The browser moves the page, and the scene shows the exact position at each step, so nothing keeps moving once the page stops. |

## Owner reference image (spec r3)

After the first implementation, the owner supplied a reference image and asked that the Hero look like it. That image replaces the composition in §5. The scroll contract (§2–§4), the modes, the accessibility rules and the Aki boundary are unchanged. The image is described here rather than copied into the repository.

**Composition:**

- A frontal panorama on a warm charcoal background with a soft warm glow behind the centre. The three layers sit in a row and are joined by one copper tube.
- **Inputs (left):**
  - a square panel with a thin bronze frame and a dark fill, holding a 5 × 5 grid of square tiles;
  - about a third of the tiles are bronze and the rest are dark warm grey;
  - a glowing copper signal orb sits on one tile at the start.
- **Intelligence (centre):**
  - concentric rings: a thin outer ring with radial ticks and long thin spokes that extend past it like a crosshair, about 12 directions;
  - a wide ribbed annulus of many fine radial fins in champagne, lighter toward the bottom right;
  - a thin inner ring;
  - a hexagon with a bronze bevelled rim and a dark face reading **AI** in a bold sans-serif. Draw the text on a canvas texture; this is decorative.
  - The fins and rings have real depth along z, so the camera's approach shows parallax.
- **Application (right):**
  - a wider rectangular panel with a thin bronze frame and a dark fill;
  - a thin line across the top;
  - three rows, each with a square block (dark, bronze, dark from top to bottom) beside a long line and a shorter line.
- **The route:**
  - comes in from the far left as a thin faint line that thickens into a copper tube;
  - runs at mid height behind the Inputs panel and through the ring to the hexagon;
  - leaves on the right and curves down into the Application panel.
- **Scene labels:** "01 / INPUTS", "02 / INTELLIGENCE" and "03 / APPLICATION" sit above the top-left of each layer, in small spaced uppercase.
  - They are drawn into the scene as canvas-texture planes, so they move with the camera.
  - They are decorative: the semantic stage list in HTML stays the accessible source.
- **Light theme:** the same composition in warm stone, ink and bronze. Panels are light stone with bronze frames, the dark tiles and blocks become warm ink-grey, and the fins become bronze.

**Camera (as before, a deterministic function of progress):**

- p = 0: a frontal overview that matches the image (camera nearly level, slightly above, all three layers framed);
- p = 0.5: close on the core, with the hexagon and the inner fins filling most of the frame, seen slightly off-axis so the fins show their depth;
- p = 1: opens out and moves right, with the Application panel large and the core partly in frame.

**Fallback art:** `HeroFallbackArt` becomes a flat SVG of the same image, coloured by tokens.
