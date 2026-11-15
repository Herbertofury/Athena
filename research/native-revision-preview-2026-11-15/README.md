# Read-only native revision preview

Adds a user-usable CLI/native API capability for deciding whether to restore a retained Foundry snapshot, without applying it. Reuses validated current backup and authenticated revision reads within one read transaction, reports bounded structural paths only and returns current version for later conflict-aware decisions. No runtime assets/held restore code or source repositories changed.

Synthetic tests cover no-op and changed previews, current token equality, DB/history preservation, missing/corrupt IDs, deterministic escaped paths, atomic array differences and explicit depth/path/change-budget failures. Real rebuilt Rust CLI is exercised by the actual Python handler with in-memory transport; unauthorized/malformed requests never dispatch. This is not a browser control or owner-device acceptance. No source retirement or original pixel fidelity is claimed.
