# Athena workspace contract

Athena is one application with one shell, identity, navigation, search control and theme. Learning, engineering research, media validation and feature work are workspaces inside it. Preserved source trees and history are provenance, not a substitute for integration.

## Ownership during integration

- Shell/learning: `dist/index.html`, `dist/app.js`, `dist/styles.css`, `dist/workspace-host.js`, learning catalog/build/test files.
- Engineering adapters: `dist/workspaces/engineering/` and their scoped tests, owned by the Atlas migration workstream.
- Foundry adapter: `dist/workspaces/foundry/` and its scoped tests, owned by the Foundry migration workstream.
- Existing `engineering/`, Foundry preserved source and `migration/` stay with their respective migration owners.

No iframe, external-tab handoff or second app homepage counts as workspace parity. A workspace may use Shadow DOM to isolate reused styles/IDs while remaining in the same document and shell.

## Module interface

Each module exports `async mount(context)`. Context contains:

- `container`: a fresh, connected DOM element dedicated to this mount.
- `search`: current shell search string.
- `theme`: `dark` or `light`.
- `signal`: an AbortSignal. Stop pending work/listeners when aborted.
- `notify(text)`: the shared status/toast channel.
- `state`: previously retained plain-JSON workspace settings, or undefined.
- `setState(value)`: retain a plain-JSON settings object locally (250,000-character limit per workspace); no upload.
- `route`: complete current hash, including query parameters.
- `navigate(route, {replace: true})`: navigate to an internal Athena hash route, including query parameters. Replace mode changes same-document history without stealing focus. Do not replace the whole document.

Return an object with `unmount()` and, when applicable, `setSearch(query)`, `setTheme(theme)`, `setRoute(fullHash)` and `exportState()` for a plain-JSON settings snapshot. Exported settings are retained on teardown. Methods may be asynchronous. The host serializes forwarded search/theme/route updates so a slower older update cannot overwrite newer intent. On teardown it aborts the signal, waits for the current update to settle, exports settings, then unmounts. Adapters must honor cancellation to avoid a stalled teardown. A late completed mount is immediately unmounted if navigation has moved elsewhere. It must never write outside its dedicated container. Remove document/window listeners, observers, workers, object URLs and media when unmounting. Keep autoplay off.

Expected shell entry modules:

- `dist/workspaces/engineering/research/index.mjs` for `#research`
- `dist/workspaces/engineering/media/index.mjs` for `#media`
- `dist/workspaces/foundry/index.js` for `#build`

Module code must resolve internal assets relative to `import.meta.url` (or an equivalent explicit module base), not the page's current URL. This supports a repository subpath, static local server and the combined deployment. User/provider links remain explicit and permission-aware.

## Search, storage and exports

The shared search control searches the active workspace. Learning search retains certificate and lesson results; adapters reuse their existing domain search logic. Workspace-specific filters, comparison, exports and evidence controls stay available. Search scope is visibly labeled.

Existing storage must remain readable without silently deleting or replacing it. Learning progress import/export is explicitly labeled as learning-only until a versioned whole-Athena archive contract exists. Research CSV/test-plan exports and Foundry workflows must keep their original meaning. No state is uploaded automatically.

## Required parity evidence

Record the source revision, preserved feature, new module action, test, result and untested boundary. Cover navigation away/back, pending-load cancellation, duplicate mount prevention, keyboard/focus, search, theme, original persisted state, exports and resource cleanup. Synthetic fixtures, DOM emulation, real-browser tests and actual backend/game activity must be labeled separately.

Missing backend access or unsupported runtime features stay visible as pending capabilities. Do not claim a source import, a working menu, or a browser-like test proves full functional parity.

A workspace with URL-based filters implements `setRoute(fullHash)` so same-workspace Back/Forward navigation restores filter state. It must not install its own global hashchange/popstate handler.

## Runtime publication boundary

`scripts/package_app.py` refuses to package missing modules, unexpected files, changed hashes, symlinks, hidden files, generated-path collisions or an existing output directory. Its `--allowlist` is an explicitly reviewed JSON object with `schema: 1` and `files: [{path, sha256}]` covering every runtime input byte. The allowlist is not permission: private source must receive the required public-publication approval before it enters any public package. Do not generate an allowlist blindly from a private tree.

Saved workspace state is read after previous export/cleanup completes, so quick navigation back does not resurrect an older snapshot. Failure cleanup uses the same serialized disposal barrier as normal navigation and never clears a newer active workspace. Learning handlers are scoped to learning controls and the lesson dialog; light-DOM adapters may safely use their own action attributes.
