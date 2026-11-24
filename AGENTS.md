# Repository agent instructions

## Mandatory pre-release optimization gate

Before finalizing every release, follow the owner-mandated [Athena zero-loss pre-release optimization standard](https://github.com/Herbertofury/Athena/blob/main/guidance/PRE_RELEASE_OPTIMIZATION.md). Evaluate shrink-anything, fast-anything and rust-anything using reviewed pinned tools in isolated worktrees; run applicable passes, compare equivalent complete workloads, keep only independently verified improvements, restore rejected changes, and record per-tool evidence or explicit inapplicability/blockers. Never weaken tests, delete required content, force a Rust rewrite or regress functionality, quality, portability, compatibility, security or protected performance metrics. Data/documentation-only releases and existing native Rust paths require honest applicability decisions, not artificial ports. Existing local and pinned governance requirements remain intact.

Dedicated security audits (safe-anything, Semgrep, cargo-deny/audit and equivalents) are explicitly opt-in and advisory, never a new mandatory release gate. The three named optimization assessments must complete whenever applicable; deferred or missing applicable assessments block checkout. Adopt every verified zero-loss win. See the current shared standard for receipt schema and scope.

## Mandatory CLI-first / non-interruptive execution

For every task, follow the owner-mandated [Athena CLI-first execution standard](https://github.com/Herbertofury/Athena/blob/main/guidance/CLI_FIRST_EXECUTION.md). Prefer fast official CLI/headless commands, supported APIs/SDKs/connectors and tested local automation. If a required application has no usable structured interface, discover or build a reviewed [CLI-Anything](https://github.com/HKUDS/CLI-Anything) harness over the real supported backend (or a native command surface for first-party code). Use isolated browser/renderer/test sessions for necessary UI proof. Never take over the user's active desktop, mouse, keyboard, focus or browser profile without explicit authorization for unavoidable foreground interaction. Preserve real runtime acceptance, data, permissions, feature parity and portable mode. Record reusable command coverage and unresolved gaps; no fake CLI parity or unnecessary release delay.

## Continuous frontier modernization and web acquisition

Follow [Athena's frontier-stack standard](guidance/WEB_ACQUISITION_FRONTIER.md). Every release must refresh official stack versions and adopt verified compatible upgrades. If the newest eligible version has a defect, diagnose, attempt a causal repair and retest before holding an older version; document failed repair or evidenced infeasibility and a next review. Do not downgrade merely because the initial upgrade failed. Review crawler/browser/download candidates and compare equivalent workloads. Preserve mandatory optimizers, CLI-first execution and opt-in security auditing.

## Shared capabilities and zero-loss evolution

Consult [Athena's reusable-package coordination](docs/REUSABLE-PACKAGE-COORDINATION.md) and [capability index](guidance/registry/shared-capabilities.json) before substantial implementation. Reuse or improve the strongest verified compatible existing solution; preserve unique local functionality, data and accepted baseline. Contribute verified fixes and evidence at the owning source and link them in Athena. Keep one authoritative record per capability, avoid parallel duplicate work, and record a bounded reuse/drift review within release stack freshness.

## Mandatory wiki closeout and documentation-driven product review

At every material checkpoint and before release follow [Athena's wiki closeout standard](guidance/WIKI_CLOSEOUT.md). Document what the product does and how to use its actual features, verify changed workflows on the real supported deliverable, review and safely repair confusing or redundant work, keep canonical sources and required live Wiki current. Prefer incremental docs and existing tooling; route RAG-Anything, Diagram Design and supporting tools where useful. Preserve all accepted functionality and document unresolved blockers honestly.
