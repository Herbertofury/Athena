# Real public-media laboratory

This browser workbench combines real, dated public metadata with source-owned media references. It is not live account sync, a complete-platform crawler or proof of target-project superiority.

## Dataset and completeness

- Sodium: canonical public Modrinth ID, icon and all six API gallery entries, with original/preview distinction. Description-linked media is not yet audited.
- SkyUI: anonymous Nexus GraphQL metadata for game 1704 / mod 12604, with one public picture/thumbnail pair. Full mod-gallery completeness is explicitly unknown.
- Portal 2: reused public catalogue snapshot for Steam AppID 620, preserving all 12 screenshots and 17 trailer entries from that snapshot. Current-store completeness is not assumed.
- YouTube: the official IFrame documentation demo video, public oEmbed metadata and official player. Captions and channel history are not included.
- Bilibili: the official player-documentation example, with cover handled inside the player. No authenticated API, full gallery or account-library coverage is claimed.

No private posts, account details, credentials, personal notes or favorites are included. Media remains on its source host and is not relicensed. Source attribution and dated provenance are retained in the fixture.

## Reused components

The Steam game record is derived from an existing public catalogue, not recreated by a new scraper. HLS code loads only when a non-native HLS player is explicitly requested, keeping its 619 KB bundle off the metadata/card critical path. HLS playback uses the unmodified official npm hls.js 1.7.3 bundle, with package integrity verified, bundle SHA-256 and browser SRI, and its license retained in vendor/. YouTube playback uses its official IFrame API. Rust collection reuses the existing bounded Modrinth client and extends its projection without an eight-image cap; absent gallery data remains unknown, not an empty complete gallery.

## Verification boundaries

Unit checks validate all selected entry counts, exact original/preview URLs, source/media host allowlists, canonical identity uniqueness and rejection of private fixture state. Browser acceptance must separately establish image decoding, player readiness, actual playing time, selection changes, pause and blocked-media behavior. Do not infer successful playback from a poster or a parsed HLS manifest.

The page measures actual media events and exports a local receipt. Autoplay is disabled. Previews load only on request, using four bounded decode workers; all source entries remain represented. Media-player loading is user-initiated, with stale-generation guards and cleanup on selection changes. No receipt is uploaded automatically.

Content-addressed app/data assets and a pinned player integrity check prevent stale-source confusion. The fixture is a public contract test, not an authorization to copy signed or account-bound media into public research.

## Event identity repair

Harness v9 keeps the observation name separate from the provider’s error category (`error_type`) and rejects attempts to overwrite the envelope timestamp/type. [Failure and regression evidence](../../experiments/media-event-identity-lab/README.md) distinguishes generated fatal-error fixtures from actual browser playback. Existing v8 receipts are retained unchanged. This correctness repair is not a measured speedup.

## Real-card event integration lane

Harness v11 retains the full-history renderer as the default and exposes an explicit `?event_view=bounded` comparison lane. Both run the same real public cards, media controls, complete event snapshots and preview loader. The bounded lane reuses the repaired segmented renderer rather than introducing a replacement parser or dropping old observations. It is an isolated integration candidate, not an accepted speedup.

The recorder detaches each JSON observation from caller-owned nested data. Display errors do not remove events from the export: the page marks the display incomplete and offers explicit recovery. Recovery prepares all retained events in a detached element before replacing the display, preserving the previous visible log if preparation fails. No automatic network retries or autoplay are introduced. Ten focused tests cover retained public event prefixes, nested mutation, insertion failure, failed recovery, subsequent recovery, invalid serialization and a 1,088-event generated stress sequence. Actual browser media verification is a separate acceptance step.

## Timed-out preview lifecycle

Harness v12 detaches a timed-out preview source while retaining its exact identity for explicit retry. Late completion and stale timer callbacks cannot turn the failed attempt into success or remove a later success. Cleanup failures are separate observations. [Implementation and verification limits](../../experiments/preview-timeout-lab/README.md). The concurrency setting bounds logical workers, not a measured upper bound on physical browser sockets.
