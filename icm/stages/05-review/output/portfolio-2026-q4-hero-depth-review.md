---
run_id: portfolio-2026-q4-hero-depth
stage: 05-review
state: READY
revision: "review r3; reviewed code e52bd63"
scope: "Portfolio application implementation run: the Hero and its hand-over to Work only"
source_branch: feat/portfolio-cinematic-rework
source_commit: "ad9d1254a6c7f8c3a46d5363deac7378147c3a6b"
working_branch: feat/hero-depth-flow-type
pr_base: feat/portfolio-cinematic-rework
inputs:
  - "Stage 01 brief r1, Stage 02 spec r4, Stage 03 implementation r5, Stage 04 verification r3"
---

# Review record: Depth, Flow and Type Hero

## Reviews

| Review | Model | Result |
| --- | --- | --- |
| Spec review before implementation | Fable 5.1, high effort | 14 points. 12 were accepted, 1 was declined (pin only on large screens) and 1 was decided without asking (keep native smooth anchors). See spec r2. |
| Integrated code review | Opus 5.5, high effort | 2 medium and 2 low findings |
| Second-opinion code review | Fable 5.1, high effort | 1 high and 1 low finding. The high one is the same defect as Opus's first medium finding. |
| Visual review of the screenshots | Opus 5.5 (architecture) | 3 issues: Aki's bubble over the phone labels, a thin and shrinking composition, and a hard edge in the close-up |
| Final review of the integrated source | Opus 5.5 (architecture) | No open finding |

## Findings and fixes

| ID | Finding | Fix | Retest |
| --- | --- | --- | --- |
| R1 | The fit check measured parts whose size changed with the mode (the cue) and with progress (the "Now" marker). With 16 px of hysteresis, the mode could flip back and forth and call `scrollBy` repeatedly. | Both parts now always keep their space. Hysteresis is 48 px. | 104 configurations, no flips and no `scrollBy` calls |
| R2 | The scroll compensation added to the browser's own scroll anchoring, so the page could move twice | Work's position is read before and after the flip, and only the remainder is corrected | Within 0.2 px |
| R3 | A change in pixel ratio alone did not refit the canvas | A re-arming resolution media query | Emulated, PASS |
| R4 | A throw after the studio was created leaked the WebGL context | `try` / `catch` releases the studio, and dispose forces context loss | Source review |
| R5 | After context loss the scene kept rendering into a hidden canvas | The scene is torn down on loss | Draw count unchanged after loss |
| V1 | Aki's greeting bubble covered the phone cue and the last stage description | Phone order changed to copy, cue, labels, art, then Skip at the left | No intersections at 390 and 412 px |
| V2 | The scene was a thin strip at the overview, and the end view was only a smaller overview | Raised, turned overview camera and an end view centred on Application. New framing tests. | Contact sheets and tests |
| V3 | The close-up cut off hard at the art column's left edge | A static 12 % left-edge fade | Screenshot |

## Acceptance

- **The brief is met**, with the deviations recorded in Stage 03:
  - still at load, driven only by native scroll, an exact hold, and reverse restoring;
  - Inputs, Intelligence and Application told by camera, route, labels and type together;
  - a still layout for every fallback case;
  - Aki unchanged.
- **Content stays within approved public facts.** The headline and supporting line are the owner's approved copy. The stage descriptions are conceptual, and no metric, client or outcome was added. The scene shows no product or brand; its only text is the stage labels and "AI".
- **The `design-preferences.md` Hero rule** "no second long pin" is superseded by the owner's brief for this run, and is noted in that file.

## Reference rebuild review (r2)

The architecture model reviewed the scene against the owner's image at p = 0 in both themes, and contact sheets at p = 0 to 1. The composition matches. Two issues were found and fixed in `758f14d`:

- in the light theme the signal sat on the "AI" text during the close-up;
- cut-off scene-label fragments showed at the frame edge as the camera moved in.

No other finding is open.

## Release handoff

- The branch is `feat/hero-depth-flow-type`. Its proposed base is `feat/portfolio-cinematic-rework` (draft PR #16).
- **Human approval is required before merge.** No merge or deployment was done.
- **Real-device testing is still open**: an iPhone and an Android phone at their default text size, and a desktop GPU.

## Owner follow-ups (r3)

The architecture model reviewed the zoom-out, the Aki replay, the refresh fix and the label fade (Stage 03 r5) against the verification in Stage 04 r3.

- **Zoom-out:** deterministic, continuous across beats, and framed at all four tested aspect ratios.
- **Aki replay:** the change is in the Work scene (`workScene.js`, `SceneCanvas.jsx`), made at the owner's request. It touches only when the assembly intro restarts. Aki's appearance, launcher, chat, services and Worker are unchanged.
- **Refresh flash:** fixed without removing the no-JavaScript content.
- **Label fragments:** fixed at the root (a frame-edge fade) rather than by tuning one progress value.

No finding is open. The release handoff above still applies: human approval before merge, and real-device testing still open.
