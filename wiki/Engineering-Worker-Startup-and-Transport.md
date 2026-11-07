<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
# Worker startup and transport

Reviewed 2026-10-28. Project-neutral evidence guide, not a universal stack ranking.

[Full experiment directory](Engineering-Experiment-Evidence) · [Live isolated laboratory](https://herbertofury.github.io/Athena/engineering/docs/card-receiver-lab/) · [Pinned code, raw samples and reproducibility](https://github.com/Herbertofury/Engineering-Atlas/tree/00b2635fad181821402f0b360baa604c4e568243/experiments/worker-bundle-lab)

## Read this first

All runtime comparisons here use complete generated records in foreground cloud Chromium. They are not another application's workload, real-media card rendering, INP, physical paint or actual heap/RSS measurements. Working application defaults and provider adapters remain unchanged. A compiler's implementation language, recency or output size is not proof that it is best.

## Evidence map

| Approach | Verified finding | Boundary / tradeoff |
|---|---|---|
| Full-data validation | Corrupt tails, false digests and incorrect byte counts rejected; complete valid records preserved | Structural checks alone are not full validation |
| Bounded encoding | Avoids one dataset-sized intermediate string; complete bytes still checked | Small/tail regressions remain; not a blanket memory claim |
| Transferred buffer | Removes much return-delivery work in one trace | Main-thread decoding still cost tens of milliseconds; dense totals changed direction |
| Validation-only receipt | Worker validates every record; caller retains its complete input | Invalid for new/transformed worker results; dense timings still mixed |
| Bundled worker graph | Both bundles improved request medians in four observed runs | Neither tool consistently won; one maximum frame gap regressed |
| Phase timelines | Startup, validation and delivery intervals are retained separately | Three tiny cross-context reversals were rejected, not clamped |

## Pinned bundler comparison

Sources: [esbuild 0.28.2](https://github.com/evanw/esbuild/releases/tag/v0.28.2), published August 8, and [Rolldown 1.2.15](https://github.com/rolldown/rolldown/releases/tag/v1.2.15), published October 21. Checked October 28, 2026.

The identical five-file worker graph was 13,810 uncompressed source bytes. Bundles were 3,966 bytes (esbuild) and 3,904 bytes (Rolldown). These are not compressed network-byte measurements. Six compiler builds produced stable per-tool output hashes; 29 generated protocol cases across three implementations preserved complete fields, transferred bytes and validation failures.

Each browser sample created a new worker and used the same full validation-only receipt contract. Three rounds rotated tool order.

| 200-record workload | Native / esbuild / Rolldown request medians, pass 1 | Pass 2 |
|---|---:|---:|
| 8 KiB metadata each | 91.3 / 52.0 / 41.9 ms | 51.2 / 30.1 / 32.9 ms |
| 64 KiB metadata each | 187.4 / 97.2 / 97.6 ms | 117.8 / 97.6 / 97.1 ms |

All 36 samples retained complete data and passed scheduling calibration. Rolldown's first dense maximum observed frame gap was 42.0 ms versus 36.1 ms native. Browser/OS caches were not established cold. These small observations do not justify a universal bundler, language or UX ranking.

## Measurement integrity

Three phase traces, one per build, reversed send-start/main-receive by -0.000244140625 ms. Cause is not established. Parent-local request timing remains distinct from rejected cross-context attribution. The UI now reports complete-data samples separately from valid, rejected and uncollected phase timelines, and Run stays disabled until module readiness. [Timing source](https://www.w3.org/TR/2026/WD-hr-time-3-20260901/) is a W3C Working Draft with precision limitations, not an endorsement or benchmark result.

## Reproduce without breaking the working page

1. Keep original sources, failed traces and exact tool locks.
2. Stage a new worker graph without replacing published index/manifest files.
3. Compile only the fixed staged manifest with pinned tools; retain source/output hashes and warnings.
4. Refuse stale source, tool-version or artifact mismatches. Run complete-output/corruption tests.
5. Build and check the content-addressed site, then measure the actual foreground workload.
6. Preserve cancellation, previous good results and regressions. Verify exact remote commits, served files and CI separately.

The staging CLI left both published entrypoints byte-identical; both pinned compilers reproduced accepted bundle bytes from the staged graph. The initial install-cache failure and a post-build summary-print error are retained rather than hidden. Vendor dependencies remain outside published source; the explicit npm audit had zero known matches for that tool graph, not a whole-system safety guarantee.

## Before adoption anywhere else

Compare against that project's current implementation, complete data, access/security requirements, memory, input latency and durability contracts. A generated benchmark here is not sufficient. Do not lower acceptance requirements to manufacture a repair: [the journal now binds repair lineage to the exact saved policy](https://github.com/Herbertofury/Engineering-Atlas/tree/6bc6810f45ce648ff5ce0d7958d62c09f9754789/experiments/gate-policy-lab).
