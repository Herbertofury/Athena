# Bounded file ingestion research

## Prior work and gap

Inspected current main `44384b809c80e03adbd62f8be9617d01e6ad9922`, its file-pipeline/archive/change-tracking guides and worker-sweep evaluator, saved-response archive-stream repair, and recent research drafts #27–32. The existing file guides specify plans rather than an executed local-file identity/admission experiment. The saved-response reader and native snapshot drafts have different data and trust boundaries.

All 1,549 baseline Engineering blobs were reconstructed and verified by exact Git identity before edits. This branch is independent of other drafts. It adds an original, nonrecursive Linux fixture scanner and source-backed guide without modifying any runtime, actual application queue, active integrated release, native snapshot, private source, held change, workflow or another project's recommendation.

## Artifacts and source register

- [Foundation guide](../docs/bounded-file-ingestion-foundations.md).
- [Executable lab, full receipts and limitations](../experiments/bounded-file-scan-lab/README.md).
- [Nine primary sources](../data/sources.d/bounded-file-ingestion-20261111.json): FI26001, FI26002, FI26003, FI26004, FI26005, FI26006, FI26007, FI26008 and FI26009.

References were opened and relevant sections read on 2026-11-11: Linux open/stat/read/close/openat2/inotify, Python os/concurrent.futures and Microsoft CreateFileW. Documented behavior is separated from actual Python 3.12.14 Linux execution. Windows path handling, watcher reconciliation and openat2 containment are design boundaries, not tested capabilities of this code.

## Predeclared checks and observations

Bound enumeration, future admission, current reader handles/chunks and read bytes per input. Compare complete ordered results before considering performance. Refuse final-component link substitutions and changed identity/metadata in the tested cases. Preserve every retained initial entry's outcome and never promote partial/cancelled/overflowed scans as complete. Require caller-maintained quiescence through scan/publication instead of inferring it from metadata.

The initial 30-test run passed. Independent adversarial review found that an injected close error escaped worker cleanup and prevented a complete returned receipt. The [retained finding](../experiments/bounded-file-scan-lab/initial-review-finding.json) records that exact observed outcome and procedure without pretending a newly written summary is a raw log. Reader/root close failures now invalidate success, preserve results and finish accounting; close is never retried. Two regression tests were added. Current 32-test suite passed independently.

The actual 1/2/4-worker demonstration keeps identical complete outcomes for ten generated files; each receipt includes source hashes and scoped ownership counters. A deliberately unsafe check-then-reopen control follows a swapped symlink to another generated file, while the candidate rejects its tested substitution before reading bytes. Partial I/O failure, cancellation and enumeration overflow remain non-complete; same-size in-place mutation with restored mtime is detected in this fixture. All original generated race inputs are retained, not deleted.

There is no speed comparison, universal worker setting, whole-process RSS measurement, hostile filesystem containment, coherent filesystem snapshot, parser/archive acceptance, real mod scan, installed app acceptance or Windows/macOS result. No recommendation is transferred to a target project.

## Validation and integration

The [validation summary](../experiments/bounded-file-scan-lab/validation-summary.json) records final focused and complete Engineering checks. Main has a separately reproduced pre-existing cross-root link-check error for `apps/atlas-lab/README.md` → `../../../docs/athena-local-runtime.md`. It is retained, not fixed or waived here; a partial aggregate pass is not reported as a green whole repository.

Root CI excludes `engineering/**` and `migration/**` changes on push and pull request. Exact publication-head workflow runs, check-runs and statuses must be verified separately and cannot be inferred from local results. No workflow or permission change is made.

Only `data/source-index.json` changes among existing Engineering files, with one additive entry. Later integration must preserve all other drafts' additive fragments, keep the baseline source file first and sort the additions. Draft publication does not merge, deploy, upgrade another project or authorize deletion.
