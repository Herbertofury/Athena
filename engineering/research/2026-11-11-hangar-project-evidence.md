# Hangar public project and selected-version foundation

Checked November 11, 2026 UTC. Source register: HGP11001–HGP11004.

## Decision and existing work

At Athena integration base `7ba88d30229f3073c9aa738f087b9199ffae16ae`, Hangar had an official-route research recipe but no executable normalizer. Modrinth already had raw Rust version retention, selected-release Python extraction and earlier public evaluations; another generic Modrinth version adapter would duplicate that work. Thunderstore remained a documented candidate with weaker retained field-level evidence. This selects a bounded Hangar gap, not a platform ranking or target-project recommendation.

Reuse the existing strict JSON, safe-reference and inert Markdown helpers. Preserve complete supplied bytes, then expose scoped project/version/page facts with explicit states. No active runtime, account integration, HTTP collector or download executor is added.

## Current first-party contract

The [Hangar OpenAPI](https://hangar.papermc.io/v3/api-docs/public), linked from [API documentation](https://hangar.papermc.io/api-docs), identifies itself as OpenAPI 3.1.0 / Hangar API 1.0. It documents anonymous public information, meaningful User-Agent identification, rate limits and route-specific operations. Unlisted routes are internal and must not be used. Deprecated owner/project aliases are excluded from this implementation.

The relevant documented paths are singular project `GET /api/v1/projects/{slugOrId}`, selected version `GET /api/v1/projects/{slugOrId}/versions/{nameOrId}` and main page `GET /api/v1/pages/main/{project}`. The implemented subset uses numeric IDs only. No authentication endpoint, permissions endpoint, user/member route or download counter endpoint was called.

The [terms](https://hangar.papermc.io/terms) retain author rights and do not provide blanket relicensing or a safety guarantee. Raw body text, screenshots and linked media are not republished with this contribution.

## Actual observations

Six API/schema responses plus terms were retained privately with exact request/final URL, timestamp, status, byte length and SHA-256. Every response was HTTP 200 without redirect or retry. The [public validation receipt](../experiments/hangar-project-lab/public-validation.json) publishes identities, hashes, field states and counts only.

Public project 14 GeyserMC/Geyser and selected version 238 have an explicit `projectId` join. Singular project body is null while the independently fetched main page contains 2,906 bytes, byte-equal to the search result body. Search and singular fields differ; version list/detail counters and member-name fields differ too. These are separate captures, not a coherent database snapshot or a demonstrated provider defect.

The selected version exposes three platform-keyed external download references. All are moving `latest/builds/latest` routes, with no `fileInfo` or provider-hosted download URL. Metadata references do not establish immutable artifact bytes, checksums, authenticity, installation safety or compatibility. Provider review/channel flags and platform dependency declarations are retained without promoting them to tested results. No link was followed to a binary or media host.

All API responses advertise no-store/no-cache controls. Their ETags do not authorize ordinary live response reuse. The experiment consumes caller-provided offline research captures and has no HTTP caching implementation.

## Rejected shortcuts and retained failures

- Do not merge search body into a null project-detail field: keep separate scope/provenance and exact raw bytes.
- Do not treat project icon or namespace owner as a verified creator avatar/person.
- Do not resolve external latest links, infer file hashes or flatten platform-specific declarations into universal compatibility.
- Do not implement a parallel Markdown parser just to improve this sample. Shared projection limitations remain visible while exact full text survives.
- The October 28 ViaVersion endpoint retrieval failed with unknown HTTP status. That deprecated URL was not retried, and this distinct public sample does not erase or resolve it.
- No unsuccessful HTTP response was deliberately induced. Error-state tests are synthetic, not live provider acceptance.

## Acceptance boundary

The [implementation and tests](../experiments/hangar-project-lab/README.md) establish bounded offline evidence handling for supplied responses. Actual search/list captures are discovery context, not an implemented complete collection. Full history, hidden channels, creator joins, media decode/playback, file verification, browser UI, rate-limit recovery and target-project adoption require their own permitted evidence. No merge or deployment is part of this work.
