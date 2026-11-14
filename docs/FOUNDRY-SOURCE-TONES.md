# Original synthesized media tunes

Native Foundry provides an independent optional `tones` component. Its five short
note sequences, waveforms, start spacing and gain envelopes derive from reviewed
MIT `prototype-v24.ts` functions `mediaNotes` and `playSynth`.

Play is explicit. No AudioContext is opened during mount. Each tune has at most
five oscillators, finishes in under one second, and closes its context after the
native ended callbacks. Stop, changing tune, hiding the document and unmounting
cancel the graph. A delayed resume cannot restart a canceled request. No provider,
recording, persistent state, network call or autoplay is involved. The module can
be disabled with `foundryModules.tones=false` or bridge `--disable-foundry-module tones`.

This exposes the actual source synthesizer capability, not source object artwork,
object-placement/media-kind association, note-burst animations, recordings or
soundtrack provider parity. Running a Web Audio graph is not proof that the user's
speakers produced audible sound. The interface states that distinction.

Tests compare source note families and exact envelope scheduling. Real Chromium
verification renders nonzero bounded samples for all five families with a silent
tail through OfflineAudioContext, then observes a real-time AudioContext running,
finishing and stopping. Hardware output remains unverified.

Run `node --test native/foundry/tests/tones.test.mjs` and
`node scripts/test_foundry_tones_browser.cjs` (Playwright/Chromium required).
