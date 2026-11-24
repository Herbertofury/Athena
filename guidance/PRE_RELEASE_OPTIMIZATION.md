# Pre-release optimization gate (zero-loss)
 
Owner directive, 2026-11-24. This is an additive project-owned release standard for Athena and the owner's repositories. It complements the existing [performance acceptance](PERFORMANCE_ACCEPTANCE.md), runtime proof, product invariants, supply-chain and third-party skill security standards; it does not change the versioned 16-document governance bundle or grant new permissions.

## Required at every release candidate

The release agent must run a bounded, evidence-backed pass through all three tools for applicable source/workloads before finalizing a release. Run the checks early enough to fix failures, and revalidate the final candidate. For data/research/docs-only, already-native Rust, incompatible runtimes, or other unsupported scopes, record each tool's applicability and why it is not safe or useful; do not force a port. A required baseline failing, missing mandatory acceptance evidence, or a genuine release-blocking defect is a hard blocker. A missing/untrusted/unavailable optimization tool is a blocker for that experiment, not a successful pass. Do not silently waive any of the three core assessments: use a safe equivalent for the required evidence when possible and record the named tool as deferred with reason and follow-up. Optional optimization discovery is not allowed to hold a sound release hostage. Existing stronger project-specific acceptance gates remain mandatory.

### Trusted sources and isolated execution

