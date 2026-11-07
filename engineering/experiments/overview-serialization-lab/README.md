# Checked JSON forwarding experiment · 2026-10-27

**Isolated candidate; the normal HTTP overview route remains unchanged.** Sources [JSON07], [JSON08], [MEM01].

The baseline builds a complete serde_json Value tree for each stored result, then serializes it again. The candidate validates the same full JSON with a streaming Serde visitor, retains the bytes in checked RawValue objects and serializes the complete response without constructing those result trees. It does not replace fields with summaries, truncate arrays, omit unknown fields or use a result cache. Small typed job descriptors are still decoded. Callers retain their existing input/output budgets.

## Reproduce, repair, retain

The initial [raw-only probe](raw-only-validation-probe-2026-10-27.jsonl) found that RawValue accepts overflowing `1e400`, a lone Unicode surrogate and depth-140 nesting which the baseline Value parser rejects. Simply substituting RawValue would weaken checks. The repair uses the normal deserializer's number, decoded-string/key and recursion paths with a visitor that does not retain a value tree, then calls the **checked** RawValue constructor. No unchecked constructor or disabled recursion limit is used.

Tests cover those failures, depth boundaries, malformed input, duplicate keys, exact byte preservation, corruption in queued results and 10,000 structured cases with truncation/trailing mutations. This is bounded differential coverage, not a proof for every input. Semantic equality is evaluated under serde_json::Value; object member ordering and wire formatting may differ. Stored results originate from the existing validated serialization path.

## Measurements

Forty independent processes ran ten complete response constructions each across four workloads; all 20 paired full-output comparisons passed. Within each process all ten complete serialized outputs matched its first output byte-for-byte, outside the timing window. The actual workload is the prior real public three-project HTTP job database. The other histories replay those public project projections into 1, 10 or 50 generated job records, explicitly not production histories.

| Workload | Baseline median ms | Candidate median ms | Baseline reported HWM KiB | Candidate reported HWM KiB |
|---|---:|---:|---:|---:|
| Actual live queue | 0.187733 | 0.039987 | 3828 | 3728 |
| 1 replay job | 0.183743 | 0.038916 | 3792 | 3680 |
| 10 replay jobs | 3.238860 | 0.316426 | 5056 | 4016 |
| 50 replay jobs | 15.553438 | 2.719432 | 11192 | 5532 |

Timings are medians of five process medians, with every first iteration retained. Memory values are medians of the executable's Linux-reported VmHWM, **approximate**, not exact heap or peak-memory guarantees. The Linux manual explicitly cautions about this counter. Startup, SQLite, output and a retained reference response are included. No HTTP, browser parsing, UI, network, cold-disk, cancellation or concurrent-writer performance claim follows.

The first run's wait4 memory readings tracked a much larger launch-history floor and often matched across strategies; those readings are retained as diagnostics, not used to rank component memory. V2 records both wait4 and the executable's own process counter. This measurement correction does not erase the first run or imply the second counter is exact.

[Complete v2 measurements](process-hwm-run-2026-10-27.json) · [first run and unsuitable memory diagnostic](first-run-wait4-diagnostic-2026-10-27.json) · [database identities and scope](manifest-2026-10-27.json).

## Reproduction

Build `cargo build --locked --release --example overview_lab` from `apps/atlas-lab`. The [Linux driver](run_linux.py) expects the prior queue HTTP fixture database from the [batch integration helper](../modrinth-batch-lab/queue_http_check.py), plus the public captured projection in this repository. It creates its own replay databases without overwriting prior evidence, runs at most 40 child processes with ten iterations each and a 30-second per-process limit, and retains response files, metrics and paired equality. It makes no network requests itself. Its JSON hashes include every value; no semantic fields are excluded.

The result is promising for this Atlas response-building component. Keep the existing route and rollback until end-to-end checks, concurrency and remaining requirements justify a switch. No other project's implementation, wiki or TODO has been changed.
