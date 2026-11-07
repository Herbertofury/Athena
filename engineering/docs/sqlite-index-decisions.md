# SQLite indexing: best for the query, not every workload

**Reviewed October 26, 2026.** A measured local experiment demonstrates both a large selective-read gain and substantial index costs. This is not an application or durability benchmark.

## Ranked decisions

| Workload | Evaluate first | Alternative | Avoid |
|---|---|---|---|
| Frequent selective filters with matching sort/projection | **A query-shaped composite/covering index**, after plan and result checks | Narrower index if storage/write cost matters more | Indexing every column indiscriminately |
| Full-table retrieval | **Existing table/primary-key access and measured plan** | Specialized layouts only after profiling | Assuming an unrelated secondary index speeds every read |
| Write-heavy or rarely queried data | **Minimal justified indexes** | Add a targeted index when total workload wins | Ignoring update cost and index footprint |
| Changing distributions | **Version-appropriate planner-statistics maintenance with regression checks** | Stable controlled statistics where reproducibility is required | Assuming ANALYZE or PRAGMA optimize always improves every query |
| Recovery-sensitive persistence | **Retain the required durability/concurrency contract** | Separately reviewed storage redesign | Disabling durability to win a benchmark |

## What the official sources establish

SQLite's query-plan output identifies scans, searches, index use and temporary sorting, but its documentation warns that the textual format is not a stable application API. Retain it as diagnostic evidence rather than building production logic around string matching. [DB03](https://sqlite.org/eqp.html)

The ANALYZE documentation recommends PRAGMA optimize for current supported versions and explains that statistics can alter plans; it explicitly does not guarantee every query becomes faster. Review the actual linked SQLite version and query distribution. This experiment uses explicit ANALYZE during setup to establish both plans; it does not benchmark optimize itself. [DB04](https://sqlite.org/lang_analyze.html)

## Local experiment

Two separate in-memory databases contain identical 100,000 generated records under SQLite 3.53.1. The candidate adds one covering index matching a filter/sort/projection; the baseline retains the primary-key table without that secondary index. The same parameterized query fetches **all matching rows, with no LIMIT**, and every paired result is compared.

The [retained results](../experiments/sqlite-index-lab/README.md) include selective reads, complete table reads, 1,000-row updates, index-build time and allocated database-page bytes. Update measurements end before commit and are rolled back; both updated state and restored state are compared exactly. They do not establish disk durability or transaction-commit latency.

The selective query benefits strongly. Full-table timings do not show a reliable meaningful gain, while the index increases allocated pages and makes the tested updates slower. Earlier and final runs show the same qualitative tradeoff but different absolute timings, reinforcing the shared-host/no-isolation limitation.

## Acceptance questions

1. Does the exact query use the intended index under representative data and bound parameters?
2. Are collation, NULL behavior, duplicate handling, order and every required result unchanged?
3. Does read-frequency benefit outweigh index creation, write maintenance and footprint for this workload?
4. What happens after large imports, deletes, schema changes and distribution shifts?
5. Are concurrent readers/writers, interruption, recovery and actual disk behavior tested separately?
6. Does end-to-end user latency improve, including conversion, IPC and rendering?

Do not add this example index verbatim to an unrelated schema. Do not infer a production speedup from an in-memory selective-query result, or treat database page allocation as process peak RSS. The method is to inspect and measure a targeted plan, not to collect indexes as a universal best practice.
