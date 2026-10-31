# Run and artifact contract

## Run identity

Give each effort a stable, filesystem-safe `<run-id>` (lowercase letters, digits, hyphens). Keep the same ID across all five stage artifacts. Record the goal, scope, branch/revision inspected, date, and artifact owner. A new run can fork from an earlier one, but must name the exact prior artifacts it used.

## Artifact metadata

Each stage handoff begins with a compact metadata table or YAML header recording: `run_id`, `stage`, `state`, `revision` (artifact revision or commit), `inputs` (paths plus revisions), `evidence` (source/test references), `owner`, `updated`, `open_decisions`, and `blockers`. Use `NOT TESTED` and a reason for checks that did not run. Distinguish user-confirmed facts, repository facts, observations, and proposals in the body. A link to a file alone is not evidence of its current behavior.

For demo work, apply the [public/private evidence tiers](demo-boundary.md#public-and-private-evidence): private source paths, repository identifiers, URLs, revisions, raw scans, and inspection notes stay in operator-held evidence outside the public checkout, build, export, PR, and logs. Public artifacts use source aliases and safe evidence IDs, plus hashes/revisions of **public** inputs and outputs. This exception overrides any instruction here or in a stage template to put every source path or revision in public metadata. Never manufacture a private revision to fill a field.

## Task records

For implementation and other bounded work, record task ID and description; priority/risk; assigned development model and actual reasoning effort or substitution; dependencies; owned files; deliverable; observable acceptance criteria; verification procedure and evidence; status; and blockers. Keep one owner per shared file. Scale the record to the risk: a small doc correction can be one task, while UI, content, Worker, and verification may need separate tasks. [Model routing](model-routing.md#development-orchestration) owns role boundaries.

## Human edits and stale inputs

A human may edit any output artifact before the next stage. Read the current artifact, not an earlier cached version. Record its public revision or hash in the consumer's `inputs`; use the [private evidence tier](demo-boundary.md#public-and-private-evidence) for private source provenance. When an upstream artifact changes, mark affected downstream artifacts `STALE`, identify which claims/contracts changed, and recheck only the impacted portions before returning them to `READY` or `COMPLETE`. Preserve the human edit and explain any conflict; do not silently overwrite it. Shared references guide stages but do not depend on a particular run's outputs.

## Status

Use `DRAFT` for work in progress, `READY` for a reviewable stage handoff with open decisions made explicit, `COMPLETE` only when its acceptance checks and required evidence are recorded, `BLOCKED` for a missing decision or capability that prevents progress, and `STALE` when an input revision changed. `NOT TESTED` belongs to a verification item, not an artifact state. File presence never implies completion. For a status request, inspect the latest metadata and evidence for the named run; report completed, ready, stale, and blocked work and the next bounded action.

For demos, `NOT TESTED` on a release gate blocks public-export readiness under the [demo release decision](demo-boundary.md#release-decision). Continue independent work and record the missing observation; neither a successful build nor a static scan closes that gate.

## Checkpoints and authority

Use reviewable artifacts to surface choices and findings. Continue work already authorized; do not impose a pause at every stage. Ask for a decision only when a material unresolved choice blocks the next action. Follow the repository's PR template and [model routing](model-routing.md#final-review-and-release) for review authority. Merge, push to `main`, production deployment, and messages to others require their applicable authorization; a stage handoff is not that authorization.

## Path conventions

Stage directories are fixed: `stages/01-strategy-content`, `stages/02-specification`, `stages/03-implementation`, `stages/04-verification`, and `stages/05-review`. Write respectively `output/<run-id>-brief.md`, `output/<run-id>-spec.md`, `output/<run-id>-implementation.md`, `output/<run-id>-verification.md`, and `output/<run-id>-review.md` within them. Keep outputs as run-specific working artifacts. Put stable policy and source pointers under `shared/` or `references/`, without links back into stage outputs.
