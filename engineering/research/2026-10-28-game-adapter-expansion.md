# Game-specific site discovery and a real authenticated extraction fixture

Checked **October 27, 2026 America/Denver / October 28 UTC**. This continues the [initial broad adapter review](2026-10-28-site-adapters.md).

## Decision and scope

Discover original creator communities and mod distribution paths for Skyrim SE/AE, Fallout 4, Minecraft Java/Bedrock, The Sims 4, Cyberpunk 2077 and Hytale. Inspect actual item and identity pages, including body, avatar, media, files, following and access boundaries. Keep production adoption separate from research coverage.

Six independent game passes produced [dedicated guides](../docs/adapters/games/README.md), 179 game scope records and 420 new source records. Canonicalizing platforms across games added 86 service/scope entries to the earlier 162, for **248 catalog entries** and **791 deduplicated source URLs**. These counts include discovery candidates, references and historical scopes; they are not working-adapter counts.

| Game | Scope records | Source records | Inspection scope |
|---|---:|---:|---|
| Skyrim SE/AE | 35 | 72 | 11 detailed item/profile cases, original-author/uploader distinctions and domain integrity |
| The Sims 4 | 32 | 71 | 19 page observations across 16 services, plus the independent authenticated fixture below |
| Minecraft | 31 | 67 | Nine public project/profile pairs, Modrinth project/file JSON and Voxel metadata |
| Fallout 4 | 28 | 79 | 13 content/identity pairs, including one partial pair; organization identity kept separate |
| Cyberpunk 2077 | 29 | 64 | Eleven item/profile pairs, original announcements, repositories, regional translations and files |
| Hytale | 24 | 67 | Nine item/profile pairs and four file metadata cases, with unsupported scopes retained |

The source register adds SKY1–SKY72, SIMS001–SIMS071, MCX001–MCX067, FOX001–FOX079, CPX001–CPX064 and HYX001–HYX067. All individual IDs, URLs and retrieval states are in the [source register](../data/sources.json) and [game manifest](../experiments/site-adapter-discovery/game-research-2026-10-28.json). The source schema's `primary_documented` category is qualified by `sourceRole`: 321 new primary observations and 99 failed, partial, shell or search-only retrieval attempts. A registered first-party locator does not imply its content was successfully read.

## Actual authenticated result

The [Mod Collective workbench](../docs/adapters/mod-collective.md) records one user-authorized free-account fixture. The creation title, provider creation ID, 400-character body, linked Philo creator, three ordered decoded images and a decoded creator avatar were extracted from the rendered page. The site's normal quota/countdown flow produced a **3,407,157-byte DBPF package** whose SHA-256 was calculated. No mod binary, full creator body, account identifier, credential or signed file URL is published. [SIMS002] [SIMS003]

This closes specific observation and download checks for one creation. It does not establish a reusable platform adapter, complete creator history, native-follow synchronization, video/GIF playback, paid content, expiration recovery or in-game compatibility. A successful `.null` avatar URL also demonstrates why image-extension guesses cannot replace actual decode evidence.

## Findings that change implementation choices

Creator identity must retain role and provenance. Regional sites identify translators and uploaders separately from original authors; GitHub release publishers can be automation accounts; ModDB distinguishes the project, developer company and news author. Avatar extraction must be scoped to that identity: role badges, theme patterns, project covers and thumbnails are not interchangeable. [SKY15] [SIMS009] [FOX017] [CPX016]

An extraction boundary can be smaller than a whole page. Description tabs, lazy galleries, spoilers, pagination, separate file/version tables, external hosts and entitlement states each need their own result. Mod Collective's customization area failed while its download succeeded. Fallout's ten-position gallery had eight successful image opens and two failures; preserving all positions is more accurate than reporting only the eight successes. [FOX029] [FOX032] [FOX033] [FOX034] [FOX035] [FOX036] [FOX037] [FOX038] [FOX039] [FOX040] [FOX041]

Domain and service identity must survive change. Polymart's documentation redirects to voxel.shop and remains one service. Poggit routes now resolve to a release archive. Historical creator destinations can redirect to unrelated or parked sites. Preserve the old observations and new destination state; do not send credentials to an unverified successor. [MCX029] [MCX039] [SKY72]

Game support is also operation-specific. Hytale's current first-party documents describe a live in-game mod browser, while Modrinth explicitly excludes Hytale. A Minecraft host's presence in a discovery list must not become a supported Hytale adapter. Exact runtime/storefront requirements remain source-local facts until reconciled for a selected target. [HYX002] [HYX007]

## Authentication and publication outcome

GitHub browser authentication reached the signed-in wiki with Edit controls. Mod Collective authentication reached the authorized free download flow. LoversLab and F95zone were denied by this session's browser site-safety policy before login; no alternative access route was attempted. Other observed login pages remain a queue, not completed authenticated fixtures. The available browser inventory exposed a remote Chrome session; no local Opera/Chrome connector was found in the plugin search. These are environment observations, not claims that the websites are down or permanently unsupported.

Browser control later timed out on a profile observation, its diagnostic request and a runtime-reset attempt. The completed canonical files and local wiki projection are retained. **A successful GitHub sign-in is not proof of a published wiki update**; live wiki publication remains pending unless a later receipt explicitly verifies it.

## Acceptance and validation

The six public research bundles have no authenticated acceptances; the independent Mod Collective receipt has one scoped authenticated extraction/download observation. New platform-wide acceptance remains zero. No GameSync Next files were modified, and no comparison against its exact current baseline was run.

The [validation receipt](../experiments/site-adapter-discovery/game-expansion-validation-2026-10-28.json) records the actual repository checks and publication state. Existing dated receipts remain unchanged. Subsequent work should select mixed-media and history fixtures on accessible authorized sites, establish exact body/media/file parity, and only then test comparative target adoption.
