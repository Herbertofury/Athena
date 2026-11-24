# Worker module-graph bundling experiment

Prepared 2026-10-28. This tests the same Atlas worker, not a new validator or a default application upgrade. Source checkpoints BUNDLE01/BUNDLE02: [esbuild 0.28.2](https://github.com/evanw/esbuild/releases/tag/v0.28.2), published August 8; [Rolldown 1.2.15](https://github.com/rolldown/rolldown/releases/tag/v1.2.15), published October 21. Both were stable latest releases when checked. Language and recency do not establish superiority.

## Exact build scope

Five content-addressed source modules total 13,810 uncompressed bytes. Both pinned tools bundle and minify that same graph into one ESM worker, preserving the complete validator, receipt/transfer modes, request checks and phase instrumentation. The esbuild output is 3,966 bytes; Rolldown output is 3,904 bytes. These are source-file bytes, not compressed transfer bytes or measured startup speed.

[Build receipt](build-receipt.json) binds every source input, tool version and output hash. The site builder refuses stale source graphs, mismatched tool versions or changed artifact hashes. It never silently rebuilds with an unpinned latest tool. Original modules remain the default and both bundles remain isolated choices.

[Six fresh-process compiler results](evidence/compilations.json) preserve all warnings and outputs. All three outputs per tool were byte-identical; relocated private installs produced the same hashes. Internal compile-time medians were 52.21 ms esbuild and 105.66 ms Rolldown for this tiny graph on Node 24.22.1. Process startup, OS caches, graph size and API initialization matter; this is not a universal bundler or language ranking. The first pair lacks separate outer process timing. A final summary-printing error occurred after all raw build data was saved; readback verified all six outputs without rerunning builds to hide it.

Tools were installed from the npm registry with exact versions, an isolated writable cache and lifecycle install scripts disabled. The original default-cache failure is retained. [Explicit npm audit](evidence/npm-audit.json) reported zero known advisories for this tool dependency tree, not whole-toolchain safety. Package locks retain registry integrity metadata. Vendor node_modules stay outside the repository and are not published or scanned as Atlas-owned research.

## Correctness before browser timing

Two differential test functions cover 29 generated protocol cases across original modules and both bundles: 87 executions. They compare all output fields and complete transferred bytes, excluding only nondeterministic execution timestamps, which are separately checked for finite ordered values. Inputs include 200 records × 64 KiB metadata; the original caller data remains unchanged. Five corruption classes across all three transports and invalid request/transport identities retain the same failures. This is bounded fixture coverage, not a formal compiler proof or cross-browser guarantee.

The browser's build-comparison mode uses the same full validation-only receipt contract in all three lanes. Each sample creates a new worker; three rounds rotate lane order so each tool occupies each position. The original records stay fully owned by the caller. Preparation and independent full-parity verification remain outside the sample timer in all lanes. Initial fetches and caching are not concealed or described as cold-cache testing. Actual runtime evidence is required separately before making any startup claim.

Reproduction: copy tools/package.json, tools/package-lock.json and tools/compile.mjs to a separate private tool directory, install locked dependencies there with npm ci --ignore-scripts, set ATLAS_BUNDLE_REPO to the Atlas checkout, and invoke the fixed compiler with esbuild or rolldown and a new output path. The output file cannot overwrite prior evidence. The compiler uses the stable rolldown/generate API, closes native resources, and uses esbuild's bundled browser ESM API without dropping checks or console output. No third-party plugins or arbitrary downloaded prototypes execute.

## First actual browser comparison, v8

[All raw browser samples and limitations](evidence/browser/summary.json) retain 36 complete-data samples in four runs, with the same validator and Latin-square tool order. Native modules / esbuild / Rolldown request medians:

| Workload | Pass 1 | Pass 2 |
|---|---:|---:|
| 200 × 8 KiB | 91.3 / 52.0 / 41.9 ms | 51.2 / 30.1 / 32.9 ms |
| 200 × 64 KiB | 187.4 / 97.2 / 97.6 ms | 117.8 / 97.6 / 97.1 ms |

Both bundles improved these limited request medians; neither compiler consistently led. Rolldown's first dense maximum frame gap regressed to 42.0 ms versus 36.1 ms native, so a favorable median is not blanket UX acceptance. Eleven served assets matched exact hashes; loaded v8 script receiver.5dc114522973c617.js. These are source-build changes, not lowered fidelity or a cache-configuration tweak, but browser/OS caches were not controlled as cold and no target-project recommendation follows.

Three cross-context phase timelines were rejected, one for each tool. All observed reversals were -0.000244140625 ms between send-start and main-receive. Their cause is not established; they are not clamped into zero or included in phase attribution. Parent-local request timing, complete data and frame observations remain separate evidence. The v9 UI clarification reports complete-data count separately from valid/rejected/uncollected phase counts and prevents running before its verification module is ready. It does not retroactively convert the v8 rejected traces into valid measurements. Browser rechecking of that clarification is recorded separately.

## Verified UI status and safe rebuild staging

The v9 browser initially showed Run disabled while its module loaded, then enabled it only after initialization. A real nine-sample build comparison displayed nine valid phase timelines, zero rejected and zero uncollected; rejected-phase wording is additionally fixture-tested. Its full receipt and exact served hashes are retained separately from v8 results. Earlier rejected v8 phase traces remain rejected.

The rebuild workflow now has an explicit staging step: `python scripts/build_receiver_lab.py --stage-worker` writes content-addressed input modules and worker-input-manifest.json without replacing index.html or build-manifest.json. The two published entrypoints were byte-identical before/after the actual staging command. A generated source-change fixture confirms normal publication still rejects stale bundles while staging can prepare the new graph. Compile that staged graph by passing worker-input-manifest.json as the fourth compiler argument, retain new tool outputs/receipt, then run the normal checked builder. The compiler rejects unknown manifest names and misbound worker entry bytes. Both pinned tools produced the same accepted bundle bytes from the actual staged manifest. No mismatch guard was bypassed or weakened.
