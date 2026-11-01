---
run_id: portfolio-2026-q4-cinematic
stage: 04-verification
state: READY
revision: "verification r6; scene realignment tested at 1d801de363a97406ab3ce1fee2808abf98e6d158; earlier rows at d630305 or 06d2e1d, as marked"
scope: "Portfolio application implementation run (not documentation maintenance)"
source_branch: docs/icm-portfolio-workspace
source_commit: "297138f73fabccee5c90df7d153159ffc7a36140 at run creation; reconciled to 6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8, then to 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6, on user request"
working_branch: feat/portfolio-cinematic-rework
pr_base: docs/icm-portfolio-workspace
inputs:
  - "icm/stages/02-specification/output/portfolio-2026-q4-cinematic-spec.md (spec r3)"
  - "icm/stages/03-implementation/output/portfolio-2026-q4-cinematic-implementation.md (implementation r2)"
evidence: "Commands and procedures below; raw logs and screenshots are operator-held local files, not committed"
owner: "Opus 5.5 (architecture authority)"
updated: 2026-11-01
open_decisions: []
blockers: []
---

# Verification record: cinematic rework

## Scope and environment

- **Tested revision.** `d630305a278d763e88db20cf3306eb81f5837468`, built with `npm run build` and served by `vite preview` on `127.0.0.1:4173`. That address is used for local checks only and is not published.
  - Rows marked `06d2e1d` ran one commit earlier. The only difference is that the Hero follows reduced-motion changes live (`d630305`), which those rows do not exercise.
  - Revision r1 of this record tested `a0b64cc`, before the rebase onto `98a55dc`, the Three.js Hero and the review fixes. Every row below was rerun after them.
- **Machine.** WSL2 Linux, Node 26.
- **Browser.** Headless Chromium 1248, driven over the DevTools protocol. It runs with `--disable-gpu`, so WebGL uses the SwiftShader software renderer. No physical phone, tablet, GPU or touch screen was used.
- **Controlled network.**
  - The site's own browser probes block and log every request that is not to `127.0.0.1`.
  - Contact submissions are answered locally with chosen responses.
  - The built Aki configuration points at a local development Worker origin, which these probes also blocked.
  - The existing `scripts/verify-scroll-preview.mjs` uses its own mocks.
  - No production AI, Worker or contact backend was contacted, and no message was sent.
- **Toolchain change during the run.** While the final smoke suite was running, a process outside this run ran `npm install` and `npm run dev` in the checkout. That rewrote `package-lock.json` (development and platform sub-dependencies only) and replaced `dist/`.
  - The application source was unchanged.
  - All probes in this record ran on fresh builds with the installed toolchain.
  - The lockfile change is not part of this branch.
- **Baseline.** All of these were recorded at `297138f` before any change:
  - `npm test`: 269/269.
  - `eslint .`: clean.
  - `npm run build`: passed.
  - `scripts/verify-scroll-preview.mjs`: passed, 43 Aki steps.
  - Robot reduced-motion canvas hash: `769e31257e57cc48`.
  - sha256 of 64 Aki, Worker and data files.
- **Greeting bubble baseline.** `98a55dc` built in a temporary worktree with the same local configuration, served on another local port, then removed.

## Observed evidence

