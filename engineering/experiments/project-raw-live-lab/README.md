# Fresh public project collection through the Rust application

2026-10-28. This pass closes the earlier fresh-CLI and fresh-worker provider-execution gaps for selected public Modrinth project responses. It is not complete site coverage, authenticated access, a parser speedup or native GUI acceptance.

## Actual operations

The existing compiled Rust app made four successful CLI requests: Sodium, Lithium, Iris, then Sodium again. Complete received JSON was stored as generations 1–4, independently reopened and hashed. Sizes were 12,840 / 6,200 / 7,267 / 12,840 bytes. All 38 top-level fields per response remained in the raw snapshots, including team identity, long descriptions and gallery metadata. Gallery counts were 6 / 0 / 4; linked descriptions, media and downloads were not fetched by this collector.

A missing-project CLI request returned HTTP 404 and recorded a failed attempt without changing those generations. The actual local queue then requested Sodium successfully through `CollectModrinthRaw`, created generation 5 and exposed the same original bytes through the saved-response HTTP route. A subsequent missing-project queued job failed explicitly. Twelve loopback checks confirmed terminal states, retained earlier rows, complete response hash/length, compact job receipt and database integrity. No fixture provider was substituted for these requests.

The newer Sodium response had a different hash because its public downloads counter changed from 256,684,799 to 256,695,767. All other parsed fields matched. The two observations are retained separately rather than normalized into a false equal-work performance comparison.

## Evidence and limits

- [CLI receipts, independent readback and attempt history](verification.json)
- [Actual queue and HTTP checks](live-queue.json)
- [Retained provider drift](provider-drift.json)

Raw bodies stay in the local database; only sanitized hashes, sizes, IDs and results are published. Binary SHA-256 matches the previously tested SQLite-connection repair build. No code or database replacement was required for this coverage verification.

The cloud browser could not reach the executor's loopback address (`ERR_CONNECTION_REFUSED`); GUI interaction is not reported as passed. The owned test server was stopped. This pass does not establish power-loss recovery, native Windows behavior, image/video playback, creator-team membership resolution, or another project's acceptance. Prior failed native collection evidence remains unchanged.

## October 29 refresh failure retained

Two bounded actual Rust CLI requests for Sodium timed out while connecting. The first fresh database recorded a failure and no snapshot. The second used an isolated copy of six retained public/generated test snapshots: every prior row remained byte-identical, the failed attempt was recorded, integrity_check returned ok, and the source database was unchanged. [Receipt](refresh-2026-10-29.json). This is real failed-network retention evidence, not fresh provider success or diagnosis of the network cause. The earlier successful October 28 observations remain historical; no third retry or alternative credential route was attempted.
