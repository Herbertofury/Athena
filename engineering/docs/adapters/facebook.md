# Facebook adapter research

[Adapter laboratory](README.md) · Reviewed October 26, 2026

## Current route

Current developer documentation returned HTTP 429 during review. Do not infer current scopes or complete scraping support from old examples. Account-bound content requires appropriate authorization.

## Reuse before replacement

Review official Graph API and public embedding capabilities when documentation is available. Existing code does not authorize bypassing controls.

## Acceptance workload

Page/post identity; carousel/video ownership; privacy changes; permissions; pagination; unavailable embeds; exclusion of unrelated recommendations.

## Evidence status

Current-documentation review incomplete due to rate limiting; no accepted adapter. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://developers.facebook.com/docs/graph-api/overview/) · [Shared collection contract](contract.md)

## October 28 research expansion

[Current platform-family research](social-platforms.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
