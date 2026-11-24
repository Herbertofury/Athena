# Bluesky adapter: actual public AppView extraction

[Adapter laboratory](README.md) · [Round-three methods](methods-round3.md) · Checked **2026-10-31**

The [offline Bluesky normalizer](../../experiments/site-extraction-lab/bluesky.py) is tested against real public mod-author API captures. It extracts source identity, author/avatar, text and facets, media representations, quoted-record provenance, repost context and bounded following pages. It performs no network requests or account mutations itself. Full platform support remains unaccepted.

## Source and transport choice

Use the documented public AppView for eligible unauthenticated reads. Authenticated operations belong to the user's PDS and appropriate proxy/auth route. Prefer the maintained SDKs listed by AT Protocol for identity resolution, sessions, schema types and transport; this experiment only normalizes already obtained JSON. [RDSOC31009] [RDSOC31010]

Current documentation moved: several old `docs.bsky.app/docs/api/...` URLs redirect to the `endpoints.bsky.app` reference shell; tutorial and content documentation is available on `bsky.network`. Historical GitHub lexicon paths returned404 in this pass. Preserve those failures; a moved documentation path does not mean the API disappeared. The public requests below succeeded independently of the search retriever's inability to retrieve one JSON URL.

## Actual captures

| Sample | Retrieved scope | Evidence |
|---|---|---|
| EightSidedSquare Content Content announcement | One exact post; stable AT URI, author DID, avatar, original text/facets, one ordered image | [Original post](https://bsky.app/profile/eightsidedsquare.com/post/3lmb5eoamek2s). [RDSOC31015] [RDSOC31016] |
| EightSidedSquare author feed | First30 entries and next3 using returned cursor; original posts and repost reasons | Public API bytes retained locally with hashes. [RDSOC31017] [RDSOC31018] |
| The Aether author feed | First30 entries and next3; images, video, external cards, quotes and record-with-media views | Public API bytes retained locally with hashes. [RDSOC31020] [RDSOC31021] |
| Both author profiles | DID, handle, display name, avatar and separate banner/profile metadata | No assumption that profile description is a post body. [RDSOC31019] [RDSOC31022] |
| EightSidedSquare public following list | Two records, then two more using returned cursor | Subject identity and continuation preserved; full list not exhausted. [RDSOC31023] [RDSOC31024] |

The four feed pages contain66 entry representations. The separate exact-post response is another representation; deduplicate by stable post identity when building a collection. Reposts are independent feed events that point to an original post. Neither a short page nor a pinned/repeated post proves the end of history. [RDSOC31012]

## Identity and attribution

Require the DID embedded in the post AT URI to agree with the post's author DID. Preserve the record key and CID, mutable handle, display name and profile-sourced avatar. A mismatched identity is a failed join, not a reason to silently substitute the feed owner.

In a feed entry, the original author remains in the post. A repost reason has its own actor and time. A quoted record has its own author, body and media, or a blocked/not-found/detached state. A link card has a destination and preview metadata but is not an independent verified mod author. Preserve each layer rather than flattening it into the outer body.

The original raw record can contain image/video blob objects; AppView supplies display-oriented media URLs. Keep both concepts distinct. A blob CID does not become a URL by guessing a CDN path. Unknown embed variants remain visible as unsupported rather than silently disappearing.

## Text and media extraction

Text is plain Unicode with separate rich-text facets. Facet indices are UTF-8 byte offsets with an exclusive end. Validate range bounds, Unicode boundaries and overlap before interpreting a link, mention or tag. Preserve the original text and complete target URL in memory; do not apply JavaScript UTF-16 slicing to the byte offsets. Use upstream rich-text helpers in an application renderer. [RDSOC31008]

Keep image order, alt text, aspect ratio and thumbnail/full-size roles. A video playlist is an HLS entry point; its poster is a still image. External-card artwork is a preview of the target. Quoted media belongs to the quote context. Labels and visibility metadata remain available to the application's moderation layer. Public protocol availability does not cancel the source's visibility preferences. [RDSOC31013] [RDSOC31014]

Actual byte checks decoded both creator avatars at1000×1000, the Content Content image at1920×1080, and an Aether video poster at1920×1080. The video master playlist was319bytes with two variants. These checks do not establish animation, video playback, complete media history or arbitrary external-mod delivery. [RDSOC31025] [RDSOC31026] [RDSOC31027] [RDSOC31028] [RDSOC31029]

## Following and refresh behavior

A local watch should use the stable DID and preserve feed filtering choices. Follow-list import must verify the subject, paginate using the opaque cursor, deduplicate stable identities and distinguish partial progress from exhausted history. An absent optional cursor is a terminal-page hint; it does not establish a complete import from arbitrary starting pages. The actual two-page sample remains partial.

Native following is a separate authenticated write. Do not infer permission to create follow records from a successful public `getFollows` read. No source-native following, unfollowing, login, subscription or payment was performed. [RDSOC31011]

Production work still needs SDK integration, rate/backoff behavior, account-specific moderation and access behavior, deletion reconciliation, retry and resume semantics, external-file provenance, complete-history fixtures and target-application comparison. The offline replay alone does not satisfy those gates.

## Evidence hygiene

Raw public bodies and API captures are external inputs, not committed fixtures. Sanitized receipts retain implementation/input hashes, body hashes and counts, safe identity references and operation results. They exclude raw body prose, full private/signed query URLs and account tokens. A sanitized URL is a source reference, not a replacement transport URL.

See the [extraction lab](../../experiments/site-extraction-lab/README.md) for tests and replay evidence. The [source register](../../data/sources.d/adapter-communities-round3-20261031.json) preserves documented, observed and failed-source states without promoting them to universal acceptance.
