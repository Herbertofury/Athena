# PeerTube selected-video evidence gate

Offline extraction of one explicitly selected video's metadata and caption references. It reuses [site-extraction-lab](../site-extraction-lab/README.md) strict JSON decoding and incomplete Markdown event extraction. No network client, credentials, external player, renderer or target integration is included.

## Input and privacy contract

Load `videos.py` through Python importlib, then call `normalize(observations, expected_uuid=..., instance=...)`. It returns an Evidence object. Its `.attempts` and `.records` are private source evidence; only `.receipt()` is intended for publication. Every receipt call returns an isolated copy of the normalization-time whitelist.

Each observation supplies `kind` (`video` or `captions`), `instance`, `request_uuid`, exact `request_path`, `body` (bytes), `status` (HTTP integer), `complete` and `redirected` (strict booleans). The path must be `/api/v1/videos/` plus the selected UUID, with `/captions` only for that kind. A caption response does not carry a trustworthy video identity by itself, so supplied request association is mandatory. This is a caller evidence assertion, not an independently verified HTTP request.

The optional `contract` is `peertube-8.3.0` or `unknown`. The former identifies the inspected upstream schema snapshot, not a detected or authenticated server installation. Under that contract, VideoDetails.description is documented as full Markdown and truncatedDescription is separate. Unknown contracts retain ambiguous completeness. Missing, null and empty body fields remain distinct, and support text never becomes the description.

Private records preserve instance-local numeric identity separately from UUID/short UUID/canonical URL, account uploader versus channel publisher and channel owner, exact source text, original media fields, processing/privacy/live/download states and license declaration. These are source declarations, not authenticated ownership, original authorship, successful retrieval or reuse permission.

## Media is metadata until tested

The actual public sample has zero top-level web files but six nested HLS representations, including resolution ID zero. Keep those scopes separate. Manifest, direct-file, download, torrent, magnet, thumbnail and caption references have different roles and must not be collapsed into a single successful attachment. File sizes and audio/video flags are unverified declarations.

Caption total/count agreement applies only to the captured response. It is not a complete transcript, correct automatic speech recognition, a fetched WebVTT file or synchronized subtitle playback. A modern fileUrl can be present when a deprecated path is null. No URL, manifest, media file, caption file, peer or tracker is contacted by this module.

Markdown source and helper projection stay private and inert. The helper only approximates selected links/images and may drop query strings in its event references. It is not a full Markdown parser, sanitizer or rendering approval. Keep the original source independent of that projection and apply an application's rendering/security/accessibility checks separately.

## Failures and limits

Observations are retained independently. Failed HTTP, redirected, partial, malformed or mismatched responses do not overwrite earlier evidence. A 404 is not deletion. Type-sensitive comparison distinguishes bool/numeric changes in unknown source fields; contradictory observations remain separate rather than selecting the last response as truth. Duplicate JSON keys, nonfinite numbers, invalid Unicode, booleans used as counts and structural limits are rejected.

The module permits at most 32 observations, 1,000,000 parsed bytes per body and 2,000,000 retained raw bytes across the batch. Oversized bodies retain at most a 4,096-byte diagnostic prefix. Envelope strings are bounded to 4,096 UTF-8 bytes; only the eight recognized scalar fields are retained, while extra envelope fields are counted and ignored without traversal. Decoded JSON has at most 20,000 nodes and depth 32; media and caption collections are capped at 256 entries, with media nesting included in the media total. Unknown fields inside bounded JSON remain private source evidence. Over-limit source bytes retain a bounded prefix plus original length/hash and a fixed failure state. Extra or malformed envelope structures must not be copied recursively before validation. Full caller-supplied byte strings already exist before this function runs; neither retention bounds nor a hash claim to bound that prior allocation. See the module constants for exact limits.

Receipt output uses fixed states, hashes, lengths, counts and media-presence summaries, excluding all source text, profile fields, delivery URLs, unknown extensions and arbitrary errors. Its fixed role vocabulary lists supported distinctions, not a claim that every role was actually observed. Mutation of private result structures or a previous receipt must not contaminate later receipts.

## Actual replay and tests

The [stored public-form receipt](public-validation-2026-11-11.json) records three bounded anonymous JSON captures totaling 21,083 bytes: NodeInfo plus selected video and caption metadata. The normalizer replays the two content responses only. They retain 890 full-description bytes versus 255 summary bytes, one HLS playlist with six representations, five thumbnails and one caption metadata row. NodeInfo separately reports PeerTube 8.3.2; the inspected OpenAPI snapshot identifies itself as 8.3.0. Do not collapse these observations into a deployment guarantee.

Raw captures and headers remain external, including public profile and delivery fields. Stored-receipt tests verify the artifact contract and exact implementation hash; they do not recreate a live request. Synthetic cases cover unavailable/live/unknown data, wrong associations, malformed input, bounded retention, contradictions, collection presence and privacy isolation. No access-restricted video or live event was captured.

From repository root:

```sh
python -m unittest discover -s engineering/tests -p 'test_peertube*.py' -v
python engineering/scripts/check_research.py
```

Run the complete repository checks before publication. Full provider support, rendering, transfer, decoding, playback, captions, federation authenticity, complete history and target adoption remain separate gates. See the [dated research](../../research/2026-11-11-peertube-videos.md) and [adapter guide](../../docs/adapters/peertube.md).
