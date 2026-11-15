# Native Foundry profile and integration tests

Build the repository store, then run the relocated tests:

```sh
cargo build --locked --manifest-path crates/athena-foundry-store/Cargo.toml
npm ci --ignore-scripts
npm run test:foundry-native
```

The bridge defaults to this repository's `dist` assets. Start it explicitly with `python3 native/foundry/bridge.py --binary <built-store> --database <selected-database>`. It is a local-only profile, not a public network service. No private database or machine configuration is bundled.

Tests use repository fixtures and OS temporary directories. `ATHENA_FOUNDRY_STORE_BINARY` may select an explicitly built store; otherwise they use `crates/athena-foundry-store/target/debug/athena-foundry-store` (with `.exe` on Windows). Node modules resolve from the repository package, not another checkout. Bridge HTTP tests require local loopback capability.

Historical-binary compatibility tests in the Rust crate are separately marked ignored and require the matching previous-version binary through their documented `ATHENA_FOUNDRY_OLD_*_BINARY` variable. Normal current-writer migration/read-only assertions remain active. Run each historical test explicitly with `cargo test --manifest-path crates/athena-foundry-store/Cargo.toml --test <suite> <historical-test> -- --ignored` after supplying that fixture binary. A normal test run does **not** establish those old-writer results; never substitute the current binary for the historical one.

## Optional historical compatibility inputs

| Test suite | Environment variable |
| --- | --- |
| `appearance` | `ATHENA_FOUNDRY_OLD_INSTANCES_BINARY` |
| `environment` | `ATHENA_FOUNDRY_OLD_SCOPES_BINARY` |
| `filters` | `ATHENA_FOUNDRY_OLD_APPEARANCE_BINARY` |
| `instances` | `ATHENA_FOUNDRY_OLD_TARGETS_BINARY` |
| `origins` | `ATHENA_FOUNDRY_OLD_FILTERS_BINARY` |
| `scopes` | `ATHENA_FOUNDRY_OLD_TRANSFORMS_BINARY` |
| `targets` | `ATHENA_FOUNDRY_OLD_ENVIRONMENT_BINARY` |
| `transforms` | `ATHENA_FOUNDRY_OLD_PRIVATE_OUTPUT_BINARY` |

These inputs are executables built from the matching historical source checkpoints, not the current store. They are deliberately not bundled. An omitted historical input is visible as an ignored test, not a compatibility pass. The historical cinematic cleanup reproduction is different: its small source-owned adapter fixture is retained byte-for-byte with a digest, and runs in the normal Node suite with an injected renderer.

### Explicit local video routing
Choose a local file, then click **Route to selected visible object**. Its single player replaces procedural object artwork; pointer-inert video leaves the label and authoring controls available. Controls remain in the local video section. **Return to preview** detaches routing. Filenames, bytes, object URLs and routes are never saved.

Routing captures exact theme/room/instance identity. Inspector selection alone never retargets it. Redraw retains identity; filtering, hiding, deleting or leaving its room pauses and parks video in preview with explicit unavailable status. Returning the same target may reattach but never invokes Play. Replacement, close, abort and unmount remove layers, restore artwork and release owned URLs. Late play rejection cannot overwrite a later unavailable outcome.

Source basis: reviewed MIT Feature Foundry src/media/MediaSurfaceController.ts loadFile/renderPlayers/toggle and TV routing. Bounded adaptation, not full TV/provider parity: no original global selectors, duplicate players, autoplay, remote URLs, account grants, arbitrary DOM routing or artist assets. One native video is moved, never cloned. No schema or static allowlist changes.

Tests cover mounted Foundry selection/room changes, redraw/filter/delete/Undo, unchanged authoring data, no autoplay, single-player ownership, replacement/abort cleanup and pending-play rejection. DOM tests are not browser codec/playback or visual acceptance; real browser rendering remains unverified.

Actual Chromium regression is available separately (requires an already installed Playwright browser and an explicitly supplied synthetic fixture):

    ATHENA_LOCAL_VIDEO_FIXTURE=/absolute/synthetic.webm CHROMIUM_PATH=/absolute/chromium ATHENA_BROWSER_OUTPUT=/private/test-output node scripts/test_foundry_video_routing.cjs

