# Native catalog organization

Athena's current-theme asset catalog supports intersecting text, shape and role filters and stable name ordering. Catalog order remains the default; name ties preserve original order. This is a session-only view: filtering and sorting never save the workspace, import assets, execute files or add instances. Search and compatible facets survive room/count updates; facets absent from the new theme reset to All. Instance limits, explicit Add, Undo/Redo and stale-button protection remain unchanged.

This is a bounded Feature Foundry usability increment, not full AssetVault parity or permission to retire the original repository. Cross-theme discovery, persistent saved views, thumbnails and large-catalog performance remain separate gaps.

## Checks

- Three DOM organization tests cover intersections, stable ties, immutable input, compatible/reset facets, instance limits, stale actions, abort and text-only labels.
- Existing stale-action/search regressions pass.
- Aggregate `npm test` and 14 packaging tests pass locally.
- Real-browser harness extends the existing end-to-end Add/Undo/export/reload test with facet, ordering and no-storage-write assertions. Local Chromium launch was blocked before execution by socket EPERM; no visual/browser acceptance is claimed.
- Full native Rust-backed Foundry suite was not run locally because Cargo is unavailable. Hosted Windows/Linux qualification is required.

No original repository, private records, local profiles or stored artifact data are modified by this change.
