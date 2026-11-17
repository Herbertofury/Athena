# Native project browser

`#projects` is an independent native workspace for own projects and followed external projects. It supports create/edit with immutable content revisions, name/goal/action/source search, ownership/stage filters, detail views, explicit archive/restore, manual version/release references, local persistence and additive JSON backup import/export.

Nothing is automatically followed on social accounts, polled or synchronized. Version references are manually observed, not guaranteed latest. This is a substantive first slice, not complete Constellation migration. Continuity notes and other workspace state are untouched. Personal entries are not seeded into public catalogs; an empty installation starts empty.

The workspace has a separate schema-1 state under `projects`. Unknown fields survive validation/import. Imports refuse conflicts atomically, admit at most 100 projects / 16 MiB, and never silently truncate. Quota failures preserve the full in-memory draft for export. Use one editing tab; cross-tab compare-and-swap is not provided. Invalid persisted schemas disable mutation rather than overwriting existing data.

## Verification

- `node --test tests/projects.test.cjs`: revision, ownership, filters, reversible archive, malformed/unsafe URLs, serialization, additive/duplicate/conflicting import.
- `node scripts/test_projects_browser.cjs`: Chromium create/edit/reload, filters, archive/restore, cancel, export/import, route navigation, responsive screenshot and failed-storage draft export. Included in learning CI. Local browser execution blocked by Chromium singleton socket EPERM, including escalation; no local browser pass claimed.
- No game implementation is included. The owner's space action-RPG is a concept to track, not built content.

## Read-only saved-revision comparison

Project details offer **Compare saved revisions**, separately from raw history. Select two retained revision numbers to see exact before/after values for the eleven known project fields. Default selection is the latest pair; identical or reversed selections are allowed. Saved sequence is authoritative even if timestamps repeat or go backwards. Empty fields are labeled, source strings remain inert text, and unknown imported extension fields stay stored but are explicitly outside this comparison.

The comparison is lazy and optional. Missing module/failure leaves the project editor and raw history usable. It does not save, restore, fetch, export, migrate schemas or compare repository code. Private history never leaves the workspace. No source retirement is authorized by this slice.

Source inspection: Project-Constellation `extension/src/project-memory-core.js` at `82cea48448219c57fad8e0c22e986c8f56913286`, lines 72–86, compiles working sets and bounded disposition history. Athena's existing `model.mjs` preserves immutable project-content revisions. This is an original complementary comparison UI, not a claim that Constellation already had equivalent before/after functionality, and no upstream implementation was copied. Existing source licensing caution in PROJECT-CONTINUITY.md remains.

Verify with `node --test tests/project-compare.test.cjs` and `node scripts/test_projects_browser.cjs`. The browser flow includes an actual edit then comparison/reselection. Pending PR276 history search and PR288 creative companion integrate separately: retain this optional host after raw-history rendering when composing them. No pending branch was overwritten.
