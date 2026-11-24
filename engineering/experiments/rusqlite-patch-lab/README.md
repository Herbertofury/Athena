# rusqlite 0.41.1: isolated application regression

Reviewed October 29, 2026. The working Atlas app remains pinned to 0.41.0. This is a compatibility and behavior screen, not a speed ranking or an accepted upgrade.

## Official changes and applicability

The [October 28 release](https://github.com/rusqlite/rusqlite/releases/tag/v0.41.1) describes SQLCipher PRAGMA handling and a zero-argument deterministic scalar-function panic repair. The [pinned source comparison](https://github.com/rusqlite/rusqlite/compare/a60e76b5e86ee60442213efe79758a6c2ca8cf3d...18ee76dbb976d5ef7e37ad5a8fffae678ca21a78) also shows default PRAGMA validation becoming conditional on `extra_check`, and shared zero-length slice handling. Do not reduce the entire patch to its two release-note bullets.

Atlas's resolved features do not enable SQLCipher, custom functions or `extra_check`. Existing app code uses fixed PRAGMA names and explicitly reads back its synchronization, foreign-key and journal requirements. The advertised function case is therefore not an observed Atlas failure. [SQLite's official history](https://sqlite.org/changes.html) still lists 3.54.1, dated October 16, as the newest release at this check. Sources: RSQLPATCH29, RSQLDIFF29, SQLHIST29.

## Actual target checks

A separate copy of Atlas commit `10d5fa6f919b2ec16de48e3ed28e621e05ef158d` changed only the dependency pin and lock entry. All 46 application source/UI/test/example files matched the baseline byte-for-byte. Cargo downloaded the official registry package; its SHA-256 matched the lock checksum. No other locked package changed.

The candidate passed 132 Rust unit tests, nine integration tests, 24 tests across eight example suites, and all-target Clippy with warnings denied. The new concurrent snapshot test includes both DELETE and WAL, all original bytes, failed refreshes and attempt pairing. Full output is retained in [application tests](candidate-tests.log), [example tests](candidate-examples.log) and [static checks](candidate-clippy.log); workspace prefixes are redacted in these public copies. Original logs remain retained locally.

## Confirmed behavior difference

An independently written [probe](pragma-probe.rs), with otherwise equal dependencies, returned:

| Case | 0.41.0 | 0.41.1 default | 0.41.1 plus extra_check |
|---|---|---|---|
| Unknown but identifier-shaped PRAGMA rejected | Yes | No | Yes |
| Malformed PRAGMA name rejected | Yes | Yes | Yes |
| Empty text/blob and maximum i64 retained exactly | Yes | Yes | Yes |

The default candidate accepts the unknown PRAGMA call without error; that does not establish that SQLite changed a setting. This is a generated API behavior observation, not an SQL-injection finding. The optional-feature probe is not a decision to change Atlas's feature set.

[Results, identities and probe output](results.json) retain the distinction. To reproduce the three small probes, use the corresponding `Cargo-*.toml` as a fresh crate's `Cargo.toml` and `pragma-probe.rs` as `src/main.rs`; then run with Rust 1.99.1. For the actual app comparison, copy the Atlas revision, change only `=0.41.0` to `=0.41.1`, resolve that package, verify the lock diff, and run the existing CI commands. Do not modify a working database.

## Decision and remaining gates

Keep 0.41.1 isolated. Current Linux correctness checks pass, but no actual workload improvement has been demonstrated. Candidate Windows execution, comparative latency/memory, production deployment and hardware fault recovery were not tested. The baseline's green Windows CI must not be attributed to the candidate. Resource use was bounded to two Cargo build jobs and command timeouts; further builds were deferred after retained artifacts reduced free workspace disk to roughly 3.5 GiB. Nothing was deleted to make the candidate fit.
