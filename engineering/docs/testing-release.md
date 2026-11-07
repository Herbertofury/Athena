# Test, preserve evidence, release the tested artifact

## Layers

Pure-function tests → known-bad fixtures → integration → real UI/native runtime → installed launch path → full workflow → release verification. Each answers a different question.

Keep interruption and failure cases: cancellation, duplicate input, out-of-order completion, concurrent edits, changed files, missing dependencies, malformed archives, private/unavailable network data and crash recovery. A retry can establish recovery, but retain the failed attempt and reason.

## Reproducibility

Record source revision, build tools, dependencies, platform, settings, workload identity and output hashes. Compare artifact bytes with the deployed manifest. A workflow success does not prove the user is running that artifact. Verify the taskbar/launcher/browser path actually used.

## CI discipline

Use minimal workflow permissions. Pin actions to reviewed immutable commits and review updates deliberately; do not make a mutable “latest” tag a silent trust decision. GitHub documents full-SHA pinning and dependency-lock approaches. This repository uses exact action commits rather than changing account-wide security settings. [G02](sources.md#g02)

A failed live asset download may be transient, but do not bypass the gate. Verify the same source, retry with retained evidence, or fix the actual source. For robust network checks, bounded retries must still decode/validate the real bytes and record every failure.

## Promotion

Publish only after the relevant checks pass, preserve a recoverable previous version, verify deployed hashes and monitor the first real use. Do not purge the only rollback as part of an unrelated code improvement. Credentials, privacy/security settings and public publication require their own appropriate authority.
