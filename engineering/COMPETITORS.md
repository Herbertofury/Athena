# Competing approaches: navigation and decision map

Atlas already maintains a [research catalog](docs/research-catalog.md), [planned comparison registry](docs/research-test-queue.md), [app-study inventory](docs/app-study/README.md) and [ranking methodology](docs/research-explorer.md). These remain canonical. This page is a navigation layer, not a second candidate registry or a new benchmark result; it adds no new external source facts.

## Where equivalent alternatives belong

| User decision | Existing comparison lane | What would establish a useful advantage |
|---|---|---|
| Choose storage without losing data | Local catalog transactions; local analytics in the existing test queue | Full result parity, recoverable transactions, durable-write evidence and measured complete workload cost. |
| Build a smooth desktop UI | Desktop vertical slice; complete UI scheduling in the queue | Visible complete cards, input/scroll tail latency, accessibility, memory and end-to-end work completion. |
| Trust a benchmark | Command benchmark methods; profiler calibration; benchmark format | Reproducible workload identity, paired trials, raw failure retention and correctly scoped conclusions. |
| Run recoverable experiments | Recoverable orchestration and release/evidence lanes | Resume/cancel correctness, no duplicate side effects, traceable artifact identity and bounded resource use. |
| Learn from existing apps | App-study inventory and bounded workflows | A reproducible user journey and a verified target-app improvement, not a screenshot imitation. |
| Compare real media adapters | Adapter laboratory and media workbench linked from the README | Completeness, source provenance, access state, actual decoding/playback and recovery from failed media. |

## Competitive ambition without unsupported recommendations
- [ ] Keep baseline and candidate revisions visible beside every result.
- [ ] Compare the full user journey, including slow/error/restart paths; do not optimize only cache warmth.
- [ ] Route candidate additions through the existing source register and comparison registry.
- [ ] Preserve failures and last-good data; distinguish fixtures, public tests, authorized tests, player-ready and actually playing.
- [ ] Treat a promising candidate as unproven until it meets the same correctness, security, fidelity and resource requirements.
- [ ] Transfer a recommendation to another project's wiki/TODO only after an actual comparison against that project's implementation. Generated microbenchmarks do not satisfy this gate.
- [ ] During upstream review, record only meaningful deltas and their impact on an existing decision; do not repeatedly inflate the catalog with duplicate tools.

See the [research method](docs/research-method.md) for source dates, evidence levels and cross-project adoption boundaries. No native UI benchmark or external-app improvement was performed for this documentation addition.


## Potential foundations and cross-project composition

This is an extension of existing comparison lanes, not a new source registry or a target recommendation. Concrete candidates and their primary-source IDs remain in the linked catalog and plan registry.

| Foundation already present in Atlas | Reuse opportunity to evaluate | Improvement sought | Integration boundary / acceptance |
|---|---|---|---|
| Benchmark format and paired comparison scripts | Common workload/environment/output identity and regression classification | Make incomparable results impossible to present as wins | Accept sanitized receipts from projects only after schema validation. Require complete output hashes, resource budgets and retained failures. |
| Failure-preserving journal and bounded experiment runner | Run state, cancellation, restart and evidence retention contracts | Make interruption recoverable without overwriting last-good evidence | Compare against the actual consuming project's baseline before any recommendation leaves Atlas. Physical power-loss durability remains a separate test. |
| Source register, catalog and research queue | Stable source IDs, checked dates, candidate roles and existing plans | Remove duplicated research and distinguish stale from current claims | Athena can link to public research; private provider fixtures or account details must not migrate with those links. |
| Adapter/media evidence vocabulary | Explicit missing/access/ready/playing states and provenance | Prevent metadata success from masquerading as complete media support | Any shared schema proposal must preserve each app's data contract and be tested with malformed, incomplete and unavailable items. |

**Potential own-project integrations:** research receipts for MO2R, Hover, Minecraft tooling and Athena are possible interfaces to investigate, not proven upgrades. No implementation, dependency or deployment change is recommended to those projects by this document. First run the actual project baseline and candidate with requirements intact; only then publish a scoped adoption decision.

**License/compatibility checklist:** trace source and transitive licenses, fixture rights, schema versions, target runtime/OS and export privacy. Internal ownership does not imply permission to republish game data or private fixtures. Reuse code only after its exact revision and obligations are checked.

**Empirical status:** no new experiment ran for this section. Prior Atlas measurements retain their original workloads; generated workloads and external benchmarks do not prove a target-app improvement. Reject integration if evidence identity, completeness, durability, security or tail latency regresses.

## Review and evidence rules

Review date: **2026-11-12**. This is a comparison agenda, not a benchmark result or proof of superiority. Official-source capability descriptions and our proposed experiments are separate. Pin actual versions and licenses before reuse; record publication date separately from the date checked. Retain failed comparisons and rejected candidates.

During recurring reviews, inspect upstream releases, breaking changes, security notices and relevant issue reports; add a dated change note only for a meaningful change. Reuse the existing catalogs instead of creating another disconnected list. A missing observation is **unknown**, not unsupported. No new feature is silently authorized merely by appearing here.

For each proposed adoption, record baseline revision, candidate revision, identical workload, required outputs, correctness/security/compatibility checks, latency distribution, memory and reproducible raw evidence. Never make a target-project superiority claim from a synthetic microbenchmark. Keep private assets and traces out of public evidence.

## Publication status

This repository document is the canonical comparison entry point for this addition. A repository-backed wiki page can link to it without duplicating its tables. Native GitHub Wiki publication must be verified separately; a wiki-enabled setting or a source mirror is not publication proof.
