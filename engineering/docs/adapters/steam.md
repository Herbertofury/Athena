# Steam adapter research

[Adapter laboratory](README.md) · Reviewed October 26, 2026

## Current route

Separate public game metadata/media, user-library authorization, official widgets and client actions. Sign-in proves identity, not arbitrary wishlist-write permission.

## Reuse before replacement

Reuse exact-AppID integration and official APIs/widgets. Evaluate maintained SDKs for the required capability, not a replacement authentication stack.

## Acceptance workload

AppID identity; regional metadata; trailers versus screenshots; unknown ownership; private libraries; stale refresh; player failures.

## Evidence status

Public source-snapshot trailer playback verified through native HLS and pinned HLS.js; not all trailers or account operations tested. Atlas has not inherited another app’s credentials. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://partner.steamgames.com/doc/webapi_overview) · [Shared collection contract](contract.md)

## October 28 research expansion

[Current platform-family research](mod-hosts.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
