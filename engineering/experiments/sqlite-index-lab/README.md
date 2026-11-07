# Measured SQLite index tradeoffs

October 26, 2026. CPython 3.12.14 and SQLite 3.53.1 on Linux x86_64. Two independent in-memory databases, identical 100,000 generated records, same table and primary key. One candidate adds a covering composite index on scope, kind, active, name, id and version. Both run ANALYZE during setup. No durability setting is weakened; the report records the actual pragmas. This is not an on-disk durability or concurrent-writer experiment.

## Final-run medians

| Operation | Pairs | Baseline ms | Indexed ms | Baseline / indexed |
|---|---:|---:|---:|---:|
| filtered_complete | 21 | 6.066409 | 0.161945 | 37.46× |
| full_complete | 9 | 121.374657 | 116.434770 | 1.04× |
| update_1000_precommit | 9 | 3.697563 | 10.645574 | 0.35× |

Index creation: 95.591 ms, outside query timing. Allocated database-page bytes: baseline 2,174,976; indexed 4,689,920. These are not process RSS or on-disk file measurements.

Ratios above 1 favor the index; below 1 favor baseline. The selective-read gain comes with slower updates and more allocated database pages. Full-table timings are close enough that this uncontrolled experiment does not establish a meaningful improvement. An exploratory run showed the full-table difference in the opposite direction and a smaller selective speed ratio; its raw report is retained locally, not pooled or hidden as a failed trial. No statistical-confidence claim is made.

## Protocol and correctness

Twenty-one paired selective queries vary bound parameters; nine paired complete-table reads; nine paired 1,000-row updates. Method order is randomized with seed 20261026. Every read uses fetchall without LIMIT and compares full ordered output. Each update trial compares the entire updated table, rolls back, and confirms exact restoration. Write timing includes BEGIN and update execution but excludes commit, rollback and verification. It must not be advertised as durable transaction latency.

## Reproduce

- [Harness](run.py)
- [Raw samples, query plans, input/result hashes, pragmas and harness hash](results-2026-10-26.json)

Run `python experiments/sqlite-index-lab/run.py --output results.json`. Only Python's standard library is used. The recorded SQLite version is the one linked to that interpreter, not necessarily the version used by an application.

The retained EXPLAIN QUERY PLAN output is diagnostic evidence for this version. Do not parse it as a stable API. CPU model/frequency/isolation, cold disk, peak memory, concurrent workloads and user-visible application latency were not measured. [Decision guide](../../docs/sqlite-index-decisions.md).
