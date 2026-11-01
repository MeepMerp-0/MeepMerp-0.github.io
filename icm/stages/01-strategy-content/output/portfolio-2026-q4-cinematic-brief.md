---
run_id: portfolio-2026-q4-cinematic
stage: 01-strategy-content
state: READY
revision: brief r3
scope: "Portfolio application implementation run (not documentation maintenance)"
source_branch: docs/icm-portfolio-workspace
source_commit: "297138f73fabccee5c90df7d153159ffc7a36140 at run creation; reconciled to 6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8, then to 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6, on user request (see Stage 03)"
working_branch: feat/portfolio-cinematic-rework
pr_base: docs/icm-portfolio-workspace
inputs:
  - "Current authorization: master implementation prompt plus the Three.js and motion addendum (user, 2026-11-01)"
  - "icm/shared/* and icm/setup/profile.md at source commit 297138f73fabccee5c90df7d153159ffc7a36140, rechecked in r2 against 6a2c204027abc6fa0cb58dcb36a19ae7e23e97d8 (no brief claim changed) and in r3 against 98a55dc7bda6dcf3c72b416eb28e7fdf1e656db6, which makes a lightweight real Three.js Hero a requirement; r3 replaces the CSS-only Hero direction and renames the secondary action to Contact"
  - "src/data/portfolioData.js, src/data/akiFaq.js, public/aki-legal.html, index.html at 297138f"
evidence: "Public repository files at 297138f; no private source was inspected for this run"
owner: "Opus 5.5 (architecture authority) for Jason Selerio"
updated: 2026-11-01
open_decisions:
  - "Aki's quick answer still names the full-time target as 'AI / Automation Engineer' (AVAILABILITY in portfolioData.js, read by Aki). The new About copy says 'full-time AI or software engineering roles'. Changing AVAILABILITY would change Aki's answers, so it is left for an owner decision."
  - "index.html SEO description and JSON-LD are unchanged; a later content pass may align them with the new hero copy."
  - "Whether to show the word 'mid-level' publicly. This brief targets mid-level roles in tone and evidence but does not print a seniority label."
blockers: []
---

# Strategy and content brief: cinematic rework

## Branch and source

- Source branch `docs/icm-portfolio-workspace`, fetched commit `297138f73fabccee5c90df7d153159ffc7a36140`.
- Working branch `feat/portfolio-cinematic-rework`, created from that exact commit (the preferred name did not exist).
- The application code at the source commit matches `main` at `2e124d7` (the source branch adds only `icm/`).

## Visitor objective and audience

Primary outcome (confirmed by user): interview invitations for full-time engineering roles, on-site or hybrid in the UAE or remote with international teams. Primary visitors are recruiters and technical hiring managers; founders, operations leaders, and agencies are secondary and find the freelance and partnership paths in Contact. No market ranking is implied.

## Content hierarchy and journey

| Section / scene | Visitor question | Message and public evidence | Intended action | Aki or navigation role |
| --- | --- | --- | --- | --- |
| Hero | Who is this and what does he build? | Name, "AI & Full-Stack Engineer", Abu Dhabi (portfolioData `PERSONAL`), headline about agentic AI workflows and full-stack business applications | View Work (primary), Contact (secondary) | Aki launcher stays bottom-right, unobstructed; the Hero sculpture is separate from the robot |
| Work: Aki | Can he ship an AI product end to end? | Public Aki record: Worker keeps keys off the site, answers from portfolio content, provider fallbacks, Turnstile and region-aware rules | Ask the real Aki; read the public Worker source | Real launcher is the demo |
| Work: INNERCIRCLE | What is he doing now? | Existing high-level summary only: real estate operations platform and agentic AI work with scoped API access, human approval, RBAC, audit trails | Ask about the work by email | none |
| Work: Timekeeping, Payroll & Attendance | Can he build business systems across web and mobile? | Capstone record: lead developer and project leader, web and mobile attendance and payroll system, public site link | Open the fictional demo | none |
| Work: FuturoHub | Does he deliver client web work? | Freelance web development record and public site links | Visit the live sites; open the fictional website illustration | none |
| About | What is he like to work with, and where? | `ABOUT_STORY`, `EXPERIENCE`, location, confirmed arrangements | Contact | none |
| Process | How does he work? | Four steps: Understand, Shape, Build, Verify (user-specified) | Contact | none |
| Contact | How do I reach him for my reason? | Existing contact backend and public email, WhatsApp, GitHub | Send a message with the right intent | Aki remains available |