Run from the repository root. The loopback-only test rejects outside requests and never bundles/uploads the selected file. It checks real metadata, no autoplay, visible routed player above hidden procedural artwork, retained label, explicit trusted playing, filter pause/reappearance without autoplay, preview restoration and close cleanup. A Linux Chromium141 run passed with the existing synthetic160x90 VP8 WebM; the screenshot was visually inspected. This establishes this fixture/codec/browser path, not every codec, Windows or full original media parity. Initial test-only shadow-root and offscreen computed-style assumptions were corrected; rendering assertions scroll the actual target into view.
## Windows and real-browser acceptance

The native CI matrix runs on Ubuntu and Windows. It builds the Rust executable on that OS, runs native store and real HTTP integration checks, then runs `node scripts/test_foundry_native_browser.mjs` with Playwright Chromium. The browser check uses a new synthetic database, actual UI save/restore, a fresh browser context, native conflict protection and navigation. It retains a report and screenshot per OS, blocks external browser requests, and deletes only its own temporary synthetic database. `ATHENA_FOUNDRY_PYTHON` can select the installed Python command (default `python` on Windows, `python3` elsewhere).

A passing hosted Windows job verifies this local browser/bridge/executable profile on the runner. It does not verify a packaged desktop installer, the user's PC, original private database migration, all renderer/media behavior, or source-repository retirement. Missing or failed Windows runs remain open acceptance gates.

### Original semantic room metadata (read-only)

The independently removable `semanticRoom` component accepts an explicitly selected local
`ff-room-semantic-state` JSON export. It displays source labels, roles, action descriptions,
visibility/lock flags and optional extracted `atlasId` as **recorded metadata**, not verified
meshes, working actions, physics or navmesh. Source contract: original MIT Feature Foundry
`src/prototype-v24.ts`, `roomStateSnapshot`/`saveRoomSemanticState` (lines 661/675),
initial schema lines 144–156. The original `scanRoomPipeline` is simulated and is not ported.

No browser storage, native schema, mesh import, provider request or upload is involved.
The session export preserves original file bytes, including UTF-8 BOM/whitespace. Unknown
fields, ambiguous duplicate JSON keys, invalid UTF-8, duplicate object IDs, invalid references
and oversized structures fail closed; the previous accepted snapshot remains available.
Limits: 1 MiB, 500 objects, 64 action labels per object, bounded strings/nesting. This is not
lossless semantic migration. Close/unmount releases the export URL and pending reads are fenced.
Disable independently with `--disable-foundry-module semanticRoom` in the native launcher.

Synthetic real-browser regression: `node scripts/test_foundry_semantic_browser.cjs`.
Set `CHROMIUM_PATH` if using a separately installed official Chromium. Results go to
`browser-results/foundry-semantic-room` unless `ATHENA_BROWSER_OUTPUT` is set.

The cross-platform browser acceptance also terminates the idle bridge process after a completed save, relaunches it against the same synthetic SQLite file, and restores time/rotation/origin in a fresh browser context. It compares exact database bytes and committed backup before/after restart, then exercises a stale-writer conflict after relaunch. This is process-restart acceptance of already committed writes, not interrupted-write, OS crash, power-loss, installer or private-data migration proof.

### Explicit blend-mode authoring (JSON 11 / SQLite 14)

The inspector now supports the original nine `transformBlend` modes from reviewed MIT
Feature Foundry `index.html:330` and `prototype-v24.ts` (`setSelectedBlend`, transform
serialization): normal, multiply, screen, overlay, soft-light, hard-light, difference,
color-dodge, luminosity. No arbitrary CSS values are accepted. Each authored instance has
its own `blendMode`; Foundry surfaces isolate compositing from unrelated application controls.
Original artwork/backdrop equivalence is not asserted, and the offline original converter
still refuses nonnormal modes where equivalence has not been demonstrated.

Applying a blend explicitly adopts layout/workspace JSON 11. Existing formats remain readable
and are not silently rewritten. Normal is inserted only by explicit upgrade/edit; duplicate,
Undo/Redo, named layouts, history recovery and imports retain the authored value. Room reset
retains format 11 with normal defaults and is undoable; environment configuration is preserved.

A local schema13 store requires an operator-run `athena-foundry-store upgrade-blend-modes DB`
and bridge relaunch before JSON11 saves. This transactional marker migration validates active
backup and revision integrity without rewriting their JSON; it fails closed on corruption.
Earlier schema13 binaries refuse the schema14 database, preventing an older writer from
silently replacing newer authoring data. Keep an independent backup before any explicit upgrade.

