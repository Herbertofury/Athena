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
