# WordPress collection reconciliation

Date: 2026-11-11 UTC. Base: Athena draft #43, `e7eb88a3d93d027ffd589a877244dfc81a24c32a`. [Guide](../docs/adapters/wordpress-collections.md) · [Implementation](../experiments/site-extraction-lab/wordpress_collection.py) · [Actual receipt](../experiments/site-extraction-lab/wordpress-collection-validation-2026-11-11.json)

## Decision and scope

Extend the existing WordPress single-post extraction experiment with an offline collection-evidence layer. Do not modify its original parser or claims, an active provider integration, Foundry, UI/browser acceptance, workflows, main, or another target project. The wider corpus already describes Discourse stream batching; repeating that work was rejected. WordPress's distinct REST page/count and filtered-scope contract was a concrete uncovered implementation gap.

Primary sources checked: WPC11001 (pagination), WPC11002 (posts schema/filtering), WPC11003 (embedding), WPC11004 (field/global parameters), WPC11005 (controller source), WPC11006 (actual public endpoint). The additive [source fragment](../data/sources.d/wordpress-collections-20261111.json) preserves each URL and observed date/version. This is not a pinned WordPress server-version compatibility result.

## Actual bounded observation

Four public responses retain two distinct historical posts across two scopes. Broad pages 1 and 2 reported 1,117 total records/pages at size one, leaving 1,115 missing pages. The independent `include=1,2` scope reported two records/pages and was covered by its two supplied responses. Each scope retained its own headers/counts and scope hash. Input body hashes match across these two scopes, so a successful record parser alone cannot distinguish their very different collection coverage. Embedded author IDs matched; media delivery, decode and playback were not attempted.

The complete actual response bytes stay outside the repository. The published receipt contains input hashes/byte counts, dates, original endpoint identity, numeric post/author relationships and normalized body counts/hashes. It makes no complete-history, stable-snapshot, complete-media, target-acceptance or speed claim. A preliminary successful public endpoint probe without retained response bytes is excluded from the four-capture replay evidence.

## Retained failed assumptions and repairs

An independent reviewer found six synthetic counterexamples after the initial 39-test pass:

1. Empty `srcset` segments escaped the inherited HTML walker with IndexError. Failed projection is now retained per post.
2. Escaped unpaired Unicode surrogates escaped canonical hashing. Bounded JSON validation now rejects them in keys and values before hashing.
3. An arbitrary HTML type attribute leaked as `mimeHint`. The new public receipt omits that attribute.
4. Relative images used the API endpoint as their base. They now use a valid post permalink, or remain unresolved when it is absent.
5. Boolean `featured_media=true` matched numeric media ID 1. Exact integer identity validation prevents that join.
6. A, B, B variants of one page emitted three records. Every distinct page fingerprint is tracked; exact repeats preserve their attempts without duplicating records.

These are actual review findings exercised with explicitly synthetic inputs, not failures observed at WordPress.org. Their original failure outputs remain retained outside the candidate; the receipt and regression tests preserve what failed and how it was corrected. No assertion was relaxed to turn those cases green. URL path/hostname sensitivity remains a documented publication-review requirement; this is not general secret scrubbing.

## Verification

The focused collection suite, stored-receipt checks, full Engineering Python/Node suites, source/link checker, generated checks, root build and root npm suite are run against this isolated candidate. Exact final counts and command outcomes are recorded in the draft PR, separately from hosted CI. Stored receipt validation checks internal consistency and implementation identity; it does not re-fetch third-party bodies or authenticate the original capture.

The first aggregate run exposed incorrect source-index ordering; the baseline entry was restored to the required first position without altering the checker. The initial build also exposed an incomplete local copy missing tracked `dist/` files; the exact baseline files were restored before repeating build/tests. Both failed logs remain retained. These setup failures are separate from the six parser findings.

The source fragment adds six records without replacing earlier entries. Existing dated source-review warnings remain visible. Native browser, media playback and target-project acceptance are not established by these checks. No production performance comparison has been made.

## Remaining work

A permitted transport must establish its own method, response headers, authorization, redirect and retry/rate-limit behavior. A future target experiment must preserve failed responses, content fields, original identities, complete required media and interrupted user flows against that target's current implementation. Equal-count edits and replacements between page requests remain undetectable without a stronger source-side snapshot protocol; count agreement must never be relabeled snapshot consistency.
