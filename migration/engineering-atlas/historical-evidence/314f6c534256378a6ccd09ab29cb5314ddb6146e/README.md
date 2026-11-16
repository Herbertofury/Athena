# Incremental event-log rendering candidate

Created 2026-10-28. Baseline Atlas commit: `03f10eeca4c2eced6bb33d97dbdd3e695a8ae000`.

The existing real-media laboratory serializes and replaces the entire visible event-history JSON after every image/player observation. This repeats prior work as history grows. The isolated candidate formats each immutable event once and appends a text node before the closing bracket. All events, fields, ordering and final pretty-JSON text remain intact; nothing is sampled or truncated. Provider strings remain inert text. It adds DOM nodes instead of repeatedly replacing one large text node, so memory/layout tradeoffs must be measured, not assumed away.

The production media path is unchanged while this candidate is evaluated. The new [browser comparison](../../docs/media-lab/event-log-benchmark.html) uses the retained public v10 event sequence, then optional explicitly generated 8×/32× replay. Seven alternating-order pairs compare the actual prior full-history write pattern with the candidate against the same complete data. It records synchronous component work, double-rAF frame proxy, scroll waits, optional non-peak heap snapshots, DOM-node count and complete output equality. No new provider requests are made by the benchmark.

Four focused tests check every real event prefix, nested/escaped/Unicode/markup-like text, rejected serialization without partial changes, and index validation. Node DOM doubles establish logic only; real browser results are required before any performance or adoption decision. A snapshot append contract does not promise to redisplay subsequent mutation of a previously appended event; current media callbacks supply immutable scalar observation details. This is not a general mutable-object renderer.

No full-card paint, INP, peak-memory, other-project or universal ranking is established. Keep original failures and working versions. Browser observations will be added after the exact candidate build is deployed and verified.

## Measurement references

[DOM text-node creation](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTextNode) provides inert text rather than HTML parsing. [Legacy heap telemetry](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory) is deprecated, Chromium-specific and unreliable across heaps. Its optional diagnostic snapshots here must not be used to claim peak or process-memory improvement. A supported whole-page memory instrument remains a separate acceptance gate; this benchmark does not change isolation headers or persistent browser access to obtain it.

## Bounded-segment stabilization lane

The first candidate adds one text node per event. A second candidate keeps a segment below 64 events and 16 KiB of text, then starts another segment; an individual oversized event stays whole. It appends only to the current bounded segment, never rebuilds prior history. This addresses node growth without dropping data or reverting to full-history rewrites. Six focused tests cover exact prefixes, segment growth, oversized entries and failure preservation. The v2 browser harness retains both original alternatives, rotates three-strategy order and records environment metadata plus an explicit slow-frame-cadence flag. No variant is promoted by these code changes alone.

## First browser evidence (v1; retained, not promoted)

Candidate commit `987ddb6e1c26fb7b65d71a559d037bb17787b2de` passed CI and Pages. The loaded script was `event-log-benchmark.4137320f52fd7de9.js`. Seven real-sequence pairs retained all 34 events and 8,280 UTF-8 bytes. Median synchronous work was 1.7 ms for full-history rewriting and 0.6 ms for per-event append. The explicitly generated 1,088-event replay had medians 529.9 versus 10.6 ms, while complete log-text writes fell from 144,600,736 to 264,899 code units. All 28 samples across both runs matched the complete expected JSON. Raw receipts and [summary](v1-summary.json) are retained.

The tradeoff is real: text-node counts grew from one to 36 / 1,090. Heap snapshots are not accepted peak-memory evidence. Both lanes' scroll-frame waits clustered around 600 ms in this cloud browser, so neither smooth-scroll, physical paint nor input latency acceptance is claimed. The full workload remained visible according to the in-page geometry/visibility guards. This motivates the bounded-segment candidate; it does not justify a default switch or another-project recommendation.

## Bounded-segment browser results (v2)

The v2 loaded harness was `atlas-event-log-render-v2-blocked`, script `event-log-benchmark.5cee62f2bd6f90f5.js`, from commit `e1400186505647d8eea4d066982aac76d154d69d`; CI and Pages passed. Each of the three strategies ran seven times in rotated order. Both the real 34-event sequence and the 1,088-event generated replay preserved exact complete JSON in all 42 samples. [Raw real receipt](v2-real-34-events.json), [raw replay receipt](v2-replay-1088-events.json), [summary](v2-summary.json).

Real-sequence synchronous medians were 1.1 ms full-history, 1.0 ms per-event nodes and 0.6 ms bounded segments. Replay medians were 725.7 / 8.9 / 18.5 ms. The bounded version uses 3 / 19 text nodes for those two workloads, versus 36 / 1,090 for per-event append and one for full-history replacement. It repairs node growth at a CPU cost relative to per-event append; it does not dominate every metric. Run-to-run timing variation is retained rather than mixed into a single inflated speedup.

Both receipts flag unreliable slow frame cadence. Full interaction responsiveness, peak memory and whole-card performance remain unverified, so the alternatives remain isolated and the working media renderer is unchanged. Exact repository blobs and the loaded content-addressed script identity were verified. A separate served-byte hash recheck was blocked by executor network/sandbox startup restrictions; it is not reported as passed.
