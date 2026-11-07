# Skyrim SE/AE ecosystem: public content, identity and real-media inspection

Checked **2026-10-28 UTC**; user-facing review date **October 27, 2026, Denver**. This is an anonymous research pass, not implemented adapter support, authenticated acceptance, a mod-quality ranking, or a compatibility guarantee. Existing research and target projects remain intact.

The pass covers **35 service/host scopes** and **11 detailed inspection cases**. Eight different services had both a representative post/project page and a public author/contributor profile opened: Nexus, TES Alliance, Dwemer Mods, TESAll, PlayGround, Schaken-Mods, Step Modifications and GitHub. That count means actual page retrieval, not complete extraction of every field. Dwemer's inspected detail page was a media shell; Schaken and Step did not expose a confirmed avatar URL. Additional creator-author and regional-profile routes were opened on immyneedscake and ModGames. AFK's representative file worked while the attempted Arthmoor profile returned 403. [SKY1] [SKY2] [SKY8] [SKY9] [SKY12] [SKY13] [SKY15] [SKY16] [SKY19] [SKY20] [SKY24] [SKY25] [SKY26] [SKY27] [SKY30] [SKY32] [SKY6] [SKY7]

## What was actually observed

The following are concise field-level findings. The linked pages remain the primary sources; no third-party page bodies or mod archives are republished here.

