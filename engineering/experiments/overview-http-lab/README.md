# Validated-raw overview: HTTP experiment and consistency repair

2026-10-27. Sources: ISOL01, ISOL02 and the earlier [validated-raw study](../overview-serialization-lab/README.md). Normal `serve` retains the JSON Value serializer. Explicit `serve-candidate` selects the isolated checked-raw serializer, adds a visible experimental banner and returns an `x-atlas-overview-strategy` identity header. Both remain loopback-only with existing host/origin, resource, JSON and response-security guards.

## End-to-end comparison

The first pass compared the actual previous Atlas server (source b271f68bceba4cd27ed254f0ed7ef19af40f62c7) with the experimental route. A single actual public batch record was evaluated directly and replay-expanded to 10 and 50 jobs. These larger histories are generated replay workloads, not another project's evidence. Each workload used baseline/candidate/candidate/baseline process order, five warmups and 20 measured requests per process: 300 retained raw response measurements, with full semantic hashes and byte counts, not republished source bodies.

Initial baseline/candidate median response times were 1.360/1.076 ms (one job), 4.275/1.734 ms (10), and 18.207/4.165 ms (50; 1,120,472 bytes). Complete semantic outputs matched on every response. The one-job candidate maximum regressed from 2.427 to 3.605 ms. This failure is retained, not averaged away.

Every session tested content type, no-store, nosniff, CSP, foreign-host rejection, missing write-origin rejection, explicit candidate identity/banner, malformed stored JSON rejection, exact recovery, graceful shutdown and reopened database integrity.

## Concurrent-write failure and repair

A separate bounded synthetic writer atomically toggled all 50 replay jobs between terminal states. The list query and aggregate query previously read different committed moments. Inconsistent row/count combinations appeared in 146 of 182 normal responses and 167 of 200 candidate responses. This was not dirty/uncommitted data or database corruption: each query was individually valid, but the response combined two snapshots.

Both paths now read under one DEFERRED transaction and release it on success or error. The underlying rusqlite `unchecked_transaction` API checks nested transaction validity at runtime; it does not disable JSON checking. Raw JSON still uses the checked constructor after full validation. No journal mode, durability setting or security guard was weakened.

The repeated writer test produced zero inconsistent responses in 200 normal and 200 candidate observations. Writer activity changed (including one busy retry in the repaired normal run), so this is not a writer-throughput ranking. Initial failures and repaired observations are separate directories. Previous source and binaries remain retained.

## Remeasurement after the correctness repair

The repaired comparison used the same final binary in normal/candidate modes. All 300 outputs again matched completely. Median response times were 1.641/1.088 ms (one job), 6.072/1.831 ms (10), and 42.465/6.814 ms (50). The 10-job candidate maximum still regressed slightly: 15.314 versus 14.302 ms. The later run was slower overall; do not merge it with the initial pass or attribute between-run differences solely to the transaction change.

The candidate remains isolated. These one-host measurements do not prove browser paint/input latency, exact peak heap, all-provider behavior or universal no-loss performance. VmHWM observations are approximate diagnostics, not precise allocation peaks or promotion evidence. The normal server receives the consistency repair, not automatic adoption of the faster serializer. Existing algorithm promotion gates remain unchanged.

## Reproduce

Build the pinned Atlas release. `compare_http.py` takes `--baseline`, `--candidate`, `--seed` (an authorized one-job SQLite fixture), and a new `--output` directory. For the repaired comparison, point both binary arguments at the final build. `concurrency_stress.py` takes `--binary`, `--seed` (the generated 50-job comparison copy), and a new `--output` directory. Port 41379 must be free. Only run locally built Atlas binaries. No network provider requests occur in these tests.

The seed databases and response bodies stay local; public receipts retain hashes, counts, status states and timings. `initial-source` plus the stated baseline commit preserves the pre-repair source delta. CI and native browser/Windows interaction are separate verification stages.
