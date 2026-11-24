# Query reuse and extraction: promising is not lossless

Reviewed 2026-10-28. Research-only candidates. No third-party prototype was executed, no paid model request was made, and no private data was transmitted. These findings do not change any project's implementation or TODO.

## Scoped evaluation order

1. Preserve exact source responses and deterministic validation as the acceptance baseline.
2. Evaluate provenance-aware derived views only when stale and unknown results are explicit.
3. Keep model-derived judgments in a separate experimental lane; cheaper calls do not establish equal correctness.
4. Do not replace a permitted deterministic adapter with an agent merely because a paper reports a higher score than its chosen agent baseline.

This ordering is an Atlas test priority, not a universal technology ranking.

## EUR: new conceptual model

[EUR01, version 1 submitted October 27](https://arxiv.org/html/2610.36833v1) proposes query-driven vocabulary, logical schema and durable fact evolution. It is useful as a design question for derived research indexes. The reviewed paper presents a model and examples, not an Atlas storage benchmark. Preserve immutable raw responses and explicit migration/provenance boundaries in any future test. Do not infer general autonomous self-improvement from schema evolution.

## OCTOPUS: reuse can retain errors

[OCTOPUS01, version 1 submitted October 23](https://arxiv.org/html/2610.32586v1) reports fewer model judgments through retained tags. Its feasibility table gives mean quality 0.82 versus one baseline's 0.87; the text also identifies inherited judgment errors and unresolved semantic staleness. The reported reduction in judged rows is not equivalent to an end-to-end latency gain with complete-data parity. This fails Atlas's no-quality-loss promotion requirement without further evidence. Candidate tests must invalidate derived values when source, model, prompt or rules change and compare complete answers against reviewed ground truth.

## Webscraper: improved relative accuracy is still incomplete

[WEBSCRAPER01, version 1 submitted March 31](https://arxiv.org/html/2603.29161v1) evaluates structured prompting plus specialized tools on six news sites and two commerce sites. Reported commerce correctness is 0.242 and 0.422, despite beating its agent baseline. This is not evidence of flawless extraction, full media coverage, authenticated access or superiority to the current deterministic Atlas adapters. A future permitted fixture comparison must score every requested field and missing-state distinction, not only successful navigation. Platform permission and access restrictions remain independent gates.

## Next experiment contract

Use existing permitted public snapshots, not new account access. Keep original bytes and unknown fields. Separate observed source facts, derived labels and unsupported values. Score exact identity, text, ordered media, author attribution and access/completeness states. Count wrong and missing fields, stale reuse, total work and durable writes. Preserve regressions and exclude results from other projects until tested against their actual implementation and requirements.
