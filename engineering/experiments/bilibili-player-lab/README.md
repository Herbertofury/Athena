# Bilibili official-player lane

Checked 2026-10-27. Source [BILI01]. Reuses Bilibili's documented external player, not an unofficial media downloader or account-session exporter. The public example BV1B7411m7LV comes from that documentation. It is a media card, not a claim that the content is a game or owned by Atlas.

The [direct-player observation](direct-official-player-2026-10-27.json) records anonymous public title/creator, readiness, explicit play and pause with autoplay false in the cloud browser. An initial transient unavailable state is retained. This direct top-level test does not itself verify the new sandboxed Atlas iframe.

## Implementation and contract

The additional card retains canonical source/video identity and exact observed title/creator. No separate poster URL is guessed or copied; its cover state explicitly says the poster remains inside the official player. Gallery, captions and multipart completeness are uncollected, not verified empty. The original four source-card objects are unchanged.

Only a canonical BV identity can construct the fixed HTTPS official player URL, with autoplay=0. Player loading is explicit. No autoplay permission is granted to the iframe; sandbox allows only scripts, its own origin and presentation. It has a descriptive title and explicit unload control. Playback controls remain inside the official player because this route does not provide an implemented trusted playback-state API to Atlas.

A loaded frame therefore emits only frame-loaded, never ready/playing. Failure, unverified timeout and unloading remain separate. Reload/unload fences old callbacks, clears timers and removes the old frame. Invalid input is rejected before disturbing a prior valid frame. Network/attachment failures do not trigger automatic retry loops or discard the source.

[Controller fixtures](../../tests/bilibili-player.test.mjs) cover URL bounds, no autoplay, minimal sandbox, load-versus-playback distinction, failure/timeout/retry, stale callbacks, invalid-ID preservation and cleanup. Fixture validation additionally binds provider, canonical source URL, video ID and no-guessed-cover scope, and compares the previous four cards unchanged. These are generated lifecycle tests, not live provider failure tests.

The workbench now describes five cards, 19 known gallery entries and 19 video entries; only this selected public embed is added. No search API, full platform catalogue, private account access, automatic caption collection or universal playback claim is implemented. Deployed iframe testing and exact served identities are recorded below, separately from unit fixtures.

## Deployed acceptance slice

At source commit `34495c1ed86b2f00058d68e6fbfc8a40f6338dd5`, all seven [served assets](served-2026-10-27.json) matched the local manifest. The cloud browser loaded the exact v7 module with five cards and no initial player/image requests. The [sandboxed iframe observation](embedded-player-observation-2026-10-27.json) confirms autoplay false, explicit playing at 0.235696 seconds and paused at 0.338497 seconds. Reload maintained one iframe; immediate unload removed it, preserved five cards and produced no later stale-load event.

[Workbench events](workbench-events-2026-10-27.json) correctly contain frame lifecycle only, not fabricated playback telemetry. The playing/paused result is an external test observation through the official controls, not an implemented cross-origin state API. [Existing-player regression receipt](existing-player-regression-2026-10-27.json) separately confirms a real Steam HLS trailer played/paused and the official YouTube player became ready; YouTube playback was not attempted or claimed.

All 62 Node tests and 53 Python tests passed locally, including six focused controller tests, source binding, unchanged earlier card objects and content-addressed assets. Network-failure recovery remains fixture-tested; these selected public examples do not establish all-region, all-video, caption, gallery, account or entitlement coverage.
