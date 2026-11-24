# Single-project request identity repair

Reviewed 2026-10-27 against Atlas baseline `0cca1cca404351a0680a0914937eb7e6f37ce969`.

## Actual reproduced failure

The single Modrinth path validated the response's own canonical ID and fields but did not bind it to the requested ID/slug. `save_modrinth` consequently recorded a successful attempt for an unrelated request and inserted the returned project. This was reproduced offline through the actual baseline store, not inferred solely from source: [before](before.json), [after](after.json).

Three generated invalid request identities were accepted before and rejected after. No provider fault, hostile response or account compromise is claimed. Batch and version lanes already have separate binding checks and are unchanged.

## Repair and compatibility

`parse_requested_project` reuses the existing bounded parser and requires either an exact canonical ID or an ASCII-case-insensitive current slug. The network single-project path and store both use this guard. Checks precede the SQLite transaction, so a mismatch cannot add a success attempt or replace an existing good generation. Failed network collection still uses the caller's existing failure-recording path. The store itself does not invent an additional failure attempt when rejecting an invalid direct call.

Eight-character slugs remain valid; length alone does not decide whether the request is an ID. Canonical IDs are not case-folded. Canonical-ID lookup continues to work after a slug change. Historical aliases not equal to a returned current slug are not silently assumed valid.

The [official endpoint](https://docs.modrinth.com/api/operations/getproject/) accepts ID or slug. [Pinned upstream lookup source](https://github.com/modrinth/code/blob/2bb257a8923fa6084d8250a79bef6a3860f9a802/apps/labrinth/src/database/models/project_item.rs#L640-L660) parses canonical IDs separately and lowercases slug candidates. This was a static review only; no upstream executable was run.

## Evidence and boundaries

Three new focused tests cover canonical/slug case handling, eight-character slugs and last-good generation preservation. Local checks: 86 Rust unit tests plus four persistence integration tests; formatting and Clippy with warnings denied passed. The retained public Sodium, Iris and Lithium responses each passed canonical, lowercase-slug and uppercase-slug routes with identical complete existing typed projections and in-memory snapshot roundtrips. Source hashes are in the after receipt. Original long-form source text stays private to the research workspace rather than being republished.

This is a correctness repair, not a speed, durable-write, memory or native-UI claim. The current typed project projection still is not a complete arbitrary-provider JSON archive. No data fields were added or removed. No new provider requests, sign-ins, downloads or grants were required. No other project's implementation, wiki or TODO is promoted from this study.

## Reproduce

Use the existing pinned Rust 1.99.1 toolchain and locked dependencies. Run the `project_identity_lab` example from `apps/atlas-lab`; optional arguments are paths to legitimately retained public project-response JSON. Run the crate's ordinary tests and Clippy. The [baseline example](baseline-example.rs) runs against the baseline commit above; the unchanged baseline adapter/store sources are also retained. Keep baseline and candidate outputs rather than replacing failed evidence.
