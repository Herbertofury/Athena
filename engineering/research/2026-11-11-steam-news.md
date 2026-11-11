# Steam news: preserve full API content and generated blurbs separately

Checked November 11, 2026. Base: Athena draft #43 at `7ba88d30229f3073c9aa738f087b9199ffae16ae`. This isolated experiment adds a public news adapter, not a store scraper, player, authenticated client or runtime integration.

## Inventory and choice

The current repository and open drafts were inspected first. Steam already has a retained AppID 620 store-media fixture, screenshot/trailer checks and separate source-card identity work. No GetNewsForApp, ISteamNews, appnews or newsitems implementation existed in the snapshot. Existing YouTube/Bilibili work covers selected public embeds and narrow identity/player contracts; it does not grant complete collection support. CurseForge's pending drafts are explicitly offline/synthetic, and the official API requires an approved key. Nexus's selected-gallery reconciliation remains a separate gap, with public API scope, current usage rules and SDK licensing to resolve before new collection. No new Nexus, CurseForge, YouTube or Bilibili content request was made for this experiment.

The documented Steam public news route provides a useful gap with actual anonymous evidence: a generated blurb can omit source markup and media, while a news page can mix HTML, plaintext and BBCode. The [new offline gate](../experiments/steam-news-lab/README.md) preserves those differences and retains individual query/failure provenance. No target application or mod is recommended on this basis.

## Official contract and access

The current Steamworks ISteamNews documentation identifies the public v2 GetNewsForApp endpoint. AppID is required; count, enddate, feeds and maxlength shape the result. maxlength=0 requests full API content; a positive value requests a generated blurb. The separately documented Authed method requires a publisher key and may expose unreleased-game data; it is excluded here. [STN11001]

Current authentication guidance explicitly distinguishes public methods needing no authorization from key-protected operations. The older Steam Community overview makes a broader key statement, so this work follows the current method-specific and authentication documentation, without creating or using a key. API terms and attribution limits still apply. No affiliation or endorsement is implied. [STN11002] [STN11003]

Exactly three serial public GETs were made with a descriptive User-Agent, thirty-second timeout, one-MiB response cap and automatic redirects disabled. The requests fixed enddate at 1794355200 (2026-11-11 00:00 UTC). No cookie jar, account, credential, grant, publisher operation, store-page scraping, SteamDB request or linked-article/media download was used.

## Actual capture results

1. AppID 620, count=3, maxlength=0: HTTP 200, 8,903 bytes, SHA-256 `ed977b337d64c5ad9cd6045b7fe212cd2ecee233f1fbaf1852bf0ab91a7b38f3`. Three news records were returned. Two contents fields contain HTML with one image reference each, at 2,964 and 4,253 UTF-8 bytes. The third is 147 bytes of plaintext. The response's count field is 800, distinct from the three returned rows. [STN11004]
2. The same AppID, count and enddate with maxlength=160: HTTP 200, 2,235 bytes, SHA-256 `ab5225354a669b9dbf6289a462f7b0b927d90555db4a81933b828f7eb68e1dce`. The same three news IDs appear, but contents are plaintext blurbs of 272, 290 and 146 UTF-8 bytes, with no image references. A requested length must not be treated as a UTF-8 byte limit or proof of source-body completeness. The third field also differs despite being shorter than the requested limit. [STN11005]
3. AppID 440, count=2, maxlength=0 and feed steam_community_announcements: HTTP 200, 2,581 bytes, SHA-256 `bc55ac51813c3533654ed00182bab5894348b198b424f31c816fc2e36cab8356`. Two records contain BBCode lists, with contents fields of 288 and 1,459 UTF-8 bytes. The response count is 740. Both records carry is_external_url=true, which must not be repurposed as a claim about publisher identity. [STN11006]

The three JSON bodies total 13,719 bytes. Capture bodies, full URLs and headers remain outside the repository. A [sanitized receipt](../experiments/steam-news-lab/public-validation-2026-11-11.json) retains exact implementation/capture hashes, byte counts and fixed states without copying source prose, author names, news IDs or delivery URLs. Its tests are offline and do not claim current remote availability.

## Preservation and interpretation

Keep AppID plus opaque news GID as identity, without converting GIDs to floating-point values. Preserve the source author, feed label and feed name separately. A news-feed author is not automatically the game's developer, a profile identity or an avatar. Preserve title and contents exactly in private evidence; never promote a summary or generated blurb to a complete article.

Full API content is scoped to the returned field, not the entire linked publisher article. Reconcile full-field and blurb variants without replacing the full field with the shorter result. Query differences are expected provenance, while a changed same-scope response still needs its own evidence. Failed later attempts must not erase observed data.

HTML projection reuses the existing extraction foundation and remains diagnostic. It is not sanitized renderable HTML. Original content hashes remain distinct from parsed/serialized HTML hashes. Image references do not establish decoded images, gallery order beyond the source field or image rights. BBCode is retained without pretending that an HTML parser can understand its list/media structure. Format detection is heuristic. Unrecognized syntax remains exact private source with projectionComplete=false; relative references and parser failures remain explicit.

Supplied news windows do not prove complete history. Response count is retained as an observed scalar, not an authoritative count of every eligible article. Timestamp boundaries can overlap or exclude equal-date records; duplicate GIDs, changed data, feed filters and request limits need explicit handling. No empty/short result or changed count proves deletion.

## Limits and reproduction

The gate makes no requests and changes no application runtime, existing media fixture or held release work. It does not establish store metadata, account ownership, authenticated news, download/playback, a complete external article, publication rights or full provider support. The actual evidence includes two HTML image references, but none of those media bytes was fetched or decoded.

Read the [adapter guide](../docs/adapters/steam.md) and [experiment API](../experiments/steam-news-lab/README.md). Run its focused tests and the repository research checks. Primary records STN11001 through STN11006 are indexed in the [source fragment](../data/sources.d/steam-news-20261111.json); prior records and historical failures are preserved.


## Review and retained failure

Independent replay verified all three original capture hashes, source-field lengths and full/blurb identity joins. A synthetic transport-failure envelope with HTTP 200 and complete=true initially became observed because the optional failure field was not recognized. That counterexample and the failing regression were retained, then corrected so transport failures cannot be accepted from HTTP metadata alone. A second type-matrix check caught numeric zero comparing equal to a false sentinel across four transport-diagnostic fields. Exact type checks now reject those malformed diagnostics; the eight failing subcases remain recorded. Response count diagnostics were also made explicit without treating them as history-completeness proof. No public capture was changed or retried.
