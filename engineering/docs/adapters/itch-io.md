# itch.io projects, devlogs and owned-file adapter

[Adapter laboratory](README.md) · [Paid-platform overview](paid-platforms.md) · [Author and media contract](author-post-media-contract.md)

Checked: October 31, 2026 (UTC). Evidence: official documentation and actual public page representations. No authenticated API request, purchase, file download, native-follow mutation or video playback was tested. A later public DOM replay is recorded below. The linked [self-contained research receipt](../../experiments/site-adapter-discovery/itch-io-research-2026-10-31.json) records source URLs, assertions and unresolved operations.

Use the official OAuth API for permitted owned-project discovery and file operations, and public project/devlog pages for their own accessible bodies and media. Public metadata is a separate evidence class from file delivery. Full adapter acceptance remains pending.

## Preferred access and current API changes

These are documented capabilities and proposed extraction methods. API behavior still requires a permitted runtime fixture.

1. **Current OAuth download scope:** [`game:view:uploads`](https://itch.io/docs/api/oauth#scopes) permits downloading files for games the user owns, develops, and free games, through `/games/:game_id/uploads`, `/games/:game_id/download-sessions`, and `/uploads/:upload_id/download`. The [official admin announcement dated 2026-10-12](https://itch.io/t/7114687/oauth-updates-authorization-code-flow-device-login-new-scopes) confirms this is newly available to third-party apps. Keep historical statements that OAuth cannot download explicitly dated; they no longer establish the current restriction. No successful token or transfer fixture here. Detailed upload/session response schema is absent from the inspected server-side reference; do not invent field names, URL expiry, HTTP verbs, download-key selection or session requirements.
2. **Authorization method:** the [current OAuth guide](https://itch.io/docs/api/oauth) recommends authorization code with PKCE S256, `https://itch.io/user/oauth` and `POST https://api.itch.io/oauth/token`; no client secret. Native apps should use system browser and loopback with OOB fallback. QR device login requires platform approval. Request only needed scopes; no username/password collection. Token-handling implementation remains untested.
3. **Project/devlog identity and file provenance:** retain creator, project, devlog and upload/build as different entities. The FlowFit example below proves old devlog file listings must not overwrite the current project upload. Do not infer current compatibility from a historical devlog date/title.
4. **Multiple credited authors:** Pixelorama explicitly lists two Authors. Preserve both creator URLs and roles instead of making subdomain owner the only credited creator. A byline author and project collaborators are separate concepts.
5. **Media:** extract ordered description images separately from banner/cover, screenshot sidebar, external player, and comments. Nuclear Blaze supplies a concrete YouTube privacy embed; LDtk's devlog supplies external-domain inline PNGs. GIF preservation is a documented requirement, but actual animated file decoding was not verified.
6. **Build updates:** [butler docs](https://itch.io/docs/butler/pushing.html) distinguish channel slots, build sequence and arbitrary creator version labels. `GET https://api.itch.io/wharf/latest?target=USER/PROJECT&channel_name=CHANNEL` is documented as unauthenticated and returns `latest` only when a user version exists; private projects return invalid game. This is channel-specific update metadata, not complete release history or a file download API. A new channel creates a file; pushing to an existing channel updates it. Never infer a channel name from an OS label alone.

## Actual public samples and field sources

### Sims 4: SimRealist FlowFit

Project: https://simrealist.itch.io/public-flowfit

Devlog: https://simrealist.itch.io/public-flowfit/devlog/641348/flowfit-0203

Observed project title `(Public) FlowFit`, category Game mod, author link SimRealist. Description has six ordered image links around object sections; the leading project image is a separate cover candidate. Compatibility text names patch 10/27/2026 and PC/Mac versions. Current file listing is `SimRealist_-_Flowfit_0.3.1.4.zip`, 8.9 MB; project updated timestamp is 2026-10-28 02:04 UTC. Preserve exact label casing rather than deriving a filename from a version.

Historical devlog ID `641348`, slug `flowfit-0203`, title `FlowFit 0.2.0.3`, byline SimRealist, short update body. Its Files section names `SimRealist_-_FlowFit_0.2.0.3.zip`, 6.3 MB, timestamp 2023-11-26 22:45 UTC. Public label and timestamp do not prove that old file remains downloadable. This is a strong negative fixture for conflating project-current uploads with devlog-associated files. Both have name-your-own-price entry buttons; no entitlement or download was exercised.

### Game tool: LDtk

Project: https://deepnight.itch.io/ldtk

Creator: https://deepnight.itch.io/

Community profile: https://itch.io/profile/deepnight

Devlog index: https://deepnight.itch.io/ldtk/devlog

Devlog: https://deepnight.itch.io/ldtk/devlog/666042/153

Observed project title `LDtk level editor`, category Tool, author Deepnight Games, platform labels Windows/macOS/Linux. Current Windows file has version 1.5.3; macOS and Linux are separately labelled experimental. The project's latest-post list exposes absolute UTC dates. Individual devlog ID `666042` has its own title `1.5.3`, byline link and ordered bugfix body; its Files section has per-upload timestamps, distinct from the post publication timestamp shown on the project/index.

Creator page links to community profile, and community profile links back to creator page. This establishes an observed same-account URL join; no numeric account ID or creator avatar URL was exposed by the text representation. Keep avatar missing instead of substituting the LDtk cover or a linked social icon. In authenticated documented objects, creator avatar is `game.user.cover_url`, while project cover is `game.cover_url`; `/profile` exposes the credential owner, not arbitrary public authors.

Index contains linked excerpts with `Continue reading`; it is not the full post body. The inspected representation extended to November 2020 without a visible Next link. Record this observation, not universal complete-history acceptance. Comment pagination is separate.

Media-rich devlog: https://deepnight.itch.io/ldtk/devlog/663374/150-new-logo-and-20x-faster

Observed inline image order: logo, global search, faster rules, biomes, rectangles, layer list, nearby layers, table-of-content. One opened image resolves to https://ldtk.io/files/changelogImg/1.5.0/search.png (PNG image returned). Preserve external origin and position; no img.itch.zone-only filter. These are source illustration claims; the devlog title's performance claim is not an Atlas benchmark.

Free purchase entry: https://deepnight.itch.io/ldtk/purchase

The page explains optional payment and displays `No thanks, just take me to the downloads`, plus three included platform files. No skip action was available as a web-reader link and none was synthesized. A public file listing is metadata evidence, not a transfer receipt.

### Pixel tool with multiple creators: Pixelorama

https://orama-interactive.itch.io/pixelorama

Observed Authors row links Orama Interactive and OverloadedOrama (`https://overloadedorama.itch.io/`). Project supports an in-browser `Run tool` entry as well as downloads. A Steam widget URL in the description (`https://store.steampowered.com/widget/2779170/`) is an external interactive embed, not a video or native project download. Nine listed platform artifacts carry version v1.2.3, including separate Linux ARM64 and ARM32. These explicit labels demonstrate that platform/architecture belong to files, not just a project-wide platform array. No playable iframe execution or transfer was tested.

### Paid public boundary and trailer: Nuclear Blaze

Project: https://deepnight.itch.io/nuclear-blaze

Purchase entry: https://deepnight.itch.io/nuclear-blaze/purchase

Public project body exposes `https://www.youtube-nocookie.com/embed/zERLzDkyoDs` and ordered images; one opened image resolves to https://img.itch.zone/aW1nLzczNzEyMDEucG5n/original/PUYAc4.png (PNG image returned). Preserve trailer provider/embed URL without pretending playback or downloadable video was verified. Repeated decorative separator image references recur between body sections: retain ordering/role and avoid counting every occurrence as a distinct screenshot.

Buy Now requires $9.99 USD or more. Public purchase metadata lists DirectX recommended 105 MB and OpenGL 104 MB; project labels both version 1.5.0. Public price/file visibility proves an actual paid project surface, not paid download support. No purchase, key, authenticated page or file transfer occurred.

## API, entitlement and tracking boundaries

[Server-side reference](https://itch.io/docs/api/serverside): `/profile/games` lists games the user uploads or can edit, not a general purchased library. `/profile/owned-keys` lists published-game keys, allows repeated keys for one game, and continues until an empty page even after a short page. Its nested `game.user` contains creator ID/name/profile/avatar; game cover is separate. `/games/:id/ownership` is restricted to OAuth apps and games editable by the app creator, so it cannot serve as a universal ownership probe. These are documented contracts, not live API receipts.

[Download-key guide](https://itch.io/docs/creators/download-keys): keys may arise from purchases, owner grants or eligible claims. A free download creates no ownership key. Paying for a free project does create one. Keys reveal access and their URLs must remain private. Removed/replaced/added files change what owners see; individually priced files depend on the key's price. Therefore owned-key absence is not proof that a public free file cannot be downloaded; visible paid metadata is not permission to download.

[Followers guide](https://itch.io/docs/accounts/followers): native follow is an account relationship feeding activity and notifications. The public pages show Follow and Following text together in a guest representation; that is not authenticated state readback. Add To Collection is distinct. Current OAuth scopes document collection reading/editing, but no native follow import or mutation endpoint was established. Local tracking should store creator/project/devlog watch state independently, with optional public index refresh. The [API overview](https://itch.io/docs/api/overview) documents browse RSS and global feeds; do not invent a creator/devlog RSS endpoint from that alone.

[Designing pages](https://itch.io/docs/creators/design): templates allow inline images, screenshots, optional GIF banners, and YouTube/Vimeo/SketchFab trailers. Custom CSS and one/two-column layouts defeat a rigid visual-position assumption. These official media capabilities are documented; full DOM/media parity, actual GIF frame decoding and playback remain pending.

## Proposed extraction and acceptance

- Route classification: creator subdomain root; project slug; `/devlog` index; `/devlog/NUMERIC_ID/SLUG` item; `/purchase` public offer; private download-key routes only within authorized private sessions. Prefer observed canonical links; slug strings are not stable provider IDs.
- Source project body and metadata from the project; source devlog title/byline/body/files from the item, not its teaser index or embedded Get-project card. Keep source URL, parent project URL, observed timestamp, record type and provenance on every field.
- Use numeric user/game/upload/build IDs only when actually supplied by a permitted response. Do not invent IDs by decoding image URLs or assume `/profile` can fetch arbitrary users.
- Store ordered media occurrences with roles; sanitize rich HTML/embeds and preserve explicit source links. Image response success does not imply redistribution rights.
- Acceptance still needs permitted DOM captures, author/avatar joins, multiple-author handling, screenshots/GIF/video parity, pagination termination and edit checks, OAuth grants/revocation/failure cases, real free download transfer, and separately authorized owned/paid/key/file-tier tests. No full-support claim.

Initial research limitations: direct HTTP was denied and the web reader supplied extracted text. The subsequent DOM replay below resolves public subtree/portrait extraction for two samples. Authenticated API access, owned-key pages, file transfers and video/animation playback remain unaccepted.


## Executable public DOM experiment — October 31

The initial HTTP limitation above was subsequently resolved with permitted cloud-browser captures of actual public DOM subtrees. The isolated [itch.py parser](../../experiments/site-extraction-lab/itch.py) now replays FlowFit and a media-rich LDtk devlog with the shared lab's no-network HTML and sanitized-receipt helpers. The [actual replay receipt](../../experiments/site-adapter-discovery/itch-io-dom-replay-2026-10-31.json) retains implementation/input hashes, body hashes and counts, ordered media references, exact identity joins, file metadata and browser-reported decode states. Raw bodies/captures stay outside the repository. This is sample-scoped executable extraction, not universal support.

FlowFit yields game ID **2290338**, author ID **1745407**, full captured description subtree and six ordered **GIF** references. All six browser images reported positive natural dimensions: two 1500×900 and four 1200×720. This confirms image decoding, without separately proving animation playback. The captured `.formatted_description` excludes project art and file controls. File rows use `.upload_list_widget .upload` with explicit name/size; no upload ID or transfer is inferred.

The creator page links its community profile. That profile links back to the creator and supplies a matching FlowFit game card (`data-game_id=2290338`) and author label (`user:1745407`). The profile follow URL supplies the same account ID. Its `.stat_header_widget .avatar` CSS background supplies the author portrait URL. The creator page's 403×282 banner, project `og:image`, game thumbnail and random widget IDs are separate. The parser requires the reciprocal URL/account/game joins before attaching the profile avatar; it does not infer an ID from `user_3283662` or use a banner as portrait.

LDtk yields parent game ID **740403**, author ID **121597**, devlog ID **663374**, its own title and byline, file metadata and eight external PNG references in source order. The body selector is specifically **`section.post_body`**: a comment also has `.post_body`, so a broad class-only selector would contaminate the body. Four images were decoded at capture time; four remained pending/lazy. All eight references are extracted, but all-image decode and playback are unaccepted. No verified Deepnight avatar was supplied, so the parser leaves it absent.

The parser extracts only caller-supplied captured DOM. It performs no network, login, payment, follow, download or code execution. Its CLI accepts a private capture path and writes a sanitized receipt. Nine explicitly synthetic defensive tests cover comment exclusion, missing body/avatar, ambiguous subtrees, random widget IDs, profile mismatch, unsafe references, metadata-only files, multiple authors and unsupported routes. These tests validate defensive mechanics; the separate actual-source replay establishes the two observed selector/identity cases. Full-page/history completeness, other templates and authenticated file delivery remain pending.
