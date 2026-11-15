# Resume from a preserved unified checkpoint

A unified package can explicitly fork an intact checkpoint into a different, new
working directory, without opening the preserved databases in SQLite:

```sh
python -B launch.py --fork-checkpoint /external/checkpoint --working-directory /external/new-working --source-quiescent
python -B launch.py --database /external/new-working/foundry.sqlite3 --journal /external/new-working/engineering.sqlite3
```

Stop any writers to the checkpoint first. Forking does not start a server, overwrite
current stores, upgrade schemas, restore in place, or alter the preserved checkpoint.
The working directory cannot be inside the preserved checkpoint. Ordinary private,
quiescent directories are required; hostile concurrent path changes are not solved.

The unsigned receipt is an integrity record, not authority to choose paths. Only
`foundry.sqlite3`, `engineering.sqlite3`, and `checkpoint.json` are accepted; extra
entries, sidecars, symlinks/reparse points, malformed/duplicate keys, invalid sizes
and hash mismatches refuse. Receipt parsing is capped at 1 MiB and each database at
64 MiB. Both rows are validated before either database is read. Hashing is bounded
by the declared size. These are byte bounds, not hard filesystem I/O deadlines or
signed authenticity. A supplied hash cannot make an arbitrary SQLite file safe.

The existing stopped-copy implementation checks those verified identities again
before staging, preserves the production pre-open Python WAL gate, prepares only
disposable copies, and validates native schema 15. Output records the original
receipt's SHA-256 as lineage; it is not a signature. Engineering SQLite integrity
is separate from application-semantic compatibility. Publication retains the
existing exclusive-directory and last-completion-marker behavior; failed partial
new output is kept for inspection. No existing user file is replaced or deleted.

Eight new local tests cover preserved parent bytes, receipt path attacks, duplicate
keys, tampering, typed sizes, nested destinations source-quiescence/link refusal and a change between verification
and capture. Native status is stubbed only in these unit tests. The exact hosted
Windows/Linux integration creates both stores, checkpoints them, forks them through
the packaged CLI, and opens only the fork to verify workspace/experiment continuity,
then rehashes both original stores and the preserved checkpoint. This is synthetic
acceptance, not owner-data migration or a repository-retirement decision.
