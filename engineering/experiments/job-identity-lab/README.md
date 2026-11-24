# Keep distinct queue jobs visible

October 30, 2026. An actual Atlas renderer bug collapsed distinct queue cards after large SQLite IDs passed through JavaScript JSON decoding. This is a correctness repair, not a cache or performance claim.

## Reproduction

The retained baseline executable served six fixture jobs, including generated IDs `9007199254740992`, `9007199254740993` and `9223372036854775807`. Its HTTP response retained the original numeric tokens. JavaScript decoding merged the first two into one Number, and the keyed renderer reused one card for both. The maximum ID's displayed label was also rounded.

The [ECMAScript safe-integer definition](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.max_safe_integer) explains this representation boundary; source JSJOBID30. The failure was measured in the actual app, not inferred solely from that specification.

[Baseline receipt](baseline-receipt.json) shows six jobs but five cards and incorrect large-ID labels. The probe loads the real served app and input module, reads the real loopback overview, and executes that renderer in a controlled DOM. Three focused Node assertions also failed before repair. Original sources, binary, responses, failure logs and databases remain retained locally.

## Implementation

Both normal and isolated overview serializers now add `id_text`, a canonical decimal string derived directly from the SQLite ID. The legacy numeric `id` field and all other output fields remain unchanged. Numeric wire tokens remain exact, but consumers using floating-point Numbers must use the text identity for full-range keys and labels.

The UI validates exact identities and checks for duplicates before changing any cards or counts. It keys and labels cards by the validated string. Invalid/repeated identities retain previous results rather than partially updating the view. Safe legacy numeric IDs still work, while unsafe legacy-only IDs fail explicitly. Existing keyed nodes are reused when an old safe-ID response later gains the exact field.

The database schema, IDs, worker queue and stored results are not rewritten. The isolated serializer remains isolated; this shared correctness repair is not a performance promotion.

## Verification and boundaries

[Normal repaired receipt](repaired-receipt.json) and [isolated serializer receipt](candidate-receipt.json) both retain six cards in the correct order with every exact ID. The server's reported strategy and served-source hashes are checked. All legacy fields and complete results match the baseline; both repaired serializers return equivalent complete structured output. Databases and original source fixtures are unchanged, and integrity checks pass.

[Regression summary](verification.json): 134 Rust unit tests, nine integration tests, all-target Clippy, 262 Node tests and 237 Python tests both normally and optimized. The final HTTP runners also passed under optimization. Public receipts omit unrelated rendered result text; full raw responses and renderer output remain local.

Run `verify_http.py` with an inactive public-fixture database, a known locally built binary and a fresh output directory. Use `--expect-correct` for the repaired binary and optionally `--mode serve-candidate`. The script copies data, adds generated terminal high-ID jobs and performs only local reads. Do not use these boundary-test databases as working queues. A test reaching SQLite's maximum ID is not evidence of normal workload frequency.

Controlled DOM cardinality is not native browser paint, visual density, keyboard/scroll latency or peak memory acceptance. Those browser gates remain open. No other project's implementation or recommendation changes.
