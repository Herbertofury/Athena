# Mod distribution and creator host adapter research

[Adapter laboratory](README.md) · [Coverage catalog](coverage-catalog.md) · [Login research](authenticated-research.md) · [Validation and adoption](validation-and-adoption.md)

Reviewed October 28, 2026 UTC. This page records primary documentation, public observations and proposed extraction methods for game-mod distribution and creator communities. Documentation and visible pages establish only the capabilities described; no entry is presented as an implemented or authenticated working adapter.

This guide covers 64 mod-host and related-tool entries. Source reading depth varies: inspected primary sections, first-party page observations, official search leads and inaccessible candidates remain distinct in the [central catalog](../../data/site-adapter-catalog.json). Authoring tools and reference services are explicitly identified and are not additional mod hosts. A successful homepage fetch does not establish complete author extraction, pagination, login, downloads, native follows or paid access.

Companion research covers [Dwemer Mods](dwemer-mods.md), [WCIF](wcif.md), [Plumbdex](plumbdex.md) and [TS4 Rebels](ts4-rebels.md). Use the [author, post and media contract](author-post-media-contract.md) for normalized records and the [validation gate](validation-and-adoption.md) before promoting any capability.

## Evidence and normalization rules

- **primary documented:** inspected site-owned API/schema/help/source sections establish the scoped interface or restriction. This still requires implementation fixtures.
- **public page observed:** a current first-party page establishes the stated visible behavior. Indexed first-party excerpts remain discovery leads in the central catalog until relevant page sections are inspected. Proposed parsing has not been validated.
- **candidate / fixture needed:** access failed, returned a shell, or requires actual member/download fixtures. Do not invent routes/selectors.
- **historical or unconfirmed candidate:** name/domain known or requested, but current first-party operation/redirect not established.

Use site-scoped account IDs when actually exposed; retain canonical profile URLs as aliases and display names as mutable labels. A claimed original author, uploader, porter, translator, team, and organization can be different principals. Profile avatar belongs to the resolved account; cover art, mod icon, package thumbnail, game logo, and poster image cannot substitute. If only a credited name is available, model an unresolved credited creator with no account ID/avatar.

Separate author profiles, mod/project records, announcements/posts, releases/versions, and downloadable files. A new ZIP is a release event, not automatically a social post. Store full source body, sanitized renderable body, ordered inline/gallery media, media captions/alt text, canonical links, source timestamps, game/version/loader/platform requirements, release changelog, and file metadata independently. Parse declared dependencies with relation type and scope. Never upgrade a prose mention to a machine-verified compatibility constraint.

“Follow creator” means a local application subscription by default. Native follows/watches/bookmarks/subscriptions and import of existing native relationships are distinct capabilities. An observed Follow button proves the feature exists, not that its API or a complete import works. Subscription to a Workshop/mod.io item may install and update it; that differs from following its author.

Login means legitimate interactive user authorization or documented API/OAuth delegation. Capture session-scoped author/profile/public/private/gated states, expiry/revocation, and return-to-login behavior. Paid content must preserve price/currency/early-access time/entitlement-required state; ingestion does not grant purchase, download, or redistribution rights. Do not reuse signed file URLs as stable IDs, forward credentials to external mirrors, or replace entitlement checks with URL construction.

Pagination and polling are implementation designs unless a source explicitly documents them: use conditional requests when supported, stable ID deduplication, overlapping update windows, deletion/hidden markers, returned rate headers, Retry-After, and bounded backoff. Unknown rate limits mean conservative operation and later fixture/owner validation, not an invented numeric quota.

## Fifteen deep recipes

### 1. Nexus Mods

**REST v1 plus explicitly provisional GraphQL v2.**

Documentation confirms v1 remains supported; v2 is work in progress and may change without notice. V2 uses `https://api.nexusmods.com/v2/graphql`; most reads are public, and selected operations require OAuth. Resolve numeric memberId and User.avatar; query mods by uploaderId, using documented count/offset, and preserve credited author separately. Query only currently documented mod/file/body/media/requirement fields. Native isTracked state is user-context data, not proof of a complete import.

For v1, use the official client/registered application SSO and user key; personal keys are appropriate for testing/personal use, public releases require Nexus registration. The linked Swagger page returned 404 in this pass; pin working official client/schema fixtures before documenting exact REST contracts. Handle Premium and free website-initiated NXM downloads separately; never claim arbitrary API downloads for free accounts. Read returned rate headers. Current official help describes 20,000/day, then 500/hour; older third-party limits conflict.

