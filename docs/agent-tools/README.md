# Coding agents and portable memory: evidence-led shortlist

Reviewed: 2026-11-13. Status: documentation research, **not an installed or benchmarked winner**. This page records candidate fit and a reproducible acceptance plan. No candidate has demonstrated improvement over Athena or another project's current implementation. No deployment, credential, account connection, session import, or background service was performed for this review.

## Decision in brief

For a Windows repository-coding trial, evaluate **OpenCode first**. Evaluate **Hermes** separately when persistent personal-assistant memory, scheduled work, or messaging integrations are the actual requirement. Do not install multiple overlapping agent stacks to solve an unmeasured problem. Cline is the editor-centric alternative; Aider is a narrower terminal pair-programming baseline.

This is a provisional fit assessment, not a speed, quality, security, or cost ranking. A client cannot remove the selected model provider's limits. A free software license does not include unlimited inference, hosted tools, model weights, or cloud compute.

## OpenCode

- Official project: [anomalyco/opencode](https://github.com/anomalyco/opencode), [MIT license](https://github.com/anomalyco/opencode/blob/dev/LICENSE).
- Current [installation documentation](https://opencode.ai/docs/) describes V2, terminal/Desktop/web interfaces, native Windows x64/ARM64 downloads, and `@opencode/cli` for supported package-manager environments. It says Windows package managers are unsupported. Do not mix older V1 installer/config snippets with V2.
- [Agent profiles](https://opencode.ai/docs/agents/) support distinct model, instructions and permissions, including read-only reviewers. [Permissions](https://opencode.ai/docs/permissions/) use ordered allow/ask/deny rules; V2 field names differ from V1.
- [Providers](https://opencode.ai/docs/providers/) can be connected directly. Documented ChatGPT sign-in consumes the existing subscription allowance, not a new free quota. API billing remains provider-specific. The installation page advertises optional OpenCode Go at $10/month; verify current terms and limits before buying.
- Upstream's [security policy](https://github.com/anomalyco/opencode/blob/dev/SECURITY.md) explicitly says permissions are not a sandbox. Use a VM/container when security isolation is required. Do not expose a server, mount secrets, or add third-party plugins merely to begin evaluation.

## Hermes Agent

- Official project: [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent), MIT. Its persistent conversations, memories and reusable skills target continuity across broader workflows, not just code editing.
- The [platform matrix](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/getting-started/platform-support.md) now lists native Windows 10/11 CLI as Tier 1; MSIX Desktop requires Windows 11 22H2+. WSL2 remains supported. Old claims that Windows always requires WSL are stale.
- The [quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart) recommends Desktop on Windows/macOS and establishing a working basic chat before adding gateway, cron or routing.
- The [FAQ](https://hermes-agent.nousresearch.com/docs/reference/faq) documents remote and local OpenAI-compatible providers and local conversation/memory storage. Local storage does not make remote model requests local. Optional integrations can introduce additional data destinations.
- [Model access](https://hermes-agent.nousresearch.com/ai-models) is separate from the free agent; Nous Portal advertises pay-as-you-go or plans from $20/month. This is not a purchase recommendation.
- [Security documentation](https://hermes-agent.nousresearch.com/docs/user-guide/security) describes command approvals, optional write restrictions and isolated backends. Verify the actual deployed configuration. Learned skills are not evidence of unrestricted autonomous self-improvement.

## Focused alternatives

| Candidate | Why evaluate it | Boundary |
| --- | --- | --- |
| [Cline](https://cline.bot/) | Editor-visible Plan/Act workflow, diffs, checkpoints and restore; native Windows Desktop also advertised | [Apache-2.0 extension](https://github.com/cline/cline/blob/main/apps/vscode/LICENSE). Provider/compute costs are separate. Checkpoint rollback is not a substitute for independent backups or isolation. |
| [Aider](https://aider.chat/docs/) | Narrow terminal pair-programming baseline with [Git integration](https://aider.chat/docs/git.html) and [test commands](https://aider.chat/docs/usage/commands.html) | [Windows installation](https://aider.chat/docs/install.html) exists. Not evaluated here as a persistent general-assistant service. |

## Memory: start with a portable baseline

Keep public architectural decisions and project instructions in version-controlled project documents. Keep private user details, credentials, and personal conversations outside public repositories. A memory system should retrieve attributable evidence, handle corrections and deletions, preserve project boundaries, and survive restart. More stored text is not automatically better memory.

### MemPalace: local retrieval candidate, not proven winner

The canonical [MemPalace repository](https://github.com/MemPalace/mempalace) identifies its official documentation as [mempalaceofficial.com](https://mempalaceofficial.com). The current [README](https://github.com/MemPalace/mempalace/blob/develop/README.md) describes verbatim storage, scoped semantic retrieval, embedded Chroma by default and opt-in backends. It recommends an isolated `uv tool` or `pipx` environment. Initial embedding use downloads a model, so first-run offline behavior must be tested after provisioning.

The [package manifest](https://github.com/MemPalace/mempalace/blob/develop/pyproject.toml) declares MIT, Python >=3.10, and dependencies including ChromaDB, NumPy, Hugging Face Hub and tokenizers. Optional DirectML support exists for Windows. It also records Windows-specific Chroma compaction-test retries: native acceptance cannot be inferred from platform support alone. Do not select a development branch just because it is newest.

[Codex/Claude hooks](https://mempalaceofficial.com/guide/hooks) are a separate integration surface requiring inspection and explicit scope before enabling. No session folders were read in this review. Do not grant blanket transcript harvesting. Use a synthetic, non-sensitive corpus first. Upstream benchmark claims are not a comparison against this user's projects or hardware.

### OpenMemory: disambiguate the product

Current [mem0ai/openmemory](https://github.com/mem0ai/openmemory) is a beta session-porting CLI/TUI for Claude Code, Codex and OpenCode, not the same product as archived OpenMemory MCP instructions. Its [README](https://github.com/mem0ai/openmemory/blob/main/README.md) lists realtime autosync and Hermes support as future work; do not promise either. The current root [license](https://github.com/mem0ai/openmemory/blob/main/LICENSE) is MIT. Native Windows installation was not established in this review. Session porting is unnecessary for an initial agent trial and can copy sensitive data into another tool's storage.

### Letta: larger stateful-agent alternative

[Letta Code](https://github.com/letta-ai/letta-code) is Apache-2.0 and represents a broader agent runtime rather than a tiny drop-in memory plugin. [Memory documentation](https://docs.letta.com/configuration/memory) describes Git-backed MemFS, explicit remembering, memory auditing and background consolidation that uses model tokens. Local versus cloud/account storage, Windows setup and provider choices need a separate deployment review before recommending it over a simpler baseline.

## Bounded acceptance plan

1. Pin the exact official release and record OS, architecture, runtime, provider/model, context settings and all enabled integrations.
2. Use a dedicated worktree per writer; never let competing agents edit the same checkout. Establish a clean baseline, deterministic tests and rollback point.
3. Compare the current tool and candidate on the same regression repair, multi-file feature, review and interrupted-task-resume tasks. Record accepted tests, incorrect edits, human interventions, latency, peak memory, tokens and actual cost. Repeat enough to expose variance.
4. For memory, create a synthetic corpus with known facts, corrections, contradictions, two separated projects and deletion requests. Score retrieval with source provenance, stale-fact rejection, cross-project leakage, write durability, restart recovery and export/restore.
5. Test Unicode Windows paths, locked files, concurrent writes and restart during persistence. Retain failures and last-good data. A benchmark fixture is not native acceptance on the target computer.
6. Approve any new persistent access, external data destination or paid plan separately. Never import secrets, bypass denied paths, or treat a browser session as an API grant. Keep scheduled jobs disabled until their behavior and stop conditions are verified.
7. Promote only after target-relevant evidence proves improvement without losing required behavior. Until then these remain Athena R&D candidates, not downstream implementation recommendations.

## Review status

- Source/document review: completed for the links above on the review date.
- Installation, provider authentication, comparative execution, memory import, native Windows acceptance: not performed.
- Application changes, public app deployment, third-party runtime verification: not part of this documentation-only addition.
- Re-review triggers: major version/config migration, license/provider-auth changes, security advisories, or a failing target acceptance test.
