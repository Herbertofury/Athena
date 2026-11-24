# Nexus Mods adapter research

[Adapter laboratory](README.md) · Reviewed October 26, 2026

## Current route

Official v2 GraphQL documentation marks it experimental; stable v1 remains. Most v2 queries are public, while some need OAuth. Preserve game-domain plus mod ID.

## Reuse before replacement

Evaluate the official node-nexus-api SDK and existing identity/media adapters before rewriting. Review licensing and integration boundaries; no universal winner selected.

## Acceptance workload

Separate Skyrim Special Edition, Fallout 4 and Starfield fixtures. Test galleries, videos, file versions, hidden/deleted items, ownership and schema changes.

## Evidence status

Anonymous game identities and SkyUI metadata verified live; full gallery and authenticated downloads not accepted. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://graphql.nexusmods.com/) · [Shared collection contract](contract.md)

## Reuse and partial-response review · 2026-10-27

The official SDK at c5eda4a reports package version 1.7.3, but package.json declares LGPL-3.0 while LICENSE.md contains GPLv3. Resolve this mismatch before implementation reuse. Static inspection also distinguishes the default GraphQL data-root helper from its error-preserving helper: returned data alone is not complete-result acceptance. Batching/quota patterns remain candidates, not measured winners. No SDK execution, new authenticated access or complete-gallery acceptance occurred. [Exact sources and scope](https://github.com/Herbertofury/Engineering-Atlas/blob/bef343b83870918156649d6659dbdbc1015d0759/research/2026-10-27-nexus-reuse-review.md).

## October 28 research expansion

[Current platform-family research](mod-hosts.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
