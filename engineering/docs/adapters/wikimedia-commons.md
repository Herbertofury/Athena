# Wikimedia Commons research

Reviewed October 29, 2026. Status: one real public audio file and an isolated metadata projection; not complete adapter coverage.

## Existing maintained routes

Use the official MediaWiki Imageinfo API for file identity, original URLs, sizes, hashes, upload metadata and continuation. Uploader fields are not necessarily creator attribution. Hidden file/user flags, errors and continuation must not become empty success. Extended metadata can contain HTML and is comparatively expensive; request only needed fields for a small file set, keep markup inert, and preserve the original response. [WIKIIMAGEINFO01]

The selected source page attributes its own-work recording to K6ka and declares CC0. Its file revision, API size/hash and actual transferred bytes were inspected separately. Creator/rights assertions must retain their source; an API result alone is not a license grant. [WIKIAUDIO01]

## Atlas fixture and implementation

[Audio experiment](../../experiments/commons-audio-lab/README.md) retains the real public API response, source-identity checks and local decode receipt. It reuses Atlas's strict JSON decoder after an unpublished JavaScript attempt failed a duplicate-key check. No credentials, browser sessions, third-party extractor or new package were required.

The next player route should use maintained native HTML audio controls, with autoplay off, rather than inventing a codec. File transfer and server decoding are not evidence of browser player-ready or actually-playing states. Neither was observed in this pass. Complete revisions, captions, richer media families, author profiles and legitimate authorization cases remain open. No default collector or other project is changed by this research.

## November 11 scoped revision evidence

The new [offline revision reconciler](../../experiments/commons-audio-lab/revisions.py) reuses the existing strict JSON decoder without changing the audio gate. Four actual anonymous Imageinfo responses establish two distinct upload events with the same SHA-1. A two-page broad history remains incomplete; a separately filtered two-revision window exhausts its exact captured request chain. Returned iistart and continue values are replayed together, and archive URL timestamps are not substituted for upload times. [Dated research, failures and constraints](../../research/2026-11-11-commons-revisions.md) · [receipt](../../experiments/commons-audio-lab/revision-validation-2026-11-11.json).

Missing links, cycles, overlapping revisions, changed page identities, API warnings and conflicting variants prevent exhaustion. Failed/denied/rate-limited attempts remain visible. Hidden uploader/file states remain distinct from missing metadata; uploader still does not establish creator or rights. Exhaustion is scoped to the supplied visible query, not complete history or a stable snapshot. No file transfer, decode, browser playback, active integration or target adoption is claimed. [CMR11001] [CMR11002] [CMR11003] [CMR11004] [CMR11005] [CMR11006]