Everything a recruiter needs (role, focus, four projects, contact) is readable in the DOM without waiting for or interacting with motion.

## Visual and interaction direction

Premium Cinematic (confirmed): warm charcoal, ivory type, champagne gold in dark; warm ivory, dark ink, bronze in light. Restrained glass and metal, strong serif display type, generous but not empty spacing.

- **Work (selected 3D moment):** a pinned stage where scrolling drives a Three.js scene (four independently authored geometric sculptures, camera path, light blend) in sync with DOM project panels and chapter indicators. Releases into About.
- **Mobile:** natural article flow with a compact sticky Three.js strip that follows the article in view; if the viewport is short, static emblems only.
- **Reduced motion or no WebGL:** ordinary article flow with static vector emblems; no scroll-scrubbed movement.
- **Hero (required since 98a55dc):** a lightweight real Three.js sculpture (metal slab, glass pane, rings, orb) sharing Work's Three.js integration. It loads after the page has loaded, so title, role and actions are readable first, and a CSS version of the same sculpture stays as the placeholder and the no-WebGL fallback. It never uses or resembles Aki's robot.
- About, Process, Contact: restrained `motion` entrances and state transitions.

## Claims and evidence limits

| Proposed claim | Source | Supportable wording | Restriction |
| --- | --- | --- | --- |
| Aki answers from portfolio content via a Worker | `PROJECTS.aki`, `public/aki-legal.html` | As in the record | No live-availability, cost, privacy-compliance, or provider-tested claims |
| INNERCIRCLE work | `PROJECTS['innercircle-operations']`, `EXPERIENCE[0]` | High-level summary only | No screenshots, diagrams, architecture, workflows, metrics, or new outcomes |
| Payroll processing "5+ days to instant" | `PROJECTS.thesis.metrics` | Existing public record of the capstone | The fictional demo must not imply real payroll, statutory accuracy, tax compliance, or biometric capability |
| FuturoHub sites | `PROJECTS['futurohub-sites']` | Freelance web work, public links | Fictional illustration must not resemble or claim to be the client site |
| Work arrangements | User-confirmed in the current authorization | "On-site or hybrid in the UAE, or remote with international teams" | No visa or availability-date claims |

## Demo brief

| Alias | Capability | Fictional behaviour | Labels |
| --- | --- | --- | --- |
| `payroll-web` / `payroll-mobile` | Business systems across web and mobile | Invented roster, Mon–Fri attendance states, preset rate, illustrative totals, simulated check-in at invented sites, Reset | Fictional data · Local interaction only · No real action |
| `futurohub` | Client web delivery | Invented business site with in-page navigation, preview-width control, local form validation, simulated confirmation, Reset | Fictional website · Local interaction only · No real action |
| `innercircle` | none | Abstract scene only; interactive concept omitted | n/a |
| `aki-portfolio` | none | No walkthrough; the real Aki is used | n/a |

No private source mapping was supplied or used; both demos are authored from public concepts only.

## Creative checkpoint and open decisions

The user pre-authorized continuation between stages. Decisions taken within scope: INNERCIRCLE concept omitted, demos in sandboxed iframes inside a native dialog. The r2 choice of a CSS-only Hero was superseded by the owner's 98a55dc requirement for a real Three.js Hero. Open decisions are listed in the metadata.

## Audit result

- Claims map to the proof register or are labelled proposals: **pass**.
- Hiring path, secondary audiences, and Aki discoverability: **pass**.
- Direction has accessible alternatives that can guide a spec: **pass**.
- Revisions and status follow the run contract: **pass**.
- Demo entries carry alias, public facts, fictional scope, and no private provenance: **pass**.
