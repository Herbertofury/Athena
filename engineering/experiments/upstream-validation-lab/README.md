# Full upstream-record validation: allocation repair, not automatic promotion

October 27, 2026. The working upstream collector still uses its original parser. This isolated candidate compares against that actual Atlas implementation on three retained public GitHub responses, not another project's code or a substitute synthetic baseline.

## What changed

Baseline validation first builds a complete serde_json Value tree, then reads the typed identity and preserves the original response. Candidate v1 reused Atlas's existing checked-JSON visitor through its owned RawValue helper. It reduced allocations and median parsing time on the real records, but a generated 128 KiB unknown field with outer whitespace exposed an extra trimmed-buffer allocation: requested peak rose from 145,251 to 272,908 bytes. Its median time also regressed in that density case.

The repair exposes the same complete validator over borrowed text. Candidate v2 checks every byte without constructing either a Value tree or an unnecessary RawValue; typed identity checks and original-byte retention remain unchanged. The existing owned helper delegates to the borrowed validator and retains its original RawValue behavior. This is a code-path repair, not relaxed validation or a cache-setting change.

[v1 source](candidate-v1.rs), [repaired candidate](candidate.rs), [provenance](provenance.json) and every before/after sample are retained. The initial example compile error and its repair are also recorded. No upstream library prototype was downloaded or executed.

## Real and generated evidence

- Actual responses: hls.js (4,670 bytes), RustSec (3,155), serde_json (1,976). [Public collection receipts](../upstream-review-lab/live-cli.json) bind their source and raw hashes. Original response bodies stay local.
- Generated augmentation: a 131,072-character unknown field plus outer whitespace, 136,966 bytes total. It is explicitly not a live provider record or higher-density card-rendering measurement.
- Each timed run has four warmup pairs and 20 measured alternating-order pairs, 100 complete parses per sample. Inputs are reused in-process; this is not a cold-cache test. Full revision, source URL, provider timestamp and every original payload byte are compared inside each timed loop.
- Allocation measurements are separate instrumented runs. They count requested Rust bytes/calls, not process RSS, native memory, stack or physical peak. All measured output objects are dropped with zero net requested-live delta.

[Final results](results-table.md) show real-record median ratios of 2.41–4.19× in this environment, representing microseconds rather than a network or UI speedup. The candidate won 117/120 real-record pairs, not every pair. Its hls sample maximum regressed in one final run; a serde_json maximum regressed in an earlier v2 run. These observations remain visible, so no uniform tail-latency claim or default promotion follows.

Requested peak bytes fell from 14,150 to 4,751 for hls, 11,380 to 3,301 for RustSec and 6,273 to 2,058 for serde_json. The repaired density case falls to 137,047 bytes, removing the v1 peak regression. Counter results are not a guarantee of application memory consumption.

## Correctness and limitations

Five focused test functions cover 65,536 generated single Unicode escapes, malformed keys, duplicate identity fields, source binding, numeric boundaries, outer whitespace, depth/size limits and commit responses. Existing 83 Rust unit, four integration and four version-example checks pass. The [47-check saved-runner regression](runner-regression.json) passes against a release binary using the factored validator.

No parser was promoted in the collector. Storage throughput, native peak memory, input/scroll latency, playback, power-loss recovery and other projects were not measured by this component experiment. Complete parser parity is necessary, not sufficient for adoption. A larger representative corpus, scheduling/latency-tail diagnosis and end-to-end budgets remain gates.

## Reproduce without new network access

Build the `upstream_validation_lab` and `upstream_validation_allocations` examples with the app's pinned toolchain/lockfile. Supply the three retained public input files and the explicitly generated density file described in provenance, then run `run_local.py --binary-dir PATH --input-dir PATH --output-dir NEW_DIRECTORY`. This analyst CLI runs only already-built example paths supplied by the operator; it is not exposed through the application. It bounds each process to 20 seconds, keeps failures, and refuses an existing output directory.

The final timing receipt includes compiler/profile/target, flags, dependency lock, baseline/candidate/validator and measurement-harness hashes. Earlier receipts lack the final harness field and have a generic origin label corrected explicitly in provenance; they are not silently rewritten. Shared-host scheduling was not controlled, and no target-project recommendation is justified.

## Receipt acceptance repair · October 27, 2026

The analyst runner now rejects incomplete rounds, wrong input/source identities, truthy non-boolean parity, changed defaults, invalid timing fields and inconsistent allocation counters before calculating comparisons. Validation uses explicit errors and remains active under Python optimization. The extracted original checks accepted 24 adversarial mutations; all are now rejected. This was an acceptance-gate weakness, not evidence that prior published samples were fabricated or incomplete: all 16 retained final receipts pass the new structural checks.

[Before failure log](receipt-gate/before.log), [focused checks](receipt-gate/after.log), [optimized-mode checks](receipt-gate/optimized.log) and a [fresh 16-run comparison](receipt-gate/summary.json) are retained. All 67 Python and 73 Node tests pass. Fresh real-record comparisons favor the candidate in 116/120 pairs; an hls sample maximum still regresses. No default promotion follows.

The gate verifies the fixed measurement protocol and the actual local input digest/length, not honesty of arbitrary executables or process memory. Allocation receipts do not independently embed compiler/source identity; the runner records executable hashes. This remains a trusted, already-built local experiment, not an untrusted-code sandbox.
