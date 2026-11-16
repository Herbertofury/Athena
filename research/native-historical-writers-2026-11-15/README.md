# Native historical-writer acceptance

Eight previously unexecuted optional compatibility tests now have **Linux local**
results using eight separately rebuilt retained source checkpoints, not the current
binary masquerading as an older writer. [Receipt](receipt.json) records each source
file hash, rebuilt executable hash, exact test name, raw log digest and result.
All eight passed; original checkpoint source bytes remained unchanged.

| Historical checkpoint | Maximum supported schema | Current test suite | Upgraded schema |
|---|---:|---|---:|
| private-output | 4 | transforms | 5 |
| transforms | 5 | scopes | 6 |
| scopes | 6 | environment | 7 |
| environment | 7 | targets | 8 |
| targets | 8 | instances | 9 |
| instances | 9 | appearance | 10 |
| appearance | 10 | filters | 11 |
| filters | 11 | origins | 12 |

The current tests exercise native migration/round trips, actual reported schema
and older-writer refusal with exact database-byte preservation. They do not test
owner data, every legacy format or Windows historical compatibility. They do not
certify migration completeness or source deletion readiness.

## Provenance and reproduction

The historical inputs are retained local source checkpoints predating Athena's
consolidated native-store import. Their maximum supported schema was inspected in
`Store::open`; exact source inventories are in the receipt. They are **not** claimed
to be verified Git releases or originally distributed executable artifacts. Source
checkpoint availability is still a prerequisite to reproduce these specific results.
No binary, private database, filesystem location or source asset is published here.

For each matching checkpoint, verify every listed file SHA-256, copy only the listed
source files into a disposable build directory, and build with Rust1.99.1 using
`cargo build --offline --locked`. Historical builds used
`CARGO_PROFILE_DEV_DEBUG=0`. Set `CARGO_TARGET_DIR` to a dedicated historical target,
not the current store's target. Record the resulting executable SHA-256, then supply
it through the matching environment variable in the native README and run:

```sh
cargo test --offline --locked --manifest-path crates/athena-foundry-store/Cargo.toml --test SUITE -- --ignored --nocapture
```

Build current tests in a **different** Cargo target. Rehash the original source
checkpoints after testing. Retain full build/test logs and failures. Do not replace
a missing checkpoint with the current binary or remove ignored markers to imply
coverage without the required fixture.

## Retained failed attempt

The first attempt reused one Cargo target for both same-name crates. The historical
build succeeded, but current `transforms` test compilation reused older library
artifacts and failed with missing `migrate_transforms` methods. No compatibility
result was claimed. Separate targets and a clean rebuild of only the worker-owned
crate outputs resolved that harness fault. The failure log digest is retained in
the receipt alongside all eight successful independent reruns.

Normal Windows/Linux CI still reports the optional historical tests as ignored.
This receipt adds genuinely executed local evidence; it does not relabel skipped
hosted checks as passed. A portable, provenance-reviewed historical fixture supply
is still needed before those checks can become unconditional CI gates.
