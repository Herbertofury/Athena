# Bluesky thread context is not complete history

Checked November 11, 2026. This local research candidate starts from Athena draft #43 at `950f73e50cf66ae69493eb1f4d92fb06cee9865f`. It adds a bounded offline thread-evidence layer to the existing Bluesky post normalizer. No target app, dependency, runtime, account, grant or native social action changes.

## Decision and existing gap

The current [Bluesky adapter](../docs/adapters/bluesky.md) already handles full received post text, UTF-8 facets, nested embeds, repost authors, feed pages, profiles and follows. It does not normalize getPostThread response trees or check a reply's parent/root references against the returned context. Treating a feed page as a conversation loses ancestor relationships; treating a reply count as imported content invents completeness.

The [thread experiment](../experiments/bluesky-thread-lab/README.md) reuses normalize_post from the existing adapter and the existing strict JSON decoder. It only consumes bounded supplied bytes. Transport, identity discovery, authentication and application rendering remain the responsibility of established clients and the consuming application. This is a focused evidence layer, not a replacement Bluesky SDK or scraper.

This contribution is separate from the unpublished GitHub release-asset candidate. It begins from the unchanged remote research head and contains none of that candidate's files. No publication or alternate route around the denied commit is attempted.

## Current official contracts

- The canonical query explicitly allows unauthenticated reads; authenticated views apply additional metadata and filtering. It takes a required post URI plus independent descendant depth and ancestor parentHeight. The schema permits zero through 1,000 for each, but that schema range is not proof of a complete response or a service capacity guarantee. The experiment uses much smaller bounds. [BST11001]
- The response union distinguishes a visible thread post, notFound and blocked. Parent and replies are optional. A notFound observation can represent a nonexistent post, author deletion or moderation takedown; do not label it a verified deletion. Unknown future union members must remain unsupported observations, not empty successful posts. [BST11002] [BST11004]
- A reply record has separate root and immediate-parent strong references. Matching a URI while ignoring a contradictory CID can join incompatible observations. CID comparison here is string identity, not cryptographic verification of repository contents. [BST11003]
- Use the documented cached public AppView hostname for public reads. A successful anonymous view does not reproduce an account's blocks, private viewer state, feed or moderation decisions. Public availability also does not grant content reuse or remove application-level reporting/removal obligations. [BST11005] [BST11006]

The old docs.bsky.app API reference redirected to an endpoint shell with no readable reference lines. The old advanced-guides path also had no readable body. Following current official navigation reached the working hosts/auth and thread guides. The official atproto lexicon directory now explicitly points to bluesky-social/bsky for app.bsky definitions. Canonical query, definitions and post schemas were read at exact commit `19fb7b03e1096ee88376ca403103804c3e5856ce`, not inferred from stale search snippets. [BST11007]

## Three actual public captures

The existing corpus already references [EightSidedSquare's Content Content post](https://bsky.app/profile/eightsidedsquare.com/post/3lmb5eoamek2s). Its retained DID-based post identity selected the new read scope. Three serial anonymous requests used the official public API, no authentication header or cookie jar, a descriptive research User-Agent, a thirty-second timeout and one-MiB response bound. All completed with HTTP 200. No media or external links were fetched. [BST11008]

1. Depth 0, parentHeight 0: 1,993 bytes. One visible post declares replyCount=6 but omits replies entirely.
2. Depth 2, parentHeight 2: 12,829 bytes. The response contains nine visible posts: the selected post, six immediate replies and two grandchildren. The two depth-boundary grandchildren omit replies, although each declares replyCount=0.
3. One reply selected from that returned response, depth 1, parentHeight 2: 3,276 bytes. The selected reply and its visible parent are present. That parent still declares six replies but does not include its other children in this ancestor context.

These are twelve visible representations across captures and nine distinct post identities, not twelve unique posts. The shallow observation plainly lacks the six counted replies. The larger observation's matching immediate count still does not prove complete history, visibility, nested replies, quotes or a coherent snapshot. The absent siblings in an ancestor context are a scope distinction, not a fabricated provider failure.

The receipt retains exact input hashes, lengths, capture times, request geometry, implementation identities and scoped outcomes. Original bodies, headers, prose, avatars and viewer fields remain external unpublished evidence. Stored receipt checks do not repeat a live API read. No blocked or missing live sample occurred; those defensive cases are labeled synthetic rather than passed off as real provider incidents.

## Rejected shortcuts and acceptance boundaries

- Flattening the returned tree into an ordinary feed discards parent direction and unavailable context. Preserve thread roles and edges alongside the reused post projection.
- Fetching a descendant with depth 0 does not mean it has no replies. Absence, empty replies and count metadata are separate facts.
- Increasing depth to the schema maximum is not a completeness strategy. There is no collection cursor in this pinned query schema, and this pass makes no claims about alternative or unspecced APIs.
- A notFound variant is not evidence identifying who removed a record. An unavailable or failed observation must not erase previously retained evidence.
- Direct PDS/repository traversal is a different synchronization and identity-verification problem. This pass neither crawls repositories nor signs in to broaden visibility.
- CID/DID and reference agreement is structural consistency, not authenticated authorship. Public receipts minimize disclosure but do not anonymize linkable hashes.

No target baseline comparison, performance benchmark, browser rendering, media decode/playback, exhaustive collection or account-specific moderation test was performed. No target compatibility or adoption recommendation follows. Independent review, synthetic failures and final local test outcomes are retained with the handoff; hosted acceptance cannot be claimed for an unpublished candidate.

## Retained implementation checks

A composing-state aggregate ran 975 tests with one research-link error because the parent-owned README/receipt files did not yet exist. It was not called a passing aggregate. Independent review also clarified that this layer validates selected relationships rather than the complete lexicon: nonempty timestamps remain strings, unsupported ancillary metadata is retained, and threadgate presence is not certified policy behavior. Final tests cover the completed artifacts.

## Sources and reproduction

Sources BST11001 through BST11008 are in the additive [source fragment](../data/sources.d/bluesky-threads-20261111.json). Prior sources and dated evidence are unchanged. The [experiment guide](../experiments/bluesky-thread-lab/README.md) describes the actual API, limits and tests. The [public-form receipt](../experiments/bluesky-thread-lab/public-validation-2026-11-11.json) is prepared locally; it is not a statement that anything was published.
