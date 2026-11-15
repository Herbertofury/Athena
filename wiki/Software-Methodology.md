# Software selection and evidence

[Browse the software workspace](https://herbertofury.github.io/Athena/#software) · [Catalog](Software-Catalog) · [Task guides](Software-Decision-Guides) · [Coverage and refresh priorities](Software-Coverage)

Athena helps a person choose software for a concrete task. The database keeps product identity, documented capabilities, suitability judgments, maintenance observations and measured results separate. The present expansion is a documentation-backed discovery catalog, not a claim that every program has been installed or benchmarked.

## How a tool earns a record

1. Identify a distinct product and the task it serves. A new edition, renamed project, package format or distribution channel does not automatically become another application.
2. Read the official project page, source repository or documentation. Use release pages, installation documentation and license files where those fields require separate evidence.
3. Record the official project and installation/download URLs. Prefer a stable official release or installation page over a versioned binary URL that may expire. A link that installs nothing is labelled accordingly.
4. Specify operating systems actually supported. Separate bootable rescue environments from ordinary desktop programs. Explain architecture, device, browser, runtime or plugin requirements in platform notes and limitations where known.
5. Distinguish the code license, access to source, the price of official binaries, optional subscriptions, hosted services and separately licensed models or plugins. Free, open source and source available are not synonyms.
6. Describe useful features, concrete tasks, strengths and limitations. Explain who should try the product and which tradeoff should trigger a comparison with another tool.
7. Attach dated sources to the claims they support. A source-review date does not mean the latest release was installed or that every claim on the site was independently reproduced.
8. Validate the complete record and canonical identity, then run the generated-catalog, search and browser gates. Preserve original research, unresolved questions and contrary evidence.

## What “best” means here

The decision guides rank choices **within a stated task and set of constraints**. A privacy-sensitive local workflow, a beginner who needs a graphical interface, and a team needing supported deployment can reasonably have different first choices.

| Recommendation role | Required reasoning |
| --- | --- |
| Overall fit for this task | Explain the task, required features, intended user and meaningful tradeoffs. A broad feature list alone does not establish superiority. |
| Free choice | Verify that the relevant mode or edition is available without payment. Do not silently include a trial or sponsor-only prebuilt binary. |
| Open-source choice | Verify the applicable code license and identify model, asset, service or component exceptions. |
| Premium choice | Explain what the paid workflow adds, and what can be achieved without it. Exact prices require a dated region/edition-specific source. |
| Low-overhead choice | Prefer a justified architectural property, such as a standalone command-line tool. Do not invent RAM, startup, battery or speed measurements. |
| Specialist choice | Name the specific format, hardware, field or advanced task it serves and the expertise it assumes. |

GitHub stars are attention signals, not quality scores. An unknown value stays unknown. Sorting by relevance is a text match; it is not a hidden product-quality ranking. Explicit alternatives are resolved to existing identities. Other tools in the same category may address different tasks and are not automatically interchangeable.

## Evidence levels and maintenance

New records use `official-docs-reviewed`; the original Windows catalog uses `legacy-research` and keeps its complete original evidence statement. Neither label means installed, audited, benchmarked or certified. Dated enrichment overlays refresh selected original records with supported platforms, installation pages and licensing/pricing distinctions. The complete original record remains available alongside those updates. Records without an enrichment retain their original Windows-focused scope; the filter is not a claim that those products lack other ports.

Maintenance values are `active`, `archived`, `discontinued` or `unverified`. Any value other than unverified requires a specific source and explanatory note. A recent commit is evidence of repository activity; it does not promise a supported binary, responsive issue triage or future updates. Stable mature tools can remain useful without frequent releases.

Claims about relative performance need a separate reproducible experiment: pin versions, hardware, operating system, input data and settings; verify complete equivalent output; repeat measurements; retain failures, resource use and uncertainty. Independent security evaluations must identify the exact test, version, date and scope. Until that work exists, Athena does not convert an editorial recommendation into a benchmark winner.

## Data and generated views

The canonical additions live in `data/software/systems.json`, `creative.json`, `development.json` and the automatically discovered `*-expanded.json` batches. Task guides live beside them. `scripts/build_software_catalog.py` combines the additions with the original Windows catalog, checks identity and source contracts, resolves alternatives, derives family/category relationships and writes the main application database and Wiki pages from the same records.

The original cleanup snapshot, Windows catalog, creative-AI catalog and engineering research library are immutable inputs to this expansion. Their checksums are recorded in `research/software-expansion-2026-11-14/baseline.json`. The imported PC records retain the full original fields. All 66 main cleanup candidates, three unranked candidates and one previously excluded candidate remain searchable with their original classifications, alongside 24 creative-AI research records. Existing model and engineering research records are not counted again as newly discovered desktop applications.

`data/software/taxonomy.json` assigns task categories and readable labels, consolidates synonyms and keeps old category URLs working after reorganizations. Taxonomy decisions change navigation, not the underlying historical source records. Related categories are derived from explicitly researched alternative relationships rather than assuming every tool in a broad family is interchangeable.

Run from the repository root:

```sh
npm run build
npm run test:software
npm run test:software:browser
python3 scripts/check_software_links.py --output software-link-report.json
python3 scripts/report_software_coverage.py --output software-refresh-report.json
```

`--check` verifies that generated data, workspace assets and Wiki pages match their sources. The public package allowlist must be reviewed and updated for changed runtime files. It is not silently rewritten by the catalog builder. Athena's existing full application checks remain in force.

## Link audit and refresh workflow

The **Athena software source audit** workflow runs weekly and on explicit dispatch. Pull requests run deterministic catalog and real Chromium acceptance checks; scheduled/manual runs also examine all official, download, repository, maintenance and provenance URLs. Each report includes the input catalog hash, time, final URL, HTTP status and associated record fields.

| Observation | Meaning and next action |
| --- | --- |
| Reachable | The server answered successfully. Inspect the content before changing factual claims. |
| HTTP 404 or 410 | The exact endpoint was unavailable. Confirm independently, look for the official successor, and retain provenance before updating the current record. |
| HTTP 401 or 403 | Authentication or access policy blocked the request. This is not proof of an abandoned product. |
| HTTP 429 | The service rate-limited the audit. Retry later at a lower rate. |
| Server or network error | The check could not establish availability. Keep the distinction visible. |
| Redirect | Record and review the final destination. A redirect does not by itself prove a project transfer is legitimate. |

The audit uses bounded requests and concurrency, retries HEAD refusals with a bounded GET, and never executes a download or deletes catalog entries. The strict gate flags missing current links while retaining the already-excluded historical 404 as evidence; it does not quietly promote that candidate. Human review is required before replacing claims. CI artifacts retain the audit and browser evidence; the actual GitHub Wiki sync workflow publishes managed pages while preserving unrelated and user-edited pages.

The workflow also recomputes a dated evidence-refresh queue. Records with unresolved fields or a latest source review more than 90 days old remain visible for human review. See [coverage and refresh priorities](Software-Coverage) for the complete backlog and categories needing more candidates.

## Remaining research work

Coverage is broad but not exhaustive. The next research should prioritize thin categories and fields rather than repeat popular apps: specialist commercial engineering and enterprise software, non-English and regional software ecosystems, accessibility testing with real assistive technology, exact ARM/platform compatibility, license differences in bundled components and prebuilt packages, and independent workflow benchmarks. Hosted tools and local tools need explicit privacy and deployment distinctions. Hardware-intensive or driver-level utilities need actual target-system validation before any performance recommendation.

Contributions should improve the decision a user can make. More rows alone are not evidence of better coverage.
