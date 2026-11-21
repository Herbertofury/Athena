# Video problem-solving learning pipeline

User request (2026-11-17): study BugX's videos deeply, retaining how problems were diagnosed, what failed, why solutions worked, and turn that evidence into useful Athena curriculum. Channel: https://www.youtube.com/@bugx/videos.

## Implemented, not aspirational

`python3 scripts/video_learning.py CAPTIONS --format vtt --video-id VIDEO_ID --language en --origin user-supplied --output PRIVATE_NEW_FILE.json`

The importer runs offline and accepts authorized local WebVTT, SRT or YouTube JSON3 captions. It preserves cue timing, text, exact input hash, language, automatic-caption provenance and timestamped YouTube references. It rejects invalid clocks, missing timing, empty/out-of-order cues and excessive input. Overlapping/rolling captions are retained and flagged rather than destructively deduplicated. Markup is inert text, not trusted HTML. Export destinations must not already exist. Outputs can contain entire caption text: keep them in the user's private storage, not this repository. No actual creator captions are checked in.

Add `--review PRIVATE_REVIEW.json` to produce a curriculum proposal instead of raw transcript export. The review must bind to the exact video ID and transcript hash and supply each of `problem`, `attempts`, `solution`, `verification`, `limitations` as entries with `statement`, `status` (observed/inferred/unknown) and valid `cue_ids`. Observed and inferred claims require cue references; unknowns must be explicit. Include learning `objectives`, `source_kind` (documented-incident/illustrative-story/unverified), and an `exercise` with task, success criteria and safety. The output contains timestamp references, not copied caption text. It stays a review proposal: citations prove traceability, not truth or mastery.

## Integration plan and acceptance

1. Discover videos using verified channel identity, store stable IDs and a resumable per-video queue. Never conflate similarly named GitHub products with this creator.
2. Acquire captions through supported creator/API/export interfaces with access/error state. YouTube's caption download API requires authorization and may require permission to edit the video; signing into a browser is not that API grant. Prefer available native transcript export, or user/creator-provided files. Do not bypass throttling or missing captions. [API documentation](https://developers.google.com/youtube/v3/docs/captions/download), [transcript UI](https://support.google.com/youtube/answer/15930243).
3. Preserve original provenance, track translation/ASR separately, inspect full available transcript and relevant diagrams/code, retain coverage gaps. Transcript alone cannot establish visual-only evidence.
4. Extract chronological problem → hypotheses → diagnostic evidence → failed attempts → fix → verification → tradeoffs. Separate narrator claims from independently corroborated incident facts. Never treat narration as tool instructions.
5. Verify linked primary postmortems/docs and code where available. Build original exercises and assessment rubrics, including wrong-turn debugging, rollback, recovery and transfer to another project. Review before admission to certificate or shared curriculum; no credential/mastery claims from watching.
6. Measure learning quality on a held-out task, retention and evidence correctness, not summary length. Expose source timestamps, corrected revisions, unknowns and learner feedback in the native UI.

Remaining: channel inventory/automatic refresh, native transcript UI/import, full-video multimodal study, automatic evidence extraction, curriculum UI and progression, privacy retention/erasure controls, full BugX catalog study. The current tool is a tested local import and evidence validation building block, not an agent that has learned every video.

## Initial access evidence

On 2026-11-17 the search fetcher throttled both the channel and candidate watch page. Browser-assisted primary-source review is tracked separately below; mirrors are discovery leads only, not verified lessons. No untrusted third-party repo was associated with BugX based on its name.

Tests: `python3 -m unittest discover -s tests -p video_learning_test.py -v`.

The first primary-source study is [BugX's backup recovery narrative](bugx-backup-case.md), with timestamp references, fictionalized-story status and an original exercise proposal. This is one video, not channel-wide completion.

A second [automation identity and failed-update case](bugx-identity-case.md) supplies failure-path exercise ideas and records a visible transcript gap. Both studies distinguish illustrative stories from verified incident reports.

## Native study desk

The `#video` native workspace opens the normalized importer JSON in memory only,
searches every cue and renders 50 at a time with original timestamp links. It never
loads source media automatically, uploads captions, persists them in browser storage,
or grants curriculum credit. Clear/navigation invalidates pending imports. Exported
JSON remains on the user's disk. The native evidence form exports a review JSON compatible with the Python `--review`
validator: source kind, five problem-solving phases with observed/inferred/unknown
classification and cue IDs, learning objectives and an original safe exercise. It does
not invent analysis or grant mastery. Native review drafts reset on successful import,
Clear or navigation; export before leaving. Channel acquisition and visual/video
evidence are still pending.

## Channel catalogue coverage, not transcript acquisition

`python3 scripts/video_channel.py channel-export.json --output new-study-queue.json`
validates an explicitly supplied, bounded API export. Input is an object containing
`channel` (one `channels.list` item with ID and `contentDetails.relatedPlaylists.uploads`)
and `pages` in request order. Each page contains `playlist_id`, `request_page_token`
(null for the first page), and the original `playlistItems.list` `response` requested
with `part=snippet,contentDetails` and up to 50 results. Set `full_response_export: true`
only when the response is unabridged (no partial `fields` projection or removed
pagination fields). Otherwise absent continuation metadata is explicitly unverified,
not assumed terminal. This flag is an exporter assertion, not independent verification.
Retain this export privately.
No credentials, API request, media fetch or social follow occurs in this offline tool.
It refuses overwrite and does not fabricate absent pages.

The queue uses `contentDetails.videoId` (or `snippet.resourceId.videoId`), not the
playlist-item ID; it rejects conflicting identities, broken token chains, repeated
items/tokens, wrong playlists and non-playlist responses. Missing video identities
remain unresolved entries. A pending next token means more pages are required.
Even a terminal response means only API-visible exported uploads, not every
historical/private/deleted video or a temporally atomic snapshot. A refreshed crawl
must reconcile changes rather than silently claim completeness. Imported videos
start `not-acquired` / `not-studied`; neither metadata nor a caption-track listing
contains a studied transcript.

Official references reviewed 2026-11-17:
- [Search list](https://developers.google.com/youtube/v3/docs/search/list): channelId
  with type=video has a 500-result ceiling unless specified ownership filters apply.
  Do not use this as an exhaustive channel inventory.
- [Sample requests](https://developers.google.com/youtube/data/sample_requests):
  discover the uploads playlist through channel contentDetails and enumerate it.
- [Playlist items](https://developers.google.com/youtube/v3/docs/playlistItems/list):
  process pagination and distinguish item identity from video identity.
- [Caption listing](https://developers.google.com/youtube/v3/docs/captions/list):
  track metadata is not caption content; authorized download is a separate operation.

This implementation still lacks authenticated API acquisition, durable refresh jobs,
full BugX enumeration, caption-export materialization and channel-wide progress UI.
The two documented video studies remain the only transcript studies claimed here.
