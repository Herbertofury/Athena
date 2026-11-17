# VS Code portable-data evidence gap

Reviewed 2026-11-17 from [Microsoft documentation](https://code.visualstudio.com/docs/setup/portable), not Pro-chat output. Existing `vscode` product enriched, no new product or latest-release claim. Catalog retains existing licensing, aliases, alternatives, maintenance timestamp and recommendation.

The integration distinguishes supported archives from installers, persistent data from default system temporary storage, manual Windows updates, macOS sibling layout, and host-security prerequisites. No security configuration was changed. No blanket no-AppData, no-residue or arbitrary-extension containment claim is made.

## Backlog / acceptance (NOT RUN)
- Launch an official pinned Windows archive in a path with spaces under a fresh standard-user profile. Observe writes with and without data/tmp; include extensions, subprocesses and credentials separately.
- Save settings, extension state and a synthetic project, close, relocate the complete folder, reopen offline and compare retained state.
- Test manual update into a new extracted folder using a copy of data, preserving original and rollback copies. Verify startup and state, never overwrite the only copy.
- Exercise installer/portable confusion, read-only destination, missing data, full disk and interrupted update; document actual failure behavior.
- Test Linux/macOS separately without weakening sandbox or quarantine protections. Obtain specific approval before any security-sensitive change.

These are proposed tests, not executed product acceptance. Catalog regression tests establish data preservation and generated integration only. Documentation is not a benchmark or a portable security certification. This closes the missing catalog explanation, not the installed-workflow backlog.

## Local verification

- `npm run test:software`: 29 Python and 38 Node tests passed.
- Full `npm test`: passed on the final catalog/runtime-manifest change.
- Reviewed public-preview packaging: passed (131 files).
- `git diff --check`: passed.
- Three focused regression cases check single identity, preserved metadata, storage/distribution caveats, dated source and exact generated record.
- Initial software check exposed the expected stale runtime digest and missing checkout dependency link; updated only the reviewed catalog digest and reused existing installed dependencies, then reran successfully.
- Browser, Windows and actual VS Code relocation tests were not run; no merge or deployment.
