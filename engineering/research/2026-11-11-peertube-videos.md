# PeerTube selected-video evidence

Checked November 11, 2026. Base: Athena research draft #43 at `7ba88d30229f3073c9aa738f087b9199ffae16ae`. This is an isolated metadata adapter experiment, not an application, renderer, media player or target upgrade. The open-draft inventory and existing implementation were checked first: no PeerTube normalizer was present. Mastodon draft #48 remains a separate contribution.

## Decision and reusable foundation

A video reader must distinguish a short description from its full source, a channel from its owner account, and a thumbnail from an actual media representation. A response with no top-level files can still describe HLS delivery. These are concrete extraction decisions that a generic webpage scraper or single-file selector would miss.

The [new video gate](../experiments/peertube-video-lab/README.md) reuses the existing [strict JSON and Markdown helpers](../experiments/site-extraction-lab/README.md), with bounded local byte inputs, explicit request association, failure retention and a small public-form receipt. No new client dependency or network implementation is added.

## Primary contract and version boundary

The official REST quick start links the upstream OpenAPI specification. The exact inspected snapshot is `Chocobozzz/PeerTube` commit `53928dd6242afb8f0d5cdd48ac20b3608342ab24`, with OpenAPI info.version `8.3.0` and SHA-256 `759bf8dbe368c39b1436c1771755b5ac234cf86b92f4f644a403506e748a96ec`. The live instance's NodeInfo reports `8.3.2`. These are separate observations, not proof of identical deployments or universal version compatibility. [PTV11001] [PTV11002]

The inspected operations are anonymous selected public `GET /api/v1/videos/{id}` and `GET /api/v1/videos/{id}/captions`. Protected videos may require authentication or a password. No password, OAuth client, token, account setup or native action was requested. The current snapshot returns full Markdown `description` in VideoDetails separately from `truncatedDescription`; it does not define a separate `/description` operation. Older examples must not silently be treated as the current contract. [PTV11001]

Important distinctions:

- The numeric video ID is local to the queried instance; UUID, short UUID and canonical URL are separate fields. Account and channel identifiers are not interchangeable. The official federation model distinguishes the account's Create from the channel's Announce; this does not independently prove original creative authorship. [PTV11001] [PTV11005]
- `files` contains web-compatible files, while `streamingPlaylists[].files` describes fragmented representations used by HLS. Either collection can be empty when its delivery mode is disabled. Preserve both scopes and each manifest/direct/download/torrent role without inventing a playable URL. [PTV11001]
- Modern thumbnail and caption `fileUrl` fields matter when deprecated path fields are null, including storage arrangements outside the API origin. Storage host, video publisher and original creator are different concepts. [PTV11001] [PTV11004]
- Captions have their own selected-video response, total, language, generation flag and file/playlist references. A metadata row does not prove a complete transcript, accurate translation, downloaded WebVTT or usable synchronized subtitles. [PTV11001] [PTV11003]
- Privacy, processing state, live state, downloadEnabled and license are independent declarations. DownloadEnabled does not establish successful transfer or reuse rights; a declared published state does not establish decoder or player success. [PTV11001] [PTV11003] [PTV11006]

## Actual bounded public observations

The [public example video](https://framatube.org/videos/watch/9db9f3f1-9b54-44ed-9e91-461d262d2205) is linked by the official watch/share guide. Exactly three serial anonymous JSON requests were made with a descriptive research User-Agent, one-MiB response bounds, thirty-second timeout, and no automatic redirects, cookies or credentials. [PTV11002] [PTV11003] [PTV11007]

1. NodeInfo: HTTP 200, 3,169 bytes, SHA-256 `0cd0dab99b8e8888b999cfc04e5b59bd5162516ba9f4ab1dc1ba3f20e398e97d`. It reports PeerTube 8.3.2. This is descriptive instance evidence, not a runtime dependency or authenticated attestation.
2. Video details: HTTP 200, 17,442 bytes, SHA-256 `3a92d9c346f0ac26f6e586c0b3902cffe3c84372ba3a8fd76121fe4bf6ca5734`. Full description is 890 UTF-8 bytes; truncated description is 255 bytes. Root files is explicitly empty, but one HLS playlist contains six ordered representation records, including resolution ID zero. Five thumbnails are declared. The source declares public, published, not live, and download enabled.
3. Captions: HTTP 200, 472 bytes, SHA-256 `b7071738c08e2c76db066a08c35eddf2ba9bf24ad37d2434772ed2f0081fcc6a`. The response total and observed row count are both one; the caption is declared automatically generated. Neither its file nor its playlist was requested.

The total captured JSON is 21,083 bytes. No video segment, manifest, image, thumbnail, subtitle, torrent, magnet transfer or outbound description link was retrieved. The [public-form receipt](../experiments/peertube-video-lab/public-validation-2026-11-11.json) contains only selected hashes, lengths, counts and fixed states. Raw source JSON, public profile fields, delivery URLs and headers remain external. Stored-receipt tests do not make a new live request.

## Rejected alternatives and retained research failures

- Root-files-only extraction would report this actual video as having no media. Flattening HLS representations into generic attachments would lose the delivery mode and nesting that a later player needs.
- A short description or link-preview card must not replace the full source. Markdown event extraction is deliberately incomplete and is not rendering approval.
- Joining an unlabelled caption body to the last seen video can attach the wrong transcript. Bind the supplied request path, instance and UUID explicitly.
- A channel name, thumbnail or storage owner must not replace the uploader/account attribution. Preserve roles and unknowns rather than infer identity.
- Initially guessed individual generated documentation URLs were not accessible through the documentation tool; the old video-operation page returned a moved-page notice. The actual official links led to the current grouped reference, while exact field decisions use the pinned upstream specification. No protected API response or browser denial was worked around.

Independent synthetic review found an initial envelope-copying defect: deep malformed metadata could throw before validation, and oversized rejected bodies remained retained. It also found that public counts could not distinguish missing from empty media collections. The revised boundary retains only bounded scalar envelope evidence and bounded raw prefixes, leaves extra envelope objects untraversed, and exposes collection/playlist-type states in the receipt. Original reproductions remain retained; they are implementation failures, not failures of the actual public video.

No private/password-protected video, live event, failed transfer or server migration was observed live. Defensive cases use synthetic fixtures and remain labeled synthetic. There is no benchmark, target baseline comparison, media acceptance, complete catalog/history, edit/deletion synchronization or broad federation certification. Read the [adapter guide](../docs/adapters/peertube.md) for practical adoption gates.

## Sources

PTV11001 through PTV11007 are additive entries in the [source fragment](../data/sources.d/peertube-videos-20261111.json). Every prior source record and dated result is preserved.
