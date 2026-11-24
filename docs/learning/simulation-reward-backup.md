# Training reward backup

Training missions keep badges separately from the learning journal. The general learning-progress export/import does not include mission rewards. Receipts are evidence exports, not restorable backups.

Use **Export reward backup** and **Restore reward backup** in Training missions for badge portability. Version 1 carries known completed mission IDs; XP is derived from unique IDs. It does not restore active steps, action logs, lesson progress, journals or game unlocks, and is not tamper-proof certification evidence.

Restore adds missing badges only, validates every current known mission record before writing, and refuses unsupported versions, malformed/oversized data, unknown or duplicate IDs and receipts. Existing records and unrelated storage remain untouched. Repeating restore adds no duplicate XP. A quota failure can leave a subset of new badges saved; the UI discloses that and retry is safe. Browser storage offers no multi-key transaction or compare-and-swap; this is not a cross-process atomicity claim. Keep the backup file until restoration is verified.

File reads canceled by navigation or superseded by a newer selection do not apply. Exports combine validated current storage with known session awards. Unreadable current storage stops backup rather than silently exporting an incomplete inventory.

Validation: Node tests cover roundtrip, additive/idempotent restore, version/corruption retention, blocked storage, partial quota recovery and file-read interruptions. The Chromium harness adds a fresh-context download/import/reload roundtrip and rejection cases. No user data loss is asserted by the original static gap; real-browser verification status belongs to the corresponding CI run.
