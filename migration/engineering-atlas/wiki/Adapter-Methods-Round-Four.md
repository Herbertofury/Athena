[← Atlas home](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home) · [Canonical source](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/adapters/round4-methods.md)

> **Publication status — November 3, 2026:** The November 2 repository package is prepared and locally validated; publication is pending. This reviewed wiki page does not establish that its referenced new code or expanded catalog is live. See the [Atlas home status](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home).

# Round four: broader communities and executable forum/social methods

[Adapter laboratory](https://github.com/Herbertofury/Engineering-Atlas/wiki/Site-Adapters) · [Coverage catalog](https://github.com/Herbertofury/Engineering-Atlas/wiki/Site-Adapter-Coverage) · [Machine evidence](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/site-adapter-discovery/community-research-round4-2026-11-02.json)

Reviewed **2026-11-02 UTC**. This pass adds **50 deduplicated canonical research scopes**, taking the catalog from **426 to 476**, and improves **13 existing services**. It records **240 dated source observations or retrieval outcomes across 239 distinct URLs**, with **169 relevant primary-content observations and 71 outcomes without relevant primary content**. The catalog now embeds **1750 source records**. The repository's complete source register contains **2385 records** after this additive pass.

The work includes two new executable offline normalizers: [Discourse](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Discourse) and [Mastodon](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Mastodon). Both have actual public-data replays and defensive synthetic tests. **Zero new full-support acceptances** are claimed. Fifty catalog additions are fifty researched scopes, not fifty complete adapters; reference-only, discovery-only and incomplete candidates retain their explicit boundaries.

## What was searched and retained

| Research bundle | Source outcomes | Candidate or improvement records | Inspection records | Official-origin Discord scope records |
|---|---:|---:|---:|---:|
| [Six target games](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Round-Four-Target-Games) | 79 | 25 | 14 | 12 |
| [Other game ecosystems](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Round-Four-Other-Games) | 91 | 26 | 12 | 5 |
| [Mastodon, Lemmy and Matrix](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/site-adapter-discovery/round4-social-2026-11-02.json) | 17 | 4 | 2 | 0 |
| [Forums and game-resource commerce](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/site-adapter-discovery/round4-forums-commerce-2026-11-02.json) | 53 | 12 | 8 | 3 |
| **Total** | **240** | **67** | **36** | **20** |

Inspection records include failed or incomplete joins; they are not 36 complete adapter acceptances. A repeated URL can have different retrieval outcomes: the Stonehearth ACE Discord discovery page first returned a readable representation and later a 404. Both remain visible instead of replacing one with the other. [RDROOT02048] [RDROOT02049]

The six-game pass covers Minecraft, The Sims 4, Hytale, Skyrim SE/AE, Fallout 4 and Cyberpunk 2077. It adds original project/studio hubs including Vivecraft, ReplayMod, Physics Mod, Iris Shaders, R.I.B.S., Noxcrew, Syclone, Spark Universe, Essential and Sacrificial Mods. Existing itch.io, Tumblr, GitHub, Bedrock Explorer, Hytale, Modtale, Fallout London, Silverlock and Kaidan observations receive additional method evidence. [Target-game source and method table](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Round-Four-Target-Games).

The broader pass covers Vintage Story, Dwarf Fortress, Starbound, World of Warcraft, ESO, LOTRO, Warcraft III, OpenTTD, truck simulators, Wesnoth, Neverwinter Nights, Stardew Valley, Beat Saber, Terraria, Command & Conquer, Civilization, OpenRA, Source mapping, RollerCoaster Tycoon, Nintendo modding and Luanti. Sources include Vintage Story Mod DB, DFFD, Chucklefish, MMOUI sites, Hive Workshop, BaNaNaS, TruckyMods, Neverwinter Vault, CivFanatics, PPM, Mapcore and RCTgo. Each has its own route, identity, body/media, history, files and remaining gate. [Other-games field evidence](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Round-Four-Other-Games).

## Concrete implemented improvements

| Implementation | Actual evidence | Defensive verification | Still unaccepted |
|---|---|---|---|
| [Discourse](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Discourse) | Six public community topics; **85 normalized posts**; **four numeric profile joins**; **six image decodes**; 12 successful JSON reads and two profile 403s retained | 26 synthetic tests covering stream order, ID joins, duplicates, missing bodies, quote/onebox/lightbox roles, malformed input, restricted receipts and staff whispers | Complete creator history, generalized edit/delete collection, native follows, paid access, mod archives and video playback |
| [Mastodon](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Mastodon) | Two public organization profiles; **three timeline pages and 15 outer statuses**; one boost and one video attachment; real returned-link continuation on Godot's account | 12 synthetic tests covering opaque identities, boosts/quotes, visibility, media states, unsafe pagination, malformed input and private receipt redaction | Actual quote fixture, media decode/playback, complete history, authenticated relationships and native follow/import |

The normalizers consume caller-supplied captured JSON and perform no network requests. Runtime objects retain original body and delivery information for a trusted caller; public receipts contain explicit whitelisted fields. Arbitrary source prose, tokens, URL paths and restricted content are excluded. The shared transport remains a separate concern; the maintained [Discourse API client](https://github.com/discourse/discourse_api) is an evaluated reuse candidate, not newly copied infrastructure. [RDROOT02004]

The existing [Discord guide](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Discord) also had a runnable-example bug: its access value now uses `available`, matching the implementation's supported enum. The existing Discord normalizer remains documented/synthetic-only; no live Discord message extraction or new gateway lifecycle collector is claimed.

## Decisions that change extraction behavior

**Capture windows must stay honest.** Crate's Grim UI topic returned 20 of 776 stream IDs; a further five sampled posts leave 751 uncollected. Stonehearth ACE returned 20 of 802, leaving 782. CDDA's initial 20 plus nine requested IDs cover its 29-ID captured stream, while `completeHistory` remains false. Funcom returns three stream IDs but declares one post; that contradiction is retained. Discourse `post_number` is not an index into `post_stream.stream`, especially after deletions or splits. [RDROOT02002] [RDROOT02003] [RDROOT02014] [RDROOT02019] [RDROOT02022] [RDROOT02024]

**Public-topic status does not authorize staff-only content.** Upstream Discourse distinguishes ordinary/moderator/small-action types from staff whispers. The receipt allows only known public types with all other visibility conditions satisfied; unknown, absent and whisper types redact identity, body hashes, media and profile joins. The behavior is defensive-test evidence, not a claim that a staff capture was collected. [RDROOT02006] [RDROOT02007]

**Item and creator relationships need exact evidence.** Four forum profile joins pass; Funcom and MSFS profiles return 403. Marketplace ONX's numeric creator relation is visible, but a header image is not an accepted avatar. Flightsim.to's original item redirects while retaining ID 102207; its linked profile is unreadable, and explicit MSFS2024 body text conflicts with broad header tags. The original release's compatibility statement and the conflicting tags both remain stored. [RDROOT02018] [RDROOT02020] [RDROOT02021] [RDROOT02023] [RDROOT02025] [RDROOT02027] [RDROOT02040] [RDROOT02042] [RDROOT02043]

**Paid resources require distinct metadata, identity and entitlement handling.** The [Tebex/Cfx guide](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Tebex-and-Cfx) separates forum announcements, marketplace package IDs and opaque Tebex identifiers. One original product link redirects to a store homepage, so its intended product is unresolved. Public or free metadata does not prove acquired entitlement. The dated Cfx Legacy/Enhanced difference also prevents applying Asset Escrow capability to every runtime. [RDROOT02035] [RDROOT02036] [RDROOT02037] [RDROOT02041]

## Deduplication, holds and failed leads

The 67 proposal/improvement records map to 50 new canonical scopes and 13 distinct existing services, with repeated improvements preserved. Programming.Dev's Godot community is scoped under Lemmy rather than counted as another platform. LittleDica's custom domain remains under Tumblr; CaffeineMC's redirect remains under GitHub. Spark Universe's studio and Essential's dedicated product/distribution domain remain distinct scopes, with no claim that they use unrelated infrastructure.

Two proposals are held outside the canonical count: Hytale Gateway yielded no relevant readable body; Modding.wiki yielded only an analytics iframe. Both stay in the evidence bundle. SimSync is explicitly discovery-only. NightCoop has original project content, but its download page says the displayed builds are demonstration data without files and its linked repository excludes the game mod. No downloadable release is accepted from that material. Historical Distar and KawaiiStacie locators serving unrelated content are retained as excluded failed leads. [Target-game decisions and sources](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Round-Four-Target-Games).

The **20 official-origin Discord scope records** preserve originating project/site links and observed invite/discovery outcomes. They are not 20 newly supported Discord servers. No account joined a guild, installed a bot, read a private channel, imported follows or changed notifications. Existing Discord capabilities and channel permissions remain operation-specific.

## Implementation order supported by this evidence

1. Expand the two new normalizers with additional actual permitted fixtures for edits/deletions, attachment variants, quote authorization and multi-window termination. Retain the existing real replays as sample baselines and keep new defensive fixtures labeled synthetic.
2. Build exact item/profile contracts for the strongest structured routes: DFFD's file JSON, OpenRA's hash/revision JSON, Vintage Story's documented API, BaNaNaS version metadata and the observed resource-manager/forum families. Resolve the retained schema, stale-page and access failures before acceptance. [Other-games methods](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Round-Four-Other-Games).
3. Add a permitted Tebex API fixture and complete marketplace item/creator pagination evidence before implementing paid-resource delivery. Treat product redirects, escrow, runtime compatibility and entitlement as separate outcomes.
4. Retain official-origin Discord and federated-community discovery as a provenance layer. Message/event collection requires its own permitted fixture and operation evidence; invitation discovery alone cannot supply it.

This pass changes Engineering Atlas research, executable experiments and documentation. It makes no GameSync Next integration or performance claim. The [source register addition](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/sources.d/adapter-communities-round4-20261102.json), four original bundles and combined manifest preserve what was observed, what failed and what remains to be proven.

## Local verification

The [validation receipt](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/site-adapter-discovery/round4-validation-2026-11-02.json) records **359 passing Python tests**, including **109 site-extraction tests**, and **45 passing JavaScript tests**. Source structure checks cover 2385 registered sources; generated explorer/card/media asset checks pass. The existing benchmark comparator passes on its explicitly synthetic fixture; this is not a measured application performance result. Independent review checked baseline preservation, canonical deduplication, source mappings, publication boundaries and implementation receipts.
