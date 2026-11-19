# Native snapshot comparison

A successful backup message describes a past operation, not later browser edits.
The native Foundry backup panel now shows an independent live comparison against
the last explicitly verified native snapshot in this mounted session. Ordinary
edits and Undo/Redo refresh it without another native read or save.

States distinguish unavailable capability, unknown baseline, operation pending,
last explicit check finding no backup, a matching workspace, a differing workspace,
and an invalid/oversized snapshot that cannot safely be compared. Save, restore and
successful native revision recovery establish the baseline. A save with concurrent
browser edits compares against the captured saved version, not the newer draft.
Failed writes/restore and native conflicts invalidate certainty. Merely listing
history does not erase a known baseline. Late completions after disposal do nothing.

Comparison uses the model's canonical encoding, including its existing active-room
normalization. It is conservative: reordered otherwise-equivalent maps can report a
difference. The baseline is bounded by existing workspace validation limits and
lives only in memory. It is not serialized into private data or exported backups.

## Explicit limits and independence

This does not poll or observe other writers. The panel explicitly says another
writer may have changed storage; matching means matching the last verified snapshot,
not current disk state or crash durability. No automatic save, permission request,
network/provider probe, schema change or migration is introduced. Native storage
remains optional; comparison failure is isolated from ordinary editing and explicit
backup. File exports and browser host persistence are separate destinations.

Main was verified as `22aeac716a8bb642e5269fdc8b3c38b99055bad6` and active backup work
checked first. This is separate from held backup prototype #229, saved-revision
preview #209 and the local rename branch. It extends the existing native adapter
contract rather than replacing preserved Foundry source or adopting external code.
Shared-host combinations need exact-tree review and tests.

## Verification boundary

Independent adapter tests cover race/failure/lifecycle transitions and explicit-only
native calls. Mounted tests exercise edit/Undo/Redo/restore; the real app/HTTP/Rust
SQLite test checks matching after save, differing after edit and matching after
native revision recovery. The Chromium harness has matching/edit/Undo/no-write
assertions but local syntax validation is not rendered-browser acceptance.
Windows, rendered-browser and owner-device gates remain open. No repository merge,
deployment, source retirement or private data publication is implied.
