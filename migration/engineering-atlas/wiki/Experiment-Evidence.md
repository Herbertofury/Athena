# Experiment evidence directory

Updated 2026-10-27. Follow each study's source commit, harness identity, raw
results and limitations. A working demo, upstream claim or passing fixture is
not a general recommendation or approval to change another project.

## Interactive laboratories

- [Worker startup and transport guide](Worker-Startup-and-Transport): scoped bundler, complete-record, timing and rebuild evidence with retained regressions.
- [Card density laboratory](https://herbertofury.github.io/Engineering-Atlas/card-lab/): generated records, complete-field comparisons and separately measured preparation/rendering. Not a target application's performance test.
- [Real media laboratory](https://herbertofury.github.io/Engineering-Atlas/media-lab/): dated public-source cards, explicit image/player loading, autoplay off. Player-ready and actually playing are separate evidence states.
- [Rust application prototype](https://github.com/Herbertofury/Engineering-Atlas/blob/main/apps/atlas-lab/README.md): local-only collection queue, durable snapshots and bounded experiments. This link is source/documentation, not a hosted authenticated service or finished installer.

## Collection and complete records

| Study | Evidence available | Important boundary |
|---|---|---|
| [Public project batching](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/modrinth-batch-lab/README.md) | Real API comparison, explicit missing IDs, atomic snapshots | Fewer requests; timing mixed, not universal speedup |
| [Long-description retention](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/body-projection-lab/README.md) | Exact body text and previous fields retained; reopen checks | More data costs additional parsing; linked media not collected automatically |
| [Version/file metadata](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/modrinth-version-lab/README.md) | Three real public records; original JSON and unknown fields survive reopen | CLI and queued workflow; file links/hashes are metadata, not downloaded or verified files |
| [Collection diagnostics](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/collection-diagnostics-lab/worker-http-2026-10-27.json) | Safe error categories and actual loopback checks | No private URL, credential or response-body logging |
| [Real media](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/real-media-lab/README.md) | Source-owned galleries, official player and Steam trailer evidence | Selected dated snapshots, not exhaustive or authenticated platform coverage |

[Storage durability and receipt integrity guide](Storage-Durability-and-Receipts): scoped database comparisons, retained budget failures and optimized-interpreter validation.

## Performance and correctness

| Study | Evidence available | Decision boundary |
|---|---|---|
| [Card density and preparation](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/card-density-lab/README.md) | Complete generated data, paired render proxies, scroll waits, worker costs, cancellation receipts | Worker remains optional; no target adoption or peak-memory claim |
| [Queue dispatch](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/queue-wakeup-lab/README.md) | Actual loopback queue delay comparison and provider-pacing repair | Dispatch latency is not provider/network speed |
| [HTTP overview serialization](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/overview-http-lab/README.md) | Actual HTTP comparisons, snapshot-coherence repair, retained regression evidence | Normal route gets correctness repair; raw serializer remains isolated |
| [Exact version-validation candidate](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/version-validation-lab/README.md) | Actual Atlas parser baseline, three real responses, complete payload/persistence checks and allocation evidence | Isolated component win; default collector and other projects unchanged |
| [Rust parser stabilization](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/rust-json-parser-lab/README.md) | Six real public inputs, all failed Unicode cases, source backport, accurate-reference diagnosis | Mixed speed and incompatible integer behavior; no app dependency changed |
| [HTML image extraction](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/html-image-parser-lab/README.md) | Differential fixtures and parser repairs | No complete provider or target-application acceptance |
| [Python JSON](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/json-lab/README.md) | Generated-corpus timings and adversarial numeric/Unicode differences | Runtime packaging and target workload remain separate gates |
| [Storage](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/rust-storage-lab/README.md) | Configured durable writes, readback and complete records | Do not compare different durability contracts or infer hardware power-loss survival |

## Recovery and the experimentation engine

- [Media recovery](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/media-recovery-lab/README.md): retained rejected-promise failure, explicit retry repair, actual playback-state discrepancy and verification status.
- [Saved-record runner](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/saved-version-runner-lab/README.md): actual stored-input comparisons, build/source fingerprints, partial samples and explicit no-promotion gates.
- [Bounded runner](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/bounded-runner-lab/README.md): fixed experiments, budgets, cancellation and retained partial results. Not general autonomous self-modification.
- [Checked raw JSON](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/overview-serialization-lab/README.md): naive forwarding failures, strict validation repair and isolated measurements.

## How to use the directory

1. Identify the required data, correctness, access and durability contract.
2. Check whether evidence is generated, fixture-tested, real public, authenticated,
   player-ready or actually playing. Never substitute one for another.
3. Read failed cases, tail regressions and missing measurements before ranking.
4. Reproduce on the actual target implementation before recommending adoption.
5. Keep source-owned text, private fixtures and accounts out of public evidence;
   retain public hashes/counts and authorized local raw data where appropriate.

[Research method](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/research-method.md) · [Source register](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/sources.md) ·
[Adapter directory](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/adapters/README.md) · [Scoped recommendations](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/ranked-recommendations.md)

- [Queued version collection](https://github.com/Herbertofury/Engineering-Atlas/tree/main/experiments/version-collection-queue-lab): 32 real HTTP checks connected public records to complete snapshots and fixed experiments; 47 runner regression checks. Native local-window interaction remains unverified.

- [HLS loader cleanup](https://github.com/Herbertofury/Engineering-Atlas/tree/main/experiments/hls-recovery-lab): retained timeout/late-callback failure, repaired lifecycle and five passing focused fixtures. Six deployed assets matched exactly; an official Steam trailer played and paused with autoplay off. Network-failure recovery remains fixture-only.

- [Lossless storage codec comparison](https://github.com/Herbertofury/Engineering-Atlas/tree/main/experiments/compressed-snapshot-lab): raw BLOB, per-record/reused-context Zstd and safe LZ4; complete real-record/replay checks and identical durability settings. Space savings do not establish a write-latency win or target adoption.

- [Official Bilibili player](https://github.com/Herbertofury/Engineering-Atlas/tree/main/experiments/bilibili-player-lab): one documented public example played/paused inside the sandboxed Atlas iframe with autoplay off. Reload/unload preserved the original cards; application events remain frame-only. Full gallery, captions, multipart and authenticated coverage are unimplemented.

- [Preview lifecycle recovery](https://github.com/Herbertofury/Engineering-Atlas/tree/613d1ced5a9559954028cc7d6b79cfa56afd64a9/experiments/preview-recovery-lab): fixed settled timers, early-load gating and explicit failed-image retry. In the real browser, 22 of 23 preview elements decoded; retry touched only the remaining YouTube thumbnail, which stayed failed. Successful images and both failures were preserved. No live recovery, broad speedup or exact memory claim.


## Upstream and evidence-integrity checks · October 27

- [Fixed public upstream checkpoints](https://github.com/Herbertofury/Engineering-Atlas/tree/50a32d09767c0ba01d136906d6ae6929435f80c4/experiments/upstream-review-lab): real anonymous RustSec, hls.js and serde_json checks now run through the Rust CLI and queue. Complete original JSON, exact revision and durable request budgets are retained. Four CLI observations plus 32 queue checks passed; 47 saved-runner and 32 real Modrinth regression checks passed. Cooldown/interrupted-request faults are explicitly generated tests. No automatic upgrade, signature verification, performance win or native-browser acceptance is claimed.
- [Pinned advisory runner](https://github.com/Herbertofury/Engineering-Atlas/tree/a2d47438676b5589f12c0cccfe29e6b99d66e197/experiments/dependency-audit-lab): exact tool/database identities, immutable lockfile copies, dirty-input rejection and retained audit results. Three scoped lockfiles had zero known matches in the reviewed database; not a whole-system security clearance.
- [Representation fidelity screening](https://github.com/Herbertofury/Engineering-Atlas/tree/d2bb61459aa5e22375f2f1347cb54946fb688c4b/experiments/representation-contract-lab): independently written exact-rational cases expose a positive-threshold loss boundary. Not author-code reproduction or a speed ranking.


## Full-record validation stabilization · October 27

[Isolated upstream parser study](https://github.com/Herbertofury/Engineering-Atlas/tree/3d5d4ef80a417cf0c64a8ce673540c62deb639a6/experiments/upstream-validation-lab) compares the actual Atlas parser on three retained public responses. The first candidate improved real-record medians but regressed memory and time on an explicitly generated larger record with whitespace. Borrowed validation removed the unnecessary owned-buffer copy without relaxing complete validation.

The final real-record median ratios are 2.41–4.19x, measured in microseconds; 117/120 pairs favored the candidate. Requested Rust allocation peaks improved, but a sample maximum regressed and native process peak memory was not measured. All before/after failures, raw samples and source identities are retained. Five focused functions include 65,536 Unicode escape cases; 47 saved-runner HTTP regression checks pass. The working collector remains unchanged: no default promotion, UI/network speed claim or other-project recommendation.


## Receipt acceptance repair · 2026-10-27

The upstream-parser analyst runner now fails closed on incomplete samples, duplicate rounds, wrong input identity, truthy non-boolean parity and invalid timing/allocation fields. The extracted original checks accepted 24 adversarial mutations; repaired checks reject them, including under Python optimization. All 16 prior final receipts still pass. A fresh bounded 16-run evaluation and the full 67 Python/73 Node tests pass; Linux/Windows CI and Pages deployment passed for commit e9ee6473bf21b3f69c6d6726f17a0789b92a96b1.

[Repair, failures and fresh evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/e9ee6473bf21b3f69c6d6726f17a0789b92a96b1/experiments/upstream-validation-lab). This is stronger measurement acceptance, not a UI/network speedup or arbitrary-executable attestation. The hls tail regression remains; default parser and all other projects remain unchanged.


## Media event identity repair · 2026-10-27

[Source, retained failures and browser receipt](https://github.com/Herbertofury/Engineering-Atlas/tree/c42e3712b3c80064135afe4213ce69a002ff6a21/experiments/media-event-identity-lab). A fatal HLS callback could overwrite the receipt event type with a provider error category. The repaired constructor rejects reserved identity fields, and the callback stores the provider category as error_type. Five focused functions, 78 Node tests and 67 Python tests pass; the fatal-error reproduction is a generated callback fixture, not a real provider outage.

The live atlas-real-media-v9-event-identity harness matched all nine served assets. Five public cards retained 19 gallery images and 19 video entries. Of 23 preview attempts, 22 decoded; retry touched only the failed YouTube thumbnail, which remained failed, without discarding successful previews. A Steam trailer actually played and paused with autoplay off; this was brief playback, not a streaming stress test. Final cleanup left no video or iframe active. Linux/Windows CI and Pages passed for the exact evidence commit c42e3712b3c80064135afe4213ce69a002ff6a21. No speed, peak-memory, authenticated coverage or other-project recommendation is claimed.


## Receipt wire-decoding repair · 2026-10-27

[Implementation, before/after fixtures and 16 fresh raw runs](https://github.com/Herbertofury/Engineering-Atlas/tree/4f65acffc0fd36c9449e47654b442921b2981246/experiments/receipt-decoding-lab). The fixed analyst runner now rejects duplicate JSON keys before structural acceptance, rather than silently keeping the last contradictory value. Non-finite constants and overflowing floating-point values also fail decoding; unknown complete fields and valid retained receipts remain intact. Raw stdout/stderr are saved before validation, preserving rejected evidence.

Three generated bad receipts reproduce the original acceptance gap. Seven new focused tests pass, including under Python optimization. All 16 prior final receipts still decode identically, and 16 fresh executions of the same Rust examples passed complete-record parity on three retained public responses plus a labeled generated augmentation. Local regression: 74 Python tests and 78 JavaScript tests. CI now discovers every JavaScript test file, including media-event identity coverage that was missing from the former explicit list. [Exact-commit CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40572155298).

This is measurement-integrity repair, not a parser performance promotion, malicious-executable attestation, native UI/storage acceptance or recommendation for another project. No provider authentication or private collection was added.


## YouTube per-video identity binding · 2026-10-27

[Repair and retained before/after evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/d0f93a49d0e34af8f42da82c6e98c6c415b4d497/experiments/youtube-identity-lab). The current single-video workbench now binds the watch-page ID, canonical card ID, official player ID and thumbnail URL namespace. Nine generated mismatches accepted by the former host-only guard are rejected. All five retained public cards keep every field, 19 gallery entries and 19 video entries unchanged.

Seven new focused functions and the full 85 Node / 74 Python checks pass locally; both site asset checks pass. Channels, playlists, Shorts source routes and multi-video collection cards are not implemented by this repair. URL agreement is not asset ownership, title accuracy or complete-provider proof. Playback and deployed build evidence remain separately recorded. [Exact-commit CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40590589701). No performance claim or recommendation for another project.

## Event-log rendering work and node-growth tradeoff · 2026-10-28

[Retained real-sequence/replay receipts, source and limitations](https://github.com/Herbertofury/Engineering-Atlas/tree/e1400186505647d8eea4d066982aac76d154d69d/experiments/event-log-render-lab). The working media harness remains unchanged while two alternatives are isolated. Full-history JSON rewriting is compared with per-event text append and a bounded-segment variant. No events or fields are dropped.

The first seven-pair public-sequence test retained 34 events exactly, with median synchronous component work 1.7 ms versus 0.6 ms. An explicitly generated 1,088-event replay measured 529.9 ms versus 10.6 ms, with all 28 full-output comparisons across the two runs passing. This is event-log work, not whole-app speed. Text nodes increased from one to 36 / 1,090. The follow-up bounds segments to 64 events / 16 KiB, preserving oversized single events; its measured tradeoffs are recorded below and it remains unpromoted.

Both original lanes showed roughly 600 ms animation-frame waits in this cloud environment. Smooth scrolling, INP, physical paint and peak-memory improvement are therefore unproven. Legacy heap snapshots are unreliable diagnostics, not acceptance evidence. Preserve the original working renderer and failed/limited observations. No other-project recommendation or default switch follows from these results.

### Bounded-segment result

[Raw v2 receipts and scoped summary](https://github.com/Herbertofury/Engineering-Atlas/tree/3679eddc3a9335b3def7d12e1b70c362552bbd45/experiments/event-log-render-lab). All 42 v2 samples retained exact JSON. The 1,088-event replay measured median synchronous work of 725.7 ms full-history, 8.9 ms per-event nodes and 18.5 ms bounded segments. Corresponding text-node counts were 1, 1,090 and 19. The 34-event original sequence used 1 / 36 / 3 nodes and measured 1.1 / 1.0 / 0.6 ms. This is a CPU-versus-node-count tradeoff, not a peak-memory ranking or full-app speedup. Slow frame cadence remains an explicit failed acceptance gate; the media renderer is unchanged.

## Card observer retention and late-receipt repair · 2026-10-28

[Baseline callbacks, failed v8 receipts, repair and live v9 evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/0be145135e150cbde6a64fcaf655d51a4ef60f0f/experiments/observation-retention-lab). Idle timing records no longer accumulate outside measured windows. An actual-callback fixture retained 100,003 irrelevant records before versus zero now; all three overlapping records survive delayed delivery unchanged. This is retained-record count, not heap bytes.

Live QA then exposed a separate v8 mismatch: 600 input records in the current receipt versus 585 in the saved completed view. Both failures remain preserved. The v9 repair refreshes both views for late events from the same completed run while protecting earlier completed results from later partial/failed runs. Live v9 produced identical 600-record downloads, six full-output samples of 200 cards × 512 metadata bytes, and an intact final-card inspection. A subsequent viewport-guard failure preserved last-good bytes; stop-control acceptance is not claimed.

All 95 Node / 74 Python checks and implementation Linux/Windows CI passed. Exact remote blobs, successful Pages and loaded harness/module identity were checked. The separate served-byte hash recheck was blocked by executor network/sandbox startup restrictions, not marked successful. No INP, physical-paint, peak-memory or other-project recommendation follows.


## Foreground control and retained regressions · 2026-10-28

[Controlled event-log rerun](https://github.com/Herbertofury/Engineering-Atlas/tree/e069cf8d7091d2953b2382894d02c22aec753cd2/experiments/event-log-render-lab): native Chrome was explicitly foregrounded and its visible benchmark identity checked. The same v2 code retained all events in 42 comparisons; scroll-frame waits were about 16–17 ms rather than the earlier roughly 600 ms. This is environmental control, not an implementation speedup. Generated replay synchronous medians were 599.4 / 3.9 / 9.0 ms for full-history / per-event / bounded segments, with 1 / 1,090 / 19 text nodes. Prior limited receipts remain intact. Exact four remote files, CI and Pages passed.

[Complete 1,000-card foreground comparisons](https://github.com/Herbertofury/Engineering-Atlas/tree/1b9fb1656c837d4fa2e0dc0d36ad78b396b9f6ce/experiments/card-density-lab): all 42 samples retained every generated card and 8 KiB metadata per card, with the same canonical dataset hash. Whole-card containment reduced its paired frame proxy from 3,181.3 to 193.8 ms, but median worst scroll waits worsened from 98.8 to 192.8 ms. Metadata-only containment measured 2,892.2 versus 285.2 ms with worst-scroll medians 83.2 versus 68.0 ms. One-percent keyed updates measured 2,541.9 versus 76.8 ms, excluding declared per-sample setup. These are separate paired comparisons, not a cross-run ranking.

The final exact card retained all 8,192 metadata characters. An initial status-read timeout during heavy work was preserved as a responsiveness concern; no duplicate run was submitted. No physical paint, INP, peak-memory, real-media card acceptance or other-project recommendation is established. Production candidates remain isolated and all failures/working baselines retained.


## Scheduling acceptance repair · 2026-10-28

[Code, failed native focus test and v11 recovery evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/863506c125d4eeee4aa3e5f9efe1ecd17013b547/experiments/focus-guard-lab). A focus-only guard passed generated fixtures but did not establish foreground state in the actual automated browser: reported focus remained true while another tab and Terminal were visible. That six-sample counterexample and roughly 1,010 ms median frame waits remain retained.

The repaired harness now checks eight empty-frame waits before preparation and after each sample, outside render timing. Repeated waits of at least 200 ms or a logical eight-second timeout reject the controlled run, retaining raw waits and partial samples. It does not change browser flags or infer physical paint from rAF. Native v11 rejected the initial slow-context run, recovered in the foreground, then rejected a real tab-switch interruption while preserving the previous completed download byte-for-byte.

A subsequent 200-card × 64 KiB run retained every field in all six samples, passed every scheduling check and exposed all 65,536 metadata characters in the final record. Paired frame-ready proxies were 4,871.0 ms full DOM versus 265.2 ms metadata containment; synchronous insertion alone was 20.1 versus 74.0 ms. Three generated-data pairs are not real-media, INP, peak-memory or other-project acceptance. All 117 Node and 74 Python tests pass; the implementation commit cf6060e4 passed Linux/Windows CI and Pages. Exact implementation/evidence remote files and loaded script identity were verified. No candidate is promoted elsewhere.


## Complete archive buffer ownership · 2026-10-28

[Actual implementation, preliminary tradeoff, final raw comparisons and HTTP regression](https://github.com/Herbertofury/Engineering-Atlas/tree/50aba7a38580924cf3df125b7ea10f97444c4af0/experiments/project-ownership-lab). The Rust archive client/read path now consumes its already-owned payload rather than always copying the full raw response. It keeps the same size, identity, JSON and UTF-8 validation; the borrowed API remains for callers that need their input. Excess input capacity is discarded before retention, avoiding the first draft’s steady-memory tradeoff.

Three retained public responses plus a labeled generated stress record were tested with exact and double-length capacities: 64 allocation pairs and 256 measured timing pairs, plus warmups. Every original byte and typed field matched; final retained-record requested bytes matched the baseline, and post-drop deltas were zero. Exact-capacity inputs avoid one payload-sized allocation. Spare-capacity shrinking may reallocate and total requested bytes can tie. Requested allocation peaks are not RSS or native allocator peaks. Small component timings improved in the final local pass, but an earlier slight Iris regression is retained; no uniform or full-app speed claim.

Final checks: 98 Rust unit tests, eight integration tests, strict Clippy, 117 Node and 74 Python checks, 73 actual loopback read/security checks and eight JavaScript-reader checks. The fixture-fed queue retained three successful archives and three failed-refresh histories. No successful fresh provider request, power-loss test, authenticated coverage or other-project adoption is claimed. The concurrent 162-scope adapter research commit was preserved, with only the two new ownership sources merged into its register. Exact 49 remote files were verified; final commit CI status is available in Actions.


## Bounded event-log insertion recovery · 2026-10-28

[Repair, original failure, native DOM receipt and complete remeasurement](https://github.com/Herbertofury/Engineering-Atlas/tree/2b89fb1e285dc68234487617f7a5fd04b7503cd0/experiments/event-log-recovery-lab). The isolated bounded renderer committed its internal segment pointer before insertion succeeded. A failed first or size-boundary insertion could make retry update a detached node: its count advanced while visible evidence was missing. The fix commits state only after successful insertion.

Generated faults on actual browser DOM reproduced both original failures. The repaired renderer and existing per-event control passed all three boundaries. Foreground remeasurement preserved complete output in 42 samples across the retained 34-event sequence and a generated 1,088-event replay. Replay synchronous medians were 593.3 ms full-history, 4.2 ms per-event and 9.1 ms repaired bounded, with 1 / 1,090 / 19 text nodes. Both runs passed the cadence flag. This preserves the component advantage over full-history rewriting, not a controlled old-bounded/new-bounded speed claim.

The size threshold is 16,384 UTF-16 code units, not encoded KiB or heap bytes. The working real-media renderer, site adapters, fixtures and concurrent Research Explorer work remain unchanged. No full-card paint, INP, peak-memory or other-project promotion follows. Local tests passed (120 Node, 74 Python); combined implementation CI and deployment passed, and exact remote evidence and loaded script identity were verified.


## Fresh-process resident-memory comparison · 2026-10-28

[Fixed runner, source identities and both raw passes](https://github.com/Herbertofury/Engineering-Atlas/tree/aa84be92ad04e0174360d927391a788835d1f0d0/experiments/process-memory-lab). Two bounded 48-process passes compare the existing borrowed and capacity-bounded owned record constructors with eight complete records per fresh Linux process. Three retained public inputs and one explicitly generated large input use exact and spare capacity; all bytes and typed fields match.

Small public cases mostly tie in retained RSS. Lithium exact capacity changes from a one-page improvement to a one-page regression across passes. The generated large replay shows 16,433,152 versus 15,007,744 bytes at exact capacity and 16,441,344 versus 15,011,840 with spare capacity. This is synthetic-shape evidence, not a general RAM reduction, browser/GPU result or whole-service acceptance. Status RSS/HWM can be asynchronous; smaps_rollup is an instantaneous snapshot, not an exact peak or jointly atomic reading.

The runner retains raw output before strict identity/parity validation, launches only its fixed example, and records source, input, executable, runner and lockfile hashes. Two Rust fixture tests and four Python protocol tests cover malformed memory fields and contradictory receipts. Local checks passed: 120 Node, 78 Python, 98 Rust unit tests, eight integration tests, two memory-example tests and strict Clippy. The 16 published blobs match local bytes exactly; [combined final CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40645697065) is recorded separately. Concurrent adapter and Research Explorer changes are preserved. No recommendation is added to another project.


## Contradictory audit-output rejection · 2026-10-28

[Repair, archived baseline, exact failure fixtures and genuine audits](https://github.com/Herbertofury/Engineering-Atlas/tree/f54cd77dd51303149732f8d136f82b4bbe914f0b/experiments/audit-receipt-lab). The prior pinned runner accepted eight generated contradictory or malformed outputs as clear. The repair reuses strict JSON receipt decoding and binds typed count, finding flag and finding-list length; missing/malformed warnings and incomplete filtering settings fail closed. Unknown valid fields remain intact, and rejected raw output is retained before validation.

All eight reproductions now fail acceptance. The full local 82 Python / 120 Node checks pass, including optimized-Python audit tests. Three genuine fixed-lock audits using the unchanged independently verified RustSec revision completed with zero known matches and no warnings; this is not a whole-machine or other-project security clearance. The pinned original runner and all preliminary evidence remain available. Exact 12 remote blobs were verified; [final combined CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40647272100) is separate from local checks.

The source review found unchanged RustSec, hls.js and serde_json checkpoints. The hardware-assisted database-safety paper is abstract-reviewed only, not reproduced or ranked. Codeberg source access was denied by robots.txt and not bypassed. No dependency, provider adapter, security setting or other project was changed.


## Complete card-receiver stabilization · 2026-10-28

[Archived baseline, candidate, exact damaged fixtures and raw measurements](https://github.com/Herbertofury/Engineering-Atlas/tree/40491fc3e18d604036ce56f927502f5d1e355dc4/experiments/card-receiver-lab). The current structural receiver accepts a corrupted metadata tail, a false digest and an inexact byte count. The isolated candidate rejects all three and verifies the full deterministic payload, exact serialized length and independently recomputed digest without mutating valid input.

This adds real work: the largest generated 200-card × 64 KiB case measured 235.755 ms candidate validation versus 0.676 ms structural checking in Node. This is not an equivalent-correctness speed comparison. All 24 validations retained complete data; 123 Node and 82 Python tests passed locally. The candidate stays isolated pending lower-overhead complete validation and actual worker/browser interruption, responsiveness and memory tests. Production harness, adapters and other projects are unchanged.


### Lower-overhead complete validation

[Bounded encoding refinement and both raw passes](https://github.com/Herbertofury/Engineering-Atlas/tree/a57be549b54d62508b41abce6ba563306389856f/experiments/card-receiver-lab) compares two equally complete validators. Per-record serialization into a bounded buffer avoids the dataset-sized intermediate JSON string while preserving exact bytes and all checks. Across 72 Node validations, the generated 200 × 64 KiB medians improved from 95.687 to 75.054 ms and from 71.091 to 55.306 ms, about 22% in both fresh processes. Small-case direction changed, and the first 8 KiB maximum regressed; all evidence is retained.

The additional tests include 1,024 Unicode cases, ordering/escape parity and incorrect buffer sizes; all 126 Node tests pass locally. Source ENCODE01 records the official encoding semantics separately from measurements. Actual browser responsiveness, worker integration and memory remain unverified. No production or other-project promotion.


### Actual receiver browser, cancellation and recovery evidence

[Raw foreground receipts, timing repair and exact served asset hashes](https://github.com/Herbertofury/Engineering-Atlas/tree/37af7efe43fc283851707f0a6f134541d8814061/experiments/card-receiver-lab/browser). The isolated v2 browser harness retained complete records in 24 main/worker samples at 200 × 8 KiB and 200 × 64 KiB, plus six recovery samples. All scheduling gates passed. Dense main-thread request medians were 175.2 versus 88.1 ms. Dense worker roundtrips were 355.5 versus 356.1 ms, and the worst observed frame gap regressed from 97.6 to 223.6 ms. No blanket worker promotion follows.

Actual active-worker cancellation preserved the previous completed download byte-for-byte; a subsequent full run recovered. The initial v1 receipt remains, but only v2 actual callback-arrival timing is used for frame-gap results. Seven served assets matched exactly and the loaded script identity was verified. Local checks passed: 128 Node and 84 Python tests. This tests the receiver, not card paint, INP, heap/RSS, provider coverage or another project. The working card/media applications and adapters remain unchanged.


### Full worker transport stabilization

[All failed/repaired transport passes and exact served identities](https://github.com/Herbertofury/Engineering-Atlas/tree/6d02299c2ef2bd5d679e8f1db21a1611cff529bb/experiments/card-receiver-lab/transport). The first transferable-buffer candidate encoded the complete dataset twice. V4 reuses the exact buffer already checked by full metadata, byte-length and digest validation, then still decodes and checks complete returned data. Across v3/v4, 48 browser samples preserve every field and scheduling gate.

The dense result remains unstable after repair: clone/transfer medians were 190.1/231.7 ms and 269.3/181.1 ms in the two v4 passes. The earlier severe 217.6/475.0 ms v3 regression remains retained. No universal transfer win or default promotion is claimed. Seven served assets per version matched, both implementation commits passed CI, and 130 Node/84 Python tests passed locally. Source ENCODE02 separates standard ownership semantics from empirical performance. Heap/RSS, INP and target-project acceptance remain unproven.


### Complete-input receipt protocol, validation-only scope

[Actual browser receipts, strict binding tests and recovery](https://github.com/Herbertofury/Engineering-Atlas/tree/d3d4793038c1076c03a5f65544f01c18b5a2c15e/experiments/card-receiver-lab/receipts). For identity-preserving validation, the caller retains all original records while the worker validates every field and byte, then returns an exact dataset/request binding instead of cloning unchanged data back. This is not suitable for transformed or newly collected worker results.

Twenty-four actual browser samples retain full parity. At 200 × 8 KiB, clone/receipt medians were 215.0/122.7 ms and 74.4/59.5 ms; at 64 KiB they were 296.2/302.5 ms and 285.9/203.6 ms. Dense direction still changes, so no default or other-project promotion. Workflow cancellation preserved a 7,211-byte last-good download exactly, followed by six successful recovery samples. Eight served assets matched. Generated actual-function tests reject stale/mismatched receipts and stop late payload consumption after cancellation; these faults are not claimed as real provider incidents. Local suites: 136 Node, 84 Python. Implementation CI passed; evidence CI is checked separately.


## Newly assigned wikilink advisory · 2026-10-28

[Pinned advisory review, fresh audits and bounded reproduction](https://github.com/Herbertofury/Engineering-Atlas/tree/c643141a81921ea015f07a62a592999a3dea0200/experiments/wikilink-advisory-lab). RustSec advanced to 40f5be6f at 08:50:03 UTC with RUSTSEC-2026-0414. The advisory date is October 18, assignment October 28 and patched 0.13.5 release October 21; these dates must not be conflated. Atlas retains the old database and uses a new clean detached worktree. The same three fixed lockfiles passed unfiltered pinned audits with zero known matches/no warnings; none lists pulldown-cmark. This is not whole-machine or other-project clearance.

Sixty bounded local Linux processes compare exact official registry versions 0.13.4 and 0.13.5, with wikilinks on/off. At 112 input bytes the enabled counts were 327,676 versus 65; disabled controls were 97 in both. Limits were 128 MiB address space, two CPU seconds, three wall seconds, 112 input bytes and a 500,001-event iteration stop. No memory-exhaustion attempt or service test occurred. All original output, lock/tool identities and upstream attribution are retained. The known-affected manifest is text evidence, not a production workspace dependency; the analyst runner uses Linux resource limits. This verifies one bounded event-growth regression, not full parser conformance or general speed/safety. No other project changed.


## Acceptance policy bound to repair lineage · 2026-10-28

[Original failure, actual implementation, migration and HTTP/CLI evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/6bc6810f45ce648ff5ce0d7958d62c09f9754789/experiments/gate-policy-lab). The original journal could link a memory-budget failure as a repair merely by raising the budget. New records persist an exact versioned policy, and linked repairs must preserve every acceptance requirement as well as baseline/workload/environment identity. Different requirements require a distinct experiment, not a disguised repair.

Legacy rows remain byte-for-byte unchanged with policy explicitly unknown; the migration adds only a nullable column. Such rows cannot be retroactively claimed as policy-equivalent parents. Decimal and hexadecimal strings retain large integers and even invalid float identities through browser JSON. CLI and completed/cancelled HTTP results expose the same saved policy. Missing evidence still blocks review eligibility, which never authorizes deployment.

Local verification passed: 102 Rust unit tests, eight integration tests, strict Clippy/formatting, 138 Node tests, 86 Python tests and 55 actual loopback HTTP checks. The baseline failing test remains retained. This is journal correctness, not a performance claim, tamper-proof database, physical power-loss result or general autonomous self-modification. Exact 21 remote files were verified; [combined CI](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40666977089) is a separate publication gate. Concurrent adapter work and all other projects are unchanged.

### Actual upstream application follow-through

The Rust application itself received HTTP 200 for the new RustSec revision and stored generation 5 referring to prior generation 2. Independent reopening confirmed all four prior generations unchanged, every one of the 3,159 received bytes retained by hash, identical stored receipt and a cleared request reservation. [Application receipt and readback](https://github.com/Herbertofury/Engineering-Atlas/tree/6bc6810f45ce648ff5ce0d7958d62c09f9754789/experiments/wikilink-advisory-lab). This is actual application execution, not a connector substituted for an app test, and no automatic upgrade occurred.


## Worker phase diagnostics · 2026-10-28

[Actual phase receipts, invalid-clock tests and recovery](https://github.com/Herbertofury/Engineering-Atlas/tree/d5dfd615fe56d8c10f741ac1b5d4b242ace82463/experiments/card-receiver-lab/phases). The isolated harness aligns communicating-context performance timestamps and preserves invalid/reversed clocks without clamping. Twenty-four foreground samples plus six recovery samples retain complete data and valid phase timelines. Nine served assets matched. W3C source HRCLK01 is a Working Draft, not a final standard or performance guarantee.

The dense transfer run reduced return-delivery median from 45.5 to 0.8 ms but added 38.2 ms main decode/binding; total request medians were 210.7/228.3 ms. Startup intervals varied substantially, and the smaller receipt comparison regressed overall. Phase medians are independent and must not be summed as a median total. Phase scope excludes final worker termination/promise overhead; small numerical differences remain in raw evidence. No pure network/CPU, INP, paint, memory or universal strategy claim follows. Actual cancellation preserved the 13,688-byte last-good export and recovery passed. Working defaults, adapters and other projects remain unchanged.


## Ordered complete-record storage · 2026-10-28

[SQLite/redb comparison, pinned harness and all raw results](https://github.com/Herbertofury/Engineering-Atlas/tree/395ccd1577064e24e955510dd97d30999a2fbfae/experiments/ordered-kv-lab). The original 64 MiB per-file budget failed on dense redb insertion; that failure and 18 preceding samples remain retained. A separate 128 MiB diagnostic and a published-runner repeat each passed 32 complete readback/rollback/integrity checks. The sorted cursor candidate did not outperform standard insertion here. No database replacement or target-project recommendation follows.

SQLite DELETE/FULL is the existing experimental baseline, not a claim of equivalent power-loss durability; DELETE/EXTRA is a separate lane, and redb uses Immediate. Four rotated rounds, identical full payloads, separately reported commit time and complete materialization do not establish physical power-loss survival, cold caches, peak memory or relational-store acceptance. Duplicate/descending cursor keys were rejected without data replacement in a focused regression. Failed compilation and denied syscall tracing remain recorded; no access restriction was bypassed.


## Verified SQLite connection requirements · 2026-10-28

[Actual implementation, three baseline failures and full regression evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/0c72b9953e1fe2e957608a4bcef1dc0f95710b04/experiments/sqlite-contract-lab). Snapshot, queue and journal now share a fail-closed check of synchronization, foreign keys and journal mode. EXTRA is requested without converting an existing safe journal mode; OFF and disk-backed MEMORY are rejected, while explicitly ephemeral temporary/in-memory fixtures remain supported. Configuration inside an active transaction is refused.

All 108 Rust unit tests, eight integration tests, strict Clippy and 55 actual loopback HTTP checks passed locally. Existing rows, legacy journal history, complete payloads and cancellation behavior are preserved. This is a verified configuration/correctness repair, not observed power-loss recovery, a throughput claim, a database replacement or a recommendation for another project. Historical FULL benchmark evidence remains unchanged.


## Contradictory benchmark JSON rejected · 2026-10-28

[Actual CLI regression and retained evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/cb247c7e6d62cc4707c85fba158ba286597e60a0/experiments/benchmark-wire-lab). A synthetic candidate with both error and complete status keys previously passed as output-equivalent. Both benchmark and worker-sweep CLIs now reuse the existing strict decoder before comparison. Thirty-two malformed CLI executions were rejected across normal and optimized Python, while valid comparator output remains byte-identical. All 95 Python and 147 JavaScript tests passed locally. This repairs evidence integrity; it does not establish faster application behavior or validate historical measurement truth.


## Real-card bounded event integration · 2026-10-28

[Implementation, browser receipts and limits](https://github.com/Herbertofury/Engineering-Atlas/tree/10e2b282d1c6213687345169528759eb9061c3ac/experiments/media-log-integration-lab). The real-media workbench now offers an explicit bounded event-renderer lane while retaining the default baseline. Complete JSON snapshots survive display failures, with explicit detached-log recovery. All 157 Node and 95 Python tests passed, and implementation CI passed on Linux and Windows.

Actual browser checks retained five cards, 19 gallery entries and 19 video entries. Both preview batches decoded 22 of 23 images; the YouTube thumbnail failure remained recorded after a one-image explicit retry. The bounded lane actually played the Steam trailer beyond 11 seconds and paused it. Browser Back retained all 33 observations, and complete visible logs matched downloaded exports in both lanes. All 16 served asset hashes matched. Different actions and network/cache conditions prevent a paired speedup claim; peak memory, INP and physical paint remain unmeasured.


## Preview lifecycle and fresh public archive checks · 2026-10-28

[Preview timeout repair and native generated check](https://github.com/Herbertofury/Engineering-Atlas/tree/fdb5e8d4f6337922c3f227e737c59d557fcba34f/experiments/preview-timeout-lab). Timed-out image sources are detached while exact retry identity and prior successes remain retained. A stale timeout cannot remove a later success. The actual browser DOM check passed removal, late-completion rejection and native one-pixel retry; it uses a generated stalled decode, not a live provider timeout. All 18 served assets matched; 160 Node and 95 Python tests and implementation CI passed. Physical socket cancellation latency is unmeasured.

[Fresh Modrinth CLI and queued-worker evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/fdb5e8d4f6337922c3f227e737c59d557fcba34f/experiments/project-raw-live-lab). Four successful official CLI requests and one actual queued request retained five complete-response generations. Missing-project requests failed explicitly; all older rows remained unchanged. Twelve real loopback checks bound the compact receipt to independently reopened full bytes. A changed public download counter explains the newer response hash and remains separate evidence. Browser access to the executor localhost was refused, so native GUI acceptance is not claimed. No accounts, downloads, full-platform coverage or speedup are implied.


## Complete preparation, container commits and additive sources · 2026-10-28

[Card-data integration evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/8eb4b38f86b0036e121b7c0b1068ea5f07f5b38f/experiments/card-integrity-integration-lab): both main and worker preparation now cross the existing complete byte/digest verifier before installation. Twelve browser samples preserved full output; explicit interruption retained the exact last-good download. Raw session traces stay private; published summaries omit browser/device and interaction identifiers.

[Container-commit comparison and retained regressions](https://github.com/Herbertofury/Engineering-Atlas/tree/1be91cf22ca38659e78d177bbd842c20b8c2671f/experiments/cooperative-card-lab): all 28 v14 samples retained complete data. Moderate and dense frame-ready proxy medians improved within their respective runs, but scrolling remained mixed. The separate keyboard attempt did not establish input-latency acceptance, and peak memory/physical paint remain unmeasured. The candidate is restricted to an unmanaged listener-free host and is not promoted as a default or recommended to another project.

[Additive source-register verification](https://github.com/Herbertofury/Engineering-Atlas/tree/6854383a442ab48c9c3d1eeb8c6a860eff1f53d2/experiments/source-register-lab): the 1,156-row baseline stays byte-identical; an indexed addition gives 1,157 total sources. Both known readers share complete loading and reject contradictions, duplicate IDs and path escapes. The actual 215-entry Explorer bundle and all compared build/input files remain identical. Local checks passed 103 Python tests in normal and optimized modes plus 173 JavaScript tests; exact-commit CI passed. This is a publication-maintenance improvement, not an app-speed claim.

The Rust application also passed 108 unit and eight integration tests in its optimized release build, using the existing locked dependencies offline.


## Complete-data preparation and native app verification · 2026-10-28

[Isolated preparation implementation and measurements](https://github.com/Herbertofury/Engineering-Atlas/tree/c0867e852d38f3915ad5f335e020a02d57df06c9/experiments/budgeted-preparation-lab) preserve the full generated records and unchanged receiver. Ninety fresh Node processes passed full parity. Dense workload preparation plus verification improved in all three passes, with lower whole-process peak RSS; smaller workload timing directions varied. This is not browser or target-project acceptance. The exact commit passed CI and Pages.

[Actual native Rust app checks](https://github.com/Herbertofury/Engineering-Atlas/tree/c0867e852d38f3915ad5f335e020a02d57df06c9/experiments/native-app-ui-lab) verified saved-response inspection, exact-byte download, missing-record recovery, unchanged prior snapshots and a queued built-in comparison (15 timed pairs, 10,000 stress cases). Its acceptance gate stayed Incomplete. The native upstream request failed to connect and remains recorded as a failure.

A subsequent local-only browser integration encountered a dense full-layout viewport failure and a Chromium tab crash (error code 9). Raw partial evidence is retained privately. Separate dense metadata-contained runs completed full parity, but that does not resolve the crash or establish a preparation-speed win. The v15 integration remains local in stabilization; the published card harness stays v14. No other project recommendation or default change follows from these generated experiments.
