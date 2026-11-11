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

## Public news evidence · November 11, 2026

The [Steam news laboratory](../../experiments/steam-news-lab/README.md) adds an offline adapter for the documented public ISteamNews v2 route. It preserves full API contents separately from generated blurbs, binds AppID and opaque news identity, and retains failures, filters and supplied-window limits.

Three real anonymous captures show HTML image references disappearing in generated blurbs and Steam announcement bodies containing BBCode rather than HTML. Source authors and feed labels stay separate from game developers. The external-URL flag is preserved without inferring publisher identity. [Exact observations, hashes and limits](../../research/2026-11-11-steam-news.md).

No linked article or media was downloaded, no credential or publisher API was used, and no existing card/runtime was changed. Full API content does not establish a full external article or complete news history. A media reference does not establish image decoding or playback.
