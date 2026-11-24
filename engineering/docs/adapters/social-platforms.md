# Social, blogging, code-release and file-host adapters

[Adapter laboratory](README.md) · [Coverage catalog](coverage-catalog.md) · [Authenticated research](authenticated-research.md) · [Validation and adoption](validation-and-adoption.md)

**Research reviewed: October 28, 2026 (UTC).** These recipes describe how a creator-tracking application can preserve identity, read structured posts and media, and resolve explicit release attachments across social networks, blogs, code forges and file hosts. They guide adapter research and implementation; they do not establish working support or target-project acceptance.

**Evidence boundary:** relevant official documentation, help, standards, announcements and upstream source sections support the detailed recipes where stated. Broader catalog entries that remain official search leads, documentation shells or unavailable pages are candidates until their relevant primary sections are retrieved. A source link alone does not certify a field, endpoint, entitlement or pagination contract. No authenticated API calls, native follows, browser login flows, channel joins, purchases, gated downloads or attachment downloads were tested in this research. A documented method does not guarantee that a new application will receive access.

Use the [coverage catalog](coverage-catalog.md) for each service's source and access state, and the [validation gate](validation-and-adoption.md) before promoting an adapter. Authentication and paid/private content require the separate [authenticated-research workflow](authenticated-research.md).

## Adapter contract and interpretation

The app should store a **local author subscription** independently from a platform-native follow. The former is an app preference and needs no write to the platform. The latter modifies an external account and requires a documented operation, an eligible application, suitable user authorization, and an explicit user-facing action. Importing follows is a third capability: read permission for a graph does not imply permission to change it, and a public profile need not expose its graph.

Recommended normalized relationships:

- `account`: platform-qualified stable identity, current handle, profile URL, display name, avatar source URL and observation time.
- `post`: platform-qualified post identity, publisher account, creation/edit time, canonical URL, typed body, visibility/access state.
- `attribution`: original creator, current publisher, repost actor, quoted creator, coauthor, asset uploader, and external source. Retain unknowns explicitly.
- `media`: image/video/audio/embed/preview/document, MIME type, dimensions, alt text, source provenance and access/expiry state.
- `attachment`: the author-linked landing URL, host, host resource ID, intended file, license/access context, and a refreshable resolution strategy.
- `subscription`: local target and polling cursor; optional separately authorized native relationship/import state.

These are implementation recommendations, not platform guarantees. Do not infer a stable account ID from a display name. Do not use a site favicon, project cover or video thumbnail as a person avatar. Do not infer the creator of a mod from the account that rehosted its ZIP. A redirect, image proxy or storage owner is transport provenance, not authorship evidence. Unknown or broken attribution should remain unknown rather than being assigned to the current reposting account.

The body renderer should preserve supported structure and accessibility metadata, sanitize HTML and URL schemes, and render unknown block types with an intelligible source link. Classify an explicit file link separately from an embedded player, gallery preview, paywall or marketplace purchase. Download routing should be driven by the final granted resource and response metadata, not by whether a URL merely ends in `.zip`.

## Implementation recipes

### 1. Tumblr: NPF, attribution, avatars, follows

