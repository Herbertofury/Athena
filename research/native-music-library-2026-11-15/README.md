# Native cross-room soundtrack library

2026-11-15: implements library retrieval in the real Rust store, CLI and existing Python bridge, beyond conversion tooling. Reuses validated metadata reads and version tokens inside one SQLite read transaction. All-or-error1000-record bound and deterministic ordering; existing byte/time/authentication boundaries retained. Source MusicHub mappings motivate whole-library access; no provider/library synchronization equivalence is claimed.

Tests cover schema2 refusal/schema4 compatibility, empty and sorted metadata, equality with per-room versioned reads, close/reopen, exact DB byte preservation, corruption refusal and oversized no-partial behavior. The existing real34-room/schema15 migration acceptance now also compares the complete bridge library (including Unicode, six provider families and milliseconds) to every imported record, twice across fresh bridge objects. Three handler tests cover allowed read dispatch, missing header/foreign origin/query rejection and old-schema/error states.

All fixtures are synthetic. No source repository, held runtime manifest, private data or provider was touched. Backend capability is implemented; a new library UI and real-owner migration/retirement remain unverified. Local testing uses current Rust source, not a historical executable. Hosted Windows/Linux and final merge evidence are separate gates.
