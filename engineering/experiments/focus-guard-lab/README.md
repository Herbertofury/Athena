# Foreground measurement guard

2026-10-28. Actual prior card harness: [baseline source](baseline-lab.js), deployed v9 at commit `1b9fb1656c837d4fa2e0dc0d36ad78b396b9f6ce`.

The foreground-controlled event-log rerun found an important measurement gap: a document can report visible even when its browser window is behind another native window. The unchanged renderer produced approximately 600 ms scroll-frame waits in earlier limited runs and approximately 16–17 ms after explicit native foregrounding. This supports an environment-confounding hypothesis, not unique causal proof or an app speedup.

The actual card harness now requires document focus before preparation and checks it at measurement boundaries. A window blur is latched for the whole run, including a transient blur followed by refocus before the next frame. A new explicit run clears that latch. Missing focus capability fails closed. Failed/partial evidence remains downloadable, and prior completed evidence stays separate. The guard does not steal focus, alter browser flags, truncate data or silently restart work. Existing visibility and full-output checks remain.

[Six focused tests](../../tests/focus-guard.test.mjs) reproduce visibility-only acceptance of an unfocused document, transient and polling-detected loss, missing capability, independent new runs and actual harness wiring. They use generated document/event fixtures, not native OS events. Full local regression: 112 Node checks; both content-addressed site builders pass. Live native focus-loss/recovery remains to be verified against the deployed v10 build.

This repairs experiment acceptance, not UI throughput. Document focus is necessary for this controlled protocol, not a guarantee of physical paint, foreground scheduling, accurate INP, peak memory or a universally stable device. Existing raw results remain intact; none are retroactively relabeled as successful focus-controlled tests. No other project or production media renderer is changed.

Primary source FOCUS01: [Document.hasFocus](https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus), checked 2026-10-28. Focus and active-element identity are distinct; a nonforeground popup may retain an active element without focus. Source facts and this experiment's stricter acceptance policy are separate.

## Native counterexample and second repair

The [actual v10 browser receipt](focus-only-native-mismatch.json) completed six samples and reported focused throughout, although desktop screenshots showed a different tab and then Terminal in front. Median scroll-frame wait was approximately 1,009.9 ms. The failed native acceptance is retained: focus API state alone did not establish native foreground state in this automated environment. No cause such as focus emulation is asserted without evidence, and no browser flags were changed.

The v11 harness supplements focus/visibility with eight empty-frame scheduling observations before preparation and after each sample, outside the render timer. Four or more waits of at least 200 ms reject this controlled performance run. This deliberately conservative protocol is not a universal display-refresh threshold or a performance optimization. It retains all raw calibration gaps, measured samples and previous completed evidence. A logical eight-second timer cancels a pending frame; page/OS suspension can delay timers, so this is not hard real-time isolation. User Stop and lost focus/visibility also terminate calibration without silent retry.

Five additional fixture tests cover normal cadence, the observed slow-cadence pattern, partial timeout cleanup, interruption and invalid clocks. Full Node regression: 117 tests. [Generated focus fixtures](fixture-results.json) remain separate from the native counterexample. Live v11 rejection, foreground recovery and last-good retention still require verification.

Primary source FRAME01: [requestAnimationFrame scheduling](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), checked 2026-10-28. Callback cadence is ordinarily related to display refresh and may pause for background content; this does not make double-rAF a physical-paint measurement.

## Actual deployed v11 outcome

The deployed `lab.6e97319b65f25a4e.js` / v11 harness was exercised in cloud Chromium. [Initial background calibration](v11-background-rejected.json) timed out with seven retained roughly one-second waits and zero render samples despite reported focus. This closes the observed slow-context acceptance gap without trusting the focus signal alone.

After native foreground selection, [all six complete-output samples](v11-foreground-complete.json) passed pre/post calibration. A subsequent attempted Terminal-switch setup did not establish background state: the browser remained in front and produced a second valid run, preserved as [the pre-interruption receipt](v11-before-interruption.json). The later explicit native tab switch produced [one retained measured sample and rejected post-sample cadence](v11-interrupted.json). Its [last-good download](v11-after-interruption-last-good.json) matched the pre-interruption receipt byte-for-byte, SHA-256 `a7d5ec48d4eb9e3559c2139f043f6dfc29661addb7195d8038d56e8f64ad330d`.

A new foreground [200-card × 64 KiB metadata run](v11-density-200-64k.json) then passed all six complete-output samples and every scheduling check. The exact last card exposed all 65,536 metadata characters. Paired frame-ready proxy medians were 4,871.0 ms full DOM versus 265.2 ms metadata containment; synchronous insertion medians were 20.1 versus 74.0 ms. Full layout/scheduling costs matter more than insertion alone here. This is a small three-pair generated-data comparison, not a real-media, memory, INP or universal ranking. [Verification and raw hashes](live-verification.json).

The focus-only native failure remains a failure, not reclassified by the later repair. Calibration acceptance says the specified empty-frame checks passed, not that browser-reported focus became trustworthy or that every native interruption is detected. No security setting, browser flag, private data or external project was changed.
