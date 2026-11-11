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

## November 11: scoped upload-revision chains

[revisions.py](revisions.py) adds offline reconciliation of supplied Imageinfo capture attempts. The current audio projection above is unchanged. Four real anonymous metadata responses distinguish an unfinished broad history from an exhausted two-revision window. Two distinct upload timestamps have the same content hash, so upload history cannot be deduplicated by SHA-1 alone. [Research and retained review failures](../../research/2026-11-11-commons-revisions.md) · [sanitized public receipt](revision-validation-2026-11-11.json).

Programmatic entry points are reconcile(initial_url, captures, access='unknown') and public_receipt(result). Captures contain requestUrl, status and body bytes, optionally finalUrl. The result retains exact response bodies and normalized rows in memory; arbitrary caller headers/extras are not copied. This function makes no requests. Access is a caller label, creator/license are unknown, and complete history, stable snapshot, file transfer, decode and playback remain separate gates.

The CLI reads a caller-provided local manifest and emits only the public receipt:

```sh
python engineering/experiments/commons-audio-lab/revisions.py --manifest /your/captures/manifest.json --output /your/results/receipt.json
python -m unittest discover -s engineering/tests -p 'test_commons_revision*.py' -v
```

Manifest shape: an object with initialUrl, optional access, and a nonempty captures array. Each capture has requestUrl, status and bodyFile, with optional finalUrl. bodyFile must name a regular single-link sibling file in the manifest directory; absolute paths, subdirectories, symlinks, hardlinks and special files are rejected. Use the exact initial request URL and exact returned continuation fields for subsequent captured URLs; do not guess a cursor. The caller supplies bytes already captured through a permitted route. A later rejected/failed attempt remains visible after success, and warnings or conflicting successes block exhaustion. The CLI uses bounded descriptor-relative reads and static failure codes without local paths. Its file gate requires POSIX capabilities and fails explicitly elsewhere; the in-memory bytes API does not require that file gate. File checks do not provide an atomic multi-file snapshot or prove input authenticity.

This first scope deliberately accepts only the official Commons endpoint, one canonical File title, JSON version 2, timestamp/user/url/size/sha1/mime/mediatype properties, page size at most 50, maxlag 1–10 and optional timestamp window. Other API features require separate tests. Public receipts omit titles, names, URLs, cursors, raw prose and headers, but their hashes/identifiers are linkable: inspect publication suitability before sharing. No raw source files or media binaries are distributed here.
