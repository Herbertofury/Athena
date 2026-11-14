# Native inspector docking

Adds left/right/hidden inspector placement to the native Foundry workspace. Preferences persist in the validated workspace envelope and all-room backups, participate in undo/redo, and restore after reload. Older envelopes default to right. Invalid view state is recovery-held; unknown fields are stripped. Narrow screens stack the inspector below the scene for visibility. No private content, source deletion, floating-window or full cinematic parity claim.

Tests cover legacy compatibility, validation, recovery hold, rollback, backup restore, remount and hosted Chromium layout/reload behavior.
