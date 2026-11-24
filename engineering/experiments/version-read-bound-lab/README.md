# Bounded saved-version readback

October 29, 2026. Baseline: Atlas `8a1df7923c70c231023f78e3f52e0d6b2bccac28`.

Inventory found the project archive already guarded stored TEXT size before copying it into Rust, while saved-version readback copied the entire column before applying the parser's two-MiB limit. Saved versions also lacked the project reader's positive-generation check. These are malformed/local-database read boundaries; no exploited provider vulnerability is claimed.

The version reader now reuses the project reader's SQL CASE plus octet_length approach: stored values above four MiB in database encoding become a read error before TEXT is copied into Rust. Four MiB permits valid two-MiB UTF-8 payloads in UTF-16 databases; the original version parser still enforces its UTF-8 size and identity requirements. Zero or negative generations now fail explicitly. No schema migration, relaxed durability setting, truncated success or fallback to silently older data is introduced.

Two new regression tests fail baseline: the oversized record reaches the parser rather than the bounded storage-read error, and a valid-looking zero/negative-generation record is accepted. Both pass after repair. A third test creates a UTF-16 database, retains a valid payload whose stored encoding exceeds two MiB, reopens it and checks exact original UTF-8 text. The oversized rejection test verifies both malformed and prior good rows remain unchanged. Tests retain their generated databases for inspection.

The rebuilt application's real local HTTP queue/worker rejects generated oversized and zero-generation records before starting an experiment. Both jobs finish failed with a safe category, and hashes verify all snapshot rows unchanged. [Worker receipt](worker-receipt.json). No provider request or browser interaction is involved. This is a bounded-copy implementation guarantee from the SQL and regression tests, not measured process-peak memory, power-loss certification or another-project recommendation.

Reproduce with `cargo +1.99.1 test --manifest-path apps/atlas-lab/Cargo.toml --locked --offline version_read_boundary_regression` from the repository root. Full validation scope is recorded in [verification](verification.json). Baseline failures and raw local execution logs are retained privately; no user database or private payload is published.
