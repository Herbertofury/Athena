# Local validation 2026-11-14

- Exact SQL schema executed through Python sqlite3: passed.
- Reviewed catalog seeds 17 themes, 34 rooms, 85 objects: passed.
- Invalid cross-theme/room soundtrack rejected by composite foreign key: passed.
- SQLite integrity_check: ok.
- Rust 1.99.1 obtained from official static.rust-lang.org into isolated temporary toolchain; no shell profile or system configuration modified.
- Cargo.lock generated using official registry dependencies.
- cargo test: 9 tests passed, zero failed. Covers reopen, durable Unicode, relationship rollback, URL validation, existing-file protection, future schema preservation, catalog rejection, write-failure last-good retention, and YouTube public query IDs.
- cargo fmt --check: passed.
- cargo clippy --locked --all-targets -- -D warnings: passed.
- Real CLI init created fresh fixture database, returned exact catalog counts/integrity; separate assign process saved public YouTube bookmark; separate read process returned exact fields. Evidence logs retained.
- Initial compiler absence recovered via isolated official install; build output used a separate workspace directory because temporary disk free space was limited.
- No UI/native desktop integration, Windows execution, power-loss test or legacy importer tested or claimed.
- No remote publication performed.
