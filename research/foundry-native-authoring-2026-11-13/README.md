# Native Foundry room authoring: limited first integration

The Build route mounts a same-document Athena module, not an iframe or separate app. It uses a field-reviewed projection of the original MIT theme catalog: 17 themes, 34 rooms and all 85 ecology object identities. The projection contains only theme/room/object identifiers, names, shapes, roles and colors. It includes no artist catalog, reference images, provenance, private Drive links, account state or provider credentials.

Implemented: per-room normalized object placement, pointer/keyboard positioning, pinning, time-of-day preview, shared search/theme, retained workspace state, validated layout import/export and teardown. A rejected import leaves the current layout untouched. Invalid stored data is retained rather than silently replaced. Current authoring uses neutral procedural layout cards, not the original cinematic renderer.

Not complete: original GPU scenery/animation, mascot behavior, artist-specific worlds, provider authentication/playback, native SQLite/Tauri migration and full visual/product parity. The UI explicitly states these gaps. Existing source repositories and backups remain necessary. The complete package gate remains closed; public-preview allows only the four reviewed authoring files under the Foundry runtime directory.

DOM and pure-state tests are not browser/native evidence. Local Chromium could not start because the environment rejected its socket; no page loaded and no bypass was attempted. Hosted Chromium acceptance covers mount, all theme choices, keyboard positioning/pinning, navigation/reload persistence, room selection, export, rejected import, theme screenshots and mobile width. Read the exact successful CI receipt before claiming those gates passed.

Current-tree metadata cleanup from PR #72 remains separate. Historical metadata and the held artist catalog have not been scrubbed.
