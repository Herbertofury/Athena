# Native object inspector

Adds explicit object selection, shape/role detail, precise normalized X/Y percentage inputs and pin controls to Athena native room authoring. Scene focus/click and keyboard/drag changes synchronize the inspector. Valid edits reuse validated layouts, rollback, backups and recovery hold; invalid/empty/out-of-range values never write. Theme changes select an allowed object. No private provenance, creator media or account state is copied.

This is object-inspection parity, not a claim of completed dockable/floating panels, cinematic rendering, native SQLite or full source parity. Tests cover atomic edits, pins, bounds, selection and rollback; hosted Chromium tests exercise the actual controls. Legacy source remains preserved.
