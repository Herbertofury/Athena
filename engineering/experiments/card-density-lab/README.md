# Card-density browser experiment

The [published harness source](../../docs/card-lab/index.html) measures generated complete records, not a target application's baseline.

## Excluded first run

[Raw first run](excluded-initial-run-2026-10-26.json) is preserved but **excluded from performance conclusions**. The workload container was below the visible page fold, so its scheduling proxy did not prove that the required visible cards were ready. A full accessibility-tree inspection also timed out during the run and may have disturbed its timing. These are harness/measurement defects, not evidence of an application improvement.

Revision v2 scrolls the workload viewport fully into view before each timed sample, checks and records its bounds, and keeps full-tree automation out of timed runs. A new run is required; do not pool the excluded samples with corrected measurements.

## Excluded cached-script run

A second run loaded a stale browser-cached v1 script despite the newer page and origin files. Its [raw evidence](excluded-cached-v1-run-2026-10-26.json) identifies v1 and lacks onscreen geometry, so it is also excluded. Asset integrity checks against a separate HTTP client did not establish the browser's loaded script identity. Revision v3 uses content-addressed JS, module and CSS filenames plus an explicit loaded-harness marker. Acceptance requires the exported harness version and per-sample geometry, not just a page reload.

## Corrected visible-workload v3 measurements

Two seven-pair Chrome 155/Linux runs retained all 1,000 records and 8 KiB metadata per record, verified every DOM field, and recorded fully onscreen workload bounds. Raw [initial-render samples](initial-1000-8k-v3-2026-10-26.json) and [1% update samples](update-1000-8k-v3-2026-10-26.json).

| Work | Baseline frame-ready proxy median | Candidate median | Median per-sample maximum scroll-frame wait | Decision |
|---|---:|---:|---:|---|
| Full DOM versus containment | 2768.9 ms | 208.8 ms | 98.4 → 178.1 ms | Initial improvement but scrolling regression; stabilization required |
| Full rebuild versus keyed 1% update | 3084.2 ms | 108.9 ms | 80.2 → 72.7 ms | Promising for this generated update workload only |

Keyed update DOM work fell from 37.2 to 0.9 ms. These are scheduling proxies, not physical paint or INP; there are no images, network loads or peak-memory measurements. Incremental setup occurs outside the update timer. No target-project baseline was tested and no project recommendation was made.

The v3 long-frame/task attribution filtered by entry start time and could miss an overlapping event that began just before a sample. Those observer counts are incomplete and must not support a zero-blocking claim. V4 uses interval overlap with regression tests. This correction does not rewrite the raw v3 evidence or silently combine different harness versions.

## v4 replication and isolated v5 candidate · 2026-10-26

[Raw v4 initial-rendering receipt](initial-1000-8k-v4-2026-10-26.json): 1000 records, 8 KiB each, seven pairs, all 14 full-output comparisons passed. Median frame-ready proxy was 3741.0 ms full DOM versus 200.7 ms per-card containment. Median per-sample maximum scroll-frame wait was 114.8 versus 138.7 ms: the scroll regression remains. These timings are not directly comparable to prior runs on different host conditions, and the scheduling proxy is not physical paint or INP. Overlap-aware diagnostics now retain long frames starting before the measurement window; their durations can extend outside it and must not be summed as exact exclusive window time.

The v5 harness adds a separate, explicitly experimental grouped-region operation. It constructs complete 12-card grid regions rather than one containment boundary per card, preserving every record, exact order, card geometry, the final partial group and inspection access. No DOM virtualization or data truncation is introduced. Default initial-rendering and keyed-update strategies remain available as references. Four additional unit checks cover grouping, responsive height estimates and pair ambiguity. Performance acceptance is pending.

This is a structural hypothesis based on layout-region guidance [UI05] and intrinsic-size semantics [UI03], not a claimed fix. v5 also records available Long Animation Frame render/style-layout start times, blocking duration and aggregate script duration, and resets retained observer arrays at the start of a run to avoid accumulating prior-run evidence indefinitely. The old v4 receipt and old content-addressed assets remain intact.

