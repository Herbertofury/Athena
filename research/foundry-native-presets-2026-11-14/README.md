# Native named room layouts

Adds up to 20 named local room layout copies (80-character unique names), retained across remount and all-room backup. Opening a preset preserves other rooms; removal is undoable. Old backups default to an empty bank. Restore merges by name and validates the combined bound before mutation. Untrusted labels are text-only, unknown fields stripped, invalid original state remains protected. No private or legacy source content changes.

Acceptance covers bounds, names, immutable copies, persistence, removal rollback, atomic overflowing restores and real Chromium reload. This does not complete cinematic/artist/SQLite/provider or full source parity.

## Retained browser failure
Hosted run 43547855697, head14a3778, artifact14094807190 failed the raw-coordinate drag assertion after the extra controls placed the scene below the viewport. The harness now scrolls the real draggable into view before measuring coordinates; movement and single-step undo/redo assertions remain intact. This failure is retained rather than counted as passed.
