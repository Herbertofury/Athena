# Real-card bounded event integration

2026-10-28. The existing repaired bounded event renderer is connected to the actual public-media workbench as an explicit comparison lane. Full-history rendering remains the default. Both share card data, image loading, player controls and complete exported observations. No provider adapter was replaced.

The recorder snapshots JSON events so nested caller mutation cannot change an earlier export. A failed display write retains the event in the receipt, marks the display stale, and provides explicit recovery. Recovery builds a detached complete log before replacing the visible one. Failed recovery preserves the previous visible text.

Ten focused tests cover all 34 retained public event prefixes in both lanes, nested mutation, generated insertion failures and repeated recovery, serialization rejection, and 1,088 generated dense Unicode records. The first full suite retained one failure from the old expected harness identity; the expectation was updated to v11 while keeping source/manifest identity equality checks. The repaired suite passed 157 Node and 95 Python tests.

This is integration and correctness evidence, not accepted end-to-end speedup. Prior component timings remain in the event-log rendering and recovery labs. Physical paint, INP and peak-memory improvements require their own measurements. Baseline and historical assets remain available; no other project is changed.

## Actual browser integration

The deployed `87bfe64fbfe989f867ef9759b4bcaf6c3ddc8c12` v11 build loaded both lanes with the same fixture hash, five cards, all 19 gallery entries and all 19 video entries. Both initial preview batches attempted 23 images: 22 decoded, one YouTube thumbnail failed. Explicit retry attempted only that failed thumbnail and preserved earlier successes; it failed again and remains recorded.

The bounded lane loaded and actually played the official Steam trailer, reaching 11.696445 seconds at 940×529 before explicit pause. Browser Back restored the bounded page and its 33 observations. The baseline's 26 observations and bounded lane's 33 observations each exactly matched their full downloaded receipt, with one and three text nodes respectively. Extra bounded events came from playback and retry, so these runs are not a paired timing comparison. The source thumbnail failure is not classified as an event-renderer failure.

[Verification and limitations](verification.json), [baseline browser](baseline-browser.json), [bounded browser](bounded-browser.json), [baseline export](baseline-export.json), [bounded export](bounded-export.json). All 16 served asset hashes matched the tested manifest. No other platform's authenticated extraction or playback is implied.
