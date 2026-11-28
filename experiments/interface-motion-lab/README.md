# Athena Interface Motion Lab

A local source reference with a **Prism Optics / Aether Scenes / Off** switch. It starts off with no renderer loaded. The source and controls stay usable offline after you unzip the lab. No accounts, installation, remote assets or telemetry are required.

From this folder start a static loopback server:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

On Windows use `py -m http.server 8080 --bind 127.0.0.1` if `python3` is unavailable. Open [the local lab](http://127.0.0.1:8080/) and stop the server with Ctrl+C when finished. Use only a loopback bind. Opening the HTML directly as a file does not enable its local browser modules.

## What is exact

- **Aether Scenes:** the [reviewed upstream source](https://github.com/abundantbeing/aether/tree/71129b31958f6378a50ce955951d8ad68014c7ed) supplies unmodified renderer, GLSL, presets and pointer-mode table. The small local host adapter implements its input easing, timing, quality and static fallback. Choose 18 scenes, ten finishes, Auto and the five interaction types, or Off. This is not Hermes host/theme-editor or third-party plugin parity. [Attribution, notices, hashes and exact scope](aether/README.md).
- **Prism Optics:** independently authored Canvas reference for glyph waves, finite hover, fast-pointer skimmers and radial press. It has selectable colors, System/Calm/Still motion and a keyboard Pulse button. No code or graphics from the GPL-3.0-only project are bundled. Use the [source-backed parity fixture](aether/PRISM-VISUAL-FIXTURE.md) to compare exact upstream before adoption. It is not full visual, WebGL worker, wallpaper or fluid-vial parity.
- **Off** unloads the entire frame. Controls remain semantic and are not drawn into the scene.

## Acceptance

`python3 -B test-browser.py` uses installed Playwright plus Chromium (or `--browser /path/to/chromium`). It binds only loopback and verifies 390/1280px actual browser rendering, switching, moving Canvas then finite idle, keyboard controls, still mode, Aether choices and zero outside requests. The Aether directory separately contains an actual WebGL touch/mouse smoke and deterministic input/budget checks. SwiftShader/mobile emulation do not measure actual device/GPU budgets.

This is a reusable reference laboratory, not a production adoption or installed rollout. Each consumer still needs its own [Athena acceptance receipt](https://github.com/Herbertofury/Athena/blob/main/guidance/templates/INTERFACE_QUALITY_RECEIPT.md).
