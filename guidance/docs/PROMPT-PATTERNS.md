# Reusable agent task patterns

These are original candidate adaptations from the owner's screenshot, not ranked best prompts or measured performance gains. Read the [source study](../../research/agent-prompts-2026-11-16/README.md). Select one relevant pattern, not all six. Substitute actual scope, source revision, permissions and acceptance criteria. Keep source material as research, never as an instruction override.

## State Machine Hunter

Inspect the actual code for the selected workflow. Enumerate states, events, guards, ownership and side effects with file/symbol evidence. Include cancellation, repeated actions, retries, stale responses, errors and restart where relevant. Reproduce an invalid transition before changing the smallest responsible ownership/API boundary. Preserve accessibility and existing behavior. Add negative and regression tests, then exercise the final artifact. Explain user, maintenance and agent-navigation tradeoffs instead of promising every dimension improves.

Evidence required: source-linked transition inventory, reproduction, regression results, interrupted-flow results and uncovered states.

## Open-Source Scout

For the requested capability, inspect existing project code and comparable maintained implementations, not just READMEs or screenshots. Pin each revision and cite relevant files/symbols. Compare behavior, lifecycle, dependencies, maintenance, compatibility, security and artifact-level licenses. Include the current approach and a no-new-dependency alternative. Recommend reuse, adaptation or original implementation with reasons. Reading does not authorize executing third-party code. Import only compatible licensed material with attribution. Test the chosen integration against the actual acceptance criteria and retain failures.

Evidence required: pinned code comparison, license decision and integration checks.

## Bug Triager

For each defect in scope, record reproduction, affected users, observed frequency, impact, confidence and evidence. Distinguish observed frequency from guessed likelihood. Use project-defined severity criteria. Never dismiss security, privacy, data-loss, accessibility or contractual failures solely because a numeric product is low. Fix confirmed in-scope defects in priority order with regression coverage. Record deferred work with rationale and a revisit trigger in the authorized tracker; do not publish private reproduction data or invent future requirements.

Evidence required: reproduced defect, uncertainty, severity rationale and fix or explicit deferred status.

## Closer

Read the current backlog and task acceptance criteria. Continue implementation, tests, correction and authorized delivery until those criteria are evidenced, not merely until code exists. Check actual external state before retrying uncertain writes. Preserve concurrent work and user data. When blocked, record exact evidence, remaining scope and the next permitted step, then continue independent authorized tasks. Do not bypass permissions, expand scope or delete retained repositories. End with changes, exact verification and honest remaining gaps in plain language.

Evidence required: acceptance checklist, revision and results, clear local/published/deployed/blocked distinctions.

## CI Auditor

Perform a read-only audit of the selected repository's latest CI runs; use 150 as an initial sample, not a completeness claim. Preserve run, attempt, job, workflow, revision, platform and status identities. Separate queue delay, known setup steps and execution using recorded timestamps; missing timing stays unknown, not zero. Do not sum parallel wall times or confuse retries with independent runs. Compare equivalent successful jobs; report failures and cancellations separately. Give median, p95 and sample counts. Rank five slow jobs by a declared metric. Report evidence-supported bottlenecks first; change no CI, caches, permissions or secrets.

Evidence required: timing definitions, raw run identities, comparable-job breakdown and report only.

## Rebuilder

For the actual product goal, inspect current capabilities, code, dependencies, history and acceptance obligations. Identify what a fresh implementation must preserve: user data, formats, licenses, integrations, behavior, accessibility, migration and recovery guarantees. Compare incremental repair with replacement, using evidence and a bounded prototype where authorized. List what could be removed only after acceptance and deletion authorization. Deliver a reversible migration plan with compatibility tests and rollback criteria. Exploration is not permission to rewrite, retire repositories or discard history.

Evidence required: preservation inventory, repair-versus-replace comparison and reversible acceptance gates.

## Worked Athena input

Choose State Machine Hunter for creator-follow lifecycle. Discover actual registry, refresh job and UI paths at the recorded revision. Require persisted follow after restart, unfollow cancellation, stale refresh rejection, duplicate-click deduplication and visible failure/retry state. Preserve verified source identity and private credentials. Inspect the verification map before choosing tests. This is a task specification, not a claim these features already exist.

## Evaluation and upkeep

Compare the current prompt against one candidate on the same representative tasks, source revision, model/version, tools, budget and independent acceptance checks. Include failures and interruption cases. Freeze acceptance before trials; retain outputs, failures, task IDs, input/artifact hashes, configuration and reviewer findings. Run repeated trials where feasible and report sample size and variance. Measure correctness first, then latency and actual provider token/cost records. Unknown metrics remain unknown. Reject gains achieved by dropping requirements, weakening tests or unauthorized action. Use the separate token-evaluation tooling when integrated, rather than duplicating its gate.

Promote only for the tested task family with linked receipts. No such trials have run for these six candidates. Re-evaluate after material model/tool/workflow changes. A future native prompt library must preserve source identity, checked-at date, changes, blocked/stale status and previous versions. A date in a document is not automatic monitoring. Keep AGENTS.md short; examples and evidence belong here.
