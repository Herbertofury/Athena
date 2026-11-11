# Crossref DOI-card evidence: November 11, 2026

## Decision and hypothesis

The inspected Athena integration snapshot had reusable JSON/XML foundations but no Crossref singleton normalizer. Add a separate offline experiment to preserve DOI identity, abstracts, typed dates, update direction and source pointers. This addresses research-card mistakes rather than copying the package or media adapters.

Hypothesis: source-preserving typed metadata can prevent an old paper being presented as newly published, a correction notice being confused with its original, or an abstract/resource link being called retrieved full text. No claim about research quality, application performance or target adoption is made.

## Sources and currency

CRF11001–CRF11006 record current official REST, access, date, update, relationship and staff markup guidance. CRF11007 pins historical format guidance at CrossRef/rest-api-doc commit 00b1cc2c90e62d49c82f5381710590a6d9ca53ff, dated September 25, 2024. That repository declares its documentation deprecated. Its required-field list and timestamp-unit wording are not promoted to current guarantees. CRF11008–CRF11010 record the three actual API responses with byte counts and hashes.

The public source register links each source. Current documentation and captured records jointly constrain this experiment. No publisher abstract or article text is copied into committed fixtures. The original response bytes remain private for reproduction.

## Observed engineering-source comparison

The software-citation record's 2016 publication and 2026 index activity demonstrate why one generic date field is misleading. Its abstract contains JATS markup and its relations distinguish reviews from a preprint. The SciPy original and correction expose reciprocal updated-by/update-to directions, both explicitly typed correction. Their contributor counts differ, so silently merging the two would change attribution. The correction print date is only a month; inventing a day would add unsupported precision.

The three responses total 76,436 bytes and contain abstracts of 1,039, 569 and 118 bytes. They expose resource and license metadata but no fetched full text. All author objects, raw markup, field states and assertions stay retained privately. The implementation's public receipt contains restricted structural evidence rather than source prose or identities.

Some object-asserted relation entries on the original may look unexpected. This is a reason to preserve assertion provenance, not to rewrite the record or report an unverified error to a third party. The parser does not follow, endorse or independently validate those relationship targets.

## Boundaries, failures and alternatives

A publisher-page documentation lookup redirected to an unavailable authentication endpoint. It was not retried or accessed by another publisher route. The Crossref captures are distinct public metadata API responses and were completed independently; no paper, resource link or protected page was downloaded. Two example XML documentation pages were unavailable to the research reader because of content-type support; no workaround was attempted.

Source projection remains incomplete, even when the abstract can be parsed. Preserve raw text and explicit failure states for malformed XML, unsupported markup or defensive limits. Real metadata captures are not live access-denial or rate-limit tests; those boundaries are tested with labeled synthetic cases only.

Existing Crossref clients remain the baseline for future authorized transport. A new resolver, scraping pipeline or full-text downloader would enlarge this experiment without solving the observed scope problem. No registry-wide completeness, source-authenticity, license permission or target compatibility follows from these three records.

## Reproduction and adoption

[The lab](../experiments/crossref-work-lab/README.md) documents the supplied-capture API, bounds and commands. [The public receipt](../experiments/crossref-work-lab/public-validation-2026-11-11.json) binds the actual replay to implementation hashes. Keep local checks separate from hosted CI and the existing integration's release blockers. A target application still needs a comparison against its real implementation before adopting this research.

## Recorded local checks and retained review findings

The final contribution passed 17 synthetic module tests and three stored-public-receipt tests, plus seven independent grouped adversarial and actual-capture tests. Full local suites passed 999 engineering Python tests and 420 Node tests. Root build/tests, five engineering generators and two root generated-artifact checks passed. The source validator covers 2,424 sources and 289 Markdown files; 135 pre-existing stale-source flags remain visible.

Inspection required reserved transport-error handling even with HTTP 200, typed status/completeness evidence in the public receipt, and isolation of unexpected optional-projection errors. Regression tests cover those corrections. An independent review test initially compared nested author objects with an incomplete freeze transformation; correcting that test to compare the complete original JSON made it pass without changing the module. The failed review result and its correction remain recorded, rather than being reported as an implementation fix.

These results establish local bounded parsing and source preservation only. Hosted CI, browser/Rust release acceptance and the base integration's existing failed browser workflow remain separate. No workflow rerun, target integration, merge or deployment was performed.
