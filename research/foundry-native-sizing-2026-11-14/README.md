# Native inspector panel sizing

Adds a keyboard-operable width control (180–480px requested, fitted to at most45% of available desktop space). Width persists with dock, all-room backups, reload and undo/redo. Mobile remains one column. Legacy envelopes default to240px; invalid sizes remain recovery-held. New sizing cancels older imports. This implements actual native panel resizing, not floating panels, cinematic rendering, SQLite or full source parity. No account or media requests, autoplay or private catalog changes.

Retained local failure: initial focused run passed39/40 because the existing view assertion lacked the new backward-compatible width default. Updated the expected full sanitized view; unknown-field stripping assertions remain.

Independent review caught native range sanitization for imported integer widths not divisible by10. Slider step now matches integer schema (1px); hosted coverage restores241px and verifies remount, control value and actual geometry.
