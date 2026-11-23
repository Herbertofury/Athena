# rclone 1.76.0: interactive workflow without loosening access boundaries

Reviewed November 16, 2026. Selected from the catalog's current evidence/lifecycle backlog after checking other active work. No installation, remote configuration, credentials, personal files or network service were accessed.

The [official changelog](https://rclone.org/changelog/#v1-76-0-2026-11-06) dates v1.76.0 to November 6 and reports the GUI graduating from beta with embedded GUI 1.2.1. This updates Athena's stale emphasis on a primarily command-line workflow. It does not mean the GUI was introduced in this version: the [GUI documentation](https://rclone.org/gui/) describes the embedded redesign in v1.74.

## Fit and boundaries

Interactive users can inspect remotes and capacity, browse local/remote files, start transfers, and manage mounts/serves alongside existing scripts. These are documented capabilities, not an installed acceptance test. The GUI runs an RC API server separately from its UI server. Default addresses are localhost and credentials are generated if absent; the launch URL contains those credentials. Keep authentication and local binding, and redact launch URLs from screenshots or shared logs. Do not expose the RC API to obtain convenience. No service was started here.

The [download requirements](https://rclone.org/downloads/) list Windows 10 / Server 2016 minimum for this release. The [license page](https://rclone.org/licence/) identifies MIT with copyright/permission notice retention. Provider charges, grants and dependency terms remain separate.

The [sync command](https://rclone.org/commands/rclone_sync/) can remove destination-only files; its UI does not change that. Use documented preview/interactive review and establish direction and recovery before an authorized operation. Copy avoids sync's destination-only deletions but is not a guarantee against overwriting an existing file. No sync/copy or recovery action was run.

## Future acceptance, not completed

Use disposable local directories and a fresh isolated configuration without cloud credentials. Verify the two listeners bind only to localhost, authentication rejects unauthenticated access, and the launched GUI exposes only the intended fixture. Check copy versus sync preview with source-only, destination-only and differing files; verify cancellation and restart preserve the fixture. Redact URL credentials from evidence. Measure resource use and UI responsiveness before claiming it is lightweight or a better replacement.

## Delivery state

Canonical enrichment, generated app/wiki, source dates and runtime hash updated; focused regression tests validate data presence and boundaries only. No Windows/runtime/security audit, live provider test, publication or deployment claimed. Earlier uncertain tree writes remain untouched.
