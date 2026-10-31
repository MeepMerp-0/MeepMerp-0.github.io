# 01: Strategy and content

## Purpose

Turn the confirmed portfolio direction and permitted evidence into one run-specific creative brief. Keep proposals distinguishable from confirmed facts. The brief guides specification; it does not authorize implementation or publication.

## Inputs

| Source | File / location | Section / scope | Why |
| --- | --- | --- | --- |
| Current authorization | Current user request or referenced issue | Authorized scope and constraints only | Keep this run tied to the requested work without adding a standing document. |
| Portfolio strategy | [portfolio-strategy](../../shared/portfolio-strategy.md#confirmed-goals), [hiring target](../../shared/portfolio-strategy.md#hiring-target), [audiences and markets](../../shared/portfolio-strategy.md#audiences-and-markets), [positioning](../../shared/portfolio-strategy.md#positioning), [success measures](../../shared/portfolio-strategy.md#success-measures), [open decisions](../../shared/portfolio-strategy.md#open-decisions) | Named sections only | Set the audience, outcome, priorities, and unresolved choices. |
| Design direction | [design-preferences](../../shared/design-preferences.md#confirmed-direction), [Aki preservation](../../shared/design-preferences.md#aki-preservation), [proposed defaults](../../shared/design-preferences.md#proposed-defaults) | Named sections only | Shape the experience and retain Aki in the concept. |
| Public proof | [INNERCIRCLE](../../shared/proof-register.md#innercircle), [Aki](../../shared/proof-register.md#aki), [evidence rules](../../shared/proof-register.md#evidence-rules) | Named sections only | Limit claims to approved evidence. |
| Run rules | [run identity](../../shared/run-contract.md#run-identity), [artifact metadata](../../shared/run-contract.md#artifact-metadata), [human edits and stale inputs](../../shared/run-contract.md#human-edits-and-stale-inputs), [checkpoints and authority](../../shared/run-contract.md#checkpoints-and-authority) | Named sections only | Name the run, track sources, and handle steering. |
| Development policy | [role and reasoning baseline](../../shared/model-routing.md#development-model-routing), [adviser](../../shared/model-routing.md#adviser) | Opening and adviser section only | Apply canonical role routing and creative second-opinion guidance. |
| Source provenance | [source and adaptations](../../references/source-and-adaptations.md) | Full file | Identify source limits and adaptation status. |

## Process

1. Choose the run ID and read only the listed sections. Record the source revisions and relevant human edits using the [run contract](../../shared/run-contract.md#artifact-metadata).
2. Frame the visitor journey around the confirmed hiring outcome while leaving the secondary audiences visible. Map each proposed section to a visitor question, an evidence source, and a desired action.
3. Describe the chosen premium cinematic direction, including where scroll-driven 3D or pinned transitions earn their place. Preserve accessibility and reduced-motion support; propose concrete mobile natural-scroll and reduced-motion scene treatments for specification. Apply the [adviser guidance](../../shared/model-routing.md#adviser) to the major visual direction and motion tradeoffs.
4. Place INNERCIRCLE only at its permitted public summary level. Use Aki as a discoverable part of the journey; distinguish verified capabilities from desired refinements. Flag missing evidence as an open decision.
5. Present the brief, claim limits, and meaningful design tradeoffs at a creative checkpoint. Incorporate steering within existing authority; record unresolved decisions rather than inventing facts.
6. Run the audit below before saving the selected run's brief from the [template](references/artifact-template.md). A blocked or draft brief may state unmet criteria, but cannot claim completion.

## Checkpoints

- **Creative:** Show the proposed hierarchy, key scenes, recruiter path, Aki entry point, mobile/reduced-motion approach, and claims requiring evidence. Apply [checkpoint authority](../../shared/run-contract.md#checkpoints-and-authority).

## Audit

- **Pass** if every substantive claim maps to the proof register or is labeled a proposal; **fail** for invented outcomes, metrics, or confidential INNERCIRCLE detail.
- **Pass** if the hiring path and secondary audiences are clear and Aki remains discoverable; **fail** if either disappears in the visual concept.
- **Pass** if the chosen direction and accessible alternatives can guide a spec; **fail** if the brief relies on effects without content purpose or leaves open choices disguised as decisions.
- **Pass** if source revisions, human edits, and status follow the run contract; **fail** if a stale draft is presented as current.

## Outputs

| Artifact | Location | Handoff |
| --- | --- | --- |
| Strategy/content brief | `icm/stages/01-strategy-content/output/<run-id>-brief.md` (generated for a selected run) | Stage 02 imports the latest human-edited version and checks its source revision. |
