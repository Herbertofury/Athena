# November 11 app, mod and asset foundation integration

## Purpose and scope

This candidate joins sixteen independently published foundation drafts into one navigable research collection on Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922`. Start with the [app, mod and asset foundation routes](../docs/app-mod-foundations.md). No runtime, target configuration, active integrated release, workflow, merge or deployment is changed. Other drafts and unpublished/private material are outside this assembly.

This is a compatibility and preservation check of existing research, not a new benchmark or a comprehensive re-audit of every original scientific claim. Original guides distinguish documented behavior, synthetic observations, receipt checks, fresh execution and target acceptance. Those distinctions remain in force.

## Frozen inputs

All sixteen source PRs were open drafts at the integration snapshot. The [machine-readable input manifest](foundations-integration-inputs-20261111.json) records their heads, trees and every contribution path/blob/mode. Commit pins below identify source snapshots even if a draft advances later. Existing drafts remain unchanged and open; this combined candidate does not silently accept or close them.

| Source | Contribution | Frozen head |
|---|---|---|
| [#27](https://github.com/Herbertofury/Athena/pull/27) | mod build and asset acceptance foundations | `8b0b9b8f1005b7d0ba816d6453e415211a8d9082` |
| [#28](https://github.com/Herbertofury/Athena/pull/28) | recovery-first app foundations and SQLite recovery drill | `b2677431598a8d5a696c6d1e5b36d67657964594` |
| [#29](https://github.com/Herbertofury/Athena/pull/29) | accessible UI and card media acceptance foundations | `6be2b3a1aead088312e929282305d130d5873f5a` |
| [#30](https://github.com/Herbertofury/Athena/pull/30) | executable mod dependency semantics lab | `e7a42bc5a041841c6ed0999d90185df3af33d4ba` |
| [#31](https://github.com/Herbertofury/Athena/pull/31) | Unicode discovery and composition input foundations | `1d6a84739484436dced41a73890705284a82be1b` |
| [#32](https://github.com/Herbertofury/Athena/pull/32) | retry and idempotency boundary foundations | `00cd01ee133dc49d6a836a2efff2a10fa11fdea2` |
| [#33](https://github.com/Herbertofury/Athena/pull/33) | bounded file ingestion foundations | `282e05a1af717e8888c59ae8caac0541426f057d` |
| [#34](https://github.com/Herbertofury/Athena/pull/34) | bytecode injection acceptance foundation | `8a51ddef8b4a2eab3a43e0d481b13f4d5779e132` |
| [#35](https://github.com/Herbertofury/Athena/pull/35) | conditional edit and revalidation foundations | `f8d4932c05e37b87391d902ecdd3601f29c1a275` |
| [#36](https://github.com/Herbertofury/Athena/pull/36) | resource packaging acceptance lab | `bd995cf264baf18232bae5fefde88c419dc597cd` |
| [#37](https://github.com/Herbertofury/Athena/pull/37) | bounded ZIP inspection foundations | `b2703e87c24e636bea23241d6caf85608d97066d` |
| [#38](https://github.com/Herbertofury/Athena/pull/38) | JVM class-loading boundary lab | `08ac777bdd80225e2e583e8f26bd8a25d7004cec` |
| [#39](https://github.com/Herbertofury/Athena/pull/39) | FTS5 consistency and rebuild foundations | `0dce3870b6027076af4ff17c868104038074fff3` |
| [#40](https://github.com/Herbertofury/Athena/pull/40) | subprocess pipe and cleanup foundations | `28ad9eba5cd3b06259256620689d655b0aea61ab` |
| [#41](https://github.com/Herbertofury/Athena/pull/41) | glTF asset validation boundaries | `4cb5db53585f21068bbfb24ec052de64675105dd` |
| [#42](https://github.com/Herbertofury/Athena/pull/42) | dependency graph and verification foundations | `8e4b9f1ccf4254eabc0be6086b47dc1b28618c44` |

## Conflict resolution and preservation

There are 248 source contribution file instances across the sixteen drafts and 227 unique paths. Exactly 224 independent added files remain byte-for-byte equal to their published Git blobs; there are no conflicting independently added paths.

Three shared paths are reconciled explicitly:

- `data/source-index.json`: retain all 29 baseline files and union all 16 additive fragments. The 45-file index loads 2,384 unique source records, retaining all 2,206 baseline records plus 178 additions, with no duplicate source IDs.
- `docs/mods.md`: retain the exact baseline bytes and all six distinct append-only tails, in source-PR order.
- `docs/game-assets.md`: retain the exact baseline bytes and both distinct append-only tails, in source-PR order.

Repeated URLs are not blindly deduplicated: different observations, versions or source IDs remain attributable. Independent review examined 17 repeated-URL groups involving additions, including seven overlapping across new contributions, without finding contradictory notes. This is not a claim that every underlying upstream page was freshly reread.

Integration-only additions are the routes page, its README entry, this record and the frozen-input manifest. The existing Research Explorer catalog, generated assets, rankings, source observations and historical evidence are unchanged.

## Aggregate verification

Final integration commands run from `engineering`, except where explicitly indicated:

```sh
python3 -m unittest discover -s tests -v
node --test tests/*.test.mjs experiments/gltf-validation-lab/tests.mjs
python3 scripts/check_research.py
python3 scripts/build_research_explorer.py --check
python3 scripts/build_card_lab.py --check
python3 scripts/build_media_lab.py --check
python3 scripts/build_receiver_lab.py --check
python3 scripts/build_audio_lab.py --check
```

- Complete Engineering Python discovery: 819 tests, 818 passing and one inherited checker error; no skips. A separate exact-main baseline reproduces the same error with 325 passing out of 326, no skips.
- Complete Engineering Node checks, including the glTF experiment's separately located suite: 420/420 pass, no skips. The ordinary `tests/*.test.mjs` glob alone covers only 370; it is not the complete integration count.
- All five generated-output checks pass. Research Explorer remains 283 entries, 528 catalog sources, 11 cohorts, 35 observations and 38 test plans. Its catalog-source count is different from the full registered-source count above.
- Independent assembly review verifies the non-union input hashes, exact unions, source IDs, original contribution links and test-module namespace isolation. Synthetic tests and stored-receipt checks are not new executions of every Java/Gradle/browser/runtime experiment.

The remaining failure is `test_tools.ResearchTests.test_register_and_links`. Main's unchanged checker rejects `apps/atlas-lab/README.md` linking to repository-root `docs/athena-local-runtime.md` because it confines local links to `engineering/`. The target exists and its main Git blob was verified. The complete research check remains red for that same reason; no link was removed and no check was suppressed.

Initial local runs omitted the repository-root research issue template and therefore skipped one test; final baseline and candidate runs include its exact main bytes. A temporary missing integration-record link while composing the route page was corrected before final validation. The initial partial Node glob and these unfinished-state logs remain retained separately rather than relabeled as final passes.

Existing draft [#4](https://github.com/Herbertofury/Athena/pull/4) at `22d05b4ae663128821f106958cc99a7991ed5d2e` addresses the checker boundary separately and is not incorporated here. In an isolated diagnostic copy, applying its four exact published blobs yields 819/819 Python tests, 38/38 containment tests, both root Node bridge checks and the complete research check passing. These overlapping suites must not be summed into a unique-test count. This diagnoses the inherited boundary mismatch; it is not the status of this unpatched candidate, a change to #4 or hosted CI evidence.

## Source refresh and acceptance limits

Independent live sampling confirmed official Forge Java 17/64-bit prerequisites, Fabric's current 26.2 heading versus Minecraft 26.1/JDK 25 body, and SQLite single-writer/transaction boundaries. The pinned Gradle 9.2.1 compatibility page was unavailable through that review tool and was not bypassed. The original source notes keep their prior version/date/retrieval qualifications. No claim of a complete fresh external-link or factual audit follows from this sample.

These research-only paths are ignored by the existing root push/PR learning workflow; nested Engineering workflows are not root workflows. Zero hosted runs/checks/statuses is absent evidence, never a CI pass. Root application builds, Rust/browser/installed-platform tests, real mod loaders/games, renderers and target performance acceptance were not rerun for this assembly. No merge, deployment, target adoption or full-release readiness is claimed.
