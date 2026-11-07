# TS4 Rebels adapter research

[Adapter laboratory](README.md) · Public landing-page inspection: October 28, 2026 UTC

## Current evidence and candidate route

The live [site root](https://ts4rebels.cc) returned a public phpBB-style forum index with topic pagination, board categories, topic/post links and guest-hidden link markers. The HTML advertises feed links. Those observations establish public discovery candidates only; no feed payload, logged-in attachment, complete topic body or native subscription was tested.

Search retrieved first-party [rules](https://ts4rebels.cc/rules) and [about](https://ts4rebels.cc/about-us) content, while a direct request to the latter path returned 404 in this run. Preserve the discrepancy and verify the currently linked page before relying on a historical route. The root remained reachable; this was not evidence that the whole site was down.

Prefer the forum's advertised feeds if they expose the required permitted public content, then scoped topic/post HTML. A feed may omit private boards, attachments or edits, so compare it to the same authorized forum view. No general third-party REST API or member-directory export was established.

## Identity, media and follow design

Use topic and post IDs from real links, canonical board origin, visible post timestamp and the forum member's identity. The forum poster/uploader is distinct from the mod creator credited in the subject or post. A creator name in a thread title is a claim to resolve against original creator profiles; do not attach the forum uploader's avatar to that original creator.

Parse only the target post's content, quoted blocks, attachments and links. Preserve quoted author identity, spoilers, inline-image order and external-host destinations. Hidden-link markers mean unavailable content in that session. They must not be converted into inferred file URLs. Resolve a permitted external file through its host-specific resolver while retaining the forum/source relationship.

Local follow can track a creator attribution or forum member independently. Topic subscriptions, bookmarks and native author follows are different capabilities; verify the forum's actual controls and permissions before exposing any write action. An authenticated thread view does not establish a general author-follow API.

## Required next tests

Obtain an authorized account fixture for a public/free-content topic, a guest-hidden link, a multi-post topic, quotes, a custom poster avatar, attachments and pagination. Test topic edit/deletion and feed omission. Verify any native watch control with explicit user-selected actions. Keep session-bound query parameters, account details and private posts out of public receipts.

The adapter must preserve original-source attribution and actual access/rights state. Being able to read a forum listing is not evidence of membership on the original creator's service or permission to redistribute a mirrored file. Full-content support remains unverified until the authorized route and required fields are tested.

[Public observation receipt](../../experiments/site-adapter-discovery/public-observations-2026-10-28.json) · [Login workflow](authenticated-research.md) · [Acceptance gate](validation-and-adoption.md)
