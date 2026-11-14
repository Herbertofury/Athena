# Retry and idempotency foundations

## Scope checked before work

Main `44384b809c80e03adbd62f8be9617d01e6ad9922` and open drafts were inspected. All 1,549 existing Engineering blobs were reconstructed and checked against their exact Git identities before edits. Existing job-submission, version-collection and upstream-review experiments already document uncertain replies and duplicate-observation boundaries. Draft [#7](https://github.com/Herbertofury/Athena/pull/7) covers actual Queue transaction rollback/storage faults. Draft [#28](https://github.com/Herbertofury/Athena/pull/28) covers SQLite recovery, bounded query admission and broader app architecture. Drafts [#27](https://github.com/Herbertofury/Athena/pull/27), [#29](https://github.com/Herbertofury/Athena/pull/29) and [#30](https://github.com/Herbertofury/Athena/pull/30) cover mod build/assets, UI/media acceptance and mod dependency semantics.

A final pre-publication check also found draft [#31](https://github.com/Herbertofury/Athena/pull/31), covering Unicode discovery and composition input, with no implementation overlap.

This separate contribution fills the cross-boundary operation-identity and acknowledgement gap rather than duplicating those experiments. No production method or existing experiment is changed. Active integrated-release work, held changes, private source and previously denied material are excluded.

## Deliverables and source facts

- [Design guide](../docs/retry-and-idempotency-foundations.md): durable boundaries, request identity, ambiguous acknowledgement, retention/restore, cancellation, alternatives and target acceptance gates.
- [Executable lab](../experiments/retry-boundary-lab/README.md): original producer/receiver transactions, immutable receipts, pending outbox, deliberate duplicate-effect controls, crash matrix and a fresh-fixture demonstration runner.
- [Primary-source fragment](../data/sources.d/retry-boundary-foundations-20261111.json): eight opened references, RB26001, RB26002, RB26003, RB26004, RB26005, RB26006, RB26007 and RB26008. Publication/version is recorded separately from the 2026-11-11 observation date. Original summaries are synthesis, not copied implementations or universal recommendations.

The source set covers RFC 9110 semantics, AWS idempotency design and outbox boundaries, SQLite isolation/transactions/atomic-commit assumptions, Python transaction configuration and Stripe's explicitly version-specific retention/replay contract. The concrete provider example is documentation only; no provider account, payment or network mutation was used.

## Measured result and negative controls

The initial 35-test run passed. Independent review reproduced it and tested eight concurrent dispatchers: one success and seven busy failures, followed by explicit replay with one receiver effect. Review also demonstrated scope collision across independent producers and execution against a different receiver ledger. Those are intentional contract limits, now described in the guide and covered by two additional regression controls. The child readiness handshake was made independent of pipe selectors; Linux-only execution remains explicit.

The final focused suite passes 38 tests. Review also prompted persisting child diagnostics before checking the expected exit code; an additional regression forces an unexpected exit and verifies the retained record. Four full demonstration receipts preserve exact before/after synthetic state. A committed producer operation replays its original receipt after losing the response. A receiver commit followed by a lost acknowledgement remains one effect under matching-identity deduplication. The intentionally naive receiver instead accumulates a second effect, as does a fresh receiver fixture that copies effects without copying its receipt ledger. Original fixtures remain unchanged and retained.

Child-process exit bypasses normal cleanup at declared boundaries. It is not an OS crash, physical disk failure, production HTTP retry, power-loss guarantee or target-project acceptance. SQLite 3.53.1 and Python 3.12.14 were actually used. Documentation is separately observed as Python 3.12.16; versions are not conflated.

## Validation and publication boundaries

Exact commands, outcomes and identities are recorded in the lab's [validation summary](../experiments/retry-boundary-lab/validation-summary.json). Full Engineering discovery and generated-content checks are run against the final contribution; focused tests alone are not a claim that the entire repository is green. Main's pre-existing `apps/atlas-lab/README.md` link to `../../../docs/athena-local-runtime.md` is rejected by its current cross-root link checker. The same failure was independently reproduced on pristine main; neither the link nor checker is changed or waived here.

The existing root workflow excludes `engineering/**` and `migration/**` changes on push and pull request. No trigger, permission or acceptance gate is changed to obtain a green result. Exact-head remote checks must be reported separately from local results; absence of runs is not CI acceptance. Browser/native/runtime/build acceptance is not claimed for an engineering-only reference experiment.

Only the source index receives an additive original-file edit; all other contribution paths are new. The branch is based independently on current main, not stacked on another research draft. Later integration must union this source-index entry with #27/#28/#29/#30/#31 and any newer entries, retaining `data/sources.json` first and sorting additional fragments. No merge, deployment, release package, repository deletion or modification to another draft is authorized by this contribution.
