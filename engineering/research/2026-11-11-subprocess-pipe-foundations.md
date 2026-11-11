# Subprocess pipe admission and lifecycle foundations

## Inspected corpus and distinct gap

Inspected exact main `44384b809c80e03adbd62f8be9617d01e6ad9922`, desktop/process-memory guidance, bounded-runner, fresh-process deduplication and budgeted-preparation controllers, plus research drafts #27–37. Existing controllers have time/resource policy and retain output, but some check captured byte lengths after subprocess.run returns. Clean cancellation remains explicitly unmeasured in the existing fresh-process experiment. No executable incremental dual-pipe admission and cleanup-fault lab was found.

This independent contribution adds that bounded evaluation without changing any existing controller. All 1,549 baseline Engineering blobs were verified before edits. Active release, application API, integrated Foundry, held/private material, other drafts and workflows are untouched.

## Sources and artifacts

[Five primary sources](../data/sources.d/subprocess-pipes-20261111.json), PP26001–PP26005, were opened and relevant sections read on 2026-11-11: Python 3.12 subprocess, selectors, os, time and Linux pipe(7). Python documentation rendered 3.12.16; the actual executed interpreter version is recorded separately.

- [Practical guide](../docs/subprocess-pipe-foundations.md): capture admission, EOF/exit/protocol ownership, failure UX, alternatives and target gates.
- [Executable fixed-helper lab and complete receipts](../experiments/pipe-budget-lab/README.md).

Predeclared acceptance: concurrently drain both pipes; count retained bytes before accepting output; require both EOFs, successful direct-child exit, valid document and confirmed cleanup; preserve observed prefixes and all failures. Do not claim a hard real-time deadline, descendant cleanup, total-process memory bound or security sandbox.

## Observations and repair

The initial 27 tests passed. Adversarial cleanup review and an independent author probe found that a selector/stream close error could escape before child termination/reaping. The original fixture child was immediately stopped and reaped by its owning probe. Initial source identity and exact outcome are retained. No live helper was intentionally abandoned.

Cleanup now isolates every stage, retains stage-specific errors, attempts bounded kill/reap after a first wait error, and returns an ownership-bearing CleanupPending exception if reaping cannot be confirmed. Four regression tests raise the final suite to 31; normal and optimized Python runs pass. A later demo review also required retaining the cleanup-pending receipt before re-raising the same ownership-bearing exception; its regression is included.

Ten real-process demonstration cases pass. The dual-pressure case drains 262,144 bytes per pipe before correctly rejecting its non-JSON result. A 32-byte quota stops its flood case at 33 counted bytes, while the finite post-capture control has already retained one MiB before applying that check. No RSS or speed comparison is inferred. Full generated evidence is retained in lossless form.

The complete-output and cleanup gates are research results for these owned helpers only. They do not narrow another app's supported behavior or establish production, subprocess-tree, hostile-code, Windows/macOS or target-performance acceptance.

## Validation and integration

[Aggregate validation](../experiments/pipe-budget-lab/validation-summary.json) preserves the inherited main cross-root README link failure and separates focused passes from whole-repository status. No check is weakened or waived. Root CI excludes Engineering-only paths; publication must separately verify exact remote content and hosted check counts.

Only an additive source-index entry changes an existing Engineering file. Later integration must union all draft fragments, retaining the baseline source file first and sorted additions. This draft does not merge, deploy, signal unrelated processes, change security/resource settings or modify another target project.
