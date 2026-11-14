# CurseForge offline schema preparation

Status: isolated candidate, synthetic fixtures only. Reviewed November 8, 2026 against Athena `b1f82a9f1ac516848f6c95d4b9b87801e6090589`. No provider API, download, authenticated test, browser playback, or live UI acceptance is claimed.

## Reuse and architecture

Athena already has bounded offline Python extraction experiments and whitelisted receipts. Its current dispatcher, Media host allowlists and Modrinth-only Lab collection input do not enable CurseForge. This candidate reuses `extractors.json_loads`, `public_url` and `ExtractionError` in a separate `curseforge.py` module. It does not modify those helpers or register a new live provider.

Existing upstream implementations were inspected before implementation:

- [XMCL CurseForge types/client](https://github.com/Voxelum/x-minecraft-launcher/blob/aeb52403945f017a17f4014cb6542f73fa47dd15/packages/curseforge/index.ts), MIT. Active repository; inspected main commit dated November 3, 2026. It separates project assets/authors/files and models nullable distribution permission. Its download URL guessing helpers are deliberately excluded from this work.
- [furse Rust models](https://github.com/gorilla-devs/furse/blob/8dfb87b1807b11d46a6c094f03ddbc1c903e2208/src/structures/mod_structs.rs), MIT. Existing Rust option-based models are useful references, but the inspected head is April 2, 2025; no claim of a new 2026 maintenance release. No Rust dependency or network client was added.
- [go-curseforge models](https://github.com/Rethunk-Tech/go-curseforge/blob/f0b0070d1c328c291585bbb5a1e0d964241e6b3f/types.go), MIT. Inspected head dated November 7, 2026. Its optional distribution representation is relevant, but its default-to-available behavior for an omitted project availability field is not appropriate evidence for this mapper. Missing availability remains unknown here.

No upstream transport was installed, executed, copied into runtime, or benchmarked. This is a small local normalization layer, not a replacement HTTP SDK and not a recommendation of a fastest client. A future authorized Rust/JS client should reuse a suitable maintained implementation only after target-specific evaluation.

## Access is a separate state

The [official API](https://docs.curseforge.com/rest-api/#authentication) requires an application `x-api-key` for the relevant mod/file methods. No approved key was supplied or looked up. The [official CDN notice](https://blog.curseforge.com/introducing-api-key-authentication-for-curseforge-file-downloads/) also states direct file downloads require a valid API key from July 16, 2026. No protected request, scrape, key creation, mirror or guessed CDN route is included.

`access_state` accepts only a configuration boolean and optional caller-supplied HTTP status, never a credential. It distinguishes missing key, not attempted, unvalidated response, authentication rejected, forbidden, not found, rate limited, upstream error and other failure. A configured key is not verified authorization; a synthetic HTTP status is not live evidence. Automatic retries remain disabled. This module never initiates a request.

## Selected schema mapping

`normalize_project_response` accepts a JSON envelope and expected project ID. It preserves project/game IDs, name/summary, source reference, separate authors, logo and ordered screenshots, latest-file summaries, nullable distribution permission, and project search availability. A project image never becomes an author avatar. Missing arrays/flags have explicit supplied-field information; absence is not proven empty content.

`normalize_files_response` verifies each file's project and game identity, duplicate IDs, file size, availability, nullable early-access state, nullable download reference, dependencies, hashes and game versions. Python file sizes remain exact integers and include a decimal string. Public receipts emit the decimal string, avoiding a false JavaScript-safe integer promise for int64 values. Hashes are recorded metadata, not verified download checksums.

A separately supplied HTML description is retained only in memory with `renderable: false`. Its envelope has no project identity, so ownership is explicitly unverified and its association is only the caller's supplied pairing. Summary text is never promoted to a full description. Category detail, full release indexes, changelogs, author profiles, archive contents and every other API field are outside this selected mapping; it is not a full API implementation.

URL fields are sanitized HTTPS provenance references only, with query/fragment removal made explicit and `fetchAllowed: false`. Missing/invalid references remain distinct. Even a returned URL, available file, or distribution flag does not grant permission to download. No URL arithmetic or delivery fallback exists.

## Completeness and preservation

Pagination enforces a maximum page size of 50, response-count consistency and the documented 10,000-row window. A first page covering its reported query total can be `completeForQuery`, but never complete import. A later terminal page, missing pagination, empty incomplete page, more records, and exhausted search window remain distinct. Latest-file summaries never become complete release history.

The mapper is pure and has no storage integration. Invalid inputs raise `ExtractionError`; they do not write empty results over last-good data. A future collector must retain last-good records and failed evidence, bind request provenance to response identity, handle explicit authorization and redact diagnostics before persistence.

`receipt` projects only validated IDs, counts and fixed state fields. It excludes raw JSON, arbitrary nested enrichment, prose, filenames, hashes and all URLs. Descriptions are never rendered. Bounds are 4 MiB serialized input, 50,000 JSON nodes and depth 64; duplicate keys, non-finite values, ownership mismatches and malformed identities fail closed.

## Verification and remaining gates

The isolated candidate passes 110 extraction tests: 71 existing regressions and 39 new synthetic tests. Independent review reproduced and repaired candidate-only nullable early-access handling, nested receipt enrichment, Unicode error normalization and malformed-host reference handling. Description ownership uncertainty is explicitly labelled. Failing before-fix logs are retained with the stage evidence.

No live records, approved API access, complete author listing, rendered media, file delivery, authenticated state, browser integration, or performance improvement was demonstrated. Transport, UI registration, secure configuration, real authorized fixtures, last-good storage wiring and end-to-end CI remain separate future gates. Autoplay is not enabled.
