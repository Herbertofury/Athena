# Native saved-layout rename

Rebuilt as new work against verified canonical main
`22aeac716a8bb642e5269fdc8b3c38b99055bad6` after the earlier unpublished checkout
was lost. This is not recovery of the earlier commit or reuse of its test results.

Use **Layout name (save or rename)** and **Rename selected layout** to correct a
saved layout's name without opening/replacing the arrangement, changing order,
or requiring a free slot. All 20 slots may be occupied. Names use the existing
trimmed, exact case-sensitive uniqueness and 80-JavaScript-character contract.
Invalid/duplicate names refuse before checkpoint/write. An unchanged trimmed name
retains inspector drafts and Redo. Markup-like names remain inert text.

The existing workspace validation, Undo/Redo, capacity rollback and save-failure
contracts are reused. Failed host persistence retains the draft with recovery
instructions; native SQLite save is still explicit. No new dependency or schema.

## Preservation and coexistence

Active rename PR search and current code were checked before rebuilding. Active
layer search, axis alignment, asset filtering and revision preview address other
operations. Shared-host combinations still need exact-tree review/tests; this
main-based slice does not modify those branches or the held migration composition.
The retained original prototype-v24.ts scrapbook save/restore is a preservation
reference, not the same named-layout contract or a parity claim. Sources remain
untouched; no private data or unlicensed assets are included.

## Fresh acceptance

Focused mounted-DOM tests cover 20-slot capacity, exact rooms/layouts/order and
selected index, remount, Undo/Redo, 80-character names, invalid/duplicate/no-op
refusal, retained Redo and draft fields, disposal/abort guards, host save refusal,
and oversized recovery draft capacity rollback. Native scope integration covers
actual app/HTTP/Rust SQLite save and revision recovery after rename. Chromium
harness additions cover duplicate refusal, rename/Undo/Redo, explicit save and
post-restart name verification, but syntax validation is not browser acceptance.

This change remains local unless separately published. Rendered-browser, Windows
and owner-device acceptance are unverified. No merge, deployment, private migration
or source retirement is claimed. See the accompanying durable patch checkpoint
for this rebuild's verified test counts and artifact identity.
