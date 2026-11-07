# Sims 4 creator, mod and custom-content ecosystem

[Adapter laboratory](../README.md) · [Identity, body, media and follow contract](../author-post-media-contract.md) · [Validation gate](../validation-and-adoption.md)

**Checked October 28, 2026 UTC (October 27 in America/Denver).** This pass records public first-party page inspection across 32 services/scopes, including creator-owned release sites and compatibility references. It does not establish 32 functioning adapters. The public subpass did not authenticate an account, change follows, download a mod binary or accept full extraction. A subsequent [Mod Collective browser fixture](../mod-collective.md) verified one signed-in free download, body extraction, three gallery images and the linked creator avatar.

## What the public inspection established

Sixteen services have detailed page observations below. Actual item and creator/profile routes were opened where exposed. Two content previews actually displayed: a SimsFinds JPEG and a SnootySims PNG. Link presence, page-readable text, media loading, authenticated access and accepted extraction are separate states. No video/GIF playback was validated. No creator-avatar decode was accepted in this public subpass; the subsequent Mod Collective receipt records a separate successful decode.

The attempted anonymous Python retrieval was denied before a response. This subpass therefore used retrieved first-party pages and small-field transcription. The field locations below identify observed headings, labels and links; they are **not guessed CSS selectors or embedded JSON paths**. A real parser must acquire permitted DOM/schema fixtures before implementation.

### High-value failures to preserve

- Mod Collective’s text retrieval exposed an Avatar image label whose observed URL ends in `.null`; that specific fetch failed. A later authenticated browser fixture decoded the sampled avatar, so this is a source-bound retrieval failure, not a universal avatar outage. Its visible `ImageObject.creator.name` strings name creations and cannot identify the human account.
- The MTS Creator image is a generic `paint.gif` role badge. The AML profile-adjacent Image link opened a theme pattern. A Simszoo post Image link opened a Sims logo. None is an author avatar.
- WCIF landing pages expose many search rows while `/creators` remains “Loading creators”; rows explicitly say “No Preview Image”. Index metadata is not an ingested creator post.
- SimsFinds post text includes Show More, a blank Published field in this retrieval, download wait text and a separate tracked Patreon link. A single preview loading does not establish complete content or downloads.
- Around the Sims returned Pharmacy/Drugstore body under a retrieval metadata title saying Nail salon furniture. TSR live index labels and returned creation identity also diverged. Preserve actual resolved IDs/URL/body identity.
- Simszoo download action redirects to MediaFire and failed there. Download record, outbound host and file binary are distinct objects.
- The Russian sims-new item visibly substitutes users-only notices for file regions; the homepage separately announces no more updates/support. Do not erase either limitation.

## Service coverage

