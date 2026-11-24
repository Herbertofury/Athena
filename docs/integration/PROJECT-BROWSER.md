# Native project browser

`#projects` is an independent native workspace for own projects and followed external projects. It supports create/edit with immutable content revisions, name/goal/action/source search, ownership/stage filters, detail views, explicit archive/restore, manual version/release references, local persistence and additive JSON backup import/export.

Nothing is automatically followed on social accounts, polled or synchronized. Version references are manually observed, not guaranteed latest. This is a substantive first slice, not complete Constellation migration. Continuity notes and other workspace state are untouched. Personal entries are not seeded into public catalogs; an empty installation starts empty.

The workspace has a separate schema-1 state under `projects`. Unknown fields survive validation/import. Imports refuse conflicts atomically, admit at most 100 projects / 16 MiB, and never silently truncate. Quota failures preserve the full in-memory draft for export. Use one editing tab; cross-tab compare-and-swap is not provided. Invalid persisted schemas disable mutation rather than overwriting existing data.

## Browse large project collections

The list opens with up to 24 matching projects. **Show next** appends more in
the same most-recent-first order and sends keyboard focus to the first newly
shown project. The result count reports both displayed and total matches.
Search and filters inspect the full collection, even records not displayed yet.
Ownership, stage and archived filters apply to the current project. Opening a
project does not redraw its surrounding cards.

## Search saved revision history

Use Athena's search field to find text in the latest saved revision, or choose
**All saved revisions** under **Project search scope** to include older saved
names, notes, decisions, blockers and release references. Matching cards still
show the current saved project. Opening a result lists the exact revision
numbers and matching field labels without exposing the old text automatically.
Open the saved history disclosure to read the exact revision JSON in groups of
24, newest first.

Search uses the last confirmed Projects snapshot opened or saved in this
workspace. Reload to see edits made in another tab. Rejected drafts remain
available for export and in the default draft view with no search text; they never show
as saved search results. Imported extension fields are preserved but are not
searched or listed as matching fields. Scope defaults to **Current revision**
on mount; neither the scope nor the query writes to project storage. There
are no network requests or background indexing. This is local substring search
within a declared text field, not a general-purpose search index or permission
to restore old revisions.

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

## Compare two saved revisions

Open **Compare saved revisions** in a project’s detail to choose any two
saved revision numbers. The latest two are selected first. Changed fields
show exact before and after values, including empty fields. Original save
order is preserved even when timestamps tie or go backward. You can reverse
the pair or compare a revision with itself.

Athena reads the selected project's saved snapshot when this panel first
opens. Reopen the project to refresh the snapshot. Failed-save drafts and unknown extension fields are not compared. If that
snapshot is unavailable, Athena does not substitute draft history. This is
an optional read-only tool: the raw history and edit/backup controls still
work without it. It does not restore revisions, compare repository files,
send data, or establish Constellation parity.

Choose **Prepare comparison receipt** to copy plain JSON containing this
project's stable ID, the exact two selected revision numbers and timestamps,
their compared fields, and the list of changed fields. Unlike a project
backup, this includes no other projects or unknown extension fields. Athena
rechecks the displayed pair against the saved record before preparing text.
A newer appended revision does not replace an older selection; a missing or
changed selected record refuses the receipt. Changing selection or closing
the panel clears the prepared text. Nothing is copied automatically, saved to
Athena, sent online, or accepted as a project backup.

The design is complementary to the retained Project Constellation working-set
and disposition history implementation (project-memory-core.js at
82cea48448219c57fad8e0c22e986c8f56913286). No upstream code was copied.

## Verification

- `node --test tests/projects.test.cjs`: revision, ownership, filters, reversible archive, malformed/unsafe URLs, serialization, additive/duplicate/conflicting import.
- `node --test tests/project-compare.test.cjs`: revision comparisons, durable-only display, and optional failure isolation.
- `node scripts/test_projects_browser.cjs`: Chromium create/edit/reload, filters, archive/restore, cancel, export/import, route navigation, responsive screenshot and failed-storage draft export. Included in learning CI. Local browser execution blocked by Chromium singleton socket EPERM, including escalation; no local browser pass claimed.
- No game implementation is included. The owner's space action-RPG is a concept to track, not built content.
