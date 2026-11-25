# Web acquisition research and reliability

Reviewed November 25, 2026. Athena preserves the complete analysis of all ten repositories from the requested post, their primary sources, adoption decisions and limitations. The source review extends the existing provider/API, feed, pooled HTTP and browser routes.

- [Complete source analysis and evidence](https://github.com/Herbertofury/Athena/blob/scraping-reliability-2026-11-25/research/web-scraping-2026-11-25/README.md)
- [Implementation and measurement receipt](https://github.com/Herbertofury/Athena/blob/scraping-reliability-2026-11-25/research/web-scraping-2026-11-25/implementation-receipt.json)
- [Shared implementation routing](https://github.com/Herbertofury/Athena/blob/scraping-reliability-2026-11-25/guidance/registry/shared-capabilities.json)

## Which tool fits which job?

| Repository | Role and decision | Main qualification |
|---|---|---|
| Firecrawl | Optional local scraping and document worker | Local jobs are memory-only, default crawl limit is 100, and cloud handoff must be explicitly controlled |
| Crawl4AI | Schema-driven Python extraction and pooled rendering | Query-satisfaction stopping cannot establish exhaustive catalog completion |
| browser-use | Final escalation for workflows requiring interaction | Current cloud defaults and 1.x API require explicit host choices |
| Crawlee | Persistent queues, session management and resource-aware concurrency | Experimental adaptive rendering requires host-specific parity tests |
| Scrapy | Durable crawl state and error-aware per-origin scheduling | Keep one JOBDIR per run; JavaScript is a separate transport |
| MarkItDown | Convert already acquired documents | Preserve originals and use seekable spooling to avoid whole-stream buffering |
| Scrapling | Extraction and validated recovery from markup changes | Similarity alone does not prove correct field identity |
| scrcpy | Android device control | A separate device workflow, not an ordinary web crawler |
| AutoScraper | Assist adapter authoring with existing HTML | Retain host fetch/deadline/status policy and replay multiple page variants |
| curl-impersonate | Optional TLS/HTTP compatibility | Does not run JavaScript; compare current maintained descendants before selecting |

## Implemented consumer improvements

- Athena's collector validates its complete watch, runs four configurable workers, retains deterministic order and follows every available search page. Provider windows and partial failures remain explicit. The 19-repository watch includes the entire reviewed set. Its controlled complete-output HTTP fixture improved from 560.96 ms to 148.30 ms; this is not a live-GitHub or whole-app claim.
- [Gamesync #7](https://github.com/Herbertofury/Gamesync/pull/7) and [GameSync-Next #56](https://github.com/Herbertofury/GameSync-Next/pull/56) bind immutable request snapshots to transport, preserve independent readable bodies and prevent retired requests clearing newer owners. Their overlap fixtures reduce 30 requests to 20 with identical delivered items.
- [Enderloom #97](https://github.com/Herbertofury/Enderloom/pull/97) fixes incompatible transport sharing, stale cache ownership and parser worker settlement. The complete 2 MiB response fixture copies 106,318 fewer bytes through Buffer.concat with identical output hashes.
- [Modhunter #75](https://github.com/Herbertofury/Modhunter/pull/75) shares overlapping canonical provider URLs while retaining public Rust types and complete parsed observations. The 24-row alias fixture reduces 4 requests to 3; nonoverlapping arrivals retain normal revalidation.

The reconciled Research Explorer contains 392 candidates and 69 comparison plans. It preserves 105 previous candidates, 469 dated source observations and all current application policies, including Engine Foundry. Existing measured results are retained separately from planned upstream trials.

## Operation and acceptance

Use the collector's documented CLI with `--workers 4` and a new output path. `--workers 1` provides serial execution. Run the recorded tests before changing request identity, ownership, cancellation or response consumption. Preserve raw responses and provenance before conversion, and validate recovered fields and pagination before accepting parser output.

The linked changes are review branches. Fixture results establish only their stated workloads. Native Windows, Opera, MO2 and installed-package acceptance remain separate. The public-preview Athena runtime is verified; the complete profile still requires the pre-existing Foundry bundle. A repository Wiki mirror alone does not prove live Wiki publication.
