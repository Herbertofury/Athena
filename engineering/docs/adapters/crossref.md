# Crossref DOI research cards

[Offline experiment](../../experiments/crossref-work-lab/README.md) · [Dated research](../../research/2026-11-11-crossref-work.md) · [Actual public receipt](../../experiments/crossref-work-lab/public-validation-2026-11-11.json)

## Why a distinct adapter

Research cards need faithful author, title, abstract and source-status information. A bibliography record is not a downloaded paper. Publication dates, recent indexing and correction notices also answer different questions. The new offline gate builds on Athena's strict JSON and existing XML dependency without changing an application, shared parser, transport client or target project.

Crossref's [public REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) provides deposited scholarly metadata. Its contents include member assertions and information from other trusted sources. The parser can check internal identity consistency, but cannot prove that every source assertion is accurate or that a paper supports a proposed engineering decision.

## Required preservation boundaries

- Bind a supplied singleton response to the caller-selected DOI and the official request/final route. A title match is not sufficient identity evidence. Preserve source DOI strings and explicit normalization boundaries.
- Preserve all title variants and ordered contributor objects. Author, editor, affiliation, ORCID and authenticated-ORCID claims must not collapse into a single verified author identity.
- Preserve the exact abstract field and identify missing, null, empty, invalid and present separately. A missing field says nothing about whether the full paper exists or is accessible.
- Keep exact JATS, MathML and other source markup. A diagnostic text projection is neither a faithful renderer nor safe HTML. Entity expansion, DTD loading and network resolution have no place in this offline metadata operation.
- Retain published, issued, online and print dates separately from created, deposited and indexed metadata activity. Preserve year/month/day precision rather than filling missing components. Do not guess timestamp units from an outdated reference.

Crossref staff [describe markup pass-through and source inconsistencies](https://community.crossref.org/t/jats-elements-in-abstract-is-this-the-expected-behaviour/6069). The raw field remains the preservation authority even when a limited projection can read its text. Embedded math, images, links and unfamiliar namespaces need their own rendering and access checks.

## Updates, relationships and resource pointers

A notice's update-to and an original work's updated-by point in different directions. Keep the update type, target DOI, source, label and date. A correction link is not a blanket retraction label, and a notice is not itself the corrected article. The [update rules](https://www.crossref.org/documentation/register-maintain-records/maintaining-your-metadata/registering-updates/) and actual source pair establish this distinction.

General [relationships](https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/relationships/) retain their type, identifier type/value and asserted-by provenance. A relation asserted by another record is a source claim, not independently verified evidence of ownership, dependency or paper structure. Unknown relation types must stay available privately rather than being relabeled as citations.

Licenses retain their content-version, start date, delay and URL. Resource links retain content-version, intended application and MIME type. A PDF pointer or text-mining link is not a successful download, open-access proof or blanket reuse permission. Abstract copyright can differ from the ordinary metadata. This experiment never follows those pointers.

## Actual evidence

Three anonymous singleton API responses captured 76,436 bytes on November 11, 2026:

- Software citation principles: 15,425 response bytes, a 1,039-byte abstract, four contributor objects, four resource links, one license and four relations. Its publication is in 2016; indexing is in 2026.
- SciPy 1.0 original: 52,592 bytes, a 569-byte abstract, 112 contributor objects, three links, two licenses and an updated-by correction link.
- SciPy author correction: 8,419 bytes, a 118-byte abstract, 35 contributor objects, three links, two licenses and an update-to link back to the original. Its print date has only year/month precision, whereas its online date has a day.

The reciprocal pair is retained as two records, not a merged author list or one status. Original-source relation claims remain unverified, including object-asserted links that may look surprising. Raw responses and author details stay outside the repository; public evidence contains counts, hashes and state diagnostics.

## Access, alternatives and acceptance

The [access policy](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/) permits anonymous use. Requests here were sequential, bounded to one MiB and separated by at least one second. Headers reported the public-single pool, five requests per second and concurrency one. No email identity, key, account, grant, paid route, broad search or crawler was used. The normalizer performs no network operations.

The existing strict JSON helper and declared lxml dependency are reused. For future HTTP retrieval, [Crossref's client guidance](https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/) already lists crossref-commons; this experiment does not rebuild a client. A generic JSON card loses typed scope; a generic HTML stripper loses markup fidelity; publisher scraping adds an unrelated access and full-text problem. None is a substitute for the selected metadata contract.

This is not complete Crossref coverage, a bibliography resolver, a full-text reader, an access checker, a rights decision or a literature-quality ranking. Synthetic failure and malicious-input tests do not establish live restricted-access support. No target application recommendation follows without its actual baseline comparison and correctness, security and UX evidence.
