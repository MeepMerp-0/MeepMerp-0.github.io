# Run and artifact contract

## Run identity

Give each effort a stable, filesystem-safe `<run-id>` (lowercase letters, digits, hyphens). Keep the same ID across all five stage artifacts. Record the goal, scope, branch/revision inspected, date, and artifact owner. A new run can fork from an earlier one, but must name the exact prior artifacts it used.

## Branch workflow

For a **future portfolio implementation**, verify repository `MeepMerp-0/MeepMerp-0.github.io`, preserve unrelated/dirty work, fetch the latest remote references, and confirm `origin/docs/icm-portfolio-workspace`. Record its exact fetched commit before creating a **new** feature branch directly from that commit. Prefer `feat/portfolio-cinematic-rework`; if that name exists, choose a unique suffix instead of reusing, resetting, or overwriting it. Use an isolated worktree where needed. Do not silently substitute `main`, a stale local base, or the current unrelated branch if the required base is unavailable.

Create the feature branch once per new run, before its application stage artifacts are written. Later stages and resumed work verify and continue on that SAME run's branch and recorded base, preserving existing handoffs. A direct stage entry may create the branch only if the run has none yet. Never take over unrelated work, recreate the branch at Stage 03, or silently repin/rebase because the remote docs branch advanced; assess affected inputs as stale and record any deliberate reconciliation.

Keep application work and its related ICM artifacts on that new feature branch. Its draft PR targets **`docs/icm-portfolio-workspace`**, with the actual feature branch as compare. Do not commit/push application changes directly to the documentation base or `main`, force-push unrelated work, merge, or deploy without the applicable authorization. Reinspect repository workflows before triggering remote actions.

**Documentation-only maintenance is a distinct task.** The user may explicitly authorize updating `docs/icm-portfolio-workspace` directly, as for this requirements synchronization. That permits reviewed ICM Markdown changes and updating the existing documentation PR; it does not authorize application changes, main-branch writes, a merge, or deployment. Record the actual maintenance scope and baseline instead of falsely claiming a feature implementation ran.

Before any public push, PR, upload, or attachment, apply the [public disclosure boundary](demo-boundary.md#build-and-export-boundary). Use an expected-head check for remote updates; if the branch moved, read and preserve the new work before retrying. A documentation PR to `main` and a future implementation PR to the documentation branch have different bases; do not retarget an existing PR merely to make their names match.

## Artifact metadata

Each stage handoff begins with a compact metadata table or YAML header recording: `run_id`, `stage`, `state`, `revision` (artifact revision or commit), `inputs` (paths plus revisions), `evidence` (source/test references), `owner`, `updated`, `open_decisions`, and `blockers`. Also record `scope`, `source_branch`, `source_commit`, `working_branch`, and `pr_base` so lineage and maintenance/implementation intent are reviewable. Use `NOT TESTED` and a reason for checks that did not run. Distinguish user-confirmed facts, repository facts, observations, and proposals. A link to a file alone is not evidence of its behavior.

For demo work, apply the [public/private evidence tiers](demo-boundary.md#public-and-private-evidence): private source paths, repository identifiers, URLs, revisions, raw scans, and inspection notes stay in operator-held evidence outside the public checkout, build, export, PR, and logs. Public artifacts use source aliases and safe evidence IDs, plus hashes/revisions of **public** inputs and outputs. This exception overrides any instruction here or in a stage template to put every source path or revision in public metadata. Never manufacture a private revision to fill a field.

## Task records

For implementation and other bounded work, record task ID and description; priority/risk; assigned development model and actual reasoning effort or substitution; dependencies; owned files; deliverable; observable acceptance criteria; verification procedure and evidence; status; and blockers. Keep one owner per shared file. Scale the record to the risk: a small doc correction can be one task, while UI, content, Worker, and verification may need separate tasks. [Model routing](model-routing.md#development-orchestration) owns role boundaries.

## Human edits and stale inputs

A human may edit any output artifact before the next stage. Read the current artifact, not an earlier cached version. Record its public revision or hash in the consumer's `inputs`; use the [private evidence tier](demo-boundary.md#public-and-private-evidence) for private source provenance. When an upstream artifact changes, mark affected downstream artifacts `STALE`, identify which claims/contracts changed, and recheck only the impacted portions before returning them to `READY` or `COMPLETE`. Preserve the human edit and explain any conflict; do not silently overwrite it. Shared references guide stages but do not depend on a particular run's outputs.

## Status

Use `DRAFT` for work in progress, `READY` for a reviewable stage handoff with open decisions made explicit, `COMPLETE` only when its acceptance checks and required evidence are recorded, `BLOCKED` for a missing decision or capability that prevents progress, and `STALE` when an input revision changed. `NOT TESTED` belongs to a verification item, not an artifact state. File presence never implies completion. For a status request, inspect the latest metadata and evidence for the named run; report completed, ready, stale, and blocked work and the next bounded action.

For demos, `NOT TESTED` on a release gate blocks public-export readiness under the [demo release decision](demo-boundary.md#release-decision). Continue independent work and record the missing observation; neither a successful build nor a static scan closes that gate.

For documentation-only maintenance, validate content, links/anchors, scope, policy identity, and disclosure. Keep implementation stage outputs empty unless an actual scoped run generated evidence. Do not manufacture application/browser/WebGL/theme/Aki/provider results or mark the portfolio implementation complete because its instructions were updated.

## Checkpoints and authority

Use reviewable artifacts to surface choices and findings. Continue work already authorized; do not impose a pause at every stage. Ask for a decision only when a material unresolved choice blocks the next action. Follow the repository's PR template and [model routing](model-routing.md#final-review-and-release) for review authority. Merge, push to `main`, production deployment, and messages to others require their applicable authorization; a stage handoff is not that authorization.

## Path conventions

Stage directories are fixed: `stages/01-strategy-content`, `stages/02-specification`, `stages/03-implementation`, `stages/04-verification`, and `stages/05-review`. Write respectively `output/<run-id>-brief.md`, `output/<run-id>-spec.md`, `output/<run-id>-implementation.md`, `output/<run-id>-verification.md`, and `output/<run-id>-review.md` within them. Keep outputs as run-specific working artifacts. Put stable policy and source pointers under `shared/` or `references/`, without links back into stage outputs.
