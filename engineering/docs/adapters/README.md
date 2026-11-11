# Adapter laboratory

**Collect real data. Preserve source identity. Prove complete media and responsive cards together.**

Research and implementation status are separate. A platform listing is not proof that all pages, paid content or media work. Existing adapters and maintained upstream tools are baselines, not disposable scaffolding.

## Expanded research: 426 service and scope entries

Reviewed **October 31, 2026 UTC**, retaining dated October 28 evidence. The [coverage catalog](coverage-catalog.md) spans mod hosts, paid creator platforms, social networks, regional communities, blogs, code forges, file hosts and specialist indexes. The first six-game expansion reached 248 entries; the second added 98 canonical services/scopes, bringing that dated snapshot to **346**. The October 31 screenshot review adds Pawchive, Tipeee and historical HYPAGE as researched candidates, bringing that snapshot to **349**; [the per-site matrix](paid-platforms.md#screenshot-coverage-and-operation-evidence--october-31) retains unresolved Library and explicit operation gates. The [new extraction methods](methods-round2.md) retain 71 game/cross-game recipes, five additional browser scopes, actual failures, field boundaries and remaining gates. The [round-three community and social pass](methods-round3.md) adds 77 deduplicated scopes and 367 dated source/outcome records, bringing current coverage to **426**. Every entry has operation-specific evidence status; a catalog entry does not imply complete support.

The [itch.io adapter guide](itch-io.md) adds a separate scoped DOM experiment with [two actual public replays](../../experiments/site-adapter-discovery/itch-io-dom-replay-2026-10-31.json) and nine defensive tests. It does not establish complete authenticated access, history or file-transfer support.

The [executable extraction lab](../../experiments/site-extraction-lab/README.md) replays nine real captured fixtures through eight parser families, producing 27 normalized records with sanitized receipts. Authenticated checks now include [Mod Collective](mod-collective.md), [SubscribeStar](subscribestar.md) and [Patreon](patreon.md). Actual browser downloads are verified for a public Patreon release and [SimsFinds](simsfinds.md), alongside the earlier Mod Collective fixture. Member-only bodies, complete histories and native follow operations remain separately gated.

| Research area | Start here |
|---|---|
| Every entry, route, follow semantics and evidence state | [Coverage catalog](coverage-catalog.md) · [Machine-readable records and source statuses](../../data/site-adapter-catalog.json) |
| Actual extraction boundaries, evidence and working parser samples | [Round-three methods](methods-round3.md) · [Second-round methods](methods-round2.md) · [Executable extraction lab](../../experiments/site-extraction-lab/README.md) |
| Skyrim SE/AE, Fallout 4, Minecraft, Sims 4, Cyberpunk 2077 and Hytale | [Game community guides, actual item/profile inspections and source records](games/README.md) |
| Mod distribution, projects, creators, releases and files | [Mod hosts: 15 deep recipes](mod-hosts.md) |
| Membership posts, paid downloads and creator stores | [Paid platforms: 12 deep recipes](paid-platforms.md) |
| Social posts, reblogs, videos, blogs, code and cloud files | [Social and publishing: 15 deep recipes](social-platforms.md) |
| Korean/Japanese/Chinese blogs and regional mod communities | [Regional platforms: 8 detailed plans](regional-platforms.md) |
| Tumblr | [Dedicated NPF, author/avatar, media and following recipe](tumblr.md) |
| SubscribeStar and SubscribeStar.adult | [Separate-origin API, access and following review](subscribestar.md) |
| Dwemer Mods | [Credited author versus uploader; structured-data limits](dwemer-mods.md) |
| WCIF.cc | [Rendered directory, creator identity, item/source links and tested pagination](wcif.md) |
| Plumbdex / Plumdex | [Creator matches, file index, avatars and account follows](plumbdex.md) |
| Mod Collective | [Signed-in body, author/avatar, ordered gallery and actual mod-file receipt](mod-collective.md) |
| SimsFinds | [Actual body, byline/profile join, preview and verified package delivery](simsfinds.md) |
| TS4 Rebels | [Forum identities, hidden links, feeds and attachment provenance](ts4-rebels.md) |
| Mirrors and reuploads | [Provenance and original-source relationships](mirrors-and-provenance.md) |

The catalog includes LoversLab, Planet Minecraft, The Sims Resource, Mod The Sims, SimsFinds, SimsDom, Sims File Share, Mod Collective, Daymarr, Nexus Mods, CurseForge, Modrinth, mod.io, Thunderstore, Bethesda Creations, Hangar, SpigotMC, BuiltByBit, Polymart/voxel.shop, ModDB, Hytale sources, Patreon, FANBOX, Fantia, Boosty, Afdian, Ko-fi, Gumroad, itch.io, BOOTH, Ci-en, Fourthwall and many more. Cross-game creators require separate Skyrim SE, Fallout 4, Minecraft, Sims 4, Hytale and Cyberpunk 2077 fixtures; a shared domain does not establish every game/file format.

## What a complete author-following app needs

- Stable creator identity, correct profile image and reversible links between the creator's own accounts; uploader, team, translator and reblogger roles preserved.
- Complete accessible post body, ordered images/video/audio, captions, edits, external embeds and distinct download attachments.
- Project/release/file identity, version and game/loader compatibility, dependencies, provenance and entitlement-aware delivery.
- Separate local follows, source follows, follow-list imports, project watches, notification settings and paid memberships.
- Resumable history, edit/removal detection, honest partial results, account-scoped caches, expiry recovery and measured rate control.

The [author, post, media and follow contract](author-post-media-contract.md) defines these requirements. The [login workflow](authenticated-research.md) describes protected sign-in and account-specific fixtures. The [validation and adoption gate](validation-and-adoption.md) defines what must be proven before an implementation or a GameSync Next change is accepted.

## Existing platform workbenches and retained evidence

- [npm package metadata](npm.md): exact version/tag scope, full versus abbreviated fields and README provenance from actual public responses. Metadata evidence only.

- [Patreon](patreon.md)
- [Afdian](afdian.md)
- [YouTube](youtube.md)
- [Bilibili](bilibili.md)
- [X](x.md)
- [Facebook](facebook.md)
- [Discord](discord.md)
- [Steam](steam.md)
- [SteamDB](steamdb.md)
- [CurseForge](curseforge.md)
- [Nexus Mods](nexus-mods.md)
- [Modrinth](modrinth.md)
- [GitHub](github.md) · selected public upstream metadata, not release-asset coverage
- [Wikimedia Commons](wikimedia-commons.md) · selected audio verification and scoped upload-revision chains; not browser playback or full-platform coverage

Nexus Mods groups Skyrim Special Edition, Fallout 4 and Starfield with distinct game-domain fixtures.

## Shared engineering

- [Author, post, media and follow contract](author-post-media-contract.md)
- [Login and authenticated research](authenticated-research.md)
- [Correctness, adoption and maintenance](validation-and-adoption.md)
- [Collection, media and session contract](contract.md)
- [Maintained upstream candidates](upstream-candidates.md)
- [Browser card-density lab](../card-lab/index.html)
- [Measured storage workload](../../experiments/rust-storage-lab/README.md)
- [Dated research decision and source register references](../../research/2026-10-28-site-adapters.md)
- [Six-game expansion and authenticated fixture decision](../../research/2026-10-28-game-adapter-expansion.md)
- [Second-round method evidence and source records](../../research/2026-10-28-adapter-methods-round2.md)
- [Public specialist-site observation receipt](../../experiments/site-adapter-discovery/README.md)

## Next proof work

1. Expand the retained samples into complete acceptance corpora, including edited/deleted posts, multi-page histories, missing or incorrect creator joins, animated media and expiring files. The current Modrinth, WordPress/RSS, Tumblr DOM and specialist-site observations provide concrete starting points; API/NPF parity remains a separate check.
2. Use authorized member fixtures to compare guest, signed-in nonmember and entitled states. Patreon and SubscribeStar sign-in succeeded, but that does not establish paid access. Follow-list imports and native writes require their own evidence; creator administration APIs do not automatically expose a patron's subscriptions.
3. Resolve each remaining operation using the catalog's evidence state and the same acceptance corpus. Where a site permits only embeds, links or creator-installed integrations, expose that capability accurately. Preserve policy-blocked and failed results instead of calling them working adapters.

Each provider keeps its actual review date and source status. The [wiki projection instructions](wiki-sync.md) keep this source and the wiki aligned without overwriting unrelated pages.

## Promotion rule

General results stay here. Only verified improvement against a target project's current implementation earns a recommendation in that project's wiki/TODO. No new project recommendations were made from generated card or storage workloads.

## Real-media workbench

[Open the public media laboratory](https://herbertofury.github.io/Athena/engineering/docs/media-lab/) for real source snapshots, image decode and explicit player states. [Retained browser evidence](../../experiments/real-media-lab/README.md) distinguishes working Steam playback, delayed YouTube playback with a failed thumbnail, and unknown gallery coverage.

## Round-three communities and executable social normalization

[Round-three methods](methods-round3.md) expands the catalog to426 canonical service/scope entries with367 new dated source/outcome records. It combines six game passes, [other game communities](games/other-games.md), [Discord normalization](discord.md) and [actual Bluesky public API extraction](bluesky.md). Independent alias review keeps hosted project scopes under their existing service. The previous349-scope snapshot and earlier workbench results remain dated evidence.

## WordPress multi-page evidence

[WordPress collection reconciliation](wordpress-collections.md) reuses the existing single-post parser and distinguishes a two-post filtered scope from an incomplete 1,117-page public collection. Failures, missing pages, contradictory snapshots, protected/null bodies and unattempted media gates remain explicit. It is an offline experiment, not an application integration.


## Bluesky thread context

[Scoped thread evidence](bluesky.md#scoped-thread-context--november-11-2026) extends the existing offline post normalizer with ancestor/reply relationships and explicit unavailable context. Three anonymous captures demonstrate that reply counts and omitted arrays are not complete conversation history. No target integration or playback acceptance is implied.
