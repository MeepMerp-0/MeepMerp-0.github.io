# ICM agent entry

This file applies to work inside `icm/`. Read [CONTEXT.md](CONTEXT.md) to route a request, then read only the selected stage contract and its listed inputs. For implementation in sibling `src/`, `worker/`, or release files, the repository root must explicitly instruct the agent to read this file; an `icm/AGENTS.md` does not automatically govern sibling paths.

Use the [development model routing policy](shared/model-routing.md) for role authority, reasoning effort, security, verification, and release boundaries. The [run contract](shared/run-contract.md) defines evidence and status. Do not infer completion from a file's existence or claim a check that was not run.

This workspace is Markdown guidance and reviewable artifacts. It does not execute stages, install tools, modify the portfolio, or authorize merge or deployment by itself. Stay within the task's granted scope and existing repository instructions.
