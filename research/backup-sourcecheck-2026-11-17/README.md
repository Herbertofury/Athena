# Backup and portable-data source check

Scope: a deliberately narrow independently checked batch, not certification of a larger AI-generated dossier. Source facts and exact official URLs are in `source-checks.json`. The existing catalog already contains these products: zero new product identities are added. Three records gain specific safety/data-location facts and one task guide connects them. Existing PhotoRec content and its correct URL are retained.

## Research defects excluded

The initial research draft called a 15-product list “14”; no count from that draft is imported. Its malformed PhotoRec URL is replaced in this evidence by the verified `/wiki/PhotoRec` official page already present in Athena. Syncthing claims are checked against the current unversioned documentation rather than the draft's old version-specific citation. Unverified pricing, version and portability assertions are not imported.

## SQLite application-backup boundary

SQLite's Online Backup API supports copying a live database into another database. Its WAL documentation says the WAL is part of persistent database state: separating it can lose committed transactions or corrupt data. For a portable application, use an application-aware snapshot or a clean shutdown workflow, then validate the restored copy. Do not copy just a live `.db` file or delete WAL files as cleanup. This is design guidance, not a claim that Athena's own backup implementation has passed recovery tests.

## Proposed portable acceptance tests (not executed here)

1. Run in a writable portable folder as a nonadministrator and audit application-owned writes outside it.
2. Move the complete folder and check settings, relative paths and profiles.
3. Change drive letter and test paths containing spaces and Unicode.
4. Restore a snapshot taken with a live WAL database and verify integrity plus expected committed records.
5. Interrupt snapshot creation and confirm the last known-good backup survives.
6. Exhaust disk space or deny writes and verify an actionable error without silent fallback to AppData.
7. Restore on a clean machine and check dependencies and credential-unlock behavior without exposing secrets.
8. Recover an intentionally deleted/overwritten fixture from independent versioned storage, not merely a synchronized mirror.

These are proposed acceptance criteria, not proof that co-location alone provides security or that all applications avoid operating-system artifacts. No third-party software was installed or benchmarked. No private chat transcript or private repository content is included.
