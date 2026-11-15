# Explicit updates after reviewed legacy transition

Athena now has a separate update path for selected consumers retaining both their
historical Agent-Foundry lock and an installed Athena lock. Generic adoption
continues to refuse a legacy lock. Nothing discovers or automatically updates
consumer repositories, installs skills, deletes historical bytes, or grants an
agent authority.

Use `tools/update_transitioned_consumer.py plan --source NEW_GUIDANCE
--previous PREVIOUS_GUIDANCE --target CONSUMER`. Both source paths are separate,
clean Git checkouts of Athena's `guidance` directory. The previous source's HEAD
must exactly match the installed Athena lock; all installed canonical snapshots
must match that source's checked release. Both source inventories must still
verify the untouched legacy snapshots. All three checkouts must be separate,
trusted, quiescent and clean. Parent guidance paths can be inside their separate
Git roots; HEAD refers to the enclosing repository commit.

Review the exact old/new canonical policy diff and project-specific compatibility,
not just the digest. Changed policy requires a newer semantic version; downgrade
is refused. The review digest binds both source revisions, target HEAD, installed
lock, root router, preserved legacy files and every intended output. It is not
approval, a signature, or proof that new guidance is semantically appropriate.

After obtaining the applicable explicit authorization for the selected consumer
and reviewed policy change, call the same command with `apply` and
`--review-sha256 DIGEST`. The tool rechecks inputs immediately before writing and
uses the existing exception rollback transaction. It updates only the 16 Athena
snapshots and their lock, with the lock last. Root AGENTS.md, CLAUDE.md, local
skills and historical snapshots/lock remain untouched. Stale review, edited
snapshots, dirty checkouts, links, changed legacy pins and unresolved transaction
recovery are refused. Do not delete recovery directories to make a retry pass.

This is not crash/power-loss atomic, hostile concurrent-writer safe, automatic
propagation, or actual installed-agent acceptance. Preserve both source checkouts
and rollback evidence. A reviewed future update still needs project acceptance;
no source repository becomes safe to delete merely because this mechanism exists.
No real consumer update is performed by this implementation pass.

## Validation

Eight new synthetic tests cover exact output and nonmanaged-byte preservation,
wrong prior source/committed local drift, stale review/changed target commit,
final-lock failure rollback, dirty checkouts and legacy drift, same-version policy
changes, linked snapshots (when OS privileges permit), downgrade and retained recovery refusal. Existing generic
legacy refusal is asserted after successful update. Tests use disposable Git
repositories and synthetic policy additions, not owner instructions or data.
