# Feature Foundry — Living World

Feature Foundry is a native, GPU-accelerated living-world studio. It keeps the complete V24 product contract intact while adding a typed premium runtime, real 3D scenery, verified theme databases, native persistence, real media surfaces, and provider-aware room soundtracks.

The maintained application stack is TypeScript 7, Vite 8, Three.js/WebGL, Tauri 2, Rust, and bundled SQLite. The original V24 imperative runtime is preserved byte-for-byte inside a TypeScript compatibility module and protected by an exact source-contract test.

## Product systems

- 17 approved V33 theme packages, 17 worlds, 34 rooms, 17 weather systems, and 85 exact ecology objects
- 10 current artist worlds across Frawgy, Lightweaverart, Dreamrelicc, Karoline Georges, and saveroom
- A permanently animated Three.js world with water shaders, particles, time, weather, reflections, volumetric light, parallax, and music/interaction pulses
- Complete left, center, and right living regions with activity, soundtrack, quick actions, theme selection, room routing, weather, dock, chrome modes, history, and settings
- Draggable and throwable object ecology with restitution, selection, keyboard movement, reactions, media affordances, and room-aware placement
- Mascot registry, direct manipulation, pinning, physics, autonomy, UI awareness, speech, weather/music reactions, and independent behavior controls
- Living Screen Studio for local video files, direct HTTPS media, and privacy-enhanced YouTube playback on the room TV
- Music Hub with per-theme/per-room mapping, verified curator-route status, local reactive ambience, and six provider adapters: Spotify, Apple Music, Deezer, SoundCloud, TIDAL, and YouTube Music
- Native SQLite catalog seeding, room-soundtrack persistence, history, integrity diagnostics, runtime profiles, and world snapshots

## Music accounts

All six providers support real search, room mapping, and external handoff without credentials. Account-controlled playback requires the corresponding provider authorization because Feature Foundry never ships another user’s credentials.

Spotify uses Authorization Code with PKCE. In the Spotify developer dashboard, add `http://127.0.0.1/callback` as the loopback redirect URI, then enter the Client ID in Music Hub settings. The desktop app starts a dynamic loopback port, validates OAuth state, keeps tokens in the current app session, verifies the connected account, refreshes access, and requests reauthorization after the provider’s terminal refresh lifetime.

Apple Music uses MusicKit v3. Enter a server-issued developer token in Music Hub settings; the signing private key must remain on the protected server. MusicKit manages user authorization. Deezer, SoundCloud, TIDAL, and YouTube Music use validated provider URLs and real external handoff without advertising unavailable embedded control.

## Run

```powershell
npm install
npm run dev
```

For the native desktop app:

```powershell
npm run desktop:dev
```

Press `F` to toggle fullscreen. Press `Ctrl+S` to persist a native world snapshot.

## Verify and package

```powershell
npm run verify
npm run desktop:build
npm run package
```

Verification covers the exact V24 markup/CSS/runtime contract, database authority counts and IDs, TypeScript, optimized production output, native Rust compilation, full-width procedural rendering, both reference themes, all 27 catalog worlds, Music Hub providers, and the real media-surface flow. Packaging produces web, source, native installer, and SHA-256 artifacts under `artifacts/`.

## Structure

- `index.html` — exact canonical V24 body markup plus module entry
- `src/prototype-v24.ts` and `src/styles/prototype-v24.css` — protected V24 compatibility contract
- `src/premium.ts`, `src/world/`, `src/music/`, and `src/media/` — typed premium runtime
- `src/data/` — exact verified runtime and artist-world authority exports
- `src-tauri/` — Rust desktop shell, SQLite, OAuth loopback, snapshots, and installers
- `reference/` — immutable source prototype and visual references
- `tests/` — contract, authority, and browser interaction verification
- `scripts/` — deterministic release packaging

Neither visual reference is used as a runtime texture. Environment art is rendered live from Three.js geometry, shaders, canvas, CSS, and SVG-compatible interface primitives.
