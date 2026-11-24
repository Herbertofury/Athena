# GitHub · fixed public source observations

Reviewed October 27, 2026. [Adapter directory](README.md) · [Executable evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/50a32d09767c0ba01d136906d6ae6929435f80c4/experiments/upstream-review-lab)

## Coverage, not a blanket support claim

| Capability | Current evidence | Boundary |
|---|---|---|
| Selected public release/commit metadata | Implemented and real-public-tested through Rust CLI and queue | Three fixed repositories only; no arbitrary crawl |
| Original JSON retention | Stored bytes, hashes, reopen and transaction tests | No release assets downloaded or verified |
| Revision versus metadata drift | Implemented; unchanged real response plus generated change cases | Does not establish a package update or performance advantage |
| Persistent pacing and request budgets | Implemented; generated cooldown/interruption fixtures plus actual successful requests | No live rate-limit incident induced; budget is per database, not global IP |
| Authenticated/private repository access | Not implemented; would require specific authorization and supported credentials | Browser login is not an API grant |
| Mod/game card images, attachments and playable media | Planned | Public release metadata alone does not prove asset completeness or playback |
| Upgrade, source signature or advisory clearance | Not performed by this reader | Use separate verified workflows; metadata is not permission to execute assets |

## Reuse before replacement

The implementation reuses Atlas's existing queue, snapshot transactions and bounded response reader. An existing asset-oriented adapter was inspected, but its search/download scope and JavaScript runtime differ from this fixed Rust research checkpoint. No generic SDK or downloader was added merely to repeat one public GET. This is a scope decision, not a speed ranking against that adapter.

## Source and access rules

Use the [official latest release](https://docs.github.com/en/rest/releases/releases#get-the-latest-release) and [commit list](https://docs.github.com/en/rest/commits/commits#list-commits) operations for these observations. The version header is pinned to 2026-03-10 and the selected response version is recorded separately [GHR01]. Public anonymous requests share the originating IP's quota [GHR02]. Provider cooldowns take priority over local defaults; do not switch databases or create credentials to evade them.

Complete public JSON remains local with append-only application generations. Published research receipts contain identities, hashes, counts and scoped outcomes, not account/session material or copied provider release bodies. No authenticated records are currently collected. Future private fixture work must not enter public Atlas.

## Next acceptance gates

1. Add any new repository/operation only after reviewing its official API contract and completeness requirements.
2. Reconcile interrupted reservations with an explicit, auditable operation before claiming unattended recovery. The current conservative lane fails closed.
3. Test asset identity, license, size, missing/deleted states and user-initiated playback separately before promoting game/mod/media-card coverage.
4. Compare actual target workloads and complete requirements before recommending another project's migration. Current evidence provides no such recommendation.

## October 28 research expansion

[Current platform-family research](social-platforms.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