**Primary sources:** [Nexus Mods API v2 Reference](https://graphql.nexusmods.com/); [API Acceptable Use Policy](https://help.nexusmods.com/article/114-api-acceptable-use-policy); [Nexus-Mods/node-nexus-api](https://github.com/Nexus-Mods/node-nexus-api); [Nexus rate-limit help](https://help.nexusmods.com/article/105-i-have-reached-a-daily-or-hourly-limit-api-requests-have-been-consumed-rate-limit-exceeded-what-does-this-mean). Download entitlement needs current authorized free/Premium fixtures; [historical Vortex issue report](https://github.com/Nexus-Mods/Vortex/issues/14549), which is not a current API contract.

### 2. Modrinth

**Author -> projects -> versions -> files.**

Use documented v2 API; GET /user/{id|username} resolves the provider-issued base62 ID and avatar_url, then GET /user/{id|username}/projects. Fetch project ownership/team membership; do not label every collaborator the sole owner. Project body/icon/gallery is separate from version changelog. GET /project/{id|slug}/version supplies release versions, game versions/loaders, dependencies and files with URLs/hashes/primary flags; use version IDs rather than version_number as unique keys.

Local author following watches that author's returned projects and releases. Native API follows projects, with follow operation USER_WRITE and authenticated /user/{id|username}/follows import; this is not documented author-follow functionality. Public metadata usually needs no token; use scoped PAT/OAuth only when required. Provide uniquely identifying User-Agent, honor rate headers (currently documented 300/minute), and use declared search offset/limit and version endpoint pagination/filter behavior rather than assuming all endpoints page identically.

**Primary sources:** [Overview](https://docs.modrinth.com/api/), [Get a user](https://docs.modrinth.com/api/operations/getuser/), [Get user's projects](https://docs.modrinth.com/api/operations/getuserprojects/), [Get a project](https://docs.modrinth.com/api/operations/getproject/), [List project's versions](https://docs.modrinth.com/api/operations/getprojectversions/), [Get user's followed projects](https://docs.modrinth.com/api/operations/getfollowedprojects/), [Follow a project](https://docs.modrinth.com/api/operations/followproject/).

### 3. CurseForge

**Explicit author filtering, files, description, entitlement.**

Use x-api-key against `https://api.curseforge.com`. Search Mods supports authorId (member of project) and primaryAuthorId (owner), gameId, index/pageSize. ModAuthor has id/name/url but no avatar field in current published schema: fetch a first-party author-profile fixture or leave avatar missing. Mod description, screenshots/logo, files, file changelog and download URL are separate resources. File dependencies and game versions are release data. Public catalog/project membership does not imply author social posts.

The documented page size max is 50; index + pageSize <=10,000. Partition queries when needed and report incomplete windows. Preserve allowModDistribution and unavailable/null download states. A June 10, 2026 official announcement says edge.forgecdn.net direct downloads require a valid API key from July 16, 2026 and recommends x-api-key header. Do not generate CDN URLs from arithmetic. Native follow/import not established. Hytale is current official CurseForge coverage; discover game ID instead of hardcoding a guessed one.

**Primary sources:** [CurseForge for Studios API](https://docs.curseforge.com/rest-api/), [Introducing API Key Authentication for CurseForge File Downloads](https://blog.curseforge.com/introducing-api-key-authentication-for-curseforge-file-downloads/), [Hytale Modding Official Launch – Create Mods with CurseForge](https://hytale.curseforge.com/), [Hytale New Worlds Modding Contest](https://hytale.com/news/2026/3/hytale-new-worlds-modding-contest).

### 4. Steam Workshop

**SteamID64 and published-file identity.**

Official ISteamRemoteStorage GetPublishedFileDetails accepts published-file IDs; use supported IPublishedFileService methods only with their documented auth. The creator SteamID64 must resolve through ISteamUser GetPlayerSummaries/profile fields for persona/avatar. Vanity name, Workshop title, item preview and game icon cannot supply stable author identity. Namespace item by publishedfileid and consumer/creator app as provided.

Preserve title, description, preview/media, timestamps, tags, visibility, and child/collection relationships when returned. A collection is not a mod binary. Steam UGC install/download and ownership flows are separate from public metadata. Do not promise universal direct HTTP ZIPs: app-specific UGC/game ownership/publisher credentials can matter. Steam OpenID identifies a user; it does not by itself grant arbitrary write/download or private subscription-list access. Native item subscription differs from creator follow. Need live public/private profile, multi-author item, collection and subscribed-item import fixtures before advertising support.

**Primary sources:** [ISteamRemoteStorage Interface — Web API](https://partner.steamgames.com/doc/webapi/ISteamRemoteStorage), [IPublishedFileService Interface](https://partner.steamgames.com/doc/webapi/IPublishedFileService), [ISteamUser Interface](https://partner.steamgames.com/doc/webapi/ISteamUser).

### 5. mod.io

**Submitted_by, scoped account state, platform files.**

Use the assigned `https://g-{game-id}.modapi.io/v1` or `https://u-{user-id}.modapi.io/v1` host from developer settings. API key permits GET reads; OAuth read scope permits user-specific reads, write for mutation. GET /games/:game-id/mods returns mod objects; submitted_by identity and avatar belong to user, logo/media to mod. Treat team contributors separately.

GET /games/:game-id/mods/:mod-id/files returns release files. Preserve mod/file/game IDs, version/changelog/hash/filesize/platform approval and dependencies from documented schemas/endpoints. Platform targeting can filter visible mods and cooked files. Signed binary_url hashes may expire; resolve at download time. GET /me/subscribed imports the authenticated user's native mod subscriptions, with result_count/result_offset/result_limit/result_total and _offset/_limit (default 100; honor current endpoint limits). Native author follow is not proven. Current official CDPR support links Cyberpunk's in-game Mods menu to mod.io; reuse this adapter, not REDmod as a host.

**Primary sources:** [Introduction](https://docs.mod.io/restapi/introduction), [Get Mods](https://docs.mod.io/restapi/docs/get-mods), [Mod Object](https://docs.mod.io/restapi/docs/schemas/mod-object), [Get Modfiles](https://docs.mod.io/restapi/docs/get-modfiles), [Modfile Object](https://docs.mod.io/restapi/docs/schemas/modfile-object), [Get User Subscriptions](https://docs.mod.io/restapi/docs/get-user-subscriptions), [CDPR Cross-Platform Mod Support](https://support.cdprojektred.com/en/cyberpunk%20/pc/gameplay/issue/3034/cross-platform-mod-support-how-to-1).

### 6. Thunderstore

**Publisher namespace is often a team.**

Official backend README documents /api/v1/package/ for active package listing and /api/v1/package/{uuid4}/ for an individual package; Swagger at /api/docs/. Pin the current official schema/source and representative per-community response before using newer/experimental routes. A large aggregate package response is not automatically paginated: budget download bytes and refresh work accordingly.

Proposed mapping: package UUID/full namespace-name identifies project; version UUID/number identifies release; dependency strings must retain namespace, package and version components. Package icon/README/changelog/download artifacts are separate. Namespace/team may have multiple human members and is not a personal author ID; use a team avatar only when source provides it, otherwise leave null. Local follow a publisher namespace/team; native author follow/import not documented here. Preserve community listings/deprecation/NSFW flags and avoid emitting duplicate updates from the same package shared across communities.

**Primary sources:** [thunderstore-io/Thunderstore README](https://github.com/thunderstore-io/Thunderstore); [Thunderstore API](https://thunderstore.io/api/docs/) (JavaScript documentation shell). Exact response field mapping and limits remain fixture work.

### 7. GameBanana

**Typed entity IDs and SFW RSS.**

Official Core/Item/Data documents GET api.gamebanana.com/Core/Item/Data?itemtype=...&itemid=...&fields=... and endpoint help/AllowedFields. Resolve Member entity ID/avatar and typed submission IDs; do not join by author display name. Different item types can reuse IDs, so key (site, model, id). Select body, submitter/credits, preview/gallery and file/update fields only after confirming their current allowed names.

Official Rss/New is a feed of newest SFW submissions. It provides discovery, not exhaustive backfill, mature-content access, or complete file/version data. Follow items to API detail or source page. Native subscriptions/follows and import require documented app auth and real authorized fixtures; do not infer v11 endpoints from third-party wrappers. Test current vs legacy API schema, adult/hidden/deleted states, file multiplicity, pagination and rate headers before claiming an adapter.

**Primary sources:** [Core / Item / Data](https://api.gamebanana.com/docs/endpoints/Core/Item/Data), [Rss / New](https://api.gamebanana.com/docs/endpoints/Rss/New), [Posting new submissions to a Discord Channel](https://gamebanana.com/tuts/12814), [AllowedFields example](https://api.gamebanana.com/Core/Item/Data/AllowedFields?help=&itemtype=Tool).

### 8. Hangar

**Public OpenAPI only.**

Current first-party OpenAPI is https://hangar.papermc.io/v3/api-docs/public, linked by /api-docs. It explicitly says unlisted routes are internal and should not be used. Public info allows anonymous reads. Authenticated operations use API key authentication then expiring JWT with Authorization: HangarAuth token, according to operation schema; don't assume generic Bearer.

Use documented user/organization/project/version/page paths from the saved spec. Project avatarUrl is a project icon; member avatar requires a user object. Preserve owner vs contributors and platform/game/plugin dependencies on versions. Local follow a user/organization; native watch and import remain fixture work. Spec currently states default 20 requests/5 seconds, tighter limits for some operations, meaningful User-Agent and caching. Authors query lists public-project authors with limit/offset, max 25 there; other endpoints may differ. Pin schema because Hangar is open beta.

**Primary sources:** [API Docs | Hangar](https://hangar.papermc.io/api-docs), [Hangar API OpenAPI 3.1 schema](https://hangar.papermc.io/v3/api-docs/public).

### 9. SpigotMC

**Use the site-owned resource API.**

SpigotMC's own XenforoResourceManagerAPI documents GET https://api.spigotmc.org/simple/0.2/index.php with action-based requests including getResourcesByAuthor(user ID). Use site-owned resource/author metadata, current-version fields and documented resource-update/pagination actions actually enumerated by its OpenAPI. A complete historical-version download API is not established here. Do not confuse the Minecraft plugin-development Spigot API with website data API.

Separate numeric member identity, resource ID, update/version ID, project icon and user avatar. Public resource API may not expose an avatar/body/file field needed by the product: explicitly mark gaps and use permitted source fixtures rather than invent properties. Premium flag/public metadata is not proof the current user owns it; download through legitimate purchase/session flows. Spiget is an independently run periodically refreshed cache with its own semantics; if ever used, label secondary provenance and staleness and never use it to bypass premium. Native author-follow/resource-watch import is unverified.

**Primary sources:** [SpigotMC/XenforoResourceManagerAPI](https://github.com/SpigotMC/XenforoResourceManagerAPI), [official OpenAPI](https://github.com/SpigotMC/XenforoResourceManagerAPI/blob/master/src/openapi.yaml), [Premium Resource Placeholders & Identifiers](https://www.spigotmc.org/wiki/premium-resource-placeholders-identifiers/). Context only: [Spiget About](https://spiget.org/about/), a primary description of that independent service, not official Spigot endorsement.

### 10. BuiltByBit

**API-only, current V2 permissions.**

Use current `https://api.builtbybit.com/v2/` and site-owned OpenAPI/wrappers. October 2026 overview says some endpoints require Ultimate; current specification marks free endpoints and Ultimate/invite restrictions. A March legacy wiki claimed all API access requires Ultimate, so preserve source dates and defer to live endpoint permissions. The site explicitly says API is the only approved programmatic interface; scraping is not a valid fallback.

Proposed object graph: member/creator identity -> accessible resource listings -> resource versions/updates -> entitled files. Distinguish resource creator API from resources-embed API designed for shipped products. Use only token/OAuth scopes that permit intended reads, and do not assume arbitrary creator-feed/search or full follow import exists. Inspect the current schema for creator relationships, pagination, event cursors, avatar fields and download authorizations; no specific expansion name is accepted here. Follow locally only what account/API can legitimately enumerate; record missing capability instead of inventing it.

**Primary sources:** [V2 API Overview](https://builtbybit.com/help/developers/v2-api/v2-overview/), [OpenAPI & endpoints](https://builtbybit.com/help/developers/v2-api/open-api-and-endpoints/), [BuiltByBit official OpenAPI specification](https://github.com/BuiltByBit/api-openapi-spec/blob/main/spec.yaml), [V2 Embed API Overview](https://builtbybit.com/help/developers/v2-embed-api/overview/).

### 11. Polymart and voxel.shop

**Current redirect and delegated download.**

Opening https://polymart.org/wiki/api redirects to https://voxel.shop/wiki/api. Current page specifies POST https://api.voxel.shop/v1/{action}, parameters in POST data, JSON request/response envelope and optional stringify=0. Preserve the historical Polymart alias but do not assume old hosts remain canonical API bases.

Documented actions include search, getResourceInfo, getResourceUpdates, getUserId, getAccountInfo, authorizeUser, verifyAuthToken, invalidateAuthToken and getDownloadURL. Keep user ID/username/profile avatar where actually returned; resolve resource icon separately. Local author follow depends on allowed resource enumeration. Native follows/import not demonstrated. Delegated platform download uses authorizeUser token and getDownloadURL; plugin-internal requestUpdateURL has different purchase checks and is not a substitute. Test current resource/update pagination, expired token, ownership denial, external purchase, and unavailable file. Preserve purchase entitlements and ephemeral URLs; no guessed historical endpoint rewrites.

**Primary sources:** [Developer API Reference — voxel.shop, reached from Polymart](https://polymart.org/wiki/api). Exact avatar and rate/pagination fields remain fixture work.

### 12. Factorio Mod Portal

**Machine mod names, full dependencies.**

GET `https://mods.factorio.com/api/mods`, /api/mods/{name}, and /api/mods/{name}/full are documented. Stable mod key is name; owner is Factorio username, not numeric account ID. Avatar contract is absent. Full details provide description and release info_json dependencies; short data may include only factorio_version. Keep mod version distinct from compatible Factorio runtime. File download_url is relative, not a permanent unrestricted public binary URL.

Metadata is public; downloads redirect to login unless authenticated, with documented username/token mechanism. Secret-bearing URLs must be redacted from logs and never used as stored public canonical URLs. Native bookmarks can be read from /api/bookmarks with user auth; bookmark toggle is a mutation and distinct from author follow. Page/page_size documented (default 25; max special mode exists), but do bounded refresh rather than frequent complete catalog fetch. Portal warns search is cached and can lag by hours, so absence from immediate search isn't deletion.

**Primary sources:** [Mod portal API](https://wiki.factorio.com/Mod_portal_API), [Recently updated | Factorio Mods](https://mods.factorio.com/). Proposed polling/secret handling are engineering guidance.

### 13. Modtale

**Verify live host and current v1 contract.**

Modtale's official example repository documents live base `https://api.modtale.net/api/v1` and X-MODTALE-KEY. It covers project drafts/metadata, versions, dependencies/incompatibilities, icons/banner/gallery/YouTube and signed downloads. Project-scoped permissions include PROJECT_READ and granular mutation permissions; do not request publishing permissions for a reader. A community guide's modtale.net/api/v1 shorthand differs; prefer current first-party base.

Proposed reader: resolve actual project/organization/owner IDs from documented read responses, then releases with gameVersions, channel, changelog and dependency relationships. Keep project icon/media separate from creator avatar. Version replaceExisting behavior means update logic must handle replacement/revision, not just append. Local creator/organization follow and native follow/import remain untested. Homepage fetch timed out; obtain a live public author/project/version fixture and authenticated permission/expiry/download cases before claiming functional coverage. Hytale ecosystem is current; do not rely on pre-release assumptions.

**Primary sources:** [Modtale/modtale-example — Official Modtale API Examples](https://github.com/Modtale/modtale-example). The [community publishing guide](https://github.com/HytaleModding/site/blob/main/content/docs/en/publishing/modtale.mdx) is discovery context only.

### 14. Mod The Sims

**Observed author and multi-file detail pages.**

Public fixture author https://modthesims.info/m/10426623 resolves numeric member key, creator profile image, latest/top downloads and separate Posts & Activity. Detail https://modthesims.info/d/701054/straight-to-pajamas-v-1-3-update.html shows full overview, screenshot list, file list with filename/size/upload date, install instructions, pack requirements, compatibility text and author link. Key download record by numeric /d/ ID, creator by /m/ ID and file by actual download link identifier.

Treat edits to release description separately from new files. The source's visible title/version and compatibility prose can disagree or evolve; store raw values and provenance rather than infer semantic version. Public site explicitly says no account required to download; accounts enable follow creators/favorites/history. Native follow import requires legitimate account fixture and complete paging; no public API documented here. Resolve file/media URLs from actual links, not predictable chii/static host patterns.

**Primary sources:** [Welcome to Mod The Sims](https://modthesims.info/d/index.php), [Creator: SuoSoup](https://modthesims.info/m/10426623), [Straight to Pajamas detail](https://modthesims.info/d/701054/straight-to-pajamas-v-1-3-update.html).

### 15. Bethesda.net Creations

**Paid/free and platform account fixtures.**

Current Creations pages expose featured community content, verified creators and free/paid catalog items across game-specific surfaces. Use canonical creation UUID and linked creator profile identifier actually exposed by a detail page; no documented general-purpose public API was verified. Public page is discovery evidence only. Creator display label, Bethesda official account, Verified Creator status and authorship must remain separate fields.

A legitimate Bethesda account can have a library/subscription state; paid Verified Creations require the user's entitlement. Preserve title/body/screenshots/creator avatar, game/platform, price/currency, owned/not-owned state and visible version/requirements only when available. Catalog visibility varies by region/title/platform; don't interpret a missing platform variant as deleted. Never assume website metadata authorizes PC/console binary export. Native library import is distinct from creator follow and needs signed-in fixtures. Capture free, purchased, unowned paid, subscription/login failure, unavailable-region and platform-incompatible examples before promoting an adapter.

**Primary sources:** [Starfield Creations - Featured](https://creations.bethesda.net/), [Skyrim Creations - Featured](https://creations.bethesda.net/skyrim), [Verified Creation support](https://help.bethesda.net/app/answers/detail/a_id/66104/), [Build, share and find community-made content](https://bethesda.net/en-US/news/build-share-and-find-creations-skyrim-special-edition).

## Broad catalog

Each entry identifies its evidence level, access boundary and proposed follow behavior. Candidate, tool and reference entries remain explicitly labeled. “Local follow” describes application state; it does not imply that a source integration has been validated.

### Nexus Mods (`nexus-mods`)

**primary documented; multi-game.** Domains: nexusmods.com, api.nexusmods.com, graphql.nexusmods.com.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 1](#1-nexus-mods). The recipe remains a research proposal.

### Modrinth (`modrinth`)

**primary documented; minecraft.** Domains: modrinth.com, api.modrinth.com.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 2](#2-modrinth). The recipe remains a research proposal.

### CurseForge (`curseforge`)

**primary documented; multi-game.** Domains: curseforge.com, api.curseforge.com, edge.forgecdn.net.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 3](#3-curseforge). The recipe remains a research proposal.

### Steam Workshop (`steam-workshop`)

**primary documented; multi-game.** Domains: steamcommunity.com, api.steampowered.com.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 4](#4-steam-workshop). The recipe remains a research proposal.

### Bethesda.net Creations (`bethesda-creations`)

**candidate; relevant source/fixture gaps; multi-game.** Domains: creations.bethesda.net, bethesda.net.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 15](#15-bethesdanet-creations). The recipe remains a research proposal.

### mod.io (`modio`)

**primary documented; multi-game.** Domains: mod.io, modapi.io, docs.mod.io.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 5](#5-modio). The recipe remains a research proposal.

### Thunderstore (`thunderstore`)

**primary documented; multi-game.** Domains: thunderstore.io.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 6](#6-thunderstore). The recipe remains a research proposal.

### GameBanana (`gamebanana`)

**primary documented; multi-game.** Domains: gamebanana.com, api.gamebanana.com.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 7](#7-gamebanana). The recipe remains a research proposal.

### Mod DB (`moddb`)

**primary documented; multi-game.** Domains: moddb.com, rss.moddb.com.

Access: Public RSS and profiles; legitimate login for account features. Follow: Local member/team/project follow; native watch exists but import fixture needed.

RSS for project news/media/downloads is documented. Do not substitute project/team icon for author's avatar. File page and mirrors are separate from news posts.

Primary sources and observation targets: [Mod DB](https://www.moddb.com/rss); [Additional source](https://www.moddb.com/news/mod-db-update-rss-feeds).

### Indie DB (`indiedb`)

**primary documented; indie-games.** Domains: indiedb.com, rss.indiedb.com.

Access: Public RSS/profiles; account for watch state. Follow: Local creator/project follow; native watch observed; import unproven.

Independent-game distribution overlaps Mod DB but retain separate site namespace and provenance; profile-specific advertised RSS, news/media/download resources.

Primary sources and observation targets: [Indie DB](https://www.indiedb.com/rss).

### GTA5-Mods (`gta5-mods`)

**public page observed; gta.** Domains: gta5-mods.com.

Access: Public creator/submission pages; account gates need per-action fixtures. Follow: Local creator follow; native follow and bulk import unconfirmed.

Observed /users/name and submission All Versions, body, dates, size/download counts. Capture numeric ID only if actually exposed; otherwise canonical profile locator provisional.

Primary sources and observation targets: [GTA5-Mods](https://www.gta5-mods.com/); [Additional source](https://www.gta5-mods.com/users/STK10); [Additional source](https://www.gta5-mods.com/scripts/aerowing-wearable-jet-pack-weapon-system).

### Planet Minecraft (`planet-minecraft`)

**candidate; relevant source/fixture gaps; minecraft.** Domains: planetminecraft.com.

Access: Public site/search; first retrieval 403; registration page uses Turnstile. Follow: Local creator follow; account page explicitly advertises following content/creators; import fixture needed.

Profiles/usernames can change; capture canonical profile and observed ID if available. Member wall posts, submissions, map/mod/skin downloads are distinct types. No API/RSS contract established.

Primary sources and observation targets: [Planet Minecraft](https://www.planetminecraft.com/faq); [Additional source](https://www.planetminecraft.com/account/create/).

### MCPEDL (`mcpedl`)

**public page observed; minecraft-bedrock.** Domains: mcpedl.com.

Access: Public JS catalog; login/VIP shown. Follow: Local creator follow; native follow/import unverified.

Homepage retrieved only JS shell, no records. Need real creator + detail fixture with body/media/link/download/version data; do not infer WordPress API from old layouts.

Primary sources and observation targets: [MCPEDL](https://mcpedl.com/).

### Minecraft Forum (`minecraft-forum`)

**public page observed; minecraft.** Domains: minecraftforum.net.

Access: Public forum threads/profile pages; signed-in account for watch state. Follow: Local member/thread follow; native subscriptions import fixture needed.

Treat release thread as post stream; first post may edit in place; download links often external. Capture thread ID, post ID, member ID separately; never manufacture file versions from replies.

Primary sources and observation targets: [Minecraft Forum](https://www.minecraftforum.net/).

### SpigotMC (`spigotmc`)

**primary documented; minecraft-plugins.** Domains: spigotmc.org, api.spigotmc.org.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 9](#9-spigotmc). The recipe remains a research proposal.

### Hangar (`hangar`)

**primary documented; minecraft-plugins.** Domains: hangar.papermc.io.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 8](#8-hangar). The recipe remains a research proposal.

### Polymart / voxel.shop (`polymart-voxel`)

**primary documented; minecraft-marketplace.** Domains: polymart.org, voxel.shop, api.voxel.shop.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 11](#11-polymart-and-voxelshop). The recipe remains a research proposal.

### BuiltByBit (`builtbybit`)

**primary documented; minecraft-marketplace.** Domains: builtbybit.com, api.builtbybit.com.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 10](#10-builtbybit). The recipe remains a research proposal.

### ModBay (`modbay`)

**public page observed; minecraft-bedrock.** Domains: modbay.org.

Access: Public author/byline/feed; account for member actions. Follow: Local author follow; native follow/import needs fixture.

Public feed has bylines and update/release pages. Use numeric article ID and linked user profile; creator vs uploader/original attribution must be separate; external download routes inspected individually.

Primary sources and observation targets: [ModBay](https://modbay.org/).

### MCreator Community (`mcreator`)

**public page observed; minecraft.** Domains: mcreator.net.

Access: Public news/community mod pages; account for member actions. Follow: Local creator follow; native/import unconfirmed.

MCreator app is authoring tool; community mod listing is relevant distribution surface. Follow community authors via actual profile IDs; avoid confusing software snapshots with creator releases.

Primary sources and observation targets: [MCreator Community](https://mcreator.net/).

### MinecraftMaps (`minecraftmaps`)

**candidate; relevant source/fixture gaps; minecraft-maps.** Domains: minecraftmaps.com.

Access: Initial retrieval 403; public page fixture needed. Follow: Local author follow plan; native/import unconfirmed.

Do not assume API, numeric author ID/avatar, or host-native files; collect actual map/detail/profile pages in legitimate client. Preserve map Java/Bedrock/game-version labels.

Primary sources and observation targets: [MinecraftMaps](https://www.minecraftmaps.com/).

### Modtale (`modtale`)

**candidate; relevant source/fixture gaps; hytale.** Domains: modtale.net, api.modtale.net.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 13](#13-modtale). The recipe remains a research proposal.

### HytaleHub (`hytalehub`)

**candidate; relevant source/fixture gaps; hytale-community.** Domains: hytalehub.com.

Access: 403 during retrieval. Follow: Discovery candidate; local follow only after content fixtures; native/import unconfirmed.

Do not promote a forum/server listing to verified mod host. Need actual author and downloadable release evidence. CurseForge and Modtale have stronger primary distribution evidence.

Primary sources and observation targets: [HytaleHub](https://hytalehub.com/).

### The Sims Resource (`tsr`)

**public page observed; sims.** Domains: thesimsresource.com.

Access: JS public catalog; login/VIP and download-state fixtures required. Follow: Local artist follow; native Following/Followers UI observed; import unproven.

Keep artist identity/avatar distinct from creation thumbnail; member blog posts, creations, collections, and CC manager are different resources. VIP changes delivery state, not ownership of creator identity.

Primary sources and observation targets: [The Sims Resource](https://www.thesimsresource.com/).

### Mod The Sims (`mod-the-sims`)

**public page observed; sims.** Domains: modthesims.info, chii.modthesims.info.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 14](#14-mod-the-sims). The recipe remains a research proposal.

### SimsFinds (`simsfinds`)

**public page observed; sims-discovery.** Domains: simsfinds.com.

Access: Public catalog; premium page advertises skipping wait/direct source. Follow: Local displayed-creator follow with proven origin mapping; native/import unconfirmed.

Directory can link to source or host SimsFinds files. Record curator/uploader/source-creator separately. Never infer SimsDom domain equivalence or author identity from same display name.

Primary sources and observation targets: [SimsFinds](https://www.simsfinds.com/).

### SimsDom (`simsdom`)

**public page observed; sims-discovery.** Domains: simsdom.com.

Access: Current retrieved landing page limited. Follow: Local creator follow only after actual creator fixture; native/import unconfirmed.

Current domain shows SimsDomination/Playzord landing/wallpapers; do not silently alias to SimsFinds. Old pages need separate migration evidence.

Primary sources and observation targets: [SimsDom](https://www.simsdom.com/).

### The Sims Catalog (`sims-catalog`)

**public page observed; sims-discovery.** Domains: thesimscatalog.com.

Access: Public catalog with login/favorites; outgoing creator downloads. Follow: Local attributed creator follow; favorite/collection differs from author follow; import unproven.

Observed item identifies creator from TSR and explicitly redirects to creator site. Directory product ID/SKU is not origin file ID; preserve both as linked entities.

Primary sources and observation targets: [The Sims Catalog](https://thesimscatalog.com/sims4/); [Additional source](https://thesimscatalog.com/sims4/downloads/clothing/womens-clothing/clothing-sets/shyare-top-and-skirt-set/).

### Around the Sims (`around-the-sims`)

**public page observed; sims-creator.** Domains: aroundthesims4.com, sims4.aroundthesims3.com, aroundthesims3.com.

Access: Public static pages; some release announcements link Patreon early access. Follow: Local site/creator follow; newsletter/Patreon follow not auto-imported.

Sims 4 old URL redirects to new domain; site-level Sandy/creator identity needs explicit About evidence, no automatic multi-author assumption. Archive updates/set pages yield content; Patreon entitlement separate.

Primary sources and observation targets: [Around the Sims](https://sims4.aroundthesims3.com/); [Additional source](https://aroundthesims4.com/).

### Sims 4 Studio Forum (`sims4studio`)

**candidate; relevant source/fixture gaps; sims-community.** Domains: sims4studio.com.

Access: Homepage timed out; legitimate forum fixture needed. Follow: Local member/creator-studio thread follow plan; native/import unconfirmed.

Separate tool builds from Creator Studios custom content. Do not assume a public API or that all forum downloads require login; test per thread/file with account if required.

Primary sources and observation targets: [Sims 4 Studio Forum](https://sims4studio.com/).

### Sims File Share (`sim-file-share`)

**public page observed; sims-file-host.** Domains: simfileshare.net.

Access: Downloads explicitly require no login; invite account for upload. Follow: Local folder/file watch possible; no verified creator-follow stream/import.

Permanent file/folder locators; uploader is not automatically original mod author. Host metadata cannot supply missing post body/avatar/version; link back to originating creator post.

Primary sources and observation targets: [Sims File Share](https://simfileshare.net/).

### LoversLab (`loverslab`)

**candidate; relevant source/fixture gaps; adult-mod-community.** Domains: loverslab.com.

Access: Direct retrieval unavailable; legitimate member/age/content access fixture required. Follow: Local profile follow plan; native follow/import and file access untested.

Wabbajack's current primary integration docs support manualURL only and state IPS4 support not actively maintained. Do not infer site-wide accessible API from forum software; no content bypass.

Primary sources and observation targets: [LoversLab](https://www.loverslab.com/); [Additional source](https://wiki.wabbajack.org/modlist_author_documentation/Meta%20Files.html).

### AFK Mods (`afkmods`)

**public page observed; bethesda-community.** Domains: afkmods.com.

Access: Public forum/download navigation; account actions separate. Follow: Local member follow; native follow/import fixture needed.

Observe actual canonical member/file/topic IDs and profile photo. Generic Invision endpoints are not proof API credentials granted to third parties.

Primary sources and observation targets: [AFK Mods](https://www.afkmods.com/).

### TES Alliance (`tes-alliance`)

**public page observed; bethesda-community.** Domains: tesalliance.org.

Access: Public forum; membership page advertises unlimited downloads. Follow: Local member follow; native follow/import fixture needed.

Separate member status updates, topic posts, tutorials, galleries, file release versions. Capture permission-denied vs removed; do not assume same credentials as other Invision sites.

Primary sources and observation targets: [TES Alliance](https://tesalliance.org/forums/).

### VectorPlexus (`vectorplexus`)

**candidate; relevant source/fixture gaps; bethesda-community.** Domains: vectorplexus.com, vectorplexis.com.

Access: Both domain fetches timed out; current status unconfirmed. Follow: Historical/local locator only until live proof; native/import unconfirmed.

Do not state permanently closed or silently switch spelling. Wabbajack recommends manualURL/author-made mirrors; corroborate present domain via creator-owned source and authenticated fixture.

Primary sources and observation targets: [VectorPlexus](https://vectorplexus.com/); [Additional source](https://vectorplexis.com/); [Additional source](https://wiki.wabbajack.org/modlist_author_documentation/Meta%20Files.html).

### Schaken-Mods (`schaken-mods`)

**public page observed; bethesda-community.** Domains: schaken-mods.com.

Access: Public catalog; login, subscriptions and Guild Mods visible. Follow: Local member follow; native follow/import and Guild entitlement fixture needed.

Treat free/Guild/club/purchased states explicitly; file/version/blog/topic are different entities. Mature content labels preserved; subscription does not authorize redistribution.

Primary sources and observation targets: [Schaken-Mods](https://schaken-mods.com/).

### Cybermods (`cybermods`)

**candidate; relevant source/fixture gaps; cyberpunk-candidate.** Domains: cybermods.net.

Access: No direct accessible primary page this pass. Follow: No support claim; historical alias/candidate only.

Secondary search claims redirect to Thunderstore are not sufficient. Verify current first-party redirect before aliasing; never invent independent author API.

Primary sources and observation targets: [Cybermods](https://cybermods.net/).

### REDmod (`redmod`)

**candidate; relevant source/fixture gaps; authoring-tool.** Domains: cyberpunk.net.

Access: Official CDPR tool/docs. Follow: Dependency/tool source, not an author feed or mod-host adapter.

Model official tool releases and dependency relationships. Do not count REDmod as creator distribution platform. Official current Cyberpunk support also documents mod.io in-game integration.

Primary sources and observation targets: [REDmod](https://www.cyberpunk.net/en/modding-support); [Additional source](https://cdn-l-cyberpunk.cdprojektred.com/REDmod-docs.pdf).

### WolvenKit (`wolvenkit`)

**candidate; relevant source/fixture gaps; authoring-tool.** Domains: redmodding.org, wiki.redmodding.org, github.com/WolvenKit.

Access: Official project/wiki and GitHub releases. Follow: Project release watch; not a multi-author content feed.

Project's own docs say stable builds published to GitHub and Nexus. Track real release source, preserve cross-host links, do not imply all Cyberpunk mods are hosted here.

Primary sources and observation targets: [WolvenKit](https://github.com/WolvenKit/WolvenKit); [Additional source](https://wiki.redmodding.org/wolvenkit/getting-started/download).

### Factorio Mod Portal (`factorio`)

**primary documented; factorio.** Domains: mods.factorio.com.

Identity, access, release/file extraction, follow behavior and limitations are covered in [deep recipe 12](#12-factorio-mod-portal). The recipe remains a research proposal.

### SpaceDock (`spacedock`)

**public page observed; space-simulation.** Domains: spacedock.info.

Access: Public mod/version pages; account for email follows. Follow: Local author follow; native per-mod email updates observed; import unproven.

Numeric mod ID and author link from actual page; full version history plus game compatibility advertised. Need current official API/source fixture before endpoint names or avatar field claims.

Primary sources and observation targets: [SpaceDock](https://spacedock.info/); [Additional source](https://github.com/KSP-SpaceDock/SpaceDock).

### BeamNG Repository (`beamng`)

**public page observed; beamng.** Domains: beamng.com.

Access: Public resource/member pages; account actions separate. Follow: Local author follow; People You Follow UI observed; import fixture needed.

Resource, update, version and member IDs distinct; official repository differs from third-party BeamNG mirrors. Capture resource icon separately from member avatar and game-version text.

Primary sources and observation targets: [BeamNG Repository](https://www.beamng.com/resources/).

### OverTake (`overtake`)

**public page observed; racing.** Domains: overtake.gg, racedepartment.com.

Access: Public download catalog; account/premium download fixture needed. Follow: Local member follow; resource watch/import unconfirmed.

Keep RaceDepartment historical domain as alias only after redirect observed for supplied link. Resource detail/update/history bodies differ; platform/game/category essential for racing compatibility.

Primary sources and observation targets: [OverTake](https://www.overtake.gg/downloads/).

### LCPDFR (`lcpdfr`)

**candidate; relevant source/fixture gaps; gta.** Domains: lcpdfr.com.

Access: 403 during retrieval; legitimate browser/account fixture required. Follow: Local member follow plan; native/import unconfirmed.

Need release/topic/member pages, file manifest and LSPDFR/RAGE/ScriptHook requirements. Do not assume Invision site API access.

Primary sources and observation targets: [LCPDFR](https://www.lcpdfr.com/downloads/).

### GTAall (`gtaall`)

**public page observed; gta.** Domains: gtaall.com.

Access: Public category/submission listing. Follow: Local author/uploader follow; native/import unconfirmed.

Listing exposes uploader and dates; do not assign original mod authorship to uploader. Installer download and archive delivery distinct; capture actual credit text and origin URL.

Primary sources and observation targets: [GTAall](https://www.gtaall.com/).

### GTAinside (`gtainside`)

**public page observed; gta.** Domains: gtainside.com.

Access: Public game/category listing. Follow: Local author follow after detail/profile fixture; native/import unconfirmed.

Preserve game + numeric submission + credited author vs uploader separately. Locale domains are aliases of site namespace, not different creators.

Primary sources and observation targets: [GTAinside](https://www.gtainside.com/).

### Openplanet (`openplanet`)

**candidate; relevant source/fixture gaps; trackmania-plugins.** Domains: openplanet.dev.

Access: 403 during retrieval. Follow: Local plugin-publisher follow plan; native/import unconfirmed.

Need official plugin detail/API docs and author fixtures; do not infer API routes. Trackmania Openplanet runtime plugins differ from track/map assets.

Primary sources and observation targets: [Openplanet](https://openplanet.dev/).

### ManiaExchange / TrackmaniaExchange (`maniaexchange`)

**public page observed; trackmania-assets.** Domains: trackmania.exchange, mania.exchange, api2.mania.exchange.

Access: Public catalog explicitly links official API. Follow: Local creator follow; Favorite Author Maps observed; import needs docs/auth fixture.

Track ID, mapper account, replay/map/pack/media identities distinct. Retrieve official API schema before claiming user avatar/version/dependency fields.

Primary sources and observation targets: [ManiaExchange / TrackmaniaExchange](https://trackmania.exchange/); [Additional source](https://api2.mania.exchange/).

### Transport Fever Community (`transport-fever`)

**public page observed; transport-simulation.** Domains: transportfever.net.

Access: Filebase redirects to mandatory terms acceptance; account/consent fixture required. Follow: Local member follow plan; native/import unconfirmed.

Terms page explicitly prohibits upload to other sites. Preserve metadata/origin links and user downloads, never treat feed ingestion as rehosting permission. Current software docs not file distribution API.

Primary sources and observation targets: [Transport Fever Community](https://www.transportfever.net/filebase/).

### ModWorkshop (`modworkshop`)

**public page observed; multi-game.** Domains: modworkshop.net.

Access: Public mods and member bylines. Follow: Local member follow; native/import/API details unconfirmed.

PAYDAY 2/3 and other games. Capture numeric mod/user IDs from actual canonical URLs and separate main description/update/changelog/files; no guessed API routes.

Primary sources and observation targets: [ModWorkshop](https://modworkshop.net/).

### ModLand (`modland`)

**public page observed; multi-game.** Domains: modland.net.

Access: Public game/category catalog. Follow: Local uploader/origin creator follow; native/import unconfirmed.

Original attribution, uploader and external mirrors must remain separate. Per-file version/compatibility unverified until detail fixtures; file link is not always a site-hosted binary.

Primary sources and observation targets: [ModLand](https://www.modland.net/).

### GIANTS ModHub (`giants-modhub`)

**public page observed; farming-simulator.** Domains: farming-simulator.com.

Access: Public official catalog and details. Follow: Local named-author follow only if supported by author listing; native/import unconfirmed.

Capture numeric mod ID, Farming Simulator edition/platform, author credit/version/date/screenshots. Text author without profile is credited identity, not resolvable account ID/avatar.

Primary sources and observation targets: [GIANTS ModHub](https://www.farming-simulator.com/mods.php).

### Mod Collective (`modcollective`)

**public page observed; sims-marketplace.** Domains: modcollective.gg, www.modcollective.gg.

Access: Public artist catalog; ClubMOD/early access entitlement. Follow: Local artist follow; native artist Follow/Followers observed; import fixture needed.

Stable artist URL provisional until internal ID observed; avatar from artist page. Creation/set/grouping and gated release dates distinct. Do not classify all catalogue as free.

Primary sources and observation targets: [Mod Collective](https://www.modcollective.gg/); [Additional source](https://www.modcollective.gg/sims4/artist/wisteriasims).

### Daymarr Workshop (`daymarr`)

**public page observed; bethesda-creator.** Domains: daymarrworkshop.com, www.daymarrworkshop.com.

Access: Public Wix posts/gallery; external Nexus downloads observed. Follow: Local site/creator follow; email newsletter is separate consent action; no bulk follow import proven.

Actual creator-owned Patreon links Nexus user 8194845 and LoversLab profile 1770706-andreis. Preserve port author and original creator credits; body-type variants are compatibility labels.

Primary sources and observation targets: [Daymarr Workshop](https://www.daymarrworkshop.com/); [Additional source](https://www.daymarrworkshop.com/post/daymarr-fortuna-s-favor-cbbe-uunp-se); [Additional source](https://www.patreon.com/Daymarr/about).

### Gamer-Mods (`gamer-mods`)

**public page observed; multi-game-localization.** Domains: gamer-mods.ru.

Access: Public Russian catalog and file bylines; login shown. Follow: Local uploader/translator follow; native/import unconfirmed.

Do not conflate Russian uploader/translator with original credited mod author. Numeric article and user IDs must be observed. Preserve original source, translation version, game-runtime requirements.

Primary sources and observation targets: [Gamer-Mods](https://gamer-mods.ru/).

### Aqxaro Mods (`aqxaro`)

**candidate; relevant source/fixture gaps; candidate-rehost.** Domains: aqxaromods.com.

Access: Primary page inaccessible in this pass. Follow: Unverified candidate; no author/API/follow claim.

No primary evidence sufficient for current extraction/access semantics. Do not import from purported alternate domains or assume origin/creator legitimacy from directory labels.

Primary sources and observation targets: [Aqxaro Mods](https://aqxaromods.com/).

### Synthira (`synthira`)

**candidate; relevant source/fixture gaps; candidate-rehost.** Domains: synthira.ru.

Access: Primary page inaccessible in this pass. Follow: Unverified candidate; no author/API/follow claim.

Domain is .ru, not guessed .com. Creator Laurelie's own 2024 notice disputes reuploads and raises file safety concerns; attribute that statement, do not present as independently verified site-wide malware finding.

Primary sources and observation targets: [Synthira](https://synthira.ru/); [Additional source](https://www.patreon.com/posts/notice-do-not-ru-110211539).

### ENBDev (`enbdev`)

**candidate; relevant source/fixture gaps; graphics-tool.** Domains: enbdev.com.

Access: Official download pages indexed; direct fetch redirect loop. Follow: Local project/tool release watch; no author follow/import contract.

Treat ENBSeries binary versions separately from user presets on other hosts. Need actual version page/download anchor fixture; no guessed binary URL or avatar.

Primary sources and observation targets: [ENBDev](https://enbdev.com/download.html); [Additional source](https://enbdev.com/download_mod_tesskyrimse.html).

### Silverlock Script Extenders (`silverlock`)

**public page observed; runtime-tool.** Domains: skse.silverlock.org, f4se.silverlock.org.

Access: Public static official release/compatibility pages, some links to Nexus. Follow: Local team/project release watch; no native creator follow/import.

Model separate SKSE/F4SE projects with explicit runtime/store/VR compatibility. Stable site-owned team identity without invented avatar. SKSE asks not to link directly to archived builds.

Primary sources and observation targets: [Silverlock Script Extenders](https://skse.silverlock.org/); [Additional source](https://f4se.silverlock.org/).

### SteamDB (`steamdb`)

**primary documented; reference-only.** Domains: steamdb.info.

Access: Public informational site; scraping prohibited; no public API promised. Follow: Do not implement host/author-feed scraping; link-out/reference only.

FAQ says no downloads, prohibits automated scraping/crawling, directs users to Steam itself. Use Steam primary APIs for Workshop and ownership; SteamDB is not creator identity authority.

Primary sources and observation targets: [SteamDB](https://steamdb.info/faq/).

### 3DM Mod Station (`3dm-mod`)

**candidate; relevant source/fixture gaps; multi-game-regional.** Domains: mod.3dmgame.com, dl.3dmgame.com.

Access: Homepage timed out; indexed first-party detail currently accessible in search. Follow: Local uploader/credited creator follow; visible native 关注 label; import unverified.

Detail shows uploader 3dm_33403138 and separately author James, release version/file/size/body; never merge them. Indexed /u/0 renders null profile: reject zero/null unresolved IDs rather than consolidate unrelated creators. No API verified.

Primary sources and observation targets: [3DM Mod Station](https://mod.3dmgame.com/mod/218812); [Additional source](https://dl.3dmgame.com/patch/cp2077mod_283_hot.html).

### 9DM / 9damaogame (`9damao`)

**candidate; relevant source/fixture gaps; bethesda-community-regional.** Domains: 9damaogame.com, www.9damaogame.com.

Access: Primary domain inaccessible; no reliable primary search result this pass. Follow: Historical candidate only; no native/import/API assertion.

Verify exact current canonical domain, forum identity and creator-owned origin before any scraping/API plan. Do not silently switch to similarly named mirrors or circumvent forum access/points gates.

Primary sources and observation targets: [9DM / 9damaogame](https://www.9damaogame.com/).

### TESAll (`tesall`)

**public page observed; bethesda-community-regional.** Domains: tesall.ru, tesall.club, next.tesall.club.

Access: Public Russian mod/news/forum pages; sign-in shown. Follow: Local uploader/translator/member follow; native/import fixture needed.

Current primary page titles itself TESAll.Club but serves tesall.ru and links next.tesall.club. Capture actual redirects rather than merge site/account namespaces blindly. Separate translator/uploader from original author and mods from blog/forum/news items. No public API verified.

Primary sources and observation targets: [TESAll](https://tesall.ru/).

### PlayGround.ru (`playground`)

**candidate; relevant source/fixture gaps; multi-game-regional.** Domains: playground.ru, www.playground.ru.

Access: Generic /files unavailable; current first-party per-game /file catalog indexed. Follow: Local uploader/origin author follow; native/import unconfirmed.

Catalog shows date, game/categories and uploader names. Follow actual profile links and detail IDs; preserve original author/translation credits and version text independently. No API/RSS/auth contract verified; do not invent one from route structure.

Primary sources and observation targets: [PlayGround.ru](https://www.playground.ru/elder_scrolls_5_skyrim/file); [Additional source](https://www.playground.ru/file/gameplay).

## Specialist page recipes and explicit exclusions

**Invision/forum families:** AFK Mods, TES Alliance, Schaken-Mods, LoversLab and TESAll need independent domain-specific fixtures. A shared forum engine does not imply public REST access: owner-installed API keys and user session permissions are different. Resolve account profile/member ID and its avatar from the actual byline; separately parse topic first post/replies, download record versions, individual attachments, galleries, blogs, and paid clubs. Use canonical observed links rather than constructing attachment.php or do=download URLs. Forum pagination can omit edited first-post updates if only newest replies are polled, so revalidate tracked release records. Do not assert LoversLab affiliation for other communities without first-party cross-links. Daymarr’s own Patreon cross-link is evidence of one creator identity, not ownership or affiliation between platforms. Sources are linked in the catalog records. [Wabbajack Meta Files](https://wiki.wabbajack.org/modlist_author_documentation/Meta%20Files.html) documents Wabbajack manualURL support; it does not establish a general LoversLab API.

**Sims directories and file hosts:** The Sims Catalog fixture explicitly sends downloads to a creator's website; SimsFinds advertises direct source links and SimsFinds-hosted files. Preserve a relationship from discovery listing to origin creator post to file host rather than pretending the directory is original author. Sims File Share confirms no login for downloads and permanent URLs but is not an author post/body/avatar API. A creator's public folder can be locally watched only after attribution and file identity are proven. The Sims Resource artist/follower/blog UI is visible, but follow import and VIP/wait/download delivery need actual authorized fixtures. Sources: [The Sims Catalog item](https://thesimscatalog.com/sims4/downloads/clothing/womens-clothing/clothing-sets/shyare-top-and-skirt-set/), [SimsFinds](https://www.simsfinds.com/), [Sims File Share](https://simfileshare.net/) and [The Sims Resource](https://www.thesimsresource.com/).

**Single-creator sites and tool projects:** Around the Sims old Sims 4 domain redirects to aroundthesims4.com; posts currently include public and Patreon early-access links. Daymarr has a Wix post archive, images and external Nexus links; keep original mod author and port author separate. ENBDev publishes binary tool versions; user presets are a distinct release on their source host. Silverlock SKSE/F4SE pages list store/game runtime/VR-specific builds and link some current builds to Nexus; archived build links have a source request against direct linking. Stable team/site ID plus absent avatar is better than invented accounts. Sources are linked in the corresponding catalog entries.

**Cyberpunk:** REDmod is an official authoring/deployment tool; WolvenKit is a tool project whose own docs mention GitHub/Nexus release delivery. Neither is a general creator mod host. cybermods.net current behavior could not be established from a first-party page; secondary claims of Thunderstore redirects must not become a verified alias. Official CDPR support now describes mod.io in-game distribution, so current game-specific integration must be verified, not assumed from older REDmod guides. Sources: [CDPR modding support](https://www.cyberpunk.net/en/modding-support), [WolvenKit distribution guide](https://wiki.redmodding.org/wolvenkit/getting-started/download), [WolvenKit project](https://github.com/WolvenKit/WolvenKit) and [CDPR cross-platform mod support](https://support.cdprojektred.com/en/cyberpunk%20/pc/gameplay/issue/3034/cross-platform-mod-support-how-to-1). The [Cybermods origin](https://cybermods.net/) could not be verified in this review.

**Regional discovery:** 3DM’s indexed mod fixture clearly separates uploader handle and credited author; an indexed /u/0 null profile is an identity-resolution failure to reject, not a real author account. TESAll serves tesall.ru while branding TESAll.Club; preserve observed canonical links across domains. Gamer-Mods and PlayGround uploader names may belong to translators/reposters. Aqxaro/Synthira/9DM current primary reachability was not established; do not invent substitute domains. Laurelie’s own 2024 Synthira notice is an attributed creator complaint, not an independently verified malware finding. Primary sources are linked in the corresponding catalog entries.

**SteamDB exclusion:** Its own FAQ states it provides no downloads, does not allow scraping/crawling, and points users to Steam. It is a reference/link-out resource. A local creator follow adapter should obtain Workshop/user/depot information from Valve's interfaces and legitimate account context instead. Source: [SteamDB FAQ](https://steamdb.info/faq/).

## Minimum evidence to promote one adapter capability

1. Resolve a supplied profile URL and a renamed/alternate URL to the same source account, with correct avatar or explicitly absent avatar.
2. Prove complete public author listing with multiple pages; distinguish no content from access denied, JS shell, challenge, hidden and removed.
3. Parse a real full body with inline images, gallery/video media and outgoing links; strip navigation/recommendations; preserve credited contributors.
4. Parse one multi-version/multi-file release with file names, sizes, hashes when provided, game/loader/platform constraints and dependencies without equating a project thumbnail to user avatar.
5. Exercise user-owned login/OAuth session, expiry/revocation, and any free/paid/early-access/region/platform gates relevant to the host.
6. Test native following separately from local following and signed-in import. Show pagination completeness and require intentional authorization for mutations.
7. Confirm actual download delivery with entitlement, redirects and expiring URLs; avoid logging bearer tokens, API keys, cookies and secret query parameters.
8. Save dated sanitized fixtures and field-level provenance; record which capability passed rather than attach a blanket “verified site” badge.

These are proposed evidence gates. None of the 64 catalog entries has been promoted to an end-to-end verified adapter in this research.
