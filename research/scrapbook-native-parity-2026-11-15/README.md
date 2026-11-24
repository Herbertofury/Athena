# Scrapbook native semantic acceptance

2026-11-15. Base `676fef75591885811bfa2c59bc767c6f82febba2`. Synthetic, public fixtures only. This pass does not include the pending revision-preview change or any held runtime/export/restore changes.

## Executed path

The maintained `tools/foundry-recovery/scrapbook/test_native_parity_cli.py` generates an explicit reviewed mapping for every current catalog room (34), invokes the actual converter subprocess, saves the resulting workspace into a fresh schema-15 SQLite store through the rebuilt Rust CLI, and reads it through the actual bridge handler and CLI twice with fresh bridge instances. Transport is in-memory, not a browser or listening socket.

Each room has two synthetic placements covering UI and scene-pinned sticker scopes, stable instance IDs, lock/visibility, signed scale, rotation, skew, opacity, z-order, noncentral transform origin, brightness/contrast/saturation/hue and a reviewed multiply blend. Exact parsed JSON equality checks all emitted fields, including layouts, environment and view. The test checks stable version tokens, unchanged database bytes during reads, and unchanged source/mapping/bundle bytes. An unmapped object is rejected by the native save path and leaves the previously saved database and workspace unchanged.

The existing CI already discovers this filename on both Windows and Linux after building the current Rust binary; no workflow permissions or runtime assets changed. The binary is required: missing builds fail rather than silently skipping this acceptance gate.

## Local results and retained failure

- Rebuilt the native binary from the exact base above, not the held revision-preview branch.
- All 28 Scrapbook tests pass, including this new all-room acceptance test.
- An initial full-suite invocation omitted the older tests' required `ATHENA_NATIVE_BIN` environment variable: 14 discovered tests ran with one import/setup error. No product failure was inferred. The corrected invocation supplies that variable plus `ATHENA_CATALOG`, `ATHENA_LAYOUT_MODEL` and the new test's `ATHENA_FOUNDRY_STORE_BINARY`; retained result summary is adjacent.
- No implementation defect was found by this test. This adds an automated native migration gate rather than claiming a new converter capability.

## Limits

These declared mapping reviews are synthetic test assertions, not reviews of an owner's real assets or geometry. No original private data, provider request, browser rendering, image decoding, visual fidelity, actual restart of the whole desktop application, owner-device acceptance or source retirement is established. Physics and nonzero blur remain unsupported by the converter. Source repositories are untouched; migration remains incomplete.
