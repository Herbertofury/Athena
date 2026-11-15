# Python SQLite WAL exposure and fail-closed recovery

Reviewed2026-11-15. Rust's bundled SQLite and Python's linked SQLite are separate
runtimes. A patched `libsqlite3-sys` lock entry does not qualify Python recovery.
Local measurement found Python3.12.14 linked to SQLite3.53.1, source ID
`2026-05-05 10:34:17 c88b22011a54b4f6fbd149e9f8e4de77658ce58143a1af0e3785e4e6475127e9`.
Hosted Windows/Linux versions are measured explicitly in the native workflow,
not inferred from Python's language version, package names or Rust dependencies.

## Verified issue and actual Athena path

[RustSec RUSTSEC-2026-0459](https://rustsec.org/advisories/RUSTSEC-2026-0459.html)
reports local memory disclosure for SQLite before3.54.0 when a less-trusted DB/WAL
pair declares inconsistent page sizes. Patched bundled crate versions start at
0.39.0, not only0.39.1; system-linked copies depend on their actual SQLite.
The [upstream fix](https://github.com/sqlite/sqlite/commit/e5bf119821f25be1d7f10ef0a2edbe175289166e)
initializes the unread page-buffer tail. [SQLite3.54.0](https://sqlite.org/releaselog/3_54_0.html)
is the advisory's patched release boundary.

Athena's shared `tools/foundry-recovery/sqlite/prepare.py` stages captured source
bytes, including WAL, then calls Python `sqlite3.connect` and ordinary queries.
Copying to staging preserves originals, but does **not** protect that process from
an engine defect triggered by those same bytes. `integrity_check` is itself an
engine operation, not a pre-parser security boundary. The portable backup command
introduced in#224 uses this helper. No exploitation or compromise was observed or
claimed; no crafted exploit was executed during this investigation.

## Remediation

The helper now refuses every captured WAL on Python-linked SQLite below3.54.0
**before any SQLite connection or staging query**. It does not silently discard a
WAL or return a stale partial backup. Standalone backups remain available under the
existing checks. Repeated capture/race detection, integrity checks, byte limits,
new-output publication and stopped-source requirements stay intact. All helper
callers receive the same guard, including portable packages built from this source.
Previously built packages need rebuilding; publication does not update installed
copies automatically. Backported runtimes still reporting an older version are
conservatively refused; there is no bypass switch.

Use a verified patched Python runtime or an independently prepared standalone
backup. Do not delete sidecars, force a checkpoint on an untrusted original or
change security settings to pass the guard. `--verify-only` reports the actual
Python SQLite version and WAL eligibility. Successful backup receipts also record
the linked version. Synthetic tests prove rejection occurs before `connect`,
retains sources and creates no destination. Patched-version control-flow tests use
a mocked connection sentinel, not an exploit or fake claim of patched local code.
On an older runtime, the real WAL test verifies refusal rather than claiming a
successful WAL backup. Standalone, no-overwrite, failure-cleanup and native UI
backup tests remain active.

## Future live backup, not implemented here

The [official SQLite online backup API](https://www.sqlite.org/backup.html) can
coordinate incremental copying with concurrent writers, but source changes can
restart work and prevent completion. A future native, patched-engine implementation
would need explicit connection ownership, busy/deadline/cancellation handling,
consistent snapshot evidence and exclusive destination publication. The current
helper's capture-and-compare algorithm is **not** that live-backup protocol. Its
quiescence assertion remains an operator requirement, not a lock or guarantee.
