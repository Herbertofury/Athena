# Provenance is inspectability, not semantic correctness

Reviewed October 30, 2026. Research-only screening for Atlas's evidence workflow; no application or other-project adoption.

## Primary finding

[GraphRAGProv v1](https://arxiv.org/html/2610.37237v1), submitted October 27, connects SPARQL results to statement occurrences and source spans. Its 400-case evaluation constructs graphs from designated supporting passages. Extraction and query generation can see the question, expected answer and reasoning evidence, so these results do not establish unseen-question retrieval quality. It reports 311 complete traces; sixteen MuSiQue answers lack decoded provenance. The paper's inspected cases include a correct answer with a misinterpreted source span and another with a missing required relation. Exact span resolution and executed-query provenance therefore remain separate from semantic correctness. Source: GRAPHPROV30.

## Upstream reuse gate

The paper claims MIT source availability, but its linked GraphRAGProv and sparql-prov GitHub repositories returned 404 during this review. License terms, dependency pins, implementation behavior and runnable reproduction remain independently unverified. A 404 does not establish why a repository is unavailable. No source was executed, demo query submitted, API credential created or model request purchased.

## Atlas decision

Retain this as a research lead. Atlas already preserves full raw responses, generation identity and explicit access/media states; this paper does not justify replacing that implementation. Any future comparison must check incorrect entity binding, unsupported relationships, empty joins, unresolved spans and missing provenance independently of final-answer accuracy. It must also account for complete source retention, extraction cost, privacy, latency and failure recovery. No target implementation comparison has been performed, and no cross-project recommendation follows.
