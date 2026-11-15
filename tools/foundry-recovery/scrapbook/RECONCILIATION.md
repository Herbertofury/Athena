# Compare a reviewed Scrapbook bundle with native storage

This local, read-only tool answers whether the bundle's mapped authored placements are present unchanged in Athena. It does not apply a bundle or restore a revision. Build Athena's current `athena-foundry-store` first, stop all writers, and use a standalone schema-15 database snapshot (prepare one with the existing SQLite recovery tool if sidecars exist).

```sh
python tools/foundry-recovery/scrapbook/reconcile.py \
  --bundle /private/reviewed-bundle \
  --database /private/standalone.sqlite \
  --catalog dist/workspaces/foundry/catalog.json \
  --native-binary /trusted/build/athena-foundry-store \
  --source-quiescent
```

Use the locally built executable, not an arbitrary downloaded binary. Output is count-only JSON: expected/exact/missing/different. Exit 0 means all mapped placements match; 1 means missing/different; 2 means unavailable/invalid input. No source paths, authored values or private IDs appear in the report. Keep input bundles and databases private.

The bundle's source/mapping/catalog hashes and deterministic conversion are verified first. The database is captured with the existing 64 MiB aggregate limit and sidecar checks; the native reader opens only a temporary copy. Original SQLite paths are never opened by SQLite or the native process. The native read has a 20-second timeout and a 4 MB workspace output ceiling. Source database and bundle/catalog bytes are rechecked after comparison. No original writes, schema upgrades, provider access or automatic repair are performed.

Comparison uses the mapped room and theme, stable placement IDs and all converted fields. Additional unrelated native placements, active room, other rooms, environment and view are deliberately not counted as mismatches. Thus an exact report is **not** full workspace parity, original visual fidelity, owner-device acceptance or permission to delete the source repository. Source data changed concurrently can invalidate a review; the quiescence assertion is required and is not an OS-level lock.

## Verification

Synthetic tests exercise empty/missing, exact and changed authored data, corrupt bundles/databases, missing quiescence and WAL refusal while checking every original byte remains unchanged. The maintained all-room native acceptance calls this tool's core for all 34 current catalog rooms. Both Windows and Linux CI discover the new CLI tests. Local combined base `a5c8db5` passed 33 Scrapbook tests. An initial test invocation accidentally rediscovered six imported fixture tests; using the fixture module rather than importing its test class removed duplicate discovery before this count. No product failure was found.
