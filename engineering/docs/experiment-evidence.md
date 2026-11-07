# Experiment evidence directory

Updated 2026-10-30. Follow each study's source commit, harness identity, raw
results and limitations. A working demo, upstream claim or passing fixture is
not a general recommendation or approval to change another project.

## Interactive laboratories

- [Card density laboratory](https://herbertofury.github.io/Engineering-Atlas/card-lab/): generated records, complete-field comparisons and separately measured preparation/rendering. Not a target application's performance test.
- [Real media laboratory](https://herbertofury.github.io/Engineering-Atlas/media-lab/): dated public-source cards, explicit image/player loading, autoplay off. Player-ready and actually playing are separate evidence states.
- [Verified-byte audio laboratory](https://herbertofury.github.io/Engineering-Atlas/audio-lab/): one public Commons clip, manual full-file verification, native controls and autoplay off. Served assets are verified; actual browser playing and UI acceptance remain open.
- [Rust application prototype](../apps/atlas-lab/README.md): local-only collection queue, durable snapshots and bounded experiments. This link is source/documentation, not a hosted authenticated service or finished installer.

## Collection and complete records

| Study | Evidence available | Important boundary |
|---|---|---|
| [Public project batching](../experiments/modrinth-batch-lab/README.md) | Real API comparison, explicit missing IDs, atomic snapshots | Fewer requests; timing mixed, not universal speedup |
| [Long-description retention](../experiments/body-projection-lab/README.md) | Exact body text and previous fields retained; reopen checks | More data costs additional parsing; linked media not collected automatically |
| [Queued version collection](../experiments/version-collection-queue-lab/README.md) | 32 real HTTP checks: collect → exact durable snapshot → fixed experiment; 47 runner regressions | Native-browser interaction unverified; no downloads or speed claim |
| [Version/file metadata](../experiments/modrinth-version-lab/README.md) | Three real public records; original JSON and unknown fields survive reopen | Original CLI study; queued collection evaluated separately below; file links/hashes remain metadata |
| [Collection diagnostics](../experiments/collection-diagnostics-lab/worker-http-2026-10-27.json) | Safe error categories and actual loopback checks | No private URL, credential or response-body logging |
| [Real media](../experiments/real-media-lab/README.md) | Source-owned galleries, official player and Steam trailer evidence | Selected dated snapshots, not exhaustive or authenticated platform coverage |

## Performance and correctness

| Study | Evidence available | Decision boundary |
|---|---|---|
| [Card density and preparation](../experiments/card-density-lab/README.md) | Complete generated data, paired render proxies, scroll waits, worker costs, cancellation receipts | Worker remains optional; no target adoption or peak-memory claim |
| [Queue dispatch](../experiments/queue-wakeup-lab/README.md) | Actual loopback queue delay comparison and provider-pacing repair | Dispatch latency is not provider/network speed |
| [HTTP overview serialization](../experiments/overview-http-lab/README.md) | Actual HTTP comparisons, snapshot-coherence repair, retained regression evidence | Normal route gets correctness repair; raw serializer remains isolated |
| [Exact version-validation candidate](../experiments/version-validation-lab/README.md) | Actual Atlas parser baseline, three real responses, complete payload/persistence checks and allocation evidence | Isolated component win; default collector and other projects unchanged |
| [Rust parser stabilization](../experiments/rust-json-parser-lab/README.md) | Six real public inputs, all failed Unicode cases, source backport, accurate-reference diagnosis | Mixed speed and incompatible integer behavior; no app dependency changed |
| [HTML image extraction](../experiments/html-image-parser-lab/README.md) | Differential fixtures and parser repairs | No complete provider or target-application acceptance |
| [Python JSON](../experiments/json-lab/README.md) | Generated-corpus timings and adversarial numeric/Unicode differences | Runtime packaging and target workload remain separate gates |
| [Storage](../experiments/rust-storage-lab/README.md) | Configured durable writes, readback and complete records | Do not compare different durability contracts or infer hardware power-loss survival |

## Recovery and the experimentation engine

- [Media recovery](../experiments/media-recovery-lab/README.md): retained rejected-promise failure, explicit retry repair, actual playback-state discrepancy and verification status.
- [Saved-record runner](../experiments/saved-version-runner-lab/README.md): actual stored-input comparisons, build/source fingerprints, partial samples and explicit no-promotion gates.
- [Bounded runner](../experiments/bounded-runner-lab/README.md): fixed experiments, budgets, cancellation and retained partial results. Not general autonomous self-modification.
- [Checked raw JSON](../experiments/overview-serialization-lab/README.md): naive forwarding failures, strict validation repair and isolated measurements.

## How to use the directory

1. Identify the required data, correctness, access and durability contract.
2. Check whether evidence is generated, fixture-tested, real public, authenticated,
   player-ready or actually playing. Never substitute one for another.
3. Read failed cases, tail regressions and missing measurements before ranking.
4. Reproduce on the actual target implementation before recommending adoption.
5. Keep source-owned text, private fixtures and accounts out of public evidence;
   retain public hashes/counts and authorized local raw data where appropriate.

[Research method](research-method.md) · [Source register](sources.md) ·
[Adapter directory](adapters/README.md) · [Scoped recommendations](ranked-recommendations.md)

## Additional media lifecycle regression

[HLS loader cleanup](../experiments/hls-recovery-lab/README.md) reproduces stale-ready events after a failed timeout and repairs timer/script/handler cleanup. Four before failures become passing fixture checks; real playback and served-asset checks remain separate evidence. No collection or performance ranking is implied.

## Lossless storage density

[Compressed snapshot component](../experiments/compressed-snapshot-lab/README.md) compares raw BLOBs with per-record and reused-context Zstd under identical FULL commit boundaries. Six actual public records plus explicitly generated replay data retain every byte. Compression saves space but loses end-to-end latency versus raw storage; context reuse improves only parts of the compression lane. No default migration or project recommendation follows.

## Official Bilibili player

[Public official embed lane](../experiments/bilibili-player-lab/README.md) preserves the original four cards and adds one provider-documented media example. Real sandboxed iframe play/pause and reload/unload passed with autoplay off; application events intentionally report only frame lifecycle, not cross-origin playback. No authenticated or full-post collection claim.

## Preview lifecycle recovery

[Image preview retry and cleanup](../experiments/preview-recovery-lab/README.md) repairs settled timers, one-shot failure handling and early-click gating. A real 23-element batch decoded 22; explicit retry attempted only the remaining failed thumbnail, which stayed unavailable. Previous success and failure evidence were preserved; no universal recovery or speedup claim.

## Advisory and representation eligibility checks

- [Pinned dependency advisory checks](../experiments/dependency-audit-lab/README.md): freshly fetched database, clean worktree, exact remote lock hashes and zero known matches in three scoped lockfiles. Not a whole-system security clearance.
- [Representation contract probe](../experiments/representation-contract-lab/README.md): independently written exact-rational cases expose a positive-threshold fidelity boundary. Not a paper implementation, performance reproduction or target adoption result.

## Public upstream observation workflow

[Fixed GitHub checkpoints](../experiments/upstream-review-lab/README.md) add real anonymous source checks to the Rust app, retaining complete raw JSON and durable request budgets. CLI and loopback queue results distinguish a new revision from metadata drift; generated cooldown and interrupted-request cases are not live rate-limit incidents. No automatic upgrade or performance ranking follows.

## New inference and hardware-specific storage screening

[GUIFlow and FlintKV scope review](../research/2026-10-27-inference-and-nvm-scope.md) separates compute-operation ratios from wall-clock latency and checks quality/hardware boundaries. Research-only: no prototype execution, local speed claim or target recommendation.

## Upstream parser allocation stabilization

[Full-record parser comparison](../experiments/upstream-validation-lab/README.md) retains a fast real-record candidate's generated-density memory regression, replaces an unnecessary owned validation copy with borrowed validation, and repeats exact-byte, stress, timing and allocation checks. Tail regressions remain visible; the working collector is unchanged.

- [YouTube per-video identity binding](../experiments/youtube-identity-lab/README.md): actual workbench validator repair with nine retained known-bad identity mutations, full-field parity and explicit single-video scope. Host allowlisting is not item identity; fixture tests are not playback proof.

## Ordered KV storage, 2026-10-28

[SQLite/redb complete-record comparison](../experiments/ordered-kv-lab/README.md) retains a failed 64 MiB file-budget pass and a separate 32-sample diagnostic. The sorted cursor candidate did not win; complete readback, rollback and duplicate-key regression are explicit. No relational-store or cross-project promotion.

## Verified SQLite connection requirements, 2026-10-28

[Actual store contract repair](../experiments/sqlite-contract-lab/README.md) retains three baseline failures, a shared fail-closed connection check, 108 Rust unit/eight integration tests and 55 real loopback HTTP checks. Existing rows and journal modes are preserved. Configured EXTRA synchronization is not a physical power-loss certification or performance claim.


## Complete snapshots and measurement stabilization, 2026-10-28

- [Addressed snapshot storage](../experiments/content-addressed-snapshot-lab/README.md): compares the actual store with an isolated deduplicated payload schema while retaining every generation and attempt. Preserves the header-write regression, its repair, all 84 timed samples, 48 process interruptions and scoped memory accounting. Small real-corpus and read regressions prevent promotion.
- [Budgeted preparation](../experiments/budgeted-preparation-lab/README.md): full-data encoding candidate, 90 fresh Node trials, retained browser failure and local-only v15 integration. Published card harness remains v14.
- [Native Rust app checks](../experiments/native-app-ui-lab/README.md): exact-byte download, last-good recovery and actual bounded queue execution. Failed native upstream connection is retained.
- [Query reuse and extraction review](query-reuse-and-extraction-review.md): new papers screened against quality and completeness requirements, without prototype execution or target recommendations.


## HLS.js 1.7.4 candidate, 2026-10-28

[Exact upstream parser comparison](../experiments/hls-release-lab/README.md) reproduces wrong segment identities hidden by a correct aggregate duration in 1.7.3. The 1.7.4 source passes 50 targeted fixtures and 13 full-data parity controls. Browser loading, playback, DRM and other release changes remain unverified; the live 1.7.3 vendor is unchanged. A native upstream-request timeout is retained separately from the verified GitHub release lookup.


## Snapshot uniqueness control, 2026-10-29

[All-unique negative control](../experiments/content-addressed-snapshot-lab/README.md#all-unique-negative-control-2026-10-29) adds 126 verified samples. The isolated addressed schema grows about 3.3% versus the actual store when every payload is unique. Repeated write-speed results are inconsistent. Duplicate-heavy space savings remain scoped; no migration is accepted.


## Response-body timeout classification, 2026-10-29

[Actual collector diagnostic repair](../experiments/collection-timeout-lab/README.md) reproduces a stalled-body timeout previously mislabeled as validation failure. Bounded typed-cause inspection preserves fixed safe messages and does not change provider access, timeouts or last-good storage.


## Borrowed payload comparison, 2026-10-29

[Experimental store stabilization](../experiments/content-addressed-snapshot-lab/README.md#remove-the-comparison-copy-2026-10-29) removes the owned payload copy from exact equality checking. Reused allocation instrumentation confirms one payload allocation versus zero in that comparison step, while 126 additional full-store samples preserve all data. Native allocations and whole-app speed are not inferred.

## Structured evidence delivery review, 2026-10-29

[Tessera paper and source review](../research/2026-10-29-structured-evidence-review.md) separates aggregate QA gains from individual losses, component processing time from total cost, and selected text from complete media collection. Source reuse terms remain unverified; no prototype was executed or promoted.


## Bounded response buffering, 2026-10-29

[Body-reader experiment](../experiments/body-reader-lab/README.md) reuses the working reader and allocation counter. Honest-length buffering improves allocation counts, but misleading hints still expose a memory tradeoff. Sixty actual loopback HTTP checks preserve complete bytes and safe rejections. Buffer allocation remains unchanged in the working collector; a separately reproduced impossible-budget overflow is repaired with checked arithmetic.


## Compact snapshot references, 2026-10-29

[Three-lane layout comparison](../experiments/content-addressed-snapshot-lab/compact-layout.md) diagnoses and reduces candidate metadata overhead with binary hashes and integer references. It preserves all 324 samples, 24 process interruptions and 16 memory-child checks, with no universal performance or migration claim.

## Current compiled service check, 2026-10-29

[Native service regression](../experiments/native-app-ui-lab/README.md#current-native-service-regression-2026-10-29) verifies the rebuilt executable with 66 checks across empty and historical queue fixtures, preserving complete archives and prior failure history. Browser/input/media acceptance is separate; the built-in comparison still cannot promote itself without its missing memory evidence.


## Isolated built-in strategy measurements, 2026-10-29

[Fresh-process deduplication evidence](../experiments/dedup-process-lab/README.md) shares the actual bounded workload generator, verifies complete identifier outputs and captures separate Linux memory observations. Four completed passes and the initial controller failure are retained. Cancellation and whole-app acceptance remain unestablished; the shared runner's review gate is unchanged.

## Application recovery and retained data, 2026-10-29

- [Bounded archive streaming](../experiments/archive-stream-lab/README.md): actual reader repair prevents tiny chunks from accumulating unbounded retained objects. Real-body timing is mixed; the length-hint candidate was not promoted.
- [Overview request recovery](../experiments/overview-timeout-lab/README.md): the actual UI polling deadline covers headers and body, preserves previous results, and allows a later poll. Controlled and loopback checks are not native input-latency acceptance.
- [Saved-version read bounds](../experiments/version-read-bound-lab/README.md): bounds checked before large SQLite text materialization, preserving valid complete records.
- [Initial player readiness](../experiments/player-ready-deadline-lab/README.md): missing readiness becomes explicitly unverified rather than silently waiting. Native playback remains a separate gate.
- [Commons audio metadata](../experiments/commons-audio-lab/README.md) and [isolated audio player](../experiments/audio-player-lab/README.md): strict complete metadata, real bytes and decoder observations are distinguished from browser playing.
- [HTTP timeout fixture repair](../experiments/body-timeout-fixture-lab/README.md): retains the original CI failure and non-reproduction limits; request headers are consumed before the fixture sends its response. Production timeout behavior and the original assertion are unchanged.
- [Concurrent complete snapshots](../experiments/concurrent-snapshot-lab/README.md): four actual-store writers, both journal modes, exact history and attempt pairing after reopen. Generated regression, not a performance or power-loss claim.

## rusqlite patch screening, 2026-10-29

[Isolated 0.41.1 evaluation](../experiments/rusqlite-patch-lab/README.md) passes the current Linux application and example correctness checks but confirms changed default handling of unknown PRAGMA names. The working 0.41.0 pin stays unchanged; no performance improvement or candidate Windows acceptance is inferred.

## Windows HTTP fixture portability, 2026-10-29

[Accepted-socket mode repair](../experiments/windows-http-fixture-lab/README.md) retains a Windows WouldBlock/reset failure, reproduces the nonblocking assumption locally, and explicitly configures both affected fixture streams. Original client deadlines and rejection assertions remain intact; this is fixture code, not a production dependency or reader change.

## Provenance screening, 2026-10-30

[GraphRAGProv review](../research/2026-10-30-provenance-review.md) separates exact source-span traceability from correct interpretation and query intent. The evaluation is supervised; paper-linked source repositories returned 404. Research-only, with no executed candidate or target adoption.

## Saved version inspection, 2026-10-30

[Complete version-object inspector](../experiments/version-archive-view-lab/README.md) extends the actual app by reusing its project archive path, strict byte verifier and cancellation state. It preserves full JSON and namespace identity, fixes late reopening after viewer closure, and retains real HTTP plus controlled UI evidence. Browser interaction and performance acceptance remain separate.

## Unconfirmed job receipt recovery, 2026-10-30

[Shared enqueue recovery](../experiments/job-submission-recovery-lab/README.md) repairs six indefinitely disabled action paths, bounds complete receipt reads, preserves exact decimal IDs and avoids automatic POST retries. An actual queue plus owned delayed-response proxy verifies that a client timeout can coexist with a successfully accepted job. Native browser acceptance remains open.

## Exact queue-card identity, 2026-10-30

[Large-ID card repair](../experiments/job-identity-lab/README.md) reproduces six real HTTP fixture jobs collapsing to five cards in the actual served renderer. Additive exact text identities restore all six while preserving legacy fields and complete outputs in both serializer modes. Controlled DOM evidence is distinct from native paint/input acceptance.

## Prior upstream read bounds, 2026-10-30

[Actual SnapshotStore copy-bound repair](../experiments/upstream-read-bound-lab/README.md) rejects oversized raw reads and avoids materializing a five-MiB corrupted prior TEXT value during refresh. Complete old/new data, valid controls and wrong-type failures remain checked. Requested Rust allocation evidence is not total process-memory or speed evidence.

## Saved upstream inspection, 2026-10-30

[Fixed-source archive inspector](../experiments/upstream-archive-view-lab/README.md) exposes complete saved RustSec/HLS/serde_json responses through the actual app, reusing validated bounded storage and the existing byte verifier. Offline reads preserve budgets, interrupted-request state and original history. Real local HTTP is verified; native browser acceptance remains separate.

## Visual guidance and remote request planning · October 30

[WebViSE and WaRP review](../research/2026-10-30-visual-and-request-planning-review.md) preserves functional regressions, retrieval-cost scope, overfetch and cross-region cost limits. Sources are research leads only: no model calls, paid storage runs, installed candidate or target-project recommendation.

## Overview last-good preparation boundary · October 30

[Reproduced renderer repair](../experiments/overview-last-good-lab/README.md) retains previous metrics and prevents failed card preparation from poisoning keyed reuse. Generated malformed results were exercised through the actual HTTP server and served JavaScript; no native-browser or performance acceptance is inferred.

## Overview content identity after engine replacement · October 30

[Isolated renderer candidates](../experiments/overview-content-identity-lab/README.md) reproduce stale results across two actual server/database instances at the same origin. Correctness repairs retain complete output, but measured controlled-DOM overhead remains and native-browser gates are open. Both candidates stay isolated; the default app is unchanged.

## Overview engine-instance reuse boundary · October 30

[Engine-scoped repair](../experiments/overview-engine-identity-lab/README.md) fixes stale cards after a local server/database restart without full-result comparison on each poll. Actual two-process HTTP evidence and fifty-card replacement stress preserve complete output. Broader mutable-content candidates remain isolated, and native-browser acceptance remains open.
