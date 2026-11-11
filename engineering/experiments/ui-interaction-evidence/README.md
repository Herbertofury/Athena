# Bounded interaction evidence utility

This dependency-free utility is a diagnostic aid, not an INP implementation, browser harness, telemetry service or acceptance gate. Its included inputs are **synthetic**. Start with the [UI/card/media guide](../../docs/ui-card-media-acceptance.md) and [acceptance receipt](../../templates/ui-acceptance-receipt.json).

## Run the offline checks

From `engineering`:

```sh
node --test tests/ui-interaction-evidence.test.mjs
node experiments/ui-interaction-evidence/summarize.mjs experiments/ui-interaction-evidence/fixtures/synthetic-events.json
```

The CLI reads one local JSON input and writes its result to stdout. It does not modify files or contact services. It requires an explicit `synthetic` or `observed` evidence label; the label is caller-supplied, not verified provenance. Do not classify fabricated events as observed. For a receipt produced by the collector, add the caller-supplied evidence label to the complete receipt. The CLI validates and retains its status, observer settings, capacity, overflow and invalid-entry counts. Entry-only input is labeled unknown collection coverage. Even zero error/drop counts are labeled diagnostic-only, never complete. Run IDs must not be combined: interaction IDs are only meaningful within one document/collection context.

The [retained summary](evidence/synthetic-summary.json) is reproducibly derived from the [six invented entries](fixtures/synthetic-events.json). They yield three identified interaction samples: 48, 24 and 80 ms. Observed p50 is 48 ms; nearest-rank p95/max is 80 ms. The 200 ms entry has ID zero and is counted but excluded from identified interactions. These values test arithmetic. They are not timings from Athena, a browser, a user or a device, and establish no speedup.

## Optional browser instrumentation, not executed here

Import the module in an authorized, controlled test page or development bundle. It is not imported into production by this contribution:

```js
import { startEventTiming } from './event-timing.mjs';
const recorder = startEventTiming({ maxEntries: 5000 });
// Execute the declared scenario with real browser input and correctness checks.
// Wait for its declared completion/observer-delivery boundary.
const receipt = recorder.stop();
```

The caller owns scenario boundaries, export and privacy review. No upload, file write, DOM modification or remote request occurs. It records only event type/name, nonzero-or-zero ID and numeric timings, not targets, selectors, text, key values, URLs or DOM nodes. It is deliberately one-document-only. Do not collect private workloads or upload receipts without authorization.

The collector feature-detects `PerformanceObserver` event support. Unsupported and setup-error states stay distinct. It requests a 16 ms duration threshold with `buffered: false` so already-buffered entries are not requested. Earlier in-flight events can still arrive afterward: this option is not a scenario-isolation guarantee. Record and inspect scenario start/end timestamps separately. The threshold and browser buffering mean missing events are not zero-latency events. Snapshot/stop drain currently queued records; they do not force presentation or future event delivery. Stop is idempotent and ignores late callbacks. Keep the page alive and use an explicit observation boundary before stopping; delayed/in-flight entries can still be absent. Overflow stops retaining further entries and is visible as a dropped count; malformed entries get a separate count. Any nonzero count invalidates a completeness claim. Even zero counts cannot prove the browser delivered every relevant event.

## Interpretation

The Event Timing specification groups related events by interaction ID and exposes rounded durations. This module uses each nonzero group's maximum duration and nearest-rank percentiles over observed groups. It rejects nonfinite, negative, out-of-order or wrongly typed fields. It intentionally does not derive presentation-delay residuals: quantization can make subtraction misleading. [UIAC26002](https://w3c.github.io/event-timing/)

Do not call its p95/max field INP. It does not implement page-lifecycle finalization, total-interaction/outlier accounting, cross-frame collection, page restore handling, field aggregation or complete browser compatibility. It does not observe scrolling or eventual network/persistence completion. Use an appropriate maintained web-vitals implementation when the actual goal is field INP, alongside separate task-completion measurements. [UIAC26001](https://web.dev/articles/inp)

The tests use a deterministic fake observer for lifecycle, pending-record draining, overflow and privacy projection. They do not exercise a browser implementation, trusted input, paint, image/video, focus or assistive technology. They also do not establish accuracy on hostile or untrusted JSON beyond the explicitly checked fields. Preserve the raw receipt, versions and complete-result oracle in real experiments.
