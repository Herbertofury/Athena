# Aether motion reference

A standalone web reference for the **actual Aether shader renderer**, not a canvas imitation. It requires no plugins, accounts, build step, external CDN, local storage, or font download. From this directory:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/ in a browser. Run `npm test` for the deterministic, dependency-free input/budget checks and `sha256sum -c UPSTREAM-SHA256` for upstream file integrity. Do not open directly under `file:` because browser modules require HTTP.

## Provenance and exact boundaries

- [Reviewed Aether revision 71129b3](https://github.com/abundantbeing/aether/tree/71129b31958f6378a50ce955951d8ad68014c7ed), originally MIT by abundantbeing. Unmodified [renderer](https://github.com/abundantbeing/aether/blob/71129b31958f6378a50ce955951d8ad68014c7ed/desktop-src/renderer.js), [shaders](https://github.com/abundantbeing/aether/blob/71129b31958f6378a50ce955951d8ad68014c7ed/desktop-src/shader.js), [mode table](https://github.com/abundantbeing/aether/blob/71129b31958f6378a50ce955951d8ad68014c7ed/desktop-src/pointer.js) and generated presets are in `vendor/aether` with the original MIT license. The adapted host easing in `interaction.js` carries the same attribution. Keep this notice and the license with all redistributed copies.
- The gallery exposes the 18 bundled presets and all 10 finishes. The pointer selector is original Auto/Lens/Ripples/Gravity well/Repel/Wind/Off. Upstream host timing preserves four press rings, a 2.2-second hover hold, eased velocity capped at 1.4 viewport heights/second, motion off under reduced motion, battery/balanced/high FPS budgets of 12/24/30, and the upstream veil layering. Quality resolution scales apply to smooth finishes; styles with explicit pixel/cell sizing preserve that sizing.
- The standalone host scopes touch input to primary contact, listens passively (never blocks scrolling/selection), and releases the pointer on touch end/cancellation or document exit. The WebGL canvas never accepts hits. It goes idle while hidden, when paused in Still, or on context loss. A new scene initially composes at 23.7 s; switching a live scene to Still pauses its current phase. A CSS gradient remains if GPU rendering cannot start; the host attempts a new renderer on context restoration. Pointer and press data are memory-only and never leave the document.
- Shell/theme-editor/agent parity is **not** claimed: no Hermes plugin, generated or third-party SVG ingest, crossfade, font import, custom palette editor, native desktop adapter, or project integration. The isolated demo supplies a UI to compare exact shader modes, not a full Hermes theme host.

## Manual checks

1. Desktop ~1280×800: choose Selene/Ripples. Sweep the pointer left-to-right at the margin and click. Confirm a moving wake and expanding rings. With Battery selected, movement still reacts but presses no longer create rings. Select Off and compare with the same preset.
2. Desktop: choose Event Horizon. On Auto it should pull toward the pointer. Compare Lens, Repel and Wind as distinct responses. Stop moving for over 2.2 seconds; the pointer-induced displacement winds down, while the base scene still animates in Full.
3. Touch ~390×844: tap and drag the margins. Confirm a tap creates a short ring, a drag moves the visual field, lifting/cancelling contact lets it decay, controls still work, and the backdrop never blocks normal scrolling. Inspect both portrait and landscape.
4. Full/Calm/Still and simulated reduced motion: confirm Still and reduced motion stop both perpetual rendering and pointer animation. Hide the tab, then return and check the scene continues without a jump. Block WebGL to see a static gradient without losing controls.
5. For upstream deterministic capture see [Aether render_frames.mjs](https://github.com/abundantbeing/aether/blob/71129b31958f6378a50ce955951d8ad68014c7ed/tests/render_frames.mjs). Use equal scene time, browser/GPU, window size, DPR, mode, settings, and a scripted pointer packet trace to compare screenshots. Source-defined FPS budgets are not benchmark results.

### Browser smoke verification

Optional: with `playwright` already available to Node and a supported local Chromium executable, run:

```sh
node browser-smoke.cjs . /absolute/path/to/chromium
```

The test uses a loopback-only server, real WebGL with SwiftShader, Chromium mouse and mobile touch emulation, and checks the coordinates of the press uniform, that reduced motion sends no subsequent draw uniforms, that no external traffic occurs, and that the document's CSP refuses a fetch. Emulation does not substitute for physical-device latency, touch ergonomics, or GPU measurements.
