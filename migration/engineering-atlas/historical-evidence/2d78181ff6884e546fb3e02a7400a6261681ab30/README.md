# YouTube per-video identity binding

Checked 2026-10-27. Actual Atlas baseline: `144868ae595d2faa18dbb865228785920a9bc2b7`.

The public-media validator checked provider hosts but allowed a YouTube card's
source page, canonical card ID, player ID and thumbnail URL to identify different
videos. Nine generated mutations reproduced that gap. The [before](before.json)
and [after](after.json) receipts and [reproducer](reproduce.mjs) are retained.
The baseline validator and its unchanged Bilibili helper are included for the
known-bad control; no third-party executable was installed or run.

## Repaired contract

The current workbench represents a YouTube card as **one watch-page video**.
It now requires one unambiguous `v` parameter, the same `youtube:ID` card identity,
one matching official-player ID, and matching video-ID namespaces in cover and
gallery thumbnail URLs. Same-video JPEG/WebP thumbnail variants, nonidentity
source parameters and unknown metadata remain intact. Missing or unrelated
players fail explicitly rather than becoming a successful empty card.

This is deliberately scoped to the already supported workbench card shape.
Channels, playlists, Shorts source routes and multi-video collection cards are
not implemented by this change. They need explicit future schemas, not silent
flattening into this contract. URL consistency does not prove asset ownership,
license, actual provider content, title correctness or complete platform coverage.

[YouTube's official player reference](https://developers.google.com/youtube/iframe_api_reference)
defines the player video identifier separately from player state events. Atlas
must bind its own source identity to that identifier; host allowlisting alone is
insufficient. No YouTube internal API or session export is introduced.

## Verification

Seven new focused test functions cover identity mismatches, duplicate IDs,
unsupported source routes, missing/multiple players, thumbnail mismatches,
complete unknown-field retention, unchanged real fixture data and matching
manifest/receipt harness identity. All 85 Node and 74 Python tests pass locally;
both content-addressed site checks pass. All five original public cards retain
all fields: 19 gallery entries and 19 video entries, with the same fixture hash.
All nine known-bad mutations are now rejected. Autoplay remains off.

New harness: `atlas-real-media-v10-video-identity`. Browser/deployment verification
is recorded separately; local tests do not establish actual playback. No speed,
peak-memory, broad security, authenticated adapter or other-project acceptance
is claimed. Existing working assets and failures remain retained.
