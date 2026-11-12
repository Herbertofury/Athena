# SQLite recovery drill

A reusable **synthetic functional example**, added 2026-11-11. See [Recovery-first app foundations](../../docs/recovery-first-app-foundations.md) for the broader architecture and source review.

## Run without touching an existing database

From the engineering directory:

```sh
python3 -m unittest discover -s tests -p test_sqlite_recovery_drill.py -v
python3 experiments/sqlite-recovery-drill/recovery_drill.py /tmp/athena-new-recovery-demo
```

The demo output directory must not exist. The code creates only generated fixtures there, preserves the original database and backup, and writes a JSON receipt. Test directories are retained. Do not point this example at real application state or use its helpers as a production importer.

## What was actually tested

The [final reviewed run](recovery-tests-final.log) passed 20 test methods on Linux, Python 3.12.14 and SQLite 3.53.1. The [first 17-method run](recovery-tests-first.log) and [initial receipt](demo-initial-receipt.json) are retained; they did not cover owner-content and migrated-label completeness until independent review identified that gap. Migration rollback uses three explicit precommit fault boundaries within one method. The [demo receipt](demo-receipt.json) records backup validation and a version-1 to version-2 migration with identical item-payload and owner digests. The logical digest includes owners, all item columns and schema version; it changes across migration as intended.

- A deliberately naive copy of only the main file misses a WAL-committed record while still passing SQLite structural integrity. The database-aware copy includes it.
- A backup excludes an open uncommitted transaction. A controlled other-connection commit between incremental backup steps is included in a complete restarted copy.
- Existing destinations are refused. Cancellation leaves a separate last-good copy unchanged; expired work is rejected both before copying and between incremental steps.
- A migration preserves all records and updates schema/version together. Exceptions after DDL, after data changes and before commit roll back both schema and content.
- A child process exits through `os._exit` before or after commit. The observed result is respectively the original or committed schema, with full payload equality. This is process-exit behavior, not a hardware crash/power-loss simulation.
- Wrong application ID, future schema, repeated migration, unexpected table set, broken foreign keys and payload-ID mismatch are rejected. The latter two can pass structural integrity, demonstrating why application validation is distinct.
- A backup is restored into another new database and matches the original v1 payload. The migrated live fixture remains v2.

## Important limitations

The fixture uses WAL/FULL only to exercise its stated scenarios. This does not change or replace Athena's existing SQLite EXTRA connection contract. The code uses no custom SQL functions/extensions and never accepts user data through its normal CLI.

The callback deadline is cooperative, checked between SQLite backup steps, not a hard execution-time limit. Failed candidate files are retained and are not marked valid. Unique creation is a collision guard in a private fixture directory, not protection against hostile parent-directory or path substitution. Validation is intentionally specific to the generated two-table schema; it is not a complete arbitrary-database validator.

No atomic replacement of an active database, ACL validation, directory flush, adversarial path security, disk-full/IO-error injection, malicious SQL sandbox, actual application restore, Windows/macOS execution or performance claim is included. A valid reopen does not establish power-loss durability. A production implementation needs an independently tested platform boundary and the target's exact schema, workload and recovery policies.

## Sources

The guide/register contains the complete source observations. Relevant IDs: [AF26004], [AF26005], [AF26006], [AF26007], [AF26008], [AF26009], [AF26010], [AF26011]. These are primary documented behavior; the generated test log is separate measured component evidence.
