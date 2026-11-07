# HLS.js 1.7.4: scoped candidate evaluation

Reviewed 2026-10-28. Upstream released 1.7.4 at 18:52:16 UTC. Atlas's live media workbench remains pinned to 1.7.3; this study does not upgrade the player or another project.

## Actual source comparison

The [release](https://github.com/video-dev/hls.js/releases/tag/v1.7.4) includes low-latency loading, abort/stop, subtitle, buffering and content-protection changes. This experiment evaluates only the [trailing-decimal EXTINF repair](https://github.com/video-dev/hls.js/pull/8113). Other fixes, including the experimental key-session reuse option, are not accepted by these parser tests. The option is not enabled here.

Both official npm tarballs passed their pinned SHA-512 checks. The 1.7.3 package's minified distribution matched Atlas's existing vendor bundle exactly. Exact source parsers were then compiled with the already-installed esbuild 0.28.2, the upstream full-build flags and identical pinned dependencies. This is an offline source-fixture build, not the upstream Rollup distribution, Karma suite or real browser playback. No package installation scripts ran. [Provenance](provenance.json).

## Verified result

[Results](fixture-results.json) retain 13 ordinary controls and 50 generated trailing-decimal cases. All 13 controls had identical complete structured-cloned parser-data graphs, resolved URLs and part-parent bindings across versions. The controls include fractional durations, Unicode titles, date/time, key metadata, initialization maps, byte ranges, discontinuities and parts and local variable substitution. This is scoped fixture coverage, not all HLS behavior.

For trailing-decimal durations, 1.7.3 produced extra incorrect segment URLs even while its total duration was correct. Version 1.7.4 matched every expected segment, title and timeline in all 50 cases. Checking only aggregate duration would have missed the defect. This establishes the selected parser improvement, not network, decode, media-source, DRM, access-rights, performance or target-player acceptance.

The evaluator checks exact compiled artifact hashes before import. Original fixture outputs and build failures remain retained privately. Source responses, credentials and account data were not used. Requests are prohibited by the fixture's fetch guard; the parser does not perform playback.

## Real application check remains separate

The actual Rust upstream-review CLI was also tried against a copy of its previous observation database. [That request timed out](native-upstream-failure.json). All five previous snapshots stayed unchanged and the reservation cleared; no new snapshot or native connection success is claimed. The release facts above were independently verified through GitHub, not inferred from this failed CLI request.

## Reproduce without touching the working player

Use an external staging directory, outside this repository. Download official npm packages hls.js 1.7.3 and 1.7.4 with installation scripts disabled into STAGE/packages. Run `python3 experiments/hls-release-lab/stage_sources.py STAGE`; it verifies pinned archives and extracts only source, package metadata and license files into new directories.

Install esbuild 0.28.2 into a separate trusted tool directory. Install url-toolkit 2.2.5, @svta/cml-id3 1.0.6 and @svta/cml-utils 1.5.0 into STAGE/packages/helpers, with scripts disabled and exact versions. Run `node experiments/hls-release-lab/build.mjs STAGE TOOL_INSTALL`, then `node experiments/hls-release-lab/evaluate.mjs STAGE`. A mismatched artifact is rejected, not silently accepted as the same test. Inputs are synthetic; no public playlist or authentication is required.

Acceptance still requires real browser loading/playback, stop/reload and recovery checks with Atlas's current complete-card dataset, exact vendor identity/SRI, autoplay off and permitted sources. Keep 1.7.4 isolated until that evidence exists. Sources: HLS174, HLSPARSE174, HLSBUILD174.

A fresh source-stage extraction and rebuild, reusing the pinned compiler/helper installation, reproduced both expected parser artifact hashes and all 63 fixture outcomes. Wrong artifacts and invalid archives have separate fail-closed checks; these do not imply security certification of the entire library.

## Separate fragment-selection follow-up

[The quality-switch matrix](fragment-selection.md) compares 128 generated source selections across both releases and preserves the distinction between repeated selection and a verified playback defect. It does not replace the parser evidence or browser acceptance gates.