`node scripts/test_foundry_blends_browser.cjs` checks actual Chromium overlap arithmetic with
synthetic flat-color authored objects, all9 computed blend modes, unrelated controls and Undo.
It does not establish original asset fidelity or Windows game-runtime acceptance.

## Environment reduced-motion preference

Environment motion remains explicit and session-only. `prefers-reduced-motion: reduce` disables its Start control and prevents synthetic starts; a new reduce preference cancels active frames while retaining static configuration and the current painted frame. Clearing the preference never resumes motion automatically. Abort/dispose removes the preference listener. Static-only/off/unavailable-renderer status remains unchanged when no motion controller exists.

This is consistent with original `prototype-v24.ts` cinematic reduced-motion behavior (lines 1548, 1565, 1606 and 1666), with dynamic preference handling matching Athena ecology. It is not complete original governor parity. Renderer formulas and persisted format/schema are unchanged. Reproduce with `node --test native/foundry/tests/environment-reduced-motion.test.mjs` and `CHROMIUM_PATH=<installed-browser> node scripts/test_foundry_environment_reduced_motion_browser.cjs`.

## Independent layer navigator

`layers` is an optional removable module. Disable it with `--disable-foundry-module layers` in the local bridge startup profile or `foundryModules.layers=false` in the mount context. Core inspector/Undo/persistence do not depend on it.

Adapted from original `prototype-v24.ts` `renderLayers` (line 636), the navigator groups all current instances by actual native world/UI/sticker-anchor surfaces, ordered topmost-first by recorded stack value with exact-ID tie breaking. Hidden, filtered and unavailable-anchor instances remain selectable. Labels use text only and include full instance IDs, including duplicates. Select changes no persistent data/history; Show/Hide explicitly uses existing format-v7 appearance adoption when needed; Pin/Unpin retains the existing format. Each mutation is one Undo step. Native position pin is not original lock, and native world scene is not original left/right world partitioning. No source assets or private records are copied.

Run `node --test native/foundry/tests/layers.test.mjs`; actual Chromium acceptance is `CHROMIUM_PATH=<installed-browser> node scripts/test_foundry_layers_browser.cjs`.

## Optional Canvas-only view

The explicit Canvas only button hides Foundry's surrounding authoring panels while keeping
Athena navigation, the scene, restore control and status reachable. Restore panels or Escape
returns to the same mounted inspector, including unsaved field drafts. Tab retains normal
keyboard navigation. This adapts the clean-view purpose of reviewed MIT
`prototype-v24.ts` (`toggleCleanView`), not its global Tab interception or app-wide chrome.

The independent `canvasView` module can be disabled by the native bridge module configuration.
It changes presentation only: no workspace JSON, SQLite schema, storage write or persisted
preference. Navigation/disposal restores the workspace and a remount starts in normal view.
Object selection still uses ordinary inspector behavior; toggling the view does not save drafts.

Verification: `node --test native/foundry/tests/canvas-view.test.mjs`, mounted workspace and
module-independence tests, plus `CHROMIUM_PATH=<installed-browser> node
scripts/test_foundry_canvas_browser.cjs` for desktop/mobile controls, Escape/Tab, draft retention,
unchanged local storage and route teardown. Synthetic browser checks do not establish original
asset fidelity, Windows installer acceptance or completion of remaining migration gates.

## Selected base-box Center and Fit

The inspector adapts original `prototype-v24.ts` `centerSelected`/`fitSelectedToView` (lines 304–305), using native normalized surfaces rather than original viewport-pixel coordinates. Center sets the untransformed base-box center to 50%/50%; it does not center a rotated/skewed silhouette. Fit separately uses the resolved native surface client dimensions and actor offsetWidth/offsetHeight: scale magnitude `clamp(min((width-24)/max(baseWidth,baseHeight), (height-24)/max(baseWidth,baseHeight)), .05, 3)`, preserving each mirror sign. This is the original approximate square-base formula, not guaranteed transformed-bounds containment.

Both actions refuse pinned, hidden/filtered, zero-size or unavailable targets without relocation. Identity, scope/anchor, origin, rotation and unrelated fields remain unchanged. Center retains format; Fit explicitly adopts existing format v2 when necessary. Each actual edit is one Undo; no-op leaves pending inspector drafts and history untouched. No database/schema changes or automatic unpinning.

