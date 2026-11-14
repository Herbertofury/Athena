# Selected object shortcuts

Native Foundry supports the reviewed MIT prototype-v24.ts keyboard bindings (original bindObject and document keydown): Ctrl/Command+D duplicates the selected instance; Delete removes it. The existing native controls remain authoritative, including the 100-instance bound, stable instance identity, current format upgrade, saved layout and one-step Undo/Redo.

This is a scoped adaptation, not a copy of the original document-global listener. Only events originating inside the mounted Foundry workspace are handled. Inputs, selects, textareas, editable descendants and ARIA text editors keep their own shortcuts, including shadow editor paths. Composing, repeated, previously handled, Alt and extra Shift combinations are ignored. Backspace is not Delete. Disabled controls are never activated. Disposing or aborting the optional `objectKeys` module releases its listeners; turning it off leaves buttons and independent `historyKeys` operational.

Native selection defaults to the first instance when needed. Native position pins are not original object locks; this module preserves the existing native Duplicate/Delete button semantics rather than inventing a new lock contract. It does not add original physics, context menus or asset fidelity.

Validation: Node event/lifecycle/independence tests and `scripts/test_foundry_object_keys_browser.cjs` exercise real browser instance counts, saved state after reload, Undo/Redo, editor isolation, outer navigation and remount ownership. No original user records, media or private fixtures are used.