| Entry ID | Service | Role and observed access |
|---|---|---|
| `modcollective` | [Mod Collective](https://www.modcollective.gg/sims4) | page-observed; Marketplace combines free, early-access and membership content; real creation and artist pages were opened. |
| `simsfinds` | [SimsFinds](https://www.simsfinds.com/) | page-observed; Actual creation, creator profile and public preview image inspected; listing text and downloadable entitlement are separate. |
| `aml-name` | [Adult Mods Localized](https://aml.name/forums/topic/4957-zlye-prihoti-18-nswf/) | page-observed; Russian Invision community; inspect neutral author, pagination, hidden-section and attachment structure only; no explicit material retained. |
| `f95zone` | [F95zone](https://f95zone.to/threads/the-sims-4-nsfw-modding.73299/page-681) | retrieval-failed; Exact requested page returned non-retryable error. No body, identity, media or login-only classification established. |
| `loverslab` | [LoversLab](https://www.loverslab.com/files/category/161-the-sims-4/) | retrieval-failed; Category and homepage failed non-retryably. Existing adapter research must remain baseline; no new authenticated or media acceptance. |
| `wcif` | [WCIF.cc](https://wcif.cc/) | page-observed; Home, category landing search, creator directory and sign-in page inspected. Search rows can exist while creator directory remains an empty loading shell. |
| `plumbdex` | [PlumbDex](https://www.patreon.com/gametimedev/posts/small-update-for-168780169) | page-observed; Creator describes PlumbDex as mod-file information/community/discovery database without file hosting. Preserve retained baseline development origin dev-pd.gametimedev.de and specialist guide; fresh directory/profile/wiki web retrieval attempts failed in this subpass. |
| `ts4-rebels` | [TS4 Rebels](https://ts4rebels.cc/) | retrieval-blocked; Initial restricted-fetch error and later explicit robots.txt fetch denial. No current files, body, profiles, avatars or access entitlement inspected. |
| `simszoo` | [Simszoo](https://www.simszoo.de/) | page-observed; German WoltLab community with Sims 4/3/2 downloads; actual file record and limited member profile opened. |
| `mod-the-sims` | [Mod The Sims](https://modthesims.info/downloads/ts4/) | page-observed; Actual scripting-mod record, file table and numeric creator profile inspected. Archive filenames and internal script files have separate identities. |
| `tsr` | [The Sims Resource](https://www.thesimsresource.com/downloads/browse/category/sims4/skipsetitems/1/) | page-observed; Real creation and Jolea profile opened; source text includes placeholder account/menu/download dialogs that must not be mistaken for an authenticated session. |
| `sims4studio` | [Sims 4 Studio Forum](https://sims4studio.com/) | retrieval-failed; Homepage timed out twice; custom-content board inaccessible. Tool/site provenance remains separate from an accepted forum collector. |
| `simsworkshop` | [SimsWorkshop](https://simsworkshop.net/resources/categories/the-sims-4-mods.9/) | retrieval-blocked; First-party search excerpts show XenForo resources and unmaintained labels, but actual opens failed robots-unreachable/403. No post/profile extraction accepted. |
| `sims4updates` | [Sims 4 Updates](https://sims4updates.net/) | page-observed; Broad finds archive whose currently exposed newest entries date April 5 2022; distinguish archive discovery from current mod compatibility. |
| `sims4downloads` | [Sims 4 Downloads](https://sims4downloads.net/) | page-observed; Separate finds archive; latest observed entries also April 2022. Preserve separate source record even where both sites index same creator work. |
| `sims4-cc` | [SIMS 4 CC](https://sims4.cc/) | page-observed; First-party about page states directory-only operation and no file hosting; detail and creator directory routes verified. |
| `sims4mods-cc` | [Sims4Mods CC database](https://sims4mods.cc/) | retrieval-blocked; Search discovery advertised creator-linked catalog; direct first-party homepage returned 403. No detail/profile/body acceptance. |
| `sims-catalog` | [The Sims Catalog](https://thesimscatalog.com/sims4/) | page-observed; Actual item shows full Description separately from short teaser, gallery links, creator facet and external-host download warning. |
| `simsdom` | [SimsDom](https://www.simsdom.com/) | page-shell; Current homepage exposes wallpaper/Halloween navigation and cookie policy; original rich Sims catalog not established. Do not silently merge identities with SimsFinds. |
| `sim-file-share` | [Sim File Share](https://simfileshare.net/support/faq/) | page-observed; Official FAQ says downloads do not require accounts, uploads do; no global browse/listing even after login. Follow original creator links to scoped public files/folders. |
| `around-the-sims` | [Around the Sims](https://sims4.aroundthesims3.com/) | page-observed; Legacy Sims4 subdomain redirects to aroundthesims4.com. Valuable bilingual static catalog archetype: per-item free files, donor bundles and creator-specific terms. |
| `syboulette` | [Syboulette CC](https://s4cc.syboulette.fr/) | page-observed; Creator-owned site describes Patreon early access, later free releases and paid direct-link library. Homepage body loaded; Free Downloads route returned 404. |
| `lot51` | [Lot 51](https://lot51.cc/) | page-observed; Independent scripted-mod release catalog exposes versions/dates and support routes. Useful release/project distinction; no detail parser/API or author-avatar acceptance. |
| `scarlets-realm` | [Scarlet’s Realm](https://scarletsrealm.com/the-mod-list/) | page-observed; Compatibility/status discovery reference with public and patron editions; not a mod-file host. Preserve patch-specific status/source time separately from download availability. |
| `maxis-match-cc-world` | [Maxis Match CC World](https://maxismatchccworld.tumblr.com/) | page-observed; High-value Sims Tumblr reblog/finder archetype; actual post and original creator blog opened. Curator, original author and file-host roles all differ. |
| `sims-new` | [sims-new](https://sims-new.my1.ru/) | page-observed; Homepage announces no further additions/support after image-host cost changes. Existing large Russian archive remains discoverable; actual item hides download regions from guests. |
| `sims3pack` | [Sims3Pack.ru](https://sims3pack.ru/sims-4/) | page-observed; Russian Sims community catalog exposes separate Sims 4 clothing/build/mod/program categories. Listing observed only; no original-author rights or current file compatibility acceptance. |
| `luniversims` | [L’UniverSims](https://luniversims.fr/) | retrieval-failed; Homepage timed out and guessed Sims4 category could not be opened. Current detail/profile/media/account states not verified. |
| `snootysims` | [SnootySims](https://snootysims.com/) | page-observed; Current first-party landing advertises creator follow/favorites and direct-hosted sets alongside outbound finds. Real paid-early-access set inspected. |
| `sims-community` | [Sims Community](https://simscommunity.info/) | page-observed; Editorial/discovery hub with Sims mod/CC navigation; useful original reporting and creator discovery, not established universal mod-file hosting. |
| `sims4modhub` | [Sims 4 Mod Hub](https://sims4modhub.com/) | page-observed; Category directory and upload entry point visible. Original author/file provenance must be verified per item before trusting reindexed content. |
| `mccc-project` | [MC Command Center project site](https://deaderpool-mccc.com/) | page-observed; Creator-maintained supported-public-release and documentation/support hub. Retained as valuable release archetype, not another multi-creator community. |

## Detailed public-page observations

### Mod Collective

**Later verified result:** the [dedicated workbench](../mod-collective.md) records signed-in DOM extraction and a completed free download for the same creation. The following entries retain the earlier public-tool results, including its avatar-fetch failure.

**[Royal Dining Room Wallpaper by Philo](https://www.modcollective.gg/sims4/details/creation/philo-royal-dining-room-elegant-wallpaper)** — SIMS002; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: Rendered H1, line 11 of initial detail retrieval; body: About tab text after tabs; initial lines 34–35; creator: Created by -> Philo -> /sims4/artist/philo; files: Rendered 1 FILES and 1 VERSIONS sections, lines 68–83; identity: creationID label, line 106.

Body: About text and file/version labels visible; actual file URLs and full comments not established. Identity/avatar: Artist linked separately; creator ID slug philo. Avatar belongs to artist profile, not wallpaper preview.

Media: Three detail image links observed. One image request failed. GIF/video presence and full-gallery coverage unverified. Files: One free-access file and one version visible; binary URL absent in retrieved text.

Follow: Artist profile displays Follow and Followers; source action/import untested. Access: Guest-readable post. Membership/download behavior requires browser fixture.

Remaining gap: Files tab first retrieval omitted file rows; later retrieval exposed them. Preserve partial initial state.

**[Philo — Amazing Artist](https://www.modcollective.gg/sims4/artist/philo)** — SIMS003; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: profileName: Rendered Philo Amazing Artist heading; avatar: Image: Avatar link, line 52; imageMetadata: Rendered linked ImageObject.contentUrl and creator.name JSON, lines 112+; creator.name here names a creation, not the human author.

Body: Profile, join date, counts, specialty and creation list visible; not a complete history. Identity/avatar: Avatar link resolves to images.modcollectivegg.com/6117e75a-3a6f-4a0d-8709-250c5d283331.null?format=auto&width=128; retrieval failed.

Media: Avatar was not decoded. ImageObject creator.name values describe content titles; do not resolve account identity from them. Files: Profile lists creations; no downloaded files.

Follow: Follow label and follower count present; do not equate with paid ClubMOD. Access: Public profile.

Remaining gap: No avatar acceptance; cached retrieval listing dates vary.

### SimsFinds

**[Robin Hair — RIGHT](https://www.simsfinds.com/downloads/407711/robin-hair-right-sims4)** — SIMS005; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: H1 line 145; description: Text line 151 plus separate Patreon paragraph line 157, each followed by Show More; image: Image link line 149; download: Download labels lines 166–170 with wait/Premium message.

Body: Description paragraphs visible, but Show More remains and published timestamp is blank in this retrieval. No complete-body assertion. Identity/avatar: Post links Patreon SonyaSims through outbound tracking; creator profile independently opened.

Media: JPG https://img.simsfinds.com.br/downloads/2026/10/09/33eada95fcfe6ca11e91a94937a2148b-big.jpg actually displayed. It is content preview, not avatar. No animation/video established. Files: Download timer text; no file URL or binary acceptance.

Follow: Account creation offered to save favorites/lists. This is not verified native creator-follow mutation. Access: Guest detail available; download wait and Premium skip visible.

Remaining gap: Non-www request failed; www route succeeded. Do not interpret a successful tracked Patreon link shell as downloaded post.

**[SonyaSims — SimsFinds](https://www.simsfinds.com/sonyasims)** — SIMS006; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: name: H1 SonyaSims, line 43; bio: Line 47; recommendations: Simmers also follow section lines 32+; history: Creation labels and paid flags lines 49–102.

Body: Creator bio and partial list exposed; no complete history. Identity/avatar: Canonical profile slug sonyasims. No avatar source exposed in retrieved profile text.

Media: No profile image was identified as avatar. Files: Paid labels visible; files remain untested.

Follow: Simmers also follow is a recommendation label; exact relationship control/import not exposed. Access: Public profile.

Remaining gap: No numeric creator ID or avatar mapping proven.

### Adult Mods Localized

**[Requested Sims 4 topic — neutral structure](https://aml.name/forums/topic/4957-zlye-prihoti-18-nswf/)** — SIMS008; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: author: By Just -> /profile/214-just/, line 113; follow: Sign in to follow this and follower count lines 108–110; pagination: Page 1 of 10, lines 124–132; body: Recommended Posts plus extensive structured sections, spoiler/hidden labels and external links.

Body: Extensive public first-page text retrieved; ten topic pages and hidden/spoiler sections prevent complete-topic assertion. Identity/avatar: Topic author Just resolves profile ID 214; repliers remain separate accounts.

Media: Images/hidden sections observed as structure only; no explicit image opened or stored. The inspected profile Image link was a site theme pattern, not avatar. Files: Many external file-host links; no attachment binaries or entitlement accepted.

Follow: Native topic follow requires sign-in. Profile separately shows followers; topic and user following are different objects. Access: Guest topic; https://aml.name/login/ login form was actually opened.

Remaining gap: Do not promote hidden labels or plain URLs into complete attachments.

**[Just — Adult Mods Localized](https://aml.name/profile/214-just/)** — SIMS009; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: name: Profile H1 line 82; followers: 113 Followers heading line 106; activity: Activity entries with source topic links lines 149+.

Body: Public profile summary/activity readable, not complete account history. Identity/avatar: Member 214; account display name Just. Avatar unverified.

Media: Clicked generic Image resolved uploads/set_resources_3/..._pattern.png; this is theme/background and must be rejected as avatar. Files: Activity links do not constitute downloadable files.

Follow: Follower heading observed, no mutation/import executed. Access: Public profile; login options shown.

Remaining gap: Avoid storing unnecessary personal information or account activity.

### WCIF.cc

**[Sims 4 Hair CC](https://wcif.cc/lp/hair)** — SIMS014; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: searchRows: Rendered H4 item titles and H5 shared-by names, lines 88+; media: No Preview Image per row; filters: Sources and Free Accessible/paywall controls lines 14–82.

Body: Many result rows retrieved; rows are index metadata, not the creator post body or complete history. Identity/avatar: Shared-by creator labels are unresolved identities; creator directory says Loading creators.

Media: No Preview Image explicitly shown. Do not fabricate thumbnails or avatars. Files: Download from Patreon labels lack exposed URLs in this text; hosted-only route separately returned shell.

Follow: Homepage advertises discovering/following creators; native follow/import unverified. Access: Public search; actual login https://wcif.cc/auth/signin.

Remaining gap: No exact post route, account ID or underlying JSON API verified.

### PlumbDex

**[GameTimeDev PlumbDex announcement](https://www.patreon.com/gametimedev/posts/small-update-for-168780169)** — SIMS018; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: announcement: Plans for the next weeks heading and paragraph lines 133–148; profile: GameTimeDev creator links, lines 103–105.

Body: Public announcement body readable; plans are not proof that service features shipped. Identity/avatar: GameTimeDev is announcement author. No PlumbDex account/profile tested in this subpass; retained specialist guide has earlier public observations.

Media: Creator profile picture link visible on Patreon; not fetched. Files: Author explicitly describes metadata storage without downloadable-file hosting.

Follow: Patreon Join for free is membership, not a verified PlumbDex follow. Access: Public announcement; no new PlumbDex login URL established in this subpass; retain earlier specialist-guide follow/account evidence.

Remaining gap: Do not use guessed plumbdex.com. Retained baseline identifies dev-pd.gametimedev.de; this subpass could not re-open those exact routes.

### Simszoo

**[S4-Herbstbild 2026](https://www.simszoo.de/filebase/file/5597-s4-herbstbild-2026/)** — SIMS022; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: H1 line 32; author: Chalipo link line 34; body: Overview text lines 45–55; version: Version 1.0.0 line 59; download: Download link /filebase/download/5608/.

Body: Overview, requirement and version exposed; no complete profile/history. Identity/avatar: Member profile /user/388-chalipo/ opened; explicitly limits who may view full profile.

Media: Post Image link clicked later resolved a Sims4 symbol, not painting preview; do not label every post-adjacent image gallery content. Files: Download action redirected to MediaFire S4-Bild-Herbst_2026.rar and failed retrieval; external-host provenance preserved.

Follow: No follow control observed. Access: Guest overview and limited profile; https://www.simszoo.de/login/ form opened.

Remaining gap: No file bytes; profile restriction must survive login retries.

### Mod The Sims

**[Straight to Pajamas — V.1.3 Update](https://modthesims.info/d/701054/straight-to-pajamas-v-1-3-update.html)** — SIMS026; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: body: Overview requirements/installation/compatibility sections lines 126–147; files: Filename/Type/Size table lines 150–153; Files link lines 170–172; author: Author -> SuoSoup, lines 191–195; images: SCREENSHOTS filenames and dimensions lines 112–116.

Body: Overview, requirements, compatibility, installation and file names visible; comments say Loading comments. Identity/avatar: Author resolves /m/10426623; Creator icon /images/icons/paint.gif is a role badge, not an avatar.

Media: Two JPEG screenshot filenames/dimensions visible; no full-resolution screenshot loaded. GIF fetch for role badge rejected unsupported content-type. Files: ZIP archive linked on chii.modthesims.info; internal .ts4script row size 8770. File bytes untested.

Follow: Thanks and Favourited counts visible; author follow not proven. Access: Guest detail and creator profile readable; sign-in form embedded.

Remaining gap: Keep page-title version, stated compatibility and artifact version distinct.

### The Sims Resource

**[SIM inspired by Inde Navarrette](https://www.thesimsresource.com/downloads/details/category/sims4-sims-female-youngadult/title/sim-inspired-by-inde-navarrette/id/1795813/)** — SIMS029; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: creator: Created By -> Jolea lines 564–568; fileMetadata: Published, Downloads and 263 KB lines 570–574; requirements: Required downloads panel versus note that a separate additional list is not required; profileId: Jolea profile heading exposes (7645121).

Body: Creation body and dependency labels visible; lazy/hidden content and download dialogs remain. Identity/avatar: Creation ID 1795813; creator member ID 7645121; Germany flag is not avatar.

Media: Creation media links present but no gallery playback/load verification. Files: 263 KB metadata and required-download count visible; no binary downloaded.

Follow: Jolea profile has Follow control; Artists I Follow menu present. No action/import. Access: Public page; Sign In and account placeholder menus both appear, so menu text is not authentication proof.

Remaining gap: Index label/link target diverged during live retrieval. Record actual returned creation, not original index label.

### Sims 4 Updates

**[Chain Skirt at My Stuff Origin](https://sims4updates.net/clothing/chain-skirt-at-my-stuff-origin/)** — SIMS035; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: Rendered heading lines 94–96; preview: Image link line 98; body: Summary lines 100–102; outbound: Download -> www.mystufforigin.com line 104; date: Filed Under/Tagged With date line 108.

Body: Short index summary is readable; original creator post body is external. Identity/avatar: Credited My Stuff Origin; creator tag is not numeric account/profile.

Media: One preview image link; not media-loaded. Files: External Download link, no host file metadata or binary.

Follow: Unobserved. Access: Public index post.

Remaining gap: Do not claim creator avatar/profile or native follow from a tag page.

### Sims 4 Downloads

**[Chain Skirt from My Stuff Origin](https://sims4downloads.net/chain-skirt-from-my-stuff-origin/)** — SIMS037; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: H1 line 19; body: Lines 23–25; creatorLink: More from My Stuff Origin line 28; date: Category/tags line 30.

Body: Index summary only; original creator body is not ingested. Identity/avatar: Creator credit and taxonomy link; no verified account ID/avatar.

Media: One image link, no decode test. Files: External Download here link.

Follow: Unobserved. Access: Public archive.

Remaining gap: Duplicate subject across indexes must link as independent observations of original creator work.

### SIMS 4 CC

**[Edible Wedding Cake and Toppers](https://sims4.cc/download/edible-wedding-cake-and-toppers-by-around-the-sims-4/)** — SIMS039; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: H1 line 9; creator: by Around the Sims 4 line 11; creator link /creators/around-the-sims-4/; summary: Description paragraph line 13; access caveat line 14; attributes: Price/Creator/Category/Hosted on/Added/Updated/Link lines 16–29; outbound: Get it on aroundthesims4.com line 30.

Body: Editorial index summary and source-check status visible; no creator post ingestion. Identity/avatar: Creator page is directory listing, not proved creator-controlled account. No avatar exposed.

Media: Preview Image link observed, not loaded. Files: Outgoing original-host link; individual free downloads versus donor bundle stated as directory summary, not tested entitlement.

Follow: No follow control observed. Access: Public detail and /creators/pralinesims/ page opened.

Remaining gap: A directory Checked and working label is not independent verification of original file.

### The Sims Catalog

**[Halloween Wallpapers](https://thesimscatalog.com/sims4/downloads/build-mode/wallpapers/halloween-wallpapers/)** — SIMS044; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: H1 line 126; creator: BY MDE line 128 -> creator facet query; gallery: Eight Image links line 123; fullBody: Description section lines 142–157, separate from teaser line 132; outbound: Download from Creator lines 174–196; listingKey: SKU line 138.

Body: Full visible Description differs from short teaser; neither is original external host body. Identity/avatar: MDE creator facet /all-downloads/?post_type=product&tsc_creator=MDE opened; not a verified profile account/avatar.

Media: Eight gallery links observed; no gallery image decoded. Files: External hosted file; Download from Creator button and leaving-site dialog.

Follow: Add to Favourites and Add to Collection visible; creator follow not established. Access: Public item; actual WordPress login route opened.

Remaining gap: Do not normalize favorites/collections into creator follows.

### Around the Sims

**[Pharmacy/Drugstore content; metadata title says Nail salon furniture](https://aroundthesims4.com/objects/room_community_53.shtml)** — SIMS051; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: bodyIdentity: Rendered Pharmacy/Drugstore line 39 differs from retrieval title Nail salon furniture; access: Donators privilege and per-file free download statement lines 41–43; creator: Per-object designed by Sandy lines 47+; gallery: Object-specific Image: Pharmacy links lines 49+; policy: Terms of Use lines 170–179.

Body: Bilingual item descriptions and upload dates visible; download URLs were not exposed by text retrieval. Identity/avatar: Creator credit Sandy repeats per item; no account/profile/avatar.

Media: Per-item images linked. No gallery fully loaded. Files: Source states free individual files, donor whole-set convenience; bytes and member entitlement untested.

Follow: No native follow observed; external Patreon early access separately linked on homepage. Access: Guest item page.

Remaining gap: Metadata title/body identity mismatch requires body-aware matching. Do not label donor bundle as only available file.

### Maxis Match CC World

**[Rindle House reblog on Maxis Match CC World](https://maxismatchccworld.tumblr.com/post/745485207111680000)** — SIMS056; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: sourceAuthor: qubedesign name/link line 6; gallery: Eleven ordered image links lines 7–27; provenance: Reblogged from and Originally from line 42; files: SFS and CurseForge links lines 33–37; notes: Notes count and note continuation lines 44+ and 135.

Body: Visible reblog body and original attribution readable; note continuation and creator history incomplete. Identity/avatar: Curator maxismatchccworld and origin qubedesign distinct; original creator page opened. No avatar confirmed.

Media: Eleven image links observed, no gallery decode or NPF JSON inspected. GIF/video in other posts not ruled out. Files: Creator links both CurseForge and SFS; SFS page failed. No binary.

Follow: Theme Follow my Instagram is external; Tumblr native follow/import not verified in this pass. Access: Public themed post and original blog.

Remaining gap: Do not treat reblog curator as content author or post note list as follow list.

### sims-new

**[BUDAPEST Set by lilis-palace](https://sims-new.my1.ru/publ/ctroitelstvo_v_sims_4/okna_dveri_i_arki/nabory_dlja_stroitelstva_124_budapest_set_by_lilis_palace/48-1-0-78463)** — SIMS059; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: body: Title/date/package format lines 53–55; sub-set headings/counts lines 57–79; hidden: Repeated users-only notices lines 59+; uploader: Added by Helen line 91; login: Guest email/password form lines 98–105.

Body: Set headings/counts visible; repeated users-only placeholders replace links/content. Incomplete guest body explicitly retained. Identity/avatar: Credited original creator lilis-palace differs from uploader Helen. No verified numeric account/profile/avatar.

Media: Product previews absent from retrieved body; global site icons are not post media. Files: Users-only download regions; no file links/bytes accepted.

Follow: RSS link exists; native creator follow not observed. Access: Guest login form embedded; exact item is priority authorized-login return URL.

Remaining gap: Archive shutdown statement and hidden links are independent limits.

### SnootySims

**[Tumbly Set](https://snootysims.com/cc-downloads/snootysims-tumbly-set/)** — SIMS063; page observed, fields transcribed, full extraction/authentication/acceptance absent.

Field sources: title: H1 line 16; body: Description line 18 and Inside the Tumbly Set list lines 29–37; entitlement: Early access/date/12MB RAR lines 20–27; creator: Hosted directly and Created by SNOOTYSIMS line 27; authDocumentation: Embedded privacy section says Clerk, lines 103–105.

Body: Visible body, item list and installation instructions readable; paid file bytes not accessible in this pass. Identity/avatar: Creator label SNOOTYSIMS; no avatar exposed. Miliniki creator link opened but resolved search results, not a profile.

Media: Tumbly PNG https://snootysims.com/wp-content/uploads/2026/10/SNOOTYSIMS-Tumbly-Set-04.png actually displayed. Other promotional images are separate from set gallery. Files: 12 MB RAR metadata; paid Premium until November 4 2026; download not attempted.

Follow: Landing says save favorites and follow creators; no native relationship control/import accepted. Access: Guest body with paid entitlement gate; login/sign-up controls visible, site-owned policy says Clerk.

Remaining gap: Date reaching release does not authorize assuming access; recheck actual download state.

## Login and access verification queue

Use the [secure interactive login workflow](../authenticated-research.md) for authorized account access. Exact item return URLs matter. A blocked guest fetch does not establish that login will help, and a login cannot override profile privacy or paid entitlement. Use existing authorized access; do not purchase access, bypass anti-bot/robots controls or move credentials into research files.

| Priority | Exact URL | Observed reason |
|---|---|---|
| 1 | [Return page](https://f95zone.to/threads/the-sims-4-nsfw-modding.73299/page-681) | Browser site-safety policy denied navigation before login. Do not retry through alternate surfaces or bypass. Preserve blocked-policy state. |
| 2 | [Return page](https://www.loverslab.com/files/category/161-the-sims-4/) | Browser site-safety policy denied navigation before login. Do not retry through alternate surfaces or bypass. Preserve blocked-policy state. |
| 3 | [Return page](https://ts4rebels.cc/) | Explicit robots fetch denial; no bypass. Use legitimate permitted browser only if allowed. |
| 4 | [Return page](https://sims-new.my1.ru/publ/ctroitelstvo_v_sims_4/okna_dveri_i_arki/nabory_dlja_stroitelstva_124_budapest_set_by_lilis_palace/48-1-0-78463); [observed login](https://sims-new.my1.ru/) | Actual item displays users-only hidden regions and login form. |
| 5 | [Return page](https://aml.name/forums/topic/4957-zlye-prihoti-18-nswf/); [observed login](https://aml.name/login/) | Native topic follow sign-in gated; compare authorized body without retaining explicit content. |
| 6 | [Return page](https://wcif.cc/creators); [observed login](https://wcif.cc/auth/signin) | Creator directory loading shell; distinguish client hydration from account requirement. |
| 7 | [Return page](https://www.modcollective.gg/sims4/details/creation/philo-royal-dining-room-elegant-wallpaper) | Verify actual public/free download and artist follow; no exact standalone login route observed. |
| 8 | [Return page](https://snootysims.com/cc-downloads/snootysims-tumbly-set/) | Premium early-access entitlement; use already-authorized account only, no purchase. |
| 9 | [Return page](https://www.simszoo.de/user/388-chalipo/); [observed login](https://www.simszoo.de/login/) | Profile privacy restriction; login may still not authorize full profile. |
| 10 | [Return page](https://www.simsfinds.com/sonyasims) | Verify source creator-follow and avatar; exact standalone login route not observed. |
| 11 | [Return page](https://thesimscatalog.com/sims4/downloads/build-mode/wallpapers/halloween-wallpapers/); [observed login](https://thesimscatalog.com/sims4/account-login/) | Favorites/collections controls; creator facet is not a follow. |
| 12 | [Return page](https://www.thesimsresource.com/members/Jolea/) | Actual Follow control; no mutation without explicit authorization. |

## Implementation decisions and rejected alternative

Prefer creator-origin content and retain every intermediary as a separate provenance node. A directory listing, reblog, uploader, original creator, project release and hosted file must not collapse into one author/post. Accept missing avatars explicitly. Keep `.package`, `.ts4script`, archives, sets, lots and dependencies separate from media. Preserve access state and publication/update/version fields independently.

Reject a universal title/thumbnail scraper as the default implementation: these observed pages contain excerpts, hidden regions, moving link identities, placeholders, external hosts, generic role icons and entitlement boundaries. Site-specific parsing costs more maintenance but can preserve complete accessible content and correct identity. The alternative remains acceptable only for an explicitly labeled discovery-only card that makes its partial state clear.

Use common platform adapters where evidence supports them: Tumblr for reblog provenance, WordPress for relevant independent sites, Invision for AML/LoversLab where permitted, and WoltLab for Simszoo. These are reuse candidates, not proof that one selector set works across installations. No API endpoint, rate limit, direct-file URL construction, native follow mutation or account import was invented.

Acceptance requires permitted real DOM/JSON fixtures, correct account/avatar mapping, complete accessible body and ordered media parity, full gallery/media loads, authorized file delivery, continuation/edit handling and access-boundary tests. Preserve the current target baseline; these findings alone do not justify target application changes.

## Source register identifiers

The machine-readable companion contains each primary source URL, observed title/retrieval result, original notes and detailed evidence. The following source IDs are included in the [source register](../../../data/sources.json); failed/shell sources remain registered as failures, not promoted to successful extraction:

SIMS001, SIMS002, SIMS003, SIMS004, SIMS005, SIMS006, SIMS007, SIMS008, SIMS009, SIMS010, SIMS011, SIMS012, SIMS013, SIMS014, SIMS015, SIMS016, SIMS017, SIMS018, SIMS019, SIMS020, SIMS021, SIMS022, SIMS023, SIMS024, SIMS025, SIMS026, SIMS027, SIMS028, SIMS029, SIMS030, SIMS031, SIMS032, SIMS033, SIMS034, SIMS035, SIMS036, SIMS037, SIMS038, SIMS039, SIMS040, SIMS041, SIMS042, SIMS043, SIMS044, SIMS045, SIMS046, SIMS047, SIMS048, SIMS049, SIMS050, SIMS051, SIMS052, SIMS053, SIMS054, SIMS055, SIMS056, SIMS057, SIMS058, SIMS059, SIMS060, SIMS061, SIMS062, SIMS063, SIMS064, SIMS065, SIMS066, SIMS067, SIMS068, SIMS069, SIMS070, SIMS071.

## Round two: concrete methods

[Cross-site method index](../methods-round2.md) · [Sanitized method evidence](../../../experiments/site-adapter-discovery/method-research-round2-2026-10-28.json). Source IDs with historical S2K/M2C/S2S prefixes are published as SKYB/MCB/SIMB; original IDs remain in the manifest.

Checked October 28, 2026 UTC. User-facing date: October 28, 2026 America/Denver.

This is an additive research handoff. It preserves the prior catalog and the stronger Mod Collective browser receipt. No shared repository file was changed by this pass.

**20 independent-site candidates**, including 14 with readable first-party pages; 17 inspected scopes; 18 implementation recipes; 75 source records. Two precise images displayed: one CurseForge-linked KimikoSoma profile avatar and one Ravasheen content preview. No authentication, account mutation, full extraction, binary validation or new adapter acceptance.

### Findings that change implementation

- Translation sites add valuable creator discovery and require separate original-author, translator, publisher and dependency roles. ModSims4's article links the translation project and KimikoSoma profile; the profile points back to the original site. Istolia independently separates original mod, translation, XML Injector and screenshot credits.
- Ravasheen's item needs the detailed sections after its short Description. The four gallery identities appear twice each, in source order 2, 4, 3, 1. Store placement order and distinct gallery identities separately.
- LittleMsSam and Sims4Me publish useful table-based catalogs. A project may be a row inside a category page; URL-only identity can collapse distinct mods. Preserve multiline module notes, required packs and named translator credits.
- BrazenLotus's flattened Wix page includes incompatible status templates together. Require visible-state evidence before assigning retired, broken, functional or coming-soon status.
- Scumbumbo's maintained site separates original author, named updater and maintenance group. Its current version 4.2 is distinct from the old MTS version 2 download.
- SimRealist separates news writer, team and project publisher. Its itch.io creator page also has collections of other creators' projects; collections are not ownership.
- PandaSama's public article, comment subscription, related paid diary and actual release page are separate scopes. A signed image returning 403 does not establish a paywall or prove expiry.
- WCIF still exposes search rows while its creator directory remains a loading shell. PlumbDex and TS4 Rebels fresh requests failed; earlier working evidence is retained.

### Newly discovered independent sites

| Candidate | Role | Actual retrieval outcome |
|---|---|---|
| [Mod Sims 4](https://modsims4.fr/partenaires/) | French translation community and original editorial | page-observed; Creator/translator article and partner graph; not an original-mod ownership claim. |
| [Candyman Gaming](https://www.candyman.fr/) | French translation/editorial archive | page-observed; Retain unavailable-download declaration. Current date in site header is not article date. |
| [L’Assemblée des Sims4](https://www.lassembleedessims4.com/mods) | French mod discovery directory | page-observed; Creator-linked cards and pagination; selected actual detail404. |
| [Istolia Création](https://istoliacreations.com/) | Creator builds, rooms and French translation site | page-observed; Actual translation article, original-mod/dependency links and creator-owned about page. |
| [Ravasheen](https://ravasheen.com/downloads/) | Independent functional-CC and creator-tool catalog | page-observed; Actual item, creator description and source-hosted preview; one image displayed. |
| [LittleMsSam creator hub](https://www.lms-mods.com/) | Independent structured mod catalog | page-observed; Creator table has two provider download columns and translator-specific update notes; itch.io profile is an existing-provider scope. |
| [BrazenLotus](https://www.brazenlotus.com/mod/core-mod) | Independent modular mod/recipe catalog | page-observed; Wix shell emits contradictory status templates; require visible-state fixture before status extraction. |
| [TwistedMexi](https://twistedmexi.com/Mods/) | Independent mod release directory | page-observed; Master Mods route observed in turn246view5; all listed releases link Patreon. Patreon creator is not a new service. |
| [Scumbumbo maintained mods](https://scumbumbomods.com/xml-injector) | Community-maintained mod archive | page-observed; Original author, named updater and site maintenance group are separate roles. |
| [SIMcredible Designs](https://sims4.simcredibledesigns.com/) | Independent team CC catalog | page-observed; Iframe body and team outbound profiles inspected; image-heavy navigation obstructs full item extraction. |
| [Sims4Forum](https://sims4forum.com/custom-content/) | Independent forum and resource community | page-observed; Neutral resource/profile links404; adult sections not reproduced or inspected as content. |
| [SimRealist](https://www.simrealist.com/post/simrealist-mod-status-the-sims-4-patch-october-27-2026) | Independent mod team, patch news and distribution hub | page-observed; Separate writer, team members, compatibility post and itch.io project/file records. |
| [Sims4Me hosted by seebee](https://www.seebee.de/sims4me/index.php?lang=en) | Independent modular creator catalog | page-observed; Actual target is a table row inside category URL. Current creator notice says updates may be available only on CurseForge. |
| [PandaSama](https://www.pandasama.com/art-deco-cc-pack/) | Independent CC/mod release and diary site | page-observed; Article, attempted author route and long release instructions opened. Author route redirects home. |
| [Simscave](https://simscave.mustbedestroyed.org/) | Community discovery lead | retrieval-inaccessible; Discovery retained with failed actual open; no extraction capability asserted. |
| [SimForum](https://www.simforum.de/) | German community | http-403; Discovery retained with failed actual open; no extraction capability asserted. |
| [AmazSims](https://amazsims.fr/) | French partner community | http-403; Discovery retained with failed actual open; no extraction capability asserted. |
| [Kijiko](https://kijiko-catfood.com/) | Independent creator | timeout; Discovery retained with failed actual open; no extraction capability asserted. |
| [SrslySims](https://srslysims.net/) | Independent creator/community | timeout; Discovery retained with failed actual open; no extraction capability asserted. |
| [Sims4Life](https://sims4life.gg/) | Editorial/status index lead | timeout; Discovery retained with failed actual open; no extraction capability asserted. |

Creator accounts on existing platforms are evidence scopes, not additional services. This includes LittleMsSam on itch.io, KimikoSoma on CurseForge, SimRealist on itch.io and the two Patreon release posts.

### Observed item/profile scopes

#### SIMB-scope-modsims

Item: [modsims4-fr](https://modsims4.fr/gameplay_complet/musique-et-concerts/). Profile/about: [observed route](https://modsims4.fr/author/kimikosoma/). Sources: SIMB002, SIMB003, SIMB004, SIMB005, SIMB006.

Roles: articleAuthor: KimikoSoma; translator: KimikoSoma; originalModAuthor: ThatssoJordy; translationProjectOwner: KimikoSoma.

Avatar: Actual CurseForge profile-avatar PNG displayed via profile link; no avatar source established on WordPress author archive.

Body boundary: Begin article title/date/byline; retain Intro/prerequisites, video heading, feature sections and updates. Stop before comments/sidebar/footer. The archive excerpts are discovery only.

Media: {"images":"Inline screenshots retain order and captions, including multiple repeated decorative images separately.","video":"A video-presentation section and outbound YouTube link observed; embedded-player src and playable response not exposed.","gif":"No animation established.","avatar":"Decoded PNG belongs to linked CurseForge account, not proof all accounts share same picture."}

Files: {"originalMod":"Patreon original-release link separate from translation.","translation":"CurseForge project1309269.","dependency":"Lot51 library separate required relation.","binaryDownloaded":false}

History: Author archive partial; CurseForge profile exposes page buttons; full history unverified. Follow: No native creator-follow tested. CurseForge public text includes mixed Follow/Unfollow strings; never infer signed-in relationship from markup.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: No raw WP body container/REST response, all media loads or complete archive accepted.

#### SIMB-scope-rava

Item: [ravasheen](https://ravasheen.com/download/sims-inventory-management-system-s-i-m-s/). Profile/about: [observed route](https://ravasheen.com/). Sources: SIMB015, SIMB016, SIMB017, SIMB018.

Roles: creator: Ravasheen; sitePublisher: Ravasheen; fileHost: Google Drive.

Avatar: No provider ID or verified profile portrait. Creator-home image is not assumed avatar.

Body boundary: Preserve short Description separately; main detailed body runs The Deets/Details through Change Log and Known Issues. Stop before site Downloads/footer navigation.

Media: {"imageOrder":["(2)","(4)","(3)","(1)"],"placementObservation":"Each identity linked twice. Keep occurrence list and distinct gallery list; do not double count carousel duplicates.","loaded":"Only first distinct PNG displayed.","video":"None exposed in sampled item.","gif":"None exposed in sampled item."}

Files: {"outboundDriveId":"1Wqo8_L8hnfSFar21tnFSzlAbpuf5Vajl","versionDisplay":"1.0.2","changelogLastDate":"2024-03-18","download":"Actual Drive action redirected and failed; no bytes."}

History: Category/search/filter controls observed; page terminal condition not established. Follow: External social/Patreon follows only; no site-native account follow proven.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Date near description2023 differs from later changelog2024; preserve both.

#### SIMB-scope-lms

Item: [lms-mods](https://www.lms-mods.com/). Profile/about: [observed route](https://littlemssam.itch.io/). Sources: SIMB019, SIMB020, SIMB021.

Roles: modCreator: LittleMsSam; rowTranslators: Named per update note; retain locale and credit, not mod ownership.; distributors: CurseForge, Patreon.

Avatar: No avatar proven. itch.io creator page is separate existing-platform scope.

Body boundary: Gameplay Mods table: Mod Name/Updated/required DLCs/Download on CurseForge/Download on Patreon/Mod Summary/Update Notes/Overrides Tunings. Preserve multi-line notes inside corresponding row.

Media: {"images":"No row gallery required by sampled table; provider item media separate.","video":"Not exposed.","gif":"Not exposed."}

Files: {"sampleMod":"Heat Up Leftovers","updatedDisplay":"17.10.2026","providerItem":"https://www.curseforge.com/sims4/mods/heat-up-leftovers","fileBytesAccepted":false}

History: Anchor-separated categories; 212 gameplay mods declared. Do not certify212 rows without count parity. Follow: Creator links social update follows; native site follow unproven.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Master website checked patch1.129.39; old itch profile says1.63.136. Do not overwrite current with historical cached profile.

#### SIMB-scope-brazen

Item: [brazenlotus](https://www.brazenlotus.com/mod/core-mod). Profile/about: [observed route](https://www.brazenlotus.com/about). Sources: SIMB022, SIMB023.

Roles: creator: BrazenLotus; creditedToolsAuthors: Lot51, Frankk; communityMention: Creator Musings Discord, not a separately inspected host.

Avatar: No actual avatar established; cooking-dough banner and generic images are item/site art.

Body boundary: Retain main description, Features/Details/Conflicts sections and required files; exclude site navigation and patron supporter list.

Media: {"images":"Five generic image links after banner; roles/visibility unresolved.","video":"No player exposed.","gif":"No animation verified."}

Files: {"scriptCountStated":2,"optionalScript":"IngredientTags_Enabler","downloadState":"Contradictory retired/broken/needs-update/coming-soon labels all in flattened page; unknown until hydrated visibility."}

History: Sparse mods shell; item body accessible; no complete catalog continuation. Follow: External Patreon support; no site-native author follow established.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Flat HTML/text cannot determine active status. Do not mark mod retired or broken from hidden templates.

#### SIMB-scope-scum

Item: [scumbumbo-maintained](https://scumbumbomods.com/xml-injector). Profile/about: [observed route](https://scumbumbomods.com/about). Sources: SIMB025, SIMB026, SIMB027, SIMB028, SIMB029.

Roles: originalAuthor: Scumbumbo; currentNamedUpdater: Triplis; maintainer: Group of mod authors, per About; originalHost: Mod The Sims.

Avatar: About page cloud image is not avatar; MTS actual custom-avatar link separately failed.

Body boundary: Main XML INJECTOR description has current update plus historical v4/v3 and Info/Player/Modder sections. Preserve update authors and dates section by section.

Media: {"itemImage":"MTS cover image on Squarespace CDN; not loaded.","video":"None exposed.","gif":"Avatar path.gif separately linked on MTS; animation unknown."}

Files: {"currentArchive":"XmlInjector_Script_v42.zip","currentVersionDisplay":"4.2","olderMtsVersion":"2","separateDocumentation":true,"downloadResult":"application/zip unsupported by retrieval; no byte validation."}

History: Single maintained item; old MTS comments/history separate; no shared release order inferred. Follow: External Discord and donate links; no native author follow observed.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Current site v4.2 must not merge with old MTSv2 file IDs or claim updater is original author.

#### SIMB-scope-mts

Item: [mod-the-sims](https://modthesims.info/d/622928/xml-injector-version-2.html). Profile/about: [observed route](https://modthesims.info/m/7401825). Sources: SIMB028, SIMB029, SIMB030.

Roles: originalAuthor: scumbumbo; memberId: 7401825; projectId: 622928; maintenanceSite: scumbumbomods.com.

Avatar: Observed /customavatars/avatar7401825_1.gif is actual profile image candidate, unlike role badges. Redirect fetch failed; no decode/animation accepted.

Body boundary: Overview through custom instructions is content; Files separate. Comments explicitly loading. Global sign-in/nav excluded.

Media: {"screenshots":"XmlInjector.jpg1100x600 observed.","avatar":"GIF source path observed; fetch failed.","video":"None exposed."}

Files: {"archives":["XmlInjector_Modders_Documentation_v2.zip","XmlInjector_v2.zip"],"internalFileTable":"Documentation PDF/XML/STBL/source files are archive members, not additional user downloads.","downloadOrigin":"chii.modthesims.info","binaryDownloaded":false}

History: Creator See More and comments/history need explicit continuation fixture. Follow: Thanks/Favourited are not creator follow; native creator follow unproven.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Page title/current site version differ by design; retain old record and maintenance relation.

#### SIMB-scope-sfs

Item: [sim-file-share](https://simfileshare.net/download/3692732/). No confirmed profile route in this scope. Sources: SIMB031, SIMB032, SIMB001.

Roles: uploaderLabel: kimikosoma; creatorAttribution: Original site links this as its reshade; uploader label alone is not platform account ID..

Avatar: No uploader profile/avatar link exposed. Do not construct profile route.

Body boundary: Metadata-only file page, no original post body. Filename/title separate from Shared by/Downloads/Uploaded/Updated label-value table.

Media: {"images":"No file preview/avatar exposed.","video":"No player.","gif":"None."}

Files: {"fileId":"3692732","filename":"kimiko.ini","sizeDisplay":"26.0 kB","uploadedDisplay":"Feb.22,2023,4:58p.m.","updatedDisplay":"Oct.20,2024,9:29a.m.","linkObserved":"https://cdn.simfileshare.net/download/3692732/?dl=","downloadResult":"Redirect inaccessible; no binary/checksum."}

History: No global file search or uploader collection inferred; use explicit creator-supplied file/folder links. Follow: No creator-follow or uploader profile observed.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: INI is reshade preset, not Sims mod .package/.ts4script; filetype must remain exact.

#### SIMB-scope-istolia

Item: [istolia-creations](https://istoliacreations.com/sims-4-traduction-fr-the-most-realistic-mod-de-lusimlastars/). Profile/about: [observed route](https://istoliacreations.com/a-propos/). Sources: SIMB012, SIMB013.

Roles: articleAuthor: Istolia; translator: Istolia; originalModAuthor: LuSimLaStars; dependencyAuthor: XML Injector original author and maintained project separate.

Avatar: No profile image accepted. Cloudinary article screenshots do not substitute.

Body boundary: H1/date through download zone and author credit; gallery can repeat cover. Stop before previous/next, partner cards and cookie controls.

Media: {"orderedImageRefs":"Cover and twelve other links observed with repeated cover placement; maintain DOM occurrence order before dedup.","video":"No player observed.","gif":"No animation established."}

Files: {"originalMod":"Patreon link","translation":"CurseForge translation link","required":"XML Injector separate mandatory link","unrelatedAttribution":"House and hairstyle source links are screenshot credits, not required mod dependencies."}

History: Previous/Next article links observed; full translation archive timed out. Follow: External social/Discord links; no native site creator-follow proven.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Dependency, original mod, translation and screenshot credits need four relation types.

#### SIMB-scope-candyman

Item: [candyman-gaming](https://www.candyman.fr/simlink-votre-application-pour-les-aides-sociales/). No confirmed profile route in this scope. Sources: SIMB007, SIMB008.

Roles: translator: Candyman; originalModAuthor: Not independently resolved from sampled page; sitePublisher: Candyman Gaming.

Avatar: No actual author profile/avatar exposed in item text.

Body boundary: H1/date through final download-state statement; six inline image links. Stop at Une réaction/share and duplicated ad-block dialogs.

Media: {"orderedImages":6,"hostObserved":"i0.wp.com","video":"No player exposed.","gif":"No animation established."}

Files: {"state":"Explicit no-longer-available notice.","binaryDownloaded":false}

History: Article links relevant posts; archive continuation not tested. Follow: Reaction/share controls are not creator-follow.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Do not preserve stale downloadability simply because old instructions still refer to a translation file.

#### SIMB-scope-simrealist

Item: [simrealist](https://www.simrealist.com/post/simrealist-mod-status-the-sims-4-patch-october-27-2026). Profile/about: [observed route](https://www.simrealist.com/behind-the-mod). Sources: SIMB040, SIMB041, SIMB042, SIMB043, SIMB044.

Roles: postWriter: Nichole; organization: SimRealist; teamRoles: Producer/developers/animator/linguists distinct; projects team-owned..

Avatar: Writer Nichole image link observed; fetch failed. Team logos and member listing images are separate.

Body boundary: Patch-status article title/byline then compatible-version list and support notes; exact game platform versions bound to this assertion.

Media: {"writerImage":"Link observed, not decoded.","projectImages":"FlowFit inline image links on itch.io separate.","video":"No playback verified.","gif":"No animation verified."}

Files: {"sample":"FlowFit0.3.1.4","filename":"SimRealist_-_Flowfit_0.3.1.4.zip","sizeDisplay":"8.9MB","distribution":"Name-your-own-price itch.io download; no purchase/download performed."}

History: Itch devlog and project listing distinct from site news; no full history. Follow: Itch Follow SimRealist differs from Add To Collection; mixed Follow/Following labels in guest text are not read-back state.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Patch assertion only, not independent game compatibility testing. Organization follow differs from writer follow.

#### SIMB-scope-seebee

Item: [sims4me-seebee](https://www.seebee.de/sims4me/index.php?list=50). Profile/about: [observed route](https://www.seebee.de/sims4me/index.php?lang=en). Sources: SIMB045, SIMB046, SIMB047, SIMB048.

Roles: creator: sims4me/Bienchen; siteMaintainerLabel: seebee; not conflated with creator without evidence; targetRow: sabotagefix.

Avatar: Preview images are mod thumbnails; no account avatar accepted.

Body boundary: Parse Name and Description cell as one row body, including line breaks/module notes; date/category separate; same URL holds multiple items.

Media: {"preview":"Two linked placements per row image may be thumbnail/lightbox duplicates.","video":"No player exposed.","gif":"No animation established."}

Files: {"download":"Download icon may not survive rendered text; browser needed for target href.","availability":"CategoryObsolet is explicit; requirements still patch/pack scoped."}

History: All Mods table1201 rendered lines; count and terminal scope unverified. Sort/filter states change order. Follow: No native follow observed; current updates may be on CurseForge.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Cannot key by pageURL alone; use site+stable row identifier if DOM exposes one, otherwise provisional route+exact mod name with collision checks.

#### SIMB-scope-panda

Item: [pandasama](https://www.pandasama.com/art-deco-cc-pack/). Profile/about: [observed route](https://www.pandasama.com/author/pandasamacc/). Sources: SIMB049, SIMB050, SIMB051, SIMB052.

Roles: postAuthor: PandaSama; publisher: PandaSama; authorRouteResult: Redirects home, not verified archive..

Avatar: Author-adjacent generic image not accepted as avatar.

Body boundary: Public post H1/byline/body ends before Subscribe/comment login and related posts. Related paid teaser must not replace/lock public current body.

Media: {"gallery":"Eight numbered image31–38 links on Patreon CDN observed after cover.","failedImage":"First content-image request403; signed URL omitted from persisted data.","video":"No playback verified.","gif":"No animation established."}

Files: {"releaseDate":"2026-08-04","postDate":"2026-07-14","separateRelease":"ChildBirth1.972 links downloads.pandasama.com and backupwe.tl","binaryDownloaded":false}

History: Author alias redirects home; blog continuation untested. Follow: Subscribe text is comment notifications; newsletter separate from Patreon membership and creator-follow.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Do not infer a current public image is paywalled from403; visibility of related paid teaser is a different scope.

#### SIMB-scope-simcredible

Item: [simcredible](https://sims4.simcredibledesigns.com/scripts/s4entrance.html). Profile/about: [observed route](https://sims4.simcredibledesigns.com/staff.html). Sources: SIMB033, SIMB034, SIMB035, SIMB036.

Roles: publisher: SIMcredible Designs team; individualCreators: Not resolved from unlabeled image-only staff section..

Avatar: Unlabeled staff art and logo not accepted as actual human avatars.

Body boundary: Top-level page has iframe. Actual iframe exposes latest-summary/date; image link is media, not item URL.

Media: {"gif":"Decorative/header GIF link returned unsupportedimage/gif.","items":"No complete item gallery established.","video":"None exposed."}

Files: {"distribution":"Team page links actual TSR and CurseForge creator profiles; no independent-host item binary."}

History: Search/download navigation is image-heavy; no complete catalog history. Follow: Social/Patreon links only; no native site-follow established.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Need iframe+image-anchor DOM fixture before claiming actual item extraction.

#### SIMB-scope-assemblee

Item: [lassemblee-sims4](https://www.lassembleedessims4.com/always-moveobjects-on). Profile/about: [observed route](https://twistedmexi.com/). Sources: SIMB009, SIMB010.

Roles: curator: L’Assemblée des Sims4; creditedOriginalAuthor: TwistedMexi; creatorLink: Actual creator site link opened separately..

Avatar: Directory icon is mod preview; no author avatar.

Body boundary: Only directory card title/creator/category; selected detail404. No body content extracted.

Media: {"images":"Directory image link present, no gallery.","video":"None exposed.","gif":"None established."}

Files: {"state":"Detail404; no downloadable file claimed."}

History: Page2 actual directory continuation link observed; not traversed. Follow: Nous suivre links Facebook; external community follow only.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Do not make an extraction success out of a discovered card when its detail fails.

#### SIMB-scope-simsfinds

Item: [simsfinds](https://www.simsfinds.com/downloads/407711/robin-hair-right-sims4). Profile/about: [observed route](https://www.simsfinds.com/sonyasims). Sources: SIMB053, SIMB054.

Roles: creditedCreator: SonyaSims; nativeProfileSlug: sonyasims; originalProvider: Tracked Patreon link, not independently authenticated..

Avatar: No avatar exposed in rendered profile text; retain absent status pending a separately authorized browser fixture.

Body boundary: H1 and two description regions with Show More; stop before featured/recommendation rails. Published label blank in this response.

Media: {"images":"One preview link in item; prior pass displayed it, round2 did not reload.","video":"Floating-hair text does not prove GIF/video asset.","gif":"No animation verified."}

Files: {"state":"Download wait and Premium labels; exact file absent.","binaryDownloaded":false}

History: Profile now exposes year selectors2026–2020; preserve year scope and no-complete-history state. Follow: Recommendations and favorite/list controls differ from native creator-follow; unverified.

Access: Guest public retrieval only. No authentication or source mutation. Remaining gap: Requires client hydration/ShowMore/browser evidence for full text/avatar/download.

#### SIMB-scope-worldtour-public

Item: [patreon](https://www.patreon.com/thatssojordy/posts/world-tour-mod-1-143703086). No confirmed profile route in this scope. Sources: SIMB074, SIMB002.

Roles: originalModAuthor: thatssojordy; translator: KimikoSoma is separately identified by referring article..

Avatar: Creator profile picture link visible; not decoded in this scope.

Body boundary: Public post title/byline through requirements, terms, changelog and attachment section visible; comments remain loading.

Media: {"images":"Numerous ordered inline image links, not loaded.","gif":"No animation established.","video":"No player established."}

Files: {"filename":"thatssojordy_WorldTour_Band_Module_V1.1.package","delivery":"Link visible; no binary downloaded.","requirements":"Lot51 Core Library and World Tour Core are separate required links; game packs have required/optional roles."}

History: One post only, not creator history. Follow: Join for free is membership; native following/import not tested.

Access: Guest public body; badge says previously released early for members. Remaining gap: Do not require login merely because historical early-access badge exists.

#### SIMB-scope-tmex-locked

Item: [patreon](https://www.patreon.com/TwistedMexi/posts/better-v3-17-rc1-158788471). No confirmed profile route in this scope. Sources: SIMB075, SIMB072.

Roles: originalModAuthor: TwistedMexi; postId: 158788471.

Avatar: Not inspected.

Body boundary: Guest teaser only; full-post membership notice explicit.

Media: {"preview":"Image link visible; not loaded.","fullGallery":"Unknown.","gif":"Unknown.","video":"Unknown."}

Files: {"filename":"TwistedMexi's Better Exceptions v3.17 RC1.zip","access":"Join to unlock; not downloaded."}

History: One locked post only. Follow: Membership unlock differs from native follow.

Access: Locked guest state; root secure authorized membership needed. Remaining gap: No paid body, attachment URL or entitlement acceptance.

### Concrete extraction recipes

No exact CSS class selector or embedded site data path was observed through this subagent's rendered-page transport. The recipes below give source-grounded boundaries, joins, file relations and validators. Suggested DOM selection and live API use require their own permitted fixture. Official WordPress field names are identified as documented, not as observed on a specific creator site.

#### sims4-translator-provenance

Article, author archive, original-release link, translation project, provider profile and avatar were inspected. Sources: SIMB002, SIMB003, SIMB004, SIMB005, SIMB006, SIMB012.

1. Create separate principals for the article author, translator, original mod creator and distributor.
2. Classify links by their observed section and label: original mod, translation, required library, screenshot credits or social support.
3. Follow the actual provider URL; preserve project 1309269 and its canonical redirect.
4. Associate cross-site identities only through observed links and role evidence; keep the avatar attached to its CurseForge account.

Validation:

- World Tour original creator is ThatssoJordy; translation owner is KimikoSoma.
- Istolia's original mod, translation, XML Injector dependency and screenshot credits remain separate relations.
- An author archive excerpt cannot satisfy full article extraction.
- A project logo cannot satisfy the avatar field.

Unresolved: WordPress numeric user identity, body container and live REST data remain unverified.

#### ravasheen-complete-item

The item has separate Description, Details, Change Log and Known Issues sections; four image identities appear twice each. Sources: SIMB015, SIMB016, SIMB017, SIMB018.

1. Capture the short description and detailed body separately, retaining the section tree through Known Issues.
2. Exclude global download, support and footer navigation.
3. Store all media occurrences and a separate gallery ordered by first occurrence; retain source order 2, 4, 3, 1.
4. Keep the version badge and each changelog date; resolve the actual Drive link at download time.

Validation:

- The sample has four distinct gallery identities and eight placements.
- Only the first PNG was displayed; the other three remain untested.
- Preserve version 1.0.2, initial date December 23, 2023 and changelog date March 18, 2024.
- The failed Drive redirect leaves attachment delivery unresolved.

Unresolved: No DOM parser, complete gallery or downloaded file was accepted.

#### lms-row-catalog

The rendered table exposes named columns, two download providers and multiline notes. Sources: SIMB019, SIMB020, SIMB021.

1. Locate the table by its header signature after obtaining a DOM fixture.
2. Map fields by header name and keep multiline notes within their own row.
3. Extract dated update events with locale and translator credit.
4. Use actual provider project URLs as identity evidence; retain the creator-site row as an alias.
5. Keep checked game patch, provider release date and historical profile patch separate.

Validation:

- Heat Up Leftovers maps to its actual followed CurseForge item.
- A translator mentioned in update notes does not become the mod creator.
- The declared 212 gameplay mods is a count target, not extraction proof.
- Blank DLC cells remain unknown unless their semantics are verified.
- The old itch.io patch 1.63.136 must not overwrite the current-site patch 1.129.39.

Unresolved: Full row parity, filter behavior, avatar and binaries remain untested.

#### brazenlotus-visible-status

Flattened text simultaneously exposes incompatible status labels; About explains required Core files and optional override modules. Sources: SIMB022, SIMB023, SIMB024.

1. Require a visible DOM or observed structured response to bind the active status to this item.
2. Retain contradictory raw labels as evidence and emit unknown status until visibility is established.
3. Capture Features, Details, Conflicts and required-file sections independently.
4. Separate mandatory Core dependencies, optional Core Modules and author/tool credits.

Validation:

- Reject a definitive status when retired, broken and functional labels all appear without visibility evidence.
- Core Modules must retain optional override semantics.
- IngredientTags_Enabler remains optional.
- Two script files do not imply two separate downloadable projects.

Unresolved: Wix visibility and actual structured schema remain unresolved.

#### scumbumbo-maintenance-lineage

The maintained page names Triplis; About describes community maintenance; the old MTS record points to that site. Sources: SIMB025, SIMB026, SIMB027, SIMB028, SIMB029.

1. Preserve Scumbumbo as original author and record updater and maintainer roles separately.
2. Link the old MTS project to the maintained release without merging file IDs.
3. Read current version 4.2 separately from historical version headings and updater notes.
4. Classify the player library ZIP and modder documentation ZIP separately.

Validation:

- Original author, named updater and maintenance group remain distinct.
- The old MTS version 2 file cannot be relabeled as version 4.2.
- Archive member listings stay nested under their archive.
- An unsupported ZIP response does not establish byte integrity.

Unresolved: Current ZIP hashes and complete history remain untested.

#### mts-identity-files-and-avatar

Numeric project/member routes, archive links, internal members and the actual custom-avatar link were observed. Sources: SIMB028, SIMB029, SIMB030.

1. Use the numeric project and member IDs from resolved links.
2. Capture Overview, Files, Information and comments separately; mark loading comments incomplete.
3. Enumerate downloadable archives, then nest the internal file table under the appropriate archive.
4. Use a profile-associated custom avatar, excluding creator badges and game icons.
5. Retain redirects, content type and load status for every avatar attempt.

Validation:

- There are two archives with different user/modder purposes.
- Member 7401825 joins the inspected creator profile.
- The custom avatar GIF failed retrieval; animation and decode remain unknown.
- Guest sign-in menus and Thanks labels do not prove an authenticated session.

Unresolved: DOM selectors, file integrity and avatar decode remain pending.

#### sfs-file-page

The small file page exposes a filename, size, uploader label, dates and an actual CDN Download link. Sources: SIMB031, SIMB032, SIMB001.

1. Extract file ID from the observed canonical download URL.
2. Map the metadata table by its labels; preserve uploader as a label if no profile exists.
3. Keep upload and update dates separate, with timezone unspecified when absent.
4. Follow only the actual Download href and preserve its redirect chain.
5. Retain the original creator-site link as provenance and classify the INI as a preset.

Validation:

- File 3692732 remains kimiko.ini with displayed size 26.0 kB.
- Uploader label kimikosoma does not establish a numeric account or avatar.
- The inaccessible download has no accepted checksum or bytes.
- A metadata-only file page does not become the original post body.

Unresolved: No binary, checksum, uploader profile or avatar was available.

#### istolia-body-media-relations

The article, about page, repeated cover, ordered screenshots, dependency and download labels were observed. Sources: SIMB012, SIMB013.

1. Capture the article and download explanation before previous/next links, partner widgets and cookie controls.
2. Preserve image occurrences and a separate distinct asset list.
3. Represent XML Injector, the original Patreon mod and the CurseForge translation as different relations.
4. Keep the credited house and hairstyle as screenshot provenance, not dependencies.

Validation:

- Partner cards cannot become article authors.
- Cloudinary screenshots cannot become avatars.
- Cookie policy text stays outside the body.
- The XML Injector dependency survives even if the original mod URL fails.

Unresolved: Original image variants and complete image loading remain untested.

#### candyman-unavailable-state

The article ends with an explicit unavailable-download statement before reactions, sharing and ad-block dialogs. Sources: SIMB007, SIMB008.

1. Use article dates rather than the current date in the site header.
2. End the body at the unavailable-download state.
3. Collect the six inline images in source order.
4. Preserve the translator credit while leaving the original author unresolved.

Validation:

- October 28, 2026 in the header does not replace the 2021 article date.
- No download is manufactured from a removed link.
- Ad-block graphics are excluded from the six content images.
- Unknown original authors remain unresolved.

Unresolved: No profile, avatar or file delivery was established.

#### simrealist-team-news-release

The patch-status post, team role page, actual FlowFit project and itch.io profile were opened. Sources: SIMB040, SIMB041, SIMB042, SIMB043, SIMB044.

1. Separate writer Nichole, the SimRealist organization, contributors and project publisher.
2. Bind compatibility assertions to exact game platform versions and the source date.
3. Follow the actual itch.io project for its body, files and devlog.
4. Keep creator Follow separate from Add To Collection and leave mixed guest relationship labels unresolved.
5. Distinguish owned projects from curated collections of other creators.

Validation:

- FlowFit ZIP version 0.3.1.4 matches the dated status assertion.
- A curated roBurky project does not become SimRealist-owned.
- A failed writer image cannot be replaced by an organization logo.
- A status post is source testimony, not independent compatibility testing.

Unresolved: No binary, account relationship read-back or complete history was tested.

#### seebee-inline-project-records

The actual item link resolves to a category table containing the target row, not a unique detail URL. Sources: SIMB045, SIMB046, SIMB047, SIMB048.

1. Use a real row ID if exposed; otherwise retain a provisional page-and-name identity with collision checks.
2. Extract the row's date, category and multiline description independently.
3. Expand public description controls in the eventual DOM fixture and retain module instructions.
4. Preserve language, sort and filter state in the receipt.
5. Keep the creator's freshness notice separate from historical row update dates.

Validation:

- Two rows under one URL cannot collapse into one item.
- The sabotagefix row retains its Obsolet category.
- An empty download column in text is an unresolved target.
- A row date cannot establish current patch compatibility when the creator warns that the site may lag.

Unresolved: Stable row IDs and actual download icon targets remain unverified.

#### pandasama-public-and-gated-boundaries

The public Art Deco body, gallery links, author redirect, related paid teaser and separate release page were inspected. Sources: SIMB049, SIMB050, SIMB051, SIMB052.

1. End the current article before comment subscriptions and related posts.
2. Keep publication date and public release date separate.
3. Retain both the author alias and its homepage redirect.
4. Keep signed media URLs in ephemeral runtime state; persist stable provenance and a sanitized failure.
5. Do not infer a paywall or expiry solely from a media 403.
6. Treat the separate mod release and backup download as another project scope.

Validation:

- A related paid teaser cannot mark the public current post locked.
- The image 403 has an unknown cause.
- An author redirect to home is not a complete author archive.
- The espresso machine's Get Together condition is not a mandatory condition for every item in the pack.

Unresolved: No signed preview decode or binary download was accepted.

#### simcredible-iframe-and-image-navigation

The parent page, actual iframe, team page and unsupported GIF target were inspected. Sources: SIMB033, SIMB034, SIMB035, SIMB036.

1. Treat the parent and public iframe as separate fragments with separate base URLs.
2. Resolve image anchors before deciding whether they identify media or an item detail.
3. Extract the dated iframe summary as an announcement only.
4. Use actual provider profile links for team identity and leave unlabeled portraits unresolved.
5. Classify decorative GIFs separately from content media and avatars.

Validation:

- The parent alone is incomplete because the iframe contains the dated summary.
- Unsupported image/gif does not establish animation playback.
- Unlabeled staff art does not identify a person.
- Click-picture instructions do not prove downloadable files.

Unresolved: Actual item detail and full catalog extraction still need a DOM fixture.

#### twistedmexi-master-blocks

The master list uses repeated mod headings, previews, descriptions, instructions and download links, plus early-access cards. Sources: SIMB072.

1. Pair each actual download link with its own semantic mod block.
2. Separate release-candidate early access from ordinary releases.
3. Preserve installation instructions per mod.
4. Treat previews as item media and use the existing Patreon adapter for the linked release body.
5. Keep shared Patreon targets explicit rather than inventing a binary per card.

Validation:

- All Cheats script installation differs from Better BuildBuy folder installation.
- A missing image cannot shift a download link into the previous card.
- The directory is not a complete Patreon history.
- External follow instructions retain Patreon semantics.

Unresolved: No independent detail page, full provider extraction or avatar was established.

#### simsfinds-bounded-source-card

The fresh item retains Show More controls and wait text; the profile exposes year filters from 2026 to 2020. Sources: SIMB053, SIMB054.

1. Key creation 407711 separately from profile sonyasims.
2. Capture both description regions and expand public Show More controls in the browser fixture.
3. Preserve the tracked Patreon link as an outbound reference without forwarding a site session.
4. Traverse actual year links with creation-ID deduplication and retain unvisited-year gaps.
5. Use a profile-associated avatar rather than an item preview.

Validation:

- Floating-hair prose does not establish a video asset.
- A blank Published value remains null.
- A wait/Premium label is not a completed download.
- Favorite lists and recommendations do not establish imported native follows.

Unresolved: Root browser evidence is required for complete body, avatar and download behavior.

#### wcif-shell-detection

The creator directory remains a loading shell while category pages expose search rows with explicit missing previews. Sources: SIMB055, SIMB056.

1. Emit separate capability states for search rows, creator directory and full post content.
2. Map only visible row labels until a real item/profile URL is observed.
3. Keep missing previews explicit.
4. Observe actual public hydration responses before choosing any API route.
5. Record access and source filters in the query receipt.

Validation:

- Loading creators prevents directory completeness.
- An advertised 10,000+ result total is not the extracted count.
- Shared-by names are not stable creator IDs.
- The presence of a sign-in link does not prove login is needed for public data.

Unresolved: No exact item/profile JSON schema was observed.

#### blocked-and-broken-retrieval-contract

Exact known routes and actual clicked detail/profile targets failed with different error classes. Sources: SIMB057, SIMB058, SIMB038, SIMB039, SIMB010.

1. Persist the attempted URL, resolved URL when known, source link, status and checked date.
2. Distinguish 404, inaccessible, restricted fetch, shell and policy denial.
3. Append a failed attempt without erasing stronger earlier observations.
4. Do not use alternate origins, proxies or raw requests to work around policy blocks.
5. Keep unresolved profile IDs provisional after a profile failure.

Validation:

- A failed detail does not count as a body extraction.
- A new PlumbDex failure does not erase prior specialist evidence.
- TS4 Rebels restricted fetch does not become login-required.
- Round two contains no LoversLab or F95 request.

Unresolved: Root owns legitimate authenticated browser access; no account mutations were performed.

#### conditional-wordpress-rest-reuse

Official WordPress schemas were read; actual site REST/feed probes did not produce usable responses. Sources: SIMB059, SIMB060, SIMB061, SIMB063, SIMB064, SIMB062.

1. Discover the actual API root and routes from permitted site evidence.
2. If a real post response is available, map documented id, link, author, content, excerpt, featured_media and GMT dates.
3. Resolve public author identity and avatar_urls only when a real user response is returned.
4. Use content rather than excerpt, then preserve ordered media and attachments from its HTML.
5. Discover custom post types from actual responses; do not assume every download is a core post.
6. Use real response pagination and terminal signals before marking history complete.

Validation:

- No REST success is claimed for the failed types probe.
- Documented avatar_urls is not an observed field on these specific sites.
- Featured media is neither the full gallery nor a creator avatar.
- Any nested rendered fields must be confirmed from the actual site's response.

Unresolved: Live site schemas, custom types and complete pagination remain unverified.

Documented WordPress fields, conditional on a real response: `WordPressPost.id`, `WordPressPost.link`, `WordPressPost.author`, `WordPressPost.content`, `WordPressPost.excerpt`, `WordPressPost.featured_media`, `WordPressPost.date_gmt`, `WordPressPost.modified_gmt`, `WordPressUser.id`, `WordPressUser.name`, `WordPressUser.link`, `WordPressUser.slug`, `WordPressUser.avatar_urls`.

### Exact public and gated access targets

| Target | Why it matters |
|---|---|
| [SimsFinds item 407711](https://www.simsfinds.com/downloads/407711/robin-hair-right-sims4) and [SonyaSims](https://www.simsfinds.com/sonyasims) | Root can verify Show More, profile avatar, date, actual download and year-scoped history. |
| [TwistedMexi Better Exceptions RC1](https://www.patreon.com/TwistedMexi/posts/better-v3-17-rc1-158788471) | Guest explicitly locked; ZIP filename visible. Compare only legitimate existing entitlement. |
| [PandaSama diary](https://www.pandasama.com/modding-diary-pleading-forgiveness-adopting-foster-baby/) | Guest main body absent; actual browser needed to distinguish rendering from a Patreon-linked gate. |
| [World Tour Band Module](https://www.patreon.com/thatssojordy/posts/world-tour-mod-1-143703086) | Public guest body and attachment observed; historical early-access badge does not require login today. |

No LoversLab or F95 request was made in this round; the earlier browser site-safety policy blocks remain in force.

### Failed and partial attempts

| Source | Result |
|---|---|
| [SIMB010](https://www.lassembleedessims4.com/always-moveobjects-on) | http-404: Followed actual Voir le mod link; 404. Do not manufacture a card body from directory summary. |
| [SIMB018](https://drive.google.com/uc?export=download&id=1Wqo8_L8hnfSFar21tnFSzlAbpuf5Vajl) | redirect-inaccessible: Observed public download action redirects to drive.usercontent.google.com; no file bytes obtained. |
| [SIMB027](https://scumbumbomods.com/s/XmlInjector_Script_v42.zip) | unsupported-application-zip: Actual download link yielded unsupported application/zip in retrieval, which establishes linked content type only, not binary integrity or installation. |
| [SIMB030](https://modthesims.info/customavatars/avatar7401825_1.gif) | redirect-inaccessible: Observed avatar GIF path redirects to static-files1.modthesims2.com and cannot be fetched. Animation and decode unverified. |
| [SIMB032](https://cdn.simfileshare.net/download/3692732/?dl=) | redirect-inaccessible: Actual Download link redirects to original file page with ?dl= and is inaccessible; no file bytes or checksum accepted. |
| [SIMB036](https://sims4.simcredibledesigns.com/graphics4/frEscurA2.gif) | unsupported-image-gif: GIF content type unsupported by retrieval; do not claim animation or item-preview decoding. |
| [SIMB038](https://sims4forum.com/custom-content/custom-content/ros%C3%A9-farms-single-rose.253/) | http-404: Actual index link resolves duplicated custom-content segment and404. Do not count metadata card as item body. |
| [SIMB039](https://sims4forum.com/custom-content/members/vintava.193329/) | http-404: Actual linked profile resolved under custom-content path and404; numeric-looking path not accepted as resolved profile identity. |
| [SIMB044](https://static.wixstatic.com/media/e7cc20_63366d22abf440bcb33760ed9763542e~mv2.jpg/v1/fill/w_32%2Ch_32%2Cal_c%2Cq_80%2Cenc_avif%2Cquality_auto/e7cc20_63366d22abf440bcb33760ed9763542e~mv2.jpg) | media-fetch-error: Actual Writer: Nichole image CDN request returned Internal Error. Profile-image role is visible but decoding failed. |
| [SIMB050](https://www.pandasama.com/author/pandasamacc/) | redirect-to-home: Actual author link redirects homepage; use original alias and resolved page separately, do not claim author archive. |
| [SIMB052](https://www.pandasama.com/art-deco-cc-pack/) | http-403: Actual signed Patreon-CDN preview returned403. Token-bearing URL deliberately not persisted; do not claim paywall or expiry as proven cause. |
| [SIMB055](https://wcif.cc/creators) | page-shell: Fresh retrieval still Loading creators. This does not prove login is required; hydration unresolved. |
| [SIMB057](https://dev-pd.gametimedev.de/creators/148dazed) | retrieval-inaccessible: Fresh known public route inaccessible. Preserve stronger earlier specialist/browser evidence. |
| [SIMB058](https://ts4rebels.cc/) | restricted-fetch: Fresh root URL inaccessible via retrieval; no alternate-origin workaround attempted. |
| [SIMB061](https://ravasheen.com/wp-json/wp/v2/types) | retrieval-inaccessible: Public endpoint probe inaccessible; no live REST content/schema response observed. |
| [SIMB062](https://ravasheen.com/feed/) | retrieval-inaccessible: No feed response parsed; feed support remains unverified. |
| [SIMB063](https://modsims4.fr/feed/) | retrieval-inaccessible: No feed response parsed; does not establish absent feed. |
| [SIMB064](https://www.candyman.fr/feed/) | retrieval-inaccessible: No feed response parsed; does not establish absent feed. |
| [SIMB065](https://scumbumbomods.com/xml-injector?format=json) | retrieval-inaccessible: Normal public JSON representation candidate inaccessible; no Squarespace JSON schema inferred. |
| [SIMB066](https://simscave.mustbedestroyed.org/) | retrieval-inaccessible: Discovery candidate; current community, Sims4 scope and actual item/profile pages unverified. |
| [SIMB067](https://www.simforum.de/) | http-403: Homepage403; no content or account-state claim. |
| [SIMB068](https://amazsims.fr/) | http-403: Discovered through ModSims4 partner link; actual site returned403. |
| [SIMB069](https://kijiko-catfood.com/) | timeout: Homepage timeout; independent creator candidate, not accepted content. |
| [SIMB070](https://srslysims.net/) | timeout: Homepage timeout; no current scope/data assertions. |
| [SIMB071](https://sims4life.gg/) | timeout: Search lead suggested status index; actual homepage timed out. No compatibility facts adopted. |
| [SIMB073](https://www.pandasama.com/modding-diary-pleading-forgiveness-adopting-foster-baby/) | page-shell: Actual diary route exposes title/date/author but no main body. Adjacent related diary advertises a Patreon entitlement; actual current gate needs browser inspection. |
| [SIMB075](https://www.patreon.com/TwistedMexi/posts/better-v3-17-rc1-158788471) | locked-teaser: Actual original creator master-list link resolves Patreon post158788471. Guest sees Locked, teaser and ZIP filename with Join to unlock; full body/file delivery not accepted. |

### WCIF browser follow-up: index hydration resolves, original body remains unknown

A later guest browser fixture rendered the creator directory as100rows with11headers and the actual RIMINGS profile14342 as885items/1,745public favorites. One normal Load More expanded50item links to100unique links with the initial prefix preserved; more remained available. Creator avatar is absent, with only an initial-R fallback. Explicit Tumblr and Patreon links are provenance claims. [BRR010] [BRR011]

The exact Weekend Escape index item exposes `h1`, `section[aria-label="Item details"]`, creator14342 and source Patreon172243497. Its88-character generated DigitalDocument description is not the original post body. One267×267 preview decoded, with signed query values excluded. Complete original body/gallery, files, entitlement and native follows remain untested. This resolves the narrow rendered-index gap without erasing earlier shell observations. [BRR012]

## Round-three community and extraction research

Checked **2026-10-31**. The [round-three evidence manifest](../../../experiments/site-adapter-discovery/community-research-round3-2026-10-31.json) preserves original source locators, operation limits, failures and field mappings. Public observations are separate from executable parser and authenticated acceptance. Proposal counts below retain their original scope; the shared catalog applies alias and same-project normalization.

### Proposed coverage

| ID | Canonical URL | Scope and evidence |
|---|---|---|
| simblr-cc | https://simblr.cc/ | Strongest new canonical host: real Sims4 item/profile/avatar/media/file/pagination observations; also explicitly supports Sims1/2/3, Medieval and other life sims. |
| sglynp | https://www.sglynp.com/ | Chinese Discuz community with original/share/trade/subscription distinctions; actual linked item and creator both redirect to login. |
| ts4-mod-hound | https://app.ts4modhound.com/ | Reference/status service with creator profiles and file-stem/type/notes/reviser tables; not accepted binary hosting. |
| houseofharlix | https://www.houseofharlix.com/ | Shared Harrie/Felixandre original-content hub, detail/gallery and creator scope opened. Squarespace CDN does not itself prove JSON endpoints. |
| sixam-cc | https://sixam.cc/ | Independent original creator hub; detailed mod body, actual author portrait, ordered stills and failed GIF decode; external release alternatives have different entitlement. |
| lumpinou-mods | https://lumpinoumods.com/ | Independent documentation/release-discovery hub; actual author archive and pagination; downloads explicitly elsewhere. |
| the-plumbob-post | https://theplumbobpost.com/ | Curated CC directory; detail/profile and generated avatar fallback observed. Directory prose is not original author body. |
| saesoli-sims | https://saesoli.com/ | Small original Sims4 animation/pose/preset/CAS hub; about and listing observed, detail/file extraction unresolved. |
| sims4nexus | https://sims4nexus.com/ | Independent original-plus-finds archive, unrelated canonical service to Nexus Mods. Numeric WordPress-style permalink observed. |
| jenijenfred | https://www.jenijenfred.com/ | German/English curator, translation and community hub; CC table and official Tumblr/Discord provenance. |
| sims4-modders-reference | https://thesims4moddersreference.org/ | Creator Musings member-maintained documentation and direct current invite provenance; reference-only. |
| simularity | https://simularity.cc/ | Direct403; public official Patreon announcement verifies creator hub/recent redesign as author statements. Keep retrieval gate explicit. |

### Deep actual item/creator pairs and field recipes

#### Simblr.cc — item8487 and creator96

[RDSIM31003](https://simblr.cc/ts4/mod/8487-ts4-scd002-shirt-new-edit-by-julie-j.html) and [RDSIM31004](https://simblr.cc/user/96-julie-j/) form the strongest new pair. Preserve numeric item8487 and user96, title, by-link and uploaded/updated timestamps separately. The profile explicitly labels Julie J’s avatar and lists Tumblr/Pillowfort/YouTube/Patreon. The original/curator distinction must still be evaluated per item, especially dead-site archive records; one creator upload is not a site-wide provenance guarantee.

The short main description is distinct from “Other Uploads,” tags and the duplicated end “Description” preview. Body images are encountered in order as `6e9cf107-….png`, `b32ddf65-….png`, `fb70c6a0-….png`; all three actually displayed [RDSIM31010–12]. The linked avatar `core/avatars/9/6/Nick-TS2-Poster.png` displayed separately [RDSIM31005]. Do not make the clothing picture the author avatar.

Two file roles are exposed: a listed2.2MB `JulieJ-MaleSCD002Shirt-NewEdit.rar` attachment whose actual `https://simblr.cc/download/19610/` action returned404, and an outbound body link `https://simfileshare.net/download/6253039/` whose file page initially retrieved but later became inaccessible. Neither is a downloaded/validated archive. Preserve failure rather than treating the alternative link as proof the first works.

Profile project page2 is `/user/96-julie-j/projects/page/2/?filter=all`; mod page2 is `/user/96-julie-j/page/2/?filter=all`. Both were actually clicked and opened. These are independent collections. Snapshot counters19following/31followers and project/mod totals are source-local observations, not account-follow import. Global Sims4 listing displayed347results/29pages, but text pagination targets collapsed to the same link label; do not derive undocumented query endpoints from that retrieval.

#### SIXAMcc — Aero Diffuser and original creator homepage

[RDSIM31018–22](https://sixam.cc/aero-aroma-diffuser-sims-4-mod/) pair the real item with the [creator homepage](https://sixam.cc/). Title and full visible article region include version details, gameplay instructions and download alternatives. No numeric creator/item identifier was exposed on the independent site: retain canonical route identity and separately record external IDs.

The homepage image explicitly labels the creator; `https://sixam.cc/wp-content/themes/sixamcc-next/assets/sixamcc-creator.jpg` actually displayed. The item media order is leading preview `…1000x1434.webp`, then inline `…4.webp`, `…2.webp`, `…3.webp`, then `…2.gif`. Four stills displayed; the actual GIF returned unsupported `image/gif`. Do not report animation playback or complete gallery acceptance.

The public “Download Now” reaches [CurseForge Aero Aroma Diffuser](https://www.curseforge.com/sims4/mods/aero-aroma-diffuser). The adjacent Patreon fast-download reaches [post172179764](https://www.patreon.com/sixamcc/posts/aero-aroma-v1-0-172179764), explicitly Locked with `SIXAMcc_AeroDiffuser_V1.0.package` and Join to unlock. This is a concrete counterexample to deriving every mirror’s entitlement from the public creator article. No source-native follow appeared on the independent item; external social follow invitations and paid/free Patreon membership differ.

#### Lumpinou — Personal Lists and author archive

[RDSIM31028–32](https://lumpinoumods.com/2024/05/13/personal-lists-in-game-checklists-and-basic-lists-for-gameplay-tracking-or-whatever-else-a-sims-4-mod/) identify the author by actual by-link to [author/lumpinou](https://lumpinoumods.com/author/lumpinou/), with date and original description. Archive excerpts say Continue reading and must not substitute for complete item bodies. Main post has three image links including a demonstration GIF. The GIF displayed a still; playback is unverified. Comments still say Loading Comments; body and comments are separate completion states.

The author archive has six-page navigation and an actual Older posts link to `/author/lumpinou/page/2/`, successfully opened. Do not conflate previous/next item links with history pagination. No author-avatar role was verified on that archive. Homepage About image remains a candidate until role is proven; never turn arbitrary WordPress imagery into a user avatar. The site explicitly provides descriptions/FAQ and directs downloads to Patreon. Support Discord shortlink resolved to `discord.com/invite/wQfG5Su`, but server content was inaccessible.

#### House of Harlix — Quilted Dreams and Harrie

[RDSIM31013–17](https://www.houseofharlix.com/quilted-dreams) pair an original detail with [Harrie’s scoped catalog](https://www.houseofharlix.com/downloads/harrie) and its official linked [Patreon profile](https://www.patreon.com/cw/heyharrie). Identity is slug-based in this retrieval. Shared footer links to both creators alone cannot attribute every creation; creator scope plus the hub’s collaboration model provide context, and uncertain attribution should stay uncertain.

The description is visible with requirements; the same page says Requires Seasons and all pieces base-game-compatible. Keep both conflicting source statements; do not silently repair requirements. Four unique gallery links are repeated by slide navigation; deduplicate repeated carousel references while preserving first-occurrence order and keep the separate leading image. Download actually reaches [CurseForge Quilted Dreams](https://www.curseforge.com/sims4/build-buy/quilted-dreams). Harrie scoped page omitted item cards in text; no complete history/avatar accepted there. The linked Patreon profile exposes a labeled Harrie image and bio, but a latest locked post does not classify the Harlix catalog as locked.

#### Plumbob Post — Swan Set and madlensims facet

[RDSIM31043–47](https://theplumbobpost.com/mod/the-swan-set) pair a directory item with [creator/madlensims](https://theplumbobpost.com/creator/madlensims). Use site-local slug identity; Created by links to Tumblr, while the directory facet is a separate record. Body is directory-written summary, not verified original author prose. The supposed creator avatar resolves to `api.dicebear.com/7.x/avataaars/svg?...seed=madlensims`, a generated fallback; SVG retrieval was unsupported. Represent avatar role as generated placeholder and original avatar unavailable.

The item has leading and gallery media links, but “View Original Source” actually opens [Tumblr tagged/ts4](https://madlensims.tumblr.com/tagged/ts4), a broad archive, not an exact original item. Do not invent a post join. Profile exposes Follow Creator text and Load More Mods even with three listed items; no authenticated relationship state or terminal history accepted. Homepage’s latest-patch testing claim is unverified marketing, not Atlas compatibility evidence.

### Regional, community and existing-service upgrades

SGLYNP homepage [RDSIM31040–42](https://www.sglynp.com/) exposes original work, shared work, trade/customization/subscription and Sims3 categories. Treat re-shared uploader identities separately from original creators. Actual Luka profile `/susername-Luka.` and thread `/t130796` both redirected login, so the homepage’s avatar links and topic snippets cannot establish a readable creator/profile/thread body. No alternate endpoint or login bypass attempted.

[TS4 Mod Hound](https://app.ts4modhound.com/creator/public_page/Lumpinou) [RDSIM31034–37] is particularly useful for attribution: its table includes mod name, filename stem, file type, last-updated, status, notes, download and information reviser. Registered creators maintain their own info; unregistered creators’ records are maintained by Trusted Community Members. Preserve `creator` versus `infoReviser` and source patch/date separately. A filename stem deliberately lacking version numbers is not the full downloaded filename. Blank dates remain unknown. Filtered rows remain filtered. [Signup information](https://app.ts4modhound.com/auth/signup_info) says mod users need no account; creator/trusted-community accounts require verification codes. No login was needed for the observed public profile, no file scan/upload performed.

[Creator Musings Modders Reference](https://thesims4moddersreference.org/) [RDSIM31038–39] supplies current first-party invite provenance: `https://discord.com/invite/yXK5mqXqNv`. Invite returned only shell text. Search also found historical EA-forum invites and a dated temporary-closure statement; do not claim old links or membership availability from those. Other first-party community links actually resolved: Jeni’s `7VHRWnSuj2` (named Die FREDS im Efeuhaufen), Simularity’s `JSTrGHy` (named Simularity), and Lumpinou’s `wQfG5Su` (inaccessible after redirect). SimRealist’s official support link `aAVbNmb` triggered a non-retryable tool safety block; no retry/bypass.

[LittleDica custom-domain Tumblr](https://www.littledica.com/) [RDSIM31060–62] is an existing-service upgrade, not new canonical platform. Actual original [post717876172167495680](https://www.littledica.com/post/717876172167495680/art-deco-lounge-mini-collection-featuring) has two ordered images, exact May21 2023 timestamp, original author and distinct collaborator credits. Actual reblog [730272265308078081](https://www.littledica.com/post/730272265308078081) identifies Ravasheen/ravasheencc while hosted on LittleDica. Parse author chain and curator host separately; notes/users who liked/reblogged are not content authors. Keep reading on other homepage entries prevents complete-body claims.

[JeniJenfred](https://www.jenijenfred.com/en/cc) [RDSIM31056–59] provides a bilingual creator/source/type table and official [Jenijenfinds Tumblr](https://jenijenfinds.tumblr.com/) reblog discovery. Directory labels free/paywalled are curator assertions, not actual entitlement checks. [Sims4Nexus post15746](https://sims4nexus.com/?p=15746) [RDSIM31053–55] identifies publisher samanthagump and outbound SFS/Creator Studio links; the [about page](https://sims4nexus.com/?page_id=181) explicitly distinguishes its curating role. Site-wide original/finds sections must govern authorship inference. Its latest homepage entries were August2023, so avoid claiming active current releases solely from ©2026.

[Simularity official announcement173659752](https://www.patreon.com/simularity/posts/simularity-news-173659752) [RDSIM31050–52] reports a recent redesign and shortened routes. Direct creator site returned403. Those author statements justify a candidate and migration test, not measured speed or universal mod compatibility. Beware automatically linkified illustrative quoted URLs: the returned example links resolve a punycode hostname, so do not adopt those as canonical redirects.

Actual Julie J [Pillowfort profile](https://www.pillowfort.social/Julie-J) initially returned231lines, then became inaccessible. This is a new social-service candidate; detailed item/profile/media/API/follow acceptance remains pending. Do not derive a normalized lower-case handle from the display name.

### Failures, leads and acceptance gates

Saesoli about and six-item catalog are readable, but item links/files were absent from retrieved text. MaySims, Plumbob Tea Society Tumblr, IllogicalSims and Sims4Luxury were inaccessible; MySims4Mods returned502. Keep these as discovery/failure records, not accepted new adapters. Search snippets were used only as leads; no snippet-only fixture was created. Media formats returning unsupported types remain failures, and later inaccessible reopens do not erase initial successes.

Next useful gates: permitted DOM snapshots for these exact pairs; field-level extraction including explicit missing avatar; original author/uploader/curator joins; independent project/mod pagination to terminal state; image ordering and carousel deduplication; GIF/video decode/playback; legitimate entitlement on each external download; binary/archive/hash verification; and read-only signed-in follow/import behavior. No selectors, undocumented APIs, CSS paths, schema fields or pagination query parameters were invented. No platform-wide acceptance or target-project performance result follows from these observations.
