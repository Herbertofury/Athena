# External-content FTS5 consistency lab

Original synthetic fixtures and a real local SQLite engine. No external service, existing user database, downloaded executable, target app, or live release is changed. See the [guide](../../docs/fts-consistency-foundations.md) and [dated record](../../research/2026-11-11-fts-consistency-foundations.md).

## Run

Requires Python 3.12+ with SQLite FTS5 compiled in. From `engineering`:

```sh
python3 -B -m unittest discover -s tests -p test_fts_consistency.py -v
python3 -B -O -m unittest discover -s tests -p test_fts_consistency.py -v
python3 -B experiments/fts-consistency-lab/run_demo.py /tmp/athena-fts-new-run
```

Use a **new owned output directory**. The demo refuses an existing output directory and retains fixture databases, individual receipts, and `result.json`. It intentionally creates inconsistent synthetic indexes for negative controls. Never point the helper at a real catalog. Path existence checking is a convenience for owned fixtures, not an adversarial path/symlink containment boundary.

`catalog.py` contains the schema, trigger-maintained canonical writes, literal-phrase search, diagnostics, and transactional rebuild. `exit_writer.py` is a finite owned child that exits before/after COMMIT; `run_demo.py` records all outcomes. The child runs no arbitrary command and receives only the demo's own path and a fixed stage. Captured output is small because the child emits one bounded synthetic row; this is not an untrusted subprocess-output manager.

## Retained observations

[demo-result.json](demo-result.json) retains nine scenarios/34 checks:

1. Missing initial backfill despite a correct non-MATCH count and passing internal checks.
2. An obsolete term resolving to newly edited metadata after a deliberately removed trigger.
3. Canonical/posting rollback after a write fault.
4. Rebuild rollback preserving the original inconsistent state.
5. Actual SQLite progress-handler interruption during a 500-row rebuild.
6. Old/new WAL-reader snapshots with consistent row/posting visibility.
7. Abrupt process exit before commit.
8. Abrupt process exit after commit.
9. REPLACE with recursive triggers disabled, followed by explicit repair and UPSERT.

The first and final runs passed. The final process-exit receipts use a genuinely fresh parent connection; the earlier run used new transactions on the existing connection and is retained separately in local evidence. No failure was relabeled as a success. Test counts and independent review are in [validation-summary.json](validation-summary.json) and [review-summary.json](review-summary.json).

## Limits

This is a correctness drill, not a library API. Search does not check global index health on every query, fix missing triggers, authorize a caller, or provide rank/pagination/relevance. Audits can need writer locks and are separate per-command snapshots. Rebuild materializes all canonical rows for a fixture comparison. Bounds on query bytes/result counts are not CPU/RSS/deadline bounds. The callback hooks are trusted local test hooks only. A retained audit cannot promise future trigger correctness. Process exit is not power loss or storage-corruption recovery.

All rows and metadata are invented. Unknown metadata is preserved as opaque text. The ASCII mutation oracle has a deliberately tiny vocabulary and makes no claim to reimplement Unicode tokenization. No app/mod/game-specific performance or adoption conclusion is made.
