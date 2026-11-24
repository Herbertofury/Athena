# Explicit procedural environment motion

The native Foundry room/object surface renderer retains the original MIT
`prototype-v24.ts` time-dependent formulas for Frutiger, Aurora, Ocean and Rain
City. Diner is static in the source, so its motion control stays disabled.
Vapor/Backrooms remain the existing static SVG implementation; Cosmic and
parallax are not implemented by this change.

Motion starts only with **Start environment motion**, never from saved layout
state or navigation. It is session-only, limited to 30 painted frames/second at
1000×600, and stops on explicit Stop, environment replacement/off, detached
surface, hidden document or workspace disposal. A hidden document does not
resume automatically. Stop retains the last frame; a new start begins at zero.
No media playback, provider access or persistent format/schema change occurs.

Verification:
- Node command-recorder comparison against the original source at four times,
  plus scheduler lifecycle/bounds/failure tests.
- `node scripts/test_foundry_environments_browser.cjs` verifies actual Chromium
  pixel changes only after Start, stationary frames after Stop, no reload
  autoplay, and complete backdrop removal on Off. Requires Playwright Chromium;
  `CHROMIUM_PATH` optionally supplies an installed executable.
- Resource bounds are implemented limits, not a claim of measured speedup or
  full original Foundry capability parity.