Upstream reuse review [UI04]: TanStack Virtual core 3.19.8 fixes an end-of-scroll calculation when content has a scroll margin, with two upstream regression cases. This source inspection does not establish a local performance win or authorize adopting virtualization: focus, find-in-page, accessibility, full-record access and target requirements would need separate parity tests. No project-specific recommendation was made.

### v5 result: grouping is not accepted

[Raw grouped-region receipt](grouped-1000-8k-v5-2026-10-26.json) retains seven complete pairs and all 1000 records in 84 regions. Full DOM / grouped median frame-ready proxies were 3531.9 / 204.7 ms; median per-sample maximum scroll waits were 84.5 / 281.8 ms. Grouping made the scroll tradeoff worse in this run, not better. All 14 complete-output comparisons passed; the final partial group held four records and exact inspection of card-000999 returned all 8192 metadata characters.

Frame attribution shows substantial time after style/layout begins, consistent with deferred rendering work appearing during scrolling, but these timestamps alone do not isolate layout versus paint or prove a root cause. The candidate stays isolated and unpromoted. Preserve the per-card baseline, full-DOM reference and this failed result for further diagnosis; do not call the initial-rendering gain a no-loss win.


## v6: metadata-only containment and evidence-window repair

The new explicit metadata-only candidate moves containment to the heavy raw-text region while retaining the full card structure, metadata text, nested scrolling and exact-record inspector. It is not virtualization, truncation or a proven improvement. Earlier per-card and grouped candidates and their failed scroll evidence remain available. Browser measurement is recorded below; this remains a scoped laboratory candidate, not target-project acceptance.

The harness also bounds observed Event Timing entries to the run window, including overlap but excluding later interactions. It retains an immutable last completed equal-output run in memory if a subsequent run fails or stops, with a separate download control. A new failure during data preparation no longer edits a previous run object. These are measurement/data-retention repairs, not an INP score or a production UI speed claim. Sources UI02 and UI07 distinguish rendering containment from source-data completeness and thresholded event observations from full interaction metrics.


### v6 browser result and limits

The verified served v6 build (source 63339369ae3913b7422f9737ed358ba05aef1ba2; script lab.596e362ed265462f.js) completed seven pairs with 1,000 generated cards and 8,192 metadata bytes each. All 14 samples retained exactly 1,000 DOM cards and complete field equality. Frame-ready proxy median: full DOM 4,802.1 ms, metadata-only containment 373.2 ms. Median worst scroll-frame wait: 101.9 versus 88.0 ms; observed maximum: 147.9 versus 114.6 ms. This is not physical-paint timing, a target application, images/media loading, or a peak-memory result.

Setup separately took 32.2 ms for data generation and 138.5 ms for checksum preparation. One observed button interaction produced three Event Timing entries with durations 216–224 ms. Most other entries were non-interaction hover events; their count must not be presented as user interactions or an INP score. These setup/input costs are not hidden by the faster render proxy.

A second complete run is retained as a control-attempt diagnostic, excluded from clean ranking: an attempted Stop action during its heavy baseline hit browser-control timeouts and did not cancel it. A later small 200-card/512-byte run was successfully stopped after one sample. Its raw partial receipt remained downloadable, and the last completed full run downloaded identically afterward. This establishes that tested retention path, not large-workload cancellation responsiveness. A zero-sample failure export remains a separate edge case.

The exact-record inspector showed all 512 metadata characters for card-000199 with the metadata-only candidate active. Subsequent inspector/download interactions did not enter the ended run's event window. Four served asset hashes and loaded harness identity were checked. Original v4/v5 failures, the new diagnostic run and stopped samples are all retained rather than replaced.

The result motivates further investigation of granular containment and preparation work. It does not justify changing any other project's wiki, TODO, implementation or deployment without its own comparison and requirements checks.

## Worker preparation lane (v7, 2026-10-27)

Implementation candidate, not a measured speed recommendation yet. The default
remains main-thread preparation. An explicit dedicated-worker option runs the
same generator, JSON serialization, UTF-8 encoding and SHA-256 digest off the
main thread, then returns every record by structured clone. Request-to-ready
includes startup, cloning and receiver validation; phase timing separates the
asynchronous digest from synchronous generation/serialization/encoding. The
previous aggregate hash timing must not be interpreted as all blocking CPU time.

