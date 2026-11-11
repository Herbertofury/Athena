# Text input and discovery contract lab

**Synthetic evidence only.** This small dependency-free lab demonstrates differences among text representations and tests a pure asynchronous-query ownership model. It does not patch Athena's search or input handling. See the [foundation guide](../../docs/unicode-search-and-text-input.md).

## Reproduce

From `engineering`:

```sh
node --test tests/text-input-contract.test.mjs
node experiments/text-input-contract-lab/demo.mjs
```

The demo reads its committed [invented fixture](fixture.json) and writes JSON to stdout. It never opens a browser, contacts a provider, changes a source record, writes to storage or records real user input. [Retained output](evidence/synthetic-report.json) includes runtime versions separately from the observations. Its tests compare complete semantic observations, not elapsed time.

The initial retained run used Linux x64, Node 24.22.1, V8 13.6.233.17-node.58, ICU 78.3, CLDR 48.0 and Unicode 17.0. The twelve pairs and eight text-unit examples are a bounded teaching corpus, not Unicode conformance data or complete language coverage. A runtime/version mismatch must be reported; this sample cannot prove compatibility with newly assigned Unicode characters.

## What the examples establish

- Precomposed and decomposed accent strings can share NFC while retaining different original code units.
- Fullwidth letters, a ligature, a circled numeral and a superscript yield four selected compatibility collisions under NFKC that do not occur under NFC.
- Default lowercasing does not equate the sharp-S example with its full uppercase expansion. Turkish lowercasing has different selected I mappings.
- Accent and cross-script distinctions in the selected pairs remain after normalization.
- The family emoji example has eleven UTF-16 units, seven code points and one grapheme segment in this runtime. That is not eleven or seven user-visible characters.
- The derived projection retains exact provider, ID and original title. It is an index projection only; the complete source record stays with the caller and must not be replaced by the projection.

These are local observations of standard-library primitives on synthetic text. They establish no search-quality improvement, security detection, rendering correctness, throughput or application performance benefit.

## Ownership model

`createQueryOwner()` manages one mounted field's in-process query tokens. Call its methods with complete value observations. `input()` returns a frozen token when work should begin; `compositionStart()` invalidates old publication; `compositionEnd()` supplies the final value; `complete(token)` permits only the current token once. `retry()` is explicit and cannot invent a query before one was submitted. `dispose()` permanently retires the owner.

Tokens use object identity. A copied/deserialized token is intentionally rejected. The caller can retain the original in the async callback closure; this is not an RPC protocol, unforgeable authority or authentication mechanism. A completion check must happen immediately before the caller publishes its result, with no intervening asynchronous boundary. The model does not execute cancellation, fetching, debouncing or UI publication. It has no network side effects.

The contract deliberately suppresses committed-query work during composition and coalesces identical raw-value observations. It reissues when a final value differs, even if the strings are canonically equivalent. A cancelled composition returning to an earlier query reissues a fresh generation because the earlier one was invalidated. Failures and last-good displayed results belong to the app's separate result-state model. Search changes that promise side effects need a different retry/commit contract.

Synthetic calls test ordering choices; they do not emulate an operating-system IME. Real adapters must handle target-specific composition/blur behavior, paste, dictation, value replacement, selection, undo, disposal and trusted-input sequences. Do not call the model's passing tests browser support.

## Bounds and unavailable capabilities

Inputs must be strings of at most 65,536 UTF-16 units with paired surrogates. This is an experimental resource/well-formedness bound, not a provider naming rule or a user-facing character limit. The helper refuses malformed strings rather than silently replacing code units. It does not validate URLs, paths or provider IDs.

`textUnits()` labels absent `Intl.Segmenter` as unsupported and setup/segmentation failure as error. Neither state returns a substitute grapheme count. The normalizer is not a confusable detector, HTML sanitizer or full case folder. No production recommendation follows until the actual target passes the [unrun acceptance receipt](../../templates/text-input-acceptance.json).
