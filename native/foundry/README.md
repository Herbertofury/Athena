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
