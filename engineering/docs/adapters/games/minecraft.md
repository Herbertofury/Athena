# Minecraft communities, project files and creator identity

Checked **2026-10-28 UTC**; user-facing research date **October 27, 2026, America/Denver**. Evidence level: **public observation plus primary documentation**, with failed requests preserved. This pass studies 31 distinct services/scopes, including blocked candidates and independent creator hubs. It does not add 31 working adapters, certify an entire domain, or establish a download, avatar decode, video playback, authenticated follow/import or complete-history acceptance.

The most actionable starting points are Modrinth for documented structured project content, CurseForge for its approved API plus page-only author avatars, Hangar for plugin pages and its current OpenAPI, and the actual linked Planet Minecraft, ModBay and MinecraftMaps project/profile pairs. Regional community pages reveal useful author roles and original release links, but a regional article, uploader and original mod developer are separate entities. BuiltByBit permits only its official API for programmatic interaction. These recommendations are conditional on the field and operation evidence below.

## What was actually inspected

Opened public project and linked author/organization pages on **nine services**: Modrinth, CurseForge, Hangar, Planet Minecraft, ModBay, MinecraftMaps, GitHub, MC百科 and MCBBS Memorial. “Pair inspected” does not mean the profile supplied every required field: several lack a usable avatar URL, and encyclopedia authors are not automatically site accounts. Minecraft Forum release-thread page 1 and page 2 also opened, but its author's profile returned 403. Spigot's project opened while its correct author route returned 503. MCPEDL returned a partial project and a broken author shell.

Observations came from public retrieval, not an authenticated browser. Semantic headings, link destinations and image labels below are observed field sources. No CSS selector or DOM script was executed. Treat suggested anchor matching as an implementation candidate until verified against a permitted HTML fixture. Search snippets were used only to locate primary pages. A local `urllib` network attempt was blocked by the sandbox; no alternate network or access bypass was attempted.

## Public project/profile recipes

### Modrinth: structured body and galleries, creator join still incomplete

