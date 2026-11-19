# Integrated native save workflow

This candidate composes the reviewed main-based saved-layout rename rebuild
(b781af4) and native snapshot comparison (78aa05c). The shared host preserves both
production paths. The manifest conflict is resolved by hashing the combined host
and comparison module, not choosing either older hash. The actual native scope
integration test retains both rename-preservation and comparison assertions.

The user can rename a saved layout without opening/replacing it or needing a free
slot, see immediately that the native snapshot differs, undo back to a matching
snapshot, redo, and explicitly save. Browser authoring never implicitly writes the
native database. Tests verify renamed draft content leaves real SQLite unchanged
until explicit save and native recovery still preserves the saved arrangement.

Canonical main and active work were checked first. The live public backlog was
read at wiki head fae71f1, retaining the revision-15 checkpoint; web search's older
revision-14 representation was not treated as latest. This is independent of
held Continuity/Guidance migration work, backup prototype #229 and other active
Foundry layer/alignment branches. No source is removed or certified for retirement.

Standalone test results are not combined-tree acceptance. Re-run focused tests,
full aggregate/native suites and reviewed packaging on this exact candidate.
The Chromium harness preserves both features' acceptance and adds comparison after
rename; local syntax checks are not rendered acceptance. Windows/rendered-browser
and owner-device tests remain separate gates. Snapshot matching means the last
explicitly verified snapshot, not observation of other writers or crash durability.

No private data, credentials, imported assets or external-provider access are
included. Draft publication, if permitted, is not merge, deployment or release.
