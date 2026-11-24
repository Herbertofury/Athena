<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
[← Atlas home](https://github.com/Herbertofury/Athena/wiki/Engineering-Home) · [Canonical source](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/adapters/README.md)

# Adapter laboratory

**Collect real data. Preserve source identity. Prove complete media and responsive cards together.**

Research and implementation status are separate. A platform listing is not proof that all pages, paid content or media work. Existing adapters and maintained upstream tools are baselines, not disposable scaffolding.

## Expanded research: 426 service and scope entries

Reviewed **October 31, 2026 UTC**, retaining dated October 28 evidence. The [coverage catalog](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapter-Coverage) spans mod hosts, paid creator platforms, social networks, regional communities, blogs, code forges, file hosts and specialist indexes. The first six-game expansion reached 248 entries; the second added 98 canonical services/scopes, bringing that dated snapshot to **346**. The October 31 screenshot review adds Pawchive, Tipeee and historical HYPAGE as researched candidates, bringing that snapshot to **349**; [the per-site matrix](https://github.com/Herbertofury/Athena/wiki/Engineering-Paid-Platform-Adapters#screenshot-coverage-and-operation-evidence--october-31) retains unresolved Library and explicit operation gates. The [new extraction methods](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapter-Extraction-Methods) retain 71 game/cross-game recipes, five additional browser scopes, actual failures, field boundaries and remaining gates. The [round-three community and social pass](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Methods-Round-Three) adds 77 deduplicated scopes and 367 dated source/outcome records, bringing current coverage to **426**. Every entry has operation-specific evidence status; a catalog entry does not imply complete support.

The [itch.io adapter guide](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Itch-io) adds a separate scoped DOM experiment with [two actual public replays](https://github.com/Herbertofury/Athena/blob/main/engineering/experiments/site-adapter-discovery/itch-io-dom-replay-2026-10-31.json) and nine defensive tests. It does not establish complete authenticated access, history or file-transfer support.

The [executable extraction lab](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Extraction-Lab) replays nine real captured fixtures through eight parser families, producing 27 normalized records with sanitized receipts. Authenticated checks now include [Mod Collective](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Mod-Collective), [SubscribeStar](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-SubscribeStar) and [Patreon](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Patreon). Actual browser downloads are verified for a public Patreon release and [SimsFinds](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-SimsFinds), alongside the earlier Mod Collective fixture. Member-only bodies, complete histories and native follow operations remain separately gated.

| Research area | Start here |
|---|---|
| Every entry, route, follow semantics and evidence state | [Coverage catalog](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapter-Coverage) · [Machine-readable records and source statuses](https://github.com/Herbertofury/Athena/blob/main/engineering/data/site-adapter-catalog.json) |
| Actual extraction boundaries, evidence and working parser samples | [Round-three methods](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Methods-Round-Three) · [Second-round methods](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapter-Extraction-Methods) · [Executable extraction lab](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Extraction-Lab) |
| Skyrim SE/AE, Fallout 4, Minecraft, Sims 4, Cyberpunk 2077 and Hytale | [Game community guides, actual item/profile inspections and source records](https://github.com/Herbertofury/Athena/wiki/Engineering-Game-Community-Adapters) |
| Mod distribution, projects, creators, releases and files | [Mod hosts: 15 deep recipes](https://github.com/Herbertofury/Athena/wiki/Engineering-Mod-Host-Adapters) |
| Membership posts, paid downloads and creator stores | [Paid platforms: 12 deep recipes](https://github.com/Herbertofury/Athena/wiki/Engineering-Paid-Platform-Adapters) |
| Social posts, reblogs, videos, blogs, code and cloud files | [Social and publishing: 15 deep recipes](https://github.com/Herbertofury/Athena/wiki/Engineering-Social-and-Publishing-Adapters) |
| Korean/Japanese/Chinese blogs and regional mod communities | [Regional platforms: 8 detailed plans](https://github.com/Herbertofury/Athena/wiki/Engineering-Regional-Platform-Adapters) |
| Tumblr | [Dedicated NPF, author/avatar, media and following recipe](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Tumblr) |
| SubscribeStar and SubscribeStar.adult | [Separate-origin API, access and following review](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-SubscribeStar) |
| Dwemer Mods | [Credited author versus uploader; structured-data limits](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Dwemer-Mods) |
| WCIF.cc | [Rendered directory, creator identity, item/source links and tested pagination](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-WCIF) |
| Plumbdex / Plumdex | [Creator matches, file index, avatars and account follows](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Plumbdex) |
| Mod Collective | [Signed-in body, author/avatar, ordered gallery and actual mod-file receipt](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Mod-Collective) |
| SimsFinds | [Actual body, byline/profile join, preview and verified package delivery](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-SimsFinds) |
| TS4 Rebels | [Forum identities, hidden links, feeds and attachment provenance](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-TS4-Rebels) |
| Mirrors and reuploads | [Provenance and original-source relationships](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Mirrors-and-Provenance) |

The catalog includes LoversLab, Planet Minecraft, The Sims Resource, Mod The Sims, SimsFinds, SimsDom, Sims File Share, Mod Collective, Daymarr, Nexus Mods, CurseForge, Modrinth, mod.io, Thunderstore, Bethesda Creations, Hangar, SpigotMC, BuiltByBit, Polymart/voxel.shop, ModDB, Hytale sources, Patreon, FANBOX, Fantia, Boosty, Afdian, Ko-fi, Gumroad, itch.io, BOOTH, Ci-en, Fourthwall and many more. Cross-game creators require separate Skyrim SE, Fallout 4, Minecraft, Sims 4, Hytale and Cyberpunk 2077 fixtures; a shared domain does not establish every game/file format.

## What a complete author-following app needs

- Stable creator identity, correct profile image and reversible links between the creator's own accounts; uploader, team, translator and reblogger roles preserved.
- Complete accessible post body, ordered images/video/audio, captions, edits, external embeds and distinct download attachments.
- Project/release/file identity, version and game/loader compatibility, dependencies, provenance and entitlement-aware delivery.
- Separate local follows, source follows, follow-list imports, project watches, notification settings and paid memberships.
- Resumable history, edit/removal detection, honest partial results, account-scoped caches, expiry recovery and measured rate control.

The [author, post, media and follow contract](https://github.com/Herbertofury/Athena/wiki/Engineering-Author-Post-Media-and-Follow-Contract) defines these requirements. The [login workflow](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Login-and-Authenticated-Research) describes protected sign-in and account-specific fixtures. The [validation and adoption gate](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Validation-and-Adoption) defines what must be proven before an implementation or a GameSync Next change is accepted.

## Existing platform workbenches and retained evidence

- [Patreon](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Patreon)
- [Afdian](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Afdian)
- [YouTube](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-YouTube)
- [Bilibili](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Bilibili)
- [X](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-X)
- [Facebook](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Facebook)
- [Discord](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Discord)
- [Steam](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Steam)
- [SteamDB](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-SteamDB)
- [CurseForge](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-CurseForge)
- [Nexus Mods](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Nexus-Mods)
- [Modrinth](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Modrinth)
- [GitHub](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-GitHub) · selected public upstream metadata, not release-asset coverage
- [Wikimedia Commons](https://github.com/Herbertofury/Athena/wiki/Engineering-Home/Wikimedia-Commons-Adapter-Research) · selected public audio metadata/file verification, not browser playback or full-platform coverage

Nexus Mods groups Skyrim Special Edition, Fallout 4 and Starfield with distinct game-domain fixtures.

## Shared engineering

- [Author, post, media and follow contract](https://github.com/Herbertofury/Athena/wiki/Engineering-Author-Post-Media-and-Follow-Contract)
- [Login and authenticated research](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Login-and-Authenticated-Research)
- [Correctness, adoption and maintenance](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Validation-and-Adoption)
- [Collection, media and session contract](https://github.com/Herbertofury/Athena/wiki/Engineering-Collection-and-Media-Contract)
- [Maintained upstream candidates](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Upstream-Candidates)
- [Browser card-density lab](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/card-lab/index.html)
- [Measured storage workload](https://github.com/Herbertofury/Athena/blob/main/engineering/experiments/rust-storage-lab/README.md)
- [Dated research decision and source register references](https://github.com/Herbertofury/Athena/blob/main/engineering/research/2026-10-28-site-adapters.md)
- [Six-game expansion and authenticated fixture decision](https://github.com/Herbertofury/Athena/blob/main/engineering/research/2026-10-28-game-adapter-expansion.md)
- [Second-round method evidence and source records](https://github.com/Herbertofury/Athena/blob/main/engineering/research/2026-10-28-adapter-methods-round2.md)
- [Public specialist-site observation receipt](https://github.com/Herbertofury/Athena/blob/main/engineering/experiments/site-adapter-discovery/README.md)

## Next proof work

1. Expand the retained samples into complete acceptance corpora, including edited/deleted posts, multi-page histories, missing or incorrect creator joins, animated media and expiring files. The current Modrinth, WordPress/RSS, Tumblr DOM and specialist-site observations provide concrete starting points; API/NPF parity remains a separate check.
2. Use authorized member fixtures to compare guest, signed-in nonmember and entitled states. Patreon and SubscribeStar sign-in succeeded, but that does not establish paid access. Follow-list imports and native writes require their own evidence; creator administration APIs do not automatically expose a patron's subscriptions.
3. Resolve each remaining operation using the catalog's evidence state and the same acceptance corpus. Where a site permits only embeds, links or creator-installed integrations, expose that capability accurately. Preserve policy-blocked and failed results instead of calling them working adapters.

Each provider keeps its actual review date and source status. The [wiki projection instructions](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Wiki-Maintenance) keep this source and the wiki aligned without overwriting unrelated pages.

## Promotion rule

General results stay here. Only verified improvement against a target project's current implementation earns a recommendation in that project's wiki/TODO. No new project recommendations were made from generated card or storage workloads.

## Real-media workbench

[Open the public media laboratory](https://herbertofury.github.io/Athena/engineering/docs/media-lab/) for real source snapshots, image decode and explicit player states. [Retained browser evidence](https://github.com/Herbertofury/Athena/blob/main/engineering/experiments/real-media-lab/README.md) distinguishes working Steam playback, delayed YouTube playback with a failed thumbnail, and unknown gallery coverage.

## Round-three communities and executable social normalization

[Round-three methods](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Methods-Round-Three) expands the catalog to426 canonical service/scope entries with367 new dated source/outcome records. It combines six game passes, [other game communities](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Other-Games), [Discord normalization](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Discord) and [actual Bluesky public API extraction](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Bluesky). Independent alias review keeps hosted project scopes under their existing service. The previous349-scope snapshot and earlier workbench results remain dated evidence.
