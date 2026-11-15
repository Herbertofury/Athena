# Native CLI Unicode preservation

2026-11-15. Native integration regression, not a source-retirement verdict.

The Rust store emits JSON through `serde_json::to_string` and `println!` in `crates/athena-foundry-store/src/main.rs`. The Python bridge previously used locale-dependent `text=True` for both native and legacy CLI calls. A non-UTF-8 Windows locale can misdecode labels or fail encoding input. Both paths now explicitly use UTF-8 with strict errors. No replacement characters, automatic retries, migrations, permissions or database changes are introduced.

## Evidence and scope

- `before.txt`: five tests, four failures and one error on the prior bridge.
- `after.txt`: all five tests pass after the two-call-site change.
- Tests execute a real Python child emitting/echoing UTF-8 bytes. The subprocess wrapper models a cp1252 default only when the bridge omitted encoding; this is an explicit fixture, not a claim that this Linux machine runs a Windows locale or that a real Rust database was exercised locally.
- Native output and input preserve accented, Japanese and emoji labels. Legacy inspect/import preserve Unicode. ASCII remains supported. Invalid UTF-8 is rejected rather than replaced.
- Four core-runtime, six HTTP-framing and four rejection-drain tests also pass. All 317 root Node tests pass.
- Existing Windows/Linux native CI runs this test file alongside the real Rust/bridge tests. Hosted results must be verified separately.

No runtime assets, held manifests, old repositories or owner records changed. Owner-device acceptance and source retirement remain open.

## Hosted failure and correction

Initial head `d738c556` failed Windows job `132699846474` in run `43677202061`; Linux and learning passed. Explicit text-mode UTF-8 still decodes in a Windows subprocess reader thread. The invalid-byte regression raised there and left `stdout=None`, leading to `AttributeError` instead of the expected decoding error. This was not retried unchanged.

Corrected implementation transports bytes, encodes input as UTF-8, checks output byte length, and decodes stdout strictly on the calling thread. This preserves errors across platforms and does not decode unused stderr. Failure excerpt is retained in `windows-failure.txt`.
