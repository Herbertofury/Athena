# Athena Foundry store

Optional local SQLite storage for Athena's native Foundry workspace. See [native integration](../../docs/FOUNDRY-NATIVE.md) for the explicit bridge startup, versioning and retirement limitations.

Build with the pinned Rust toolchain:

```
cargo build --locked
cargo test --locked
cargo fmt -- --check
cargo clippy --locked --all-targets -- -D warnings
```

Commands operate only on explicitly supplied paths. `init` creates a new store; `status` inspects its schema. Schema upgrades are separate explicit commands. Never treat a successful synthetic test or authoring backup as proof that a complete original source database has migrated. Preserve original data and history. No provider calls, credentials or background service installation are part of this crate.

Current store schema: 12. Current authoring workspace JSON: 9. Exact-version validation and unknown-field rejection protect unsupported data from silent loss. Recovery is bounded to 50 entries and uses snapshot-based optimistic concurrency, not an unbounded source audit archive.
