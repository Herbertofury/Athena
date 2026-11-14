# Keep your Media filter while changing event views

The unified Media workspace previously navigated to `#media?event_view=bounded` or `baseline` without its shared search query. The Athena shell treats a route without `q` as an empty query. On published baseline `b1f82a9f1ac516848f6c95d4b9b87801e6090589`, choosing an event view while filtering for Steam changed one visible card into all five retained cards.

The generated adapter now encodes both `event_view` and the exact current `q` with `URLSearchParams`. Explicit empty queries stay empty. Unicode, `&`, `#`, `?` and `+` round-trip as text. Source metadata, player code, autoplay policy and prior receipts are unchanged.

## Verification

[Raw local evidence](evidence.json) retains baseline failures and final command output. Four new DOM cases fail against the original adapter and pass after correction. The empty-query baseline failure concerns the explicit route contract, not a visible card-count regression. Final checks pass: 138 root JavaScript tests, 105 standalone Media tests and 313 Python tests. The reviewed 37-file runtime package builds with exact allowlist hashes. Independent review also passed 34 focused/harness/workspace/lifecycle tests.

The existing browser lane now checks actual shell navigation, both renderer modes, Back/Forward, visible card identity, query retention and no loaded provider media. Native browser execution has not been run locally; no denied browser operation was retried. The older, unrelated accessibility gate remains unchanged, so later Rust/deployment stages must not be called passed unless they actually run.

This is a narrow correctness repair, not a performance or playback claim. The original standalone media source, source repository, learning-progress candidate, pending preservation tree and Foundry work remain untouched.
