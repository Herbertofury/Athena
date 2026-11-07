# Nexus reuse review: preserve warnings before ranking throughput

Checked 2026-10-27. Sources: [ADP10], [EXT07], [GQL01]. The SDK commit is dated October 7, not a new release today. This is a source/API review, not a benchmark or accepted adapter replacement.

## Existing implementation first

Existing owned-repository Nexus identity/settings/media UI modules and Atlas's dated public Nexus card were inventoried read-only. Those are not a complete reusable Rust collector. No changes or recommendations were sent to another project's code, wiki or TODO. The official SDK was inspected, not installed or executed.

## Reuse candidates and blockers

At [c5eda4a46cafb5dc8000ed2a7986b22132625e2e](https://github.com/Nexus-Mods/node-nexus-api/tree/c5eda4a46cafb5dc8000ed2a7986b22132625e2e), package.json reports version 1.7.3 and LGPL-3.0, while LICENSE.md contains GPLv3. Resolve that discrepancy before copying/distributing implementation; this review does not determine applicable legal terms.

In src/Nexus.ts, modsByUid chunks work under a bounded count and quota wait, and documents string UIDs to avoid JavaScript integer precision loss. Its default requestGraph returns the selected data root whenever data is truthy; a distinct requestGraphWithErrors path preserves returned errors. Therefore, callers that need complete-media acceptance must not infer complete success merely from returned data. This is a static control-flow finding, not a demonstrated live SDK failure, vulnerability or assertion that every helper loses errors.

## Protocol contract

The [GraphQL specification](https://spec.graphql.org/September2025/#sec-Response-Format) distinguishes request errors from execution results that may contain partial data plus errors. Atlas's proposed acceptance contract retains the complete response/error provenance locally, marks partial data explicitly, preserves last-good complete records, and never relabels missing fields as empty content. Error text must be sanitized before public output.

The [Nexus documentation](https://graphql.nexusmods.com/) still calls v2 experimental, retains stable v1 and separates public from OAuth operations. Its media query is paginated and has image/video union members; a mod cover URL alone cannot establish full-gallery coverage. Use game-domain plus mod identity, explicit requested fields, pagination evidence and supported public access. No authentication or private content was accessed in this review.

## Scoped ordering, not an overall winner

1. Prefer the official route and reuse validated identity/quota/error-preservation contracts where applicable.
2. Keep SDK integration a candidate pending licensing resolution and measured full-output/error parity for the required operations.
3. Avoid treating HTTP success, a non-null data root, a cover image or a successful browser login as complete collection or an API grant.

Next evaluation should include data-only success, data+errors, null/absent roots, missing requested IDs, pagination shifts, denied access and last-good preservation. These cases are planned acceptance work, not reported test results. No target-project recommendation follows from this review.

## Access evidence

Official documentation was readable through the research tool. A separate direct executor retrieval returned HTTP 403; it was not retried through an evasion route. No unrecognized third-party prototype was executed and no new live Nexus query is claimed here.
