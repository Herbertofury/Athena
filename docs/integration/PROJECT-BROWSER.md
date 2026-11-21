# Native project browser

`#projects` is an independent native workspace for own projects and followed external projects. It supports create/edit with immutable content revisions, name/goal/action/source search, ownership/stage filters, detail views, explicit archive/restore, manual version/release references, local persistence and additive JSON backup import/export.

Nothing is automatically followed on social accounts, polled or synchronized. Version references are manually observed, not guaranteed latest. This is a substantive first slice, not complete Constellation migration. Continuity notes and other workspace state are untouched. Personal entries are not seeded into public catalogs; an empty installation starts empty.

The workspace has a separate schema-1 state under `projects`. Unknown fields survive validation/import. Imports refuse conflicts atomically, admit at most 100 projects / 16 MiB, and never silently truncate. Quota failures preserve the full in-memory draft for export. Use one editing tab; cross-tab compare-and-swap is not provided. Invalid persisted schemas disable mutation rather than overwriting existing data.

## Transfer only one saved project

Open the intended project and choose **Review portable copy**. The preview
identifies the exact project ID, date and revision count. Inspect the exact
JSON before downloading: it contains only this durable project (all dated
revisions, links and project-level metadata). Other projects, workspace
settings, learning data and Continuity notes are not included. The file is
plain text, not an online share or a sync connection. If the selected saved
project changes after review, Athena rejects the export and asks you to review
again. Unsaved editor changes are not exported through this path.

To reopen the file in another local profile, choose **Import backup**, inspect
the proposed additions, and confirm. Identical projects are a no-op. Conflicts
are refused; imports do not overwrite an existing ID. The browser store is
checked again at confirmation and requires confirmed readback; this is not a
cross-tab lock. The existing full-workspace export remains available, including
its documented draft-recovery behavior.

## Verification

- `node --test tests/projects.test.cjs`: revision, ownership, filters, reversible archive, malformed/unsafe URLs, serialization, additive/duplicate/conflicting import.
- `node scripts/test_projects_browser.cjs`: Chromium create/edit/reload, filters, archive/restore, cancel, export/import, route navigation, responsive screenshot and failed-storage draft export. Included in learning CI. Local browser execution blocked by Chromium singleton socket EPERM, including escalation; no local browser pass claimed.
- No game implementation is included. The owner's space action-RPG is a concept to track, not built content.
