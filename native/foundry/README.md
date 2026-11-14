# Native Foundry profile and integration tests

Build the repository store, then run the relocated tests:

```sh
cargo build --locked --manifest-path crates/athena-foundry-store/Cargo.toml
npm ci --ignore-scripts
npm run test:foundry-native
```

The bridge defaults to this repository's `dist` assets. Start it explicitly with `python3 native/foundry/bridge.py --binary <built-store> --database <selected-database>`. It is a local-only profile, not a public network service. No private database or machine configuration is bundled.

Tests use repository fixtures and OS temporary directories. `ATHENA_FOUNDRY_STORE_BINARY` may select an explicitly built store; otherwise they use `crates/athena-foundry-store/target/debug/athena-foundry-store` (with `.exe` on Windows). Node modules resolve from the repository package, not another checkout. Bridge HTTP tests require local loopback capability.

Historical-binary compatibility tests in the Rust crate are separately marked ignored and require the matching previous-version binary through their documented `ATHENA_FOUNDRY_OLD_*_BINARY` variable. Normal current-writer migration/read-only assertions remain active. Run each historical test explicitly with `cargo test --manifest-path crates/athena-foundry-store/Cargo.toml --test <suite> <historical-test> -- --ignored` after supplying that fixture binary. A normal test run does **not** establish those old-writer results; never substitute the current binary for the historical one.

## Optional historical compatibility inputs

| Test suite | Environment variable |
| --- | --- |
| `appearance` | `ATHENA_FOUNDRY_OLD_INSTANCES_BINARY` |
| `environment` | `ATHENA_FOUNDRY_OLD_SCOPES_BINARY` |
| `filters` | `ATHENA_FOUNDRY_OLD_APPEARANCE_BINARY` |
| `instances` | `ATHENA_FOUNDRY_OLD_TARGETS_BINARY` |
| `origins` | `ATHENA_FOUNDRY_OLD_FILTERS_BINARY` |
| `scopes` | `ATHENA_FOUNDRY_OLD_TRANSFORMS_BINARY` |
| `targets` | `ATHENA_FOUNDRY_OLD_ENVIRONMENT_BINARY` |
| `transforms` | `ATHENA_FOUNDRY_OLD_PRIVATE_OUTPUT_BINARY` |

These inputs are executables built from the matching historical source checkpoints, not the current store. They are deliberately not bundled. An omitted historical input is visible as an ignored test, not a compatibility pass. The historical cinematic cleanup reproduction is different: its small source-owned adapter fixture is retained byte-for-byte with a digest, and runs in the normal Node suite with an injected renderer.