Tests: `node --test native/foundry/tests/center-fit.test.mjs`; actual Chromium: `CHROMIUM_PATH=<installed-browser> node scripts/test_foundry_center_fit_browser.cjs`.

## Scoped history keyboard shortcuts

The independent optional `historyKeys` module adapts original MIT `prototype-v24.ts`
history Undo/Redo shortcuts into the native workspace. Ctrl/Command+Z undoes;
Ctrl/Command+Shift+Z or Ctrl/Command+Y redoes, using existing enabled history buttons.
Only events within Foundry are handled. Inputs, selects, textareas, contenteditable
and ARIA editor islands retain their own editing shortcuts. Already consumed events,
Alt combinations and IME composition are not intercepted. Navigation/abort removes listeners.
Disable `historyKeys` independently without disabling ordinary Undo/Redo or authoring.

This changes neither persisted formats nor history semantics. Reproduce focused tests with
`node --test native/foundry/tests/history-keys.test.mjs` and actual browser acceptance with
`CHROMIUM_PATH=<installed-browser> node scripts/test_foundry_history_keys_browser.cjs`.
It is not an app-wide shortcut takeover or complete original Foundry parity claim.

## Optional selected transform gizmo

`gizmo` can be disabled independently with `--disable-foundry-module gizmo`; inspector controls remain available. Explicit Enable exposes pointer Rotate/Scale handles for the current visible unpinned instance. This adapts original MIT `prototype-v24.ts` bindTransformGizmo (311–320), not original artwork or source lock semantics. No source snapshots are imported.

A computed 2D matrix and all four base-box corners recover the actual transform-origin pivot, including native skew, mirrored scale and all nine origins. Unsupported ancestor transform/zoom/perspective, degenerate matrices or inconsistent measured bounds refuse edits. Rotation uses angle delta around that pivot. Radial scale preserves anisotropy and mirror signs, constraining the shared ratio so both resulting magnitudes remain 0.05–8. Optional snap is 15 degrees / 0.05 scale-ratio increments; Alt bypasses it. Ratio snapping is a deliberate bounded adaptation, not original independent-axis rounding.

Preview changes only transient object CSS. Completed pointerup validates exact theme/room/instance/prior placement, explicitly adopts existing format2 only when necessary, and writes one Undo entry. Pointercancel, capture loss, Escape, selection change, draw, scrolling, resizing or disposal cancel without saving preview. Position, scope, anchor, filters, origin, other objects, presets and environment remain unchanged. Native pin prevents editing; it is not the original lock field.

Tests: `node --test native/foundry/tests/transform-gizmo.test.mjs`. Actual browser: `CHROMIUM_PATH=/path/to/headless_shell node scripts/test_foundry_transform_gizmo_browser.cjs`; uses neutral native DOM and proves skewed bottom-right-origin mirrored rotation, radial scale, cancellation and Undo/Redo. Not Windows or original-art rendering acceptance.

### Optional session history navigator

`--disable-foundry-module sessionHistory` removes the navigator without removing core Undo/Redo. Adapted from reviewed original `prototype-v24.ts` functions `jumpHistory` and `renderHistory` (632–634), it lists retained past/current/future workspace states and restores one selected state in one host-save attempt. Entries show native theme/room IDs and chronological ordinals, not fabricated original action labels or timestamps. This is session-only, not SQLite recovery history. It preserves future Redo, existing count/character pruning, whole-workspace identity, and oversized recovery-only behavior. Stale entry epochs are refused. Unsaved inspector inputs are not snapshots; selecting another state replaces those inputs, while the current disabled entry does nothing. No original assets or user records are included.
### Original semantic metadata authoring

The independently removable `semanticRoom` module accepts explicitly selected, bounded local snapshots. The original UTF-8 bytes retain their separate exact export. An explicit Apply changes only the chosen unique record's role, physics classification, visible flag and mapping-lock flag, adapted from original `prototype-v24.ts`684–685 and the enums at `index.html`410. Existing unsupported classification strings remain unchanged unless the user deliberately chooses a supported replacement. Names may repeat; IDs identify records.

These are recorded declarations, not executable physics, mesh visibility, permissions or verified room capabilities. No source files, browser storage or native layout are modified. Derivative JSON export is explicit and separately named. Undo/Redo retains at most50 field patches and256KiB of conservative UTF-16 patch data, not50 whole1MiB snapshots; previous source bytes and one working record set remain separate. No-op Apply retains Redo. New successful file selection or Close clears edit history; edits invalidate pending reads and prior derivative URLs. All values remain private local session data.

