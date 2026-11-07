# Athena Foundry adapter handoff

## Candidate, not verified browser release

Source: Herbertofury/Feature-Foundry at e1ba080b5c7590f1c844a6ed13b3a471709920b9.
The module identity and SHA-256 are in dist/workspaces/foundry/identity.json; the runtime asset allowlist is config/runtime-public-preview.json. Include THIRD-PARTY-NOTICES.txt with the module. The MIT source license and bundled Three.js/Tauri notices are preserved.

The static mount module includes the original body, styles, catalogs and derived bundled runtime. It is mounted inside the existing Athena #build route, not an iframe or another app window. No runtime asset copies are required; the two reference PNGs are preservation evidence, not runtime textures.

## Harness prerequisites

Node 22+ and the existing playwright 1.62.1 dependency with its standard CI-installed Chromium. The dedicated harness is scripts/test_foundry_workspace.mjs and is wired into the aggregate browser runner. Run node scripts/test_foundry_workspace.mjs in the existing authorized CI lane. The harness serves HTTP on a dynamically selected loopback port, tests real DOM actions, captures a screenshot and writes foundry-browser.json even on failure. It does not alter workflow permissions or require secrets.

Local Chromium execution is restricted. Do not retry or change security flags. Browser validation must happen in the existing authorized CI lane.

## Explicit restrictions

- Only loopback fixture/runtime traffic is expected. Any external request fails the harness.
- No external account login, token, provider SDK or user data is used.
- Native SQLite/window callbacks are not connected in the browser workspace. Source is preserved, not functionality claimed.
- Provider account authorization is not connected: connect controls show an explicit unavailable message, credential inputs are absent, session state is in-memory only and excluded from exports.
- Six provider link/search/mapping routes remain. The harness does not follow external links.
- Media loads remain user-initiated and paused. No successful playback is claimed by these tests.
- Browser preferences are stored under athena.foundry.*, without reading legacy ff keys. Secret session material is not exported.
- Shadow DOM isolates styles and IDs. Global events/timers/frames/observers/audio/object URLs are tracked; unmount and AbortSignal clean them up.

## Before and after evidence

Original source: all 100 tracked files exact Git blob hashes; all 10 original commits, 42 trees and 101 unique blobs reconstructed and fsck passed; both branches and tag retained in a verified Git bundle. Original npm test, typecheck and Vite build passed locally.

Derived module: TypeScript check, Vite build and node syntax check passed. Actual integrated Chromium CI mounted the complete workspace. Run 42405947945 found one failing original selftest: the selected-object toolbar used viewport coordinates inside the transformed workspace. The candidate now translates coordinates into the workspace origin without weakening that assertion. All other original selftest checks passed in that run. Dedicated strict-CSP parity, 27 themes, five ecology actors, six provider routes, URL rejection, no autoplay, lifecycle cleanup and durable remount remain implemented but unrun because the earlier gate stopped the aggregate runner. Native/hosted acceptance is not claimed.

No claim that Feature-Foundry is safe to delete: six original release assets, full native runtime and hosted app parity remain unresolved. No source repository changes were made.

## Local-engine security contract

Candidate styles are an external same-origin style.css. Static and catalog inline style attributes were converted to stylesheet rules. The dedicated harness now serves the exact current Athena engine CSP without unsafe-inline or unsafe-eval. External/account media and local-file imports are explicitly unconnected in loopback mode. No policy weakening, token copy or SDK script loading is required. This harness is a scoped parity test; full Athena navigation and the actual Rust-served app remain independent gates.
