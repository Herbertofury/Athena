# Preview explicit Scrapbook placement successors

This optional, offline CLI validates a **review receipt**, not an import. A
legacy Scrapbook placement lacks a durable per-placement ID. Formatting or
another edit changes the source byte hash and can produce a different converted
ID. Do not infer that such a row is new, or deduplicate by asset, visual
similarity, coordinates, or stack position.

Use two already verified local conversion bundles from the same native theme
and room and a separately selected, exact current workspace JSON export. Keep
all four inputs local. For the reviewed room, the workspace export must still
contain the entire prior converted layout unchanged; edits or extra placements
in that room are refused. Other workspace rooms are not qualified by this
preview. Do not point it at a database.

The receipt has the following shape (all digest and ID placeholders must be
replaced using your reviewed local files):

```json
{
  "schema": 1,
  "kind": "athena-scrapbook-successor-review",
  "prior": {"sourceSha256": "...", "mappingSha256": "..."},
  "incoming": {"sourceSha256": "...", "mappingSha256": "..."},
  "currentWorkspaceSha256": "...",
  "rows": [
    {"decision": "successor", "priorId": "instance-...", "incomingId": "instance-..."},
    {"decision": "new", "priorId": null, "incomingId": "instance-..."}
  ]
}
```

The source SHA-256 is of `source-original.utf8`, and the mapping SHA-256 is of
`mapping-private.json` in each bundle. The workspace SHA-256 is of the complete
selected current workspace file. Find placement IDs in each bundle's
`athena-workspace.json` under `active.placements`. Record exactly one explicit
disposition for every incoming placement. Each prior placement must have
one successor. Removals, reused IDs, undecided rows, hash mismatches and
room changes are refused. Identical original bytes use ordinary exact-bundle
reconciliation instead. Hashes identify reviewed bytes, not authorship or
an authorized migration.

```sh
python -B tools/foundry-recovery/scrapbook/successor_review.py \
  --prior-bundle /local/prior-bundle --incoming-bundle /local/incoming-bundle \
  --current-workspace /local/workspace.json --receipt /local/review.json \
  --catalog dist/workspaces/foundry/catalog.json
```

Stdout contains counts and scope flags, never paths, content, IDs, or hashes.
A successor count states where the prior native ID *would* be preserved; no
candidate, token or output file is created. This does not change the earlier
conversion, reconciliation, or merge planner. Inputs must be quiescent.
Each selected file is limited to 1 MB and incoming dispositions to 100.
Ordinary symlink/reparse paths and nonregular files are refused. The final
reread detects changes that persist through it, not changes restored between
reads. No concurrency, authority, full-workspace validity, native application
or retirement guarantee is made.

## Optional private candidate (not an apply)

After reviewing the counts, run the separate candidate command with the same
five review arguments. In addition, supply an independently trusted native
Foundry executable, its expected SHA-256, and an explicit, new output file
outside both input bundles. On supported POSIX filesystems only:

```sh
python -B tools/foundry-recovery/scrapbook/successor_candidate.py \
  --prior-bundle /local/prior-bundle --incoming-bundle /local/incoming-bundle \
  --current-workspace /local/workspace.json --receipt /local/review.json \
  --catalog dist/workspaces/foundry/catalog.json \
  --native-binary /local/trusted-build/athena-foundry-store \
  --native-binary-sha256 EXPECTED_HASH_FROM_TRUSTED_BUILD \
  --new-candidate /local/private-new-candidate.json
```

This command never opens an original SQLite file and has no apply operation.
It copies the pinned executable to a disposable directory, verifies that copy
before execution, and uses only a newly created disposable schema-15 store.
It writes and reopens the entire candidate through the native CLI. If the
readback omits or normalizes a field, no candidate is accepted. Matching a
supplied executable digest is an identity check, not independent trust or
authorization to execute code. Use only an independently verified compatible
local build.

Only the reviewed room's placements and any required version tags change.
Successors preserve the stable prior native ID; intentional additions keep
their incoming ID. Other rooms, the active room selection, view and named
layouts are retained. After rereading the inputs, the command stages the
complete JSON in a private sibling directory, checks its size, syncs its
contents, and publishes an atomic no-replace hard link on supporting POSIX
filesystems. The final name therefore denotes a complete 0600 file or is
untouched. If hard links are unsupported, it refuses instead of falling back
to a replace or a direct write. An independently created destination is never
deleted or changed. `stagingCleaned: false` means the published candidate is
complete, but owned private staging cleanup could not be confirmed. In that
case check the reported digest and inspect the sibling
`.athena-successor-*` staging locally before cleaning up. A crash can leave
private staging; neither input reread nor publication promises directory
durability through power loss or safety under hostile pathname changes.
Use a private, quiescent output directory.

No live profile is switched. Native subprocesses have bounded stdout and a
deadline; their executable copy, input and database are disposable and their
environment does not inherit the calling shell. The binding validates the
selected export, not a live workspace. Later application would require
separate review, durable fences and recovery.