[Sodium](https://modrinth.com/mod/sodium), [jellysquid3 profile](https://modrinth.com/user/jellysquid3), [actual project JSON](https://api.modrinth.com/v2/project/sodium), [project schema](https://docs.modrinth.com/api/operations/getproject/) and [user schema](https://docs.modrinth.com/api/operations/getuser/) were read (MCX001–MCX005).

The JSON identifies `id=AANobbMI`. Preserve `body` as Markdown/HTML and its inline-media order; `description` is a short summary. Project `icon_url`/`raw_icon_url` are project images. Six gallery records expose `url`, `raw_url`, caption fields and `ordering` values `0,1,10,30,999,1000`; a resized gallery URL must not replace its original source. Keep inline body media and gallery positions independently.

The profile supplies a separately named creator image. The documented user endpoint supplies `id`, `username`, optional display `name` and `avatar_url`; the project `team` joins to member roles. Live user/member and individual-version requests failed, so that creator join remains unverified. A later [version-list request by project ID](https://api.modrinth.com/v2/project/AANobbMI/version) succeeded (MCX067): version `g6ju16VJ` links project `AANobbMI`, uploader `TEZXhE2U`, Fabric/game-version compatibility and file `rbdNchdD`. The file manifest supplies original filename, CDN URL, size `1912496`, SHA-1/SHA-512 and primary flag. Separate NeoForge variants remain separate releases/files. No jar bytes were fetched. Project follow and followed-project import are distinct from a locally maintained creator follow. No follow action was performed.

### CurseForge: API description plus actual member avatar

[JEI](https://www.curseforge.com/minecraft/mc-mods/jei), [mezz](https://www.curseforge.com/members/mezz/projects), [file 9207610](https://www.curseforge.com/minecraft/mc-mods/jei/files/9207610) and [API docs](https://docs.curseforge.com/rest-api/) were inspected (MCX006–MCX009).

Project ID `238222` and author link `/members/mezz` are explicit. The Team block labels the owner and a **profile avatar**, distinct from the project item image and description screenshot. The member page has its own avatar plus Projects/Favorites/Followers. Description, gallery, file changelog and release metadata are separate channels. A rendered `Unfollow` label alone establishes neither authenticated state nor a successful write.

The documented API uses `x-api-key`; no key was supplied. Use `data.authors[].id/name/url` for author identity, not `data.logo`; the author schema lacks an avatar field. Fetch `/v1/mods/{id}/description`, screenshots and version files separately. Preserve a file's ID, compatibility, dependencies, hashes and authorized URL. API pagination is capped at 50/page and a 10,000-result window. Project/member pages being readable is not permission to evade API distribution controls.

### Hangar: organizations and plugin platforms

[ViaVersion project](https://hangar.papermc.io/ViaVersion/ViaVersion), [organization](https://hangar.papermc.io/ViaVersion) and [current OpenAPI JSON](https://hangar.papermc.io/v3/api-docs/public) were inspected (MCX026–MCX028).

The project body places a YouTube iframe before ordered external images. The profile identifies an **Organization**, six projects and member roles. Preserve organization ownership separately from human developers and version uploaders. OpenAPI `User.id/name/isOrganization/avatarUrl` describes creator identity; `Project.avatarUrl` is the project icon. `Project.mainPageContent` holds body content. `Version.downloads`, `platformDependencies` and `pluginDependencies` preserve platform-specific file choices.

The live project API request failed, so the schemas are documented rather than a passed payload fixture. Use only published routes: the specification says unlisted routes are internal. Anonymous access covers public information; nonpublic operations use API-key-derived expiring HangarAuth JWTs. `userActions.watching` and `stats.watchers` describe project watch semantics, not verified author-follow import. Media decoding, YouTube playback and file bytes remain untested.

### Planet Minecraft: inspect real links and collapsed sections

The [mod directory](https://www.planetminecraft.com/mods/) led to [More Music Discs](https://www.planetminecraft.com/mod/more-music-discs-fabric-forge-1-16-5-1-19-2/) and [MarsThePlanet](https://www.planetminecraft.com/member/marstheplanet/) (MCX010–MCX012). Earlier guessed project/profile URLs failed; these actual linked pages opened.

Use the project byline's member link as author provenance. Preserve the main description, collapsed “Click to reveal” copyright section and ordered Imgur media before Tags/Update Logs. Do not absorb comment avatars or recommendations into body media. The page reports 76 update logs but initially exposes only the latest plus `LOAD MORE LOGS`; complete history remains unproven. Profile Content Gallery, Subscribers, Subscriptions and personalized site feed are different channels. Creator avatar URL and a native Subscribe action were not exposed in the retrieved profile. Do not infer either from the member name or a commenter image. Native follow, download resolution and pagination need permitted client fixtures.

### ModBay: profile avatar and long body separate from comments

[Better on Bedrock post 365](https://modbay.org/mods/365-better-on-bedrock.html) links [XxPoggyisLitxX](https://modbay.org/user/xxpoggyislitxx/) (MCX022–MCX023). The lowercase canonical route matters; a guessed mixed-case URL failed.

The profile explicitly labels its image as the creator's profile avatar and supplies bio, join date and four posts. The post's Thumbnail is a different asset. Preserve the long main body and changelog, item/recipe images and headings through the Download links and Supported versions sections. Exclude sidebars, More articles and comments. The mcaddon link is a file-discovery observation; its final redirect and bytes were not verified. An inspected external-link interstitial was a **wiki** link, not the file. Comments expose pages 1–7 and Load more; no complete pagination acceptance. “Follow my Twitter” is external social follow, and hearts lead to login. Neither proves a native ModBay creator follow.

### MinecraftMaps: gallery, author and editions

The current [homepage](https://www.minecraftmaps.com/), [Parkour Spiral detail](https://www.minecraftmaps.com/29139-parkour-spiral) and [Hielke profile](https://www.minecraftmaps.com/user/Hielke) opened (MCX016–MCX018). This supersedes an earlier 403 only for these observed pages.

The detail exposes a seven-item gallery: trailer thumbnail plus six screenshots. Preserve gallery order, Description, Changelog and Videos as separate sections. The byline, creator card and Uploaded By link all point to Hielke. The `H` fallback is not an avatar image. Map version `3.0.3`, Minecraft version `26.2` and `11.8 MB` appear with Download Map; no file bytes were fetched. The page expressly identifies the Java map and links its distinct Bedrock Marketplace edition.

The profile shows Follow and a 14-map count, while the retrieval exposes only 12 map links. That discrepancy is a concrete completeness failure to resolve, not an exhausted history. Follow was observed but not clicked or imported.

### GitHub: owner, release author and source archive differ

[Sodium repository](https://github.com/CaffeineMC/sodium) and [CaffeineMC organization](https://github.com/CaffeineMC) opened (MCX035–MCX036). The owner profile has a separate `avatars.githubusercontent.com` organization image and verified-domain information. Keep repository owner, release uploader and contributors distinct.

Repository README/source/license/release navigation supplies provenance. Source archives are not automatically compiled mod jars. A future permitted adapter should inspect explicit release asset metadata and compatibility rather than turn every zip/tar link into a playable mod. Preserve inline README media and release-attachment order separately. The page explicitly requires sign-in for notifications and starring; those are not an imported creator-follow list. No release asset, avatar decode or embedded playback was tested in this scope.

### MC百科: author records versus editors

[CTNH modpack 897](https://www.mcmod.cn/modpack/897.html), [author 34953](https://www.mcmod.cn/author/34953.html) and [mod class 1702](https://www.mcmod.cn/class/1702.html) were inspected (MCX043–MCX045).

CTNH's author/development roster links `80802345` with a specific contributor role. Its author page has a separately named image on `i.mcmod.cn`, team and project relationships. This encyclopedia author entity differs from the `center.mcmod.cn` editors and recent visitors. `/modpack/897.html` and `/class/1702.html` are different namespaces.

Extract the long introduction with numbered image labels and section order, and preserve roster roles. Follow related official publisher links for release provenance; an encyclopedia entry is not necessarily the publisher. Class 1702 visibly reports zero mod downloads: do not manufacture a file URL. Native creator follow/import and author-image decoding remain unverified. The page's public editing license statement does not license every linked binary.

### MCBBS Memorial: repost provenance and actual gate

[Memorial home](https://www.mcbbs.co/), [thread 6667](https://www.mcbbs.co/thread-6667-1-1.html) and [UID 213929](https://www.mcbbs.co/space-uid-213929.html) opened; [original mcbbs.net](https://mcbbs.net/) did not (MCX046–MCX049).

Preserve thread ID, post identity and poster UID separately from original software authorship. This thread labels itself a repost and distinguishes original author Matterz from the community-maintained fork. Body cover art is not the poster avatar. The profile supplies UID and display name but no confirmed avatar URL. “Add friend” is not equivalent to creator follow.

The thread explicitly requires login to download/view an attachment area. The visible external GitHub URL is not a successful gated attachment retrieval. Preserve the blocker and do not attempt login or any alternate route to defeat it. The Memorial domain and archived original community must not be silently merged into one current account namespace.

## Remaining services and meaningful discovery scope

These entries add useful discovery choices without inflating the result into a full-support list. A blocked candidate is retained as blocked. An editorial index is useful for discovering original projects, not as evidence that all of its mirrors are authorized. None of the following has a passed complete creator/body/media/files/follow workflow in this pass.

| Service/scope | Observed primary evidence and practical boundary |
|---|---|
| [SpigotMC](https://www.spigotmc.org/resources/luckperms.28140/) | LuckPerms 28140 exposes Luck author route 100356, proxied body images, version and jar download label. Correct [author route](https://www.spigotmc.org/resources/authors/luck.100356/) returned 503. Keep Overview/Updates/History/Discussion and premium purchase entitlements separate. MCX024–MCX025. |
| [MCPEDL.com](https://mcpedl.com/actual-guns/) | Actual Guns shows author, dates, project image and mcaddon metadata; opened Description is empty and [author](https://mcpedl.com/user/azozgamer936/) says undefined in a shell. Search text does not repair the live completeness failure. MCX019–MCX020. |
| [MCPEDB](https://mcpedb.com/) | The homepage request failed with HTTP 520. Requested discovery candidate only; no working recipe and no assumed relationship to MCPEDL. MCX021. |
| [BuiltByBit / former MC-Market](https://builtbybit.com/help/developers/v2-api/v2-overview/) | October 6, 2026 overview permits **only official API programmatic interaction**. Base `/v2/`, token/OAuth and per-endpoint entitlements; some operations require Ultimate. Public index was read for research; no scraping fallback is proposed. MCX033–MCX034. |
| [Polymart / voxel.shop](https://voxel.shop/wiki/api) | Old Polymart docs redirect to voxel.shop. Current [product 323](https://voxel.shop/product/323/polymart-plugin) has publisher link, description, compatibility and jar label, but [publisher](https://voxel.shop/shop/1) returned 403. One service with aliases. MCX029–MCX031. |
| [Sponge Ore](https://ore.spongepowered.org/) | Public shell exposes API link. Retrieved [API documentation](https://docs.spongepowered.org/stable/en/ore/api.html) identifies SpongeDocs 8.0.0 and historical v1 route replacements. Recheck current linked spec before using it. MCX037–MCX038. |
| [Poggit](https://poggit.pmmp.io/) | Both home and old plugin route redirected to [official release archive](https://github.com/poggit/release-archive). Package paths, metadata and archived artifacts require per-package inspection; original live social API is not accepted. MCX039. |
| [MCreator](https://mcreator.net/modifications) | Directory exposes Load More. [Attribute Modifiers](https://mcreator.net/plugin/103319/attributes-nerdy-edition) shows numeric creator link, body/images, changelog and compatibility-specific ZIP rows, but profile 403. Sample is a tool plugin, not a playable mod; preserve the distinction. MCX040–MCX042. |
| [Minecraft Inside](https://minecraft-inside.ru/mods/) | Russian community directory exposes real credited authors and filters. Detail/profile/avatar/original-file authorization still pending; regional writer and mod developer may differ. MCX050. |
| [Ru-Minecraft](https://ru-minecraft.ru/mody-minecraft/) | Russian version/category directory opened. Discovery/editorial candidate; no passed author/profile/file recipe. MCX051. |
| [Minecraft.fr](https://minecraft.fr/categorie/mods/) | French dated editorial discovery with version/type navigation. Retain writer, original developer and translation roles; resolve files to original sources. MCX052. |
| [Technic](https://www.technicpack.net/) | Official landing describes launcher discovery, personalized update feeds and Solder version hosting. Pack author, constituent mod authors and pack distribution are separate. Pack/profile/API fixtures pending. MCX053. |
| [Feed The Beast](https://www.feed-the-beast.com/blog/p/ftb-api) | March 12, 2025 policy permits third-party reintegration, migrates API root and asks custom User-Agent. Manifest sample failed this pass. Distinguish client pack, server files, individual mods and Marketplace products. MCX054–MCX056. |
| [ATLauncher](https://atlauncher.com/) | Own packs and other-platform integrations are separate sources. Official 2024 news records restored FTB permission; no blanket creator/file license or native follow API inferred. MCX057. |
| [OptiFine](https://optifine.net/home) | First-party creator hub and authoritative link to original release thread. Official Downloads remains the file authority; no invented author avatar or rehost substitution. MCX058. |
| [Vanilla Tweaks](https://vanillatweaks.net/) | First-party resource/data/crafting pack builder and socials. Generated custom-pack ZIPs need an actual selection/result fixture. Team brand image is not automatically a human avatar. MCX059. |
| [Complementary Development](https://www.complementary.dev/) | Official shader description opened as a seven-line partial surface. Actual download/version/media/profile fixture pending. MCX060. |
| [MrCrayfish](https://mrcrayfish.com/mods) | First-party request returned 403. Retain creator candidate with unknown cause and no fabricated fields. MCX061. |
| [FoxyNoTail](https://foxynotail.com/add-ons/mini-blocks) | Mini Blocks detail exposes body/readme, 13 version rows, Bedrock metadata and separate video links. Download `/download/NDAy` blocked by retrieval policy. EULA directs users to share the page rather than reupload files. Native Subscribe points to YouTube. MCX062–MCX064. |
| [Vatonage](https://vatonage.com/) | Redirected root produced zero extracted lines. Rendering fixture required. MCX065. |
| [Minecraft Marketplace](https://www.minecraft.net/en-us/marketplace) | Official landing shell distinguishes add-ons/skins/textures and paid entitlements; catalog payload absent. No general public package download endpoint or reusable `.mcaddon` export was established. MCX066. |

## Public API evidence and failures

The [voxel.shop documented sample](https://api.voxel.shop/v1/getResourceInfo/?pretty_print_result=1&resource_id=4) returned JSON (MCX032). Sanitized field evidence: `response.success=true`, resource `id=4`, `owner_id=1`, `updates.latest.id=29604`, `version=3.1-RECOMPILE`, HTML update description present. **`owner.name`, `owner.id`, `thumbnailURL` and `headerURL` were null.** Never replace them with guessed creator identity or project icon. A subsequent direct open failed; reopening the first retrieved reference succeeded. Preserve both observations rather than claiming uniformly reliable live access.

The [API reference](https://voxel.shop/wiki/api) documents `getResourceUpdates` pagination through `more`, `next_start`, `total` and `remaining`; those fields are not a passed pagination run. User downloads use `getDownloadURL`, while updater verification uses `requestUpdateURL`; neither was exercised. The metadata endpoint does not establish complete project overview body or avatar availability.

The [Hangar specification](https://hangar.papermc.io/v3/api-docs/public) opened, but `GET /api/v1/projects/ViaVersion/ViaVersion` did not. The documented [FTB example](https://api.feed-the-beast.com/v1/modpacks/public/modpack/125) did not open. Modrinth's project JSON and project-ID version list succeeded; slug-version-list, individual-version and user/member requests failed separately. These are operation-specific retrieval outcomes, not universal API outage diagnoses or authorization failures.

## File, media and follow acceptance work

A usable adapter should keep a creator identity record, project identity, release identity, ordered content blocks, gallery entries and files separate. Each file needs an actual source response, original filename, bytes/hash, compatible game edition, loader/server platform and dependencies. A `.mcaddon`, `.mcpack`, mod jar, modpack manifest, server zip, map zip and Marketplace entitlement are different distributions. No binary was fetched or executed here.

Images require both the correct source identity and a successful decode. A gallery preview, project icon, body illustration, creator avatar and commenter avatar have different roles even when their URLs share a CDN. Preserve animation for GIF/WebP where present rather than claiming animation from a static thumbnail. Embedded YouTube videos observed on Hangar, MinecraftMaps and FoxyNoTail are provider references; thumbnails do not prove playback or permission to obtain provider media files. No playback was attempted.

Local creator follow can be designed around stable IDs/canonical profiles without mutating source accounts. Native project watch, member subscription, friend, favorites, Discord membership, paid membership and YouTube Subscribe must retain their actual semantics. Every native mutation/import remains untested. Source counts and “Load more” controls are evidence of pending continuation; missing content must remain visible as partial.

Prioritize a permitted fixture set that resolves the actual remaining failures: Modrinth creator/team join and actual file bytes; CurseForge authorized API description and files plus member avatar; PMC collapsed body, creator image and update continuation; MinecraftMaps missing two creator maps and native follow state; ModBay final file link and comment continuation; Hangar platform-specific downloads; Voxel null owner fields; login-gated MCBBS attachments only after the user completes authorized sign-in. A 403, 503, shell or null is a retained result, not a reason to probe internal endpoints or change domains to evade controls.

Source IDs MCX001–MCX067 refer to this pass's primary pages and attempted URLs; the accompanying integration evidence supplies the proposed register objects. Existing broader [mod-host guidance](../mod-hosts.md) retains its earlier scoped findings. No GameSync changes or target adoption were made.

## Round two: concrete methods

[Cross-site method index](../methods-round2.md) · [Sanitized method evidence](../../../experiments/site-adapter-discovery/method-research-round2-2026-10-28.json). Source IDs with historical S2K/M2C/S2S prefixes are published as SKYB/MCB/SIMB; original IDs remain in the manifest.

Checked **2026-10-28 UTC**, user date **October 28, 2026, America/Denver**. Baseline: the current 248-entry Atlas catalog and existing Minecraft guide. This pass adds **22 independent candidate service/hub scopes**, **63 primary source records**, **nine inspected scopes**, **four executable extraction candidates** and **14 preserved real public response fixtures**. New candidates include explicitly blocked and historical references; those are not active-distribution acceptances.

The strongest improvement is concrete, repeatable evidence for Modrinth creator joins, a real public file hash check, Planet Minecraft creator/avatar/body selectors, and WordPress/RSS extraction. **No full adapter is accepted.** All native follow mutations/imports, authenticated workflows, purchases and video playback remain untested. No browser or authenticated session was used. No LoversLab or F95 URLs were accessed.

### Executed sample evidence

Actual anonymous responses were parsed live and replayed offline. The publication manifest retains fixture URLs, byte lengths, response hashes, normalized body hashes, creator joins, file manifests and decoding receipts. Raw bodies and private local paths are excluded. Experimental parsers do not establish production support.

### Modrinth: observed join and precise acceptance scope

Actual public GETs succeeded for [Sodium project](https://api.modrinth.com/v2/project/sodium), [team members](https://api.modrinth.com/v2/project/AANobbMI/members), [versions](https://api.modrinth.com/v2/project/AANobbMI/version) and [uploader](https://api.modrinth.com/v2/user/TEZXhE2U). See MCB001–MCB009 and the JSON `liveExperiment` receipts. Web retrieval initially failed for several of these URLs; a permitted public HTTP read with a meaningful User-Agent succeeded. The earlier transport failures remain in the failure register.

The actual project is `AANobbMI`, team `4reLOAKe`, organization `LjcZDkRW`. The organization ID remains opaque: an organization API contract was not established, and the public organization page returned a shell. A team record is not itself proof of organization ownership or an organization avatar.

| Person | Stable user ID | Observed project role | Creator image source |
|---|---|---|---|
| jellysquid3 | `TEZXhE2U` | Project Lead | `user.avatar_url`, confirmed by separate user response |
| IMS | `DzLrfrbK` | Maintainer | Nested team `user.avatar_url` |
| douira | `PSleyMoH` | Maintainer | Nested team `user.avatar_url` |

Display `name` is null in these observed member/user objects. Preserve the username instead of inventing a display name. The separate user response confirms the current release uploader, rather than selecting an arbitrary first team member.

The candidate `modrinth_candidate` asserts `version.project_id == project.id`, each `member.team_id == project.team`, and `version.author_id == uploader.id`. It retains project roles independently of release-uploader identity. Project `icon_url` stays separate from creator `avatar_url`.

The rich body contains 5,414 characters / 5,422 UTF-8 bytes. Its SHA-256 is `df3a968ae7436db584b614889a22b8574fb3123a16580e4c28b7fb3a6cf9ec58`. The six gallery records retain `url`, `raw_url`, `featured`, title and `ordering`; their observed order is `0,1,10,30,999,1000`. The original body remains authoritative. The included Markdown/HTML image-token projection is explicitly incomplete for arbitrary Markdown and does not certify a general body parser.

The first observed release is `g6ju16VJ`, uploader `TEZXhE2U`, Fabric / Minecraft `26.3`, `client_only`, beta release. Its file `rbdNchdD` is `sodium-fabric-0.9.3-beta.1+mc26.3.jar`, size **1,912,496 bytes**. A public in-memory stream matched its advertised size, SHA-1 and SHA-512. Separate NeoForge variants remain separate release/file choices. The complete hashes and source URL are in the receipt. These checks establish this file's manifest/byte parity; they do not establish installation, compatibility in a target, or execution safety.

The uploader avatar decoded as a **700×700 PNG**, one frame, 38,682 bytes. The decode receipt SHA-256 is `780ef3050eed6aca0814ebd25f17f070e7e05f73f5da8f01367da7d5c46d03b6`. Native project follow is documented separately from a local creator subscription. No follow/import request was made; version-history completeness and deleted/hidden releases remain unaccepted.

### Planet Minecraft: actual DOM rather than inferred labels

Actual raw public HTML was read for [More Music Discs](https://www.planetminecraft.com/mod/more-music-discs-fabric-forge-1-16-5-1-19-2/) and [MarsThePlanet](https://www.planetminecraft.com/member/marstheplanet/) (MCB011–MCB013). The `pmc_candidate` function ran live and offline on the retained responses.

| Field | Observed selector / source | Actual evidence |
|---|---|---|
| Project identity | `#resource_id` text | `5780546` |
| Creator identity | `#author_id`; byline `.mini-profile a.membertip[data-mid]` | `2726548`, canonical member link |
| Creator avatar | Profile `#avatar[data-mid="2726548"] img.avatar_icon` | `static.planetminecraft.com/files/avatar/2726548_1.png` |
| Rich body | Unique `#r-text-block.rich-user` | 18,795 normalized serialized UTF-8 bytes |
| Ordered media | Descendant image/iframe/video/audio/source nodes | 52 image nodes; includes badges/logos |
| Native follow evidence | `#subscribe_full button.subscribe` | `data-mid`, resource content type/ID, Subscribe/Subscribed/Unsubscribe labels |
| File discovery | `#resource-options a.third-party-download` | Two outward download/website routes |
| Update history | `#resource-log` | Initial update plus continuation; not exhausted |

The creator avatar decoded as a **120×120 PNG**, one frame, 17,125 bytes; SHA-256 `6fc14aa45259159a519d12459058e2792e85b1b6fd862627c7b0333301a28466`. The matching `data-mid` and scoped profile node prevent accidental assignment of comment/activity avatars.

The body projection preserves the complete selected HTML and walks media in document order. Fifty-two image nodes must not be relabeled as fifty-two screenshots: donation badges and project/loader graphics are part of that count. Gallery, body decorations and creator images need separate roles. The serialized-body SHA-256 is `adb1efb64548217c95cca736ddd636bba5696c9708e903be9edadb9599ed6531`.

The outward routes carry IDs `665405` and `665404`; they are discovery links to other hosts, not a verified PMC jar manifest. Native subscription attributes were observed without firing any request. The 76-log history and profile continuation remain incomplete. No internal AJAX/private endpoint was used or guessed for normalization.

### WordPress and RSS: a real alternative source with an honest mismatch

[RRe36's hub](https://rre36.com/) advertises `rel=https://api.w.org/` and RSS. The actual public [post collection with embeds](https://rre36.com/wp-json/wp/v2/posts?per_page=1&_embed) returned post **7402**, author **1**, `content.protected=false`, rich `content.rendered`, embedded author and featured media. [User 1](https://rre36.com/wp-json/wp/v2/users/1) supplies RRe36, the author slug and avatar URLs at sizes 24/48/96. The author's HTML URL redirects to the homepage, so it is not an independently verified profile page. Use the successful public REST identity evidence.

`wordpress_candidate` joins `post.author` to `_embedded.author[].id`. This is the **post writer** role; a mod developer or screenshot contributor must be established separately. Featured media `7404` remains project/article imagery, not the author's avatar. Its media response reports `image/jpeg` while the source URL and generated sizes use WebP: preserve the discrepancy and decode bytes before assigning a definitive media type.

Collection headers actually report `X-WP-Total:231`, `X-WP-TotalPages:231` at `per_page=1`, with a `rel=next` URL. Those headers provide a continuation recipe, not evidence that all pages were collected.

The advertised [RRe36 RSS](https://rre36.com/feed) parsed ten items. Its first `content:encoded` and REST body are both **12,342 characters**, but raw byte/hash equality **failed**. Inspection found the same text and ordered image sources; one image has REST `loading=lazy` / an `auto` sizes prefix versus RSS `fetchpriority=high` / a sizes value without that prefix. Both originals and hashes are retained. Do not silently canonicalize away that failed comparison or claim identical HTML.

[Crafters Colony](https://minecraft-mcworld.com/) provides a second working advertised [RSS feed](https://minecraft-mcworld.com/feed/). The current addon [269598](https://minecraft-mcworld.com/269598/) and its linked creator page were inspected. Public HTML and headers identify an opaque author slug, a scoped creator image and an advertised WP user ID `37884`; that user JSON was not fetched. The documented post REST route returned **403**. Its separate public RSS succeeds: ten items, first canonical link 269598, `dc:creator=kaochanMC_`, full `content:encoded` of **2,600 characters** versus a 120-character description. A feed's display name is not a stable user ID/avatar.

`rss_candidates` parses namespaces, GUID/link, publication time, `dc:creator`, full encoded content, description, ordered media and enclosures separately. It does not infer author avatars from channel artwork or turn a ten-item window into complete history. An initial experiment mistakenly applied JSON decoding to the XML feeds and failed; the corrected XML parse succeeded. That experiment failure is retained.

### Independent discovery beyond the existing catalog

The following are new service/hub scopes relative to the 248-entry baseline. Creator-owned websites are distinct scopes; creator accounts on already cataloged platforms are not counted again. The JSON retains precise source URLs, statuses and capability limits for each.

| Candidate | Scope and observed boundary |
|---|---|
| [Crafters Colony / クラフターズコロニー](https://minecraft-mcworld.com/) | Japanese original creator distribution; public addon/profile/feed inspected. REST403 retained. Do not mistake anonymous commenter Gravatar for creator image. |
| [Hanmafo / 한마포](https://www.koreaminecraft.net/) | Korean mod/pack/map/plugin community. Inspected article4215064: poster HyperSPR, developer HyperSpruce, MIT/source Modrinth/GitHub, four jar attachment rows with sizes and ordered body screenshots. Profile-hover UI lacks proven stable public member route; do not equate unrelated sidebar skin to poster avatar. Login required to comment; file bytes not fetched. |
| [Minecraft-Schematics.com](https://www.minecraft-schematics.com/) | Actual item32113 and HackAccused profile; Submitted by role, post date/body and favorites link. Item explicitly non-free with purchase/subscription required; no purchase/download attempted. Creator profile7creations vs3initial cards => incomplete history. Avatar not established. |
| [Abfielder](https://abfielder.com/) | Free/Premium separated. Factory Castle2944 has Created by PepaBw, original.litematic filename,37KB,version1.0 and conversion/3D links. Creator1 scoped list and abfielder item11780 inspected; this list is not proof of a profile/avatar. No format-conversion output or binaries tested. |
| [OlcanoMods](https://olcano.net/) | Actual Land Claim addon/profile Areed Elahi. Description image and item hero separate from profile image. Profile lists10publications/followercount; item carries platforms,version labels,40KB metadata but no extracted direct file manifest. Hand-review claim is site description, not independently verified moderation. |
| [RRe36's Projects](https://rre36.com/) | Active original shader hub with tested public WordPress/RSS author/body methods. Keep site post author distinct from screenshot contributors and external project hosting. Native follow unspecified; Patreon/Discord links are different actions. |
| [Bedrock Tweaks](https://bedrocktweaks.net/) | First-party site explicitly calls itself unofficial Vanilla Tweaks port, links original project, has separate resource/addon/crafting selectors. Treat independently from Vanilla Tweaks; builder-selection ZIP/rights/avatar not yet verified. |
| [myGen Gaming](https://mygen.co.uk/) | Original Bedrock hub: Advanced Floating Text detail has11captioned screenshots,body/features/install and external CurseForge download. Creator hub character art is not a confirmed human avatar. Public release-feed link exists; no complete release history or native follow test. |
| [BDcraft](https://bdcraft.net/) | Homepage502; retain blocked original-creator candidate only. No claims about current packages/entitlements/avatar. |
| [Dokucraft](https://dokucraft.co.uk/) | Official homepage title retrieved but zero extracted lines. Public rendering fixture pending; do not label the site inactive or its downloads accessible. |
| [Sapixcraft](https://sapixcraft.com/) | Original resource-pack hub with resolution-specific Java downloads, addons,mod support,news and separate Bedrock Marketplace path. Free16x/32x external Modrinth/CurseForge explicitly stated. Do not infer higher-resolution entitlement or creator avatar from logo; no package purchase performed. |
| [Sonic Ether / SEUS](https://www.sonicether.com/) | Original shader creator About Me and SEUS release/download listing inspected. Legacy/Renewed downloads on site; PTGI links Patreon and page says free. No entitlement or download acceptance inferred from text; preserve shader/version/date and external social follow separately. |
| [Continuum Graphics](https://continuum.graphics/) | Original publisher distinguishes free Continuum2.1 through Focal Engine, early-access store packages, RT and Stratum. No login/purchase/download; publisher page not a complete file manifest or creator avatar record. |
| [World Minecraft Japan](https://world-minecraft.com/) | Japanese world/mod/addon directory/forum with RSS link, but displayed newest material uses1.18.1 and forum ages4–5years; treat as historical/reference discovery until item/file freshness verified, not confirmed active distribution. |
| [Minecraft Japan Forum](https://civa.jp/) | Public root403. Search leads suggest mod/world sharing but no precise fields or API promoted. |
| [MCBE Japanese Forum](https://forum.mcbe.jp/) | Public root retrieval timeout. No profile/body/file or current active-distribution claim. |
| [MinecraftSchem](https://minecraftschem.com/about) | Distinct from minecraft-schematics.com. First-party About identifies LeonisTeam, public beta,creator uploads/avatars/subscriptions and direct or external downloads. Promised public APIs/open source are future-facing statements, not documented current endpoints. Actual item/profile fixture pending. |
| [Minecraft-France](https://www.minecraft-france.fr/) | Distinct from minecraft.fr. Actual Much More Dungeons article and Ezral team profile inspected. Ezral is editorial writer, not inferred mod author; profile skin portrait is editor representation. Ordered screenshot body/download source links need original mod developer attribution and separate binary validation. |
| [ZonaCraft](https://www.zonacraft.net/) | Spanish category directory retrieved from2-year-old crawl. Current freshness,original publisher links,creator/avatar/body/file rights unverified; historical discovery candidate. |
| [CloudburstMC Nukkit resources](https://cloudburstmc.org/resources/) | MobPlugin resource3 by PetteriM1: overview,107updates,history,compatible API1.1.0+,source/contributors and download link. Author profile403; preserve unresolved avatar. Nukkit plugin compatibility differs from Bedrock addon packs. No purchase/auth/follow action. |
| [skUnity](https://forums.skunity.com/resources/) | Official community describes creator-published Skript resources and separate docs/parser. Resource index inspected; concrete resource/profile/file fixture still pending. Syntax docs are reference tooling, not downloadable scripts by themselves. |
| [Skript.pl](https://skript.pl/) | Public root timeout; retain Polish community lead with no inferred current activity or fields. |

Several candidates remain blocked or historical. Their inclusion preserves useful leads without recommending unauthorized rehosts or claiming active distribution. MinecraftSchem and Minecraft-Schematics.com are separate domains/services; Minecraft-France and Minecraft.fr are also separate. Bedrock Tweaks expressly identifies itself as an unofficial port and links Vanilla Tweaks, so it should not be merged into the original project's identity.

## Round-three community and extraction research

Checked **2026-10-31**. The [round-three evidence manifest](../../../experiments/site-adapter-discovery/community-research-round3-2026-10-31.json) preserves original source locators, operation limits, failures and field mappings. Public observations are separate from executable parser and authenticated acceptance. Proposal counts below retain their original scope; the shared catalog applies alias and same-project normalization.

### Strong item and creator inspections

#### mcmodels

Identity: {"itemId": "18015", "creatorId": "115", "creatorRole": "Created by vendor ModelBlox", "creatorUrl": "https://mcmodels.net/vendors/115/modelblox"}.

**Avatar:** No confirmed creator avatar. Explicit ModelBlox banner is cover art; product hero is separate.

**Body:** Overview includes pack contents and pre-made configurations; do not absorb related items/footer.

**Media:** Product image1 and YouTube privacy-enhanced embed; no playback/decode. Animated in another product title is not animated-image proof.

**Files:** v1.0 and Oct28 dates; texture resolution16; per-plugin tested versions ItemsAdder1.21.4/HMCCosmetics1.21.6/Nexo1.21.4/CraftEngine1.21.6. No original archive filename,size,hash or entitled URL observed.

**Pagination:** Vendor140 products; only1–24/page1 of6 observed.

**Follow:** FOLLOW/Follow visible; no mutation or imported follows. Wishlist/cart distinct; purchase required for inspected product.

Sources: RDMC31002, RDMC31003.

#### chunkfactory

Identity: {"itemId": "4854", "creatorId": "37842", "creatorRole": "Author NitroPlugins", "creatorUrl": "https://chunkfactory.com/artists/nitroplugins.37842/"}.

**Avatar:** Artist listing only; no avatar confirmed.

**Body:** Overview feature lists, showcase, Free/Premium comparison and collapsed Terms Of Use must retain own sections.

**Media:** NITROPLOTS_MENU_SHOWCASE.gif and NITROPLOTS_PLOTENTERMESSAGE_SHOWCASE (1).gif precede PNG showcases. GIF labels observed, bytes/frame counts not tested; do not flatten to thumbnails.

**Files:** Paid €10/€8 observed,13 Updates and History links. No binary manifest verified. Java21/25 and1.21–26.3 compatibility are publisher claims.

**Pagination:** Artist product cards read; update/history continuation not traversed.

**Follow:** Native creator-follow control not established. Support Discord https://discord.com/invite/rZSDt7xykb observed in project; no join. Item forbids redistribution.

Sources: RDMC31007, RDMC31008.

#### minecraftstorage

Identity: {"itemSlug": "solas", "creatorSlug": "jaker", "creatorRole": "Publisher; not established shader developer", "creatorUrl": "https://minecraftstorage.com/users/jaker"}.

**Avatar:** Profile image labeled Mod; creator-avatar semantics unresolved. Article hero/screenshots cannot substitute.

**Body:** Description, Guide, Installation, Screenshots, Comments, Downloads separate routes/tabs. Preserve screenshot captions and comparison section; avoid recommendations.

**Media:** Eleven description image nodes90–100 with captions; comparison UI and Watch a video text lack verified media sources/playback.

**Files:** Solas Shader V3.2.zip;1.17mb displayed; Jan1 2026; release label; external cdn.modrinth.com Download. No bytes/hash/license acceptance.

**Pagination:** Profile zero-count summary conflicts with visible posts and7 Subscribers; page controls1–10…21,22. Keep partial/inconsistent flag.

**Follow:** Follow visible, not performed/imported.

Sources: RDMC31010, RDMC31011, RDMC31012.

#### smithed

Identity: {"itemSlug": "recipes_plus", "creatorSlug": "genmode", "creatorRole": "GenMode byline; stable UID pending live API", "creatorUrl": "https://smithed.net/genmode"}.

**Avatar:** Profile has two api.smithed.dev images; roles require API join. Documented UserData.pfp and banner differ; PackData.display.icon is project image.

**Body:** ReadMe area retrieved only short description; do not certify complete README from this projection. Documented display.webPage is optional.

**Media:** Six gallery images10–15 observed in pack order. Schema permits bucket/file/string gallery forms; no decode.

**Files:** Observed1.8.8 latest for26.3; many older compatibility/version rows. Documented versions.downloads.datapack/resourcepack,dependencies,supports; public live API attempts inaccessible.

**Pagination:** Collection docs limit20 default/max100,start0; no exhaustion pass. User page includes contributed NotGleam pack, so do not call every card owned.

**Follow:** No native follow established; site login and external project Discord are distinct. No auth token used.

Sources: RDMC31014, RDMC31015, RDMC31017, RDMC31018, RDMC31019, RDMC31020.

#### bedrock-explorer

Identity: {"itemId": "7cb1d924-4a39-452d-88bc-daa5f8843f54", "creatorSlug": "starfish-studios", "creatorRole": "Marketplace publisher indexed by service", "creatorUrl": "https://bedrockexplorer.com/@starfish-studios"}.

**Avatar:** No publisher avatar confirmed; Minecoins/Verified badges and product images are separate.

**Body:** Item description before promotion. Avoid generated evaluative prose/recommendations as author body.

**Media:** Ten product screenshots links22–31 on Xbox asset CDN. Later YouTube iframe32 is sponsored Mini Blocks, not Naturalist trailer.

**Files:** Get add-on outbound mcmarketplace.net discovery; no package/export/entitlement retrieval. Free items still Marketplace content.

**Pagination:** Publisher reports122 items with type counts; only initial surface inspected.

**Follow:** No native publisher follow or import established.

Sources: RDMC31022, RDMC31023.

#### stardust-labs

Identity: {"itemSlug": "incendium", "creatorRole": "Team roster: Starmute founder/worldgen; catter technical lead; Botany creative director; Whale structure artist"}.

**Avatar:** Four roster images25–28 are role-scoped candidate portraits; no independent user profile/UID joins.

**Body:** Feature sections and team roster separated; original download points Modrinth.

**Media:** Image references9–24 repeat twice. Preserve source layout while storing sixteen unique gallery asset references, not32 distinct screenshots.

**Files:** External Modrinth project discovery only; no release archive.

**Pagination:** No complete team/project history acceptance.

**Follow:** No native site follow established; Patreon/Discord require separate semantics.

Sources: RDMC31026.

### Broad independent discovery

| Candidate | Edition / role | Evidence boundary | Sources |
|---|---|---|---|
| [MCModels](https://mcmodels.net/) | Java server asset configurations; per-product verify / platform_or_host_scope | Actual paid product/vendor pair; product18015, vendor115. Body, hero and YouTube player observed; vendor banner expressly labeled, avatar not confirmed. Follow UI and six-page vendor history require permitted client verification. | RDMC31001, RDMC31002, RDMC31003, RDMC31005 |
| [Chunkfactory](https://chunkfactory.com/) | Mixed catalog; inspected Java Bukkit/Spigot plugin / platform_or_host_scope | Actual NitroPlots4854 and NitroPlugins37842 artist listing. Ordered GIF and PNG showcase; price gate; Overview/13 Updates/History distinct. Artist listing is not yet a personal profile/avatar. | RDMC31006, RDMC31007, RDMC31008 |
| [MinecraftStorage](https://minecraftstorage.com/) | Java inspected shader; verify each category / platform_or_host_scope | Solas review labels Jaker Publisher. Original project is separate Modrinth link. Download table links external CDN; Jaker page has inconsistent zero summary versus cards/subscribers and22-page controls. | RDMC31009, RDMC31010, RDMC31011, RDMC31012 |
| [Smithed](https://smithed.net/) | Java datapacks/resource packs / platform_or_host_scope | Actual Recipes Plus/GenMode pair; documented public v2 API distinguishes metadata owner/contributors, user pfp/banner, display content and version datapack/resourcepack URLs. Live API retrieval failed; schemas remain documented only. | RDMC31013, RDMC31014, RDMC31015, RDMC31016, RDMC31017, RDMC31018, RDMC31019, RDMC31020 |
| [Bedrock Explorer](https://bedrockexplorer.com/) | Bedrock Marketplace index / reference_or_tool_only | Actual Naturalist item/publisher pair with UUID7cb1d924-4a39-452d-88bc-daa5f8843f54. Ordered Xbox CDN screenshots; publisher slug and categories. Promotional video is for another product; entitlement/files unavailable. | RDMC31021, RDMC31022, RDMC31023 |
| [Stardust Labs](https://www.stardustlabs.net/) | Java datapacks/mods; other editions per release / platform_or_host_scope | Incendium project includes creator roster and role-scoped portrait nodes; Modrinth distribution link. Gallery repeats same sixteen references twice: retain carousel repetitions separately from unique assets. About route failed. | RDMC31026, RDMC31027 |
| [Serilum](https://serilum.com/) | Java mods / platform_or_host_scope | Creator home/biography and mod listing inspected; external CurseForge/Modrinth publication. Mod-list retrieval partial; no file manifest or creator avatar established. | RDMC31030, RDMC31031, RDMC31032 |
| [Modding Legacy](https://moddinglegacy.com/) | Java mod team candidate / platform_or_host_scope | Root403; no fields promoted from unrelated similarly named GitHub organization. | RDMC31033 |
| [ModFest](https://modfest.net/) | Java mod event community; event platform per event / reference_or_tool_only | Official About identifies ModFest/BlanketCon participant/volunteer/team roles and source-linked API/bot infrastructure; root partial. An open-source bot is not permission to collect Discord messages. | RDMC31034, RDMC31035 |
| [Mod Garden](https://modgarden.net/) | Minecraft mod event community / reference_or_tool_only | Official event/participant guide and Discord discovery. Site describes slash-command registration; no command or join performed. Event participation differs from creator follow. | RDMC31036 |
| [Modded Minecraft Wiki / Sinytra](https://moddedmc.wiki/en) | Java project documentation / reference_or_tool_only | moddedmc.org redirects to moddedmc.wiki/en. First-party docs hosting with versions, recipes, developer links and official Discord; project documentation is not a binary release manifest. | RDMC31037 |
| [bedrock.dev](https://bedrock.dev/) | Bedrock / reference_or_tool_only | Version/file selectors, packs, Bedrock Wiki and Discord links. Documentation reference, not user-uploaded addon collection; version-specific schema is required. | RDMC31038 |
| [Bedrock Wiki](https://wiki.bedrock.dev/) | Bedrock / reference_or_tool_only | Distinct linked community wiki rather than interchangeable official Microsoft documentation; contribution/page provenance and licensing need exact-page review. | RDMC31039 |
| [Team Abnormals](https://www.teamabnormals.com/) | Java explicitly / platform_or_host_scope | Original team site exposes mods, wiki and dated release blogs. Discord label present but extracted destination resolves home; invitation unresolved, not invented. | RDMC31040 |
| [Team CoFH](https://teamcofh.com/) | Java / platform_or_host_scope | Own version-grouped project directory links original CurseForge/Modrinth, source and changelog independently. Project icons are not avatars; official CoFH Discord linked. | RDMC31041, RDMC31059 |
| [MCPEDL.ORG](https://mcpedl.org/) | Bedrock / platform_or_host_scope | Distinct domain from MCPEDL.com; categories and item leads observed. Attribution, rehosting authorization and provenance unverified; not a replacement for MCPEDL.com shells. | RDMC31043 |
| [9Minecraft](https://www.9minecraft.net/) | Mixed Java/Bedrock categories / platform_or_host_scope | Broad first-party catalog navigation incl mods/datapacks/models/schematics and edition-specific subdomains. Article writer, original developer and mirror rights require per-item checks. | RDMC31044 |
| [MCMod.net](https://www.mcmod.net/) | Unverified / platform_or_host_scope | Root inaccessible through retrieval. Distinct from mcmod.cn; no supported extraction fields established. | RDMC31045 |
| [MCBuild](https://mcbuild.org/) | Mixed Java/Bedrock / platform_or_host_scope | Catalog provides schematic/litematic/map/mod categories and online installer. Conversion and world-upload tools are separate actions; title/extension alone does not prove edition compatibility or provenance. | RDMC31046 |
| [Fabric project community](https://fabricmc.net/) | Java mod loader/tooling / reference_or_tool_only | Official loader/docs/template and Discord links. Fabric API is a separate dependency and loader installer is not playable mod content. | RDMC31048, RDMC31058 |
| [NeoForged project community](https://neoforged.net/) | Java mod loader/tooling / reference_or_tool_only | Installer selection shell and dated developer blog with scoped author avatar labels; authors differ from NeoForged Team. Pagination1/3 observed; not complete blog history. | RDMC31049 |
| [Quilt project community](https://quiltmc.org/) | Java tooling candidate / reference_or_tool_only | Root redirect shell has zero readable lines; no Discord, profile or current loader/file details established. | RDMC31050 |
| [MineCrafteo](https://www.minecrafteo.com/) | Spanish portal; edition per item / platform_or_host_scope | Version-tagged mod/resource/shader/map article discovery and next-page link; author/avatar/original-file rights require actual article fixture. | RDMC31051 |
| [MinecraftSkins.net / observed MinecraftMods redirect](https://www.minecraftskins.net/) | Skin assets; edition dimensions require verification / platform_or_host_scope | minecraftmods.com redirected to skin catalog with Designed by credits and25-page navigation. Do not publish obsolete mod-host identity; skin download is not an author avatar. | RDMC31052 |
| [Sildur official hub](https://sildurs-shaders.github.io/) | Java shaders/resource shaders / platform_or_host_scope | Hub explicitly identifies itself as official and shows Sildur image, download/changelog/gallery/social links. Separate candidate domain failed and is not accepted as an alias. | RDMC31054, RDMC31060 |
| [Minecraft Mod Development / ModDev.Zone](https://mc.moddev.zone/) | Java mod team/documentation community / reference_or_tool_only | Official member roster gives managers/developers and named GitHub-backed images, distinct from brand logo. Own mod docs, CurseForge and friendly ModDevCafe linked; invitation shells/errors retained. | RDMC31055, RDMC31056, RDMC31057 |

### Existing-service improvements

- **curseforge**: Add distinct Minecraft Bedrock discovery scope under existing canonical service, not another service count. Bedrock route exposes addon,texture,map categories and member bylines; do not feed a Java-only category/extension mapping into this scope. Exact API game/category IDs still pending. (RDMC31061).
- **mcpedl**: Fresh root returns Nothing here yet in three feeds and author route remains undefined shell. Actual Raiyon item403 overrides rich search snippet: no completed body/author/file acceptance. Different .org domain is not fallback identity. (RDMC31062, RDMC31063, RDMC31064).
- **modrinth**: Stellarity page states team/support migration from kohara basement to Prismatic Shards. Retain temporal project attribution and current official Discord per release; old creator social links do not establish current ownership. Datapack sometimes packaged as mod: keep distribution kind separate. (RDMC31065).
- **hanmafo**: Current navigation explicitly separates Java mod/datapack/model and Bedrock behavior/resource/server plugin categories. Preserve edition and server platform axes rather than one mod tag. (RDMC31066).
- **mcreator**: Current community separates playable mods, tool plugins, forums and Explore Users; content RP tags and FG labels are not interchangeable. Retrieve actual project type before file classification. (RDMC31067).
- **planet-minecraft**: Current root includes Groups, Wall Posts, Blogs, Jams and Discord alongside projects. Treat social post/group namespace as separate scope; do not synthesize downloadable files for all PMC content. (RDMC31068).
- **minecraft-forum**: Root current dated Java/Bedrock announcements have editorial byline separate from game developer. Thread-level profile/post pagination remains prior gate; homepage currentness does not certify attachment access. (RDMC31069).
- **discord**: Record official-origin invite provenance and shell/error independently. ModDev.Zone redirects fbkYYXjaTj with error; Fabric v6v4pMv,CoFH uRKrnbH,ModDevCafe T5MGNBB and MCModels invite shell read. None proves membership,channel visibility,post-history access or follow import. (RDMC31005, RDMC31056, RDMC31057, RDMC31058, RDMC31059, RDMC31060).

### Protocol and extraction upgrades

- **Smithed documented metadata and pack merge boundaries**: GET pack data,meta and user by documented identity; preserve docId/rawId,owner/contributors and userUID. Version downloads carry datapack/resourcepack separately. GET /download can merge packs and may skip unsupported ones; generated zip is not original-file byte parity. Docs latest-version section labels DELETE while example uses fetch default GET: resolve contract before use; never issue DELETE to read. Collection limit/start and count supply planned completeness checks. (RDMC31017, RDMC31018).
- **Marketplace sponsored-media scope**: Assign gallery to item by section boundaries; promote/provider iframe may advertise another item. Name/UUID matching and bounded extraction prevent downloading wrong product video. (RDMC31023).
- **Mixed author/publisher roles and carousel repetitions**: Store uploader/editor,original developer,team contributor separately. Asset URL identity and placement occurrence separate repeated carousel images from distinct screenshots. Display-count mismatch remains visible. (RDMC31010, RDMC31011, RDMC31026).

### Acceptance queue

- Permitted raw HTML/client fixtures for MCModels vendor image role,pagination and follow auth; no internal API guesses.
- Smithed actual public pack/meta/user receipts and UID joins; complete README and gallery decoding; original-versus-merged file checks; API docs inconsistency verification.
- Chunkfactory artist-to-member profile join and image-role validation; original GIF multi-frame decode; updates/history traversal; entitled file only after authorized access.
- MinecraftStorage creator identity and actual external CDN manifest/hash provenance; profile count mismatch and pagination.
- Bedrock Explorer UUID original publisher/Marketplace join; separate ads; no inference of exportable mcaddon.
- No binary,animated-media decode,video playback,native follow/import,purchase,message or Discord join acceptance in this pass.

### Source register and retained retrieval results

All source dates below are2026-10-31 retrieval checks. Search leads are deliberately labeled and are not equivalent to opened primary evidence. Failed requests are operation-specific retrieval outcomes; their cause is not inferred. No CSS selectors, internal API contracts, native follow behavior or purchase entitlements were invented.

| ID | Primary page / attempted URL | Status |
|---|---|---|
| RDMC31001 | [MCModels marketplace](https://mcmodels.net/) | read |
| RDMC31002 | [Frozen Weapon Assortment](https://mcmodels.net/products/18015/frozen-weapon-assortment) | read |
| RDMC31003 | [ModelBlox vendor](https://mcmodels.net/vendors/115/modelblox) | read |
| RDMC31004 | [MCModels first-party About](https://mcmodels.net/information/about) | search_lead_only |
| RDMC31005 | [MCModels official linked Discord](https://discord.gg/mcmodels) | js_shell |
| RDMC31006 | [Chunkfactory marketplace](https://chunkfactory.com/) | read |
| RDMC31007 | [NitroPlots premium project](https://chunkfactory.com/product/plot-addon-nitroplots-pick-complete-plot-utils-high-voltage-addon-for-plotify-plotsquared-sparkles-premium-version.4854/) | read |
| RDMC31008 | [NitroPlugins artist listing](https://chunkfactory.com/artists/nitroplugins.37842/) | read |
| RDMC31009 | [MinecraftStorage](https://minecraftstorage.com/) | read |
| RDMC31010 | [Solas shader review](https://minecraftstorage.com/shaders/solas) | read |
| RDMC31011 | [Jaker publisher profile](https://minecraftstorage.com/users/jaker) | read |
| RDMC31012 | [Solas download manifest page](https://minecraftstorage.com/shaders/solas/download) | read |
| RDMC31013 | [Smithed](https://smithed.net/) | read |
| RDMC31014 | [Recipes Plus pack](https://smithed.net/packs/recipes_plus) | read |
| RDMC31015 | [GenMode profile](https://smithed.net/genmode) | read |
| RDMC31016 | [Smithed documentation](https://docs.smithed.dev/) | read |
| RDMC31017 | [Smithed public routes](https://docs.smithed.dev/api/routes/) | read |
| RDMC31018 | [Smithed public data types](https://docs.smithed.dev/api/data-types/) | read |
| RDMC31019 | [Actual pack API request](https://api.smithed.dev/v2/packs/recipes_plus) | tool_inaccessible |
| RDMC31020 | [Actual user API request](https://api.smithed.dev/v2/users/genmode) | tool_inaccessible |
| RDMC31021 | [Bedrock Explorer](https://bedrockexplorer.com/) | read |
| RDMC31022 | [Starfish publisher listing](https://bedrockexplorer.com/@starfish-studios) | read |
| RDMC31023 | [Naturalist Bedrock listing](https://bedrockexplorer.com/@starfish-studios/naturalist-add-on-26-1) | read |
| RDMC31024 | [Stardust Labs home](https://www.stardustlabs.net/) | search_lead_only |
| RDMC31025 | [Stardust downloads](https://www.stardustlabs.net/downloads) | search_lead_only |
| RDMC31026 | [Incendium team project](https://www.stardustlabs.net/incendium) | read |
| RDMC31027 | [Guessed Stardust about route](https://www.stardustlabs.net/about) | tool_inaccessible |
| RDMC31028 | [Stardust official organization](https://github.com/Stardust-Labs-MC) | search_lead_only |
| RDMC31029 | [Stardust Discord server public page](https://discord.com/servers/stardust-labs-738046951236567162) | search_lead_only |
| RDMC31030 | [Serilum home](https://serilum.com/) | read |
| RDMC31031 | [Serilum mod listing](https://serilum.com/mods/) | read_partial |
| RDMC31032 | [Serilum creator biography](https://serilum.com/about/) | read |
| RDMC31033 | [Modding Legacy](https://moddinglegacy.com/) | http_403 |
| RDMC31034 | [ModFest home](https://modfest.net/) | read_partial |
| RDMC31035 | [ModFest About](https://modfest.net/pages/about) | read |
| RDMC31036 | [Mod Garden event community](https://modgarden.net/) | read |
| RDMC31037 | [Modded Minecraft Wiki former route](https://moddedmc.org/) | redirect_read |
| RDMC31038 | [bedrock.dev docs](https://bedrock.dev/) | read |
| RDMC31039 | [Bedrock Wiki](https://wiki.bedrock.dev/) | read |
| RDMC31040 | [Team Abnormals](https://www.teamabnormals.com/) | read |
| RDMC31041 | [Team CoFH downloads](https://teamcofh.com/downloads/) | read |
| RDMC31042 | [Team CoFH roles](https://teamcofh.com/about/index.html) | search_lead_only |
| RDMC31043 | [MCPEDL.ORG distinct portal](https://mcpedl.org/) | read |
| RDMC31044 | [9Minecraft](https://www.9minecraft.net/) | read |
| RDMC31045 | [MCMod.net candidate](https://www.mcmod.net/) | tool_inaccessible |
| RDMC31046 | [MCBuild mixed-edition catalog](https://mcbuild.org/) | read |
| RDMC31047 | [Incorrect head-site candidate route](https://minecraftheads.com/) | tool_inaccessible |
| RDMC31048 | [Fabric project](https://fabricmc.net/) | read |
| RDMC31049 | [NeoForged project](https://neoforged.net/) | read |
| RDMC31050 | [Quilt project](https://quiltmc.org/) | empty_redirect_shell |
| RDMC31051 | [MineCrafteo Spanish portal](https://www.minecrafteo.com/) | read |
| RDMC31052 | [MinecraftMods redirect observation](https://www.minecraftmods.com/) | redirect_read |
| RDMC31053 | [Unverified Sildur domain candidate](https://www.sildurs-shaders.com/) | tool_inaccessible |
| RDMC31054 | [Sildur official creator hub](https://sildurs-shaders.github.io/) | read |
| RDMC31055 | [Minecraft Mod Development community](https://mc.moddev.zone/) | read |
| RDMC31056 | [MMD official Discord redirect](https://discord.moddev.zone/) | redirect_error |
| RDMC31057 | [ModDevCafe officially linked friend community](https://discord.gg/T5MGNBB) | js_shell |
| RDMC31058 | [Fabric official Discord](https://discord.gg/v6v4pMv) | js_shell |
| RDMC31059 | [CoFH official Discord](https://discord.gg/uRKrnbH) | js_shell |
| RDMC31060 | [Sildur official Discord](https://discord.gg/mg3w2tSEsb) | redirect_error |
| RDMC31061 | [CurseForge Bedrock scope](https://www.curseforge.com/minecraft-bedrock) | read |
| RDMC31062 | [MCPEDL current root shell](https://mcpedl.com/) | read_partial |
| RDMC31063 | [MCPEDL unresolved author shell](https://mcpedl.com/user/r4isen1920/) | read_partial |
| RDMC31064 | [Raiyon actual item request](https://mcpedl.com/raiyons-java-combat-addon/) | http_403 |
| RDMC31065 | [Stellarity current team migration](https://modrinth.com/datapack/stellarity) | read |
| RDMC31066 | [Hanmafo current edition categories](https://www.koreaminecraft.net/) | read |
| RDMC31067 | [MCreator current community discovery](https://mcreator.net/community) | read |
| RDMC31068 | [PMC current community scopes](https://www.planetminecraft.com/) | read |
| RDMC31069 | [Minecraft Forum current root](https://www.minecraftforum.net/) | read |

Source IDs RDMC31001–RDMC31069 are reserved for this pass. Unverified domain guesses are excluded from canonical candidate counts. Catalog and shared game guides were not edited.
