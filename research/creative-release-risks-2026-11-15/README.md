# Creative release-risk review: OBS Studio and Gyroflow

Observed: 2026-11-15. This is a bounded upstream-change analysis, not a software ranking, catalog import, installation recommendation or completed benchmark. It changes no application selection, runtime configuration or machine settings.

## OBS Studio 33.0.1: exercise persistent sources before upgrading a workflow

The [official 33.0.1 release](https://github.com/obsproject/obs-studio/releases/tag/33.0.1) reports fixes for service-integration startup/login crashes, a YouTube-login deadlock, browser-panel sizing races and an image-slideshow memory leak. These are upstream reports, not reproduced Athena results.

The same release notes explain that OBS 33 changes plugin layout: first-party plugins move to a core directory, third-party installation structure changes, and legacy third-party paths remain supported only until OBS 34. Treat plugin compatibility as a separate acceptance gate rather than assuming a successful OBS launch validates every scene.

A useful future offline comparison would retain a duplicate scene collection and record frame drops, browser-source dimensions and resident memory during a long image slideshow. Compare the same media and settings before and after; preserve a known-good executable/configuration combination. No service login is needed for that local fixture.

The [official README](https://github.com/obsproject/obs-studio/blob/master/README.rst) identifies GPLv2-or-later; plugin and dependency licenses require separate review before source reuse. The [download page](https://obsproject.com/download/) identifies Windows 10/11 support. This does not verify an individual Windows architecture, driver or plugin combination.

## Gyroflow 1.7.0: separate algorithm claims from lens and timing correctness

The [official 1.7.0 release](https://github.com/gyroflow/gyroflow/releases/tag/v1.7.0) introduces optical stabilization and optimal-path smoothing, plus changes relevant to variable-frame-rate timing. Optical correction requires a valid lens profile. AV1 hardware export on Windows/Linux has GPU-generation requirements, including RTX 40, RX 7000 and Intel Arc or newer according to the release notes. Do not interpret these encoder requirements as a blanket requirement for every stabilization workflow.

A future comparison should use known-camera clips with retained motion metadata, including variable-frame-rate material and moving foreground subjects. Measure residual shake alongside crop, synchronization, rolling-shutter artifacts and output metadata. Upstream quality claims are hypotheses until that target comparison is run.

The [official repository license explanation](https://github.com/gyroflow/gyroflow#license) specifies GPLv3 with exceptions, including permission to link the separately distributed closed-source mdk-sdk. Do not describe the complete binary dependency stack as entirely open source. Review the exact pinned files and dependency terms before reuse; this note imports no code or assets.

## Evidence and acceptance limits

Both canonical release pages were inspected directly. Their rendered date labels omitted the year, so this note records the observation date but does not manufacture full publication dates. No downloads, installations, account access, benchmarks or compatibility tests were performed. No stars or user-rating scores were collected. Proposed experiments above are not results.

This independent note neither changes nor republishes the held Windows-PC catalog or its runtime manifest. It is not native app integration, a live Wiki synchronization, or evidence that a migration can be retired.
