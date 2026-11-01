---
run_id: portfolio-2026-q4-hero-depth
stage: 02-specification
state: READY
revision: spec r1
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

`data-mode` on `.hero` is `pinned` or `still`. Pinned styles apply only under `[data-mode='pinned']`, which JavaScript sets, so CSS and JavaScript cannot disagree, and a page without JavaScript gets the still layout.

**Pinned** requires all of the following:

- reduced motion is not requested;
- WebGL is available (reuse the `webglAvailable` check from `useWorkProgress.js`; export it rather than duplicating it);
- the media query `HERO_PINNED_QUERY = '(min-width: 360px) and (min-height: 560px)'`, exported as one constant;
- the scene has not failed or lost its context;
- the sticky stage's content fits. After layout, if the stage's `scrollHeight` exceeds its `clientHeight` (for example with enlarged text), switch to still. Re-check when the viewport size or root font size changes.

**Still** is ordinary flow. When WebGL is available the scene draws one frame at `p = 0` (the overview). Without WebGL, or after a failure, the static SVG art described in §5 shows instead. Reduced motion, short screens and enlarged text also use still.

Switching modes must keep the visitor on the same section. Changing theme must not remount the Hero, reset `p`, or move the scroll position.

## 4. Layout and type

The track is `height: 230svh`. The stage is `position: sticky; top: var(--header-h); height: calc(100svh - var(--header-h))`. Work follows immediately after the track, so the release is the track's end.

**Wide stages** (at least 900 px wide and landscape):

- The copy column is on the left, about 44 % of the width.
- The canvas fills the stage behind it, with the projection centre moved right using `camera.setViewOffset`. The scene's focal point sits in the right part of the stage and stays clear of the copy.
- A soft gradient scrim on the copy side protects text contrast.

**Narrow or portrait stages:**

- The copy sits at the top and the canvas band below it, inside the stage.
- If the two do not fit together, the stage uses still mode.

**Stage labels:**

- Semantic `<ol class="hero-stages">` with three `<li>`: number, name and a one-line description.
  - Inputs: "Requests, messages and records arrive."
  - Intelligence: "Agents sort, decide and route the work."
  - Application: "Useful software people rely on."
- They sit at the bottom of the stage on a solid surface plate (`var(--surface)` with a border), connected by a thin copper progress rail with a marker at `signalAt(p)`.
- Emphasis comes from `--hero-wN` (opacity 0.55 to 1 and the copper colour). The active stage also gets `aria-current="step"` and a visible "Now" marker made of text and a shape, so state is not shown by colour alone.

**Type:**

- The headline is the largest element. Its second line, "to impact.", uses the existing metal-gradient accent.
- Progress drives two things:
  - `translateY(var(--hero-lift))` on the headline block (at most 16 px);
  - the accent gradient's `background-position`, set by `--hero-accent`.
- The lead and actions never fade.

**Actions:**

- **View Work** (`#work`, primary) and **Contact** (`#contact`), as now.
- Next to the scroll cue at the bottom, a visible **Skip to Work** link (`#work`), at least 44 px tall. It shows on every viewport, including mobile.
- A scroll cue reading "Scroll to explore" with a static arrow. It does not bounce.

**Overflow and contrast:**

- No horizontal overflow from 320 px up.
- Text contrast at least 4.5:1 (3:1 for large type) against its actual backdrop, in both themes and at `p` = 0, 0.5 and 1.

## 5. Scene

`src/components/hero/heroScene.js` keeps the API `createHeroScene(canvas, { theme, onLost })` and returns `{ setProgress, setTheme, resize, renderNow, dispose }`. Rendering is on demand only: no idle loop and no timed motion.

**Palette** (`tones()` pairs, `[dark, light]`):

- Dark: warm charcoal surfaces, ivory tiles, champagne core.
- Light: warm stone surfaces, ink tiles, bronze core.
- Copper route: `#c47a45` / `#9a5426`. The signal glows warm ivory / deep bronze.

**Inputs** (around `[-4.2, 0.2, -1.5]`):

- An abstract grid of rounded tiles in a gently tilted plane, about 5 × 4, varied in height, a few marked as "requests".
- Use `InstancedMesh` to keep draw calls low.

**Intelligence** (the core at `CORE = [0, 0.4, -3]`, visual radius at most 1.4):