- [shrink-anything](https://github.com/EL4CTEO/shrink-anything): [upstream README](https://github.com/EL4CTEO/shrink-anything/blob/main/README.md).
- [fast-anything](https://github.com/EL4CTEO/fast-anything): [upstream README](https://github.com/EL4CTEO/fast-anything/blob/main/README.md).
- [rust-anything](https://github.com/erkamyaman/rust-anything): [upstream README](https://github.com/erkamyaman/rust-anything/blob/main/README.md).

Before installation/execution, inspect the exact upstream version, license, source, dependency/install scripts, MCP/agent capabilities and applicable security advisories; record an immutable commit or package version and artifact digest where available. Use verified official distributions and a disposable, least-privilege worktree/container with local tools/caches and synthetic fixtures. Do not run remote scripts blindly, use global setup, transmit private code/data to external agents/services, expose secrets, touch production databases or run with production credentials. Respect the project's license and the user's authorizations. Do not override existing pinned toolchain constraints. Never modify third-party code or distribute assets without rights.

## Sequence

1. Establish a clean, recoverable baseline of the exact release candidate: commit SHA, supported platforms, toolchain, original test inventory, builds, native/browser/game workflows, representative workloads, expected outputs/side effects, package size and applicable performance/resource metrics. If the baseline fails, diagnose first. Check dynamic loading, reflection, plugin registries, serialization, compatibility paths, external asset links, and generated data.
2. **Shrink**: run `shrink-anything doctor`, `scan` and applicable `weigh` on the build. Use `cut -- <real regression command>` or agent-assisted `task` only with a strong passing baseline and explicit file scope. Keep tests, public API, registered IDs, documentation, source evidence, translations, release assets, user data and original content; no aggressive deletion or test weakening. Run `verify` and `report`; undo rejected cuts. No tests or insufficient dynamic coverage: scan only, record blocker/limitations.
3. **Fast**: use `fast-anything doctor` and `scan -- <representative command>` on supported runtimes. Profile before changing anything; use the measured slow path, not a toy benchmark. For a worthwhile candidate, use `port`, agent implementation, `verify`, and isolated `enable` plus `bench`/ `report`. Reject if end-to-end work, correctness or resource cost regresses; disable rejected ports and restore the original. Existing native Rust paths use native profiling, not needless bridging.
4. **Rust**: use `rust-anything profile`/ `analyze` for applicable workloads and evaluate the best eligible hotspot or migration candidate. For a selected unit, use the upstream documented bridge/record/build/diff/fuzz/bench/gate/report loop; keep original fallback/disable route. Record and replay equivalent side effects as well as values/errors. Run generated-input recording in isolation: upstream warns it executes real original code repeatedly. Fast and Rust may propose the same change: compare on independent branches from the same baseline, not stacked bridges. Promote only the best verified implementation. Whole-app rewrites are not a release obligation and require a separately justified scope and parity plan.
5. Run independent checks after each candidate and the combined final candidate: full baseline tests (including test inventory and coverage parity), new adversarial cases, supported-platform builds, lint/security/dependency/license checks, API/ABI and save/data migrations, exact end-to-end workflows, cold/warm startup, responsiveness, throughput, peak memory and CPU/GPU/I/O/network/power where relevant. Use repeated interleaved runs on equivalent data/hardware; record p50/p95/p99 or frame/tick tails as applicable and measurement noise. Benchmark the shipped build including bridge, runtime, install, disk and startup overhead. Protect accessibility, quality, completeness, portable-folder data, offline mode, compatibility and fallback. No faster-by-doing-less. An improvement must be material beyond noise in at least one target dimension, with no material regression in any protected dimension or undisclosed tradeoff. No hard-coded speedup promise.
6. Keep only individually verified wins, with incremental commits and reproducible rollback. Restore failed/neutral/unmeasured experiments; never delete user files, caches outside the worktree, existing evidence or other agents' work. Re-run acceptance on the exact promoted head. Report blocked items honestly; do not call a missing check a pass. If all applicable passes are completed and no safe win exists, the unchanged baseline is acceptable for ordinary releases (not proof of improvement for an explicitly requested optimization task).

## Release checkout v2: confidence without release paralysis

The owner requires an exceptionally effective, fast release checkout across all repositories. Optimize for verified risk reduction and genuine user-visible gains per minute, not tool count, percentage of code deleted, or number of green badges. Do essential checks continuously on changed code, leaving the release candidate with only the final evidence reconciliation and artifact smoke checks. Do not force the entire tool catalog onto every project.

### Risk lanes and default extra-work budgets

These are suggested **additional discretionary optimization/review budgets**, not timeouts that waive correctness or safety. Classify the actual diff, dependency graph, generated output, release platform and changed user workflows; raise the lane whenever risk is unclear. Existing project-required checks always take precedence.

| Lane | Typical scope | Checkout strategy | Extra discretionary budget |
| --- | --- | --- | --- |
| Quick | Documentation, metadata, data-only corrections, small low-risk fixes | Relevant existing checks, schema/link/provenance checks as applicable, structural diff review, core tool applicability decisions, final artifact smoke | Up to 5 minutes |
| Standard | Ordinary features, bug fixes, dependency/packaging changes, routine releases | Quick lane plus affected integration tests, changed-path static/dependency checks, one representative equivalent-work benchmark and the three applicable core tool passes | Up to 15 minutes |
| High-risk | Unsafe/FFI, credentials/security, storage/migration, concurrency, game/runtime/renderer, installer/updater, large compatibility change | Standard plus risk-specific tests: real supported environments, replay/rollback, fuzz/Miri or targeted profiling as appropriate; wider matrix where needed | Up to 30–45 minutes of exploratory work; mandatory evidence may take longer |

An urgent security or regression hotfix uses the smallest **sufficient** scope with the affected mandatory gates and release smoke, not a loophole for unsafe publication. Reuse recent valid evidence for unaffected components; record the follow-up deeper audit when appropriate.

### Required fast path and intelligent routing

- Establish exact candidate identity, target platforms, changed components, risk lane, affected workflows and relevant last-good baseline. Run the project's existing build, tests, lint/type checks and required native/integration checks. Reuse existing tools and commands rather than installing redundant ones.
- Run independent read-only checks in parallel when safe; deduplicate overlapping analyzers; serialize destructive or resource-contentious work. Benchmarks run isolated from other CPU/GPU/disk-heavy jobs. Do not oversubscribe machines or block the UI unnecessarily.
- Reuse verified tool installations, dependency/build caches and test evidence keyed by exact relevant source inputs, lockfile, build flags, tool/runtime version, OS/architecture and fixture/workload identity. Changes to shared dependencies, configuration, tests, security rules or target environment invalidate affected evidence. Never reuse stale evidence for a changed path or claim a prior run proves a new release artifact.
- For shrink/fast/rust, record each applicability assessment every release. Run applicable safe scans/profiles early; reuse valid results for unchanged inputs. Only experiment on a material, causally supported opportunity within the available budget. Compare overlapping port proposals independently; no double bridges. Prefer native algorithms, data structures, caching and batching over gratuitous migrations. Do not force a rewrite or keep an unmeasured change.
- Run additional tools according to the matrix below, or equivalent reviewed project tools. Use focused checks by default, full checks when risk/coverage demands it, and report unsupported platforms or missing evidence explicitly.
- Limit ordinary optimization to one bounded challenger pass and at most one focused follow-up for a clear promising candidate. Stop on diminishing returns, no material win, incompatibility, or budget exhaustion. Preserve rejected/deferred work as a concise actionable Athena/project backlog entry, not a lingering experimental patch. No retry loops to manufacture a passing result; diagnose flaky tests and retain the failure evidence.
- Re-run checks invalidated by accepted changes; do not restart the entire checkout unnecessarily. Verify exact final candidate, actual packaged artifact (digest, reproducible build where supported, license notices, clean install/launch/update/rollback as relevant), and release notes. Separate fixture, native and deployed evidence.
- In ordinary releases, ship once all mandatory gates pass, all retained changes are independently verified and the core assessments are accounted for. A sound unchanged baseline with no safe win is a valid result. Deep comparative work, large rewrites, long fuzz campaigns and broad audits belong on separate branches or scheduled/manual maintenance runs unless required to resolve a release blocker. Do not create unsolicited background jobs or make a deep optimization campaign the default dependency of a release.

### Additional tool matrix (13 upstream-reviewed additions)

The [machine-readable catalog](registry/release-checkout-tools.json) records all 16 tools, upstream sources, triggers and intended use. The following are reviewed candidates to route into a checkout, not a globally installed or trusted version lock. Inspect and pin each selected version and distribution before execution. No global installations or unsolicited paid/cloud services.

| Tool | When to run | Efficient use and guardrail |
| --- | --- | --- |
| [Criterion.rs](https://github.com/criterion-rs/criterion.rs) | Changed Rust hot paths | Reuse representative microbenchmarks; statistical comparison plus end-to-end proof. Active project moved from bheisler/criterion.rs. |
| [Hyperfine](https://github.com/sharkdp/hyperfine) | Startup, CLI, batch or packaging latency | Repeated cold/warm equivalent commands with exported results and noise control. |
| [Tracy](https://github.com/wolfpld/tracy) | Frame/tick, GPU, allocations, locking or deep latency diagnosis | Targeted capture using existing instrumentation; no extra release instrumentation overhead or external telemetry. |
| [cargo-bloat](https://github.com/RazrFalcon/cargo-bloat) | Native Rust artifact growth, changed features/dependencies | Reuse matching release build; inspect size attribution; no unsupported WASM claims. |
| [cargo-machete](https://github.com/bnjbvr/cargo-machete) | Changed Rust manifests or dependency cleanup | Advisory scan; verify feature flags, build scripts, target-specific and dynamic use before removal. |
| [cargo-nextest](https://github.com/nextest-rs/nextest) | Rust test runs when supported | Faster test execution; preserve inventory, doctests and platform/feature coverage through separate checks as needed. |
| [cargo-deny](https://github.com/EmbarkStudios/cargo-deny) | Relevant Rust dependency/supply-chain checks | Reviewed rules, advisories/licenses/source constraints and pinned inputs; no blind dependency changes. |
| [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz) | Changed parsers, untrusted input, codecs, security-critical algorithms | Existing corpus replay and bounded targeted fuzzing on supported platforms; longer campaigns off release path. |
| [Miri](https://github.com/rust-lang/miri) | Changed unsafe Rust, aliasing, ownership, concurrency-sensitive Rust | Focused supported tests on separately pinned nightly; does not replace real FFI/native checks or prove absence of undefined behavior. |
| [Knip](https://github.com/webpro-nl/knip) | JS/TS exports, dependencies or build/import changes | Read-only configured scan; preserve framework conventions, dynamic loading and public exports. |
| [Playwright](https://github.com/microsoft/playwright) | Web UI/browser workflows | Reuse real affected E2E tests and a packaged/served smoke; widen browser/device coverage according to risk. |
| [Semgrep](https://github.com/semgrep/semgrep) | Supported changed code and security-sensitive changes | Local reviewed rules and relevant scope; no source upload or credentials; not a replacement for full security tests. |
| [Difftastic](https://github.com/Wilfred/difftastic) | Material source edits, refactors and automated ports | Structural review alongside ordinary Git diff; not evidence of behavioral equivalence by itself. |

### Promotion and hard-stop rules

**Hard blockers:** known material regression, failing mandatory checks, data loss/corruption, broken promised platform/workflow, unsafe packaging or supply-chain integrity, unresolved material security/license issue, missing required native/real-runtime acceptance, or unverified optimization retained. Resolve or revert the candidate. A time budget is never a waiver. Existing user-approved, explicitly documented tradeoffs and project gates are not superseded.

**Nonblocking opportunities:** optional optimization tool unavailable, no promising candidate, neutral candidate, exploratory timeout, optional deep audit outside the affected risk scope. Record reason and next action; never represent these as passing tests. A tool finding is triaged based on evidence, not merely its exit code; a real blocker must be fixed even if found by an optional tool.

### Compact evidence and continuous improvement

Keep a single release receipt, not duplicate reports from every tool. Link to existing CI logs and artifacts; record exact candidate and baseline, lane and selection reasons, mandatory check outcomes, per-core-tool outcomes, selected extra tools, accepted/rejected experiments, measurements, known limitations, artifact digest and rollback. Capture elapsed time and cache reuse so Athena can improve checkout efficiency itself. Evidence must match final candidate and real target; never invent receipt fields. Store the receipt outside the candidate commit (CI artifact or release attachment) to avoid self-referential SHA changes.

Maintain reusable, sanitized benchmark fixtures and evidence in the owning repository and link successful methods or failed hypotheses to Athena's research/backlog. Promote verified gains as the new floor. Future releases should learn from historical regressions, test failures, slow checks and unnecessary duplicate work. Record deferred improvements without blocking a sound release, and prioritize them in later maintenance.

## Release evidence

In the release notes or a repository-local evidence receipt, record: baseline/final SHA; date; tool versions/commits and provenance; per-tool applicability, exact commands and exit status; test inventory/coverage and platform/workflow results; workload/hash or fixture identity; before/after measurements with units, repeats and uncertainty; accepted/rejected candidates and reasons; rollback/fallback instructions; remaining blockers. Keep raw/private logs local and publish only sanitized evidence. Distinguish fixture, real runtime and deployed release verification. Do not publish credentials or source traces. Require an independent test/review of retained optimization results, not a self-declared pass. For a no-change optimization pass, reconcile existing evidence rather than adding a redundant review ceremony.

## Additional stack-specific verification

- Rust: cargo fmt --check, cargo clippy, cargo test, cargo audit/deny and cargo bloat or equivalent when available; Criterion or a reproducible harness; feature/target matrix and portable packaging. Check unsafe/FFI, ABI and licenses.
- JS/TS: project build/test/lint, real browser/native integration, bundle analysis and dependency audit. Detect dynamic imports and runtime registrations before removal.
- Python: project tests, import/entrypoint and package checks, profiling and platform packaging. Keep dynamic discovery and script compatibility.
- Java/Minecraft and Sims mods: actual supported loader/game builds and representative in-game client/server or CAS/mod-library workflows; preserve registries, assets, saves, script imports, frames/ticks and feature parity. A synthetic benchmark or build is not native game proof.
- Knowledge/data repos: verify source provenance, counts, IDs, relationships, full query results and export/restore; no deleting records or citations merely for size. A release with no executable hot paths can mark port tools not applicable.

This document is a mandatory agent instruction, not proof of installed executables, a completed optimization run, CI enforcement, or a versioned governance-bundle release. Mechanical release gating should be added through each project's existing CI with reviewed pinned tools, real workload adapters and evidence validation; do not blindly run agent-assisted source mutation from release CI.
