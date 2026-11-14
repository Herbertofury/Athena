# Source RGB mixing in the native scene

The optional `palette` component adapts reviewed MIT `prototype-v24.ts`
`applyThemeMix` interpolation: each RGB channel is linearly interpolated and rounded
exactly as the source. Native catalog colors are the inputs, not a claim that
source and native theme palettes or assets are identical.

Apply changes only the first three `--foundry-color-*` properties on the Foundry
scene. No document-root CSS, provider, network, schema, saved room, Undo history or
settings are modified. The fourth native background color remains unchanged.
Same-theme redraws retain the active session mix. Switching themes, Restore,
unmounting or reloading clears it. Disable with `foundryModules.palette=false` or
`--disable-foundry-module palette`; ordinary room authoring remains available.

Tests compare every output channel against the actual reviewed source function at
multiple blend fractions, reject invalid input without replacing the prior mix,
and prove module independence and layout immutability. Chromium checks the actual
computed scene background changes, document-root styles and localStorage do not,
and reload restores the base palette. This is not persisted palette migration or
full original visual parity.
