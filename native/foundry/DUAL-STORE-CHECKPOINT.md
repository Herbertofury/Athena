# Explicit stopped dual-store checkpoint

A unified portable package can copy both its Foundry database and Engineering
journal into a new private checkpoint directory:

```sh
python -B launch.py --database /external/foundry.sqlite --journal /external/engineering.sqlite --checkpoint-directory /external/new-checkpoint --source-quiescent
```

Stop all writers first. `--source-quiescent` is the operator's assertion, not an
application lock or proof that writers have stopped. No server is started by this
command. It requires both existing stores, rejects aliases/reparse points, and
refuses an existing destination. It does not upgrade, restore or modify originals.

The existing SQLite preparation helper operates on disposable copies, retains its
pre-open Python SQLite 3.54 WAL gate, and checks integrity. Each helper has a
30-second subprocess timeout; native status has 15 seconds. Original capture and
filesystem operations are byte-bounded, not hard wall-clock I/O deadlines. Each
source family is limited to 64 MiB, including sidecars. Unsupported or active
rollback journals are refused. No R&D WAL implementation is included.

Both source-family hashes are collected before either copy; helper receipts and
both final source hashes must agree. This detects changes at those checks, not an
atomic live two-database snapshot or arbitrary write/revert activity between checks.
Foundry must already use schema 15. Engineering receives SQLite integrity checks;
semantic compatibility is separate. No owner data or broad migration acceptance is
implied by the synthetic two-store test.

Output contains `foundry.sqlite3`, `engineering.sqlite3`, and `checkpoint.json`.
The JSON records relative output names, hashes, runtime and validation scope, not
original absolute paths. Treat every output as private user data. The new directory
is exclusive. Verified staged files publish using a Windows no-replace rename
or a POSIX exclusive hard link; the completion marker is published last. Failed
publication never falls back to copying or overwriting and can
leave a partial new directory without a completion marker; preserve it for review
and choose a different new destination. Publication is not a transactional directory
commit or power-loss durability claim. Physical removable-media and safe-eject/reinsert validation is separate.
Trusted, quiescent directories are required;
these checks do not defeat hostile concurrent directory changes.

Unit acceptance uses disposable real SQLite files and the actual preparation
subprocess, stubbing only native schema status. The real unified HTTP test creates
both stores with current binaries, stops the engine, invokes the packaged command,
then opens only the synthetic copies to verify workspace and experiment continuity.
Hosted Windows/Linux validation is required. Early unit harness failures (a helper
shadowing `TestCase.run`, then a mismatched package keyword) were corrected before
publication; seven focused tests pass locally. No synthetic executable is run.

Independent review caught a destination/source-sidecar collision before publication.
Every reserved sidecar destination is now refused before capture or directory
creation, with both source families tested and original bytes preserved.
