# Research Explorer implementation validation

This record covers the searchable research catalog and its data pipeline on October 28, 2026 UTC. It is **software validation, not a new benchmark of any catalog candidate**. The research snapshot is dated October 27 in America/Denver.

## Retained checks

- [Machine-readable record](checks.json): catalog counts, generated-asset hashes, browser observations, limitations and repaired validation failures.
- [Python suite output](python-tests.log): 166 tests passed, including source contracts, ranking evidence, snapshot ingestion and pre-existing project guards.
- [JavaScript suite output](javascript-tests.log): 145 tests passed with test isolation disabled to expose the individual cases. The normal CI command also runs the same test files.

The browser checks used the managed local preview. Search, shortlist comparison, one retained JSON measurement cohort, one ProgramBench cohort, and the community empty state were inspected. A 390-pixel iframe had a 375-pixel content viewport and a matching 375-pixel document width. This establishes the inspected responsive layout, not physical-device compatibility or performance.

## Known verification limit

The CSV and JSON export controls triggered browser downloads, but the automation download provider reported failures and did not retain synchronized files. CSV payload, filtering, cohort scope, zero/missing handling and formula safety are covered by executable tests. An actual saved-file check remains unverified in this environment; no successful download is claimed here.

## Evidence boundaries

The Explorer imports 27 historical JSON observations and eight publisher-reported observations. It introduces 16 planned experiments and zero approved community ratings. None of these software checks converts a proposed experiment, external report, or popularity count into an Atlas performance win.

See the [ranking and data contract](../../docs/research-explorer.md), [research review](../../research/2026-10-27-explorer-review.md), and [test queue](../../docs/research-test-queue.md).

## Published deployment

[Publication receipt](published-2026-10-28.json) records the merged revision, successful Linux/Windows CI and Pages jobs, and actual live-browser observations. [Live Explorer screenshot](live-explorer-2026-10-28.jpg) shows the published overview. The saved-download verification limit also occurred on the deployed HTTPS site and remains open.

[Wiki verification](wiki-publication-2026-10-28.json) confirms all four research pages are published and byte-identical to their repository copies. Original Home and Sidebar content remains intact, and all 15 Site Adapters and adapter pages are unchanged. A concurrent `Experiment-Evidence.md` contribution was preserved. [Live wiki screenshot](live-wiki-2026-10-28.jpg) shows the published guide and research navigation.

The live contribution link was checked without submitting an issue. After GitHub completed rendering, it prefilled `orjson` and `json-serialization` and left the rating at `None`. An early accessibility snapshot had appeared incomplete; the settled form corrected that observation, so no implementation change was needed. The two report labels are configured, and the reviewed snapshot still contains zero approved community reports.

## Consolidated stack-layer extension

The October 28 continuation adds **61 candidates**, updates **22 existing records**, and maintains the existing research guides and wiki pages. The Explorer now has **215 candidates across 20 stack layers**, **355 distinct primary URLs** represented by **364 catalog source records**, **173 dated public repository observations**, and **20 planned comparisons**. The original checks and publication receipts above remain historical evidence; this section records the later extension.

- [Stack validation record](stack-checks-2026-10-28.json): exact counts, generated hashes, preserved source/signal history, role-map review repairs and browser outcomes.
- [Python output](stack-python-tests-2026-10-28.log): **176 tests passed**.
- [JavaScript case output](stack-javascript-cases-2026-10-28.log): **151 tests passed** with test isolation disabled; [standard command output](stack-javascript-tests-2026-10-28.log) confirms **19 test files passed**.
- [Narrow layout screenshot](stack-mobile-2026-10-28.jpg): the selected layer guide uses one column inside the inspected 375-pixel content viewport without horizontal document overflow.

Layer filtering, search/link intersection, observed-star ordering, reset behavior and mod ecosystem scoping were inspected in the browser. The HTTP preview correctly falls back to an address-bar instruction when clipboard access is unavailable. Saved-download verification remains limited as described above. No new candidate benchmark, community vote or target acceptance is claimed.

The extension is merged through [PR #2](https://github.com/Herbertofury/Engineering-Atlas/pull/2). The [stack publication receipt](stack-publication-2026-10-28.json) records successful Linux/Windows validation, Pages deployment, the live 215-candidate snapshot and a verified HTTPS clipboard share link. The [wiki receipt](stack-wiki-publication-2026-10-28.json) verifies all four existing research copies, one in-place Home paragraph update, zero new pages, an unchanged Sidebar, all 15 protected adapter pages, and every other existing page. [Live stack guide](stack-live-explorer-2026-10-28.jpg) and [live wiki guide](stack-live-wiki-2026-10-28.jpg) screenshots preserve the inspected published states.

## October 31 stack, methods and plan extension

The current pass contains **283 candidates, 36 papers, 20 layers and 38 planned comparisons**. It adds 68 candidates, refreshes 15, and registers 164 primary-source observations. Fourteen additional paper records comprise twelve full-text reviews and two explicitly limited reviews. All remain candidates; the 11 retained result cohorts and 35 observations are unchanged.

- [Dated validation record](stack-checks-2026-10-31.json) records counts, source/signal/result preservation, generated hashes and review repairs.
- [Python output](stack-python-tests-2026-10-31.log): **250 tests passed**.
- [JavaScript output](stack-javascript-tests-2026-10-31.log): **42 test files passed** under the standard repository command.

The new tests cover planned-only data contracts, complete plan export despite active filters, URL state, source-domain search and additive-source deterministic fixtures. All historical source files, repository observations, community records and research-result inputs remain intact. The source checker reports 1,364 registered sources with no stale records at this check.

Local validation completed before publication. The public deployment, live-browser behavior and separate wiki publication are verified in a subsequent publication receipt; the older October 28 screenshots above do not establish the new version's UI behavior.