### Optional local PNG backdrop

`localImage` is independent and removable through `--disable-foundry-module localImage`. Source prototype-v24.ts639–640/690 loads a local image and stretches it across its selected surface. This bounded native slice supports preview and explicit current-room backdrop only, not actor routing, arbitrary targets, remote URLs or source global wallpaper. PNG is the only accepted format:8MiB maximum,8192px per axis,16MP total. Header dimensions and bounded chunk order are inspected before browser decode; APNG and unknown critical chunks are refused. Browser decode still validates actual pixels, with exact IHDR dimension agreement. Pending decoders lose their source on replacement/close/disposal and have a15-second timeout. CRC validation is delegated to the browser decoder.

No file paths, bytes or route settings are persisted/uploaded. Explicit routing preserves theme/room identity and never silently retargets after navigation. An occupied procedural backdrop is not replaced: the PNG returns to preview and must be explicitly routed after that backdrop is disabled. Source-style stretch may distort aspect ratio; preview contains the image. Image layers are pointer-transparent and behind authored actors. Failed replacements retain last-good imagery; cancellation, replacement and disposal release owned BlobURLs. No animation, provider access or rendering superiority is claimed.

## Current-theme object catalog

Optional `assetLibrary` (`--disable-foundry-module assetLibrary`) adapts original MIT prototype-v24.ts bindAssetCards233 and spawnObject338. It exposes all reviewed objects in the active theme, even after every room instance has been deleted. Explicit Add generates a new UUID, creates an unpinned world-center instance and selects it for ordinary inspector editing. No cross-theme assets, source artwork, gravity, source left/right-world parity or downloads are claimed.

Adding explicitly adopts existing format6 for older rooms and supplies only the appropriate defaults for formats6–11. Existing objects, room data, presets and environment targets are retained. A dangling target is never repaired by reusing its deleted ID; UUID/current-target collisions fail. The room cap is100 instances. One addition creates one Undo step. Catalog selection/update is not a persistence operation, and removed/stale room buttons cannot add to the next room.

Tests: `node --test native/foundry/tests/asset-library.test.mjs` with the current native CLI via `ATHENA_FOUNDRY_STORE_BINARY`; includes actual mounted add/edit to SQLite save/reopen. Actual Chromium: `CHROMIUM_PATH=/path/to/headless_shell node scripts/test_foundry_asset_library_browser.cjs`, using neutral catalog objects and no external requests.

## Native soundtrack library

`athena-foundry-store list-native-soundtracks SELECTED.sqlite3` returns all stored bookmark records in deterministic `(theme_id, room_id)` order. Each entry uses the same `{value, version}` contract as the existing per-room read, preserving source provenance and exact optional milliseconds. A single read transaction covers enumeration and validation, so concurrent writers cannot produce a mixed-generation library. Schemas4–15 are supported; older schemas require explicit upgrade, not automatic migration. Empty is `[]`. More than1000 records or any invalid record fails the complete operation rather than returning a partial library. This is not a pagination API.

The existing local profile also exposes `GET /__native/soundtracks`, requiring the same native header/host/origin admission as per-room metadata. Query parameters are not accepted. Existing4MB response and15-second subprocess limits remain. The endpoint is read-only and opens no provider/player. Public Pages do not call it. No settings, capabilities, sign-in or network permissions are expanded.

This enables native cross-room library access without knowing each room in advance. It does not yet add an app-wide library panel, provider search, playback, or source-deletion readiness. Stored URLs/labels are private local metadata and should not be published.

### Clear one local soundtrack assignment

The native CLI accepts `compare-clear-soundtrack DATABASE` with JSON stdin containing exactly `expected`, `theme_id` and `room_id`. Obtain the current room token with `read-native-versioned` first. The authenticated local bridge exposes `POST /__native/clear-soundtrack` with body `{ "theme_id": "…", "room_id": "…" }` and the same Host/Origin/native-header/JSON framing checks and `If-Match` token requirement as assignment writes.

This is an explicit local configuration removal, not an automatic cleanup. A matching token removes only that room's bookmark and returns `null` with the new ETag; stale tokens return HTTP409 without changes. A repeated clear with the current empty token is a no-write success. Unknown rooms and unsupported schemas are rejected. Schemas4–15 are supported without an implicit upgrade. Other rooms, workspace layouts and external providers are not changed. This operation does not sign out, revoke grants, delete remote media or stop an already-playing player.