| Acceptance / risk | Command or procedure | Runtime environment | Revision | Expected | Observed result | Evidence location | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Unit tests | `npm test` | Node 26 | d630305 | all pass | 270/270 pass (baseline 269 + `purposeForIntent`) | local log | PASS |
| Lint | `./node_modules/.bin/eslint .` | Node 26 | d630305 | no problems | no output (clean) | local log | PASS |
| Production build | `npm run build` | Vite 8 | d630305 | builds, no source maps | main JS 454.4 kB (150.9 kB gzip), CSS 40.7 kB (9.3 kB gzip); lazy chunks: shared Three.js studio 547.7 kB (136.7 kB gzip), `workScene` 4.1 kB, `heroScene` 1.4 kB; 0 `.map` files; Vite's >500 kB warning applies to the lazy studio chunk | local log | PASS |
| Existing smoke suite incl. Aki flows | `CHROME_BIN=… node scripts/verify-scroll-preview.mjs` against preview | Chromium 1248 | d630305 | passes unchanged | "All scroll and screenshot smoke checks passed.", exit 0: all 43 Aki steps ok, 9 responsive profiles, 25 screenshots, reduced-motion captures included | local log | PASS |
| Robot visual parity | robot canvas hash + launcher rect + computed style chain, reduced motion | 1440×900, 768×1024, 390×844 × dark/light | d630305 | identical to baseline | hash `769e31257e57cc48` and launcher rect identical in all 6 cases; style chain JSON identical | local probe output | PASS |
| Aki functional files | `sha256sum -c` of 64 baseline hashes | — | d630305 | only expected files differ | 62/64 identical; `package.json` and `package-lock.json` differ only by adding `three` | local log | PASS |
| Viewport × theme matrix | Load; scroll to hero, mid-Work, About, Process, Contact; measure horizontal overflow, overlapping controls, controls under the Aki launcher; console errors; external request attempts | 320×700, 360×780, 390×844, 768×1024, 820×1180, 1024×768, 1440×900, plus 844×390, 1440×600, 720×450 (≈1440×900 at 200 % zoom), each dark and light | d630305 | no overflow, no errors, no collisions | horizontal overflow 0, console errors 0, external request attempts 0 in all 20 runs; modes: strip ≤ 820 px wide, pinned at 1024×768 and 1440×900, strip at 1440×600, static at 844×390 and 720×450. Overlap hits were reviewed: content scrolled under the opaque sticky header, controls passing under the fixed Aki launcher mid-scroll (as in the baseline), and closed `<details>` sample links that Chrome lays out but does not show; opening them at 900, 1024 and 1440 keeps them inside the panel's own scroll area, with every chapter button still the hit target | local screenshots | PASS |
| Hero actions vs Aki launcher | Measure hero button and launcher rectangles at load | 320, 360, 390, 430 wide | d630305 | no overlap | View Work and Contact clear of the launcher at all four widths | local probe output | PASS |
| Hero Three.js rendering | Load; record status, Hero chunk start relative to `loadEventEnd`, FCP, WebGL draw calls per canvas while the Hero is visible, after scrolling 200 px, and while scrolled offscreen; headline/art overlap; overflow; screenshots | 320×700, 360×780, 390×844, 768×1024, 820×1180, 1024×768, 1440×900, plus 1440×600 and 844×390, each dark and light | d630305 | real render after load, text first, suspended offscreen | all 18 runs `ready`; chunk requested 108–954 ms after (all 22 runs) `loadEventEnd`; FCP 240–388 ms; 59 draw calls for the first frame, 7 after scrolling inside the Hero, 0 while offscreen; art never overlaps the headline; overflow 0; no exceptions; View Work and Contact present. Screenshots reviewed in both themes: metal, glass and lit depth, sculpture beside the copy on wide screens and above it on narrow ones | local probe output, screenshots | PASS |
| Hero reduced motion and no WebGL | Same probe with `prefers-reduced-motion: reduce`, and with WebGL disabled | 1440×900 dark, 390×844 light | d630305 | one still frame; readable fallback | reduced motion: `ready`, first frame drawn, 0 draws on scroll. WebGL disabled: `failed`, 0 draws, CSS sculpture shown, text and actions present | local probe output | PASS |
| Live reduced-motion switch | Toggle emulated `prefers-reduced-motion` on, then off, without reload | 1440×900 | d630305 (Hero), 06d2e1d (Work) | both scenes follow the setting | Work: pinned → static → pinned. Hero: scene rebuilt twice (still frame, then scroll-driven), status `ready`, no exceptions | local probe output | PASS |
| Greeting bubble parity | Computed colour, background, font family, size and weight, border colour, radius, shadow and padding of `.aki-bubble` and its children, compared with a baseline build of `98a55dc` | 1440×900, 390×844 × dark/light, reduced motion | 06d2e1d | identical | identical in all 4 cases | local probe output | PASS |
| Work mode selection | Load at each size and read the mode | 1440×900, 1024×768, 1024×1366, 900×1000, 390×844, 844×390 | 06d2e1d | pinned only on wide stages | pinned, pinned, strip, strip, strip, static | local probe output | PASS |
| Chapter jump announcement | Observe the live region and `aria-current` while jumping from chapter 1 to 4 | 1440×900 | 06d2e1d | only the destination | live region changed once, to "Project 4 of 4: FuturoHub Web Experiences"; `aria-current` changed once, to 04 | local probe output | PASS |
| Strip-mode keyboard focus | Tab through every focusable item in the project articles | 390×844, 320×700, 768×1024 | 06d2e1d | focus visible below the sticky scene band | 10 items per width; every one below the band and inside the viewport | local probe output | PASS |
| Embedded demo theme | Saved dark theme; open a demo | 1440×900 | 06d2e1d | demo follows the page theme | iframe `color-scheme: dark`, page `data-theme="dark"`; screenshot reviewed | local probe output | PASS |
| "Ask Aki now" with the panel open | Click once to open the panel, then again | 1440×900 | 06d2e1d | second click focuses the panel | first click opens the panel with focus inside; second click moves focus to `#aki-panel`. The panel's region request to the local development Worker was blocked by the probe | local probe output | PASS |
| Work pin, scrub, reverse, release | 70 wheel steps down then 70 up through the track | 1440×900 | 06d2e1d | stage held under header during track; chapter follows scroll both ways; About follows | stage `top` stayed at the 73 px header for the full track and moved away after it; chapter advanced Aki → INNERCIRCLE → Timekeeping → FuturoHub and returned in reverse; after the track the stage bottom and About top coincided (600/600) | local probe output | PASS |
| Idle hold, no handler writes | Stop at 40 % of the track, wait 1.5 s | 1440×900 | 06d2e1d | scroll position, chapter and canvas centre pixel unchanged | all three unchanged; page rAF still running (62 frames/s), so the hold is not a freeze | local probe output | PASS |
| Chapter controls | Focus a chapter button, press Enter / Space; click | 1440×900 | 06d2e1d | moves to that chapter, keeps focus, announces | Enter on 03 → Timekeeping, Space on 04 → FuturoHub, click 01 → Aki; `aria-current` and live text ("Project 3 of 4: …") followed; focus stayed on the button | local probe output | PASS |
| Skip link and deep links | Enter on "Skip to About"; fresh loads of `#work`, `#about`, `#process`, `#contact` | 1440×900 | 06d2e1d | land below sticky header | all land at 73 px = measured header height | local probe output | PASS |
| Theme toggle mid-Work | Toggle at 62 % of the track with a typed contact draft | 1440×900 | 06d2e1d | no reset or remount | same scroll position and chapter; same canvas, Aki root and launcher nodes (no remount); contact draft kept; scene still ready | local probe output | PASS |
| Resize across modes | Live resize 1440→1100→800→390→844×390→1440 without reload | Chromium | 06d2e1d | mode adapts, no overflow | pinned → strip → strip → static → pinned; overflow 0 throughout; scene ready again when returning to pinned | local probe output | PASS |
| WebGL unavailable | Launch with `--disable-webgl --disable-3d-apis` | 1440×900, 390×844 | d630305 | readable fallback, no errors | Work uses static mode (all four articles with vector emblems, no canvas); Hero status `failed` with the CSS sculpture; title, role, View Work and Contact present; no exceptions | local probe output | PASS |
| Context loss | `WEBGL_lose_context` on the Hero canvas, then on the Work canvas | 1440×900 | d630305 | text and actions stay; fallback replaces canvas | Hero: status `failed`, canvas hidden, CSS sculpture visible, both actions present. Work: status `failed`, canvas hidden, emblem shown, mode still pinned with its panels and controls. No exceptions | local probe output | PASS |
| Reduced motion | `prefers-reduced-motion: reduce` | 390×844, 1440×900 via smoke suite | d630305 | ordinary flow, no canvas | static mode, emblems, no canvas; smoke suite reduced-motion captures pass | local screenshots | PASS |
| Performance | Load and scrub timing; long-task observer | 1440×900 unthrottled; 390×844 at 4× CPU throttle; software WebGL | 06d2e1d | measured, not assumed | 1440×900: FCP/LCP 336 ms, load long tasks 1456 ms (r1, without the Hero scene: 960 ms; with WebGL disabled: 53 ms, so most of this is scene setup under software WebGL, now for two scenes), Work scene ready 102 ms after Work enters view with 0 ms of long tasks, scrub frame median 16.7 ms, p95 66.6 ms, heap 13 MB; 390×844 at 4× CPU: FCP/LCP 552 ms, load long tasks 1812 ms, Work scene ready 125 ms, scrub median 33.3 ms, p95 50 ms, heap 9 MB. JS transfer (gzip): main 146 kB, shared studio 133 kB, Work scene 2 kB, Hero scene 1 kB. The Hero chunk starts 108–954 ms after `loadEventEnd` (Hero row), so first paint does not wait for it. All figures are software-rendered and not representative of GPU devices | local probe output | MEASURED |
| Contact | Controlled answers for every POST (none reaches a backend) | 1280×900 | 06d2e1d | truthful states, one request per submit | empty submit: inline errors and no request. Pending: button disabled and `aria-busy`. Double click sent one POST. HTTP 500 and an Apps Script `{"success":false}` both show the failure message with email fallback. "Message sent." only after a `{"success":true}` answer. Intent fills purpose but keeps typed text. | local probe output | PASS |
| Aki chat presentation | Open panel (consent step) in both themes | 1440×900, 390×844 | 06d2e1d | in bounds, readable, controls reachable | panel 372×554 desktop, full-width mobile; all controls inside viewport; screenshots reviewed in both themes | local screenshots | PASS |
| Aki chat with on-screen keyboard | Viewport shrunk to 390×450 with panel open | emulated | 06d2e1d | controls reachable | panel caps at 80dvh and its body scrolls internally (same geometry rule as before the rework); a real keyboard was not used | local screenshot | PASS (emulated); real device NOT TESTED |
| Contrast | WCAG ratio of theme token pairs | computed | a0b64cc (tokens unchanged at d630305) | text ≥ 4.5:1, field edges ≥ 3:1 | lowest text pair 4.60:1 (light signal on wash); muted text ≥ 6.14:1; field borders 3.35–3.66:1 dark, 3.20–3.78:1 light | computation | PASS |
| Demo direct entry | Load each demo; fill every input; press every control twice; Reset; read storage; deliberate probe `fetch` | 1280×860, 320×640, 390×844 reduced motion | 06d2e1d | only own files load; no storage; Reset restores | requests: the page's own HTML, CSS and JS only; no other attempt. Storage empty, no cookie, no service worker. Reset restores the initial content (timekeeping additionally announces "Demo reset…"). Overflow 0 at 320 px. Probe fetch refused by `connect-src 'none'`, with the violation logged. | local probe output | PASS |
| Demo embedded entry | Open from Work; attach to the out-of-process frame; same exercise | 1440×900 | 06d2e1d | sandboxed, isolated, no requests | `sandbox="allow-scripts"`, `referrerpolicy=no-referrer`. Frame origin `null`; parent unreachable (SecurityError). Storage and service worker unavailable (SecurityError). Requests: own CSS and JS only. Probe fetch blocked by CSP. Parent page made no external request. | local probe output | PASS |
| Demo dialog keyboard | Focus "Open fictional demo", press Enter; Escape from the dialog controls; Escape from inside the frame | 1440×900, both demos | d630305 | modal, Escape closes, focus returns | modal, focus moves into the dialog (Standalone); Escape from the dialog controls closes it and returns focus to the same "Open fictional demo" button. When focus is inside the demo frame, Escape does not reach the parent dialog (06d2e1d demo probe); Shift+Tab leaves the frame to the dialog controls (r1) | local probe output | PASS with limitation |
| Demo labels and claims | Read visible text | both demos | 06d2e1d | fictional / local / no real action near controls; no statutory, payment, biometric or GPS claims | labels present in toolbar and per panel; payroll text says "Not payroll, not a tax, statutory or labour calculation, and no payment is made"; check-in says no location or device data is read | local review | PASS |
| Real devices, touch, OS text-size setting | — | — | — | — | No physical devices or OS-level text scaling available in this environment | — | NOT TESTED |
| Live Aki providers, voice capture | — | — | — | — | Out of scope: no provider calls allowed; voice is covered only by the existing smoke suite's mocked steps | — | NOT TESTED (live) |
| Lighthouse | — | — | — | — | Not run; no score is claimed | — | NOT TESTED |

