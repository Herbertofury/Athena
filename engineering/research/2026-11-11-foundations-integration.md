# November 11 app, mod and asset foundation integration

## Purpose and scope

The initial assembly joined sixteen independently published foundation drafts into one navigable research collection on Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922`. Start with the [app, mod and asset foundation routes](../docs/app-mod-foundations.md). No runtime, target configuration, active integrated release, workflow, merge or deployment is changed. Other drafts and unpublished/private material are outside this assembly.

This is a compatibility and preservation check of existing research, not a new benchmark or a comprehensive re-audit of every original scientific claim. Original guides distinguish documented behavior, synthetic observations, receipt checks, fresh execution and target acceptance. Those distinctions remain in force.

The later texture extension includes #44; the subsequent checker and host-navigation integrations below incorporate the exact published #4 and #24 repairs. Earlier assembly counts, diagnostics and exclusions remain historical, not the current aggregate. The frozen-input manifest contains all seventeen research contributions plus the separately identified supporting fixes.

## Initial #27–42 inputs

All sixteen initial source PRs were open drafts at the first integration snapshot. The [machine-readable input manifest](foundations-integration-inputs-20261111.json) records their heads, trees and every contribution path/blob/mode. Commit pins below identify source snapshots even if a draft advances later. Existing drafts remain unchanged and open; this combined candidate does not silently accept or close them.

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

## Initial #27–42 conflict resolution and preservation

There are 248 source contribution file instances across the sixteen drafts and 227 unique paths. Exactly 224 independent added files remain byte-for-byte equal to their published Git blobs; there are no conflicting independently added paths.

Three shared paths are reconciled explicitly:

- `data/source-index.json`: retain all 29 baseline files and union all 16 additive fragments. The 45-file index loads 2,384 unique source records, retaining all 2,206 baseline records plus 178 additions, with no duplicate source IDs.
- `docs/mods.md`: retain the exact baseline bytes and all six distinct append-only tails, in source-PR order.
- `docs/game-assets.md`: retain the exact baseline bytes and both distinct append-only tails, in source-PR order.

Repeated URLs are not blindly deduplicated: different observations, versions or source IDs remain attributable. Independent review examined 17 repeated-URL groups involving additions, including seven overlapping across new contributions, without finding contradictory notes. This is not a claim that every underlying upstream page was freshly reread.

Integration-only additions are the routes page, its README entry, this record and the frozen-input manifest. The existing Research Explorer catalog, generated assets, rankings, source observations and historical evidence are unchanged.

## Initial #27–42 aggregate verification

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

## Historical texture extension: #44 added to #43

The integration branch is extended from `54aa54fc20daa404564da3d0dffa1205afdac7f7`, preserving the original sixteen contributions, with published draft [#44](https://github.com/Herbertofury/Athena/pull/44) frozen at `5ad47fd4634e0e73c651bd40077463cb746c3b33` (tree `b87f7b667b92b091105d7f81a8df63378e9b5280`). Both drafts and main were rechecked before assembly; main remains `44384b809c80e03adbd62f8be9617d01e6ad9922`. The [input manifest](foundations-integration-inputs-20261111.json) retains all original entries and adds the fifteen exact #44 file records. No existing source draft is changed or closed.

The extension adds [texture semantics](../docs/texture-semantics.md), its [pinned CPU resampling experiment](../experiments/texture-resampling-lab/README.md), retained original and independent execution receipts, 38 offline contract tests and a [target acceptance template](../templates/texture-acceptance-receipt.md). The route page now connects color/scalar interpretation, alpha association and cutout sample coverage to actual renderer acceptance. No source is promoted to a performance ranking or production result.

Preservation checks distinguish original contributions from integration-only navigation:

- All 237 independent contribution files across seventeen source drafts match their published Git blobs byte-for-byte, including all 224 originals and thirteen additions from #44.
- All 263 source-file instances are retained in the manifest. The shared source index now has 46 files and 2,394 unique source records: 2,206 baseline records plus 188 additions across seventeen fragments. The original 2,384 records remain unchanged. Source freshness validation still flags the same 135 baseline records as overdue for review on November 11; they are not silently refreshed, hidden or claimed current.
- The game-assets overview retains every prior byte and appends only #44's four-line navigation tail. The mods overview remains unchanged. No conflicting independently added path was found.
- The README entry, foundation route, integration record and manifest are the only integration-authored changes. Source guides, lab code, source observations and receipts remain exact copies. Generated assets and the Research Explorer catalog/rankings remain unchanged.

The same aggregate command set above was rerun on the extended candidate:

- Complete Engineering Python: **857 tests, 856 pass and one inherited error, no skips**. The 38-test increase is #44's offline suite; it is not a new C execution.
- Complete Engineering Node, including the separately located glTF suite: **420/420 pass, no skips**.
- All five generated-output checks pass; Research Explorer still reports 283 entries, 528 catalog sources, 11 cohorts, 35 observations and 38 plans.
- The current original texture receipt passes verification against the preserved inputs. The fresh C replays remain the two executions documented in #44; this integration did not repeat dependency-backed experiments.
- The exact-main Python baseline was rerun and still reports **326 tests, 325 pass and the same inherited error, no skips**. The unchanged complete research checker fails only for the existing cross-root Lab README link described above. No warning, link or test is removed or weakened.

The earlier #4 diagnostic applies only to the initial 819-test assembly and was not rerun or incorporated for this extension. It must not be presented as a green result for these 857 tests. Hosted CI must be checked against the exact updated remote head; local results do not establish hosted CI, root-app, Rust, browser, native-game or renderer acceptance. The expanded candidate remains draft, with no merge, deployment, active release changes, denied/held content or target-project adoption.

## Historical source refresh and acceptance limits

Independent live sampling confirmed official Forge Java 17/64-bit prerequisites, Fabric's current 26.2 heading versus Minecraft 26.1/JDK 25 body, and SQLite single-writer/transaction boundaries. The pinned Gradle 9.2.1 compatibility page was unavailable through that review tool and was not bypassed. The original source notes keep their prior version/date/retrieval qualifications. No claim of a complete fresh external-link or factual audit follows from this sample.

These research-only paths are ignored by the existing root push/PR learning workflow; nested Engineering workflows are not root workflows. Zero hosted runs/checks/statuses is absent evidence, never a CI pass. Root application builds, Rust/browser/installed-platform tests, real mod loaders/games, renderers and target performance acceptance were not rerun for this assembly. No merge, deployment, target adoption or full-release readiness is claimed.

## Historical checker integration: exact published #4 repair

The next extension starts at `6ee44840e0f4871d7474b5d4809e0d2cab465c63` and incorporates the four exact published files from [draft #4](https://github.com/Herbertofury/Athena/pull/4), frozen at `22d05b4ae663128821f106958cc99a7991ed5d2e` (tree `a151109d1daa5809bd5e17fbd13348b397671933`). The [manifest](foundations-integration-inputs-20261111.json) records this as a supporting fix, not an eighteenth research fragment. Both draft heads and main were rechecked before assembly. Main remains `44384b809c80e03adbd62f8be9617d01e6ad9922`.

The fix is copied without modification: `local-link-policy.json`, `scripts/check_research.py`, repository-root `tests/research_link_test.py` and `tests/research_links.test.cjs`. The previous checker matched current main exactly, and the three added paths had no collision. All 2,631 input blobs were materialized and hash-verified; all seventeen research contributions, source fragments, independent files and earlier receipts remain intact. The only other changes are this dated record, the foundation route’s current validation description and the additive supporting-fix manifest entry. No root app, release implementation, workflow or target configuration changes.

The policy allows only the canonical checker’s explicit `../docs` directory. Custom roots cannot grant themselves access. Traversal outside allowed roots, escaping symlinks, absolute/Windows paths, file URLs and malformed controls remain rejected. Escaping Markdown sources are rejected before reading. This is an offline documentation checker, not race-safe isolation against concurrent hostile filesystem mutation, external-URL validation or exhaustive Markdown/fragment parsing.

Current local validation on the combined candidate:

- Complete Engineering Python: **857/857 pass, no skips**. This fixes the inherited cross-root failure rather than suppressing it.
- Complete Engineering Node, including the separate glTF suite: **420/420 pass, no skips**.
- Dedicated containment suite: **38/38 pass**. Both root Node bridge tests pass. These rerun overlapping checks and must not be added to a unique-test total.
- Root `npm run build` passes with 90 lessons. Root `npm test` passes: 135 root Node tests, 105 media tests and 313 downstream Python tests across their separate suites. These scopes overlap other checks above and are not a single distinct-test count.
- Complete research check passes: **281 Markdown files and 2,394 sources**. The same **135 overdue baseline source-review warnings** remain visible; a structural pass is not factual freshness.
- All five Engineering generated-output checks pass. The root Research/Media and Lab reproducibility checks pass. Root curriculum build preserves the tracked generated bytes; no generated changes are included.
- Independent review verifies exact checker/input preservation and custom-root containment. Its additional 55 adversarial path/policy probes pass, including checks that escaped targets are not inspected for existence. This is additional bounded evidence, not a formal security proof.

Local `npm run test:browser` passes its three initial reproducibility stages, then stops before any static browser check because the required Chromium executable is absent. One official Playwright install attempt returns invalid/truncated ZIP data and fails; no alternate browser, version substitution or bypass is used. Workshop/accessibility browser, Rust test/clippy/build and engine-backed browser stages therefore remain **not run**, not passed. The original #4 PR and push runs at its older head passed build, npm tests, static and workshop browser checks but failed the unchanged accessibility focus-return harness. Those historical results are not acceptance of this combined head.

Unlike the earlier Engineering-only extension, the new root containment tests make this change eligible for the existing root CI workflow. Exact-head hosted status must be read after publication and reported separately; local success is not hosted-CI completion. No workflow is edited, no historical failure is erased, and no runtime/browser behavior is changed to get green checks. This remains a draft research foundation with no merge, deployment, held/private additions or target-project adoption.

## Current host-navigation integration: exact published #24 repair

This extension starts at `4d9542b955869ede6b5e0df132ce1643b1a7ceb7` and adds the three exact published files from [draft #24](https://github.com/Herbertofury/Athena/pull/24), frozen at `4e13efecff1a657e9ac41a3225848431ab9b59a6` (tree `ed13d45b489d1e7aedb463a330fe23db48e2c76c`). The [manifest](foundations-integration-inputs-20261111.json) preserves the seventeen research inputs and checker fix and records #24 separately as a supporting host repair. No additional source fragment or research ranking is implied.

The preceding checker-integrated head passed the full local research/build/test checks, but its exact [PR run](https://github.com/Herbertofury/Athena/actions/runs/42963204850) and [push run](https://github.com/Herbertofury/Athena/actions/runs/42963200265) both failed the unchanged accessibility harness’s stale/repeated-close check at `scripts/test_accessibility_browser.cjs:64:334`. Static and workshop Chromium passed in both runs. The timeout occurs while waiting for Search focus after a stale lesson-close event is dispatched on the new route. Those failures and complete browser artifacts remain preserved; they are not overwritten by this extension.

Published #24 addresses the corresponding runtime ownership defect: hash navigation clears pending lesson-close ownership before closing an open dialog. The obsolete event cannot rerender the new screen, steal focus or erase newly submitted Review feedback. Normal closes and newer reopened lessons retain their separate control cases. This is the published runtime repair, not a browser timing workaround.

Exact scope and preservation:

- `dist/app.js`: exact #24 runtime blob, with the one navigation-ownership assignment.
- `config/runtime-public-preview.json`: exact matching #24 app hash; no unrelated allowlist entries change.
- `tests/navigation_close_ownership.test.cjs`: exact published six-case regression suite.
- The only integration-authored edits are this record, the foundation route and the additive supporting-fix manifest. All 2,634 incoming blobs were materialized and hash-verified before overlay. The original app and allowlist matched main, so no independent runtime edit was overwritten; the regression file had no collision.
- All 237 independent research files, 2,394 sources and four #4 checker blobs remain exact. Existing browser harness, harness-contract tests and related original focus-evidence files keep their previous bytes/presence. No workflow, backend, progress schema, provider or Foundry change is included.

Validation on this combined candidate:

- The exact new six-case regression suite reproduces **four failures and two passing controls** on the preceding `4d9542b` implementation, then **passes all six** with #24. Synchronous and queued repeated navigation and newer-lesson cases remain included. These are DOM/event-order checks, not graphical-browser acceptance.
- Complete Engineering Python **857/857** and Engineering Node including the glTF suite **420/420** pass, without skips. Complete research validation passes with **281 Markdown files, 2,394 sources and the same 135 overdue baseline source-review warnings**.
- Root build passes with 90 lessons. Complete root npm tests pass: **141 root Node, 105 media and 313 downstream Python tests**, with no failures or skips. Counts overlap other recorded suites and must not be summed into one unique total.
- All five Engineering generated-output checks, root Research/Media and Lab reproducibility checks, and exact public-preview packaging pass. The package contains **37 packaged runtime files**, comprising **35 hash-allowlisted source files and two generated entries**. Packaging is not deployment or delivery acceptance.
- The dedicated 38 containment tests and both checker bridge tests remain passing. No test, warning, assertion or publication boundary is removed to make the candidate pass.

No new local graphical-browser launch is attempted in this extension. The earlier local browser setup failure remains in the preceding evidence. New hosted acceptance must be read for this exact combined head after publication. Published #24’s historical [PR run](https://github.com/Herbertofury/Athena/actions/runs/42893451920) passed all stages, including actual Rust-backed Chromium, while its separate [push run](https://github.com/Herbertofury/Athena/actions/runs/42893400661) failed a later ordinary-close focus wait in the workshop loop at line 68. Neither historical outcome guarantees the new head, and one pass does not erase a separate failure. No reruns for a favorable result or harness corrections are included.

The new candidate remains draft and unmerged. It is a coherent research foundation with a narrowly scoped host repair, not evidence of universal source freshness, target-project adoption, complete accessibility reliability or production-release readiness. No merge or deployment.
