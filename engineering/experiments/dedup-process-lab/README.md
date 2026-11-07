# Fresh-process evidence for the built-in identifier workload

Evaluated 2026-10-29. This adds measurement infrastructure, not a new deduplication algorithm or automatic deployment.

## Reuse the actual implementation

The normal runner and this probe now call one bounded input generator. An independent full-input checksum test preserves the original 6,000 identifiers and order. The probe calls the existing `reference_unique` and `indexed_unique` functions and reuses the established Linux self-memory observer. Input identity is streamed into SHA-256 rather than creating another whole input buffer that could distort the high-water mark. Every complete returned identifier list is compared against an independent ordered Python model, not merely a prefix or aggregate count.

The controller can execute only its fixed locally built probe. It pins the executable and source identities, retains raw output, and uses CPU, address-space, file-size, per-child and overall time limits. Output identity, scalar types, scope, build context and every memory phase are checked. Unknown executables and unearned promotion claims are rejected.

## Evidence and limits

[Four completed passes](summary.json) contain 120 fresh strategy-process observations, plus four separate executions of the actual built-in engine's 10,000-case stress pass. One earlier incomplete pass retains 30 preliminary observations and its controller failure. Full child outputs are retained privately; published summaries omit the repeated generated identifier arrays and retain their hashes and full-comparison outcomes.

In the final completed pass, median strategy time was 38.769445 ms for the linear reference and 0.257627 ms for indexed lookup. Median self-reported high-water RSS through output retention was 1,921,024 versus 1,990,656 bytes. This generated workload contains 6,000 short identifiers and 4,001 distinct results. It is not a game-card, media, live-adapter or whole-application speed result.

The memory observation includes the fresh process, input and observer overhead. It occurs before later evidence serialization. Kernel status accounting is approximate; rollup is a separate instantaneous observation. Neither is an operation-only allocation count, and launcher `wait4` maxima are not substituted. See the existing [process-memory methodology](../process-memory-lab/README.md).

The shared application runner still leaves memory and cancellation acceptance incomplete. These new process observations are not silently copied into its differently scoped trials. No clean-cancellation test, browser-memory acceptance, Windows measurement or general self-modification is claimed. The working review gate and deployment behavior are unchanged.

## Retained protocol repair

The first controller assumed the engine always serialized `correctness_failures`. The actual versioned engine deliberately omits that field when it is zero. The initial run therefore remained incomplete with a KeyError, despite its child observations being retained. The repaired gate accepts only that documented zero omission; other required counts remain mandatory. Boolean, null, floating, nonzero, duplicate-key, nonfinite and scope mutations are rejected. Negative checks pass with and without Python optimization.

Earlier controller and gate versions are archived beside the evidence. Their recorded hashes are checked when an identity was present. The failed compiler-formatting attempt is also retained privately. No failed result was overwritten or relabeled as a successful original run.

## Reproduce

Build `dedup_process_probe` in `apps/atlas-lab` with locked Rust 1.99.1 in release mode, then run `python3 experiments/dedup-process-lab/run.py --output NEW_DIRECTORY` on Linux. No network request, credential or third-party prototype is used. The standalone engine verification must still report an incomplete review decision. Current source/receipt guards and archived results make failures visible rather than blessing incomplete evidence.
