# Athena reviewed Skill synchronization

`tools/skill_sync.py` is a newly authored native replacement for the explicit copy
mode of Agent-Foundry's desired-state installer at source revision
`87166b5f6a621c61b90bbbfe90835a3752c1c51b`, `tools/foundry_sync.py` (source blob
`8272ac7a398e1cb0d517b2a66d4be6fd200a48e0`). This is not a blind renamed import of
its destructive copy replacement. It preserves prior copies and performs
exception rollback. Generic governance and Skill installation remain separate.

Use `plan --source /selected/alpha --source /selected/beta --target-root
/selected/client-skills`, review the exact sources, rights, dependencies and client
semantics, then use `apply` with the same inputs and `--review-sha256 DIGEST`
under the applicable installation authorization. `status` returns2 for pending
changes. Paths/recovery receipts are private local information, not public reports.
No target discovery, default home-directory scan, config execution, model download,
credential creation or automatic running of Skill instructions occurs.

At most16 explicitly selected Skill directories and32MiB aggregate file bytes are
supported. Existing structural preflight is reused; source contents are data, not
instructions. Portable names, complete per-file digests, links/reparse points,
unmanaged destinations, local edits, stale reviews, duplicate names and pending
recovery are checked before writes. Source paths must be separate from the target.
Each managed copy has its own exact inventory marker. A source file removed in a
new version is absent from the new installed copy but retained in the old backup.
The review digest is not permission, trust, licensing clearance or semantic review.

A hidden `.athena-skill-recovery-*` directory retains transaction receipts and old
copies, or staged/failed bytes after errors. It is deliberately not automatically
deleted. Do not make an unresolved transaction pass by deleting this evidence.
The host must not recursively load hidden recovery folders as active Skills;
verify actual client discovery behavior before using a real target. Clients should
be stopped during changes. This is trusted/quiescent directory support, not hostile
concurrency or crash/power-loss atomicity. Rollback refuses to overwrite changed
published files and leaves recovery evidence when incomplete.

## Parity and remaining acceptance

Nine synthetic tests verify copy install/noop/update, removed-file backup,
unmanaged/local-edit refusal, stale review, failed publication rollback, pending
recovery refusal, links, case aliases and reserved Windows Skill names. Actual Codex/Claude/Cursor installed
acceptance, symlink mode, legacy marker adoption and shared global-state conversion
are not established by these tests. Legacy `.agent-foundry` state is not silently
adopted or deleted. Use explicit reviewed source payloads; this tool does not itself
make all eight legacy Skills licensed, private-data-clean or migrated.

No real client installation or source-repository deletion is part of this pass.

Before moving a repository rule into a Skill, run the [context audit](REPOSITORY-CONTEXT-AUDIT.md) against the pinned source and verify the target client can discover the Skill. Mandatory controls stay in always-loaded guidance.
