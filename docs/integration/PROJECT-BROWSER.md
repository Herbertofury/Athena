# Native project browser

`#projects` is an independent native workspace for own projects and followed external projects. It supports create/edit with immutable content revisions, name/goal/action/source search, ownership/stage filters, detail views, explicit archive/restore, manual version/release references, local persistence and additive JSON backup import/export.

Nothing is automatically followed on social accounts, polled or synchronized. Version references are manually observed, not guaranteed latest. This is a substantive first slice, not complete Constellation migration. Continuity notes and other workspace state are untouched. Personal entries are not seeded into public catalogs; an empty installation starts empty.

The workspace has a separate schema-1 state under `projects`. Unknown fields survive validation/import. Imports refuse conflicts atomically, admit at most 100 projects / 16 MiB, and never silently truncate. Quota failures preserve the full in-memory draft for export. Use one editing tab; cross-tab compare-and-swap is not provided. Invalid persisted schemas disable mutation rather than overwriting existing data.

## Verification

- `node --test tests/projects.test.cjs`: revision, ownership, filters, reversible archive, malformed/unsafe URLs, serialization, additive/duplicate/conflicting import.
- `node scripts/test_projects_browser.cjs`: Chromium create/edit/reload, filters, archive/restore, cancel, export/import, route navigation, responsive screenshot and failed-storage draft export. Included in learning CI. Local browser execution blocked by Chromium singleton socket EPERM, including escalation; no local browser pass claimed.
- No game implementation is included. The owner's space action-RPG is a concept to track, not built content.
