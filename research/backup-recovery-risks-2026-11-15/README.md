# Backup and recovery release risks · 2026-11-15

[Research directory](../) · [Athena](../../README.md)

## Scope and evidence status

Official-source review on 2026-11-15 UTC. This is a distinct backup/recovery research pass, not a catalog expansion, installation, benchmark, security certification or recommendation to replace any project's implementation. No user backups, credentials, account data or email were accessed. Noxviola's continuation index was checked; native Athena integration remains the priority. No prior backup-specific review checkpoint was established, so these are newly reviewed findings, not claims that releases appeared since the previous hourly run.

## Duplicati: restore outcome must be tracked separately

The official latest stable release is **2.4.1.0, dated 2026-10-29**. It adds sampled restore verification with download/runtime budgets and an optional temporary database rebuild. A post-backup restore-test failure is separately notified and does not change the backup result. Thus a successful backup indicator alone is insufficient evidence of recoverability. The release also fixes Windows destination paths containing @, WSL symlink handling and control-file restore path traversal. It changes the local database schema; upstream documents a DatabaseTool downgrade step for returning to 2.4.0.1. These are vendor-reported changes, not independently reproduced here. [Pinned stable release](https://github.com/duplicati/duplicati/releases/tag/v2.4.1.0_stable_2026-10-29).

The **2026-11-07 canary** reintroduces an installer-based updater and explicitly warns of rough edges, including a stopped service user's TrayIcon not restarting. Keep this prerelease separate from stable qualification. Do not trigger an updater or elevation merely to inspect it. [Canary release](https://github.com/duplicati/duplicati/releases/tag/v2.4.1.101_canary_2026-11-07).

Windows support is evidenced by upstream Windows fixes and release packages; exact minimum Windows version and architecture suitability were not independently qualified in this pass. Do not reuse obsolete .NET Framework-era installation instructions for these builds.

**Reuse:** the pinned LICENSE grants MIT terms outside specified exceptions, but expressly excludes any proprietary directory and preserves third-party component licenses. “Entire repository is MIT” is an unsafe blanket conclusion. Preserve notices and inspect the exact copied files and dependency licenses. Hosted console/storage terms are separate. [Pinned license](https://github.com/duplicati/duplicati/blob/v2.4.1.0_stable_2026-10-29/LICENSE).

## restic: an older stable release with relevant correctness fixes

The official latest link resolves to **0.19.1, dated 2026-07-05**, not a new November release. Upstream reports that inaccessible source paths, including malformed Windows paths, are now skipped and backup aborts when no valid source remains, rather than producing an empty snapshot. It also restores the default host/path grouping for snapshot latest queries and fixes removal of read-only repository files on Windows SFTP servers. These boundaries matter when interpreting empty snapshots or recent-backup dashboards. [Pinned release](https://github.com/restic/restic/releases/tag/v0.19.1).

Windows installation is documented upstream. This review did not run the executable, qualify an OS/CPU combination, exercise VSS, restore ACLs, test remote backends or assess throughput. [Official installation documentation](https://restic.readthedocs.io/en/v0.19.0/020_installation.html).

**Reuse:** the release license is BSD-2-Clause; preserve source/binary copyright notices, conditions and disclaimer. Dependencies and services need separate review. No code was copied. [Pinned license](https://github.com/restic/restic/blob/v0.19.1/LICENSE).

## Bounded evaluation proposal, not a measured result

Use only disposable, non-sensitive fixtures and an isolated destination. Record exact binary hashes, platform and versions. Test normal files, empty files, Unicode names, denied/missing sources, symlinks, interrupted writes and restore into a clean directory. Measure backup and restore separately, compare file hashes and required metadata, and retain failures. Include database loss/rebuild and a stale or failed restore-verification state. Never run prune, retention deletion, upgrade/downgrade or recovery experiments against the user's real backups.

A sampled restore cannot establish complete archive correctness. Passing this proposed fixture suite would still not prove the user's data recoverable or either candidate superior to an existing project implementation. No measured comparison, deployment, installation or recommendation was made in this pass.
