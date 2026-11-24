# Verified SQLite connection contract

Implemented and tested 2026-10-28 in the actual Atlas application, not a database replacement. Source [DB06](https://www.sqlite.org/pragma.html#pragma_synchronous) distinguishes DELETE/FULL from DELETE/EXTRA: FULL may lose the last acknowledged transaction after a closely following power failure on some filesystems; EXTRA additionally synchronizes the directory after journal removal. No physical failure was reproduced here.

## Failure and real implementation

The snapshot store, queue and experiment journal previously requested FULL and did not read back their connection requirements. Three regression tests fail on that baseline with observed 2 versus required 3. This establishes a configuration-contract mismatch, not observed data corruption or a simulated power-loss test. [Retained failure](baseline-failure.log).

A shared `storage_connection::configure` now applies the existing busy timeout, enables foreign keys and requests EXTRA, then reads back synchronization, foreign keys and journal mode. It fails closed if requirements are absent or the mode is unsafe. It refuses configuration inside an active transaction. Existing DELETE/TRUNCATE/PERSIST/WAL modes are not silently converted. MEMORY is accepted only for a explicitly ephemeral empty-path temporary/in-memory database, not a disk database or an unrecognized path. OFF is rejected.

The original storage benchmark still explicitly uses DELETE/FULL, preserving its historical experiment. This change is a correctness contract, not a claim that setting EXTRA improves throughput. The separate [ordered KV comparison](../ordered-kv-lab/README.md) is not used as target-project performance acceptance.

## Verification

- All three actual stores pass their connection regression.
- Shared-helper tests reject FULL, foreign-keys OFF, journal OFF, active-transaction configuration and on-disk MEMORY. These are deliberately configured local faults.
- Existing disk data survives reopening in both DELETE and WAL; the journal mode is unchanged. This is byte/readback evidence, not a physical durability test.
- [108 Rust unit and eight integration tests](rust-tests.log), [strict Clippy](clippy.log).
- [55 actual loopback HTTP checks](http-receipt.json), reusing the existing gate-policy runner and a copied retained public-source database: complete saved-version experiment, generated cancellation, prior journal preservation, unchanged snapshots, request security gates and SQLite integrity all pass.

No schema migration, payload reduction, journal-mode conversion, external provider grant or other-project change. Public HTTP receipts contain test metadata and measurements, not credentials or private account data. Rollback source copies and all databases remain retained. Reopening, SQLite integrity checks and configured synchronization do not certify hardware power-loss survival, filesystem guarantees or performance parity under every workload. Existing CI covers the actual application changes on Linux and Windows; exact publication outcome is verified separately.