There is no new UI control in this pass. Consumers should retain/export the old assignment before requesting removal if they want to undo it; workspace revision history is not a soundtrack-undo log. Only invoke on an explicit user action, never as a background migration side effect.

Synthetic acceptance uses the actual Rust executable through the bridge handler for schema4 and15, including wrong origin, missing token, stale token, malformed request, successful removal, unchanged unrelated room and idempotence. Transport is in-memory, not an owner-device/browser test. A Rust regression also verifies closed/reopened persistence and unknown-room refusal. The initial Python fixture assumed every schema-upgrade command emits JSON; commands with empty stdout exposed that harness assumption, corrected before final tests. No product validation was relaxed.

## Portable native profile, independent of the checkout

Build the store from reviewed Athena source first, then explicitly supply its
SHA-256 and platform. This builder copies **only unchanged published allowlisted
runtime files**, the existing bridge, launcher and selected executable. It does
not change the runtime allowlist or include any database, token or user profile.

```sh
python3 -B scripts/package_native.py --source dist --binary /path/to/athena-foundry-store --binary-sha256 VERIFIED_SHA256 --platform linux --output /new/portable-athena
python3 /new/portable-athena/launch.py --verify-only
python3 /new/portable-athena/launch.py --database /private/existing-athena.sqlite3
```

For Windows use `--platform windows`, the compiled `.exe`, and `python` where
appropriate. Python 3.11+ remains required; this is not a standalone installer or
bundled Python distribution. The launcher prints a loopback URL to open manually;
it does not open a browser, install software, sign in, start automatically,
create/upgrade a database or change security settings. The supplied database must
already exist **outside** the bundle. Existing bridge admission/schema rules apply.
Ctrl+C closes the bridge. All authored changes occur only through existing app
operations against that explicitly selected database.

Before launch, every packaged file is checked for exact size/hash and inventory;
unlisted files (including accidentally copied databases), symlinks, corruption,
missing files and platform mismatch refuse. `--verify-only` never executes the
binary or opens a database. The integrity manifest is not a signature or proof of
binary authenticity: obtain the executable from your reviewed build, not an
unknown download. Checks do not protect against hostile concurrent file mutation.

Destination creation is exclusive. A packaging I/O failure may leave a partial
**new** output directory for inspection; it never replaces an existing destination.
Keep data outside the bundle and rebuild into a new directory for an update. No
original repository, historical source, private backup or input file is removed.
The native browser harness now runs its complete synthetic editing, persistence,
conflict and restart flows through this portable launcher outside the checkout on
hosted Windows/Linux; this remains distinct from the owner's installed desktop
acceptance and complete source-repository retirement.

Retained acceptance failure: initial portable-native run `43707165315` passed the
complete Ubuntu browser flow, while Windows refused runtime hashes during Python
package tests before reaching browser launch. Windows checkout line-ending
conversion changed runtime bytes. `.gitattributes` now preserves `dist/**` as
exact Git blob bytes on checkout. No hash check was weakened and no published
runtime asset or allowlist was rewritten to accommodate altered bytes.

### Explicit first-run creation

For a new installation, create a separate new database without manually invoking
the store's migration sequence:

```sh
python3 /new/portable-athena/launch.py --create-database /private/new-athena.sqlite3
python3 /new/portable-athena/launch.py --database /private/new-athena.sqlite3
```

Creation is explicit and separate from launch, verify-only and opening an existing
store. It runs the bundled native init/upgrade sequence in a private temporary
sibling directory, checks schema15 and integrity, then publishes through an
exclusive hard link. Existing destinations, symlinks, paths inside the bundle,
missing parents and unsupported hard-link filesystems refuse. No fallback rename
or overwrite occurs. Failed setup removes only its owned staging directory;
original files and any destination created concurrently remain untouched.

Each native step has a15-second deadline. The supplied executable must still be
trusted reviewed code; hashes do not sandbox it. This creates a fresh empty
workspace with catalog metadata, not a migration of old user data. Existing DBs
are never upgraded automatically. POSIX private-file modes originate from the
native creator; Windows ACL privacy and sudden-power-loss publication durability
remain separate acceptance concerns. Synthetic regressions cover actual native
creation/reopen, timeout cleanup, concurrent destination, unsupported hard links
and path refusal. Hosted UI acceptance uses this explicit first-run command.
