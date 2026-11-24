# Cyberpunk 2077: creator ecosystem and public extraction evidence

Checked **2026-10-28 UTC**. This pass covers **29 distinct scopes** and **11 opened primary item/profile pairs**. It extends discovery; it does not establish implemented adapters, authenticated access, full-gallery completeness, downloadable archive integrity, video playback or follow writes. Existing stronger evidence remains in the original catalog and workbenches.

## Decisions and useful discovery paths

Use Nexus as the primary item/author/file graph, and original creator announcements to find work beyond its trending feed. The strongest less-visible routes in this pass are the [community guide directory](https://wiki.redmodding.org/cyberpunk-2077-modding/modding-guides/community-guides) (CPX005), original Tumblr announcements, creator Ko-fi/Patreon pages, Word in Progress and cyberpunk.codes. The directory exposes Kala PSD/blend resources, Roelani archives, Wingdeer MEGA collections, PinkyDude Drive resources and Vesna/86maylin tutorials; each downstream destination needs its own current retrieval and rights check. A directory credit is a discovery lead, not proof that an old download still works.

[CDPR support](https://www.cyberpunk.net/en/modding-support) (CPX001) currently documents both Nexus and mod.io distribution handoffs. REDmod, NativeDB, REDmodding wiki and tool documentation are reference/tool scopes. GitHub releases are actual tool/framework distribution scopes; none implies that it hosts every clothing, quest or photo-mode asset. The RED4ext release establishes a patch2.5 minimum for that release; it does not authorize upgrading an existing pinned game.

The original 162-entry catalog warned that Cybermods could not be safely aliased to another service. This pass preserves that warning: exact legacy wiki links timed out/502, and no first-party redirect was observed. ModGames search results about Cyberpunk equipment in Fallout 4 must remain Fallout-scoped. TESall CET pages preserve historical install text; a newer version heading does not update every paragraph.

## Scope map

| Scope | Role and observed result | Evidence |
|---|---|---|
| [Nexus Mods: Cyberpunk items and author profiles](https://www.nexusmods.com/cyberpunk2077/mods/107) | High-priority original distribution scope; preserve mod author, uploader, gallery uploader and dependency roles. File list and one image/one avatar retrieved; bytes and follow untested. Retrieval: `retrieved_public_text; retrieved_image_rendered`. | CPX007, CPX008, CPX009, CPX010, CPX011, CPX012 |
| [CDPR REDmod official support](https://www.cyberpunk.net/en/modding-support) | Official tool/reference downloads and distribution handoffs. Never count it as an independent creator platform. Retrieval: `retrieved_public_text`. | CPX001 |
| [CDPR public Cyberpunk forums](https://forums.cdprojektred.com/index.php?forums/cyberpunk.21/) | Public creator/support threads worth discovery. Query normalization returned listing rather than chosen thread; exact thread extraction still blocked. Retrieval: `retrieved_listing_route_ambiguity; retrieved_public_text`. | CPX002, CPX003 |
| [RED Modding community hub](https://redmodding.org/) | Best verified starting hub for original project links, community contacts and author-tool graph. Retrieval: `retrieved_public_text`. | CPX004 |
| [REDmodding community guide directory](https://wiki.redmodding.org/cyberpunk-2077-modding/modding-guides/community-guides) | Useful less-visible creator links: Kala free PSD/blend resources, Roelani personal archive, Wingdeer MEGA, PinkyDude Drive, Vesna tutorials; directories can be old. Retrieval: `retrieved_public_text`. | CPX005 |
| [REDmodding Discord community](https://discord.com/invite/redmodding) | Public invite verified; channels/announcements/private attachments not read. Retain public originating announcement URLs and author verification chain; joining and authentication require a separate authorized browser session. Retrieval: `javascript_shell; retrieved_public_text`. | CPX006, CPX004 |
| [psiberx framework and Equipment-EX hub](https://github.com/psiberx/cp2077-archive-xl/releases/tag/v1.28.1) | Upstream framework distribution and creator discovery, not universal asset host. ArchiveXL/TweakXL/Codeware/Equipment-EX cross-links. Retrieval: `retrieved_body_assets_loading_error; retrieved_public_text; retrieved_image_rendered`. | CPX013, CPX014, CPX015 |
| [redscript upstream releases](https://github.com/jac3km4/redscript/releases/tag/v0.5.32) | Repository owner, bot release publisher and human contributors distinct. Asset count not downloaded files. Retrieval: `retrieved_body_assets_loading_error; retrieved_public_text`. | CPX016, CPX017 |
| [RED4ext upstream releases](https://github.com/wopss/RED4ext/releases/tag/v1.31.0) | Original runtime/framework release. Public body and names/hashes observed; no local archive/hash check. Retrieval: `retrieved_body_assets_loading_error; retrieved_public_text`. | CPX018, CPX019 |
| [WolvenKit tool and resource ecosystem](https://github.com/WolvenKit/WolvenKit/releases/tag/10.0.0-beta.1) | Separate stable/prerelease; organization owns code, automated account publishes. Blender/Substance resource repositories are useful discovery. Retrieval: `retrieved_body_assets_loading_error; retrieved_public_text`. | CPX020, CPX021 |
| [Cyber Engine Tweaks upstream](https://github.com/maximegmd/CyberEngineTweaks) | Canonical repository from original community hub; link Nexus release and docs without equating all identity roles. Retrieval: `retrieved_public_text`. | CPX022, CPX004 |
| [NativeDB class reference](https://nativedb.red4ext.com/) | Reference-only JS application; do not count as mod-download or creator-post host. Retrieval: `javascript_shell`. | CPX023 |
| [ModDB Cyberpunk project pages](https://www.moddb.com/mods/disappearance-of-8ug8ear) | QuestRunners original company/project chain available. Preserve project Follow separately from company membership. Retrieval: `retrieved_public_text`. | CPX024, CPX025, CPX026 |
| [CurseForge Cyberpunk projects](https://www.curseforge.com/cyberpunk-2077/mods/character-preset-manager) | Smaller alternative original-distribution scope. Dnydd profile explicitly explains dklyntly alias; preserve file uploader identity. Retrieval: `retrieved_public_text; retrieved_image_rendered`. | CPX027, CPX028, CPX029, CPX030 |
| [Lokiina Tumblr original mod announcements](https://lokiina.tumblr.com/post/755584944094478336/hair-for-masc-v) | Original post -> Nexus file-host handoff proved. Reblog-chain accounts and preview image must not overwrite creator identity; image request403 retained. Retrieval: `retrieved_public_text; http_403`. | CPX031, CPX032, CPX033, CPX034 |
| [Katsigian independent creator Ko-fi](https://ko-fi.com/katsigian) | Original clothing/customization creator profile and avatar. No public full post retrieved; commissions closed on observed profile. Retrieval: `retrieved_public_text; retrieved_image_rendered`. | CPX035, CPX036 |
| [Peachu Ko-fi creator scope](https://ko-fi.com/peachu3d) | Original Cyberpunk custom-content profile; do not infer platform-to-platform identity from matching names alone. Retrieval: `retrieved_public_text`. | CPX037 |
| [Antrakt92 Ko-fi creator updates](https://ko-fi.com/antrakt92) | Profile links original project sites. Smart Vendor and Nearby Auto Loot indexed excerpts useful discovery; opened feed unpopulated. Retrieval: `retrieved_profile_feed_shell`. | CPX038 |
| [Kala Patreon mod resources](https://www.patreon.com/kalahira) | Wiki labels linked resources free; access must be verified per post, not assumed from membership page. Specific post robots denied. Retrieval: `retrieved_public_text; robots_denied`. | CPX039, CPX040, CPX005 |
| [Peachu Patreon public release chain](https://www.patreon.com/cw/comfypeach) | Public release announcement body and image retrieved; links Nexus mod and atelier. Membership content/files not read. Retrieval: `retrieved_public_text; retrieved_image_rendered`. | CPX041, CPX042, CPX043 |
| [Word in Progress personal mod archive](https://wordinprogress.com/section/mods) | Useful creator-attributed personal mirror; historical 2021 assets, named external credited photography. Author profile challenged and ZIP unsupported. Retrieval: `retrieved_public_text; challenge_page; unsupported_content_type_zip`. | CPX044, CPX045, CPX046, CPX047 |
| [cyberpunk.codes original quest hub](https://cyberpunk.codes/) | Original quest/project details and source graph. A video-looking thumbnail is JPEG; no playback proof. Retrieval: `retrieved_public_text; retrieved_image_rendered`. | CPX048, CPX049, CPX050, CPX051 |
| [3DM Cyberpunk translations and uploads](https://mod.3dmgame.com/mod/227678) | Regional original/translated/reposted roles must be separated. Empty opened document; indexed original author is only a lead. Retrieval: `empty_document`. | CPX052 |
| [PlayGround Cyberpunk regional releases](https://www.playground.ru/cyberpunk_2077/file/cyberpunk_2077_sborka_nova_city_2_0_mini_v_6_v_2_31a-1766831) | Regional curated packs and translations; follow original Nexus source and record uploader versus stated author. Long body includes spoiler/hidden regions. Retrieval: `retrieved_public_text`. | CPX053, CPX054 |
| [TESall Cyberpunk translation archive](https://tesall.club/files/file/11582-cyber-engine-tweaks/) | Strong explicit original-author/translator separation. Historical compatibility text and login download gate preserved; no file bytes. Retrieval: `retrieved_public_text; retrieved_image_rendered`. | CPX055, CPX056, CPX057 |
| [ModGames Cyberpunk discussion scope](https://modgames.net/forum/259-43304-1) | Verified game discussion; current CP download ecosystem not established. Fallout mods using Cyberpunk assets are a different game scope. Retrieval: `retrieved_public_text`. | CPX058 |
| [Cybermods legacy reference scope](https://wiki.cybermods.net/cyber-engine-tweaks/console/how-do-i) | Historical reference, currently unavailable; no redirect verification, no invented API. Preserve existing catalog warning. Retrieval: `timeout; retrieved_public_text`. | CPX059, CPX055 |
| [2077MODS independent catalog and hosting claims](https://www.2077mods.com/mods/cyber-engine-tweaks) | Promising metadata/API candidate but provenance/permission claims require item-specific verification. API docs do not establish runtime extraction. Retrieval: `retrieved_public_text; tool_inaccessible`. | CPX060, CPX061, CPX062 |
| [YouTube original tutorial and showcase discovery](https://wiki.redmodding.org/cyberpunk-2077-modding/modding-guides/community-guides) | 86maylin/Vesna/CDPR tutorial links from original community directory. One video page footer-only; media streams/playback and channel profile unproven. Retrieval: `retrieved_public_text; footer_only`. | CPX005, CPX063 |

## Item and profile extraction records

Paths below refer to observed semantic headings, labels and followed links from the retrieval snapshots. They are not fabricated CSS selectors or untested API response fields. Both primary pages were opened for all 11 pairs; this means accessible identity/body evidence, not a complete runnable adapter.

### CPPAIR01: CET -> yamashi

[Item](https://www.nexusmods.com/cyberpunk2077/mods/107) → [profile](https://www.nexusmods.com/profile/yamashi). Sources: CPX007, CPX008, CPX011, CPX010, CPX012, CPX009.

- **Author/profile/avatar:** Item heading/file information -> Created by string and Uploaded by link; legacy users/3386513 redirects /profile/yamashi. Profile image resolved to avatars.nexusmods.com/3386513/100; opened/rendered.
- **Body:** Description section and historical changelogs readable; full tab/expanded-content completeness not runtime tested.
- **Media:** Images tab has five author-image links; one screenshot opened/rendered. Gallery uploaders include ArsenicTouch and yamashi. Videos count0 applies only to this item.
- **Files:** Files tab main row CET1.38.1 game2.5, 33.3MB and old rows readable; bytes untested.
- **Follow:** Profile Track label observed. Logged-in tracking state/read and write untested.

### CPPAIR02: ArchiveXL release -> psiberx

[Item](https://github.com/psiberx/cp2077-archive-xl/releases/tag/v1.28.1) → [profile](https://github.com/psiberx). Sources: CPX013, CPX014, CPX015.

- **Author/profile/avatar:** Release heading and released-by anchor -> psiberx; profile heading and avatar link agree. Avatar opened/rendered.
- **Body:** Three visible change bullets; no ellipsis detected in this short release.
- **Media:** Public avatar rendered; no release screenshot/video in observed body.
- **Files:** Assets4 count; lazy region error, no resolved filenames/bytes.
- **Follow:** Profile Follow link points to login. No relationship read/write.

### CPPAIR03: redscript -> jac3km4 project owner

[Item](https://github.com/jac3km4/redscript/releases/tag/v0.5.32) → [profile](https://github.com/jac3km4). Sources: CPX016, CPX017.

- **Author/profile/avatar:** Repository breadcrumb -> owner jac3km4; publisher github-actions and contributor alphanin9 retained as separate roles. Owner profile avatar link visible, not opened.
- **Body:** Release change, contributor and changelog links readable.
- **Media:** Avatar link only; no animation/video validation.
- **Files:** Assets6 region loading error; none fetched.
- **Follow:** Owner profile Follow login link observed; no relationship state.

### CPPAIR04: RED4ext -> wopss

[Item](https://github.com/wopss/RED4ext/releases/tag/v1.31.0) → [profile](https://github.com/wopss). Sources: CPX018, CPX019.

- **Author/profile/avatar:** Repository owner/releaser wopss -> profile name Octavian Dima and avatar link.
- **Body:** Added/Changed sections and filename/SHA table visible.
- **Media:** Avatar URL exposed, not opened.
- **Files:** Body lists red4ext-1.31.0.zip and symbols ZIP with hashes; assets4 failed, hashes unverified locally.
- **Follow:** Follow login link observed, neither read nor write tested.

### CPPAIR05: WolvenKit prerelease -> organization

[Item](https://github.com/WolvenKit/WolvenKit/releases/tag/10.0.0-beta.1) → [profile](https://github.com/WolvenKit). Sources: CPX020, CPX021.

- **Author/profile/avatar:** Breadcrumb owner WolvenKit -> RED Modding tools organization/avatar. github-actions publisher; named contributors preserved.
- **Body:** Prerelease body, prerequisites, contributors readable. Stable9.1.0 was a separate index entry.
- **Media:** Organization avatar linked, not decoded; no release video.
- **Files:** Assets7 failed loading; no bytes.
- **Follow:** Organization membership/individual follow must not be conflated; untested.

### CPPAIR06: Hair for Masc V -> Lokiina

[Item](https://lokiina.tumblr.com/post/755584944094478336/hair-for-masc-v) → [profile](https://lokiina.tumblr.com/). Sources: CPX031, CPX032, CPX033, CPX034.

- **Author/profile/avatar:** Permalink original author blog and home link identify Lokiina. Public blog avatar not confidently isolated. Notes contain likers/rebloggers, excluded from author identity.
- **Body:** Title and all short visible paragraphs/tags/date read from post; no hidden/full-blog coverage claimed.
- **Media:** Two actual media.tumblr URLs observed. First fetched403; no decode. URL rendition is s500x750; larger URL not invented.
- **Files:** Original announcement links Nexus15692; no attachment bytes.
- **Follow:** Custom-theme follow state absent. Account API/browser needed; untested.

### CPPAIR07: 8ug8ear -> QuestRunners company

[Item](https://www.moddb.com/mods/disappearance-of-8ug8ear) → [profile](https://www.moddb.com/company/questrunners). Sources: CPX024, CPX025, CPX026.

- **Author/profile/avatar:** Project Developer link -> /company/questrunners; identity type organization. Company thumbnail not assumed to be individual avatar.
- **Body:** Project summary and install/prerequisite paragraphs read.
- **Media:** Images/videos tabs present, media completeness/playback untested.
- **Files:** One downloads entry and advertised size read; no archive request completed.
- **Follow:** Project Follow and company Follow/Join distinct controls; no state mutation.

### CPPAIR08: Character Preset Manager -> Dnydd

[Item](https://www.curseforge.com/cyberpunk-2077/mods/character-preset-manager) → [profile](https://www.curseforge.com/members/dnydd/projects). Sources: CPX027, CPX028, CPX029, CPX030.

- **Author/profile/avatar:** Project By link -> /members/dnydd/projects; profile describes former dklyntly. Avatar link opened/rendered. File uploader DKLYNTLY retained.
- **Body:** Long description sections visible, guide version4.0.1 versus main-file3.1.1 preserved; total completeness not accepted.
- **Media:** Profile PNG rendered. Gallery not enumerated end to end.
- **Files:** Project1689093; file8846950 ZIP filename/size and uploader read; bytes untested.
- **Follow:** 22 followers shown on retrieved profile. Caller following state and write untested.

### CPPAIR09: Public Peachu Patreon announcement -> creator

[Item](https://www.patreon.com/comfypeach/posts/new-release-171202048) → [profile](https://www.patreon.com/cw/comfypeach). Sources: CPX042, CPX041, CPX043.

- **Author/profile/avatar:** Post creator picture/byline links Peachu creator; creator page links Nexus PeachuHime. Do not infer identity of Ko-fi solely from name.
- **Body:** Short public announcement body consists of Nexus34562 link and atelier27589 update link; surrounding loading regions retained as incomplete page state.
- **Media:** Post image link18 opened/rendered. Signed query not durable asset identity; creator profile image link distinct.
- **Files:** Nexus destinations; no Patreon file attachment observed, no paid bytes.
- **Follow:** Join controls visible; free-follow state/read and membership purchase untested.

### CPPAIR10: Nova City -> LOMU uploader

[Item](https://www.playground.ru/cyberpunk_2077/file/cyberpunk_2077_sborka_nova_city_2_0_mini_v_6_v_2_31a-1766831) → [profile](https://users.playground.ru/5077783/). Sources: CPX053, CPX054.

- **Author/profile/avatar:** Post uploader link -> users.playground.ru/5077783; body separately says original author juliolomu. Profile confirms LOMU posts, not original-author equivalence. Avatar unresolved.
- **Body:** Long description, requirements and source link visible; spoiler/hidden regions require browser expansion before completeness.
- **Media:** Page image links present; no first-party pack media decoded in this pass.
- **Files:** No successful attachment byte retrieval.
- **Follow:** Profile subscriber count/Subscribe button visible; current caller state and write untested.

### CPPAIR11: TESall CET -> gkalian translator

[Item](https://tesall.club/files/file/11582-cyber-engine-tweaks/) → [profile](https://tesall.club/profile/95-gkalian/). Sources: CPX055, CPX056, CPX057.

- **Author/profile/avatar:** Local author line links /profile/95-gkalian; information fields explicitly credit original author yamashi, translator gkalian. Profile image link not confused with CET screenshot.
- **Body:** Information body/tables readable; historical1.04-1.06 instructions coexist with header1.35.1.
- **Media:** Five gallery entries; one thumbnail rendered. Not original-resolution/full-gallery validation.
- **Files:** Public page explicitly requires account to download; bytes not attempted.
- **Follow:** File follower count0/profile followers55 exposed; logged-in follows and write untested.

## Additional partial and blocked chains

- Word in Progress: [Indy post](https://wordinprogress.com/2021/10/mods/indys-bloody-v) exposes the article author and two download rows; [author archive](https://wordinprogress.com/author/indy) returns a challenge. The actual fem ZIP link returned unsupported `application/zip`, and the post image fetch errored. This is a listed file and attempted media fetch, not a downloaded archive (CPX045, CPX046, CPX047).
- Kala: [creator](https://www.patreon.com/kalahira) is readable, but the [specific resource/terms post](https://www.patreon.com/posts/mod-tou-80670201) is robots-denied. No paid or free attachment claims follow from its wiki label (CPX039, CPX040).
- Ko-fi: original Katsigian, Peachu and Antrakt92 profiles and visible Follow labels are readable; Katsigian avatar was opened/rendered. Feed templates and search excerpts do not prove full posts. Generic logout/billing controls are application templates, not a signed-in session (CPX035, CPX036, CPX037, CPX038).
- 3DM: [item227678](https://mod.3dmgame.com/mod/227678) opened as a zero-line document. Search credited Roms1383, but uploader/profile/avatar and full body remain unverified (CPX052).
- CDPR forum: the homepage is readable; selecting MODS or a thread produced merged query parameters and the same listing. Record route ambiguity instead of pretending a thread was parsed. mod.io, NativeDB and the REDmodding Discord invite returned JS shells (CPX002, CPX064, CPX023, CPX006).
- 2077MODS: public item and API documentation read; actual API endpoint inaccessible. `slug`, `name`, `versions`, `compatibility`, `download_url`, `manifest_version`, `hosting` and hashes are documented schema, not captured JSON response fields. Public page ownership/permission statements require corroboration. Preserve the observed GitHub-labelled link whose destination is Nexus (CPX060, CPX061, CPX062).
- Video: [YouTube tutorial](https://www.youtube.com/watch?v=5gR3rsL-sCs) yielded footer-only content. cyberpunk.codes video-looking thumbnail yielded a JPEG; no MP4, HLS, DASH or playback was established. No GIF animation was tested (CPX063, CPX051).

## Extraction contract and remaining acceptance gates

Store provider IDs separately from names and URLs. For each source retain canonical item identity, original author, local uploader, translator, image uploader, organization owner, automated release publisher and credited contributors as separate roles. Keep announcement-to-download and dependency links instead of flattening every page into a mod. Do not attach an image author’s avatar to the mod author or use a cover image as a missing avatar.

Full content requires collecting all ordered body blocks, expanded spoilers, pagination, attachment variants and media arrays. Public rendered paragraphs can establish a candidate extraction path, while loading regions, route mistakes and entitlement walls remain explicit failures. Image URL retrieval, tool rendering, independent byte decode and application rendering need separate states; animation and video require duration/frame/audio/playback evidence. A successful avatar must not mask a failed post image.

File rows need filename, version, provider file ID, uploader, bytes, checksum, dependency/game-patch applicability and actual download evidence. A published SHA is a claim until compared with downloaded bytes. Follow labels/counts establish discoverability; reading the caller’s subscriptions needs an authorized session, and writing follow/subscribe is a separate side effect. A local-follow implementation can be planned without claiming native follow synchronization.

The next acceptance fixture should deliberately include original announcements linking another host, one multi-image gallery, a GIF, a playable video, a stale mirror, a translator/uploader split, a bot release publisher and a login-only download. Compare normalized complete outputs with the actual target baseline before cross-project adoption. No GameSync change or authenticated acceptance was made.

## Observed login routes and remaining account tests

The exact observed Nexus login target is `https://users.nexusmods.com/auth/sign_in?redirect_url=https://www.nexusmods.com/cyberpunk2077/mods/107`. CDPR forum login was followed to its account OIDC page (CPX003); TESall exposes `https://tesall.club/login/`. Other unvisited account-entry leads: `https://www.patreon.com/login`, `https://ko-fi.com/account/login`, `https://www.tumblr.com/login`, `https://discord.com/login`. These URLs do not establish login, consent, entitlement or session access.

## Source register

The [sanitized game manifest](../../../experiments/site-adapter-discovery/game-research-2026-10-28.json) contains source records CPX001–CPX064 with dated retrievalStatus and the eleven structured pair records. Sources below are original/public pages or their actual linked media; no search-only claim is promoted to working support.

- **CPX001** [CDPR modding support](https://www.cyberpunk.net/en/modding-support) — `retrieved_public_text`; observed Public page on check date. Official mod distribution links include Nexus and mod.io; REDmod is a tool. Manual downloads and tutorials listed. Not a creator-post platform.
- **CPX002** [CDPR Cyberpunk forum](https://forums.cdprojektred.com/index.php?forums/cyberpunk.21/) — `retrieved_listing_route_ambiguity`; observed Public forum listing. Public listing exposed MODS and account-login links. Thread/category clicks returned the same listing with merged query parameters; thread extraction not established.
- **CPX003** [CDPR forum account sign in](https://accounts.cdprojektred.com) — `retrieved_public_text`; observed Sign-in page. Login target obtained by following official forum Log in. No credentials or authentication attempted.
- **CPX004** [RED Modding community](https://redmodding.org/) — `retrieved_public_text`; observed Page reports updated 2026-10-27. Public first-party hub links GitHub, Discord, Patreon, wiki, CET and Blender tools; community rather than universal download host.
- **CPX005** [REDmodding community guides](https://wiki.redmodding.org/cyberpunk-2077-modding/modding-guides/community-guides) — `retrieved_public_text`; observed Last documented edit 2025-10-23. Readable Markdown includes original creator/resource links, including Kala, Roelani, Wingdeer, PinkyDude, 86maylin and Vesna. Warns guides can be outdated.
- **CPX006** [REDmodding Discord invite](https://discord.com/invite/redmodding) — `javascript_shell`; observed Public invite redirect. Official community hub links invite; retrieved application required JavaScript. No channels, message history or profile extracted.
- **CPX007** [CET Nexus item](https://www.nexusmods.com/cyberpunk2077/mods/107) — `retrieved_public_text`; observed 1.38.1, updated 2026-10-26. Title, Created by and Uploaded by yamashi, description, permissions and tab counts readable; description still says supported game 2.31, while file row says 2.5. Preserve both.
- **CPX008** [yamashi Nexus profile](https://www.nexusmods.com/profile/yamashi) — `retrieved_public_text`; observed Public profile; legacy numeric ID 3386513. Legacy uploader link redirects to named profile; avatar, verified-author label and Track control observed. Empty mod counts are dynamic placeholders, not zero records.
- **CPX009** [CET Nexus files](https://www.nexusmods.com/cyberpunk2077/mods/107?tab=files) — `retrieved_public_text`; observed CET 1.38.1 / game 2.5. Main and old file names, sizes, versions and download links readable. Archive bytes not retrieved.
- **CPX010** [CET Nexus images](https://www.nexusmods.com/cyberpunk2077/mods/107?tab=images) — `retrieved_public_text`; observed Five author images listed. Gallery separates image uploader ArsenicTouch from mod author yamashi. Full image link opened and rendered; all-gallery completeness not established.
- **CPX011** [yamashi Nexus avatar](https://avatars.nexusmods.com/3386513/100) — `retrieved_image_rendered`; observed Image opened 2026-10-28. Public avatar link followed from actual profile and rendered by retrieval tool. No independent decoder or cache implementation tested.
- **CPX012** [CET keybind screenshot](https://staticdelivery.nexusmods.com/mods/3333/images/107/107-1613641770-185635979.png) — `retrieved_image_rendered`; observed Image opened 2026-10-28. Screenshot opened from gallery; tool rendered actual image. This proves one image retrieval, not all images or video.
- **CPX013** [ArchiveXL release](https://github.com/psiberx/cp2077-archive-xl/releases/tag/v1.28.1) — `retrieved_body_assets_loading_error`; observed v1.28.1 / 2026-10-27. Release title, psiberx releaser, three change bullets and Assets 4 visible. Asset region failed to load, so filenames/bytes unproven.
- **CPX014** [psiberx GitHub profile](https://github.com/psiberx) — `retrieved_public_text`; observed Public profile. Name Pavel Siberx, account psiberx, avatar and Follow login link; pinned frameworks, Equipment-EX and CET modules are useful original-author discovery.
- **CPX015** [psiberx GitHub avatar](https://avatars.githubusercontent.com/u/4366745?s=40&v=4) — `retrieved_image_rendered`; observed Image opened 2026-10-28. Actual release-avatar image rendered by retrieval tool.
- **CPX016** [redscript release](https://github.com/jac3km4/redscript/releases/tag/v0.5.32) — `retrieved_body_assets_loading_error`; observed v0.5.32 / 2026-10-22. Release owner jac3km4 differs from publisher github-actions and credited contributor alphanin9. Release body readable; six assets failed to load.
- **CPX017** [jac3km4 GitHub profile](https://github.com/jac3km4) — `retrieved_public_text`; observed Public profile. Account jac3km4, display jekky, avatar and Follow link observed; pinned redscript repository links back to project.
- **CPX018** [RED4ext release](https://github.com/wopss/RED4ext/releases/tag/v1.31.0) — `retrieved_body_assets_loading_error`; observed v1.31.0 / 2026-10-24. wopss release; body states minimum game patch 2.5 and lists two ZIP names with SHA256. Assets 4 failed to load; published hashes are not locally verified downloads.
- **CPX019** [wopss GitHub profile](https://github.com/wopss) — `retrieved_public_text`; observed Public profile. Account wopss, display Octavian Dima, avatar and Follow login link observed; RED4ext and SDK listed.
- **CPX020** [WolvenKit release](https://github.com/WolvenKit/WolvenKit/releases/tag/10.0.0-beta.1) — `retrieved_body_assets_loading_error`; observed 10.0.0-beta.1 / 2026-10-24. Prerelease body and contributors readable; github-actions published, WolvenKit organization owns repository. Seven assets region failed to load. Stable 9.1.0 separately visible in release index.
- **CPX021** [WolvenKit GitHub organization](https://github.com/WolvenKit) — `retrieved_public_text`; observed RED Modding tools organization. Organization avatar, repository list and Blender/Substance resources observed. Organization identity is not an individual releaser.
- **CPX022** [CET upstream repository](https://github.com/maximegmd/CyberEngineTweaks) — `retrieved_public_text`; observed Public upstream repository. First-party redmodding hub links this repository. Keep Nexus author, upstream owner and contributors as different identity roles.
- **CPX023** [NativeDB](https://nativedb.red4ext.com/) — `javascript_shell`; observed Public application. Page required JavaScript; reference tool only. No downloadable-mod catalog or creator stream established.
- **CPX024** [Disappearance Of 8ug8ear](https://www.moddb.com/mods/disappearance-of-8ug8ear) — `retrieved_public_text`; observed Released August 2024. Body includes story prerequisite and install/dependency notes; Developer links QuestRunners company. One file listed; project Follow present.
- **CPX025** [QuestRunners ModDB company](https://www.moddb.com/company/questrunners) — `retrieved_public_text`; observed Public developer company. Company profile links back to 8ug8ear; Public privacy and apply-to-join membership distinct from Follow. No individual author inferred.
- **CPX026** [8ug8ear file listing](https://www.moddb.com/mods/disappearance-of-8ug8ear/downloads) — `retrieved_public_text`; observed One August 2024 file listing. Named full-version entry and size rendered. Contradictory generic no-files fallback also present; do not interpret fallback as empty list. No archive bytes.
- **CPX027** [Character Preset Manager CurseForge](https://www.curseforge.com/cyberpunk-2077/mods/character-preset-manager) — `retrieved_public_text`; observed Project 1689093; main file 3.1.1; guide 4.0.1. By Dnydd links profile; long description, project ID, gallery/files/relations tabs and main-file link visible. Description guide version differs from main file; retain both.
- **CPX028** [Dnydd CurseForge profile](https://www.curseforge.com/members/dnydd/projects) — `retrieved_public_text`; observed Public author profile. Profile says former name dklyntly, includes avatar, follower count and Cyberpunk/Minecraft project list. Do not infer numeric provider ID from slug.
- **CPX029** [Character Preset Manager file](https://www.curseforge.com/cyberpunk-2077/mods/character-preset-manager/files/8846950) — `retrieved_public_text`; observed File 8846950; 3.1.1; September 9 2026. Filename, 320.9KB size, uploader DKLYNTLY and no-changelog state visible. Profile alias provides provenance; no archive fetched.
- **CPX030** [Dnydd CurseForge avatar](https://media.forgecdn.net/avatars/2151/923/639286556267200684.png) — `retrieved_image_rendered`; observed Image opened 2026-10-28. Profile avatar opened and rendered by retrieval tool.
- **CPX031** [Lokiina Hair for Masc V post](https://lokiina.tumblr.com/post/755584944094478336/hair-for-masc-v) — `retrieved_public_text`; observed Post 755584944094478336 / 2024-07-09. Original blog permalink exposes title, paragraphs, two image links, timestamp/tags and Nexus destination 15692. Reblog notes are separate provenance, not post author.
- **CPX032** [Lokiina blog](https://lokiina.tumblr.com/) — `retrieved_public_text`; observed Public custom-theme blog. Blog identity and self-description readable alongside reblogs. No avatar source confidently identified; do not label a post image as avatar.
- **CPX033** [Lokiina first post image](https://64.media.tumblr.com/5e2ef1d2dbdf3b7b417837d9c3896034/e480615ba8ccd3f4-70/s500x750/c06c9bb7ce75e389abb55de043d86e8b9600de7d.png) — `http_403`; observed Image link followed 2026-10-28. Actual image request returned 403. Preserve observed rendition URL without inventing larger dimensions or claiming successful decode.
- **CPX034** [Hair for Masc V Nexus destination](https://www.nexusmods.com/cyberpunk2077/mods/15692) — `retrieved_public_text`; observed Linked mod 15692. Nexus target opened by following original Tumblr post download link. Announcement is separate object from file-host item.
- **CPX035** [Katsigian Ko-fi](https://ko-fi.com/katsigian) — `retrieved_public_text`; observed Public profile. Cyberpunk clothing/customization creator self-description, profile picture and Follow visible. Feed empty/loading in retrieved text; no post completeness inferred.
- **CPX036** [Katsigian Ko-fi avatar](https://storage.ko-fi.com/cdn/useruploads/ecb4199d-61dc-4368-b7ed-c1751c81cf8f_f9e3252d-961a-49f8-8e-d405d3f8c2d5.png) — `retrieved_image_rendered`; observed Image opened 2026-10-28. Profile picture opened and rendered. Generic application billing templates in page do not indicate an authenticated account.
- **CPX037** [Peachu Ko-fi](https://ko-fi.com/peachu3d) — `retrieved_public_text`; observed Public profile. Self-described Cyberpunk custom-mod creator; profile picture and Follow visible. Posts and membership fields remained unpopulated templates.
- **CPX038** [Antrakt92 Ko-fi](https://ko-fi.com/antrakt92) — `retrieved_profile_feed_shell`; observed Public profile; search index contained recent post excerpts. Original profile lists Cyberpunk projects and links Nexus/GitHub/CurseForge. Open page exposed profile but feed remained shell. Indexed Smart Vendor text is a lead, not full post extraction.
- **CPX039** [Kala Patreon](https://www.patreon.com/kalahira) — `retrieved_public_text`; observed Public creator page. Creator name/avatar and membership surface retrieved; source wiki links free resource posts. Post list remained loading.
- **CPX040** [Kala mod terms/resources post](https://www.patreon.com/posts/mod-tou-80670201) — `robots_denied`; observed Post 80670201 linked by community wiki. Specific linked resource post denied by robots.txt. Its body, files and entitlement not verified in this pass.
- **CPX041** [Peachu Patreon](https://www.patreon.com/cw/comfypeach) — `retrieved_public_text`; observed Public creator page. Name/avatar, creator bio, Nexus link and latest-public-post link retrieved. The /comfypeach profile route redirected to /cw/comfypeach.
- **CPX042** [Peachu release announcement](https://www.patreon.com/comfypeach/posts/new-release-171202048) — `retrieved_public_text`; observed Post 171202048; displayed October 2. Public post body exposes Nexus 34562 and atelier 27589 links plus one media image. Creator attribution link is explicit. Page still has loading regions; no paid payload inferred.
- **CPX043** [Peachu release post image](https://www.patreon.com/comfypeach/posts/new-release-171202048) — `retrieved_image_rendered`; observed Media link 18 from source page. Followed signed patreonusercontent image; tool rendered image. Expiring query token deliberately not retained as stable asset identity.
- **CPX044** [Word in Progress mod archive](https://wordinprogress.com/section/mods) — `retrieved_public_text`; observed Personal mod mirror; 2021 posts. Community guide points here for Roelani resources. Posts have named authors; this archive is not automatically endorsed or current for installed game.
- **CPX045** [Indy Bloody V](https://wordinprogress.com/2021/10/mods/indys-bloody-v) — `retrieved_public_text`; observed 2021-10-23. Post credits Indy, Roe photography; full visible paragraphs plus two named ZIP download links/sizes. Separate image returned retrieval error.
- **CPX046** [Indy archive author](https://wordinprogress.com/author/indy) — `challenge_page`; observed Author archive. Author link returned One moment please challenge; profile/avatar extraction blocked.
- **CPX047** [Indy fem archive link](https://wordinprogress.com/wordpress/wp-content/uploads/2021/10/aCC_BLOODY_V_FEM_TEX01.zip) — `unsupported_content_type_zip`; observed Named ZIP; post lists 11.92MB. Followed actual post Download; retrieval tool reported unsupported application/zip. This is not a completed byte download or hash verification.
- **CPX048** [cyberpunk.codes creator hub](https://cyberpunk.codes/) — `retrieved_public_text`; observed Public hub; three quest projects. Hub links Nexus downloads, long project details, source repository and screenshot comics. Page claims gameplay features; no gameplay execution performed.
- **CPX049** [Acceptable Loss project details](https://cyberpunk.codes/gigs/acceptable-loss.html) — `retrieved_public_text`; observed Linked project detail. First-party detailed quest page opened; treat game patch requirements as project-specific, not an ecosystem-wide recommendation.
- **CPX050** [cyberpunk.codes upstream source](https://github.com/andreaolivato/cyberpunk-codes) — `retrieved_public_text`; observed Public repository. Hub GitHub link opened. Repository ownership establishes project provenance, not equivalence with every voice actor or screenshot contributor.
- **CPX051** [Acceptable Loss screenshot](https://cyberpunk.codes/assets/img/acceptable-loss-04.jpg) — `retrieved_image_rendered`; observed Image opened 2026-10-28. First-party screenshot opened/rendered. Video-looking thumbnail click yielded JPEG, not playable video.
- **CPX052** [3DM Addiction System item](https://mod.3dmgame.com/mod/227678) — `empty_document`; observed Indexed mod 227678. Open yielded zero lines; search result separately credited Roms1383 and described translation/audio dependency. No profile/avatar/body extraction confirmed.
- **CPX053** [PlayGround Nova City item](https://www.playground.ru/cyberpunk_2077/file/cyberpunk_2077_sborka_nova_city_2_0_mini_v_6_v_2_31a-1766831) — `retrieved_public_text`; observed Item 1766831; version v6 / game 2.31a. Title, uploader LOMU, explicit author juliolomu, many paragraphs, spoiler region and Nexus source link observed. Do not equate uploader and original author solely by name.
- **CPX054** [LOMU PlayGround profile](https://users.playground.ru/5077783/) — `retrieved_public_text`; observed Public user 5077783. Profile links Cyberpunk posts; subscriber count and Subscribe button visible. Avatar absent from retrieved semantic links; extraction unresolved.
- **CPX055** [TESall Cyber Engine Tweaks](https://tesall.club/files/file/11582-cyber-engine-tweaks/) — `retrieved_public_text`; observed 1.35.1; updated 2025-05-18. Explicit original author yamashi and translator gkalian; five images; login required to download. Long body includes historical game 1.04-1.06 instructions; preserve stale applicability.
- **CPX056** [gkalian TESall profile](https://tesall.club/profile/95-gkalian/) — `retrieved_public_text`; observed Public user 95. Name/avatar link, administrator role and follower count readable. Attribute avatar to translator/uploader, not original CET author.
- **CPX057** [TESall CET image](https://tesall.club/uploads/monthly_2021_01/1609930484783-jpg.thumb.jpeg.9ay7qvb3ceiduomthlfxjpkg6n20rw1z.jpeg) — `retrieved_image_rendered`; observed Gallery thumbnail opened. Actual listed image rendered. Thumbnail only; original resolution and complete gallery not validated.
- **CPX058** [ModGames Cyberpunk discussion](https://modgames.net/forum/259-43304-1) — `retrieved_public_text`; observed Public thread; December 2020-January 2021 posts. Game-specific discussion, per-post nicknames, timestamps and avatars visible. No strong evidence of a Cyberpunk-specific download section in this pass. Search hit for Bounce Back Injector was Fallout 4; exclude it from CP downloads.
- **CPX059** [Cybermods historical wiki](https://wiki.cybermods.net/cyber-engine-tweaks/console/how-do-i) — `timeout`; observed Historical URL linked by TESall. Exact legacy documentation URL timed out; teleportation URL returned 502, homepage inaccessible. No first-party redirect to Thunderstore observed.
- **CPX060** [2077MODS CET listing](https://www.2077mods.com/mods/cyber-engine-tweaks) — `retrieved_public_text`; observed Lists v1.38.1. Independent hub lists versions/downloads and claims hosting permission. A GitHub-labelled link actually points to Nexus. Do not promote claim or label into verified author ownership.
- **CPX061** [2077MODS developer API documentation](https://www.2077mods.com/developers) — `retrieved_public_text`; observed Documented API v1. Documents read endpoints, manifest fields, hosting enum and rate limits. Example data is documentation, not observed API output or authenticated follow support.
- **CPX062** [2077MODS CET API route](https://www.2077mods.com/api/v1/mods/cyber-engine-tweaks) — `tool_inaccessible`; observed Route attempted on check date. Documented route could not be retrieved by this tool; runtime response/schema/complete output unverified.
- **CPX063** [Cyberpunk mod tutorial on YouTube](https://www.youtube.com/watch?v=5gR3rsL-sCs) — `footer_only`; observed Public tutorial linked by 2077MODS. Open exposed only generic footer; channel identity, description, stream and playback not recovered.
- **CPX064** [mod.io Cyberpunk game scope](https://mod.io/g/cyberpunk-2077) — `javascript_shell`; observed Official linked game scope. First-party game route required JavaScript. Official CDPR page documents account linking; this pass did not retrieve item/profile/API payloads.

## Round two: concrete methods

[Cross-site method index](../methods-round2.md) · [Sanitized method evidence](../../../experiments/site-adapter-discovery/method-research-round2-2026-10-28.json). Source IDs with historical S2K/M2C/S2S prefixes are published as SKYB/MCB/SIMB; original IDs remain in the manifest.

**Checked 2026-10-28 UTC; user date October28, America/Denver.** Baseline:248 catalog entries. This pass records12 candidate domains/scopes,28 inspected page/API scopes and9 concrete extraction recipes. These counts do not mean12 new independent platforms. There is no authenticated, ZIP-integrity, playback or universal-adapter acceptance.

The most useful new independent community is **Ketaros**: seven Cyberpunk listings, actual creator profiles, public full article markup, screenshot buttons and explicit download/tracking gates. **EDGEmodders** is an original tool community whose files are distributed through GitHub. Deceptious’ own **phil-wright.co.uk**, **xbaebsae Jimdo**, **NoraLeeDoes Neocities** and **NightCityRiot** add original creator/resource provenance; their underlying hosting platforms and file destinations remain separate. Japanese **cyberpunk2077.2game.info** adds a game-specific regional scope to the existing2game family.

### Candidate map

| Candidate | Classification and result | Evidence |
|---|---|---|
| [Deceptious original creator hub](https://www.phil-wright.co.uk/) | Independent original domain on existing Wix platform; sends files to Nexus. | CPY002 |
| [Ketaros Modders Community](https://www.ketaros.com/) | New independent community/catalog candidate; two posts + creator profile inspected. Login/subscriber gates remain. | CPY004 |
| [EDGEmodders original tool community](https://edgemodders.ai/) | New original community/tool host; downloadable releases live on GitHub. No performance/gameplay acceptance. | CPY009 |
| [xbaebsae original modding guides](https://xbaebsae.jimdofree.com/cyberpunk-2077-guides/cp2077-item-additions-with-wkit/) | New original guide domain on Jimdo; generic About page is not identity evidence. | CPY016 |
| [NoraLeeDoes palette resources](https://noraleedoes.neocities.org/resources/community_palette/info) | Original creator resource site on Neocities; Nexus file destination remains distinct. | CPY018 |
| [Bioskop narrative design guide](https://bioskop.notion.site/CP2077-Narrative-Modding-b47f789f992248e08241da1a983912c5) | Reference scope; shell only, no extractor established. | CPY021 |
| [Bioskop Cyberquest design wiki](https://cyberpunk-2077-quest-design.gitbook.io/cyberquest-2077-wiki/) | Original quest-design reference; current redirect preserved. Not an independent download platform. | CPY022 |
| [NightCityRiot creator and comic hub](https://nightcityriot.bio/) | New creator domain on Lnk.Bio, adjacent comic resources tied to three quest mods. Not a new mod host. | CPY024 |
| [Japanese Cyberpunk Mod Database](https://cyberpunk2077.2game.info/detail.php?id=2380) | New game scope of existing 2game family, not a new umbrella platform. Original author attribution and regional editorial role separated. | CPY025 |
| [TevoxMods candidate](https://tevoxmods.com/) | Discovery-only portal; author consent/originality unverified. | CPY026 |
| [DLCfun regional mod portal candidate](https://dlcfun.com/en/cyberpunk-2077/obmancivoe-iadro-kvesta) | Public post/profile parser candidate; original authorship and reuse permission unproven. | CPY027 |
| [Cyberpunk2077Mod mirror candidate](https://www.cyberpunk2077mod.com/cyber-engine-tweaks-2/) | Historical mirror; no consent/originality acceptance. | CPY029 |

### Repeatable extraction evidence

Two Ketaros HTML items and two anonymous public GitHub REST release responses were parsed twice from the same captured snapshots. Complete normalized outputs matched. This proves deterministic replay of those snapshots, not live uptime, complete platform coverage or target-project adoption.

- Replay receipt:2 passes, identical outputs; SHA256 `4d9e9a54644f9ea3491aad861190d6f90782b2b090827a0ca465d7e2179053b1`.
- Source HTML/API bytes, lengths and SHA256 are retained in the JSON source receipts. Full pages remain outside the repository.

#### CPYM01: Ketaros SSR item/profile

Sources: CPY006, CPY007, CPY008, CPY005, CPY032.

| Field | Observed extraction path or semantics |
|---|---|
| title | //h1 |
| author | //main//a[starts-with(@href,"/modders/")] |
| body | //section[h2[normalize-space(.)="About"]]/div[1] |
| gallery | //main//button//img/@src |
| metadata | script[type="application/ld+json"] array object @type=CreativeWork: author.name, publisher.name, description, image |
| gates | //a[starts-with(@href,"/login?from=")]; sidebar visible Version/File size/Updated; creator card Free/Subscriber |
| follow | Visible text says sign in to track/email on update; current-user tracked state and write untested |
| pagination | Game page observed7 item links; creator profile multi-game list. No fabricated API/paging parameters. |

JSON-LD description truncates body; use bounded HTML. No distinct creator avatar isolated, site logo excluded. Gallery3/1 retrieved as URL lists, one PNG decoded. Files listed sizes24KB/87KB, bytes and entitlement untested. Completion Catalog says Codeware+TweakXL but related links Codeware+Redscript; retain discrepancy.

#### CPYM02: Documented public GitHub release REST

Sources: CPY013, CPY014, CPY015, CPY011, CPY012, CPY030.

| Field | Observed extraction path or semantics |
|---|---|
| identity | $.id; $.tag_name; $.html_url |
| publisher | $.author.{id,login,type,html_url,avatar_url} |
| body | $.body exact complete Markdown string; chars and SHA256 retained |
| files | $.assets[*].{id,name,size,content_type,digest,browser_download_url}; $.assets[*].uploader.login |
| versions | $.published_at; $.prerelease; $.draft; game gates remain in body |
| avatar | $.author.avatar_url -> GET -> Pillow Image.load; psiberx420x420PNG decoded |
| pagination | These latest/specific-tag responses are single release objects, not complete release history. No list pagination tested. |
| follow | Public user $.followers is aggregate; current-user relationship requires separately authorized documented endpoints. |

REDnode publisher Bot is not organization owner. API assets2 for ArchiveXL differs prior HTML Assets4; keep both without assuming equivalence. Download URLs/digests are published metadata, ZIP bytes not fetched; no SDK execution.

#### CPYM03: Original creator cross-host identity

Sources: CPY002, CPY003.

| Field | Observed extraction path or semantics |
|---|---|
| body | //main[@id="PAGES_CONTAINER"] |
| identity | Heading text Deceptious plus anchors @href=https://www.nexusmods.com/profile/deceptious; separate Ko-fi and X destinations |
| avatar | Portrait-like Wix image exists but no explicit creator-avatar semantic field; unresolved |
| files | Only original creator destination links; no ZIP on original hub |
| follow | Original hub links social sites; no native follow state shown |

Wix generated component IDs are brittle; verify identity text plus href. A personal portfolio is a creator hub, not a new distribution service.

#### CPYM04: Jimdo original tutorial

Sources: CPY001, CPY016, CPY017.

| Field | Observed extraction path or semantics |
|---|---|
| body | //*[@id="content_area"] |
| media | //*[@id="content_area"]//img/@data-src with @src fallback; preserve actual Jimcdn transform URLs |
| author | Site title xbaebsae; wiki creator credit; actual About link gives generic platform boilerplate |
| files | No mod archive bytes established; guide outbound tool links distinct |
| pagination | Single guide page; nav lists other guides; no post-feed inference |
| follow | No native follow semantics isolated |

Tutorial images not fetched in this pass. Jimdo identity must not be invented from platform About.

#### CPYM05: Neocities original palette guide

Sources: CPY018, CPY019, CPY020, CPY001.

| Field | Observed extraction path or semantics |
|---|---|
| body | //main; h1 title; h2 sections and credits |
| author | Home //h1 NoraLeeDoes; project credits as body roles |
| files | //a[@href="https://www.nexusmods.com/cyberpunk2077/mods/10437"] -> project distribution |
| gallery | No img in retrieved guide DOM; do not invent image media |
| follow | No follow state or write control observed |

Resource/reference, not universal file host. Palette inline code/text may be required content; retain it in body extraction. Avatar unresolved.

#### CPYM06: Lnk.Bio creator domain

Sources: CPY023, CPY024, CPY031.

| Field | Observed extraction path or semantics |
|---|---|
| avatar | //img[@id="profile_picture_catch_error"]/@src; actual JPEG512x512 decoded |
| links | //a[@href]; retain original mod handoffs separately from comic Drive PDF/ePub and publication links |
| body | Creator hub link sections; preserve displayed labels and ordering, exclude Lnk.Bio marketing/footer |
| media | Ignore data:image/gif 1x1 transparent placeholder; do not label GIF-animation support |
| follow | No caller following state or write tested |
| pagination | Single hub; linked publication pagination untested |

Creator/comics adjacent scope. Files linked in Drive not downloaded. Profile avatar provenance stronger than unlabeled cover images.

#### CPYM07: Japanese 2game regional entry

Sources: CPY025.

| Field | Observed extraction path or semantics |
|---|---|
| body | //div[@class="desc"]/div[@class="character"] |
| attribution | //div[@class="aReverse"] original Nexus attribution; local editorial author not proven |
| gallery | //div[@class="desc"]//div[@class="imgBox"]//a/@href; img/@data-original, not placeholder @src |
| versions | Original entry current metadata and //div[@class="cVer"] historical-comment versions retained separately |
| files | Explicit Nexus /cyberpunk2077/mods/2380 download handoff |
| pagination | Comments and historical version groups not a release/download history API |
| follow | No logged-in follow state inspected |

Regional descriptions can include old install steps. A source author string is not regional uploader/profile ID. No gallery decode.

#### CPYM08: DLCfun public item/profile

Sources: CPY027, CPY028, CPY002.

| Field | Observed extraction path or semantics |
|---|---|
| title | //h1[1] |
| localIdentity | JSON-LD SoftwareApplication.author.{name,url}; link user-profile/16 -> Antihype |
| body | //section[h3[normalize-space(.)="About This Mod"]]/div[contains(@class,"insertInfo")] |
| files | JSON-LD $.downloadUrl observed; no request made to download action |
| originalAuthor | Local schema author is uploader attribution; independent Deceptious creator hub separately identified |
| gallery | No complete ordered gallery parsed; main contains recommendations, exclude them from mod body |
| follow | No authenticated state or write; profile aggregates are public-only |

Do not promote copied first-person body or schema author into original authorship. Mirror authorization unproven.

#### CPYM09: WordPress mirror provenance

Sources: CPY029.

| Field | Observed extraction path or semantics |
|---|---|
| title | //h1[contains(@class,"entry-title")] |
| body | Entry-content class boundary candidate; verify root count before use |
| localPublisher | JSON-LD @graph Person.name=The V; WebPage.author @id references local article identity |
| source | Body actual GitHub/maximegmd/CyberEngineTweaks link |
| versions | Heading1.35.1 and JSON-LD dateModified2025-07-06; historical, not patch2.5 proof |
| follow | No native current-user state observed |

No creator profile chain, permission or download bytes established; keep mirror candidate below original upstream.

### Actual image-byte decoding

| Media | Format/dimensions | Bytes | SHA256 |
|---|---|---:|---|
| github_psiberx_avatar | PNG 420×420; frames1 | 3339 | `85fd0f5ce32320122b15812f8e6fb294f3911cf51b4b8256c9dc8e995fd78585` |
| nightcityriot_avatar | JPEG 512×512; frames1 | 17084 | `cf71511a41a9d34890c5bccffd105ad9c65ece830d1eaf315bf61a94ab12a7b7` |
| ketaros_gallery_first | PNG 2562×1440; frames1 | 4152879 | `44f172dbca3b9b72e4ed69edf5324a9a05b8cf4841d1fa1915c56ed10e743ddd` |

Pillow `Image.load()` decoded the actual network bytes for two avatars and one gallery image. This is stronger than a discovered URL or retrieval-tool preview. All three were static single-frame images; it establishes no GIF animation or video/audio playback. Lnk.Bio’s tiny data-URI GIF placeholder is explicitly excluded.

### Role and gate findings

The GitHub REST records expose bot release publisher, asset uploader, repository owner and individual profile separately. REDnode release425786395 has four listed asset records and a2821-character Markdown body. ArchiveXL release425538188 has two listed asset records and a105-character body. Its earlier HTML Assets4 observation remains dated evidence; a cross-surface difference must not silently disappear. Published asset digest values are not locally verified archive hashes.

Ketaros JSON-LD `description` truncates the actual article; the bounded About HTML is the body source. Its author and publisher both display Ketaros but their Person/Organization types remain separate. The creator profile does not establish a separate avatar; the site logo is excluded. Criminal Tendencies targets patch2.5 and lists CET minimum1.38.0. Completion Catalog’s requirements text and related links differ; retain both.

DLCfun’s schema calls local uploader Antihype the author, while Deceptious’ original hub directs mod downloads to Nexus. Preserve local uploader and original creator roles rather than adopting the copied first-person prose as identity proof. Cyberpunk2077Mod’s local JSON-LD publisher The V likewise differs from CET upstream authors. Neither mirror has creator-permission acceptance.

### Preserved failures and boundaries

- **default public exec — `sandbox_network_denied`:** Default urllib request Operation not permitted; authorized public network retrieval succeeded under escalation. No bot block workaround.
- **scratch parser dependency — `missing_bs4`:** Initial parser import failed before request; corrected to installed lxml. Initial failure retained.
- **Bioskop Notion — `javascript_shell`:** HTTP200 title Notion; no article h1 or anchors. No private API guessing.
- **Jimdo About — `generic_platform_about`:** Actual About page is platform boilerplate; creator biography/avatar not proven.
- **prior round — `preserved_not_superseded`:** Earlier Tumblr403, Kala robots denial, ZIP unsupported, CDPR route ambiguity and media playback gaps remain valid dated evidence. New raw public API retrieval does not erase old lazy-region failures.
- **media/files/follow — `not_accepted`:** Only2 avatars and1 gallery static image decoded; no animation/video playback, ZIP byte hashes, authenticated download or follow write.
- **Tevox provenance — `discovery_only`:** No original creator authorization or actual item/profile extraction established; homepage is insufficient acceptance.
- **policy-blocked domains — `not_attempted`:** LL/F95 not accessed through browser, network, search fetch or alternate surfaces.
- **ArchiveXL asset count — `cross_surface_difference`:** Prior HTML Assets4; public API assets2. Do not silently overwrite one with other.
- **paid gates — `not_crossed`:** Ketaros Subscriber/free download gates observed; no purchase, account write or entitlement bypass.

## Round-three community and extraction research

Checked **2026-10-31**. The [round-three evidence manifest](../../../experiments/site-adapter-discovery/community-research-round3-2026-10-31.json) preserves original source locators, operation limits, failures and field mappings. Public observations are separate from executable parser and authenticated acceptance. Proposal counts below retain their original scope; the shared catalog applies alias and same-project normalization.

### New scope candidates

| Service/scope | URL | Decision |
|---|---|---|
| M Works / MaximiliumM | https://maximiliumm.com/ | Strong original creator/release-discovery hub. Real Nexus item/author, avatar and gallery join inspected. |
| SoundDB | https://sounddb.redmodding.org/ | Reference audio explorer; author, documentation and API pointer inspected. No sound playback or runtimeAPI acceptance. |
| Audioware original docs | https://cyb3rpsych0s1s.github.io/audioware/ | Official linked project documentation, existing GitHubPages scope. Source cover is not author avatar. |
| XMODhub | https://www.xmodhub.com/ | Multi-game regional portal candidate; actual public item, body/media and authentication label. Creator account/consent unverified. |
| ModsLab | https://modslab.net/ | Strong regional identity-role sample: author facet, uploader profile and external file host are all separate. |

### Deep item/project and author pairs

#### M Works → RelicBeGone2536 → MaximiliumM1677940

[Creator hub](https://maximiliumm.com/) (RDCP31001) explicitly self-identifies MaximiliumM and links AMM, ACM and RelicBeGone. Contributions to friends’ work are separately labeled; a portfolio card need not mean sole authorship. [Actual RelicBeGone2536](https://www.nexusmods.com/cyberpunk2077/mods/2536) has Created by MaximiliumM and Uploaded by linked numeric user1677940, resolving to [profile/MaximiliumM?gameId=3333](https://www.nexusmods.com/profile/MaximiliumM?gameId=3333). Preserve both roles even where equal.

Description region has original text, installation, limitations, requirement and contributor credits; do not ingest general guest menu/dialogs as content. Main file is2KBv1.0 with its own upload time; this differs from the project’s displayed update time. Manual binary URL is absent in retrieved guest text. The old source date is historical applicability, not proof of compatibility with the current game.

[Images tab](https://www.nexusmods.com/cyberpunk2077/mods/2536?tab=images) lists two items under Author images, yet their image uploaders are MaximiliumM and599Rider. Both actual images displayed, in source order, and the [creator avatar](https://avatars.nexusmods.com/1677940/100) displayed separately. Gallery ownership/category does not authorize attributing599Rider’s image to the mod author.

The [Ko-fi profile](https://ko-fi.com/maximiliumm) provides an explicitly labeled profile picture, actually displayed, bio and Follow text. Empty Feed and template placeholders do not prove no posts or an authenticated session. The linked Discord `Ce3xVqMcWN` failed on redirect; no messages or attachments read. AMM790 actual link returned only Nexus shell; do not fill its body from portfolio prose.

#### Audioware12001 → Roms1383 + RedModding member

[Actual mod12001](https://www.nexusmods.com/cyberpunk2077/mods/12001) and [numeric uploader163516183→profile](https://www.nexusmods.com/profile/Roms1383?gameId=3333) expose original creator/uploader, version1.11.0 and Oct29 2026 update. Historical changelog hashes and dependency versions are author statements tied to those versions, not independently checked current archive integrity. Spanish/Chinese translation authors remain separate contributors.

[Files tab](https://www.nexusmods.com/cyberpunk2077/mods/12001?tab=files) shows current1.3MB file and old rows with dates, but many per-file Version cells are blank. Keep them unknown; project version cannot silently fill every old row. No actual file delivery accepted. Main description and changelog are readable; title/summary alone is not completebody verification.

[RedModding member](https://redmodding.org/members/roms1383) has explicit member avatar/REDCore role. The actual Discord-hosted avatar displayed. This is identity evidence from the first-party project/member graph, not proof of Discord message access. [Official guide](https://cyb3rpsych0s1s.github.io/audioware/) is linked by the actual mod. Its Cover image is a project illustration; its docs author handle/domain differs from the Nexus display name, so retain the provenance link rather than asserting name equality. Navigation includes manifest, developer/API and integration docs. Install points to upstream release; no binary downloaded.

#### SoundDB project → Zhincore member/original site

[SoundDB about](https://sounddb.redmodding.org/about) explicitly names creator/maintainer Zhincore and provides audio-search field documentation and an [API reference pointer](https://sounddb.zhincore.eu/). Documentation facts include sound hash, bank/event and filename distinctions; no runtimeAPI response or generated audio-file URL was observed. The reference pointer returned2lines only. Index returned navigation shell; individual records/audio playback remain unverified.

[Linked member](https://redmodding.org/members/zhincore) exposes explicit avatar and GitHub/Nexus identity links; avatar displayed. Project directory links [original site](https://zhincore.eu/en). Preserve different snapshot times: member retrieval includes Apr2025 update metadata whereas current directory includes Oct2026. Do not interpret differing cached counters as live profile changes. SoundDB Favorites is not creator-follow; no social mutation occurred.

#### PinkyDude original roadmap138570804 → creator profile → external catalog

[Actual public post](https://www.patreon.com/PinkyDude/posts/roadmap-useful-138570804) and [linked creator](https://www.patreon.com/cw/PinkyDude) expose stable postID/creator alias, Sep10 2025 and public mainbody. Roadmap status is a plan, explicitly without promised release dates. Mainbody has two content images separate from the explicitly labeled creator profile picture. Actual avatar request failed; token-bearing delivery URL was deliberately omitted from publication.

The actual [GoogleSheet catalog](https://docs.google.com/spreadsheets/d/1slqe7jYBw2B16IIFxy0-W_gB-9YiNXE8g7694Ln2BXM/edit?gid=0) reveals title, view-only and introductory rows, but category tabs/mod entries do not populate. It is a creator-maintained catalog lead, not complete imported history. Drive resource links, mod original distribution and Patreon membership are distinct objects. Profile’s latest teaser does not replace the roadmap body or establish all-post entitlement. No follow history/import or pagination terminal state accepted.

#### ModsLab High-ResJohnny → XilaMonstrr facet + Swordself14 uploader

[Actual detail](https://modslab.net/en/cyberpunk_2077/mods/hD85eyKS3r/) names Author XilaMonstrr and Uploaded by Swordself14 separately. [Author facet](https://modslab.net/en/authors/XilaMonstrr/) says4files, but no creator-account/profile data; [uploader profile](https://modslab.net/en/user/Swordself14/) exposes account/material counts and message control while uploaded lists remain empty. No avatar role verified. Do not turn the uploader into the mod creator or personal metadata into required collection fields.

Detail has short complete visible directory description, version2.0/dateNov15 2023, main267MB and additional2K90.6MB variant. Download action actually redirects from `download_file.php?...u_id=23691` to [ModsFire82H38ceEshtp4G2](https://modsfire.com/82H38ceEshtp4G2), inaccessible. No binary/permission acceptance. Category date/history and display size are metadata, not installed compatibility. [Actual category](https://modslab.net/en/cyberpunk_2077/categories/244/) has pagination; terminal history untested. Earlier guessed root category failed and is preserved.

### Additional public portal and community observations

[XMODhub VTK Neck Seam Fix](https://www.xmodhub.com/en/game-mods/cyberpunk-2077-mods/vtk-neck-seam-fix-angel-evb) exposes Creator:PinkyDude, updated timestamp,5KB, long description, three content-image links and Authentification/download text. No linked creator profile, original ownership or binary URL accepted. It links Nexus dependency projects and an official support [Xmod Discord invite](https://discord.com/invite/KMAxzUSwtp), shell only. Preserve portal prose/media separately from originals; do not assert redistribution permission merely because a creator name appears.

Broader honest leads: official Discord listings for [Cyberpunk Modding Community717692382849663036](https://discord.com/servers/717692382849663036) and [NightCityReborn1285796904160202752](https://discord.com/servers/1285796904160202752) surfaced in search, but were not directly opened and have no channel/post fixture. [Mistralys upstream mod database](https://github.com/Mistralys/cyberpunk-mod-db/blob/main/mods-list.md) surfaced creator/alias mappings, still a search-only lead and existing GitHub service. Existing baseline already covers Word in Progress, cyberpunk.codes, Deceptious, Ketaros, EDGEmodders, NightCityRiot, TevoxMods, Japanese2game and major regional hosts; none was added again.

### Remaining gates

These observations establish field locations and provenance joins, not selectors or accepted adapters. Obtain permitted DOM fixtures; validate fullbody boundaries, media ordering and missing-field behavior; follow actual pagination to terminalstate; preserve mod author/uploader/gallery-uploader/translator/Discord-poster roles; prove binary/archive/hash integrity separately; and test read-only signed-in follows/import and legitimate entitlement. Unknown numeric IDs, avatars, fileURLs and counts remain unknown. No native follow/download mutation, messages or access-control bypass was attempted.
