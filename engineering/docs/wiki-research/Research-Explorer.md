# Research Explorer: discovery, rankings and reproducible tests

[Explorer guide](https://github.com/Herbertofury/Engineering-Atlas/wiki/Research-Explorer) · [2026 research radar](https://github.com/Herbertofury/Engineering-Atlas/wiki/Research-Radar-2026) · [Planned test queue](https://github.com/Herbertofury/Engineering-Atlas/wiki/Research-Test-Queue) · [Community reports](https://github.com/Herbertofury/Engineering-Atlas/wiki/Research-Community)

**Canonical repository page:** [docs/research-explorer.md](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/research-explorer.md). This wiki edition preserves the documented evidence boundaries; repository commands below run from a project checkout.

[Open the Explorer](https://herbertofury.github.io/Engineering-Atlas/explorer/) · [Full catalog](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/research-catalog.md) · [Test queue](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/research-test-queue.md) · [Community reports](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/research-community.md)

The Explorer turns the Atlas source register into a searchable research queue. It covers repositories, languages, frameworks, tools, papers, methods, benchmarks and complete evaluated configurations. The consolidated catalog now contains **283 candidates across 20 stack layers and 18 research fields**, including **36 papers**, with **38 structured planned comparisons**. The latest expansion is dated **October 31, 2026 in America/Denver**, with primary sources checked **October 31 UTC**. Earlier dated observations remain preserved. This is a substantial reviewed snapshot, not an exhaustive claim about every field or a guarantee that an upstream project has not changed.

## What you can do

- Search names, descriptions, tags, repository identities, source titles and URLs, evaluation tracks, and planned comparison titles. Domain searches can find primary sources hosted outside GitHub.
- Filter by stack layer, research field, entry type, maturity, evidence, publication year, test track and planned comparison.
- Open a layer decision guide with reference choices, alternatives to compare, a research watchlist and a concrete adoption gate.
- Sort by editorial test priority, name, actual publication date, observed GitHub stars, reviewed community experience, one published benchmark, or one retained Atlas experiment.
- Compare up to four candidates and export a shortlist proposal, or open a registered comparison and export its full controls, gates, metrics, protocol and candidate set. Other active filters never truncate a registered plan export.
- Export the complete filtered catalog as CSV. Pagination does not truncate the export.
- Share a URL that preserves search, filters, ordering and benchmark cohort.
- Open the source, review the proposed experiment, or submit a public experience report from an entry.

Shortlists use browser-local storage. They are not public votes. The site reads a static, validated snapshot and never asks for an API key. Submitting a rating opens GitHub's issue form; it does not silently publish a message.

## One catalog, organized by the decision

The **Stack layer** filter groups the same candidate records by the job they perform: languages, shared cores, browser extensions, desktop hosts, large collections, rendering, assets, mod compatibility, plugin isolation, dependency solving, file processing, local data/search, network transfer, APIs, secure updates, builds, testing, optional AI, durable work, and analytics. A candidate may serve more than one layer without becoming a duplicate record.

Each layer has a compact decision guide. **Reference choices** are controls or complementary components worth establishing first. **Compare next** identifies alternatives with a tractable experiment. **Research watchlist** preserves previews, prototypes, documentation conflicts or reproduction gaps. These editorial roles do not override an entry's maturity, turn a source claim into a result, or make different roles comparable in one benchmark. The actual target's current implementation remains the first baseline.

The [existing stack-selection guide](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/stack-selection.md#stack-layer-comparison-map) is generated from this same layer map. The field/category remains a discovery axis; the evaluation track remains the boundary for community or measured comparisons. Selecting a layer does not create a new evidence cohort. Layer selection is included in shared URLs, CSV membership, and exported proposed test plans.

**Organization rule:** extend the existing candidate, layer map, research radar and test queue when a release or paper changes a decision. Keep dated source observations and failed comparisons. Create a separate candidate only when identity or a complete evaluated configuration requires it; do not create a new wiki page for each version, stack layer, source or repeated topic. The four existing research wiki pages mirror the canonical guides rather than becoming a second catalog.

The October 28 extension adds **61 candidates**, updates **22 existing records**, and registers **201 additional primary-source observations**. It preserves the previous source records and all measured cohorts. There are **173 dated public repository observations**; older observations retain their original timestamps. The site headline counts unique primary URLs; multiple retained observations of the same URL do not inflate it. These counts describe a reviewed snapshot, not continuous monitoring or an exhaustive survey.

## October 31 expansion and structured plans

The [current research synthesis](https://github.com/Herbertofury/Engineering-Atlas/blob/main/research/2026-10-31-stack-expansion.md) adds 68 candidates, refreshes 15 existing entries and records 164 primary-source observations. Fourteen additional paper records comprise twelve full-text reviews and two explicitly limited reviews. Stable releases, previews, historical paper configurations and older useful controls keep their own context.

The [test-plan registry](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/research-test-plans.json) holds 38 proposals. Selecting a **Planned comparison** shows its decision, controls, gates, metrics and protocol alongside the candidate results. The **Export complete plan** action includes every registered candidate even when a search or another filter hides some of them. The export is a proposal with unfilled execution metadata; no benchmark, acceptance or performance ranking is manufactured. CSV records plan membership, and shared URLs retain the plan ID.

The popularity snapshot now contains 231 repository observations, including 58 new records checked October 31. Earlier timestamps and the existing retrieval error remain intact. Result cohorts and community evidence have not changed: 11 retained cohorts, 35 observations, and zero approved reports in this snapshot.

## Ranking contract

There is no single blended score. An attention signal, a personal report and a measured outcome answer different questions.

| View | Meaning | Ordering | What it cannot establish |
|---|---|---|---|
| Test priority | Editorial order for the research queue | P1, P2, P3, then name | Performance, universal quality or production acceptance |
| GitHub stars | Public repository attention at an observed time | Count descending; missing last | Reliability, suitability, security, or superiority |
| Publication date | Latest dated publication among an entry's cited sources | Date descending; undated last | Project creation date, latest patch, or automatic superiority |
| Community | Reviewed experience reports in one evaluation track | Adjusted mean descending after three distinct accounts | Verified benchmark results, identity independence, or representative sampling |
| Published benchmark | Publisher-reported measurement for a complete configuration | The selected cohort's metric and direction | Atlas reproduction or comparison across versions, budgets or harnesses |
| Atlas measurement | Retained local observations from one defined experiment | The selected cohort's metric and direction | Acceptance in another application, device or workload |

**Missing is not zero.** Unknown publication dates, absent popularity snapshots, unavailable measurements and missing votes stay unknown. A measured zero, where the metric permits one, remains a real value. Ties use a deterministic name ordering for navigation; this does not establish statistical separation.

### Editorial priority

**P1 — test first:** directly useful to the Atlas's existing desktop, storage, tooling or evaluation work, with a tractable baseline and a clear correctness contract. **P2 — test next:** promising but dependent on a more specific project need or preceding experiment. **P3 — watch/explore:** research prototypes, platform-specific or expensive experiments, previews, or incomplete reproduction details. Each record explains the rationale. These are judgment calls that contributors may challenge with evidence.

Maturity is also editorial: established, emerging or experimental describes the adoption context rather than an earned score. A mature project can have a beta release. Stable and preview versions must remain separate at execution time.

### Community ranking

Reports use an integer 1–5 experience rating, a candidate ID, a matching evaluation track, the version used, and a description of the workload and evidence. An account contributes only its most recently updated approved report for a candidate and track. Stable GitHub account IDs avoid counting a renamed account twice.

At least **three distinct accounts** are required for ranking. The adjusted score uses a disclosed neutral prior:

    adjusted_mean = (sum_of_ratings + 3 × 5) / (report_count + 5)

The site shows the count and links the public reports. Raw mean remains visible in the entry details. The prior reduces the effect of a single enthusiastic report; it does not prevent coordinated accounts, selection bias, conflicts of interest or dishonest claims. A reviewed report means the submission passed the documented moderation boundary, not that Atlas reproduced it. No reports are preseeded.

See [community contribution and moderation](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/research-community.md) for the exact approval, edit invalidation, removal and refresh process. Closing an approved issue or removing approval removes it at the next complete refresh. Partial network failures keep the previous snapshot and its original observation dates rather than manufacturing a new consensus.

### Published benchmarks

The initial external observations cover **SWE-Bench Pro V2 Full** and **ProgramBench**. They belong to complete **model + agent harness + reasoning effort** configurations. A score is never attached to the benchmark repository or to an agent framework independently of its model.

SWE-Bench Pro V2 changed its task population and network/verification protocol. Its displayed budget groups were not preserved by text extraction, so the snapshot does not claim equal-budget comparisons. ProgramBench's fully resolved percentage is kept distinct from partial behavioral-test pass rates. Reported average API cost is contextual metadata, not a shared spending limit. Neither source has been reproduced in this contribution.

Only one cohort can be selected at a time. The displayed positions apply to the imported subset, not the complete publisher leaderboard. Exact model snapshots, harness commits, task revision, resource allocation and evaluation settings must be recovered before an Atlas reproduction. Public task exposure and uncertainty remain visible limitations.

### Retained Atlas measurements

The existing [Python JSON experiment](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/json-lab/README.md) supplies three parsers, three generated workloads and three operations: **27 observations in nine cohorts**. The builder derives medians directly from retained samples, checks their recorded values, attaches workload and raw-file hashes, and links the immutable source revision. It rejects an unexpected change to that historical evidence file.

These are **existing measurements from October 26**, not new executions in this contribution. They used CPython 3.12.14 on one Linux x86_64 host, with warmed in-process timings and randomized library order. No cold-start, peak-memory, controlled-hardware, confidence-interval or production-acceptance result is implied. Numeric and duplicate-key behavior can disqualify the faster path. The Explorer preserves that context beside the numbers.

## Data and build contract

| File | Responsibility |
|---|---|
| [research-catalog.json](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/research-catalog.json) | Stable candidate IDs, stack layers/roles, categories, kinds, source IDs, maturity, editorial priority and proposed tests |
| [source-index.json](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/source-index.json) | Complete dated primary-source register: preserved sources.json plus every indexed sources.d fragment |
| [research-test-plans.json](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/research-test-plans.json) | Planned-only comparisons with candidate/layer membership, controls, gates, metrics and protocols |
| [research-signals.json](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/research-signals.json) | Dated public GitHub counts, repository state, license metadata and retrieval errors |
| [research-community.json](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/research-community.json) | Reviewed public experience records; initially empty |
| [research-results.json](https://github.com/Herbertofury/Engineering-Atlas/blob/main/data/research-results.json) | Versioned external cohorts and source-reported observations |
| [build_research_explorer.py](https://github.com/Herbertofury/Engineering-Atlas/blob/main/scripts/build_research_explorer.py) | Validation, retained-result import, generated Markdown and fingerprinted web assets |
| [refresh_research_signals.py](https://github.com/Herbertofury/Engineering-Atlas/blob/main/scripts/refresh_research_signals.py) | Bounded, read-only GitHub retrieval and reviewed-rating ingestion |

Every candidate needs primary sources, an explicit test proposal, metrics and caveats. Publication date and check date are separate. Papers may record a primary-supported publication year when the day is unknown; year filters include these, while exact-date sorting leaves them undated. A candidate cannot acquire an accepted status through source review. Cohorts require an explicit metric, unit, direction, evaluation track, protocol, source, observation date and limitations. Candidates must match the cohort's track, and observations cannot override the cohort's evidence type. Multiple configurations require separate identities rather than silently replacing or averaging results.

Layer validation requires known candidate IDs, membership in the selected layer, one role per candidate within a layer, and at least one reference choice. Plan validation requires known candidates/layers, nonempty unique controls/gates/metrics/protocols and planned status; execution/result fields are rejected. Validation rejects duplicate identities, unknown source references, future dates, unsupported status promotion, malformed URLs, nonfinite results, incomplete local evidence, duplicate account votes and mismatched rating tracks. The browser renders text through DOM APIs, permits HTTPS source links, and neutralizes spreadsheet formula prefixes in CSV exports.

### Rebuild and verify

    python3 scripts/build_research_explorer.py
    python3 scripts/build_research_explorer.py --check
    python3 scripts/check_research.py
    python3 -m unittest discover -s tests -v
    node --test tests/*.test.mjs

The static app has no package install or runtime dependency. GitHub Pages serves the existing docs directory. The build fingerprints the catalog, JavaScript and styles together, and checks generated content against its inputs before publication.

The [retained implementation-validation record](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/research-explorer-validation/README.md) documents executable tests, inspected browser states and the remaining saved-download verification limit. These are software checks, not new candidate benchmarks. [Prepared wiki pages](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/wiki-research/README.md) preserve complete publishable wiki content alongside its canonical repository sources.

### Refresh data

    python3 scripts/refresh_research_signals.py --only repositories
    python3 scripts/refresh_research_signals.py --only ratings
    python3 scripts/build_research_explorer.py

Use a read-scoped GitHub credential through the documented environment variable when needed; never put a token in the site, URL or committed files. Respect API rate limits. Review the resulting data diff and retrieval errors before committing. The manual **Refresh research snapshots** workflow runs the same read-only collection and validators, then uploads a reviewable artifact. It does not commit or deploy; review and merge its data and generated-file diff to update the public snapshot. No recurring research schedule or background site monitoring is implied.

## What makes a future test eligible

Use the [experiment template](https://github.com/Herbertofury/Engineering-Atlas/blob/main/templates/experiment.md). State the decision, baseline and candidate revisions, target hardware/OS, dependency locks, workload hashes, required outputs, validation/error semantics, budgets, seeds, trial order and failure policy **before running**. Compare complete outcomes. Retain raw observations, negative results and disqualifiers. Separate cold start, warm steady state and changed-input behavior.

A claimed improvement needs to clear correctness, security, feature, resource and user-experience gates in the named target. Smaller output, omitted warnings, weaker validation, warmed caches presented as cold results, or a different workload do not establish a win. A paper or source leaderboard earns a place in the queue; adoption requires the target's own evidence.

## Scope and coordination

This contribution owns the Explorer, its data, tests and research documentation. It does not change Site Adapters, adapter pages, media fixtures, the collection engine or the existing experiment implementations. The existing research wiki pages are updated in place from the same canonical content. The October 31 extension maintains the same topical wiki and guide structure, with one dated research record for the new observations. Shared navigation changes are small and should be reapplied to the latest upstream text if another contributor updates them.
