# Mod compatibility receipt template

**Template only. All scenario statuses start as not_run. No result is implied.**

## Decision and scope

- Question, required behavior and disqualifying constraints:
- Current target implementation/revision; candidate/revision:
- Authorized test instance/save-copy scope; excluded projects/data:
- Primary sources and their observed versions/check dates:

## Exact compatibility lane

- Game build, loader/version, API and required mod set:
- Mapping namespace/version or reason not applicable:
- Gradle wrapper/plugin versions and hashes:
- Gradle JVM; task-specific compiler/test JVM; installed runtime JVM:
- Compiler release/API/bytecode target:
- OS/architecture and relevant hardware:
- Resolved dependency inventory, lock scope and verification mode:
- Unverified/changing/local artifacts and their identity evidence:
- Production packaging task, artifact name and SHA-256:
- Descriptor/resource/mixin/service/embedded-library inventory:
- Distribution and asset-license constraints:

## Evidence table

Use separate rows for each exact configuration and attempt. Valid statuses: not_run, passed, failed, blocked, not_applicable. Explain every not_applicable and retain every failure.

| Scenario | Expected complete result | Status | Exact artifact/environment | Evidence and limitation |
|---|---|---|---|---|
| Build and dependency identity | Defined and verified inputs | not_run | unrecorded | none |
| Installed clean client | Complete required behavior | not_run | unrecorded | none |
| Dedicated server | Side-safe startup and gameplay | not_run | unrecorded | none |
| Multiplayer/reconnect | Authoritative state and recovery | not_run | unrecorded | none |
| Resource/data reload | Complete current resources | not_run | unrecorded | none |
| Save/restart/upgrade-copy | Required state preserved | not_run | unrecorded | none |
| Failure/interruption/repeated input | No duplicate/partial result | not_run | unrecorded | none |
| Required-mod combinations | Explicit tested matrix | not_run | unrecorded | none |
| Equivalent-work performance | Correctness and budgets fixed | not_run | unrecorded | none |

## Comparison and release decision

- Trial plan, seeds, order, caches, workload hashes and budgets declared before execution:
- Complete baseline/candidate results, warnings, failed attempts and raw sanitized evidence:
- Tradeoff; rejected alternative; uncertainty; what would change the decision:
- Remote commit/artifact identity and exact-head CI, if published:
- Current status: **not assessed**. Remaining gates:
- Reviewer and date:

A filled table is not self-authenticating. Verify evidence content, native launch path, exact bytes and the target's acceptance rules. See [the operational guide](../docs/mod-build-acceptance.md).