## Demo export and browser evidence

- **Public allowlist.** `public/demos/timekeeping/{index.html,timekeeping.css,timekeeping.js}` and `public/demos/website/{index.html,website.css,website.js}`. `npm run build` copies them unchanged to `dist/demos/`.
- **Disclosure scan.** Covered the added lines of the full changeset and the built `dist/` output, looking for local paths, private hosts, keys and tokens, environment names, internal terms and the employer's domain. Every hit was reviewed by hand:
  - The hits in the Three.js chunk are library identifiers (`scene.environment`).
  - The hits in the main chunk are existing Aki and React words.
  - The built CSP contains the Aki origin from the local `.env`, which is a development address. This is existing build behaviour, and `dist/` is not committed.
- **History.** No source maps were found, and no private file is tracked.
- **Approved destinations.** Each demo loads only its own `index.html`, `.css` and `.js`. No other request was attempted, direct or embedded.

## Scene realignment checks (072511e)

| Check | Result |
| --- | --- |
| Unit tests | 270/270 pass |
| Lint | clean |
| Build | pass, no source maps |
| Existing smoke suite (`scripts/verify-scroll-preview.mjs`, includes the Aki steps) | pass, exit 0 |
| Robot canvas hash, rectangle and style chain, 6 width and theme cases | identical to baseline (`769e31257e57cc48`) |
| Viewport and theme matrix, 20 runs | overflow 0; overlap hits are the known false positives |
| Hero probe, 18 width and theme runs plus reduced motion | ready in all WebGL runs, 0 px over the headline, 0 draws while offscreen, no errors |
| Hero without WebGL | CSS fallback (`failed` status), copy and actions present |
| Pinned screenshots, both themes, scene -0.5 to 3.5 | Aki assembles from falling pieces; each sculpture stays in frame beside the copy; no console errors; no outside requests |
| Strip screenshots, 390 x 844 | all four sculptures draw in the band; no errors |
| Chapter buttons | land on each chapter and announce it |

