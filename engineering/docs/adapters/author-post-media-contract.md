# Author, post, media and follow contract

[Adapter laboratory](README.md) · Design proposal, October 27, 2026 (America/Denver)

This is the shared product and data contract for the expanded research catalog. A site's documented API, a visible web page, and a working adapter are different evidence levels. The contracts below are proposed engineering requirements; they are not claims that the listed sites already support every operation.

## What the app should deliver

A person follows a creator once in the app, sees correctly attributed activity from that creator's verified accounts, reads the complete accessible post, views its media in order, and opens or downloads the right version of an authorized file. They can filter by game, creator, source, content type, access state and installed-mod relevance. The feed preserves read state, edits, release history, source links and useful failures. A missing thumbnail, expired account or partial history must not look like an empty successful feed.

Provide separate controls for **Follow in app**, **Follow on source**, **Import source follows**, **Notifications**, and **Manage paid membership**. Native follows require their own verified capability and user action; a local follow must never create a paid subscription. Following a project, following its team, and following an individual author are distinct relationships.

## Identity before extraction

| Entity | Stable identity and provenance to retain | Common mistake to reject |
|---|---|---|
| Creator | Provider plus provider-issued account ID; canonical profile URL; mutable handle; display name; account/team kind; avatar URL and observed time | Using a display name as a globally unique key |
| Account connection | Viewer/account ID, provider, granted scopes, connection state and credential reference | Confusing the logged-in viewer with the author |
| Post | Provider plus post ID; canonical URL; author IDs; publish/update timestamps; access and completeness | Using title, current timestamp or expiring media URL as identity |
| Mod/project | Provider plus project ID and game namespace; team and contributors; dependencies | Treating a publisher, uploader or team owner as the sole creator |
| Release/file | Project ID, version/file ID, filename, size, hashes when supplied, game/loader/platform compatibility | Selecting the first file or equating latest upload with compatible version |
| Mirror/index entry | Index item ID, original-source links, uploader, claimed creator and attribution evidence | Promoting an index's attribution guess to verified original authorship |
| Follow | Viewer/local profile, target kind and identity, local/native state, notification preferences | Equating favorite, membership, project watch and author follow |

Store IDs as strings, including large numeric IDs. A federated account also needs its instance/actor identity. Handles and domains can change; preserve aliases with observation times and redirects, and do not merge two creators on a matching name or avatar alone. Prefer a creator's own outbound link, an explicit provider relation, or a user-confirmed match. Keep conflicting evidence inspectable and merges reversible.

Avatars come from the author object or an author-scoped profile element. A post's Open Graph image is usually a preview candidate, not proof of an author portrait. Represent a default avatar as `isDefault=true`; do not claim the site's placeholder is a recovered personal image. Save the source of each mapping and refresh avatars independently of historical post identity.

## Proposed normalized record

The following is an illustrative contract, not an API response or implemented schema. Optional provider fields may be absent; unknown information remains unknown.

```typescript
type AccessState =
  | "public" | "authorized" | "preview_only" | "login_required"
  | "membership_required" | "purchase_required" | "tier_required"
  | "age_confirmation_required" | "permission_denied" | "challenge"
  | "rate_limited" | "temporarily_unavailable" | "removed" | "unknown";

type CreatorRef = {
  localRecordId: string;
  provider: string;
  providerId?: string;
  identityStatus: "provider_account" | "provisional_profile" | "unresolved_credit";
  profileUrl?: string;
  accountKind?: "individual" | "team" | "organization" | "unknown";
  handle?: string;
  displayName?: string;
  avatar?: { url: string; isDefault: boolean; observedAt: string };
  role: "original_author" | "credited_author" | "contributor" | "publisher"
    | "uploader" | "reblogger" | "porter" | "translator" | "curator";
  attribution: "provider_asserted" | "creator_linked" | "community_claim" | "user_confirmed";
};

type MediaRef = {
  id: string;
  role: "avatar" | "cover" | "inline" | "gallery" | "video" | "audio" | "attachment";
  ordinal?: number;
  ownerPostId?: string;
  sourceUrl: string;
  access: AccessState;
  variants: Array<{
    kind: "thumbnail" | "preview" | "original" | "stream" | "poster";
    url?: string; resolverRef?: string; mime?: string;
    width?: number; height?: number; expiresAt?: string;
  }>;
  alt?: string;
  caption?: string;
};

type PostRecord = {
  provider: string;
  id: string;
  canonicalUrl: string;
  creators: CreatorRef[];
  publishedAt?: string;
  updatedAt?: string;
  observedAt: string;
  body: { format: "blocks" | "html" | "markdown" | "text"; value: unknown };
  media: MediaRef[];
  sourceRelations: Array<{ kind: "reblog" | "quote" | "mirror" | "release"; url: string }>;
  access: AccessState;
  completeness: {
    body: "complete" | "partial" | "unknown";
    media: "complete" | "partial" | "unknown";
    history: "complete" | "partial" | "unknown";
    continuation?: string;
    omittedReasons: string[];
  };
  provenance: { adapterVersion: string; method: string; evidenceRefs: string[] };
};
```

Separate the storage format for public metadata from private content and secrets. A public research fixture must not contain the real viewer's identity, memberships, cookies, tokens, private post body or signed download URLs. A credential reference is an opaque handle to a protected store, never the token itself.

