# Steam public news evidence laboratory

[Steam adapter guide](../../docs/adapters/steam.md) · [Dated research](../../research/2026-11-11-steam-news.md) · [Actual capture receipt](public-validation-2026-11-11.json)

An offline gate for captured responses from the documented public ISteamNews GetNewsForApp v2 endpoint. It reuses the existing strict JSON decoder and ordered HTML projection in [site extraction](../site-extraction-lab/README.md). No HTTP client, renderer, media downloader, account access or runtime integration is included. The existing declared lxml dependency is reused; no new dependency is introduced.

## API

`collect_news(selected_appid, captures)` accepts a positive uint32 AppID and an exact list of captured response dictionaries. Each dictionary supplies `requestUrl`, `finalUrl`, integer `status`, boolean `complete` and `body` as UTF-8 bytes or a string. Optional transport diagnostics remain private. The caller is responsible for permission, safe collection, status and completeness evidence; the gate makes no request.

Only the documented HTTPS public v2 endpoint is recognized. Exact AppID, count, enddate, maxlength, feeds and JSON format scope are checked. Unknown query parameters, duplicate parameters, credential-bearing or alternate URLs, redirected responses and authentication-only routes cannot become accepted observations. Feed names currently use the bounded ASCII letters/digits/underscore/hyphen contract; this is a deliberately limited supported subset, not a claim about every feed name the service might expose.

The returned evidence exposes `.attempts` and `.records` as private copies and `.receipt()` as a sanitized copy. Attempts retain bounded source envelopes, decoded records, field states and projection failures. Records reconcile AppID and opaque GID without floating-point ID conversions. Neither editing the input, private exports nor a previous receipt changes subsequent output.

## Content variants and media

- Explicit maxlength=0 means full **API content field**. It does not prove that the complete linked external article was supplied.
- A positive maxlength means a generated blurb. It is not a UTF-8 byte budget. An omitted maxlength remains unspecified, rather than silently assuming the full-field contract.
- Full-field and blurb observations remain separate. A later blurb does not replace a previously retained full field. Repeated observations stay present; different data under the same request scope is flagged for inspection.
- Author, feed label and feed name remain separate from the game developer or a verified publisher account. The source external-URL flag is retained without inventing that attribution.
- Contents remain exact in private evidence, with separate hashes and byte counts. Missing, null, empty and malformed fields stay distinguishable.

HTML is projected through the existing helper only as a diagnostic. Its serialized fragment can differ from the original source field, so the original hash remains authoritative for preservation. No output is safe to render merely because it was parsed. Media references are counted, not fetched, decoded, licensed or proven playable. Relative references remain unresolved because a Steam redirect URL is not a verified publisher base.

Format detection is heuristic; unrecognized syntax stays in exact private source with projectionComplete=false. Recognized BBCode is preserved exactly and marked unsupported for projection. An HTML parser is not a BBCode parser. Mixed or unknown source markup cannot establish media completeness. A malformed fragment or helper failure is retained as a projection failure while its source content remains available. Every projection-completeness and acceptance flag remains false.

## Windows and input bounds

A supplied response is a query window. Returned-row count, response count, request count and enddate have different roles. No short or empty window, changed count, repeated timestamp or gap proves full history, deletion or a completed pagination walk. The module does not schedule additional pages or follow links.

Limits are 32 captures, 256 KiB per body, one MiB total accepted body input, 256 KiB per string, 512 KiB per envelope, 20,000 structural nodes, 2,048 array/object entries and nesting depth 24. Exact builtin containers and values are validated before copying. Duplicate JSON keys, nonfinite numbers, malformed UTF-8, unpaired surrogates and limit violations cannot pass as source data. Top-level invalid selection/container raises a fixed error; per-capture failures remain ordered attempts. Rejected oversized envelopes/bodies are not retained in full; capture them separately if preservation beyond these budgets is needed.

A small public receipt contains only fixed state labels, field-state maps, hashes, byte/count diagnostics and false acceptance gates. It omits body prose, titles, authors, GIDs, URLs, headers and raw errors. Private `.attempts` or `.records` must never be used as a substitute public export.

## Reproduce without network

From the repository root:

```sh
python -m unittest discover -s engineering/tests -p 'test_steam_news*.py' -v
python engineering/scripts/check_research.py
```

The tests use generated fixtures and a sanitized receipt from three actual public captures, bound to exact implementation hashes. Raw captures remain outside the repository. The stored contract verifies those observations, not present-day remote availability. No target-project recommendation, complete-provider support, account ownership, store metadata acceptance, external-article completeness or browser playback follows.