- A ribbed sculptural core: stacked lathe or torus ribs with a layered inner shell and visible depth.
- It is clearly not a robot and not Aki: no face, eyes, screen, antenna or limbs.

**Application** (around `[3.4, 0.2, -1.6]`):

- An abstract app surface: a rounded panel with a header bar, sidebar, cards and a small bar chart, all in the palette.
- No real product, logo, brand or text.

**Route and signal:**

- One continuous `CatmullRomCurve3` through the inputs, around the core and into the application, drawn as a copper `TubeGeometry`.
- A brighter overlay tube shows the travelled part with `geometry.setDrawRange` up to `signalAt(p)`.
- The signal is a small emissive sphere with a halo at `curve.getPointAt(signalAt(p))`.
- The core reaches the route at about `ROUTE_CORE`. Tune the curve so `signalAt = 0.5` is at the core.

**Stage emphasis:** each layer's accent material brightens with `stageWeights(p)`, through emissive intensity or colour mix only. Its shape does not change.

**Camera:**

- `PerspectiveCamera` with near 0.1, positioned by `cameraAt(p, aspect)` and pointed at its `target` every render. The narrow-aspect step-back is inside `cameraAt`.
- On wide stages, `setViewOffset` shifts the projection so the target appears at about 66 % of the width.
- Objects move by their depth because a real camera moves; nothing is done by scaling a finished image.

**Lifecycle:**

- `resize()` uses `studio.fit()` (pixel ratio and budget).
- An `IntersectionObserver` in the component skips rendering while the canvas is offscreen. When it returns, it draws the current `p`.
- `dispose()` releases geometry, materials and the renderer.
- Context loss calls `onLost`, which switches to still mode with the SVG art.

**Fallback art:** `src/components/hero/HeroFallbackArt.jsx` is an inline, decorative (`aria-hidden`) SVG of the same three layers and copper route. Its colours come from CSS tokens, so it follows both themes. It shows until the first WebGL frame and whenever WebGL is unavailable. The swap is instant.

## 6. Without JavaScript

`index.html` puts static markup inside `#root`, which React replaces when it mounts:

- name, role, location;
- the headline and supporting line;
- links: email (`mailto:jason.selerio@gmail.com`), GitHub (`https://github.com/MeepMerp-0`) and the CV (`https://pub-c10ba7365a8240d2a24c50e217e1da90.r2.dev/personal/CV/CV_JasonSelerio.pdf`).

Its styles go in `global.css` under `.no-js-fallback`, because the built stylesheet is linked from `index.html` and loads even when the script fails. No inline `style` attributes or scripts are allowed (CSP).

## 7. Aki and other sections

- No change under `src/components/aki/`, `src/services/aki*`, `worker/`, Aki assets, or any CSS selector that matches Aki (`.aki*`).
- Hero CSS lives in `src/components/hero/hero.css`, imported by `Hero.jsx`, and every selector starts with `.hero`. The old Hero rules in `global.css` are removed.
- The Work, About, Process and Contact sections are unchanged, except that Work's `useWorkProgress.js` exports `webglAvailable` and `useMedia` for reuse.
- No new network request, form, telemetry or external asset.

## 8. Acceptance (observable)

1. The page loads still. Nothing in the Hero moves without scrolling (two screenshots 2 s apart at rest are identical).
2. Scrolling moves the signal from Inputs to Intelligence while the camera moves in, then to Application while the camera opens out. Labels and type follow.
3. Stopping holds the exact frame: the canvas pixels and DOM transforms are identical 1 s later.
4. Scrolling back to an earlier position restores that earlier frame (the same pixels for the same scroll position and theme).
5. The sticky sequence ends and Work follows naturally. `#work`, Skip to Work, View Work and the navigation anchors all land correctly.
6. Toggling the theme mid-sequence keeps `scrollY` and `p`.
7. No horizontal overflow and readable contrast at 320, 360, 390, 768, 1024, 1440 and 1920 px, plus short landscape, in both themes.
8. Reduced motion, a short screen, 200 % text, no WebGL and context loss all give the still layout with every piece of content and every action.
9. Aki's launcher canvas hash stays `769e31257e57cc48` and the smoke suite's Aki steps pass.
10. `npm test`, `eslint .` and `npm run build` pass. The smoke suite passes, with its Hero selectors updated to the new markup.
