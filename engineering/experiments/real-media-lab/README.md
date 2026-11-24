# Real public-media browser check

[Workbench source](../../docs/media-lab/README.md) · October 26, 2026 · Chrome 155/Linux

The [first exported receipt](first-browser-receipt-2026-10-26.json) contains real browser events, not simulated player success. Four public records retain 19 known gallery entries and 18 video entries. This is selected source-snapshot completeness, not every post or every provider.

- 22 of 23 preview image nodes decoded. The YouTube thumbnail failed; a separate fetch of that exact URL returned HTTP 200 with a short text/html “Site Unavailable” response, not an image. Its source reference was retained, not replaced or hidden.
- One real Steam trailer reached metadata/canplay, advanced to 13.36 seconds, with an initial observed 640×360 video surface, and paused successfully. Other trailer entries were not all playback-tested.
- This browser used native HLS support, so the fallback HLS.js library was not loaded. A native success does not certify the fallback route.
- The official YouTube IFrame API reached ready, but actual playing was not verified; the visible player remained buffering. Readiness is not playback success.

No target-project recommendation follows from this check. No private account data or authenticated post media is included. The follow-up implementation adds explicit buffering, scripted-playback-blocked and unverified-timeout states rather than leaving a misleading ready label after a failed play request.

## Fallback and recovery-state follow-up

[Second receipt](fallback-and-timeout-receipt-2026-10-26.json), harness v2, verifies the explicit HLS.js fallback: the pinned library loaded only on request, metadata/canplay arrived, and real playback advanced to 26.70 seconds with an observed 940×529 video surface. Changing trailer selection while playing removed the old video and left Load enabled and Play disabled. No playback-speed ranking against native HLS is valid from these runs: observed resolutions and conditions differ.

The official YouTube player emitted unstarted and buffering states but no playing state. After 30 seconds the app explicitly reported unverified playback, preserving the source and metadata. The test was paused afterward. This is verified failure handling, not a repaired YouTube stream or full provider acceptance.

A fresh Rust public Modrinth request independently retained all six returned gallery entries, their original URLs and 264 version IDs. Missing gallery fields remain unknown; the expanded parser does not silently truncate to eight entries.

[Direct browser DOM observations](browser-dom-checks-2026-10-26.json) retain the playback-clock, pause and selection-cleanup checks separately from event receipts. [Anonymous Rust gallery output](rust-modrinth-gallery-2026-10-26.json) retains the actual public projection.