Resolve aliases/custom domains to the blog's **`uuid`** and retain that UUID as identity. Obtain the avatar from Tumblr's blog avatar/info contract. Read published posts with **`npf=true`** and page using the documented `before` approach; publish timestamps can be backdated. OAuth supports native follow/unfollow and following-list retrieval. Keep those features separate from local subscription. [Official API](https://raw.githubusercontent.com/tumblr/docs/master/api.md)

Render **`content` plus `layout`**, including text formatting/link spans, images with alternatives, link cards, audio/video and attribution. On reblogs, render `trail` in its supplied order and distinguish each trail author's contribution from the current blog's additions. A missing/deleted original can produce a broken trail item containing `broken_blog_name` without a resolvable blog/post. Preserve that evidence; do not invent the original author's ID or avatar. Some URLs are Tumblr redirect wrappers. [Official NPF specification](https://github.com/tumblr/docs/blob/master/npf-spec.md)

Suggested acceptance fixtures: original mixed-media release; pure reblog; commentary reblog; deleted root; inline file-host link; video provider embed; renamed blog; no-avatar response. These are test recommendations, not observed fixtures. Do not mistake `type=text` from legacy compatibility conversion for proof that a post lacks images.

### 2. Bluesky: stable identity and repost-aware feeds

Use the **DID** as account identity and the handle as a changeable lookup/display alias. The AT Protocol identity specification explicitly defines persistent identifiers. [DID specification](https://atproto.com/specs/did)

The `bsky.network` documentation is official: the upstream Bluesky repository says that this site replaces `docs.bsky.app` and documents Bluesky-operated services. The old docs host's redirect was also observed. [Official website repository](https://github.com/bluesky-social/bps-website).

Use the documented `app.bsky.feed.getAuthorFeed` contract and its opaque cursor, selecting a feed filter that matches the product's treatment of replies and authored threads. Preserve original post identity and author separately from feed/repost context. Use profile-sourced avatar data and typed embed/facet data; don't derive outgoing links only by regexing display text. [Official author-feed guide](https://bsky.network/docs/bluesky-api/viewing-feeds/), [profile guide](https://bsky.network/docs/bluesky-api/profiles/)

A native follow creates an **`app.bsky.graph.follow`** record whose subject is a DID; unfollow deletes that record. Record its URI if supporting this operation. [Official follow guide](https://bsky.network/docs/bluesky-api/following/)

Before coding follow import, verify the current graph endpoint/schema and authorization host routing. Suggested fixtures include renamed handle, migrated account, repost, quote, external card, image carousel, video, labels and unavailable original. AppView output is the appropriate user-facing read model; a bare repository record is not a fully hydrated feed item.

### 3. Mastodon: instance-qualified accounts, boosts, HTML

Store the instance used for an API ID and the account's canonical identity. Account IDs are meaningful in their instance context; do not globally deduplicate bare numeric IDs. Source avatar information from Account fields. [Account entity](https://docs.joinmastodon.org/entities/Account/)

An account statuses adapter should follow returned **HTTP `Link` pagination**, respect visibility/auth requirements, and use authorized user-token follow/following methods where requested. [Accounts API](https://docs.joinmastodon.org/methods/accounts/)

Render Status HTML safely, plus spoiler/sensitive content, media attachments, custom emoji, cards and nested `reblog` data. The outer boost account is the sharing actor; the nested status account is its author. [Status entity](https://docs.joinmastodon.org/entities/Status/)

Suggested fixtures: local/remote account, same remote account known to two instances, boost, reply, content warning, inaccessible post, moved account and deleted attachment. Native follow may become a pending request for a locked account. Federation does not guarantee that a queried instance has every historical post; local subscription completeness must therefore be described honestly rather than assumed from an empty final page.

### 4. Pixelfed: verify its compatibility layer

Pixelfed documents a **Mastodon-following API with additional Pixelfed features**, hosted separately by every instance. Treat this as an instance adapter with capability checks, not a single central API. [API introduction](https://developers.pixelfed.org/api)

The documented account statuses route uses a user token/read scope. Profile responses carry account IDs, canonical URLs and avatar fields. Following methods and pagination fields must be read per endpoint instead of assuming that every list uses one cursor style. [Accounts API](https://developers.pixelfed.org/api/accounts)

Pixelfed distinguishes its default Mastodon-shaped response from its own `_pe` schema. Its entity reference documents that `_pe` shares copy the original body/media to the outer level while leaving `account` as the sharer and retaining nested `reblog`; `include_reblogs` disables that copying. Follow the actual share/original structure when assigning authorship. [Entity shapes](https://developers.pixelfed.org/api/pixelfed-entities), [Statuses API](https://developers.pixelfed.org/api/statuses)

Suggested fixtures: multi-image post, video, shared post, remote-account avatar cache, locked account, and API variant with or without Pixelfed extension output. Keep gallery images as reading media; a mod-package attachment requires its own explicit link.

### 5. Misskey: instance schema, MFM, renotes and consent

Misskey exposes public and streaming APIs for clients and integrations. Consult the **actual server's endpoint definitions** before implementing detailed calls, since versions and forks differ. [API introduction](https://misskey-hub.net/en/docs/for-developers/api/)

For user authorization, the official guidance supports **MiAuth** and, on suitable versions, OAuth. Request only the intended read/follow permissions and keep tokens separate from local subscriptions. MiAuth completes through its session check route after the user grants access. [Token guide](https://misskey-hub.net/en/docs/for-developers/api/token/), [MiAuth guide](https://misskey-hub.net/en/docs/for-developers/api/token/miauth/)

Implementation recommendation: preserve the instance-qualified user, MFM body, content warning, attached Drive files and the renote relationship rather than converting every note to a generic HTML paragraph. Verify exact notes/profile/follow schemas and pagination against that server before claiming those capabilities. Suggested fixtures include a renote, quote renote, custom emoji, remote actor, animated avatar, hidden file, and unknown MFM construct. This research confirms the API/auth family; it does not certify those detailed payloads through an authenticated response.

### 6. Reddit: approval precedes OAuth

The **Responsible Builder Policy updated October 5, 2026 requires explicit approval before API access**. Commercial use also requires written approval; do not present app registration and an OAuth token as the whole access process. [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)

Reddit requires registered OAuth authentication and a descriptive User-Agent. [Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)

After approval, the official reference documents `/user/{username}/submitted`, account fullnames (`t2_…`), submission fullnames (`t3_…`), and `after`/`before` listing cursors. `raw_json=1` avoids legacy escaping. [API reference](https://www.reddit.com/dev/api/)

Implementation recommendation: represent deleted or unknown authors as unavailable after applying Reddit's deletion requirements. Remove deleted content and identifying author data as required; preserve crosspost provenance and media types only while their retention remains permitted. Verify gallery/video/selftext fixture shapes rather than scraping guessed JSON fields. Native modern profile-follow import is **not certified** here; the legacy friend endpoint is insufficient evidence. Suggested access states include approval needed, authentication expired, removed/private/quarantined material and permission denied. Local author tracking must not silently fall back to unidentified `.json` requests when an approved API route fails.

### 7. Discord: authorized bots and announcement channels

Use an installed bot in channels it is allowed to read. Discord expressly forbids automating normal user accounts as self-bots. A user's OAuth identity consent does not grant arbitrary message-history access. [Self-bot policy](https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)

The Message reference documents IDs, author/webhook identity, content, attachments, embeds and message references. Missing `MESSAGE_CONTENT` eligibility can yield empty protected fields. Preserve source message/channel identity and refresh permitted message data instead of treating CDN links as permanent. [Message reference](https://docs.discord.com/developers/resources/message)

Native **announcement follow** sends crossposted announcements into a target channel and requires target `MANAGE_WEBHOOKS`; it is not a general account follow API. [Channel reference](https://docs.discord.com/developers/resources/channel)

Suggested fixtures: forum thread, webhook post, crosspost, attachment with expiration, edited announcement and missing intent. Bot access should remain server/channel scoped. Clearly display whether local tracking is reading a directly authorized channel or an announcement mirrored into another authorized channel.

### 8. Telegram: Bot API and authorized user clients are different

For bots, parse incoming channel posts/edits, captions, entities and document/media metadata. Bot `getFile` provides a file path for downloading granted media; token-bearing URLs must remain server-side secrets. Chat photo is channel branding and is not always a person author's avatar. [Bot API](https://core.telegram.org/bots/api)

Do not market the Bot API as a complete arbitrary-channel subscription/history reader. **`channels.joinChannel`** and **`messages.getHistory`** are user-only MTProto methods. A deliberately authorized user client is a separate integration with separate account state and membership requirements. [joinChannel](https://core.telegram.org/method/channels.joinChannel), [getHistory](https://core.telegram.org/method/messages.getHistory)

Implementation recommendation: channel posts may be published under channel identity or carry signatures; avoid fabricating a private user behind them. Group media albums for reading while retaining individual message IDs. Suggested fixtures include public/private channel, forwarded post, signature, edited document, album, protected content and unavailable history. Keep local channel watch and actual user channel membership as separate states, and verify visibility before interpreting a missing message as deletion.

### 9. YouTube: upload playlist, subscriptions and embeds

Resolve the channel to its stable channel ID. The documented upload path is **channel uploads playlist → `playlistItems.list`**, rather than repeatedly searching the entire site for channel videos. Preserve page tokens and fetch video details where required. [Sample API requests](https://developers.google.com/youtube/data/sample_requests)

The Data API exposes video/channel metadata and thumbnails; use the **channel thumbnail for the author avatar**, not a video cover. [API reference](https://developers.google.com/youtube/data/reference/rest)

OAuth `subscriptions.list(mine=true)` can import the authorized channel's subscriptions; insert/delete are separate native mutations. Another channel's private subscriptions produce a forbidden response without owner authorization. [Subscription guide](https://developers.google.com/youtube/data/guides/implementation/subscriptions)

Use supported playback and follow YouTube's API policies; a metadata API is not permission to download video bytes. [Developer policies](https://developers.google.com/youtube/terms/developer-policies)

Implementation recommendation: descriptions may contain author-approved download links, but resolve those links as external attachments. Suggested fixtures: unavailable upload, playlist item with missing video, renamed handle, live replay, short, and an explicitly linked Drive/Dropbox release.

### 10. Twitch: reading follows does not mean writing follows

Use Helix user IDs and API profile image data; keep stream, VOD and clip identities distinct. The reference includes Get Followed Channels, with its required user authorization, and endpoint-specific cursor pagination. [API reference](https://dev.twitch.tv/docs/api/reference)

Video metadata can populate a creator archive and source links. [Video guide](https://dev.twitch.tv/docs/api/videos)

Twitch permanently removed native create/delete follow endpoints in 2021. Therefore support **local creator tracking** and, when authorized, followed-channel import; do not advertise an API-backed “Follow on Twitch” mutation. [Official deprecation](https://blog.twitch.tv/en/2021/06/28/deprecation-of-create-and-delete-follows-api-endpoints/)

Implementation recommendation: player embeds, thumbnails, VOD URLs and any permitted clip-download feature are different capabilities. Verify current clip download permissions rather than deriving stream playlists. Suggested fixtures: offline creator, renamed login, deleted VOD, clip made by another account and an expired token. Retain creator and clip maker separately when both are supplied.

### 11. DeviantArt: gallery, profile and allowed originals

Register an application and use the documented OAuth flow. [Authentication](https://deviantart.readme.io/docs/authentication)

Read creator profile information with the profile method and gallery items using the documented gallery endpoint. The Gallery All contract has an explicit offset/limit and finite bound, so it should not be described as unlimited archival enumeration. [Profile](https://deviantart.readme.io/reference/user_profile), [Gallery All](https://deviantart.readme.io/reference/gallery_all)

The original-file operation is **`/deviation/download/{deviationid}` only if allowed**; the reference explicitly distinguishes not-downloadable/not-found errors. A displayed image or preview must not be substituted when the original is unavailable. [Deviation Download](https://deviantart.readme.io/reference/deviation_download)

Implementation recommendation: gallery versus favorites, journal/status versus deviation, preview versus downloadable ZIP, mature content and paywalled assets need separate cases. Use author identity/icon from returned records and preserve the deviation canonical URL. Native watching/follow/import needs its own current endpoint verification; it is not certified by the profile or gallery reference alone.

### 12. WordPress: distributed REST and structured links

Discover the site's actual REST root and query public posts by author where available. A post contains rendered content, author identity, featured-media reference and dates; it is not merely its excerpt. [Posts reference](https://developer.wordpress.org/rest-api/reference/posts/)

Use `_embed`/links to obtain related author/media resources and avoid inventing avatar URLs from a name. [Linking and Embedding](https://developer.wordpress.org/rest-api/using-the-rest-api/linking-and-embedding/)

Follow the documented page/per-page collection contract and totals; an empty page after a changed archive is not a stable historical snapshot. [Pagination](https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/)

For attachments, use Media metadata and explicit links inside sanitized HTML. [Media reference](https://developer.wordpress.org/rest-api/reference/media/)

Implementation recommendation: qualify all user/post IDs by site origin, because WordPress is distributed. Test guest bylines, missing REST, password-protected posts, custom domains and external download hosts. WordPress.com has its own namespaces and authorization; do not interchange it mechanically with a self-hosted site's REST root. [WordPress.com reference](https://developer.wordpress.com/docs/api/rest-api-reference/)

### 13. Blogger and hosted creator blogs: content source first

Blogger's official v3 reference provides blog/post/user resources, and its guide describes reading post HTML. Use blog IDs for identity, author information from the returned post/user, and documented continuation tokens. Separate an author's profile image from the blog's branding. [Blogger reference](https://developers.google.com/blogger/docs/3.0/reference), [Using the API](https://developers.google.com/blogger/docs/3.0/using)

For Squarespace the documented public reader route is its collection RSS URL using **`?format=rss`**. A feed may be only a recent window and may carry excerpts. [Squarespace RSS help](https://support.squarespace.com/hc/en-us/articles/206543187-Finding-your-RSS-feed-URL)

Livedoor officially documents **`index.rdf`** feeds; its AtomPub API serves author-side publishing and editing rather than universal reader following. [RSS help](https://support.livedoor.info/hc/ja/articles/9628608163087), [AtomPub](https://support.livedoor.info/hc/ja/articles/9615538421007)

Implementation recommendation: for Webflow/Wix, first determine whether you are a public visitor using a feed/page or an owner-authorized CMS client. Their CMS APIs are not universal public social profiles. Author fields may be custom schema. Preserve explicit attachments and source links, and leave native follow/import unavailable unless actually documented.

### 14. GitHub, GitLab, Codeberg: releases are not generic social posts

GitHub release records distinguish release author, Markdown notes, asset IDs/uploader, byte size, content type and download URL. Store repository identity and release/asset identity, not only tag text. [GitHub releases](https://docs.github.com/en/rest/releases/releases)

GitHub user following differs from repository watching and starring. GitHub's June 2026 announcement restricts public watched-repository listing/import; do not promise arbitrary watched-repo import from older docs. [Followers](https://docs.github.com/en/rest/users/followers), [restriction announcement](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/)

GitLab release notes and **asset links** are separate resources; a release asset may link outside GitLab and needs the destination's own resolver. [Releases](https://docs.gitlab.com/api/releases/), [Release links](https://docs.gitlab.com/api/releases/links/)

Codeberg confirms that Forgejo releases attach notes/files to a tag. Inspect the actual Forgejo server OpenAPI/version before implementing capabilities. [Codeberg releases](https://docs.codeberg.org/git/using-tags/), [Forgejo API](https://forgejo.org/docs/latest/user/api/usage/)

Implementation recommendation: use local repository release subscriptions. A release author or organization owner is not automatically the sole mod author; bot uploads must not overwrite project credits. Distinguish a compiled release asset from automatically generated source archives.

### 15. Attachment hosts: resolve bytes without rewriting authorship

Drive distinguishes binary downloads from Workspace exports and has resource-key-bearing sharing URLs. Use the granted file metadata/capability, retaining the resource key when needed. [Drive download/export](https://developers.google.com/workspace/drive/api/guides/manage-downloads), [resource keys](https://developers.google.com/workspace/drive/api/guides/resource-keys)

Dropbox supports shared-link download and documented download-link behavior with redirects. [Shared Link File](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/sharing/get-shared-link-file), [link behavior](https://help.dropbox.com/share/force-download)

OneDrive/SharePoint Graph content can redirect to a preauthenticated download URL. Treat that as refreshable; an official October 2026 notice announces a 2027 tempauth migration, so implementation must verify the applicable deployment/scope. [Graph content](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content?view=graph-rest-1.0), [migration notice](https://devblogs.microsoft.com/microsoft365dev/pre-authenticated-tempauth-urls-are-retiring-move-to-microsoft-entra-id-tokens-before-april-1-2027/)

MEGA needs its actual SDK transfer model. Gofile's official API page remained unreadable in direct retrieval; its indexed bearer/premium and folder-content descriptions are leads that require inspection before implementation. Pixeldrain has documented metadata/raw-file APIs. [MEGA SDK](https://github.com/meganz/sdk), [Gofile](https://gofile.io/api), [Pixeldrain](https://pixeldrain.com/api)

Implementation recommendation: retain the original creator post as provenance, plus host resource ID, chosen file and access state. A host uploader/avatar never automatically replaces the mod author's identity. Do not persist transient transport URLs as the only durable attachment reference.

## Broad catalog and prioritization

The [coverage catalog](coverage-catalog.md) records service identity, domains, access boundaries, attribution, body and media handling, pagination, native capabilities, attachments and primary-source evidence. The groups below summarize research priorities; inclusion does not imply that every capability is documented or tested.

| Services | Recommended adapter scope | Current evidence boundary |
|---|---|---|
| Tumblr; Bluesky; Mastodon; Pixelfed; Misskey | Authored posts plus explicit reshare attribution | Documented API family; instance/auth validation still required |
| Reddit | Approved OAuth content reader | Explicit approval gate; no automatic modern user-follow claim |
| Discord; Telegram | Authorized channel integrations | Bots vs user clients must remain distinct |
| YouTube; Twitch | Creator metadata, archive, supported players, external release links | Native graph capabilities vary; Twitch follow writes removed |
| X | Developer-entitled API reader | Metered billing confirmed; reader/follow endpoint contract incomplete here |
| Facebook; Instagram; Threads; TikTok; Pinterest | Eligible authorized creator or embed integration | No general arbitrary personal following/feed promised |
| VK; Bilibili; Weibo | Approved regional integrations | Schema/authorization boundaries; avoid unofficial web endpoint recipes |
| DeviantArt; ArtStation | Gallery/profile or RSS with source links | Explicit downloadable originals vs previews |
| Cara; Behance; Newgrounds; Fur Affinity | Source reading/embed or future approved integration | Public reader API unverified; FA beta announcement remains an official discovery lead |
| Sketchfab; Cults3D; Thingiverse; Printables | Models, author credits, metadata and licensed source handoff | Cults file access requires primary-section verification; Printables public API unverified |
| WordPress; WordPress.com; Blogger; Webflow; Wix; Squarespace | Feed/site/CMS adapters with site-qualified identity | Public reading vs owner CMS authority |
| Tistory; Livedoor Blog | Feed/page adapters | Tistory Open API retired; Livedoor RSS documented |
| GitHub; GitLab; Codeberg | Repository release tracking | Social follow/watch/star/import are separate capabilities |
| Google Drive; Dropbox; OneDrive; MEGA; MediaFire; Gofile; Pixeldrain; Internet Archive | Attachment resolvers | Storage identity never establishes original mod authorship |

## Current compatibility and access boundaries

- **Tistory:** official Open API retirement was phased from late December 2023 through February 2024. The official API repository now explicitly labels it terminated. Keep legacy routes out of new implementation recipes. [Shutdown notice](https://notice.tistory.com/2664), [official repository](https://github.com/tistory/document-tistory-apis)
- **Fur Affinity:** an indexed official announcement reports an API **closed beta** in June 2026. Direct retrieval of the announcement failed, so this remains an official discovery lead. Verify the announcement and beta access before making either a production API claim or a blanket claim that no official API exists. [Official announcement](https://www.furaffinity.net/journal/11377368)
- **Cults3D:** indexed official GraphQL documentation reports that model files are excluded. Direct retrieval returned a forbidden response, so the exact access restriction remains a source-verification gate. Metadata/photos must not be treated as evidence of downloadable model files. [Official API](https://cults3d.com/en/api), [GraphQL details](https://cults3d.com/de/seiten/graphql)
- **Printables:** official PrusaSlicer documentation describes access by registered and unregistered users and file downloads. Do not repeat a third-party scraper's unsupported claim that every file download requires sign-in. No supported public Printables API contract was established by this research. [Official product help](https://help.prusa3d.com/article/printables-in-prusaslicer_822448)
- **Newgrounds:** official Newgrounds.io game integration is not evidence of an author-content/follow-list API. [Official API overview](https://www.newgrounds.com/wiki/creator-resources/newgrounds-apis)
- **Behance:** official embed/sharing is confirmed. Current public API/key issuance was not established; neither “works for new apps” nor “API is gone” should be stated from forum recollection. [Official sharing guide](https://help.behance.net/hc/en-us/articles/19288565618971-Guide-Sharing-and-Embedding-Behance-Content)
- **Bilibili:** official Open Platform account documentation surfaced as an authorized identity/OpenID lead, but direct retrieval returned no relevant text. It does not establish an arbitrary-user dynamic feed contract. Keep unofficial space/dynamic endpoints out of supported public API recipes until the relevant primary sections and access grant are verified. [Official account documentation](https://open.bilibili.com/doc/4/feb66f99-7d87-c206-00e7-d84164cd701c)

## RSS, Atom and WebSub fallback

RSS item identity, byline, link and enclosure are distinct fields; enclosure URLs have MIME/length metadata. A GUID is not necessarily a permalink. [RSS specification](https://www.rssboard.org/rss-2-0-11)

Atom has explicit IDs, author/source attribution, typed content and alternate/enclosure link relationships. Resolve relative URLs correctly. [RFC 4287](https://www.rfc-editor.org/rfc/rfc4287.html)

WebSub delivers updates through an advertised hub/topic with verified subscriptions and leases; it is update transport rather than a native social follow. [W3C WebSub](https://www.w3.org/TR/websub/)

Recommended fallback order is documented API → advertised feed → permission-compatible public structured metadata/page → source link/user handoff. This ordering is a product design recommendation. A site-specific parser needs captured public fixtures and clear failure states before it is promoted from candidate to supported. A finite feed must not be labeled complete history.

## Supplemental regional candidates

These regional candidates complement the core platform families. Their evidence establishes only the capability stated in each row; no authenticated or browser flow was tested.

| Candidate | Primary evidence and boundary |
|---|---|
| Naver Blog | Official RSS notices require modern HTTP/HTTPS. From September 22, 2026, old feed URLs stop redirecting three months after a blog-ID change: an important mutable-identity caveat. [Protocol notice](https://developers.naver.com/notice/article/27228), [rename notice](https://developers.naver.com/notice/article/33510) |
| Naver Cafe | Official OAuth API documents joining and writing; these operations do not establish universal reading of members-only boards or author-feed import. [Reference](https://developers.naver.com/docs/login/cafe-api/cafe-api.md) |
| FC2 Blog | Official manual documents entry RSS at `?xml`, with separate comment, trackback, category and tag feeds. Keep these content streams distinct. [Manual](https://help.fc2.com/blog/manual/Home/rss.html) |
| Ameba Blog | Official HTTPS RSS is `https://rssblog.ameba.jp/{ameba-id}/rss20.xml`. A 2024 update cancelled a proposed old-host retirement, so do not repeat the struck-through announcement as current fact. [Announcement](https://ameblo.jp/staff/entry-12865036798.html) |
| Hatena Blog | Official AtomPub/oEmbed documentation exists; publishing authority is separate from public reading. [AtomPub](https://developer.hatena.ne.jp/ja/documents/blog/apis/atom/), [overview](https://developer.hatena.ne.jp/ja/documents/blog/) |
| note.com | Official help updated October 9, 2026 confirms note API for note pro enterprise/solution-partner integrations. RSS/embed remains the documented external-display route; full-text RSS is a pro feature. Avoid blanket “no API” claims and undocumented internal JSON recipes. [API help](https://www.help-note.com/hc/ja/articles/46643492548121), [RSS/embed](https://www.help-note.com/hc/ja/articles/4402395202841) |
| Xiaohongshu / Rednote | Official account-platform quick start says only `basic_info` is currently open. Consented nickname/avatar access is not proof of arbitrary creator posts or follow graphs. [Quick start](https://openaccount.xiaohongshu.com/docs/quick-start) |
| Arca.live / Tullius | Public mod-community channel candidate; direct official page retrieval failed. No supported API, author identity, native follows or content parser was established. [Public channel](https://arca.live/b/tullius) |

## October 31 executable and community expansion

The [Bluesky guide](bluesky.md) adds actual public mod-author post/feed/profile and follow-page captures, ordered embed normalization and explicit repost/quote attribution. The [Discord guide](discord.md) adds an offline message normalizer with synthetic defensive tests, component media, partial-update/access states and privacy-safe receipts. Public guild directories establish community discovery only. Pillowfort is now a source-backed candidate through Julie J’s actual Sims creator profile; subsequent retrieval failed, and complete posts/media/following remain unverified. [RDSIM31063] [Round-three details](methods-round3.md).
