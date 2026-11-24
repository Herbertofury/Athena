<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
[← Atlas home](https://github.com/Herbertofury/Athena/wiki/Engineering-Home) · [Canonical source](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/adapters/curseforge.md)

# CurseForge adapter research

[Adapter laboratory](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapters) · Reviewed October 26, 2026

## Current route

Use the documented API with an approved key where required. Public parsing, structured API media and author information need separate ownership/completeness checks.

## Reuse before replacement

Reuse provider API fast lanes, scoped gallery parsing and media regression tests. Compare retained originals before choosing another library.

## Acceptance workload

Project/file/game IDs; screenshots versus logos/avatars; complete gallery order; author fan-out; download availability; pagination; negative-cache recovery.

## Evidence status

API documentation reviewed; no new key configured in Atlas. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://docs.curseforge.com/rest-api/) · [Shared collection contract](https://github.com/Herbertofury/Athena/wiki/Engineering-Collection-and-Media-Contract)

## October 28 research expansion

[Current platform-family research](https://github.com/Herbertofury/Athena/wiki/Engineering-Mod-Host-Adapters) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapter-Coverage) and [authenticated fixtures](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Login-and-Authenticated-Research) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
