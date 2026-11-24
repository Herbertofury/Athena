[← Atlas home](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home) · [Canonical source](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/adapters/steamdb.md)

# SteamDB adapter research

[Adapter laboratory](https://github.com/Herbertofury/Engineering-Atlas/wiki/Site-Adapters) · Reviewed October 26, 2026

## Current route

SteamDB explicitly disallows automated scraping/crawling. Treat it as a reference/link destination, not a collection backend. Its cached RSS is not intended as a new-patch monitor.

## Reuse before replacement

Evaluate Steam upstream routes instead. This is a capability boundary, not a stealth/proxy challenge.

## Acceptance workload

Correct AppID links; distinguish Steam data from SteamDB-specific analysis; no unsupported API or equivalent-history claims.

## Evidence status

Reference-only lane. No SteamDB crawler implemented or run. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://steamdb.info/faq/) · [Shared collection contract](https://github.com/Herbertofury/Engineering-Atlas/wiki/Collection-and-Media-Contract)

## October 28 research expansion

[Current platform-family research](https://github.com/Herbertofury/Engineering-Atlas/wiki/Mod-Host-Adapters) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](https://github.com/Herbertofury/Engineering-Atlas/wiki/Site-Adapter-Coverage) and [authenticated fixtures](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Login-and-Authenticated-Research) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
