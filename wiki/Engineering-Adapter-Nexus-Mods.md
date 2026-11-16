<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
[← Atlas home](https://github.com/Herbertofury/Athena/wiki/Engineering-Home) · [Canonical source](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/adapters/nexus-mods.md)

# Nexus Mods adapter research

[Adapter laboratory](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapters) · Reviewed October 26, 2026

## Current route

Official v2 GraphQL documentation marks it experimental; stable v1 remains. Most v2 queries are public, while some need OAuth. Preserve game-domain plus mod ID.

## Reuse before replacement

Evaluate the official node-nexus-api SDK and existing identity/media adapters before rewriting. Review licensing and integration boundaries; no universal winner selected.

## Acceptance workload

Separate Skyrim Special Edition, Fallout 4 and Starfield fixtures. Test galleries, videos, file versions, hidden/deleted items, ownership and schema changes.

## Evidence status

Anonymous game identities and SkyUI metadata verified live; full gallery and authenticated downloads not accepted. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://graphql.nexusmods.com/) · [Shared collection contract](https://github.com/Herbertofury/Athena/wiki/Engineering-Collection-and-Media-Contract)

## Reuse and partial-response review · 2026-10-27

The official SDK at c5eda4a reports package version 1.7.3, but package.json declares LGPL-3.0 while LICENSE.md contains GPLv3. Resolve this mismatch before implementation reuse. Static inspection also distinguishes the default GraphQL data-root helper from its error-preserving helper: returned data alone is not complete-result acceptance. Batching/quota patterns remain candidates, not measured winners. No SDK execution, new authenticated access or complete-gallery acceptance occurred. [Exact sources and scope](https://github.com/Herbertofury/Athena/blob/d1d6d998ba38d2fcedd140c48e3c5d21e132f671/engineering/research/2026-10-27-nexus-reuse-review.md).

## October 28 research expansion

[Current platform-family research](https://github.com/Herbertofury/Athena/wiki/Engineering-Mod-Host-Adapters) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](https://github.com/Herbertofury/Athena/wiki/Engineering-Site-Adapter-Coverage) and [authenticated fixtures](https://github.com/Herbertofury/Athena/wiki/Engineering-Adapter-Login-and-Authenticated-Research) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.


## Preserved evidence link provenance

The links above now use content-identical Athena copies, verified by Git blob/tree identity on 2026-11-15. Original revision citations remain below as provenance, not runtime dependencies. This does not certify source-repository deletion readiness. Other historical links on this page remain unchanged where exact replacement was not verified.

- Original: `https://github.com/Herbertofury/Engineering-Atlas/blob/bef343b83870918156649d6659dbdbc1015d0759/research/2026-10-27-nexus-reuse-review.md`; identical blob object: `310e5b44b39761998a65da133a218d6f44277d66`.
