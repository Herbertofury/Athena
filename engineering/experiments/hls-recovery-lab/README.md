# HLS loader failure cleanup

Checked 2026-10-27. This repairs the existing media workbench's library-loading lifecycle; it is not a new extractor or a speed ranking.

## Reproduced failure and actual repair

The retained v5 loader leaves its script element and event handlers after timeout. A late onload can then emit a misleading library-ready event for an already rejected attempt. Four cleanup/retry fixtures fail against the previous source. The separate regression demonstration confirms that old behavior; no real browser network failure is claimed.

The repaired v6 loader reuses the existing pending-only resource loader. A settled guard, timer/handler cleanup and failed-script removal fence late callbacks; a failed attempt allows a later explicit retry without an automatic retry loop. Concurrent callers share only active work. The exact HLS 1.7.3 capability check, local vendor URL, SRI and anonymous request mode remain intact. Removing a script is not proof that all network work was cancelled or that already executed code can be undone.

[Before fixture output](before-fixture-tests-2026-10-27.txt), [after fixture output](after-fixture-tests-2026-10-27.txt), [retained baseline](baseline-hls-loader.mjs) and [actual-source tests](../../tests/hls-recovery.test.mjs) preserve timeout, load-error, append-throw and wrong-version cases. All five focused tests and all 54 Node tests pass. The source is exercised in a VM with generated DOM/timer fixtures, not an actual HLS provider.

## Preserved boundaries

The complete public card dataset, media validation core, CSS and HLS vendor bundle are unchanged. Autoplay remains off and playback must be separately verified. No credentials, download permissions or provider restrictions changed. No other project received a recommendation or implementation change.

After deployment of 00517c4ccd9d5f06fe2c8ae5bdf8558c44f333e0, all six [served assets matched](served-2026-10-27.json), and the cloud browser loaded the exact v6 module. The [real public Steam trailer smoke test](browser-public-playback-2026-10-27.json) used the pinned HLS.js fallback: library ready, metadata/canplay, explicit playing event, and pause at 0.25136 seconds. Autoplay remained false; the player was removed by changing selection after receipt export. This verifies ordinary playback/release, not a real network-failure recovery. The four failure/retry cases remain fixture-tested only.
