# Isolated verified-byte audio player

October 29, 2026. This extends the [single public Commons fixture](../commons-audio-lab/README.md) with a manual browser test page. It is not promoted into the main media workbench or another project.

[Open the audio experiment](../../docs/audio-lab/index.html).

## Implementation and reuse

The page reuses Atlas's existing selection/cancellation state machine and validated media-event envelope, copied by the content-addressed builder from their canonical sources. Maintained native HTML audio controls handle decoding and playback; no codec or player library is invented. The existing five-card media workbench and its pinned HLS library remain unchanged.

No media request occurs until Load & verify. The fetch omits credentials and referrers, rejects redirects and unexpected MIME, streams into an exact-size buffer bounded to one MiB, and requires both complete length and SHA-256 before creating a local Blob player. No unchecked bytes are attached. Native controls have autoplay disabled. A failed/cancelled reload preserves the prior verified clip; superseded responses and old native callbacks cannot replace it. Verified bytes can be downloaded, and the receipt can be exported locally.

Readiness, trusted playing, pause, ended and error events are separate states. Synthetic media events cannot establish playing. A 30-second cooperative readiness deadline reports unverified status, not success; a playing event also clears that timer. The session stops new loads/playback at its 256-event budget and marks its receipt partial. Exports retain the recorded history; the visible log shows only its last twelve entries. Browser timers are cooperative, not hard real-time guarantees. Receipts are self-reported observations, not tamper-proof attestations or speaker-output tests.

## Evidence and failures retained

- Seven byte/source/state tests plus eight actual-application controlled-DOM tests cover exact bytes, malformed inputs, timeout/cancellation, last-good reload, stale callbacks, URL lifetime, readiness/playing ordering, session budget and synthetic-event rejection.
- Five initial failing checks exposed inherited object-property state lookup, a readiness timer surviving playing, a load starting after the session budget closed, synthetic playing acceptance, and a stale playing badge after session closure. Their failures and earlier source versions remain in local evidence. All were repaired before publication.
- [Actual JavaScript verifier over loopback HTTP](retained-file.json) preserved all 153,301 retained real source bytes and the expected hash. It used the real reader with an owned local server, not a fresh provider fetch.
- Public source CDN HEAD returned permissive CORS; that alone is not a successful browser CORS/playback test.
- Generated assets have content-addressed names; entry script/style use SRI. The builder uses the existing strict JSON decoder and rejects duplicate fixture keys.

## Open acceptance gates

The browser runtime is unavailable. No loaded-browser identity, visual/card fit, native playing, input/scroll latency or browser memory acceptance is claimed. The successful source transfer and server decode are separate earlier observations. All current native-player interactions here were simulated fixtures; the first actual browser receipt is still needed. This page has no sign-in, account session, public upload, automatic playback or background synchronization. It stores session observations only in the current tab, not durable browser storage.

Run the repository's Node/Python suites and `python3 scripts/build_audio_lab.py --check`. Publication, exact remote blobs, deployment and served bytes are verified separately; a passing static check is not browser acceptance.
