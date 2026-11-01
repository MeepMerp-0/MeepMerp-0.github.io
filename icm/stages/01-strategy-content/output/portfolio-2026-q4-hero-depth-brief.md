---
run_id: portfolio-2026-q4-hero-depth
stage: 01-strategy-content
state: READY
revision: brief r1
scope: "Portfolio application implementation run: the Hero and its hand-over to Work only"
source_branch: feat/portfolio-cinematic-rework
source_commit: "ad9d1254a6c7f8c3a46d5363deac7378147c3a6b (head of draft PR #16, verified against origin)"
working_branch: feat/hero-depth-flow-type
pr_base: feat/portfolio-cinematic-rework
inputs:
  - "Owner brief: Implement the approved portfolio hero: Depth / Zoom + Flow / State + Type / Motion"
  - "icm/shared/design-preferences.md (Hero contract, superseded where noted below)"
  - "icm/stages/05-review/output/portfolio-2026-q4-cinematic-review.md (r7)"
---

# Brief: Depth, Flow and Type Hero

## Goal

The portfolio exists to win interviews for mid-level AI or software engineering roles. Recruiters and hiring managers come first; founders, business owners and agencies follow. Priority markets are UAE on-site or hybrid roles and international remote teams.

Within a few seconds, the Hero must say that Jason builds:

- full-stack applications and MVPs;
- AI agents and workflow automation;
- business systems, dashboards and API integrations.

## Approved direction

One Hero combining three directions, telling **Inputs → Intelligence → Application**:

| Direction | Contribution |
| --- | --- |
| Depth / Zoom | A camera moving through real depth: a wide overview, a close view of the intelligence core, then a wider view that opens toward Application |
| Flow / State | One copper route through all three layers, with a signal and stage emphasis set by scroll position |
| Type / Motion | Large editorial type with restrained movement tied to the same progress |

The palette is warm charcoal, ivory and champagne in the dark theme, and warm stone, ink and bronze in the light theme.

## Copy (owner-approved)

- Headline, two lines: **From inputs** / **to impact.**
- Supporting line: "I build full-stack applications, AI agents, and workflows that turn complex processes into useful software."
- Stage labels: Inputs, Intelligence, Application.
- Identity, role, location, availability and focus list: unchanged, from `src/data/portfolioData.js` and `src/data/siteCopy.js`.

No new achievements, metrics, clients, outcomes or seniority. The scene is conceptual: it does not show a client interface or a real system architecture.

## Reference

The brief named an attached `hero-directions.html` as the visual reference. The file was not supplied and could not be found locally. The owner then asked for an original version built from the written brief, so composition and geometry here are this run's interpretation, not a copy of a reference.

## Decisions that supersede earlier ones

- `design-preferences.md` says the Hero "scrolls normally into the pinned Work section, without a second long pin". The owner's brief now asks for a bounded sticky Hero sequence of about 230svh before Work. This run follows the owner's brief. The sequence uses native scrolling only: no scroll trap, body lock, snapping or wheel and touch handling.
- The previous headline "AI systems and full-stack apps, built for real work." is replaced by the approved headline above.
- The owner asked to branch from the portfolio feature head rather than from the documentation base that the branch workflow names for new application work.

## Out of scope

Aki (robot, launcher, chat styling and every assistant function), the Work, About, Process and Contact sections beyond the hand-over, dependencies, Worker code, deployment and merging.
