# Process Monitor: IPC investigation and current Windows boundary

Reviewed 2026-11-17. This is an additive Athena research note, not a new installer recommendation or a replacement for the existing process-inspection safeguards.

## Verified update, not a guessed changelog

The [official Process Monitor page](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) currently identifies **4.13**, published **2026-11-05**, with Windows 11+ and Windows Server 2019+ as supported systems. Older cached search snippets showed September dates; the current product page is the evidence used here. These are documented requirements, not our tested compatibility.

Microsoft's [Sysinternals update history](https://learn.microsoft.com/en-us/sysinternals/) attributes the named-pipe and mailslot IPC event class to **4.1 on 2026-08-19**, not to 4.13. The latest product page does not provide a sufficient 4.13-specific changelog to claim new IPC behavior or performance gains in that maintenance release.

The Windows binary uses [Sysinternals Software License Terms](https://learn.microsoft.com/en-us/sysinternals/license-terms), not the license of the separate Linux project. Device installation/use is permitted subject to those terms; redistribution and reverse-engineering restrictions apply. Saved traces can contain sensitive data. This note neither accepts a new agreement nor bundles Microsoft binaries.

## Useful impact for Athena and the user's projects

For the requested Hermes connectivity work, IPC events offer a diagnostic candidate when a verified integration actually uses Windows named pipes or mailslots. They do **not** supply authentication, connector authority or permission to access a socket. First identify the transport from owned code/config; HTTP, WebSocket and Unix socket failures need their appropriate instruments. An observed connection is not evidence that the requested operation succeeded.

For authorized mod-manager installation studies, combine scoped file/registry/process observations with a before/after owned-fixture inventory. This can help distinguish installer writes, app initialization and spawned helpers. Do not infer code internals or protocol semantics solely from a trace.

## Bounded acceptance plan

1. Use a Windows 11 test machine and an owned toy named-pipe server/client. Pin the tool build and record the executable signature/hash locally before launch.
2. Define the expected event sequence from fixture behavior, with successful connection, missing server, permission-denied connection, restart and cancellation cases. Avoid real credentials and production endpoints.
3. Scope the acquisition to the owned process tree. Apply temporary-directory filters to filesystem events only; IPC events use pipe/mailslot paths and need their own transport-specific filters. Keep native trace files local; exported summaries use synthetic identifiers only.
4. Confirm observed event classes and counts against independent fixture logs. Record missed events, dropped events, capture duration and CPU/storage overhead without extrapolating to all applications.
5. Run an unrelated toy process simultaneously to check scope and whether filter changes merely affect display rather than collection. Filter visibility must never be presented as proof that unshown data was not captured.
6. Stop the capture, verify completion, and explicitly clean up only the owned fixture. Keep trace retention finite and inspect/redact before any sharing.

Potential Athena integration: a per-provider evidence record containing tool/build, OS, target identity, transport, scope, expected/observed events, timing and unresolved differences. Status stays **proposed, not implemented**. Never attach a full trace to an agent prompt merely to save investigation effort.

## Verification boundary and continuation

No Windows execution, driver/service change, tracing, IPC access or capture upload occurred. No claim of lower token use, successful Hermes authentication, full Arsenal installation inspection, performance improvement or exhaustive event coverage is made. Next step is the owned Windows fixture, not silent installation or privileged production tracing.

This note intentionally leaves shared generated catalogs unchanged while concurrent source studies are in flight. It complements [process inspection safeguards](../process-inspection-risks-2026-11-15/README.md); product discovery already contains Process Monitor in the preserved Windows catalog.
