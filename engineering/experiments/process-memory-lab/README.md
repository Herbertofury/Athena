# Fresh-process memory is not an allocation count

2026-10-28. Isolated experiment engine extension. No site adapter, production renderer, collection rule, deployment setting or other project is changed by this study.

## Method and boundaries

The fixed Rust example starts a fresh Linux process per lane/capacity/case and retains eight complete validated records. It reuses the already-published borrowed baseline and capacity-bounded owned constructor from Atlas. Three retained public responses and one explicitly generated 1.5 MiB response are tested, each with exact and double-length input capacity. This is eight-record replay, not eight unique provider records or a running service workload.

Two separately retained passes each used 48 fresh processes: three alternating pairs for four cases and two capacities. The runner only launches the fixed local example, checks binary/source/input hashes, limits each child to ten seconds and cooperatively bounds the whole pass to 90 seconds. Raw stdout/stderr are saved before strict validation in a new private directory. Output-size limits are post-execution checks, not hard OS isolation. No network, authentication, credentials or third-party prototype execution occurs.

The experiment records status VmRSS/VmHWM and separate smaps_rollup RSS/PSS/private page snapshots before inputs, before records, while retained and after drop. Kernel documentation warns status RSS accounting can be asynchronous and imprecise. Rollup snapshots offer a more precise instantaneous view, not a high-water measurement; the two reads are not jointly atomic. Shared mappings, page granularity, allocator behavior and measurement/runtime overhead remain included. After-drop RSS need not fall when objects are freed.

Sources: [MEM01](https://man7.org/linux/man-pages/man5/proc_pid_status.5.html), [PROCMEM01](https://docs.kernel.org/filesystems/proc.html). This is not browser/GPU memory, Windows memory, whole-service RSS, exact physical peak usage or another project's acceptance.

## Observed result, not a broad RAM-saving claim

[Initial raw results](fresh-process-results.json) and [initial summary](summary.json) are retained separately from the [final raw results](final-results.json) and [final summary](final-summary.json). Every process preserved all original bytes and typed fields. The final receipt binds the actual runner, harness, adapter, executable and lockfile hashes.

Most small public-input cases tied in median retained RSS. The Lithium exact-capacity case shifted from a one-page improvement in the first pass to a one-page regression in the final pass. The Sodium spare-capacity final median differed by 65,536 bytes, while its exact-capacity case tied. These small three-pair observations do not establish a general process-RAM win.

The generated large replay showed a larger difference: final retained rollup RSS medians were 16,433,152 versus 15,007,744 bytes for exact capacity, and 16,441,344 versus 15,011,840 for spare capacity. This supports a benefit for this synthetic stress shape only, not the real small records or a browser/app-wide claim. Allocation-count reductions from the earlier ownership study remain distinct from these resident-memory observations.

Two Rust fixture tests reject missing/duplicate fields, wrong units and overflow. Four Python protocol tests reject mismatched identities, incomplete parity/counts, malformed memory values and contradictory/non-finite JSON, reusing Atlas's existing strict decoder. No arbitrary executable can be selected through the runner. Local regression and final combined CI are recorded separately; archived failed or preliminary evidence is never silently replaced.


## Shared observer extraction and regression · 2026-10-28

The existing Linux observer and numeric snapshot checks are now shared in [linux_memory.rs](linux_memory.rs) and [snapshot_gate.py](snapshot_gate.py). Their measurement/validation semantics are preserved. New protocol version 2 requires the observer source fingerprint, so changing the helper cannot silently retain the old harness identity. Historical version-1 receipts above remain unchanged and belong to their original source versions.

[The complete 48-process regression](shared-observer-regression.json) passed all original byte/projection/count checks with the shared observer. The addressed-snapshot experiment reuses it to separate [post-exec self observations from launcher-inclusive resource maxima](../content-addressed-snapshot-lab/README.md). No new general memory ranking follows from this refactor.
