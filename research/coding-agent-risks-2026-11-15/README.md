# Coding-agent release risks: maintenance and permission boundaries

Observed 2026-11-15. This is an independent upstream-risk assessment, not a ranked catalog, installation recommendation or evidence of a successful local agent trial.

## Continue: available source is not ongoing maintenance

The [official README](https://github.com/continuedev/continue/blob/main/README.md) explicitly says the repository is no longer actively maintained and is read-only. It describes 2.0.0 as the final release across the VS Code extension, CLI and JetBrains plugin, including removal of anonymous telemetry and authentication. This status was checked through both the public page and GitHub file retrieval.

Do not describe this repository as actively maintained merely because downloads or stars remain visible. A maintained fork would require its own provenance, recent maintenance and security review; none was verified in this pass. The [latest VS Code release](https://github.com/continuedev/continue/releases/tag/v2.0.0-vscode) rendered June 19 without an explicit year, so a full release date is not asserted.

The [root LICENSE](https://github.com/continuedev/continue/blob/main/LICENSE) is Apache-2.0. That supports considering reviewed code reuse, not assuming every dependency, model, hosted endpoint or trademark shares that license. Windows-specific requirements for the final CLI were not verified; editor-extension availability is not complete Windows workflow acceptance.

## Zed 1.28.1: verify cancellation and completeness, not just connection

The [official stable release](https://zed.dev/releases/stable/1.28.1), dated November 11, 2026, reports Agent Client Protocol improvements for missing sessions, plan updates, diff formats and cancellation of permission requests. Agent file-reading output now truncates lines above 2,000 characters to limit context growth. Optional automatic Git fetching is disabled by default.

Those changes suggest independent acceptance cases:
1. Cancel a pending permission request and verify that no tool action executes.
2. Recover a missing session without silently expanding the task or permissions.
3. Read a long-line fixture and ensure truncated output is not treated as the complete file.

These are proposed tests, not tests run here. A release-note fix is not universal proof of safe behavior.

[Windows documentation](https://zed.dev/docs/windows) explicitly requires a DirectX 11-compatible GPU and warns about degraded virtual-machine graphics performance. The [repository licensing section](https://github.com/zed-industries/zed#licensing) says source is primarily GPL-3.0-or-later with Apache-2.0 components where marked. Inspect pinned files and dependencies instead of assigning one permissive license to the whole application.

## Scope

No tool installation, account connection, credentials, persistent grants, cloud uploads, quota tests, model downloads or code execution occurred. No performance or safety superiority is claimed. Source findings do not establish hosted-service terms or included usage.

This note changes no application catalog, generated data, runtime configuration or manifest. Release observation is distinct from native acceptance.
