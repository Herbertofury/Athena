# Recover from empty srcset candidates without dropping the body

November 7, 2026. A bounded correctness fix in the offline site-extraction lab,
based on draft PR #11 at `13af2857af303ac54398a88ba965a966331e1e26`. Existing app
patches, fixtures and historical replay receipts are unchanged.

Source-register IDs: [SRCSET01], [SRCSETWP01].

## Problem and repair

The projection indexed the first whitespace-separated token in every comma
segment. An empty segment has no token, so leading/trailing/repeated commas,
delimiter-only strings and whitespace-only attributes raised `IndexError` and
prevented the surrounding selected body from being returned.

The repair skips segments whose whitespace split is empty. It keeps surviving
URL order and duplicates, the existing URL filter, whole-attribute rejection for
`data`/`javascript`/`blob` references, original selected HTML serialization, literal
text and other events. Missing or empty-string attributes remain omitted;
nonempty attributes containing only separators produce an empty projected list.

The [WHATWG algorithm](https://html.spec.whatwg.org/multipage/images.html#parse-a-srcset-attribute)
recovers around whitespace and comma separators; parse errors are not necessarily
fatal. This small guard is **not** an implementation of that complete algorithm.
Aborting the whole body for a blank segment was rejected because unrelated body
text/media remain useful. Fabricating a URL for a blank token was rejected.
Replacing the complete parser in this repair would require broader descriptor,
URL-token and source-selection work and separate evidence.

## Retained evidence

[Baseline](baseline.json) and [candidate](candidate.json) use the actual WordPress
extraction entry point and exact extractor source hashes:

- Six purely synthetic separator/whitespace cases failed with `IndexError` before
  the fix and now extract with expected body text and URL order.
- A synthetic healthy control is identical before and after.
- One freshly retrieved [public WordPress post](https://rre36.com/wp-json/wp/v2/posts/7402)
  is identical before and after, including its complete in-memory record hash.
- Three copies of that public body, deliberately mutated with leading, trailing
  and repeated separators, failed before and now retain its full literal text and
  all six projected candidate URLs. These faults were **not observed live**.

The [public input receipt](public-input.json) records the successful HTTP 200
capture, 15,465 bytes and SHA-256. It contains one `srcset` attribute with six
candidates and no empty candidates. The raw response/body stays outside Git.
Reproduction is offline; it does not retrieve images, accounts or private data.
Evidence publishes hashes/counts rather than prose or arbitrary projected URLs.
The [harness correction](harness-correction.json) retains an initial context error:
a preliminary real-post replay used a synthetic origin. Both final comparison
runs use the public post link; their unchanged-real-record hashes match.

Eight new regression tests cover separator recovery, omitted versus empty-list
semantics, selected HTML/text retention, `<picture>/<source>` plus fallback order,
existing reference restrictions, simple query/fragment filtering, protected-body
handling, scope flags, and 216 generated blank-segment combinations. These are
Python/lxml checks, not browser rendering or end-to-end adapter acceptance.

## Reproduction

Run from the repository root with the existing lab requirements installed:

```sh
python -m unittest discover -s tests -p test_srcset_empty_candidates.py -v
python experiments/srcset-empty-candidates-lab/reproduce.py --ref 13af2857af303ac54398a88ba965a966331e1e26
python experiments/srcset-empty-candidates-lab/reproduce.py
```

Add `--wordpress LOCAL_PUBLIC_POST_JSON` to replay the optional external response.
For exact historical reproduction its bytes must match `public-input.json`; a new
fetch is a new observation and may differ. Add `--output NEW_RECEIPT.json` to save
results. Existing output files are refused, and the source fixture is checked
unchanged. No fetch is performed by the reproduction script. The lxml dependency
is already part of the lab; no dependency was added for this repair.

## Important remaining limitation

The existing comma-split projection mishandles comma-bearing URLs and does not
validate descriptors. For example, a comma in a query value can create a separate
relative reference before the per-reference query filter runs. The underlying
comma-splitting behavior is unchanged. Recovery also returns results for inputs
that previously crashed, so newly recovered query-bearing input still requires
publication review. Do not infer full
srcset conformance, universal query-secret redaction, a safe download manifest,
image decoding, source selection or complete page coverage. The new public
receipts avoid publishing those arbitrary URL values. Review other receipts
before sharing them.

The historical October 28 actual replays were not rerun because their raw inputs
are not present in this worktree; they are not relabeled as current acceptance.
No Chromium retry, browser execution, Rust change, adapter promotion or other
project change occurs. Full repository CI is checked separately on the published
revision. This is a correctness repair, not a speed or memory claim.

Local validation passed: 329 Python tests, 320 JavaScript tests with no skips,
source-register/internal-link checks, generated Explorer verification, card/media
asset identity checks, the existing synthetic benchmark fixture and
`git diff --check`. That benchmark is an unrelated fixture sanity check, not an
improvement measurement for this guard.