Follow-up at `f145246`:

| Check | Result |
| --- | --- |
| Tests | 270/270 pass |
| Lint and build | pass |
| Smoke suite | pass |
| Strip screenshots | 390 x 844 and 1024 x 1366: each sculpture fills the band without clipping |
| Timekeeping demo flow | Run at 1024 dark, 390 light and 390 with reduced motion. The steps advance through range, tap, face check and logged. Friday changes from Absent to Present and the team hours go from 118 h to 126 h. Clock-out is logged. Reset restores everything except its own "Demo reset" announcement. No errors, no overflow, no outside requests. |
| Demo isolation probe | Direct and embedded runs: CSP blocks the probe's fetch, the iframe stays sandboxed with an opaque origin, and the only requests are the demo's own files |
| Website workflow (`4a26708`) | Run at 1280 dark, 390 light and 390 with reduced motion. The form trigger and the chat trigger both reach all six steps in order and fill in the owner summary. Reset restores the page exactly. No errors, no overflow, no outside requests. Tests 270/270. |

Software WebGL only. Real GPUs and devices remain NOT TESTED.

Follow-up at `1d801de`:

| Check | Result |
| --- | --- |
| Tests, lint, build | 270/270 pass; lint clean; build passes |
| Smoke suite | Pass, after two runs that failed |
| Robot canvas hash | `769e31257e57cc48` in all 6 cases, unchanged |
| Viewport matrix | Overflow 0 |
| Hero probe | 20 WebGL runs ready, 0 px over the headline, 0 draws offscreen, no errors; the 2 runs without WebGL fall back |
| Aki intro | Nothing is drawn before the canvas is on screen. The pieces fall over about 1.6 s, then the draw count stops rising. Aki stays assembled while scrolling. |
| Pinned screenshots | 1440 x 900 in both themes, chapters 0 to 3.45. Every sculpture stays in frame, the light-theme FuturoHub board and Timekeeping floor are visible against the cream background, and there are no errors or outside requests. |
| Guard close-ups | The phone is hidden while the arm rises, appears when the arm is level, the scan runs, and the frame turns green when verified |
| Strip screenshots | 390 x 844 in both themes: all four sculptures draw in the band |

