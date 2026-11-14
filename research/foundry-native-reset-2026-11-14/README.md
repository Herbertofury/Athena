# Native reversible room reset

Implements the reviewed source safe-reset capability as an explicit native room arrangement action. Resets positions and pins only in the current room, preserving time, other rooms and all source repositories. One undo restores the full prior workspace; repeated reset is a no-op. Pending import reads cannot overwrite a reset, and corrupt saved state remains protected. No source-private data or media enters runtime.

Focused DOM tests cover room isolation, time, undo/redo, repeated clicks, stale imports and recovery hold. Browser regression covers visible pin/position reset and rollback. Full Living World, native SQLite, artist content and provider account parity remain pending.
