# Offline learning: bounded local evidence acceptance

**R&D experiment, not a delivered autonomous intelligence capability.** Uses Python's
preinstalled standard library and SQLite FTS5; no package installation, model,
service, credentials or network acquisition. Does not change the Athena app.

Run `python research/offline-learning-2026-11-15/experiment.py` from the repository.
Output is a JSON receipt; an ephemeral database is removed after independent-process
restart verification. The public checked-in receipt retains attributed findings,
source body hashes, task outputs and failures. Inputs are original synthetic fixtures.

## What was actually verified

1. Ingest baseline local corpus transactionally into immutable generation 1.
2. Freeze three held-out retrieval questions outside ingestion/ranking.
3. Ingest changed local evidence into generation 2; store an attributed comparison.
4. Reject duplicate IDs and malformed rows without losing the active snapshot.
5. Roll back to generation 1 and forward to 2 with exact retrieval restoration.
6. Close the database and start an independent interpreter; retrieve the same findings
   and results. Socket creation is denied and tested in both processes by a Python
   audit hook. **This is process-level network denial, not OS sandbox isolation.**

Top-1 fixture task accuracy increased from **1/3 to 3/3** after new relevant local
records were ingested. This shows corpus-refresh utility and durable retrieval, not
that BM25 beats another algorithm, that the app learned model parameters, or that
these fixtures measure real-world intelligence. No external facts were acquired.
An offline system can derive/test findings from available local inputs; it cannot
know unseen releases, advisories or remote changes without later synchronization.

## Failure retained and fixed

`failed-run.json` records the first failed rollback assertion. A shared FTS index
allowed newer generations to alter historical BM25 statistics. Search now builds
its temporary FTS index from the selected generation only. This restores historical
results exactly. This simple rebuild is **not a production performance choice**;
measure representative corpus sizes before choosing an indexed architecture.

## Boundaries and next acceptance gates

- This runner accepts fixture provenance only. A real local adapter must record
  permitted source path/version/hash, observation time, extraction policy and scope.
- No source content is executed or treated as instructions. Findings remain claims
  with evidence, not automatic authority or project-wide recommendations.
- Corpus replacement, finding retention and rollback are explicit operations. No
  self-modification, autonomous scheduler or silent code promotion is implemented.
- Evaluate real, approved project tasks with leakage-resistant held-out cases;
  measure accuracy, latency, memory, failure recovery and disk growth against the
  actual current implementation before native integration.
- Add crash/power-loss, concurrent writer, migration, export/restore and large-corpus
  tests. Current verification covers normal close/reopen and transaction exceptions,
  not forced process termination or hardware durability guarantees.
