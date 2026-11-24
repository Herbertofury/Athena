# Game ecosystem research

[Coverage catalog](../coverage-catalog.md) · [Adapter laboratory](../README.md) · Checked **2026-10-28 UTC**.

The initial six-game expansion connected original distribution sites, creator and team hosts, regional communities, source releases, indexes and authoring references. They retain 179 game scope records with 420 source records. That first expansion added 86 unique services after canonicalizing platforms across games; these figures measure discovery coverage, not working adapters.

| Game | Scopes in bundle | Source records | Concrete inspection evidence | Status |
|---|---:|---:|---|---|
| [Skyrim SE / AE](skyrim-se.md) | 35 | 72 | 11 item/profile inspection cases | Public research; full support unaccepted |
| [The Sims 4](sims-4.md) | 32 | 71 | 16 entries with detailed observations; 19 page observations; 2 content images displayed | Public research; full support unaccepted |
| [Minecraft Java / Bedrock](minecraft.md) | 31 | 67 | Public project/profile/API observations; Modrinth version file manifest; Voxel resource JSON | Public research; full support unaccepted |
| [Fallout 4](fallout-4.md) | 28 | 79 | 13 content/profile pairs: 12 successful, 1 partial | Public research; full support unaccepted |
| [Cyberpunk 2077](cyberpunk-2077.md) | 29 | 64 | 11 opened primary item/profile pairs | Public research; full support unaccepted |
| [Hytale](hytale.md) | 24 | 67 | 9 project/post/profile pairs; 4 file metadata cases | Public research; full support unaccepted |

Counts overlap across games. The same platform is a single catalog entry even when several creators or upstream repositories were inspected. Game scope records preserve those differences: Nexus creator/uploader/gallery roles; GitHub repository owner, release author and asset uploader; paid creator memberships versus free public pages; and regional publisher/translator versus original author. Independent creator domains can form separate services, while Tumblr, Patreon, Ko-fi, Reddit and YouTube accounts remain scopes of their existing platform.

The [machine evidence manifest](../../../experiments/site-adapter-discovery/game-research-2026-10-28.json) retains all six sanitized bundles, original source/retrieval classifications, canonical entry IDs, failed requests, shells, partial profiles, external handoffs and unsupported scopes. The Fallout source prefix is normalized from `FO4X` to `FOX` to satisfy the source-register ID contract; original IDs remain recorded.

## What the evidence establishes

Opened public pages establish only the fields actually described in the individual observation. A displayed avatar can identify a profile image without proving every post’s author join; a gallery count can reveal another channel without proving every image was fetched; a file manifest can identify filenames and hashes without establishing downloaded bytes. The guides keep these operations separate and do not invent DOM selectors from rendered text.

The bundles contain zero new authenticated or full-support acceptances. Existing workbench receipts keep their original scopes. The separate [Mod Collective authenticated fixture](../mod-collective.md) recovered one post body, author, avatar, three images and an authorized free file; it does not promote the public game bundles to full support. Native follow mutation/import, complete creator history, exact entitlement behavior, installation, exhaustive media decoding and playback require separate fixtures unless another receipt explicitly proves the operation.

## Boundaries that affect discovery

Skyrim preserves unavailable historical community routes and a rejected unrelated redirect. Fallout keeps a failed AFK profile pair, dynamic Creations shell, login-gated GUN content and routing ambiguities. Sims distinguishes original creator distribution from reindexes and paid access. Cyberpunk keeps original project repositories, REDmodding references and creator platforms separate, including blocked or incomplete pages. Minecraft distinguishes project follow from author follow and keeps original MCBBS apart from Memorial Edition. Hytale distinguishes officially documented in-game delivery, current external hosts, legacy regional archives and Modrinth’s explicitly unsupported Hytale scope.

## Next acceptance work

Use the [shared contract](../author-post-media-contract.md), [secure login workflow](../authenticated-research.md) and [adoption gates](../validation-and-adoption.md) to capture permitted real fixtures. Verify stable identities and avatars; compare full body and ordered media; establish pagination termination, edits and failures; then test authorized files, playback and follow/import as separate operations. Choose candidates by the required game, original authorship, maintained releases, access permission and fixture quality, rather than catalog size.

## Round-two method research

The second pass adds concrete body/identity/media/file methods, executed sample receipts, preserved parity failures and additional independent discovery. [Cross-site methods](../methods-round2.md) maps every catalog entry to its evidence routes and unknown operations. These results append to the first-pass scope above.

| Game | Candidate scopes | Inspected scopes | Method recipes | Sources | Retained failure records |
|---|---:|---:|---:|---:|---:|
| [Skyrim SE / AE](skyrim-se.md#round-two-concrete-methods) | 14 | 53 | 11 | 70 | 20 |
| [Minecraft Java / Bedrock](minecraft.md#round-two-concrete-methods) | 22 | 9 | 4 | 63 | 8 |
| [The Sims 4](sims-4.md#round-two-concrete-methods) | 20 | 17 | 18 | 75 | 27 |
| [Fallout 4](fallout-4.md#round-two-concrete-methods) | 10 | 13 | 11 | 53 | 7 |
| [Cyberpunk 2077](cyberpunk-2077.md#round-two-concrete-methods) | 12 | 28 | 9 | 32 | 10 |
| [Hytale](hytale.md#round-two-concrete-methods) | 14 | 8 | 8 | 39 | 11 |
| [Additional game ecosystems](../methods-round2.md) | 12 | 33 | 10 | 35 | 8 |

The 104 candidate scopes add 98 canonical service entries after platform/domain normalization. The 71 research recipes include sample-proven selectors/schema, executed normalizers, semantic extraction plans and documented alternatives; their individual states remain explicit. Every final catalog entry (346) has operation evidence and unknown fields. The game bundles add no authenticated or full-support acceptance. Separate browser receipts can prove narrower operations.

## Round-three update — October 31

All six guides now append another dated community and item/profile extraction pass. [Other game ecosystems](other-games.md) adds Outer Wilds, Celeste, Rain World, Doom, Sonic, Project Zomboid, 7 Days to Die, flight-simulator, SimCity, Souls and Satisfactory scopes. The [round-three index](../methods-round3.md) lists normalized counts and executable social improvements. Original proposal counts remain visible; the canonical catalog merges aliases and same-project documentation.
