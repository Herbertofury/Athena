# Foundry inside Athena

Foundry is the native `#build` workspace in Athena's navigation, not an iframe or a second application. Learning and Engineering remain independently usable. The integrated authoring code includes versioned room layouts, separate transforms/origins, object instances, scoped placements, appearance/filters, environment controls, presets, Undo/Redo and optional cinema/weather/ecology/local-video adapters. Disabling an optional adapter does not disable ordinary authoring.

## Browser and desktop capabilities

The public static app supports browser/file authoring. Native SQLite saves, recovery and reviewed import require the explicit local Python bridge and a locally built Rust executable. Public Pages does not run that server or automatically connect to a database. The loopback bootstrap is inert on HTTPS/public hosts. No automatic provider login, playback, import or schema upgrade occurs.

```
cargo build --locked --manifest-path crates/athena-foundry-store/Cargo.toml
crates/athena-foundry-store/target/debug/athena-foundry-store init /path/to/new-store.sqlite3
python3 native/foundry/bridge.py --binary crates/athena-foundry-store/target/debug/athena-foundry-store --database /path/to/new-store.sqlite3
```

Use your platform's `.exe` filename on Windows. Choose a new database path, never an original source database. The server prints its loopback URL. Existing databases require explicitly reviewed version upgrades; a refused old schema is not permission to overwrite it. Preserve a verified backup first. The store supports schema 13 and authoring JSON version 10; old formats remain explicitly versioned rather than silently coerced.

Native save/recovery uses optimistic snapshot tokens and SQLite transactions. Conflicts retain browser edits; there is no blind retry. Recovery history retains at most 50 entries, not an unlimited provenance archive. Cancellation cannot undo a server write already committed. Selected-room soundtrack links are metadata, not proof of provider access or playback. Local video is explicitly selected and never uploaded by this integration.

## Verification

`npm test` covers Athena and existing workspace contracts. `npm run test:foundry-native` runs portable authoring, DOM and real local HTTP/CLI/SQLite suites after building the store. The dedicated native workflow also runs Rust tests, formatting and strict Clippy. Older-writer compatibility fixtures and exclusions are described by the portable test suite rather than silently replaced with a current binary.

These tests do not certify native Windows installation, all original Feature Foundry functionality, visual equivalence, private data migration, or safe source deletion. Retain Feature Foundry and Engineering-Atlas until their separate retirement gates are verified. No source repository is deleted by this change.

## Publication boundary

Only reviewed application modules, synthetic tests and storage implementation are included. Original private databases/history, local evidence dumps, user data, tokens, compiled executables and checkpoint filesystem paths are excluded. Runtime packaging requires exact path and SHA-256 allowlisting. The local bridge independently restricts static assets and fixed operations; it is not a general filesystem or command server.

## Expanded original environments (JSON10 / SQLite13)

Room and object backdrops now support original procedural Frutiger, Aurora, Ocean, Rain City and Diner at source time zero, alongside existing Vapor and Backrooms. The reviewed MIT `prototype-v24.ts` drawing formulas are reused, with fixed bounded 1000×600 Canvas2D output for new presets. They contain no artist assets, network requests, timers, media or automatic motion. Opacity and horizon remain room configuration. Cosmic, original parallax/camera controls, theme synchronization, animation and custom image/video wallpaper remain outside this slice.

Choosing an expanded preset explicitly upgrades that room's authoring JSON to version10, retaining instances/origins and previous properties; old version1–9 layouts still reject the new enum. For SQLite saves, preserve a verified backup and run `upgrade-environments DB` **after** the existing `upgrade-origins` step, then relaunch the bridge. This validates active and historical records before committing schema13. No startup migration occurs. Old schema12 writers refuse schema13; previous formats remain accepted by the new writer. Cancellation or downgrade is not guessed. Reset and Undo retain the expanded environment format and configuration.

The original drawing-command comparisons and real-browser framebuffer checks prove the bounded static rendition, not complete original living-world behavior, GPU equivalence, live user-data migration or retirement readiness.
