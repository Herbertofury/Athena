# Media library failure recovery · 2026-10-27

The v3 YouTube API loader cached its rejected promise indefinitely. Its next
explicit Load action returned the same rejection rather than trying again.
The retained baseline function reproduces that behavior in an isolated mocked
script environment. No network failure was manufactured on a real provider.

The v4 loader deduplicates only pending attempts, requires actual player
capability before reporting library readiness, and releases the failed attempt
for a later explicit retry. It cleans up its timer, failed script node and owned
global readiness callback. There is no automatic retry loop. Script attachment
failure, network-error events and timeout events are fixture-tested using the
actual current loader source. Successful retry and subsequent ready-state reuse
are tested separately. Older asynchronous player-load errors cannot overwrite
newer selected-player state.

All 45 Node and 53 Python repository tests passed locally. Existing public-fixture
validation, provider-bound media URLs, pinned HLS bundle/SRI, explicit load controls
and autoplay-off behavior remain. This is a recovery repair, not a throughput win,
complete adapter implementation, guarantee of playable YouTube content or target
project recommendation. Full browser verification of the published v4 player
still follows publication; simulated failures are not live-provider evidence.

Official callback contract:
https://developers.google.com/youtube/iframe_api_reference

Source tests:
- tests/resource-loader.test.mjs: pending-request sharing and manual retry lifecycle.
- tests/youtube-recovery.test.mjs: actual loader with mocked script/timer environment,
  plus retained v3 failure reproduction.
- tests/media-lab.test.mjs: unchanged full public fixture and provider binding checks.

## Real-browser v4 check and follow-on state repair

The exact six served v4 assets and loaded module identity were verified. The
YouTube player reached ready twice without playback being requested. Pinned
HLS.js 1.7.3 loaded, the real Steam trailer played, and Pause stopped it at
0.519 seconds. That exposed an existing UI bug: the DOM video was paused but its
status still said Playing. The failed DOM observation and event receipt are
retained, not counted as a clean UI pass. CI for the v4 source succeeded.

V5 adds explicit native pause/ended status handling, tested event-label mapping,
and a stale-generation guard for asynchronous Play rejections. It retains the
v4 retry repair. All 46 Node tests pass locally. Actual v5 pause-state browser
reverification passed after publication: the real Steam trailer played, then
paused with both native paused=true and the visible Paused label. Changing the
selected trailer removed the old video and disabled Play/Pause until another
explicit load. YouTube reached player-ready without a play request. Six served
assets, the loaded module, exact source commit and CI were verified. Ended-state mapping is fixture-tested,
not a claim that a real trailer has been played to completion.