**Smoke failures.** The two failed runs stopped at "reveal was not animating" while the machine's load average was 7 to 13. The previous commit `8324804`, which had passed earlier, failed the same check under the same load, so the failure is environmental. The suite passed once load fell to about 4.

**Long tasks.** Load-time long tasks were about 3 s for both this build and `8324804` under that load. The earlier 1.46 s figure was measured on a quieter machine.

## Failures, fixes, and remaining gaps

| ID | Failure | Fix (in a0b64cc, before the rebase) | Retest |
| --- | --- | --- | --- |
| F1 | Smoke suite at 1920×1080 reported a 6 px horizontal overflow. The theme toggle's View Transition snapshot included the scrollbar gutter while it faded. | Removed the cross-fade; theme change is instant, as before the rework | smoke suite passes |
| F2 | INNERCIRCLE sculpture filled the stage at 1440 and its base was cut off at the right edge | Smaller colonnade and base | screenshots both themes |
| F3 | Full-width hero buttons ran under the fixed Aki launcher on phones | Hero buttons keep their natural width on phones | clear at 320–430 px |
| F4 | Text field borders below 3:1 | `--field-border` token for contact fields and the chat composer | computed 3.2–3.8:1 |
| F5 | Scene setup produced ~2 s of main-thread long tasks on load under software WebGL, ~1.5 s of it from reflection-map prefiltering | Reflection map generated at 64 px | 960 ms under software WebGL (see Performance) |

Integrated review findings R1–R15 and their fixes are listed in Stage 05. Their retests are the rows above (WebGL unavailable, context loss, live reduced motion, greeting bubble, Work mode selection, chapter jump, strip focus, embedded theme, "Ask Aki now"), plus the full rerun of every other row.

Remaining limits:
- Escape inside the embedded demo does not close the dialog, because the frame is cross-origin. The Close button and Shift+Tab are available.
- The matrix overlap check counts content that has scrolled under the opaque sticky header as overlapping. Every such hit was reviewed in screenshots and is not a visible collision.
- Real devices, touch and OS text scaling were not tested.

## Checkpoint and audit

- Every result names its revision (d630305, or 06d2e1d where marked) and its environment: **pass**.
- Changed behaviour has observations, or an explicit `NOT TESTED` with a reason: **pass**.
- Failures F1–F5 and review findings R1–R15 remain visible and were retested after their fixes: **pass**.
- No deployment or production service was used as validation: **pass**.
- For the demos, export and network evidence is attributable to the exact revision, and no unapproved request was attempted: **pass**.
- Ready for architecture review, within the limits above.
