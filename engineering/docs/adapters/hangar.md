# Hangar public project and selected-version evidence

[Adapter directory](README.md) · Checked November 11, 2026 UTC

## Reuse and scope

The [offline project experiment](../../experiments/hangar-project-lab/README.md) adds a bounded reader for caller-supplied official Hangar responses, reusing the existing extraction lab's strict JSON and inert body/reference helpers. It does not add another HTTP collector, account integration or downloader. The earlier [Hangar research recipe](mod-hosts.md#8-hangar) remains dated background.

The [public OpenAPI](https://hangar.papermc.io/v3/api-docs/public) explicitly permits anonymous public information and forbids relying on unlisted internal routes. This implementation deliberately selects numeric project/version identities on documented singular GET routes. Project, selected version and separately received main-page text keep independent provenance and complete original bytes. Missing, null and empty fields remain distinct.

## Actual completeness findings

Seven bounded anonymous GETs covered the official schema, terms, one project search, project detail, one filtered version-list response, one selected version and one main-page response. All returned HTTP 200. No account, media or binary endpoint was used.

- Public project 14 is Geyser, in namespace GeyserMC/Geyser. The namespace is an owner label, not verified individual-person identity. The project icon is not an owner avatar.
- Singular project detail returned `mainPageContent:null`; the separately requested main page supplied 2,906 UTF-8 bytes. Search contained the same body. The adapter preserves these independent facts rather than substituting text into the null field.
- Selected version 238 explicitly declares `projectId:14`. Its name, Geyser, is a provider label, not a semantic version. Provider `reviewed` and channel `Release` are retained status values, not security or compatibility acceptance.
- PAPER, WATERFALL and VELOCITY downloads point to external mutable `latest/builds/latest` URLs. Each has null `fileInfo` and null Hangar `downloadUrl`. No file size, digest, immutable artifact identity, delivery or safety was verified.
- Platform dependencies and formatted display ranges are separate; an empty plugin-dependency map is recorded as empty. Project-supported platforms must not replace the selected version's declarations.

Search/list/detail counters and some optional fields differed. The captures are independent observations, not an atomic snapshot. Search was not exhausted. The version-list result was scoped to visible channels and one selected page; no full history claim follows.

## Body, media and access states

Full text remains inert and exact. Shared Markdown projection is explicitly incomplete; an image/video reference is not a decoded gallery or playback result. Icon, body-media and external-download references were not fetched. Unsafe reference URLs remain rejected references without deleting original evidence.

The schema's advertised string/array fields do not fully describe observed nulls. Captured data, schema claims and synthetic malformed inputs are kept separate. Non-success, redirected, oversized, truncated, mismatched or non-public responses must not become successful records merely because JSON parses.

Current responses include `Cache-Control: no-cache, no-store, max-age=0, must-revalidate` despite also carrying ETags. Offline research capture is not permission to operate a reusable live HTTP cache. No credentials or response cookies were used; public receipts omit cookies and raw third-party prose.

[Sanitized actual receipt](../../experiments/hangar-project-lab/public-validation.json) · [Dated research and source IDs](../../research/2026-11-11-hangar-project-evidence.md)

## Remaining gates

The October 28 ViaVersion API retrieval failure had no known HTTP status. Its deprecated route was not retried; current Geyser success does not resolve that failure. No author/profile join, native follow/import, hidden-channel access, complete history, file transfer, installed plugin test, target-project comparison or production integration is accepted here.