The local record ID identifies an application record, not a provider account. A credited name with no proven profile stays `unresolved_credit`; do not synthesize a provider ID or substitute the uploader's profile. An account's kind is separate from its contribution role. Regional eligibility and incompatible-platform details can be recorded as separate reason codes without treating them as missing content. Each media item retains its own access state even when the containing post is public.

## Choosing an extraction route

Use a provider capability table, not a universal scraper. Start with the documented interface that supplies the required fields and account scope. A creator-admin API is not interchangeable with a patron reader API. If an API omits a required gallery or post type, record that gap and evaluate a separately permitted page route against the same fixture.

For a page route, parse structured post data when actually present, then the relevant post/profile DOM. Do not execute embedded scripts to parse data or sweep every image on the page. JSON-LD and Open Graph can establish discovery metadata; they rarely establish complete body, gallery, attachments and authorship together. Rendered DOM is a separate fallback for a JavaScript shell and needs its own selectors, versioned fixtures and drift checks.

HTML is untrusted. Render structured blocks or sanitize rich HTML, preserving the original authorized text for comparison. DOMPurify is one established candidate; its documentation warns that later manipulation can undo sanitization. Select and test the sanitizer configuration for the target UI and runtime, including embeds and URL protocols. [DOMPurify upstream](https://github.com/cure53/DOMPurify)

The transport, parser, normalizer, session broker, media resolver, follow operations and persistence should have separate interfaces. This allows reuse without mixing a Patreon entitlement decision with a file-host download resolver or a Tumblr reblog parser. It also permits deterministic parser tests without live account access.

## Complete post and media behavior

Keep the provider's block order, rich links, captions, alt text, language, spoiler/content-warning markers and attachment boundaries. Distinguish the author's own text from quoted/reblogged text and retain the original creator relation. Preserve gallery order and image variants; deduplicate only identical assets in the same semantic role. A screenshot, avatar and downloadable archive must not collapse merely because their URLs share a CDN host.

For files, retain the provider's file/version ID, visible filename, byte size, digest if supplied, license/reference link, dependencies and whether a browser confirmation is required. Resolve short-lived authorized URLs immediately before use. Treat embedded YouTube or other official players as player integrations; a playable embed does not imply permission or capability to download its underlying media.

Image success means a decoded usable image, with the expected role and order. Video success means observed playback for the selected video, including required audio; a thumbnail, loaded iframe or player-ready event is weaker evidence. Preserve genuine unavailable states and the reason a media item is missing. The existing [collection contract](contract.md) and [media workbench](../media-lab/index.html) retain earlier evidence.

## Reliable follows and synchronization

| Operation | Required behavior |
|---|---|
| Add local follow | Save the canonical creator and source accounts; allow per-game and content-type preferences |
| Import follows | Use a documented read scope/export; show which items could not be resolved; do not mutate remote follows |
| Native follow/unfollow | Require an advertised, tested capability and deliberate action; make retries idempotent; read back state |
| Initial history | Page until the provider's end condition or an explicit budget; save continuation and completeness |
| Incremental refresh | Resume a cursor or overlapping time window; deduplicate by stable ID; capture edits and replacement files |
| Notifications | New releases, meaningful edits, dependency changes and access expiry; quiet hours and user-selected digest cadence |
| Disconnect | Stop account-scoped polling, revoke the grant where supported and isolate retained metadata according to the user's retention choice |

A bounded batch is useful for responsiveness, but it is not a complete history. Never silently discard records beyond a fixed first-page or item limit. Preserve server cursors and tie-break with stable IDs. Revisit pinned/edited old posts and early-access releases; sorting only by publication time misses both. Do not use the crawl time when the source publication date is unknown.

Use ETag/Last-Modified validators where the server supports them. HTTP conditional requests can reduce unchanged transfers; they do not prove that an incomplete representation has become complete. Keep validators and cached bodies associated with the actual account, scope and representation. [Conditional request behavior](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests)

Apply per-provider concurrency, rate budgets, `Retry-After`, bounded backoff and cancellation. Classify a 401, a forbidden account, a rate limit, a parsing failure and an empty feed separately. A blocked fetch must retain the last good result and its age. Do not turn source errors into successful empty updates or repeated notification storms.

Retention is not fresh authorization. Restricted snapshots remain partitioned by viewer, account and grant context. Account switches, disconnects and access loss must apply the product's explicit retention and presentation rules; never expose another account's body or signed delivery URLs. Keep permitted metadata and an honest stale/error indicator when restricted content can no longer be displayed.

## Game-specific correctness

Preserve game edition and platform independently from the marketing name. Skyrim SE, Skyrim LE and runtime-dependent variants must remain distinguishable; Fallout 4 version requirements, Minecraft Java/Bedrock and loaders, Sims 4 package/tray/script assets, Cyberpunk 2077 frameworks, and Hytale project/version dependencies need distinct fixtures. Use explicit metadata before text heuristics; show a confidence level when classification depends on a description. A cross-game creator should not have every post assigned to the last game the user viewed.

See [validation and adoption](validation-and-adoption.md) for acceptance tests. This design does not authorize implementation changes to another repository.
