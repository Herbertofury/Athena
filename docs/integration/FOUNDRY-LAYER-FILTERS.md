# Native layer navigation filters

The retained source `feature-foundry/source/src/prototype-v24.ts` `renderLayers`
exposes authored identities, visibility and lock controls in grouped lists.
Athena's native layer navigator already retains hidden/scene-filtered instances,
position pins and unavailable anchors. This adds native usability for up to 100
instances, not a claim that the original source had these exact filters.

Search matches all whitespace-separated, case-insensitive terms across displayed
name, instance identity and anchor. Surface and state filters compose with search.
The state choices include hidden, visible, pinned, unavailable-anchor and filtered
from scene. “Visible” means the authored visibility flag, not actual on-screen
visibility or opacity. Clear restores the full list without changing selection.

These controls are session-only list presentation, not saved workspace state,
scene filters, selection changes or history entries. Selected instances outside
the filtered list remain selected with an explicit status message. Edits update
the list immediately; Undo can bring a hidden row back. Filters persist across
room changes during the mounted session and reset when leaving the workspace.
All authored instances and source data remain retained. No new schema, private
records, network requests, retirement or source deletion.

Verification: `node --test native/foundry/tests/layers.test.mjs`; actual Chromium
acceptance extends `scripts/test_foundry_layers_browser.cjs` now wired to the hosted
Windows/Linux native workflow. DOM tests do not establish rendered acceptance.
