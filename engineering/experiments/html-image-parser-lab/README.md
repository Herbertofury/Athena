# Complete image-token extraction: correctness and tail tradeoffs

Reviewed **2026-10-27**. Sources [E82], [HTML01], [HTML02], [HTML03], [OBS02]. **Isolated research only; no other project's code, wiki or TODO changed.**

This study reuses a pinned public adapter implementation and two maintained parsers, rather than replacing the adapter with a smaller feature set. Changes affect only its primary `img` extraction path. Provider identity checks, host allowlists, confidence scoring, originals/previews and unrelated linked-image, video, style and source-region logic remain. Those remaining paths are not thereby validated for every HTML edge case.

## Correctness before speed

Seven initial cases expose truncated quote-containing captions, missed unquoted attributes, greater-than signs inside quoted values, false images in comments/script text and repeated entity decoding. The parse5 SAX candidate corrects all seven, but did not consistently improve timing.

The callback candidate uses htmlparser2 12.0.0. Expanded testing reproduced literal NULL and CR/CRLF differences. The repair normalizes literal input line endings **before** entity decoding, so numeric CR references remain CR, and replaces NULL in consumed attribute values. It does not globally replace NULL in every HTML context. Preserve the [pre-repair evidence](expanded-before-repair-2026-10-27.json) and [pre-repair patch](callback-before-normalization.patch).

All three final candidates pass the seven core cases and fourteen expanded cases, as well as the unchanged existing provider regression script. The legacy baseline meets only two of these 21 adversarial fixture expectations. This is not a full browser/HTML conformance suite, a live-site validation, or proof about an installed application's current behavior.

[Core SAX output](core-sax-correctness-2026-10-27.json) · [core callback output](core-callback-correctness-2026-10-27.json) · [core streaming output](core-streaming-correctness-2026-10-27.json) · [expanded repaired output](expanded-repaired-2026-10-27.json).

## Equivalent clean-workload timing

Node 24.22.1, generated Nexus-shaped HTML, all media fields retained. Twelve counterbalanced rounds per size compare the complete original parser with SAX and repaired callback variants. All **144** timed outputs match the complete baseline output on these clean fixtures. Two warmups per strategy are disclosed; module-load time is not included. Every sample yields outside its timing window to allow stream cleanup. No result cache is used.

| Images | Baseline median ms | SAX median ms | Callback median ms |
|---:|---:|---:|---:|
| 6 | 0.704 | 1.171 | 0.985 |
| 64 | 5.166 | 4.182 | 3.805 |
| 256 | 19.875 | 20.695 | 15.501 |
| 1024 | 66.860 | 75.166 | 52.260 |

The callback maximum at 1024 images was **156.485 ms**, versus **95.652 ms** baseline. Lower medians do not establish a no-loss win. The smallest workload also became slower. [All raw timing samples](three-way-timing-2026-10-27.jsonl) and the [earlier exploratory SAX run](initial-sax-timing-2026-10-27.json) remain available.

## Stabilization attempt, not a discarded failure

A fourth variant consumes each image callback immediately rather than retaining an intermediate all-tag array. It preserves the full output, not just a preview. A separate instrumented 1024-image run produced 64 equal outputs across sixteen counterbalanced rounds. Median baseline/SAX/callback/streaming timings were **73.532 / 77.566 / 53.843 / 57.101 ms**. Streaming did not beat the callback-array median.

In that diagnostic run, the callback's slowest sample overlapped a 20.248 ms major-GC event; streaming's slowest overlapped 8.678 ms. This does not retroactively explain the earlier 156 ms sample or prove the tail is repaired. [GC/CPU/raw samples](tail-diagnostics-2026-10-27.jsonl) retain the observations. GC instrumentation adds overhead; process CPU may include multiple threads. Post-sample shared-process heap values are **not** peak memory or per-parser memory attribution.

## Scoped ranking and limits

- **Correctness reference:** parse5/SAX for the tested token cases, while accepting measured overhead. Upstream spec focus is not local proof of full conformance.
- **Throughput candidate:** repaired htmlparser2 callback path for these larger clean workloads. Small-input overhead, tail variability, module/bundle cost and real-corpus requirements still block adoption.
- **Unproven allocation variant:** immediate streaming removes an intermediate array but did not improve median timing here.
- **Avoid as a general HTML grammar:** independent attribute/tag regexes that cannot handle valid quoting and raw-text/comment context. Keep the original baseline and its failures for comparison.

No live provider, private/paywalled content, account session, image decode, video playback, browser bundle, installed target or peak-memory acceptance was tested. No HTML fixture scripts execute and parser tests make no network requests. npm audit reported zero known advisories for the pinned dependency graph at review, not a safety guarantee; [raw audit](npm-audit-2026-10-27.json) is retained.

## Reproduction and rollback

Use a workspace with sibling `enderloom-media` and `html-parser-lab` directories. Put the five original files from the [pinned public revision](https://github.com/Herbertofury/Enderloom/tree/fc55c422f93480d75604203b288a837bb87ed623) in the first: `src/provider-media.js`, `src/site-adapters.js`, `src/provider-fastlane.js`, `src/curseforge-fastlane.js`, `scripts/provider-media-qa.js`. Copy this experiment's harnesses/package files into the second, then run `npm ci --ignore-scripts` there. Direct versions and transitive integrity values are locked.

Create `candidate`, `fast-candidate` and `streaming-candidate` copies inside `html-parser-lab`. Apply the corresponding [SAX patch](sax-image-lane.patch), [repaired callback patch](callback-repaired.patch) or [streaming patch](streaming-repaired.patch) with `patch -p1` inside each copy. Run each unchanged `scripts/provider-media-qa.js`, then `correctness.cjs`, `correctness-fast.cjs`, `correctness-streaming.cjs` and `expanded-correctness.cjs`. Run `compare-three.cjs` and `tail-diagnostics.cjs` with Node's 256 MiB old-space budget and filesystem-read permission limited to the workspace. Timing harnesses write JSONL incrementally; preserve incomplete runs. Our external per-run limit was 45 seconds.

[Provenance and source hashes](provenance.json) identify the baseline and each candidate. Original files, pre-repair behavior and failed performance observations are retained. The cross-project adoption gate remains unchanged.
