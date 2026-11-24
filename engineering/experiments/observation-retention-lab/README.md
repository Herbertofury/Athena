# Run-scoped browser observation retention

2026-10-28; baseline `e1400186505647d8eea4d066982aac76d154d69d`.

The actual card-lab PerformanceObserver callbacks retained every delivered long-task/animation/input record, including idle activity before any run and after the measured window. Output filtering later hid those idle records but did not release the growing arrays until another run started. This is unnecessary retained state, not evidence that all browser memory grows without limit.

The repair reuses the existing overlap rule before inserting a record. Every delivered record overlapping the active or completed run remains intact, including frames beginning before the window and callbacks delivered late. Idle observations outside the run are not benchmark evidence and no longer accumulate. Existing sample and input filters, workload generation, complete card data, render strategies and completed-run retention remain unchanged. There is no arbitrary cap or sampling of in-scope observations.

[Actual callback replay](run.mjs) executes the preserved baseline and repaired callback bodies with generated delivery fixtures. For each callback family, 100,003 records were formerly retained before any run; the new version retains zero. Against a completed window it retains exactly the three overlapping records, byte-equivalent to the baseline's own output filter. [Raw results](results.json) preserve both outcomes. This measures retained record counts, not real browser heap bytes, peak memory or a speedup. No third-party prototype or provider request is involved.

Three focused unit tests cover idle growth, overlap/late delivery and absent/invalid windows. Full local regressions and content-addressed asset checks are retained. The browser harness becomes `atlas-card-density-v8-scoped-observations`; live workload and exported-receipt checks remain separately recorded. PerformanceObserver delivery itself is browser-defined, and this does not fix every possible delayed-export timing issue or turn Event Timing into a complete INP score.

No recommendation is made to another project. Preserve the baseline source, old assets and existing completed evidence.

## Live v8 finding and v9 correction

The deployed v8 run completed six exact-output samples with 200 cards × 512 metadata bytes. The last card inspected with all 512 characters. Its current receipt stayed identical after outside-window inspection, but its last-completed copy contained 585 input observations versus 600 in the current receipt. Only `observed_input_events` differed; card samples and dataset identity matched. Both [current](live-v8-cards.json) and [mismatched last-completed](live-v8-last-good-mismatch.json) receipts are retained. This failure is not hidden by the successful card comparisons.

The v9 correction refreshes both views when a newly delivered input record overlaps the same completed run. It creates a replacement snapshot instead of mutating the prior frozen copy; a newer partial/failed run still cannot replace the previous completed result. Idle batches containing no in-window additions do not rebuild the input list or clone a completed receipt. The displayed output is refreshed with the corrected receipt. [Actual callback reproduction](reproduce-late.mjs) and [before/after result](late-repair-results.json) cover this path. Four focused unit tests and all 95 Node / 74 Python checks pass locally. Live v9 validation is recorded below; its scope is not native-app or peak-memory acceptance.

## Live v9 verification

[Verification receipt](live-v9-verification.json) and [raw complete run](live-v9-cards.json): six complete-output samples retained 200 cards × 512 metadata bytes and the same dataset hash; the last card inspected with its full metadata. Current and last-completed downloads both contained 600 input observations and were byte-identical, correcting the retained v8 mismatch. A subsequent attempt to stop another run instead hit the viewport guard before any sample. That [failed receipt](live-v9-viewport-failure.json) is preserved, and the last completed download stayed byte-identical afterward. This establishes failed-run preservation, not successful stop-control acceptance.

Implementation commit `3679eddc3a9335b3def7d12e1b70c362552bbd45` passed Linux/Windows CI and Pages. Loaded v9 module identity matched `lab.8f03d20c9b72c340.js`. Exact remote source blobs were verified; a separate served-byte hash request was blocked by executor network/sandbox startup restrictions and is not reported as passed. Slow cloud animation-frame cadence still prevents claims about smooth scrolling, physical paint, INP or peak memory.
