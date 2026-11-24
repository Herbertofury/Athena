# Native procedural cinematic preview

Reuses the published MIT CinematicWorld source geometry, shaders and procedural mascots with pinned Three.js 0.185.1. Original source remains unchanged. A reproducible builder changes only theme ownership and frame/disposal lifecycle; generated bundle is local, no CDN or external models/textures. Explicit preview opens separately within Athena Build, without iframe or dependency on room authoring. Motion starts paused, obeys reduced-motion and document visibility, and navigation/close dispose GPU resources. Stale module loads cannot resurrect a closed workspace.

This restores an isolated procedural preview, not full original room/ecology interaction, artist worlds, provider controls or SQLite/Tauri parity. Browser fallback is explicit, not counted as rendered acceptance. Hosted Chromium must actually create a WebGL scene to pass the added check. Native desktop/GPU acceptance remains separate.

Source license: ../../feature-foundry/source/LICENSE. Third-party Three.js MIT license is retained next to generated module. Initial local regression caught undefined checkbox state in the lightweight DOM fixture; animation input now normalized to Boolean. Initial install failed on read-only default npm cache; retried with task-local cache, without permission changes.

Independent review reproduced two migration-specific gaps: paused theme transition did not settle, and paused resizing cleared the canvas without repaint. Adaptations now settle the static blend and redraw via ResizeObserver; browser acceptance requires nonblank multicolor framebuffer evidence for both themes and after resize. Reproducibility is part of npm test.
