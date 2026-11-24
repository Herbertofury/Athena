# Round-three communities and extraction methods

[Adapter laboratory](README.md) · [Complete coverage](coverage-catalog.md) · Checked **2026-10-31**

This pass expands the researched catalog from **349 to 426 canonical service/scope entries** after deduplication. It adds **367 dated source/outcome records**, including actual release pages, creator profiles, public API captures, documented interfaces and preserved failures. The catalog now embeds **1,510 source records**. These totals include independent creator hubs, reference tools, historical scopes and access-limited candidates; they are not counts of working adapters.

The useful implementation change is separate: new offline Discord and Bluesky normalizers preserve post ownership, ordered media and incomplete states. Bluesky has actual unauthenticated API fixtures from mod creators. Discord has documented schemas and synthetic defensive cases; no bot grant or private-channel fixture was configured. [Bluesky guide](bluesky.md) · [Discord guide](discord.md) · [Executable lab](../../experiments/site-extraction-lab/README.md).

## Coverage added in this pass

| Research area | Added canonical scopes | Source/outcome records | Strong additions and exact boundaries |
|---|---:|---:|---|
| [Skyrim SE / AE](games/skyrim-se.md#round-three-community-and-extraction-research) | 13 | 47 | ModlistGrimoire, ElderScrollsPortal, Vicn / More Skooma, Team EC, LoreRim and original modlist communities. Original author, converter, uploader and team roles remain distinct. |
| [The Sims 4](games/sims-4.md#round-three-community-and-extraction-research) | 12 | 70 | Simblr.cc, SGLYNP, TS4 Mod Hound, House of Harlix, SIXAMcc, Lumpinou and Plumbob Post. Actual author images, ordered stills, failed GIF/attachment fetches and login redirects are recorded separately. |
| [Minecraft Java / Bedrock](games/minecraft.md#round-three-community-and-extraction-research) | 24 | 69 | MCModels, Chunkfactory, MinecraftStorage, Smithed, Bedrock Explorer and original teams. Paid vendor identity, Java/Bedrock compatibility, external release provenance and sponsored media are separate fields. |
| [Fallout 4](games/fallout-4.md#round-three-community-and-extraction-research) | 3 | 38 | Overwolf Appstore, Fallen World and Nexarplays; improved Fallout London, CSEP, Confrérie and original creator methods. Preserve migration and original-release links. |
| [Cyberpunk 2077](games/cyberpunk-2077.md#round-three-community-and-extraction-research) | 4 | 41 | M Works, SoundDB, XMODhub and ModsLab. Actual Nexus gallery uploaders differ even inside a gallery labelled Author images. |
| [Hytale](games/hytale.md#round-three-community-and-extraction-research) | 5 | 31 | HytaleKit, HyItems, Mythyl, WanMine and HytaleWiki.pro. Old index ZIP and current original JAR are not interchangeable releases. Prelaunch claims remain dated. |
| [Other game ecosystems](games/other-games.md) | 15 | 42 | Outer Wilds, Celeste, Rain World, Doom, Sonic, Project Zomboid, 7 Days to Die, flight simulators, SimCity, Souls and Satisfactory communities. Five actual item/creator pairs and explicit blocked/shell states. |
| Social protocol pass | 1 | 29 | Pillowfort discovered through a real Sims creator link; Discord public guild discovery and actual Bluesky post/feed/profile/follow pages improve existing service methods. |

Ordinary Sildur, Audioware and Everest GitHub Pages projects are retained as named GitHub scopes; they do not add three extra platforms. SoundDB is a reference database scope, not a mod-file host. Creator accounts on Patreon, Tumblr, Ko-fi, Discord and Bluesky stay under their existing canonical services. [Machine evidence and normalization decisions](../../experiments/site-adapter-discovery/community-research-round3-2026-10-31.json).

## Concrete extraction improvements

### Join identities before displaying an author

An app needs separate identities for the post author, original mod creator, release uploader, converter, marketplace vendor, gallery contributor, curator and repost actor. The visible byline alone is insufficient.

| Actual sample | Mapping to retain | Failure prevented |
|---|---|---|
| ElderScrollsPortal Naiad SE resource3275 / member9748 | Local uploader/converter Shi Zon and credited original creator Den987 | Relabeling a converter as the sole original author. [RDSKY31035] [RDSKY31036] |
| Simblr item8487 / user96 | Explicit creator profile and its avatar; three ordered body images | Using clothing artwork or a repeated description preview as the creator identity. [RDSIM31003] [RDSIM31004] [RDSIM31005] |
| MinecraftStorage Solas / publisher Jaker | Publisher profile plus original release provenance | Treating a publisher as the shader developer or treating conflicting profile counters as complete history. [RDMC31010] [RDMC31011] [RDMC31012] |
| Bluesky mod-author feeds | Post AT URI/DID, original author object, repost reason and quoted-record author | Assigning every feed item to the feed owner. [RDSOC31016] [RDSOC31017] [RDSOC31020] |
| Discord forward | Forwarding account and immutable snapshot, whose original author is absent | Inventing creator attribution from the user who forwarded it. [RDSOC31001] [RDSOC31004] |

Missing avatars stay missing. A storefront banner, Discord server icon, generated DiceBear placeholder, product cover or quoted-post preview must retain its actual role. Preserve source-local IDs as strings where their schema requires it; a display handle is not a stable cross-site identity.

### Walk every media representation

Discord media can live in attachments, embeds, component galleries, section thumbnails and component files. A parser that examines only the top-level attachment array loses content. Component text also needs its own ordered traversal. Forward snapshots and replies remain separate content contexts. [RDSOC31001] [RDSOC31002]

Bluesky distinguishes record blob references from AppView image URLs, video playlists, video posters, external link cards and quoted-record media. Keep original post media separate from quoted media. Preserve UTF-8 facet ranges and full external link targets in memory; truncated display text is not the download URL. The experiment does not replace upstream SDK identity resolution, moderation, auth or transport. [RDSOC31008] [RDSOC31009] [RDSOC31010]

For HTML sites, scope the main article or release body, then enumerate image, video, audio, iframe and attachment elements in source order. Do not include recommendations, comments, sponsored iframes or duplicated responsive carousels in the post gallery. Keep both layout order and stable asset identity when deduplicating. The Minecraft, Sims and other-game guides retain concrete counterexamples.

### Separate discovery, file delivery and playback

A linked filename, successful redirect, decoded still, valid archive and playing video are different results. Simblr's item attachment returned404 while an alternate Sim File Share page was readable in one attempt. SIXAM's public article links a public CurseForge release and a separately locked Patreon post. The public article does not confer identical entitlement on every destination. [RDSIM31003] [RDSIM31006] [RDSIM31007] [RDSIM31019] [RDSIM31022]

Discord signed attachment URLs are temporary delivery capabilities. Keep the full URL only in the authorized runtime context. Store a stable message/attachment identity and expiry separately; refresh through an already authorized official message read. Sanitized evidence URLs are references, not playable or downloadable replacements. The same principle applies to creator-platform CDN redirects. [RDSOC31003]

Actual Bluesky checks decoded two author avatars, one original post image and one video poster. The video master playlist had a valid HLS header and two variants; no segments were fetched and no playback is claimed. The poster returned `application/octet-stream` but decoded as JPEG, a concrete reason to validate bytes separately from the response's declared type. [RDSOC31025] [RDSOC31026] [RDSOC31027] [RDSOC31028] [RDSOC31029]

## Following authors from an app

Model three independent operations: a local watch rule, importing an existing source following list, and changing the source's native relationship. Paid membership and content entitlement are additional independent states.

For Bluesky, the public graph sample traversed two pages of two follows each with the returned cursor. That proves bounded page extraction and subject identity checks. It is not the user's account import and not proof of a complete following list. Native follow writes use an authorized record operation and were not performed. [RDSOC31011] [RDSOC31023] [RDSOC31024]

For Discord, watch a permitted channel/thread and optionally filter by stable author ID. This is not a global author feed. Native announcement following creates a relationship into a target channel; it is not general-purpose user following. [SA052] A public invite or server directory establishes community discovery, not permission to read channel history. [RDSOC31005] [RDSOC31006] [RDSOC31007]

For creator sites without a documented native follow API, preserve observed follow UI as discovery evidence. Use a local watch only after the app has a legitimate content route. Test native mutation, import pagination, unfollow behavior and revoked access as separate cases rather than inferring them from a visible button.

## Login and access workflow

Use a source-specific connection state: public, account required, entitled account required, app grant required, inaccessible, or unknown. Ordinary403,404, missing body, stale index or JavaScript shell do not by themselves identify a login problem. The source outcome remains attached to the exact operation and attempt.

A browser session can support a permitted signed-in page fixture. It does not automatically supply a developer API grant. Discord requires an explicitly authorized app/bot route for automation; a personal user session is not a substitute. User sign-in and additional persistent app access are separate steps. Private bodies, cookies, credentials and signed private URLs stay out of the public wiki and repository. [Secure login research](authenticated-research.md).

The remaining gates are concrete: capture the exact missing item/profile after permitted sign-in; compare the accessible body and ordered media; exercise terminal pagination and edit/delete cases; verify entitlement-aware file delivery; test native follow/import separately. Earlier LoversLab/F95 tool-policy blocks remain preserved. No alternate route was used to bypass them.

## Validation and adoption

The new normalizers remain offline experiments. Source captures are caller-owned external inputs; public receipts contain hashes, counts, identity relationships and safe locators. Synthetic defensive fixtures are labelled synthetic. No complete-platform acceptance or universal performance improvement follows from the increased coverage.

GameSync Next remains behind the existing [target adoption gate](validation-and-adoption.md): compare against its actual current implementation, retain complete output and access behavior, and prove a meaningful benefit before changing that repository. No GameSync Next files were changed in this pass.
