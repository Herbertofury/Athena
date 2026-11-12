# Bounded query foundations: 2026-11-11 follow-up

## Gap and scope

After the recovery-first contribution, reviewed the open Athena drafts and existing worker, transport, queue and database experiments. There was no executable authorizer/progress-limit reference. Rather than duplicate the broad technology catalog, this adds a [trusted-schema read-query policy lab](../experiments/sqlite-query-boundary-lab/README.md) with complete-result and adversarial-input gates.

The actual runtime and other drafts remain unchanged. The reference is original Python/SQLite fixture code with no CLI, user-data discovery or production route. It is explicitly not a malicious-database interpreter, OS sandbox, hard deadline or memory-isolation boundary.

## Useful findings

- A read-only connection alone is not a complete operation policy. The reference combines read-only/query-only mode, verified engine configuration, per-connection limits, a deny-default authorizer and a fresh connection lifecycle.
- Positive queries matter. The first policy's strict database-name check rejected valid SQLite 3.53.1 count/rowid reads because an empty-column callback supplied `database=None`. The narrow correction permits only that known catalog case, while private-table counts, constant-only reads, rowids and schema counts remain denied.
- Query interruption, row limits and encoded output-byte limits are distinct. An exhausted result budget must not turn the partial rows into a successful complete response.
- Exact wire-byte accounting differs from character counts and process memory. Tests now cover Unicode, escape sequences and BLOB encoding at exact limits.
- Generated-column authorization timing makes arbitrary untrusted schema support a separate security problem. The current lab does not claim to solve it.

Primary documented sources: [AF26016], [AF26017], [AF26018], [AF26019], [AF26020], plus the earlier defensive guidance [AF26011]. URLs, review dates and version applicability are in the [additive register](../data/sources.d/recovery-first-app-foundations-20261111.json).

## Measured evidence

All 32 focused methods pass on Linux/Python 3.12.14/SQLite 3.53.1. They cover allowed results and forbidden operations, source-file immutability after each test, deadlines/cancellation during execution, the specifically observed nullable-authorizer case and exact result-boundary failures. [Final log and scope](../experiments/sqlite-query-boundary-lab/README.md).

Independent review replayed the suite and found no substantive blocker within this scope. Its suggestions to preserve private-table empty-column probes and Unicode/BLOB boundary probes became tests. The first 27-method/five-error log remains retained; no failing test or security gate was removed.

The complete engineering Python suite now runs 378 methods: 377 pass and the same unchanged main link-check error remains. The pristine-main failure, checked separately, is documented in the [earlier recovery research note](2026-11-11-recovery-first-foundations.md). Explorer/card/media generated checks and 303 JavaScript tests pass. No new hosted CI configuration is introduced; exact remote status is recorded on draft #28.

## Adoption gates

Before using the pattern in a real app, declare the schema and query catalog, required positive functionality, output completeness, account/data isolation, callback ownership and runtime patch policy. If requirements include arbitrary hostile SQLite files, persistent shared connections, custom functions or enforceable CPU/RSS budgets, choose and test an appropriate process/security boundary rather than widening this lab's claims.
