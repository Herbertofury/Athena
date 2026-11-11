# NASA selected-media evidence

Checked November 11, 2026. Base: Athena research draft #43 at `7ba88d30229f3073c9aa738f087b9199ffae16ae`. The current repository and open drafts had no NASA Image and Video Library adapter. This isolated experiment reuses Athena's strict JSON foundation; existing provider drafts and runtime remain unchanged.

## Decision and scope

A media reader needs to distinguish searchable descriptive metadata, preview links, an asset manifest and a pointer to a separate metadata or caption file. These endpoints do not have identical availability. Treating one missing search result as deletion, or treating a caption location as a usable transcript, would lose meaningful evidence.

The [new offline gate](../experiments/nasa-media-lab/README.md) binds captured responses to an explicitly selected NASA ID and operation, retains individual failures and contradictions, and produces a public-form receipt without source prose or delivery URLs. It fetches nothing and makes no target recommendation.

## Official contract

The official API PDF identifies itself as release `v1.22.0`, January 6, 2023. The downloaded 417,364-byte PDF has SHA-256 `768f5ee932ff0a3a9195970221b4b2d64ef07971d283d2a34faf0769a2f70ac1`. It documents keyless example requests to `images-api.nasa.gov` for search, asset manifest, metadata location and caption location. The release date is not a live deployment version. Actual collection responses use version `1.1`; the PDF examples show `1.0`. [NSM11001]

- Search returns Collection+JSON items with data arrays, descriptive fields and link rel/render roles. Preserve NASA ID, publishing center, photographer and secondary creator separately; do not infer a person from the center or hosting domain. Description and description_508 are separate source fields.
- Search totals and pagination links apply to the supplied query. A selected page is not a complete catalog or an authoritative record of deletion.
- Asset manifests return ordered href entries. They do not establish bytes, MIME types, codecs, dimensions, successful transfer or an intrinsically preferred original. A filename or extension is only a hint.
- Metadata and caption operations return a location pointer. Reading the pointer is not reading the pointed-to file. A caption pointer is not a transcript or playback acceptance.
- Preserve returned references separately from the actual request transport. These HTTPS captures contain `http://images-api.nasa.gov` collection href strings. They were not HTTP redirects, and no reference was followed or silently rewritten. [NSM11001]

NASA usage guidance includes attribution, third-party rights, people and branding/endorsement exceptions. Presence on a NASA host does not grant unrestricted reuse, and this experiment neither licenses nor republishes imagery. [NSM11002]

## Actual bounded observations

Both selected IDs are examples in the official API document. Exactly six serial anonymous requests were made with descriptive User-Agent, one-MiB response caps, thirty-second timeouts and no automatic redirects. No cookie jar, key, credential, grant, account operation or media request was used.

For the documented image example:

1. Selected image search: HTTP 200, 2,101 bytes, SHA-256 `41ca093e8a944963b626cd8b530b873c61dc17e4c699eb8bad6d3f5a9ff09b05`. One metadata row and total one; exact description is 723 UTF-8 bytes. description_508 is absent. Five links include one preview plus alternate/canonical references. [NSM11003]
2. Asset manifest: HTTP 200, 586 bytes, SHA-256 `f1ea49b7f15f7b46ac9c0b795b1853fecb6dee82f70dbd99e930fa938bfb8b1e`, containing six ordered references. [NSM11004]
3. Metadata location: HTTP 200, 78 bytes, SHA-256 `98fce6c1e62f4d80d5ed54eb26414b78a2c41bde7cf862e45ece868428070701`. This is only a pointer; the metadata file was not fetched. [NSM11005]

For the documented video example:

4. Selected filtered search: HTTP 200, 172 bytes, SHA-256 `83fab59423d481d58903360d37d211d43142aebce1be62f8bb6da9259012dc00`, with items=[] and total_hits=0. This exact query did not provide a metadata record. [NSM11006]
5. Asset manifest: HTTP 200, 4,807 bytes, SHA-256 `07f7822bc680b7fba1b44d2b3a14a8b301ba81a6ef10a37ad3b4ebe54eda28a5`, containing 52 ordered references. These are references, not 52 verified media files. [NSM11007]
6. Caption location: HTTP 200, 83 bytes, SHA-256 `1050e0bbef20c50f9c54d5368eb1952b2a10684ba7329d97e7b9682aa289ab5c`. No caption file was retrieved. [NSM11008]

The captured API JSON totals 7,827 bytes. The empty video search is retained alongside the available manifest and caption pointer. It was not retried with a changed query, labeled deleted or filled with an invented title, body or creator. It does not prove why the search was empty or that the referenced media remains retrievable.

Raw JSON and request/response headers remain external. The [stored receipt](../experiments/nasa-media-lab/public-validation-2026-11-11.json) contains hashes, lengths, counts and fixed states rather than raw descriptions, personal names, identifiers or delivery URLs. Stored-contract tests do not make a live request.

## Alternatives and limits

A generic page scraper would bypass the structured relationship information already provided by the documented API. A single success/failure flag would hide the actual cross-endpoint discrepancy. A preview-first downloader would confuse a display link with a verified original and unnecessarily perform media transfers. Reuse the official endpoints and existing local parser instead.

The evidence covers two selected IDs and six captured responses. It does not establish complete search/catalog history, authenticated/private access, deletion synchronization, supported video playback, image decoding, accessible captions, rendering safety, provenance authenticity or reuse licensing. Unknown versions, fields, relation types and missing data must remain explicit. No target baseline comparison, performance claim or application/mod adoption follows.

## Sources and reproduction

NSM11001 through NSM11008 are additive entries in the [source fragment](../data/sources.d/nasa-media-20261111.json). Read the [adapter guide](../docs/adapters/nasa.md) and [experiment API](../experiments/nasa-media-lab/README.md). All prior source records and dated results remain intact.

## Independent review and retained failures

Independent synthetic probes found four initial gaps: a nonempty item with an empty data array was labeled an empty search; a returned match with total_hits=0 did not flag the contradiction; a record outside the request's media-type filter was accepted; and an other-ID NASA preview link escaped the identity check applied to item and manifest hrefs. All four were corrected with focused regressions. The initial probe outputs and the intermediate missing-artifact and stale implementation-hash test outcomes remain in the external review record. None of the six captured responses was changed or retried.
