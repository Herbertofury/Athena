# Isolated staged-WAL recovery candidate · 2026-11-15

This is R&D, not a production fallback. The Python SQLite <3.54 WAL rejection in
`tools/foundry-recovery/sqlite/prepare.py` remains unchanged. Nothing invokes this
candidate from the launcher, unified app, or recovery tools. No source upgrade or
restore is performed. Only locally built reviewed worker binaries are intended.

The Python research wrapper captures a bounded (64MiB combined) stopped source,
rechecks original file hashes, and hands only disposable DB/WAL copies to the
native worker. It never opens the original through SQLite. The native worker
checks its actual linked SQLite >=3.54.0 before any database open, validates
matching page sizes, WAL format, frame boundaries, salts and rolling checksums,
then uses rusqlite's official backup API, at most2048 steps of128 pages with an
8-second cooperative budget. Busy/locked abort without retries. The parent kills
and waits for the worker on a12-second subprocess timeout. Native direct invocation
has no hard I/O deadline and is not an approved live-source interface.

Output is integrity-checked, standalone rollback-journal format, at most64MiB.
After final source checks, a complete flushed sibling temporary file is linked
exclusively to a new destination. Existing files are never overwritten. Staged
files are removed on failure. Trusted private directories are required: file
hash checks are observations, not protection against hostile path replacement or
active writers. Unsupported/corrupt WAL tails fail closed, even where SQLite could
ignore them. Header/frame checks cannot establish application semantic fidelity.

Local Linux: seven synthetic tests passed with actual SQLite3.54.1: committed
WAL row retained, mismatch/truncation/checksum corruption rejected, existing target
preserved, stopped assertion required, and mocked subprocess-timeout cleanup.
The timeout test verifies parent wiring/cleanup, not observed interruption of a
hung native I/O syscall. Rust tests cover version threshold and header mismatch.
Hosted Windows/Linux results must be checked for the exact proposed commit before
merge. No personal data, real legacy app acceptance or live-writer claim.

A rebuild hit linker bus error with disk full after checksum validation was added.
No stale binary was tested. Removed only23,431,287 bytes of this worker's verified
regenerable prior rlib/rmeta and failed linker temporary output, retaining all
source/evidence/held patches. Correct rebuild then passed all seven tests.

References: [SQLite backup API](https://sqlite.org/backup.html),
[WAL format](https://sqlite.org/fileformat2.html#walformat),
[Rust advisory](https://rustsec.org/advisories/RUSTSEC-2026-0459.html).
This does not replace the #226 security gate or qualify all migration callers.

Independent review confirmed checksum byte order against official format §§4.1–4.2.
A legitimate reset WAL can retain physical old-salt tail frames (§4.4). This
candidate deliberately rejects that case rather than silently shortening the WAL;
it is not generic WAL support. Regression coverage includes opposite-endian
checksums and old-salt tail rejection. A real disposable Python sleeper additionally
checks that the wrapper's twelve-second timeout terminates/waits for its child;
this is not evidence of interrupting a native kernel I/O hang.

Recovered logical page count × page size is checked before integrity/backup;
backup progress and staged file length are also bounded at each step. The wrapper
rejects any output sidecar before publication. The receipt/hash records the worker
used, not executable attestation: a trusted reviewed build is a prerequisite.
Directly passing an original DB to the native worker is unsupported and can alter
it through SQLite recovery; only the wrapper's disposable-copy route is supported.

Final local pass:13 Python tests passed with SQLite3.54.1, including64KiB pages,
big-endian checksums, rollback-mode-plus-WAL rejection, observed source change
withholding output and real child timeout. Strict candidate clippy passed.
An initial u64 PRAGMA decoding compile error was corrected to checked i64→u64;
no failed build was treated as test acceptance. Final worker SHA256:
`afbf7f0ff56e4da388bb2f0368301d7ac9b890132c11d7fc1b00bb541eaa45d5`.

Final destination family must also be absent (`lexists`, including dangling links)
both before capture and immediately before exclusive publication. Preexisting or
newly appeared WAL/SHM/journal sentinels remain untouched. This reduces stale-state
risk but is not race-proof against hostile directory writers between final check
and link. Later owner opens remain outside this candidate's acceptance boundary.
