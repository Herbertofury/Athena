# Generation-pinned pagination lab

Original synthetic data, Python and real SQLite. No target app, browser, network, private trace or existing user database is used. [Guide](../../docs/pagination-snapshot-foundations.md) · [Research record](../../research/2026-11-11-pagination-snapshot-foundations.md).

From `engineering`, with Python 3.12+:

```sh
python3 -B -m unittest discover -s tests -p test_pagination_snapshot.py -v
python3 -B -O -m unittest discover -s tests -p test_pagination_snapshot.py -v
python3 -B experiments/pagination-snapshot-lab/review_probes.py
python3 -B experiments/pagination-snapshot-lab/run_demo.py /tmp/athena-pagination-new-run
```

Supply a new owned output directory. The demo retains nine invented databases and `result.json`. Existing-path checks are a fixture convenience, not a hardened filesystem boundary. There is no import or real-database repair command.

[paging.py](paging.py) implements the declared fixed schema and API. [run_demo.py](run_demo.py) runs nine scenarios/19 named checks: live OFFSET insertion/deletion, mutable live keyset order, ID high-water payload changes, complete frozen records, failed capture rollback, retired continuation, tied sort keys, and coherent unsigned-cursor alteration. [demo-result.json](demo-result.json) retains full original/returned records, cursors, errors, environment/compile options and code hashes. The demo uses distinct public fixed fixture identities so replay is exact; normal creation uses random UUID4 values. No time samples or speed claim are manufactured.

The [validation summary](validation-summary.json) distinguishes focused tests, independent probes, aggregate checks and inherited failures. [Review summary](review-summary.json) records independent findings. The initial and later complete runs are retained; adding source-ID/compile metadata to the demo did not alter the declared row outcomes.

## Contract boundaries

- Complete traversal requires starting from page one and following unchanged issued cursors, preserving every page and checking final output. `complete` is not proof of client delivery.
- Cursors are unsigned, readable state, not access tokens, credentials or permission. A coherent modification can skip data; that negative control passes by demonstrating the limitation.
- Generation immutability is an API discipline, not protection from arbitrary SQL. Counts are not a full content-integrity checksum.
- Missing/retired generations error explicitly. In-flight reads can finish from a previously pinned snapshot. Retirement does not delete stored rows or revoke already-returned data.
- Existing database copies keep the same identity, as the negative clone probe demonstrates. No restore/clone aliasing protection is implemented. Migration, HTTP transport, page acknowledgement, authorization, secure deletion, crash/power-loss behavior and target acceptance remain untested.
- Capture/prefix-count costs and Python materialization are included in the implementation but not benchmarked. Row/payload/page limits are not hard total-work, memory or filesystem limits.
