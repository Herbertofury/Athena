<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
[← Atlas home](https://github.com/Herbertofury/Athena/wiki/Engineering-Home) · [Canonical source](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/testing-release.md)

# Test, preserve evidence, release the tested artifact

## Layers

Pure-function tests → known-bad fixtures → integration → real UI/native runtime → installed launch path → full workflow → release verification. Each answers a different question.

Keep interruption and failure cases: cancellation, duplicate input, out-of-order completion, concurrent edits, changed files, missing dependencies, malformed archives, private/unavailable network data and crash recovery. A retry can establish recovery, but retain the failed attempt and reason.

## Reproducibility

Record source revision, build tools, dependencies, platform, settings, workload identity and output hashes. Compare artifact bytes with the deployed manifest. A workflow success does not prove the user is running that artifact. Verify the taskbar/launcher/browser path actually used.

## CI discipline

Use minimal workflow permissions. Pin actions to reviewed immutable commits and review updates deliberately; do not make a mutable “latest” tag a silent trust decision. GitHub documents full-SHA pinning and dependency-lock approaches. This repository uses exact action commits rather than changing account-wide security settings. [G02](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/sources.md#g02)

A failed live asset download may be transient, but do not bypass the gate. Verify the same source, retry with retained evidence, or fix the actual source. For robust network checks, bounded retries must still decode/validate the real bytes and record every failure.

## Promotion

Publish only after the relevant checks pass, preserve a recoverable previous version, verify deployed hashes and monitor the first real use. Do not purge the only rollback as part of an unrelated code improvement. Credentials, privacy/security settings and public publication require their own appropriate authority.

## Pinned advisory checks · 2026-10-27

[Exact audits and lock hashes](https://github.com/Herbertofury/Engineering-Atlas/tree/d2bb61459aa5e22375f2f1347cb54946fb688c4b/experiments/dependency-audit-lab) cover 185 application packages, 47 isolated compression packages and 26 parser packages. A fresh RustSec fetch was pinned to 99670cfc; all three final checks used a clean worktree and returned no known matches, warnings or ignored advisories. A retained untracked placeholder caused the original cleanliness assertion to fail, so a separate worktree was used rather than deleting history or pretending it was clean.

[The delta review](https://github.com/Herbertofury/Engineering-Atlas/blob/d2bb61459aa5e22375f2f1347cb54946fb688c4b/research/2026-10-27-security-delta.md) distinguishes rustls-ffi from rustls and records the assigned nextest advisory. Neither affected package is in the checked locks; the reviewed workflow uses cargo test. This is not an inventory of globally installed tools, other projects, vendored source safety or unknown vulnerabilities. No security setting or dependency was changed.

### Repeatable audit hygiene

[The pinned audit runner](https://github.com/Herbertofury/Engineering-Atlas/blob/a2d47438676b5589f12c0cccfe29e6b99d66e197/experiments/dependency-audit-lab/run_pinned_audit.py) verifies the tool hash, expected database commit, clean worktree and advisory-file inventory; freezes three fixed lockfiles; rejects filters/ignored checks; and retains partial timeout/error output. A real dirty checkout was rejected before audit/output creation, while a clean pinned run completed all three checks. Seven fixtures cover failure gates without executing fixture binaries.

This is a trusted analyst CLI, not an app command endpoint or general self-modification. The caller still verifies revision freshness. Time/input limits and post-execution output checks are not hard OS isolation; raw local stderr needs review before sharing. [Results and limitations](https://github.com/Herbertofury/Engineering-Atlas/tree/a2d47438676b5589f12c0cccfe29e6b99d66e197/experiments/dependency-audit-lab).
