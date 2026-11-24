# Repository agent instructions

## Mandatory pre-release optimization gate

Before finalizing every release, follow the owner-mandated [Athena zero-loss pre-release optimization standard](https://github.com/Herbertofury/Athena/blob/main/guidance/PRE_RELEASE_OPTIMIZATION.md). Evaluate shrink-anything, fast-anything and rust-anything using reviewed pinned tools in isolated worktrees; run applicable passes, compare equivalent complete workloads, keep only independently verified improvements, restore rejected changes, and record per-tool evidence or explicit inapplicability/blockers. Never weaken tests, delete required content, force a Rust rewrite or regress functionality, quality, portability, compatibility, security or protected performance metrics. Data/documentation-only releases and existing native Rust paths require honest applicability decisions, not artificial ports. Existing local and pinned governance requirements remain intact.

Dedicated security audits (safe-anything, Semgrep, cargo-deny/audit and equivalents) are explicitly opt-in and advisory, never a new mandatory release gate. The three named optimization assessments must complete whenever applicable; deferred or missing applicable assessments block checkout. Adopt every verified zero-loss win. See the current shared standard for receipt schema and scope.
