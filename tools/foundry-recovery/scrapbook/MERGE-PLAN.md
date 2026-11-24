# Non-destructive Scrapbook merge candidate

A converted single-room workspace is not automatically a safe replacement for an existing workspace. This tool prepares a **new private candidate file**, preserving unrelated rooms, the active room, view and named layouts. It does not restore or apply anything to the original database.

```sh
python tools/foundry-recovery/scrapbook/merge_plan.py \
  --bundle /private/reviewed-bundle \
  --database /private/quiescent-schema15.sqlite \
  --catalog dist/workspaces/foundry/catalog.json \
  --native-binary /trusted/local-build/athena-foundry-store \
  --destination /private/new-candidate.json \
  --source-quiescent
```

Only use the trusted current locally built native executable. The candidate contains private workspace data. Never commit it. Exit 0 means a candidate was created; exit 2 means unavailable/conflicting input. Preserve any incomplete new output after an I/O failure for review; an existing destination is never replaced.

## Merge policy

- The reviewed bundle is verified by hash and deterministic recomputation. A standalone schema-15 database is captured under the existing 64 MiB limit; sidecars and an unasserted quiescent state are refused.
- Rust loads and validates only a disposable copy. A null workspace starts from the reviewed bundle.
- A missing target room is added without changing which room is active. For an existing room, its theme must match, existing environment/time are kept, and imported placements are added by stable ID.
- An identical existing ID is a no-op. A different value at that ID is a conflict, not permission to overwrite. Distinct IDs sharing scope/anchor/z-order are refused for explicit stacking reconciliation.
- If the target is currently active, the active layout receives the same additions. Other layouts, view and named layouts are retained. Necessary version tags can increase; this does not convert original visual behavior.
- The complete candidate is saved and reloaded in the disposable native copy. Any native validation error or normalization change prevents publication. Native operations have 20-second deadlines and a 4 MB output ceiling.
- Source bytes are rechecked before exclusive creation of the new file. The report includes source snapshot and candidate hashes, added/identical counts and `applied:false`. Original database and bundle files are never written.

The candidate is only a review artifact. Before any separate application, recheck the source snapshot hash and use the existing concurrency-aware import/recovery workflow rather than blindly overwriting a newer workspace. This tool does not apply, grant approval, restore a historical revision, or claim visual/physics/media fidelity or source-retirement readiness.

## Evidence

Combined with main after #214, 39 local Scrapbook tests passed. Six new synthetic tests use the actual native executable: empty store, no-overwrite output, preserving unrelated active room/view/named layouts, same-room additions, repeated identical import, conflicting IDs, ambiguous stacking and tampered bundle. Every original fixture byte is compared before and after the CLI. The existing Windows/Linux test discovery runs these after the native build.

An initial test fixture used invalid shorthand instance IDs in two cases; the native validator rejected them before planning. Correct UUID-shaped fixture IDs fixed those tests; validation was not weakened. Hosted results are recorded in the associated PR/CI, not inferred from local execution. Owner data and browser rendering were not tested.
