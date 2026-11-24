# Preserve media-event identity and provider error category

October 27, 2026. Actual public-media application repair, not a performance ranking.

The previous event constructor spread provider details after its envelope. The fatal HLS callback supplied a detail named `type`, so a `hls_error` event became `networkError` (or another provider category), losing the observation identity. A generated fixture exercising the extracted actual callback reproduces this overwrite. No live provider outage was induced.

The callback now stores the category in `error_type`. A shared constructor rejects reserved `type`/`at_ms` detail keys and invalid envelope inputs before insertion, then freezes the top-level record. Ordinary and unknown detail fields remain present; this is not deep immutability or provider-ownership validation. Event display/export still retains the complete receipt, and autoplay remains off.

[Before](before.log) retains three failing functions out of the original four checks. [After](after.log) passes those checks plus the actual-callback fixture control, including stale and nonfatal events. The [baseline callback](baseline-handler.txt) is from source commit beb354be5dd5321ab7931270329dfd37023ff3be. Full tests and build identities are retained alongside this note.

Harness v9 distinguishes repaired receipts from v8. Earlier saved receipts are not rewritten: a provider-category `type` in those logs may be affected. Browser regression and actual playback are separate from the generated fatal-error fixture. No card-density, memory, latency or other-project improvement is claimed by this correctness repair.

## Deployed browser regression

All nine served v9 artifacts matched the local build. The [actual browser receipt](browser-receipt.json) retains 34 events, five cards, 19 gallery entries and 19 video entries. Previews produced 22 decodes and one failure; explicit failed-only retry attempted just that one image and retained the earlier successes. Observer error count stayed zero. The pinned HLS.js 1.7.3 player actually played the public Steam trailer and was paused at 0.209739 seconds. This is a brief playback check, not a sustained-stream stress test. The YouTube thumbnail failure remains visible.

Linux/Windows CI and Pages passed for implementation commit ff4dc67779565f43983633fd21b0e387603f5ad8. The fatal-error classification repair is established by the generated actual-callback fixture, not by inducing a real provider outage. No sign-in or private data was involved.
