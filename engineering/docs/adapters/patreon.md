# Patreon adapter research

[Adapter laboratory](README.md) · Initial review October 26; scoped browser fixtures added October 28, 2026

## Current route

Official v2 API and authorized browser access are separate lanes. The current documentation announces v1 retirement on October 7, 2026; posts require the campaigns.posts scope.

## Reuse before replacement

Evaluate maintained gallery-dl and the existing provider-specific parser before adding new extraction logic. An extractor listing does not prove every paid post or media variant works.

## Acceptance workload

Post/campaign identity; carousel order; embedded video versus attachments; pagination; entitlement changes; expiry; last-good preservation.

## Historical evidence status: October 26

At the October 26 review, documentation had been reviewed but authenticated extraction and full-media parity had not been tested. The October 28 cases below supersede that status for their exact operations; complete platform support remains unaccepted. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://docs.patreon.com/) · [Shared collection contract](contract.md)

## October 28 research expansion

[Current platform-family research](paid-platforms.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. The initial status above is retained as dated history; the exact subsequent results follow below.

## Actual signed-in public and locked fixtures

On October 28, 2026, secure Google sign-in and device approval completed. The destination post then displayed Member navigation and an Account menu. These are positive target-site authentication signals; the [sanitized receipt](../../experiments/site-adapter-discovery/patreon-browser-2026-10-28.json) excludes the account identity, private creator list, login tokens and signed media query values.

### Locked does not mean empty, and signed in does not mean entitled

The [Better Exceptions release candidate](https://www.patreon.com/TwistedMexi/posts/better-v3-17-rc1-158788471) remained locked after sign-in. Its target `[data-tag="post-card"]` contained `[data-tag="teaser-post-content"]` with 894 rendered characters, an Unlock control and a filename under `[data-tag="post-attachment-preview"]`. That preview was a `div` without a file link. Preserve a teaser plus inaccessible attachment metadata; do not promote it to a full body or successful download.

Scope selectors to the requested post. Related-post cards can contain accessible files, older versions and their own previews even when the current post is locked. A global attachment or image query can silently attach another release's file or a commenter's portrait to the current item.

### Public full body, creator, image and actual mod file

The separate [All Scenarios v3.9 post](https://www.patreon.com/TwistedMexi/posts/all-scenarios-v3-127164163) was publicly readable in the primary web source and inspected again in the signed-in browser. The actual output was:

| Field | Observed boundary | Result |
|---|---|---|
| Identity/title | Canonical post `127164163`; `[data-tag="post-title"]` | Title retained; responsive duplicate headings must not duplicate the item |
| Accessible rich body | Target post's `.JRIMpq_postContent` | 1,507 rendered characters; original HTML hash retained |
| Publishing creator | Explicit TwistedMexi creator link | Creator identity separate from the current viewer and commenters |
| Creator avatar | `img[alt="Creator profile picture"]` in the target post | 360 × 360 decoded image |
| Gallery | `img[data-tag="gallery-image"]` in the target post | One decoded 1080 × 608 image |
| File | `a[data-tag="post-attachment-link"]` | Public attachment media ID `722305358`, associated with post `127164163` |

The full-body class is an observed implementation detail, not a stable documented API. Record the page/template version, detect missing or multiple matches, and test the body against the visible post. This sample has no `[data-tag="post-content"]` marker. The gallery marker is on the `img` itself: the initial descendant selector `[data-tag="gallery-image"] img` returned zero and is retained as a corrected failed attempt.

The ordinary attachment control delivered **932,816 bytes**. The ZIP signature was `504b0304`, all six archive entries passed CRC validation, and SHA-256 was `ea610539d092e2bb55126faa2cb3f5f54385bc6076d6875ddcbedc4a6d06225e`. The archive contains package/script data and delta files; no content was installed or executed. CRC validation proves internal archive consistency, not publisher authenticity or gameplay compatibility. The mod archive and full post body are not republished in this repository.

Use the canonical post and attachment IDs for identity. Signed delivery URLs are temporary capabilities: resolve them through the authorized normal flow, keep their query values out of public receipts, and test expiry separately. Creator avatars, post gallery images, recommendation thumbnails and comment avatars require separate ownership rules even when all are inside one large post-card container.

### Remaining acceptance work

This establishes one accessible public release and one signed-in locked case. Entitled member content, full creator pagination, video/GIF/audio, updated/deleted posts, follow-list import, native follow writes and expired-session recovery still require separate fixtures. Official API suitability and permissions remain a separate decision from browser-visible data. No GameSync Next change follows from this isolated observation.
