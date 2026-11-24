# Preserve whole srcset URLs before filtering public references

November 7, 2026. Follow-up to the empty-segment repair, based on draft PR #12 at
`05ce06e79bab9ba95b1b3242ffe673d0d6d1a57e`. Earlier PRs and failure receipts remain
unchanged. This is an offline extraction correctness/privacy repair, not a
performance result or adapter promotion.

Source-register IDs: [SRCSET01], [SRCSETWPT01], [SRCSETPYPI01], [SRCSETPYSCAN01],
[SRCSETPYPARSE01], [SRCSETPYLIC01], [SRCSETJSREL01], [SRCSETJSSRC01],
[SRCSETJSLIC01], [SRCSETPRETREL01], [SRCSETPRETSRC01], [SRCSETPRETLIC01].

## Failure and chosen boundary

Splitting an attribute at every comma manufactured extra references from commas
inside paths, query values, fragments, rejected credentials and opaque descriptor
text. Filtering each fragment afterward could expose a query suffix as a relative
path even though the original URL's query was removed. The
[baseline receipt](baseline.json) retains ten wrong projections in twelve
synthetic cases; seven expose an unmistakably synthetic marker in the public
receipt. No real credentials or sensitive URLs are published.

`srcset_url_tokens` now follows the URL and descriptor-boundary portions of the
[WHATWG algorithm](https://html.spec.whatwg.org/multipage/images.html#parse-a-srcset-attribute):
ASCII whitespace delimits a URL token; internal commas remain URL data; trailing
comma runs delimit candidates. Descriptor commas are ignored while in the
parenthesis state. This is not balanced nesting, and quotes/brackets/backslashes
do not create escape states. Whole tokens then pass through the existing
`public_url()` filter. The conservative whole-attribute rejection for unsafe
schemes remains unchanged.

The [candidate receipt](candidate.json) has zero incorrect projections and zero
synthetic-marker exposures in the same twelve cases. Selected HTML serialization
and literal text remain unchanged. Empty-segment recovery, surviving reference
order and duplicates remain supported.

**Descriptors deliberately remain opaque.** This preserves the existing URL-only
projection contract, including references attached to invalid descriptors. The
function does not certify browser-valid candidates, normalize density/width,
choose an image or load media. Raw tokens and original bodies still contain
unfiltered source data. Genuine URL paths or malformed author text can contain
private information; this is not universal secret detection or permission to
publish arbitrary source content.

## Upstream options investigated

All package comparisons below are source/metadata inspection, not package
execution, benchmark evidence or Atlas acceptance. No package was installed,
vendored or imported. License links are registered separately.

- **[Python srcset 0.2.0](https://pypi.org/project/srcset/0.2.0/)** is the strongest
  option for a future descriptor-validation task: dependency-free, MIT,
  Python >=3.10, Beta, released October 22, 2026. Its
  [private scanner](https://github.com/JaviLianes8/srcset/blob/cbfefc37831b2d826ba03986c86933c5995f06e7/src/srcset/_scan.py)
  has the relevant ASCII/state boundaries. The
  [public parser](https://github.com/JaviLianes8/srcset/blob/cbfefc37831b2d826ba03986c86933c5995f06e7/src/srcset/_parse.py)
  validates and drops invalid descriptors, changing today's projection contract.
  Importing a private scanner would be fragile. Its observed history is young;
  upstream WPT claims and release-artifact/source-byte equivalence were not
  independently accepted here.
- **[JavaScript srcset 5.0.3](https://github.com/sindresorhus/srcset/releases/tag/v5.0.3)**
  has observed 2026 maintenance and an MIT license. Its
  [inspected source](https://github.com/sindresorhus/srcset/blob/ba98493d7a940dc43be6089824fc60b870c94784/index.js)
  uses a loose regex and Unicode whitespace rather than the required ASCII
  boundaries; strict mode applies authoring checks. Adding an ESM runtime boundary
  to this Python lab would not solve the targeted contract cleanly.
- **[@prettier/parse-srcset 3.1.0](https://github.com/prettier/parse-srcset/releases/tag/v3.1.0)**
  is MIT-licensed; latest observed source remained from July 2023. Its
  [parser](https://github.com/prettier/parse-srcset/blob/c5594a45f587029b43d9b422dfc0bad6bfd2b175/index.js)
  throws on empty/all-invalid output and invalid descriptors, including raw input
  in the error. Direct adoption would conflict with body preservation and
  sanitized errors, in addition to the runtime boundary.

The chosen small Python tokenizer implements only the needed boundary behavior.
It does not copy upstream package code. All three options have no license fee;
version pinning, compatibility, dependency review and runtime integration are
still costs. If descriptor validity becomes required, evaluate Python srcset's
public API instead of extending this projection without a new contract.

## Verification and limits

- Twelve new regression tests cover comma-bearing paths/query/fragment/userinfo,
  separator ambiguity, trailing runs, ASCII versus non-ASCII whitespace,
  parentheses and non-escaping punctuation, opaque descriptors, unsafe schemes,
  selected-body preservation and actual WordPress public receipts. One thousand
  generated comma-query cases preserve the expected references without marker
  exposure.
- An independently written three-state boundary oracle matches all **105,987**
  generated inputs (55,987 exhaustive and 50,000 seeded random). Its
  [script](check_boundary_oracle.py) and [receipt](boundary-oracle-result.json)
  retain the exact source identity, seed, alphabets and input-stream hash. This
  checks raw token boundaries only, not descriptor validity, sanitization, URL
  resolution or browser conformance.
- Full local validation passes **341 Python tests and 320 JavaScript tests**,
  research/source-index checks, generated Explorer checks, card/media asset
  identity checks, the labeled synthetic example and `git diff --check`.
- The unchanged public WordPress response captured for PR #12 has the same
  complete-record hash before/after and retains all six source references. Its
  raw bytes stay outside Git; this pass replays that capture rather than claiming
  another live fetch.
- The pinned [WPT source](https://github.com/web-platform-tests/wpt/blob/f7dbbacc9cb1e9466504ca9dfec71646bab8ab5c/html/semantics/embedded-content/the-img-element/srcset/parse-a-srcset-attribute.html)
  supplies 236 cases. Only the **24 splitting-loop cases** are compared for raw
  token identity, all matching. The other **212 cases are unexamined**. This does
  not run WPT scripts, browser `currentSrc`, URL resolution, descriptor validity or
  source selection. Some raw tokenizer cases use data URLs; the public extractor
  still rejects such attributes under its existing policy.
- [Input provenance](input-provenance.json) records external source hashes. No raw
  upstream HTML or third-party body is committed. The
  [retained fixture correction](retained-fixture-correction.json) records an
  initial test setup error: lxml's setter rejected a raw vertical tab before the
  extractor ran. Using an HTML numeric reference tests the actual input path;
  production code was not changed to accommodate it.

No browser denial was retried. There is no native-browser, fresh Rust-server,
media-decode/playback, full-adapter or target-project performance acceptance.
Historical source snapshots and public fixtures remain untouched.

## Reproduction

From repository root with the lab's existing Python/lxml requirements:

```sh
python -m unittest discover -s tests -p 'test_srcset*.py' -v
python experiments/srcset-tokenization-lab/reproduce.py --ref 05ce06e79bab9ba95b1b3242ffe673d0d6d1a57e
python experiments/srcset-tokenization-lab/reproduce.py
python experiments/srcset-tokenization-lab/check_boundary_oracle.py --extractor experiments/site-extraction-lab/extractors.py --expected-extractor-sha256 f6b452284ba1b5ad754898d56be92ce62af1e3011de2f47056d6e9f473aa4723
```

Optional `--wordpress LOCAL_JSON` and `--wpt LOCAL_UPSTREAM_HTML` inputs must match
`input-provenance.json` for exact reproduction. No fetch is performed by the
script. `--output NEW_RECEIPT.json` saves sanitized results and refuses to
overwrite an existing file. A fresh capture is a different observation, not a
replacement for the retained evidence.
