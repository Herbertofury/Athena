# Public source and reuse inventory

Reviewed 2026-11-14. These are research/implementation references, not enabled ingestion sources. No fetched creator records or copied third-party datasets are included.

| Source | Reuse target | Boundary |
|---|---|---|
| [Athena creator/post/media contract](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/adapters/author-post-media-contract.md) | provider-qualified identities, attribution, access and completeness | Proposed contract is not proof of working adapters |
| [Minecraft-Mod-Vault](https://github.com/Herbertofury/Minecraft-Mod-Vault) | compatibility version/loader/toolchain knowledge, creator profile evidence, FTS and seed import semantics | Inventory first; review source/data license and publication before porting. Existing private/local data is not automatically public |
| [SQLite usage guidance](https://www.sqlite.org/whentouse.html) | embedded offline database baseline | Not a claim of universal superiority or network-shared database suitability |
| [SQLite WAL](https://www.sqlite.org/wal.html) | concurrency/reference | WAL files are not a cross-host sharing protocol |
| [SQLite backup API](https://www.sqlite.org/backup.html) | consistent snapshots | Public projection/backup not implemented in this crate yet |
| [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html) | relational integrity | Enable per connection, not merely once through a pool |
| [SQLite FTS5](https://www.sqlite.org/fts5.html) | prospective knowledge search | Not implemented in this initial crate |
| [rusqlite](https://docs.rs/rusqlite/latest/rusqlite/) | Rust SQLite API | Pinned to existing Athena 0.41.0 baseline; no untested version upgrade |
| [Scarlet information and terms](https://scarletsrealm.com/help-info/) | submitted-mod status references | Explicit source permission must identify extraction/publication scope; default public terms are not blanket replication rights. Coverage is submitted mods; absence never proves compatibility |
| [WCIF](https://wcif.cc/) | creator/source discovery reference | Route and reuse authorization must be established before automated ingestion; counts are source-observed, not total creator production |
| [Modrinth API](https://docs.modrinth.com/api/) | candidate public structured project/version source | Follow current API rules and rate limits; per-field/media redistribution still needs review |
| [CurseForge API terms](https://support.curseforge.com/support/solutions/articles/9000207405-curseforge-3rd-party-api-terms-and-conditions) | policy reference | API availability is not authority for cached/public database replication; disabled unless agreement covers it |

## Existing-source migration rules

Locate originals, retain schema/provenance, inventory public/private fields, review licenses and source permissions, map IDs without merging by name, import to staging, compare exact counts/coverage and known failures, then publish only the reviewed projection. Never port an adapter that silently drops failed pagination or failed worksheets: partial extraction must remain partial and retain last-good evidence. Do not delete originals.
