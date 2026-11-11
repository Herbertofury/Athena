# Feature Foundry build record

## Authority

- Visual and product contract: `reference/feature-foundry-living-world-prototype-v24.html` plus the Frutiger Aero and Frawgy reference images.
- Runtime catalog: verified V33 theme-world package artifact, SHA-256 `83aac630afa4e6522d28452bb6a7c0ebe183eee6812b89b6d742662876af06ec`.
- Artist worlds: current v4.0.1 authority JSON, SHA-256 `9865ef491c5baeec39702a0a6724df1bf9c9a29ed062a30e6bb6af270dd6b00a`.
- V33 is the active runtime line: 17 approved themes, 17 worlds, 34 rooms, 17 weather systems, and 85 ecology objects. The older 16-theme/80-object summary is not used as runtime authority.

## Completed

- Cleaned 47 legacy top-level workspace targets, including millions of build/cache files, and replaced them with one standard private Git repository.
- Preserved the canonical V24 body, CSS, runtime, wording, classes, data attributes, and behavior under an exact source-contract test.
- Built the TypeScript 7 + Vite 8 + Three.js premium runtime and the Tauri 2 + Rust + bundled SQLite native application.
- Built live Frutiger and Frawgy Three.js worlds with water, shader sky, particles, reflections, volumetric light, parallax, weather/time response, interaction pulses, ornamental architecture, frogs, and a procedural royal Frawgy buddy.
- Added Theme Atlas for 17 exact V33 packages plus 10 exact current artist worlds without merging authority lanes.
- Added the exact V33 ecology actors, draggable/throwable physics, selection, keyboard movement, behavior reactions, and media/music affordance routing.
- Added Living Screen Studio with local video, direct HTTPS media, privacy-enhanced YouTube, real TV mirroring, and an animated procedural idle channel.
- Added Music Hub with six exact providers, per-theme/per-room persistence, exact curator-route statuses, Spotify PKCE/account/playback controls, Apple Music MusicKit authorization, and truthful external adapters.
- Added desktop-correct Spotify dynamic loopback OAuth, native world snapshots, SQLite catalog seeding, soundtrack assignments, history, and diagnostics.
- Split production bundles into application, world catalog, Three.js, and Tauri runtime chunks.
- Passed V24 contract, data authority, TypeScript, Rust, production build, and 1536×1024 browser interaction/screenshot verification.

## Released

- Main source: https://github.com/Herbertofury/Feature-Foundry
- Tagged release: https://github.com/Herbertofury/Feature-Foundry/releases/tag/v24.0.0
- Complete Google Drive release folder: https://drive.google.com/drive/folders/1eU95XQZNq-3mc9HvY08JbClSBTu7tXYY
- Published artifacts: complete bundle, source bundle, web build, Windows x64 MSI, Windows x64 NSIS installer, and SHA-256 manifest.
- Windows artifacts are release-optimized but not Authenticode-signed; Windows may show a publisher/reputation prompt.
