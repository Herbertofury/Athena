# CLI-first, non-interruptive agent execution

Owner directive, 2026-11-24. Applies to every authorized agent task, not only release checkout. Prefer fast, deterministic, programmatic control and preserve the user's active desktop, focus and input. The desktop belongs to the user. Do not confuse a command that drives visible mouse/keyboard actions with a genuinely non-interruptive CLI.

## Mandatory execution order

1. Discover the installed application's official CLI, command-line flags, headless or batch modes, documented API/SDK, project-local commands, existing scripts, and authorized connectors. Use the fastest reliable structured route that actually completes the task without interfering with the desktop; prefer the native CLI for local software. Use direct supported APIs/SDKs when a CLI is absent or a direct programmatic route is more appropriate (no artificial CLI wrapper required).
2. Reuse existing reviewed CLI-Anything harnesses or other tested local wrappers. Check Athena's records, the application's upstream docs, and [CLI-Hub](https://clianything.cc/) before rebuilding. Pin and verify the specific harness and dependencies, not merely the registry listing.
3. If no usable CLI or supported structured route exists, use [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) as the default harness-generation methodology. Map the required operation to the real supported backend, document what the harness covers, implement/test the smallest useful missing commands, and reuse the adapter. For first-party code, implement a native CLI over the existing shared service/core when that is simpler and faster than a Python wrapper. A wrapper must not merely automate clicks on the user's live desktop. No unsupported promise that every proprietary app can be made headless.
4. If the actual operation needs UI semantics or visual verification, use a programmatic headless browser/test runner, offscreen rendering, isolated application profile or an authorized separate test session/VM/virtual display as supported. Prefer real rendered screenshots, structured DOM/accessibility output, logs and exported artifacts. Validate the actual installed application/game and required workflow where relevant; a synthetic test cannot replace real-runtime proof. Do not make headless mode mandatory for tasks whose acceptance genuinely requires a visible renderer or hardware.
5. Foreground computer use on the user's active session is the last resort, only when no authorized non-interruptive route can complete a required task and the owner explicitly authorizes that foreground interaction. Explain the exact missing capability and minimal action needed. Do not steal focus, move the real pointer, send global keystrokes, launch visible windows over the user's work, switch windows/desktops, attach to their active browser/profile, or open interactive terminals unnecessarily. Never use a background input-injection tool as a substitute for consent. Respect a stop immediately.

A missing local tool/permission is not proof no CLI exists. Attempt bounded discovery and safe alternate supported routes; if genuinely blocked, state why and log the missing capability. Do not bypass permission checks, sign-in/MFA/CAPTCHA, anti-cheat, host isolation, access controls, protected branches or explicit user approvals. CLI-first does not confer new tool access, authorize unattended execution, or override stronger platform/project requirements.

## CLI-Anything adoption

Primary sources reviewed 2026-11-24:
- [Official repository and README](https://github.com/HKUDS/CLI-Anything/blob/main/README.md) (Apache-2.0 identified by upstream; verify exact version and component licenses).
- [HARNESS.md](https://github.com/HKUDS/CLI-Anything/blob/main/cli-anything-plugin/HARNESS.md) (backend mapping, stateful and one-shot commands, JSON, real backend and subprocess tests, round-trip proof).
- [CLI-Hub](https://clianything.cc/) and [official releases](https://github.com/HKUDS/CLI-Anything/releases).

Upstream documents an installable harness ecosystem and generator methodology; it is not a magic universal executable for closed-source apps. The target software, API, license, OS and hardware may still be prerequisites. Community harness quality and coverage vary. Do not auto-install all catalog entries or execute third-party instructions blindly. Review exact pinned source, dependency/install behavior, rights, backend support and local access before installation. Keep portable tools and environments project-local where supported; no global MCP or PATH changes without authorization. The opt-in security-audit policy is unchanged; ordinary provenance and safe execution controls still apply.

For a missing interface:
- Start with one real required workflow and map it to supported application operations; avoid duplicating a mature official CLI or API.
- Use existing official scripting interfaces, SDKs, file formats or shared application services; do not silently substitute a mock, unsupported binary patch, undocumented private endpoint, or lossy reimplementation. Preserve native behavior, data, undo and compatibility.
- Provide deterministic subcommands, --help, --version, machine-readable JSON/JSONL output, stable IDs, clear exit codes, stderr diagnostics, non-interactive invocation, explicit output paths and --dry-run for appropriate mutations. No mandatory interactive REPL for automation.
- Use explicit arguments rather than shell-string interpolation, bounded concurrency, cancellation, timeouts, idempotent/retry-safe operations, atomic writes, backups and rollback where relevant. Keep state isolated per project/profile; respect concurrent users and agent workers. Store no secrets in arguments/logs or public receipts.
- Execute the real backend and inspect resulting files/state. Compare with the original workflow: full results and fidelity, side effects, timings, resources, cold/warm startup and zero foreground interference. Record exact supported commands/platforms/versions, tests, limitations and rollback. Do not claim app-wide CLI parity from one command.

## First-party product design

Make Athena and each owned application agent-operable by design: GUI and CLI should share the same underlying domain service, validation, permission checks and data model. Prefer a native Rust command surface for Rust products where appropriate; preserve all GUI capabilities and desktop quality. Expose affected operations as CLI/API when practical, with discoverable command inventory, schemas, machine-readable receipts, portable data roots, batch operations and progress/cancellation. Prefer composable commands and a persistent worker only when measured startup costs justify it; keep memory/CPU/I/O bounded and avoid hidden background processes.

New GUI-only operations in touched scope should receive a corresponding tested structured route whenever feasible. Record unsupported gaps and prioritize recurring high-impact tasks. Do not turn a wholesale CLI parity rewrite into a blocker for an otherwise sound unrelated release. For an explicitly requested CLI task, missing real operation/acceptance remains unresolved. Preserve existing game/desktop/native acceptance requirements.

## Project examples

- Athena / Modding-Knowledge: direct local data/import/export, query, build and validator commands; exact counts, relationships, provenance and rollback.
- Enderloom / Modhunter: CLI for catalog scanning, version mapping, profile import, comparison and staging; preserve supported launcher/MO2/provider boundaries. Never use a CLI to bypass author restrictions or authentication.
- Noxviola / GameSync: use supported APIs/connectors and isolated headless browser automation for browser workflows; keep the user's actual browser/profile untouched.
- Minecraft / Sims projects: use supported build/launch/test CLI and separate instances, logs, offscreen capture or isolated game QA. Preserve real game acceptance; no unsupported background injection, anti-cheat bypass or changes to the user's active saves/session.
- Creative tools: prefer existing official batch/headless/export interfaces; use CLI-Anything for missing supported operations and verify actual output quality.

## Route evidence and reuse

For a material workflow or new adapter, record application/version, supported interface, command/API, input/output/side effects, timings or observable evidence, isolation mode, limitations, and whether foreground interaction was required. Store reusable adapter source/tests in the owning repository, and a concise discovery/coverage reference in Athena (no private credentials, raw personal data or proprietary redistribution). Record failed approaches and avoid repeatedly searching or rebuilding the same wrapper. Compare CLI versus GUI on equivalent complete workloads when making speed claims; no invented universal speedup.

At release checkout, apply [the existing zero-loss optimization policy](PRE_RELEASE_OPTIMIZATION.md) using non-interruptive commands and isolated test sessions. The three mandatory optimizers remain mandatory where applicable, and dedicated security audits remain opt-in. Use the existing risk-based budgets; do not install or build unrelated harnesses simply to tick a box.

This policy is an agent instruction and reusable development standard, not proof of actual tool installation, enforcement by a host, full CLI parity, or access to the owner's physical computer.

## Shared capability lookup before substantial work

Use the [shared capability coordination policy](../docs/REUSABLE-PACKAGE-COORDINATION.md) and [routing index](registry/shared-capabilities.json) at task start. Reconcile active work and existing source implementations; reuse or improve the strongest verified compatible route rather than create a weaker duplicate. Contribute evidence and improvements back through the owning repository and link them in Athena. Keep this lookup bounded and preserve all project-specific acceptance requirements.
