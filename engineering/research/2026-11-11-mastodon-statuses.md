# Mastodon status identity and attribution evidence

Checked November 11, 2026. Base: Athena research draft #43 at `7ba88d30229f3073c9aa738f087b9199ffae16ae`. This pass adds a scoped offline status adapter, official-source observations and three real anonymous response captures. It changes no target application, provider runtime, dependency, account, follow, workflow or release.

## Existing gap and design decision

The [social adapter guide](../docs/adapters/social-platforms.md#3-mastodon-instance-qualified-accounts-boosts-html) describes Mastodon instance-qualified IDs, boosts and HTML, but the existing executable extraction lab does not implement this provider. It already provides a strict JSON decoder and inert HTML body/event extraction. The [new status experiment](../experiments/mastodon-status-lab/README.md) reuses those helpers rather than adding a parallel scraper or network client.

The decision is narrower than a Mastodon application: bind one caller-selected status to its API instance, preserve the source fields needed for attribution and media decisions, and optionally compare its embedded author with a separately obtained profile. The result must not confuse a boost actor with the original author or substitute a card/preview for the received post body.

The active draft inventory was checked first. No overlapping Mastodon implementation draft was found. The existing research head and source drafts remain separate; this contribution does not attempt a runtime or release correction.

## Official contracts that matter

- Status and account IDs are opaque strings scoped to the API server. They are not guaranteed numeric, and casting large IDs to JavaScript numbers can lose identity. Federation URI and profile URL are separate source fields, not something to reconstruct from the local numeric-looking ID. [MST11001] [MST11002] [MST11004]
- A boost has an outer status/account and a nested reblog status with its own author and body. Content warnings, visibility and sensitive flags apply to their corresponding observations. The source content is HTML; the deleted-status redraft text field is not an interchangeable complete body. [MST11001]
- An attachment's local full-size URL, scaled preview and remote original have different roles. Null delivery metadata can occur while processing. A declared image, video, gifv or audio type does not prove bytes exist, decode or play. Ordered attachments and alt descriptions must not collapse into a single thumbnail. [MST11003]
- Selected public status and account GET operations have public-read routes. Authentication requirements differ by operation and instance; a 401 can reflect authorized-fetch mode and a 404 can mean missing or inaccessible. Account lookup is documented separately with token requirements and was not used. No account grant or fallback login was requested. [MST11005] [MST11006]

The original HTML remains inert source data. The existing helper's ordered events are a projection: safe-reference URLs may omit queries, serialization may change markup and text extraction is not a faithful browser layout. Keep the original HTML string and exact input bytes separately. Neither upstream sanitization statements nor a successful parser justify injecting arbitrary source markup into an application's DOM. [MST11004]

## Actual bounded public observations

Two publicly indexed professional/product posts provided exact selected status IDs; neither is a target recommendation:

1. [Super Productivity release announcement](https://mastodon.social/@superproductivity/117192733475238885): HTTP 200, 4,116 bytes, SHA-256 `427804f4b62914501c754c8df241382dba460f76eba4fc23eaa0b765653ca23a`. Its content has 724 UTF-8 bytes of source HTML, a link-preview card and no attachments. [MST11007]
2. [Game screenshot post](https://mastodon.social/@lashman/117270553071094821): HTTP 200, 7,286 bytes, SHA-256 `db570f7d37bc6559650daabbe1b2a896b07b4a558c8c92086923ae2359dd7e1d`. Its 567 HTML bytes accompany four ordered image attachment records. Each has a full-size and preview URL, with remote_url=null. No image was downloaded. [MST11008]
3. The first post's returned account ID selected one public profile GET: HTTP 200, 1,465 bytes, SHA-256 `73563d852a168ee587f630b1cdb365f819ec25d7e58fa9aff8dcd96ca6a6fdcc`. The profile ID agrees with the embedded author and both avatar roles are present. Matching supplied profile fields does not independently authenticate ownership. [MST11006] [MST11007]

All three requests were serial, anonymous and bounded to one MiB with a thirty-second timeout and descriptive research User-Agent. No authentication header, cookie jar, registration, follow operation, media request or outbound-link traversal occurred. The actual statuses declare public visibility, sensitive=false, and null reblog, quote, poll and edit timestamp. Boosts, denied access, edits, migration and unavailable attachments were not observed live; their defensive cases must remain labeled synthetic.

Exact source bodies, request observations and headers are retained externally. The adapter retains only ordered events from the existing helper, not its serialized markup or aggregate text; neither is treated as a rendering approval. The [small public-form receipt](../experiments/mastodon-status-lab/public-validation-2026-11-11.json) contains hashes, lengths, selected relationship states and representation counts, not raw prose, personal profile fields or delivery URLs. Its stored-contract tests do not perform a live network read. The server deployment version is not inferred from current documentation or a cached landing-page label.

## Alternatives and limits

- A generic HTML scraper would discard structured author/media distinctions already supplied by the official API. Reuse the established endpoint and parser helpers instead.
- Flattening a reblog into its outer account can credit the wrong author. Conversely, replacing the outer event with the inner post loses who shared it. Preserve both roles.
- Deduplicating bare IDs across instances merges unrelated local records. Comparing federation URIs can be useful, but this experiment does not prove federation authenticity or global completeness.
- Replacing absent media with preview/card artwork invents a successful delivery. Keep presence states and each declared role; actual transfer, decoding and playback remain separate gates.
- A source HTML projection is not a sanitizer, renderer or complete visual transcript. Original unknown fields remain available privately, and unsupported features must remain explicit.
- This is selected-status evidence, not feed pagination, complete profile history, followed-account import, native follow writes, private-content access, Mastodon-compatible server certification or edit/deletion synchronization.

No target baseline comparison, performance claim, dependency upgrade, mod compatibility claim or target adoption recommendation follows. Full local checks, independent review, retained implementation failures and any exact-head publication state are recorded with the deliverable, separately from actual public response capture.

## Retained implementation review findings

Initial independent synthetic probes found that a malformed comma-only image srcset could escape the shared HTML helper as an exception; ordinary Python object equality treated unknown extension booleans and numbers as equal; the helper projection included serialized markup and aggregate script text; and empty profile URLs could satisfy a weak join. A separate presence check found that missing media arrays could look identical to explicitly empty arrays. A later review found that mutable private presence/extension dictionaries were aliased into the public receipt snapshot. These are retained rejected implementation outcomes, not claims about the two live public posts.

The adapter boundary now keeps a failed projection separate from preserved source, compares successful captures with type-sensitive canonical JSON, exposes only ordered events from the helper, requires nonempty valid profile references for joins, retains selected field-presence states, and isolates the receipt snapshot from subsequent private-result mutations. Regression probes must pass before publication. The existing shared helper and other adapters are not changed by this experiment.

## Sources and reproduction

Source IDs MST11001 through MST11008 are in the additive [source fragment](../data/sources.d/mastodon-statuses-20261111.json). Prior source records and dated results remain intact. Read the [experiment guide](../experiments/mastodon-status-lab/README.md) for the offline API, explicit work bounds and test command.
