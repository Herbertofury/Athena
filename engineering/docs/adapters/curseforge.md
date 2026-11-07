# CurseForge adapter research

[Adapter laboratory](README.md) · Reviewed October 26, 2026

## Current route

Use the documented API with an approved key where required. Public parsing, structured API media and author information need separate ownership/completeness checks.

## Reuse before replacement

Reuse provider API fast lanes, scoped gallery parsing and media regression tests. Compare retained originals before choosing another library.

## Acceptance workload

Project/file/game IDs; screenshots versus logos/avatars; complete gallery order; author fan-out; download availability; pagination; negative-cache recovery.

## Evidence status

API documentation reviewed; no new key configured in Atlas. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://docs.curseforge.com/rest-api/) · [Shared collection contract](contract.md)

## October 28 research expansion

[Current platform-family research](mod-hosts.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