| Service and exact sample | Body and author evidence | Media, files, follow and remaining boundary |
|---|---|---|
| [Nexus Mysticism](https://www.nexusmods.com/skyrimspecialedition/mods/27839), [SimonMagus](https://www.nexusmods.com/profile/SimonMagus?gameId=1704) | Description, permissions and changelog retrieved. Creator and uploader are separate fields. | Avatar and one PNG opened successfully. Separate image/video tabs expose gallery pages and YouTube links. Track control observed; binary transfer and video playback untested. [SKY1] [SKY2] [SKY3] [SKY4] |
| [AFK USSEP](https://www.afkmods.com/index.php?/files/file/1888-unofficial-skyrim-special-edition-patch/) | About This File and Arthmoor byline retrieved. Attempted profile forbidden. | Avatar URL observed but media fetch failed; 22 screenshot links. Download and Followers require sign-in. No authenticated/file acceptance. [SKY6] [SKY7] |
| [TESA resource kit](https://tesalliance.org/forums/index.php?/files/file/1330-the-tesa-skyrim-resource-kit-project/), [Hanaisse](https://tesalliance.org/forums/index.php?/profile/1515-hanaisse/) | File body, project/resource links and author profile retrieved. | One screenshot and inline PNG linked. Image chosen from profile resolved to theme art; rank art is not an avatar. Download requires sign-in. Legacy resources need SE applicability review. [SKY8] [SKY9] |
| [Dwemer MXPBD](https://dwemermods.com/mods/5123), [Motherhydra](https://dwemermods.com/users/motherhydra) | Listing text and uploader profile retrieved; detail body absent from extracted text. Uploader is not automatically original author. | Avatar and WebP thumbnail opened. Extra-image link observed; full gallery/file/follow operation unresolved. This case is a partial extraction. [SKY10] [SKY11] [SKY12] [SKY13] |
| [TESAll Legendary Loot](https://tesall.club/files/file/14648-legendary-loot/), [Arkanion Eternal](https://tesall.club/profile/719805-arkanion-eternal/) | Body and profile retrieved. Original author FabioJoose differs from translator/uploader Arkanion Eternal. | Four gallery links and one loaded WebP thumbnail. Profile avatar unresolved. File access and Followers link gated by sign-in; six category pages observed. [SKY14] [SKY15] [SKY16] |
| [PlayGround PapyrusUtil](https://www.playground.ru/elder_scrolls_5_skyrim/file/skyrim_se_papyrusutil_se_rasshirenie_skriptovyh_funktsij_dlya_modov-1853437), [Gutsz](https://users.playground.ru/1938322/) | Long body and uploader profile retrieved. Body credits two original authors. | Profile Subscribe button visible. Game artwork/comment image must not be misclassified as post gallery or author avatar. No archive confirmed. [SKY19] [SKY20] |
| [Schaken SKSE list](https://schaken-mods.com/forums/topic/143-skse-update-list/), [Schaken](https://schaken-mods.com/profile/3-schaken/) | Technical table, replies and administrator profile retrieved. | Inline image filenames visible; usable media URLs not confirmed. Followers links sign-in. Old table dates limit compatibility authority. [SKY24] [SKY25] |
| [Step Grass LOD discussion](https://stepmodifications.org/forum/topic/16314-skyrim-special-edition-grass-lod-guide/), [DoubleYou](https://stepmodifications.org/forum/profile/1198-doubleyou/) | Initial discussion, replies, profile and linked wiki source identified. | Four topic pages and post permalinks. Rank image is not avatar evidence. Followers targets sign-in; technical discussion is not a downloadable release. [SKY26] [SKY27] |
| [GitHub Community Shaders](https://github.com/doodlum/skyrim-community-shaders), [doodlum](https://github.com/doodlum) | Rendered README and matching owner profile retrieved. | Profile avatar link and Follow observed. Releases page says no releases; do not fabricate binary assets from repository existence. [SKY30] [SKY31] [SKY32] |
| [immyneedscake Shinobu Katana](https://www.immyneedscake.com/skyrim-se-mods/shinobu-katana), [creator](https://www.immyneedscake.com/) | SFW technical post has byline, requirements, crafting and original-texture permission text. Byline links an author-filtered listing. | Five gallery images and four renders linked; duplicate rendered links need deduplication. MEGA target observed, fetch unavailable. Avatar and native follow unconfirmed. [SKY33] [SKY34] [SKY35] [SKY36] |
| [ModGames Unlimited Fast Travel](https://modgames.net/load/skyrim_special_edition/gejmplej/unlimited-fast-travel-se-ae-neogranichennye-bystrye-puteshestviya/459-1-0-26354), [ApeX](https://modgames.net/user/ApeX/) | Detailed body separates original author SlavicPotato from translator ApeX. Profile response is a short shell. | Two named 7z file links divide runtime families. Screenshot heading lacks extracted children. No avatar decode, archive transfer or follow acceptance. [SKY22] [SKY23] |

The measured media boundary is small: successful image opens on Nexus, Dwemer and TESAll establish that those particular URLs returned decodable images through the retrieval tool. They do not establish complete image enumeration, original-resolution recovery, GIF animation, video playback, file integrity, or browser rendering parity. No GIF was observed in these chosen samples; this does not establish that a service lacks GIF support. YouTube links/iframe markers were observed, but neither a poster nor an embed URL is playback evidence. [SKY3] [SKY4] [SKY12] [SKY13] [SKY15]

## Discovery map and why each surface matters

This is a discovery queue with explicit evidence limits. A useful community or index can have no working adapter yet. A timed-out request is not proof that a site is down, requires login or no longer serves Skyrim.

| Surface | Useful scope | Current inspection result / decision |
|---|---|---|
| Nexus | Mods, author profiles, separate image/video/files tabs | Strong public body/identity candidate; authenticated operations remain separate. [SKY1] [SKY2] [SKY3] [SKY4] |
| AFK Mods | Author-managed releases, bugfixes, resources | File text works; downloads gated, attempted profile forbidden. [SKY6] [SKY7] |
| TES Alliance | Resource kits, modding school and forum history | Body/profile works; legacy game applicability and file gate retained. [SKY8] [SKY9] |
| Dwemer Mods | Archive, niche/reuploaded mods, author/uploader discovery | Listing/profile richer than inspected detail shell; provenance review required. [SKY10] [SKY12] [SKY13] |
| TESAll Club | Russian translations, separate SE/AE categories | Original author versus translator fields materially improve identity handling. [SKY14] [SKY15] |
| Tes-Game | Russian SE/AE releases and external file links | Handguns page body works; no profile/media confirmation. [SKY17] [SKY18] |
| PlayGround | Regional releases, guides and uploader subscriptions | Detailed post and Subscribe profile UI work; original credits remain separate. [SKY19] [SKY20] |
| ModGames | Localization community and runtime-specific archives | Exact mod works despite homepage timeout; two archives listed. [SKY22] [SKY23] |
| Schaken-Mods | Original communities, technical threads and RSS discovery | Technical post/profile works; distinguish feed account from original creator. [SKY24] [SKY25] |
| Step Modifications | Guide discussions, tools, LOD and support | Post/profile pagination candidate; keep technical dates and post identity. [SKY26] [SKY27] [SKY28] |
| GitHub | Creator code, README, releases and issue discussions | Source/project ownership works; chosen releases page empty. [SKY30] [SKY31] [SKY32] |
| immyneedscake | Free creator releases, custom physics and assets | SFW post body, author listing and external files identified. [SKY33] [SKY34] [SKY35] [SKY36] |
| Darkfox127 | Creator projects, Papyrus learning and resources | Public creator mod index and Nexus download links. [SKY37] |
| Daymarr Workshop | Creator collective and SE/LE/body-specific release taxonomy | Public index, pagination and newsletter control; per-post extraction pending. [SKY38] |
| Phereniki Mods | Creator portfolio spanning Free and Verified Creations | Public creator identity and original platform/profile links. [SKY39] |
| Canalpa | Small creator host with Skyrim SE among several games | Public homepage; actual Skyrim post and quality review pending. [SKY40] |
| Beyond Skyrim / Arcane University | Expansion teams, teaching and asset pipeline training | Public project links distinguish SE/LE; school disciplines and wiki/Discord links observed. [SKY41] [SKY42] |
| SureAI | Enderal project, team, wiki and forum history | Public news/navigation; classify non-Skyrim games independently. [SKY43] |
| ModDB | Project news, files, images, videos and RSS | Public Enderal surface works; inspected files are old original-Skyrim packages. [SKY44] [SKY45] |
| TamrielMods | Cross-host creator hubs and collections | Public index says original-host downloads; dynamic cards not extracted. [SKY46] |
| Nolvus | Curated modlist requirements and external-host discovery | Home works; `/modlist` is a soft 404, not usable mod data. [SKY47] [SKY48] |
| 2game.info SE database | Japanese discovery/comments and upstream Nexus IDs | Public catalog; explicit AI-summary warnings require preserving source type. [SKY49] |
| Official SKSE | Authoritative build/runtime/storefront mapping | Public build list; identity is a development team, not a social profile. [SKY50] |
| ENBDev | Official ENB binary source | SSE download page redirect loop; current binary retrieval unresolved. [SKY51] |
| Wabbajack | Modlist discovery and installer project | Current homepage gave zero readable lines; no gallery acceptance. [SKY52] |
| Bethesda Creations | Official console/PC release marketplace | Current Skyrim landing page gave zero readable lines; no author/file acceptance. [SKY53] |
| LoversLab technical scope | Technical threads and regular-mod research | Public retrieval unavailable; the research browser was blocked by its site-safety policy before login. No further attempts, no downtime/login-only inference. [SKY54] [SKY55] [SKY56] |
| Skyrim Guild / Modding Guild routes | Animation ecosystem historical links | Exact current/historical routes failed; no current migration or original hosting endorsed. [SKY57] [SKY58] [SKY59] [SKY60] |
| VectorPlexus / Vectorplexis | Historical community lead | First spelling timed out; second redirected to a parked host. Do not treat variants as trusted equivalents. [SKY61] [SKY62] |
| 3DM Mod Station / forum | Chinese mods, translations and technical threads | Two indexed mod pages returned zero readable lines; forum unavailable. [SKY63] [SKY64] [SKY65] |
| 9DM historical candidates | Chinese creator/community leads | Direct candidate domains failed; similar 10DM naming does not establish continuity. [SKY66] [SKY67] |
| FKMods | Chinese translation/modding discovery lead | Search indexed relevant threads; actual homepage timed out. [SKY68] |
| Tullius on Arca.live | Korean modding community lead | Public channel unavailable to retrieval; no restriction workaround attempted. [SKY69] |
| SunJeong | Creator-host lead | Exact site timed out; post/media/profile inspection pending. [SKY70] |
| TalesOfStar | Creator-host lead | Direct request 403; indexed free/exclusive-tier descriptions remain leads. [SKY71] |

The old `https://www.distaranimation.com/` route was also opened and redirected to unrelated gambling content at `https://www.brazilianmarket4you.com/`. It is excluded from the useful-host count and should not receive creator-service credentials. This is an observed origin/content change, not a claim about who controls the domain. [SKY72] The live Nexus [Attack–MCO Updated page](https://www.nexusmods.com/skyrimspecialedition/mods/181779) separately exposes its credited creators, uploader, requirements and embedded YouTube overview; that does not prove the former Guild endpoint still hosts its dependencies. [SKY5]

## Adapter decisions supported by this evidence

Preserve at least three independent identities: original author, local uploader/translator, and platform account. TESAll and ModGames explicitly demonstrate why flattening them into one `author` loses provenance. Schaken RSS feed identities introduce a fourth role, the syndicating account. An author label must not silently inherit the uploader's avatar or follow target. The source page, canonical account URL and stable account ID should each keep their origin. [SKY15] [SKY16] [SKY22] [SKY23] [SKY24]

Use separate fields for content completeness, identity confirmation, image enumeration, image decode, video playback and authenticated files. Dwemer demonstrates a title/thumbnail success with missing body; ModGames demonstrates a detailed body with incomplete profile and screenshot extraction; GitHub demonstrates a repository with no release assets. These are useful, recoverable partial states, and none should be converted into a fully supported service. [SKY12] [SKY13] [SKY22] [SKY23] [SKY30] [SKY31]

Follow/watch semantics are also independent. Nexus Track, PlayGround author Subscribe, Invision file/topic Followers, GitHub Follow and creator newsletters serve different objects. A local bookmark may be useful, but it is not proof that any native platform follow action succeeded. No follow, subscription, message or email was sent. [SKY2] [SKY6] [SKY15] [SKY20] [SKY26] [SKY32] [SKY38]

SE/AE labels cannot replace exact runtime and storefront applicability. The official SKSE page observed in this pass lists AE 2.3.1 against game 1.7.104, while the inspected regional PapyrusUtil body still describes an older runtime as current. This conflict makes the original-version/date fields essential; it does not authorize upgrading a target executable. Archive names, modlist pins and original author requirements need to survive normalization. [SKY50] [SKY19] [SKY22]

Archive availability does not establish redistribution rights. Dwemer's archive/reupload scope, Tes-Game's explicit redistribution restriction, and immyneedscake's permission request are reasons to store provenance and permissions separately from a download URL. Preserve the original source link, rights statement and author/uploader distinction; do not turn discoverability into authorization to republish a file or its media. [SKY10] [SKY18] [SKY35]

## Evidence and next acceptance gates

No raw-page parser selectors or embedded JSON paths are claimed. Anonymous `urllib` retrieval was denied by the execution environment before a response, so this pass used actual web open/click/find output. HTML selectors guessed from generic Invision, Wix or Squarespace conventions would be unjustified. The observed field labels and URL structures above are evidence to guide later capture, not a substitute for inspecting the actual DOM and exact response representation.

A useful next fixture for each service should capture an authorized public post and its canonical profile, enumerate all body blocks and gallery pages, distinguish thumbnail/original media, resolve signed/external file links without publishing sensitive query data, preserve version edits and deletion states, and explicitly record gated fields. A playable video requires a real playback/decode result; a GIF requires verified animation; an archive requires file/version/integrity evidence. Authentication or a successful metadata query alone closes none of those gates.

The [sanitized game manifest](../../../experiments/site-adapter-discovery/game-research-2026-10-28.json) contains 35 scopes, 11 cases, 72 source records, observed media URLs, per-field states and failed retrievals. Source IDs **SKY1–SKY72** are included in the [source register](../../../data/sources.json). Failed/empty/blocked records explicitly keep `primaryContentObserved: false`; their register presence is not evidence that source content was read. There are **zero new implemented adapters and zero authenticated or full-content acceptances** from this pass.

## Round two: concrete methods

[Cross-site method index](../methods-round2.md) · [Sanitized method evidence](../../../experiments/site-adapter-discovery/method-research-round2-2026-10-28.json). Source IDs with historical S2K/M2C/S2S prefixes are published as SKYB/MCB/SIMB; original IDs remain in the manifest.

Checked **2026-10-28 UTC**; requested user-facing label **October 28, 2026, Denver**. Baseline was the current 248-entry catalog and existing Skyrim research note. This section preserves the scope of the original public research pass. It adds no implemented adapter or authenticated/full-content acceptance.

The useful result is a concrete recovery method for Dwemer’s previously missing body/files, a newly discovered independent mod host, and sample-proven identity/media selectors across the Invision communities. The structured handoff contains **14 new candidate scopes: 11 independent registrable domains and three named creator scopes on already cataloged platforms**. It records **53 inspected scopes**, including 47 successful HTML responses and five image decodes, plus preserved failed discovery requests. Scope counts are request/evidence counts, not accepted-service counts.

### Concrete gap resolutions

#### Dwemer: the public detail shell is not the description

The actual `/mods/5123` response contains `#modTabsContent [data-url]`. Those attributes declare separate same-origin GET fragments for `desc`, `files`, `images`, `comments` and `changelog`. The description, files, images and changelog fragments all returned HTTP200. This resolves the missing-body gap without a browser session or an invented API endpoint. [SKYB001–SKYB005]

The full description boundary is `.mod-detailed-desc.bbcode-output`, which yielded 730 normalized characters. The main page’s `CreativeWork.author.name` is **Acro748**; the fragment’s `a.mod-author-link` identifies **Motherhydra**, the local uploader. These must remain distinct identities. The profile supplies `.profile-avatar-user[src]`. A content collector that substitutes uploader identity for the schema author would misattribute this sample. [SKYB001] [SKYB002] [SKYB006]

The files fragment exposes two named ZIPs: `MXPBD Physics framework 0.4.0.zip` and `MXPBD Cloth cluster example.zip`. The additional file has `data-file-id="3187"`; the main file does not expose an equivalent ID in the inspected element. Both `.file-actions` blocks explicitly require login. Their names and gating are collectible metadata; there is no accepted transfer URL. The images fragment has one `img.extra-image[data-full][data-index]`, with a different original WebP URL from the thumbnail. The empty changelog is explicit content, rather than a parser error. [SKYB003–SKYB005]

The scratch parser reads the DOM-declared fragments and preserves mixed text/link/media order. It does not call neighboring edit, delete, report, endorsement, upload or AI routes. Social follower counts on a creator profile also need to be distinguished from the **Followers** NPC mod category, which otherwise creates a false follow-control match. [SKYB002] [SKYB006]

#### ModPub: independent original host found through Dwemer

Dwemer’s public files help links to ModPub’s first-party MO2 guide. From there, actual **Effects 11** mod, files and **doodlum** profile pages were inspected. This host was absent from the 248-entry catalog. [SKYB003] [SKYB017–SKYB020]

`SoftwareApplication` JSON-LD supplies mod metadata and `author.name`, while `.gray-box.user-content` supplies the actual full description: 2,922 normalized characters, with four inline images. The first two are social badges and the next two are example screenshots. A single undifferentiated “screenshots” array would lose those roles and their position in the body. [SKYB017]

The public Files tab exposes **Effect 11 v1.0.0, 11.1 KiB**. The manual button is `button.js-btndl[name="file_id"][value="1164"]`, with `disabled` present. The MO2 button references the same file identity. This is a concrete file ID and access state, not a discovered download URL. The profile provides `ProfilePage.mainEntity` and `img.avatar-100[src]`; its avatar decoded as a 128×128 JPEG. No follow operation or authenticated transfer was attempted. [SKYB018] [SKYB019] [SKYB053]

### Invision communities: methods now based on actual HTML

The anonymous raw responses resolve gaps left by text-only page extraction. The observations below are per sample, rather than a claim that every Invision installation is identical.

| Field | Observed structure | Consequence |
|---|---|---|
| File body | `div.ipsType_richText.ipsContained.ipsType_break.ipsSpacer_bottom` | Separate the main description from reviews, comments and metadata. [SKYB007] [SKYB009] [SKYB011] |
| Account avatar | Author-bound `a.ipsUserPhoto img[src]` | Recover the actual account image; do not choose theme backgrounds or rank art. [SKYB007] [SKYB009] [SKYB013] [SKYB015] |
| File gallery | `ul.cDownloadsCarousel li.ipsCarousel_item img` | TESAll uses a spacer `src` and real `data-src`; AFK uses direct `src`. Do not synthesize originals by removing `thumb`. [SKYB007] [SKYB011] |
| Original author/translator | Labeled `li.ipsDataItem` fields on TESAll | FabioJoose remains original author; Arkanion Eternal remains local translator/uploader. [SKYB007] |
| Topic/post body | `article.ipsComment[id]` and inner `[data-role="commentContent"]` | Bind author and body to a specific post ID; avoid merging replies and responsive duplicate author panes. [SKYB013] [SKYB015] |
| Inline attachment | `img[data-src][data-fileid]` and some `a.ipsAttachLink.ipsAttachLink_image[href]` ancestors | Preserve source attachment ID, image URL and position in the post. [SKYB013] |
| Pagination | `ul.ipsPagination` | Traverse explicit next/page links and deduplicate repeated controls; page traversal remains separate from gallery and profile cursors. [SKYB015] |
| Native follow | `[data-role="followButton"]` | Anonymous targets point to login. File/topic subscriptions are distinct from member followers or local bookmarks. [SKYB007] [SKYB009] [SKYB011] [SKYB013] [SKYB015] |

TESAll, TES Alliance and Step account avatars decoded successfully, resolving their earlier “avatar unresolved” states. Their public image sources are in the structured file. AFK’s file page still exposes an Arthmoor image and byline, while the exact profile request returns403. That failure is preserved and was not retried through another route. [SKYB008–SKYB012] [SKYB050–SKYB052]

Schaken’s initial technical post contains seven ordered inline images with lazy `data-src` attributes and attachment IDs. Separately, its rank decoration is a GIF that decoded as **120 frames at 556×556**. That GIF sits outside the post body and is deliberately excluded from body-media results. This is a measured example of why “all images anywhere on the page” is an incorrect extraction boundary. It is not evidence of a GIF mod showcase. [SKYB013] [SKYB049]

### Additional independent sources worth integrating

These are distinct communities, creator hosts or named creator scopes with actual public content inspection. They are discovery candidates, not rankings of mod quality or blanket download recommendations.

| Candidate | Actual inspection and useful distinction | Source IDs |
|---|---|---|
| **ModPub** — `mod.pub` | Effects 11 release, file metadata and doodlum profile. Original mod-host scope. | SKYB017–SKYB020 |
| **Migal3D** — `migal3d.com` | Iona update plus Housecarl Beauties mod page; local ZIP links split common body assets and individual NPC versions. Creator homepage links Nexus identity and other creator sites. | SKYB021–SKYB023 |
| **Interesting NPCs / 3DNPC** — `3dnpc.com` | Actual news post and Kris Takahashi author archive. Sidebar contains cross-game packages, which must not become attachments to every Skyrim post. | SKYB024–SKYB025 |
| **Rektas Wix** — `rektas.wixsite.com` | Actual First Priest post with four ordered body images and 3BA/BHUNP/CBBE/4K file links. Exact Wix origin linked by Migal3D. | SKYB023, SKYB026–SKYB027 |
| **tktk / skyrimshot** — `tktk1.net` | Japanese TK Dodge release/tutorial and explicitly linked creator profile; historical files and update text remain dated claims. | SKYB028–SKYB029 |
| **TRE-MAGA** — `tre-maga.com` | Japanese armor review and Mita author archive. Editorial writer is not the original mod author. | SKYB030–SKYB031 |
| **full_inu Workshop** — `inu-workshop.blogspot.com` | Actual2026 Paladin release and canonical Blogger profile, including matching profile-image source. | SKYB032–SKYB033 |
| **Smooth** — `smooths.tistory.com` | Actual historical SE/AE Disable Turn Animation release and current homepage. Mixed newer content needs per-post provenance review. | SKYB034–SKYB035 |
| **Kaidan AIO** — `kaidanmod.com` | Downloads-navigation and Our Mod pages. Project/team identity rather than a personal profile; individual archive validation pending. | SKYB036–SKYB037 |
| **Joseph Russell / Lucien** — `josephrussellauthor.com` | Actual Lucien page and creator blog. Similar-name `.co.uk` site is a different design portfolio. | SKYB038–SKYB039, SKYB066 |
| **Skywind** — `tesrskywind.com` | Current project and credits pages reached through TESRenewal. `/author/kevmelba/` serves home-like content and is not an accepted profile. | SKYB040–SKYB042 |
| **Skyblivion** — `skyblivion.com` | Project About and Team pages. Keep development/community discovery separate from binary-release claims. | SKYB043–SKYB044 |
| **TESRenewal** — `tesrenewal.com` | Current first-party federation links distinct projects and original game targets. | SKYB045 |
| **ModBooru** — `modbooru.com` | Actual catalog mod page with primary image, four thumbnail/original gallery pairs and outbound releases. `admin` is catalog updater; profile request displays Login. | SKYB046–SKYB047 |

The three named scopes on existing cataloged platforms are **Rektas/Wix**, **full_inu/Blogger** and **Smooth/Tistory**. They should not be counted as three newly discovered hosting-platform technologies.

### WordPress, Wix, Blogger and older custom pages

Migal’s `article#post-4322 .entry-content` contains the update, while social controls and previous/next navigation are outside. Its linked mod page exposes native `/downloads/*.zip` links with file-specific names. 3DNPC’s author archive is public and paginated; no standalone author-avatar field was verified. A commenter’s Gravatar must not fill that gap. No WordPress REST endpoint or undocumented JSON field is inferred from CMS appearance. [SKYB021–SKYB025]

Rektas’s current Wix response exposes stable semantic hooks: `article[data-hook="post"]`, `[data-hook="post-description"]`, `[data-hook="post-title"]` and `[data-hook="post-hero-image"]`. Those are preferable to hashed styling classes. `BlogPosting` JSON-LD identifies the author name and publish/edit times, but no member-profile URL or avatar was accepted. The four MediaFire links are file variants, not four mirrors of one interchangeable package. Wix image transformations are retained exactly; original-resolution recovery remains unproven. [SKYB026–SKYB027]

The Japanese TK Dodge article contains a `div.lyMe` wrapper with `id="WYL_RwdKsxngg5s"` and an explicit noscript YouTube link. Its thumbnail is a deferred-video placeholder, not a decoded video. TRE-MAGA’s sample has three body screenshots followed by a site icon; image role needs context. Both sites’ article authors and actual upstream mod authors are separate concepts. [SKYB028–SKYB031]

full_inu’s full body is `.post-body.entry-content`; its `a.profile-link.g-profile` points to a real Blogger profile. Homepage excerpts are insufficient substitutes for this post. The shared `entry-content` class also appears on Blogger and Tistory, so its presence alone is not evidence of WordPress. Signed image query material on the Tistory sample was omitted from the public metadata. [SKYB032–SKYB035]

Lucien’s custom HTML repeats `section[id="team"]` four times. A first-match ID lookup would discard sections of the real page. Team pages, creator blogs, editorial archives and native member profiles need different identity models; a page editor link does not automatically identify the mod’s author. [SKYB038–SKYB042]

### Paid-platform follow-up for separately authorized access

The following exact destinations were observed on current primary creator/project pages. Their presence establishes link provenance only; it does not establish public post completeness, subscription entitlement or file access.

| Origin | Exact destination |
|---|---|
| Dwemer MXPBD description | `https://www.patreon.com/acro748/posts/mxpbd-physics-0-156455107` |
| ModPub Effects 11 body | `https://patreon.com/CommunityShaders` |
| full_inu Paladin post | `https://patreon.com/full_inu` and `https://boosty.to/full_inu` |
| Migal3D homepage | `https://www.patreon.com/migal130` |
| tktk creator profile | `https://www.patreon.com/tktk` |
| Lucien page | `https://www.patreon.com/josephrussellauthor` |
| immyneedscake Featured Sites | `https://www.patreon.com/CloudBird` |

Sources: SKYB002, SKYB017, SKYB023, SKYB029, SKYB032, SKYB038, SKYB048. No SubscribeStar destination was confirmed in these inspected primary pages. No purchases, follows, account links, messages or authentication were performed.

### Failed and misleading discoveries remain visible

The structured failure list retains actual403/404/503 responses without claiming the service is universally down or login-only. `rektasmarket.com` returned404 while the creator-linked Wix site worked. `dragonporn.ldblog.jp` returned a password screen; `mitakusaner.blog.fc2.com` returned Site Unavailable. A guessed Skyrim Lazz WordPress route returned generic platform content. No password or alternate access was attempted. [SKYB054–SKYB065] [SKYB068–SKYB070]

The creator-linked older `sunkeumjeong.com` URL currently serves generic gaming editorial content. That does not establish continuity with a mod creator, even though old primary pages still link it. Similar-name `josephrussell.co.uk` likewise cannot be used to identify the Lucien creator. Skywind’s apparent author URL and ModBooru’s profile URL both returnHTTP200 but fail the intended profile scope. HTTP status alone is insufficient acceptance evidence. [SKYB041] [SKYB047] [SKYB066–SKYB067]

LoversLab and F95 were excluded from all requests in this round, respecting the earlier explicit policy block. No alternate-surface workaround was attempted.

## Round-three community and extraction research

Checked **2026-10-31**. The [round-three evidence manifest](../../../experiments/site-adapter-discovery/community-research-round3-2026-10-31.json) preserves original source locators, operation limits, failures and field mappings. Public observations are separate from executable parser and authenticated acceptance. Proposal counts below retain their original scope; the shared catalog applies alias and same-project normalization.

### Most useful additions

**ModlistGrimoire** is the strongest newly identified independent publishing service: https://modlistgrimoire.com/ . Actual Intricate Skyrim page https://modlistgrimoire.com/modlists/intricate-skyrim exposes slug identity, creator display handle sailorofthemind, version/date, cover, category tree counts, external website/community/readme and comparison URL. The author is a displayed handle; no member-profile link/avatar was confirmed. The official author instructions describe two supported user uploads: Kodex-generated HTML and MO2 modlist.txt. The latter lacks version/priority/mod-page links available in Kodex exports. This is documented input behavior, not reverse-engineered API behavior. Retrieved text supplies category summaries rather than all individual expandable mod rows; complete list extraction remains unresolved. Current public games page includes Skyrim, Fallout4 and personal/reference lists, so it is useful beyond this game. RDSKY31017–021.

**ElderScrollsPortal.de** is a substantive German original community/resource host absent from baseline349: https://www.elderscrollsportal.de/ . Resource taxonomy explicitly distinguishes Skyrim Special Edition from original Skyrim. Actual Naiad Race SE resource3275, uploader member9748, history and screenshot attachment50788 retrieved. This expands XenForo methods with original-author versus converter attribution and real attachment evidence. RDSKY31034–040.

**Vicn / More Skooma**, https://vicnvicn.com/ , is an original Japanese creator host, not an editorial repost index. VIGILANT article blog-entry-5.html and the real Vicn author archive retrieved; explicit next page opened successfully. The article separates classic and SE/AE release links and credits the English voice addon independently. A familiar old filename does not establish current CMS technology. RDSKY31027–032.

**Team EC**, https://skyrimec.com/ , is useful for project news, release changes and named contributors. Its June30 2026 primary statement suspends the Main Quest overhaul, while continuing Saints & Seducers maintenance. Do not carry one project's status across every project from the same team. Both the suspension post and Patch1.1 post were opened fully. RDSKY31014–016.

Additional retrieved original scopes worth adding conditionally: **LoreRim / Modding Bungalo** https://www.lorerim.com/ ; **Lexy's LOTD** https://lexyslotd.com/ ; **The Phoenix Flavour** https://thephoenixflavour.com/ ; **The Modding Bordello** https://www.themoddingbordello.com/ ; **Wildlander Wiki** https://wiki.wildlandermod.com/ . These are nine retrieved new host/project scopes in total, not nine novel underlying parser technologies. Four further candidates remain partial or search-only: Confrérie des Traducteurs, Load Order Library, Let's Play with Fire and Licentia NEXT. Do not count these as working adapters. See structured priorities and evidence for every scope.

### Actual item and creator/profile inspections

#### Fuse00 public armor post on existing Patreon platform

Creator: https://www.patreon.com/cw/fuse00?l=en-GB . Actual post: https://www.patreon.com/fuse00/posts/aerion-tragaryen-167380083 . RDSKY31001–004.

Observed the technical body, seven ordered showcase-image links, separate creator-profile-picture link, creator byline, tags and `_Fuse00_ArmorAerion_1.1.rar`. Attachment href is `https://www.patreon.com/file?h=167380083&m=723186782`: post167380083 and attachment723186782 are concrete observed IDs. The creator image decoded. Following the attachment produced a signed CDN RAR redirect that this retrieval tool could not fetch. This establishes attachment discovery and failure, not archive transfer/integrity, and does not establish a login denial.

The creator homepage repeats its latest post teaser. Deduplicate by post identity rather than concatenating repeated responsive teasers into one body. Preserve creator avatar separately from the seven showcase links. No gallery completeness, original dimensions, animation or video acceptance. No Posts pagination traversal. Join/login UI observed but unperformed. The visible date says August22 without a rendered year; do not infer a timestamp from the post ID. Signed CDN query material omitted from public records.

#### Vicn VIGILANT and creator archive

Article: https://vicnvicn.com/blog-entry-5.html . Native author archive: https://vicnvicn.com/blog-entry-author/vicn . Page2: https://vicnvicn.com/blog-entry-author/vicn/page/2 . RDSKY31027–032.

Retrieved title, publication/update dates, version, long body with changelog/requirements/troubleshooting and distinct classic versus SE/AE links. The SE/AE link resolves Nexus11849. English voiced addon links are separate releases credited to Skyrim Voice Alliance; they must not be silently relabeled as Vicn files. Author archive exposes explicit next and page109 links, with page2 actually retrieved. No author avatar confirmed on the archive. Two header-area image links are insufficient to claim complete body gallery enumeration.

Vicn Nexus profile https://www.nexusmods.com/profile/Vicn?gameId=110 independently retrieved name, author role, avatar link and Track UI. Its current extracted About section is empty even though the search index exposes an About biography linking vicnvicn.com. Preserve the retrieval distinction. No Track action. The article's VR answer explicitly states lack of a VR environment and uncertainty; do not publish a verified SkyrimVR compatibility claim.

#### ElderScrollsPortal Naiad SE and converter profile

Resource: https://www.elderscrollsportal.de/ressourcen/naiad-race-se.3275/ . Profile: https://www.elderscrollsportal.de/mitglieder/shi-zon.9748/ . RDSKY31035–040.

The local resource byline labels **Shi Zon** as Autor while custom **Autoren** metadata and the description credit original author **Den987**. Shi Zon describes permission and conversion work. Model uploader/converter and original creator separately. Stable local resource3275 and member9748 are explicit URL identities.

The page exposes version1.1a, dates, full description/requirements,32 explicit attachment links numbered60–91 in tool output, attachment filenames/sizes/views and separate history/discussion navigation. `https://www.elderscrollsportal.de/attachments/hands-and-feets-i-jpg.50788/` decoded as the selected technical screenshot. This is one decoded attachment, not gallery completeness or a decoded member avatar. Member profile exposes activity/resources tabs and profile information; no actual avatar source or native-follow control confirmed by text extraction.

`/ressourcen/naiad-race-se.3275/download` redirects to Nexus166440?tab=description, which displays an adult-content-preferences wall. The local Download label therefore cannot be treated as a local archive URL. No preference changes or alternate access attempted. History shows a version row/link, but this is not binary acceptance.

#### Team EC news and team identity

https://skyrimec.com/news/saints-and-seducers-patch-11-released and https://skyrimec.com/news/main-quest-overhaul-suspending-development retrieved alongside the home/team section. The patch post has title/date, a release hero image and detailed changelog; the suspension statement is signed Catir. Team home provides member biographies and images, with some portraits hosted on GitHub avatars. Project mascot, release hero and member portraits are different image roles. This is a team/project identity surface, not a native member-profile system. No file archive, native follow or news pagination accepted. RDSKY31014–016.

### Discord provenance and boundary

Actual first-party Discord Discovery https://discord.com/servers/872252014002843658 retrieves **MODDING GUILD**, a stable server ID, distinct discovery banner and icon links, description, public member/online counters, establishment date and official `https://discord.gg/moddingguild` link. Counts differ across crawl snapshots and should not be treated as simultaneous live metrics. The invite fetch redirects to an inaccessible tool destination. This is a named community scope on existing Discord, not a new platform or evidence of channel/message extraction. RDSKY31007–008.

Official project pages also link: LoreRim → `https://discord.gg/bungalo` (Google Sites outbound redirect notice opened); Lexy → `https://discord.gg/r6ZJKZ9`; Phoenix → `https://discord.gg/BpwXX5f`; Bordello → `https://discord.com/invite/themoddingbordello`. The latter retrieves a one-line JavaScript shell; the other two fail at redirected invite fetch. No server join. No channel bodies, author message IDs, attachment access, member avatars, pagination or bot API claims follow from these links. RDSKY31006,010,013,026.

### Additional extraction distinctions

LoreRim provides creator Biggie Boss biography and a portrait distinct from screenshots; website-design credits UNCGAMING/WHISPERDEALER are different roles. Its site identifies Google Sites in the footer. No avatar/account ID or release archive acceptance. RDSKY31005–006.

Phoenix homepage advertises several lists, but the actual manual guide explicitly warns it is outdated/unusable and being reworked, with May17 2026 modification text. Old indexed Nexus marketing must not override that primary warning. Existing-guide navigation, dated body and official Discord target retrieved. RDSKY31011–013.

Bordello Team Mods is a public collective release index. Each card has title, summary, cover and matching creator-profile link; actual release bodies/files remain on Nexus. HerrSchtevie linked profile retrieved with avatar and Track controls, while About body is absent. The HOH overview currently retrieves navigation/wallpaper but lacks its indexed overview body; classify partial shell. RDSKY31022–026.

Wildlander wiki exposes extensive structured public navigation and content, but only home was inspected; no universal article-author/avatar recipe, direct archive or exact official invite target accepted in this pass. RDSKY31033.

### Failed, search-only and excluded leads

- Confrérie Inigo actual URL403. Primary indexed result separately credits Smartbluecat, five translators, testers and proofreader, but that is a lead rather than fetched-body extraction. Do not use an indexed development subdomain as a restriction workaround. RDSKY31041.
- ESKRIM Blogger homepage429; not retried. Named existing-Blogger scope only. RDSKY31042.
- Load Order Library Fahluaan exact list403. No parsing or profile method accepted. RDSKY31043.
- Let's Play with Fire inaccessible; fireundubh wiki index yields zero readable lines. RDSKY31044–045.
- Licentia NEXT home and exported load-order page are original-source search-only leads. No actual page retrieval accepted. RDSKY31046–047.
- Search surfaced legacyofthedragonborn.com but canonical ownership was not established through the inspected Nexus release. Its indexed version/runtime assertions differ from current primary surfaces; excluded pending provenance review.

No undocumented endpoint, CSS selector, transformation to original media, generic CMS assumption or successful authenticated behavior is inferred from these observations. Broad searching found more named profiles on existing services; the useful publication unit is the distinct source and extraction boundary, not a padded service count.
