# Native Foundry rollback
Implements the reviewed theme catalog's layout-rollback capability natively in Athena. Undo/redo records validated whole-workspace layouts, including object movement/pinning, theme/room/time changes and imported layouts/backups. A pointer drag is one undo step rather than one entry per pointer event.

History is bounded to 50 snapshots and exists only while the workspace is mounted. A new edit discards the redo branch. Undo/redo invalidates pending import reads; redrawing or losing pointer capture ends a drag. Original corrupt saved state remains recovery-held, including after undo/redo. No source/private artist metadata, account sessions or reference images enter history.

Local gates: 25 focused tests plus full npm regression. Hosted browser adds real multi-step pointer dragging, one-step undo/redo and time-control rollback, along with existing navigation/reload/import/320px visibility checks. Native SQLite, original cinematic rendering and full source parity remain separate pending work. No source repository deletion.
