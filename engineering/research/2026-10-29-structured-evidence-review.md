# Structured evidence delivery: research candidate, not a complete collector

Reviewed 2026-10-29. Sources: TESSERA01, TESSERASOURCE01. Scope: primary paper and source inspection only; no third-party code, models or paid grading executed.

## Paper claim and tradeoff

[Tessera v1](https://arxiv.org/html/2610.37080v1), submitted October 27, separates retrieved chunks from the evidence delivered to a reader. It reconstructs small units with surrounding headings and table labels, then selects them within an existing reader budget. The authors report improved question-answering accuracy on their Wikipedia-based evaluation. This is not evidence of complete media extraction from arbitrary websites.

The paper's overall gains coexist with regressions: it reports 620 questions gained and 225 lost across 7,851 questions. A replacement unit can displace an answer-bearing chunk. Its 15 ms per-page processing figure is a component measurement, not total retrieval/reader latency. Atlas has not reproduced these results. Retaining the complete source independently is necessary for any future completeness-preserving experiment; ranking selected evidence is not a lossless archive.

## Inspected implementation

The [source at 4404de3c077f5f768c308dc866985ae89cfd67bf](https://github.com/sarendis56/Tessera/tree/4404de3c077f5f768c308dc866985ae89cfd67bf) includes table-grid expansion, section context and a test for multi-row headers. Inspection of units.py shows normalized text units, span caps and removal of selected elements. It does not establish preservation of all source-owned media, attachment URLs or authorship fields. These are static observations, not executed test results.

The repository's published setup requires substantial model/data resources and describes paid grading calls. No such downloads or calls were made. Its GitHub license metadata is null, no license file appears in the inspected recursive tree, and pyproject.toml declares no license. Public visibility is not a verified permission to copy or redistribute the implementation. Resolve reuse terms before adoption.

## Conditional ranking and next evidence

- Promising research lead: heading/table context for a secondary evidence view over an already retained, permitted source.
- Not accepted: replacing the canonical full-data adapter output or claiming universal extraction, live playback, lower end-to-end latency, or no-loss improvement.
- Required comparison: an existing Atlas adapter's complete output and a separately budgeted evidence view on authorized inputs, including captions, multi-row headers, nested tables, repeated labels and missing metadata. Count individual losses as well as aggregate gains. Keep raw-source retention and access state unchanged.

This stays in Atlas. No other project's wiki/TODO receives a recommendation without its own qualifying comparison.
