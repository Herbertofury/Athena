# Public Commons audio metadata and exact-file check

October 29, 2026. Isolated research prototype, not a new default application adapter or browser-playback acceptance.

## Real source evidence

One official Commons Imageinfo request returned the selected file's page ID, uploader, upload time, URL, size, duration, MIME type and SHA-1. The original public API response is retained in [public-imageinfo.json](public-imageinfo.json). A bounded direct request to its source CDN returned 153,301 bytes; both size and SHA-1 matched the API. A local FFmpeg decode completed successfully and ffprobe identified stereo Vorbis at 44.1 kHz, duration about 3.704 seconds. [Verification](verification.json) preserves SHA-256 and decoder identity. The source page separately asserts K6ka's own work and CC0; this is attributed source metadata, not inferred from uploader identity.

These are real public API/file-transfer and server-decoding observations. The browser was unavailable. No audio element was loaded or observed playing, no account session or grant was used, and no private media was accessed. The binary remains in local evidence rather than being duplicated in this repository.

## Implementation and retained rejection

Inventory found no existing Commons/audio adapter in Atlas; the existing author/post/media contract and strict receipt JSON decoder were reused. The first unpublished JavaScript projection passed five ordinary checks but accepted duplicate identity keys through JSON.parse. That failure and its code remain in private evidence. The replacement [Python projection](normalize.py) uses the existing strict decoder rather than writing a new JSON parser: duplicates, non-finite numbers, hidden/missing/partial envelopes, invalid identities, unexpected URL hosts/queries and excessive file sizes reject explicitly. IDs become exact strings; unknown fields and whitespace survive in raw_json. Seven focused tests cover the retained public input and generated negative cases.

[Normalized output](normalized-public.json) deliberately keeps access, creator, license and history unknown, and playback unverified. A projection cannot grant rights or infer an author from an uploader. Separately verified HTTP, description-page and decoder observations remain in the verification record. Tracking query parameters are removed only from the normalized public-file URL; the full original response is unchanged.

## Remaining gates

- Native audio controls/player integration, actual playing/paused/error events and autoplay-off browser checks.
- Complete author/rights metadata, revision history and continuation; current prototype rejects continuation rather than claim complete history.
- Recovery/last-good storage integration, source edits, missing/deleted files and cross-browser codecs.
- Resource and latency comparisons against a target's current implementation before any adoption recommendation.

Run `python3 -m unittest discover -s tests -p test_commons_audio.py` from the repository root. No upstream executable was installed, no codec was replaced, and no broad platform-completeness claim is made. See [dedicated provider research](../../docs/adapters/wikimedia-commons.md).

An [isolated verified-byte browser test page](../audio-player-lab/README.md) is now implemented separately. It does not close the browser-playing or main-application integration gates above.
