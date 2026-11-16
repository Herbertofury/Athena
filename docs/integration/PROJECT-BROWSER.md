# Native project browser

`#projects` is an independent native workspace for own projects and followed external projects. It supports create/edit with immutable content revisions, name/goal/action/source search, ownership/stage filters, detail views, explicit archive/restore, manual version/release references, local persistence and additive JSON backup import/export.

Nothing is automatically followed on social accounts, polled or synchronized. Version references are manually observed, not guaranteed latest. This is a substantive first slice, not complete Constellation migration. Continuity notes and other workspace state are untouched. Personal entries are not seeded into public catalogs; an empty installation starts empty.

The workspace has a separate schema-1 state under `projects`. Unknown fields survive validation/import. Imports refuse conflicts atomically, admit at most 100 projects / 16 MiB, and never silently truncate. Quota failures preserve the full in-memory draft for export. Use one editing tab; cross-tab compare-and-swap is not provided. Invalid persisted schemas disable mutation rather than overwriting existing data.

## Verification

- `node --test tests/projects.test.cjs`: revision, ownership, filters, reversible archive, malformed/unsafe URLs, serialization, additive/duplicate/conflicting import.
- `node scripts/test_projects_browser.cjs`: Chromium create/edit/reload, filters, archive/restore, cancel, export/import, route navigation, responsive screenshot and failed-storage draft export. Included in learning CI. Local browser execution blocked by Chromium singleton socket EPERM, including escalation; no local browser pass claimed.
- No game implementation is included. The owner's space action-RPG is a concept to track, not built content.

## Search saved project history

Choose **All saved revisions** under **Project search scope** to search historical
names, goals, decisions, blockers, resources and observed release references with
the shared Athena search field. Default remains **Current revision**. Matching
cards retain current content and identify the matching revision numbers; opening
a card exposes read-only matching revision/field evidence. Historical matches are
not restored, rewritten, or treated as current. Ownership/stage/archive filters
still apply to the current project. Scope is session-local and no state is saved
by searching. Empty/whitespace search shows the normal filtered collection.

Unknown imported extension metadata is retained but not indexed or exposed as
search evidence. Literal source text uses text nodes, never HTML. No provider
requests, index service or extra permissions. This is native manual project-history
retrieval, not full Constellation Output Vault/chat-capture/indexed-search parity.