A 30-second worker budget and explicit cancellation terminate that worker.
No silent main-thread fallback is used. Zero-sample failures are downloadable,
last-completed evidence remains separate, and visibility loss is latched even if
the tab becomes visible again. Rendering and incremental per-sample dataset
resets remain on the main thread. Receiver validation checks field identities,
lengths and timing/hash contracts; it is not an independent rehash or a security
boundary against a malicious worker. Independent Node digest and full-record
comparisons pass; real browser worker completion and preparation cancellation now pass the
bounded checks below. Timeout and hidden-tab paths remain browser-unverified. No target-project adoption is authorized by these generated tests.


### v7 observed browser result, not promotion

Published source c00528de, exact six served artifacts and loaded v7 identity
verified. CI 40456268926 and Pages 40456268531 succeeded. Four sequential
200-card × 8 KiB runs used main, worker, worker, main order. All 24 rendering
samples retained all fields and the same canonical dataset hash. Preparation
request-to-ready values were 71.2, 165.5, 61.2 and 19.6 ms respectively. The
worker did not establish an end-to-end preparation speed win. Both lanes showed
first-use/repeat variation, which is not credited as an implementation speedup.
Two preparation observations per lane do not estimate tails or generalize.

Stopping the worker during a separate 200 × 64 KiB preparation produced a
zero-sample downloadable failure receipt. The previous completed download was
byte-identical afterward, and its final 8 KiB record remained inspectable.
No browser timeout, hidden-tab transition, preparation input-latency comparison
or peak-memory result is claimed. See the retained `*-v7-2026-10-27.json` files.
The worker remains optional, not the default and not recommended to other apps.

## Foreground-controlled v9 recheck (2026-10-28)

The exact deployed v9 harness was selected in native foreground Chromium, verified by desktop screenshot, after the event-log investigation found that DOM visibility alone had not established native foreground state. No benchmark/browser flags or implementation changed for this recheck. Three seven-pair comparisons used 1,000 generated cards, 8 KiB complete metadata per card and identical canonical dataset SHA-256 `987660c9b6b8fce029829d5c69632667bd41e173860c2e00e747ba237ad8655e`. All 42 samples retained 1,000 cards and all expected fields. The exact final record `card-000999` was inspected with all 8,192 metadata characters. Original limited/failed observations are retained.

[Initial card containment](foreground-initial-1000-8k-v9-2026-10-28.json): median frame-ready proxy 3,181.3 ms full DOM versus 193.8 ms card containment. However, median per-sample worst scroll-frame wait increased from 98.8 to 192.8 ms. Faster initial scheduling does not establish smooth scrolling.

[Metadata-only containment](foreground-metadata-1000-8k-v9-2026-10-28.json): paired frame-ready proxy 2,892.2 versus 285.2 ms, with median per-sample worst scroll wait 83.2 versus 68.0 ms. The differing baseline medians are retained; do not compare independent runs as if interleaved or claim an overall best strategy. Both approaches preserve all fields in the DOM; neither is virtualization or a proven memory reduction.

[One-percent keyed updates](foreground-update-1000-8k-v9-2026-10-28.json): complete replacement versus keyed update median synchronous work 128.6 versus 1.4 ms; frame-ready proxy 2,541.9 versus 76.8 ms. Median per-sample worst scroll waits were 61.2 versus 76.2 ms. Per-sample baseline setup is outside that update timer, as declared by the harness. This is not total refresh pipeline latency or an INP score.

[Machine-readable scoped summary and raw receipt hashes](foreground-v9-summary-2026-10-28.json). An initial status-read timed out while heavy synchronous work was running; the action was not resubmitted, and the original run completed. This is evidence of a responsiveness concern, not a hidden successful cancellation test. These generated, image-free measurements do not establish real-media card time-to-visible, peak memory, physical paint or acceptance for another project. Keep candidates isolated and preserve the working baseline. Local regression remains 106 Node and 74 Python checks passed.
