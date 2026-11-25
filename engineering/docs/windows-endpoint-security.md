# Windows endpoint security with explicit user control

**Research reviewed November 24, 2026. Evidence level: primary documented and proposed experiments.** This guide contains reusable architecture and evaluation knowledge from public sources. It does not claim a production antivirus, measured detection superiority, tested Windows integration or an adopted implementation.

The decision is how to combine file scanning, process inspection and optional behavioral monitoring without installing an unexplained permanent workload. Start with a current-state inspector and explicit scan jobs. Add collectors only for user-enabled capabilities, and expose the actual coverage and resource lifetime of each mode. These are proposed product requirements, not claims that any upstream already fulfills the complete contract.

[Research delta and acceptance queue](../research/2026-11-24-windows-endpoint-security.md) · [Indexed primary sources](../data/sources.d/windows-endpoint-security-20261124.json) · [Evidence method](research-method.md)

## 1. Separate four different capabilities

| Capability | What it can establish | What it cannot establish alone |
| --- | --- | --- |
| Current process and module inventory | Accessible process identity, current modules, threads and memory observations | A complete history of who changed memory before observation began |
| On-demand memory integrity scan | Evidence of suspicious executable regions, patches, injected images or hooks at scan time | Automatic proof of malicious intent or reliable identification of the original injector |
| Explicitly started event collection | Events delivered while the selected providers and session are active | Guaranteed visibility of every action, lost events or unobserved past activity |
| Prevention and response | A supported enforcement decision for a specific operation and tested recovery path | Complete protection merely because events were logged or a suspicious object was found |

PE-sieve describes single-process inspection for injected/replaced images, shellcode and hooks; HollowsHunter extends that engine across multiple processes. Fibratus adds event-driven rules, memory scanning and capture for investigation. Their capabilities are complementary, with different runtime and privilege costs. [WEP010] [WEP011] [WEP012]

An event-derived attribution should carry the source process identity, target identity, event type, timestamp, provider, correlation rule and confidence. A snapshot-only finding should say that the responsible source was not observed. Use stable identity such as boot/session identity plus PID and process creation time, then revalidate before inspecting or acting. PID reuse must not redirect work to a later process. Microsoft documents snapshot access, cross-bitness and changing-module constraints; preserve those limits in the report. [WEP019]

## 2. A conditional reuse shortlist

| Candidate | Useful contribution | Integration disposition and disqualifiers |
| --- | --- | --- |
| YARA-X | Rust rule compiler and matching engine | Evaluate as a library with representative rules and compatibility tests. A matcher is not a complete antivirus or a guarantee of rule quality. [WEP014] |
| PE-sieve and HollowsHunter | Process memory inspection and multi-process orchestration | Candidate for an isolated, explicit scan worker. Establish cancellation, output schema, privileges, process identity and benign-hook false positives before enabling user actions. [WEP010] [WEP011] |
| Fibratus | Windows telemetry, correlation, captures and memory scanning | Study event/filter ownership and replay. Benchmark shared collection before copying an entire always-running service. [WEP012] |
| Rustinel | Rust collection, rules, health diagnostics and replay | Evaluate as a source of reusable components. Its documented lack of pre-execution blocking and anti-tamper prevents treating it as a complete preventative product. Review background activity separately from exported telemetry. [WEP013] |
| PRX-SD | Cross-platform file scanning, signatures and detection orchestration | Useful file-engine candidate. The reviewed platform table places pre-execution interception and memory inspection on Linux; Windows uses directory-change monitoring and lists a minifilter as planned. Do not transfer Linux coverage claims to Windows. [WEP015] |
| Sentinella | Resource-conscious scheduling and upstream failure lessons | Study the release fixes and add regression cases before adopting caching or verdict paths. Release notes include still-unverified live behaviors, so architecture claims remain hypotheses. [WEP016] [WEP017] |
| Windows endpoint security platform | Current supported Microsoft platform direction | Evaluate capability and deployment eligibility before creating a custom kernel layer; availability, production enrollment and intended coverage are separate gates. [WEP001] [WEP002] |
| windows-drivers-rs | Rust WDK bindings and build experiments | Research candidate. The current README explicitly says it is not recommended for production; test-signed success is not production-driver readiness. [WEP003] |

Preserve upstream licensing/provenance, pin the code and assets actually evaluated, and keep an integration receipt with the exact versions and assumptions. Documentation review establishes suitability for a comparison, not a measured winner. Do not rank implementations by star counts, language or signature counts alone.

## 3. Platform capabilities need an explicit eligibility gate

Microsoft documents WESP support beginning with the October 2026 Windows 11 25H2 and 26H2 client releases. Initial production access requires MVI eligibility, the specified Artifact Signing identity and delivery of the product EKU through Code Integrity policy. A development/test route exists but is not production authorization. [WEP001]

**Engineering consequence:** use a capability probe and a target-version matrix. Record the OS build, available APIs, enrollment/signing status and enabled capability tier. Keep unsupported operations visibly unavailable; do not turn a missing platform capability into a generic scanner success. Benchmark the actual permitted API path before adopting it. The WESP announcement is the starting point for the capability map, not evidence that every legacy EDR function has an equivalent replacement. [WEP002]

AMSI provider integration, Windows Security Center registration and telemetry consumption are different interfaces. An application that submits a buffer to AMSI is not thereby an AMSI provider. Querying security-product status is not product registration. Microsoft directs antivirus vendors to the appropriate MVI registration path. [WEP006] [WEP007]

Keep driver work behind demonstrated need. If a supported user-mode platform meets the required operation, compare it first. If a driver is still necessary, retain a small explicit boundary, real Windows signing and compatibility gates, and an honest unload/reboot state. The Rust source language does not eliminate unsafe FFI, kernel correctness or signing requirements. [WEP003]

## 4. Treat background activity as owned resources

Use one policy owner shared by the service, CLI and UI. Record **desired mode**, **effective state**, **reason**, **owning operation** and **last transition** for each component. A mode describes when work may run; a state describes what is happening now. Suggested states include stopped, starting, running, stopping, failed and restart-required.

| User mode | Lifecycle contract |
| --- | --- |
| Disabled | Reject new work for that component, stop its collectors and workers, and retain the preference across restarts and updates. |
| On demand | Start resources only for a user-requested operation; release them at completion or cancellation. |
| Scheduled | Retain only the minimum scheduler mechanism the user approved; expose the next activation and cancel it when disabled. |
| Event triggered | Disclose the listener required to detect the trigger. It is background activity even if analysis starts only occasionally. |
| Continuous | Show the actual collector and worker state, coverage and resource cost. |
| Adaptive | Restrict changes to the user's approved policy; a profile must not silently override an explicit disabled setting. |

Use explicit ownership and reference counts for shared collectors. Turning off memory inspection must stop that worker even if another enabled feature still needs process-start events. If another feature owns a remaining event subscription, name that dependency. Do not claim that all collection stopped. When the last owner releases a resource, close its subscription, worker, timer, handle and buffers through the supported lifecycle.

ETW is session-based and can operate in real time or to a trace file. ControlTrace supports stopping and querying sessions; a collector must manage only sessions it owns. These APIs motivate a session-ownership contract, not a promise of instantaneous teardown under every error. [WEP004] [WEP005]

A real **stop acknowledgement** means pending work was cancelled or completed, background workers joined, owned sessions ended, scheduled activation removed, and final status reconciled. If an operation cannot complete teardown yet, return stopping or restart-required with an explanation instead of showing off. Test that the app cannot revive a disabled component after a crash, sleep/wake, profile change or update.

Expose UI resource measurements on request. A permanent high-frequency monitor created only to prove that everything else is idle defeats the intended mode. Collection of resource history must itself have a visible lifecycle.

## 5. Evidence, coverage and uncertainty are part of the result

A scan result needs independent fields for findings and coverage. Use explicit reasons for inaccessible process memory, unsupported architecture, process exit, changed identity, timeout, malformed rule, protected process, unreadable region and event loss. A result can contain a detection and incomplete coverage simultaneously. A timeout is not a clean verdict.

For event sessions retain collection start/end, enabled providers, policy generation, buffer-loss counters and known blind intervals. A changed policy must not let results from a cancelled older job overwrite the current status. Prefer bounded concurrency and visible partial coverage over unbounded work or silent omissions.

Report loaded modules separately from executable private regions. A loader module list does not establish the absence of manually mapped code. Likewise, a signed publisher, path or familiar process name is evidence, not a universal trust exemption. Hooks, JIT-generated code, accessibility tools, debuggers, overlays and anti-cheat software require a benign comparison set before any automatic response.

Persist enough evidence to explain a result, with user-selected retention. Raw memory can contain credentials and private documents. Keep memory dumps off by default and require a deliberate scoped export. Cloud reputation queries and file uploads must have separate settings, because a lookup and submission have different data exposure.

## 6. Definitions are several data types, not one universal database

Classify each adapter by its actual payload and semantics: exact hashes, YARA rules, URLs/domains, driver intelligence, behavior rules, reputation responses or a vendor-native engine package. Preserve source/version provenance and separate rule compilation from detection evaluation.

Microsoft's security intelligence downloads are documented for its products. Bitdefender's offline-update procedure likewise targets the Bitdefender product. These pages do not establish that a separate engine can consume the vendor database correctly. Treat a compatible importer as an unproven research task until parser semantics, engine dependencies, updates and representative detections are demonstrated. [WEP008] [WEP009]

Appwrite Defender is a useful counterexample to name-based assumptions: it parses ClamAV databases and lists a Microsoft-hosted ClamAV mirror. That is not Microsoft Defender definition support. Its README excludes bytecode/YARA execution, so adapter coverage must include unsupported rule classes. [WEP018]

For supported feeds, evaluate signed metadata, trusted keys, immutable versions, expiration, bounded parsing, atomic activation and last-known-good recovery. A hash fetched from the same compromised location is not an independent trust root. Deliberate authorized rollback should be distinct from accepting an unsolicited old update. Disabling update checks must stop its network and timers; manual update remains an explicit action.

## 7. Cache correctness belongs in the threat model

A security cache must be keyed to the scanned object and the decision context, not only a path. Include content/file identity, scan coverage, engine/rule version, policy version and relevant trust state. Invalidate on mutation, replacement, rule changes and incomplete results. Resolve rename, hardlink, reparse-point, alternate-stream and concurrent-write behavior explicitly for the supported filesystem envelope.

Sentinella's v0.1.12 release documents fixes for timeout results becoming cached clean verdicts and weak prefix/metadata-based cache validation. This is valuable regression material, not proof that another project's cache has the same defect. Preserve fixtures for mutation beyond the first prefix, unchanged timestamps/size, timeout, partial reads and a definition update between two scans. [WEP017]

Optimize through less duplicate work, not less requested coverage. Streaming hashes, shared parsing, immutable compiled-rule generations and prioritization are plausible candidates. Each requires equivalent-output measurements, resource accounting and safe invalidation before promotion.

## 8. Proof that matters before a claim of improvement

Define each comparison's protection profile, corpus, rules, OS build, hardware, engine versions and run order. Separate on-demand scanning from continuous protection. An inactive manual scanner cannot win a fair comparison against an active real-time product.

Measure at least time to first useful result, completion latency, steady and peak CPU/memory/I/O, cancellation latency, post-stop resource use, update cost and detected/incomplete totals. For gaming and developer workloads, include frame-time tails, launch/compile/extract/copy times and foreground responsiveness. Report uncertainty and cold/warm cases, including the cost of cache construction and invalidation.

Evaluate detection on isolated, appropriately controlled fixtures and false positives on benign software families that resemble suspicious behavior. Record true/false positives and negatives with known labels; use per-file and per-host/time false-positive denominators where appropriate. A harmless test marker proves an exercised path, not malware effectiveness. AMTSO explains the narrower installation-check role of EICAR and the limits of comparative conclusions from it. [WEP020] Source review, safe fixture tests, realistic lab evaluation and production acceptance must remain separate evidence levels.

## 9. Reusable experiment queue

These are proposed comparisons. None is recorded as a measured win or cross-project adoption.

| ID | Experiment | Passing evidence |
| --- | --- | --- |
| EP-01 | On-demand lifecycle and full stop | No owned worker/session/schedule remains after stop; disabled choices survive restart, update and crash recovery; dependencies are truthful. |
| EP-02 | Stable process identity and coverage | PID reuse, process exit, denied access and unavailable memory yield explicit results without acting on the wrong process. |
| EP-03 | PE-sieve worker comparison | Representative benign and suspicious-memory fixtures, structured output, cancellation and bounded worker cost; no automatic malicious verdict for every hook. |
| EP-04 | Shared ETW collection and replay | Record/replay preserves supported event semantics; missing events and blind intervals appear in evidence; source attribution never exceeds captured evidence. |
| EP-05 | Secure scan cache | Full-output parity across content mutation, rule updates, timeout, partial reads and file-identity races; measured cold/warm cost. |
| EP-06 | Feed activation and failure recovery | Trusted valid update activates atomically; wrong key, partial payload, old metadata and offline failures retain the last good generation. |
| EP-07 | WESP platform comparison | Supported OS/access matrix, permitted API behavior, denied/unavailable handling, equivalent-work runtime measurements and separately satisfied production gates. |
| EP-08 | User-visible control and performance | UI/CLI/service agree; profile switching preserves explicit overrides; benchmark scope includes every enabled capability and post-stop cost. |

Start with EP-01 and EP-02, then compare one complete scan path before expanding collectors. Revisit the shortlist when primary-source behavior or target requirements change. Record target-specific adoption only after that target's real correctness, security, compatibility, user-control and performance gates pass.

## Primary-source references

The complete indexed records retain the reviewed versions, dates and applicability notes.

- [WEP001] Microsoft WESP requirements, signing and enrollment.
- [WEP002] Microsoft WESP general availability and driver quality.
- [WEP003] Microsoft windows-drivers-rs maturity and supported configurations.
- [WEP004] Microsoft About Event Tracing.
- [WEP005] Microsoft ControlTraceW lifecycle and result states.
- [WEP006] Microsoft Windows Security Center registration guidance.
- [WEP007] Microsoft Antimalware Scan Interface.
- [WEP008] Microsoft security intelligence updates.
- [WEP009] Bitdefender offline threat-definition updates.
- [WEP010] PE-sieve single-process memory inspection.
- [WEP011] HollowsHunter process orchestration.
- [WEP012] Fibratus behavior rules, memory scanning and capture.
- [WEP013] Rustinel platform capability and protection boundaries.
- [WEP014] YARA-X rule engine and compatibility references.
- [WEP015] PRX-SD documented platform coverage.
- [WEP016] Sentinella v0.1.13 limits and lifecycle lessons.
- [WEP017] Sentinella v0.1.12 cache and timeout corrections.
- [WEP018] Appwrite Defender ClamAV-format support and omissions.
- [WEP019] Microsoft CreateToolhelp32Snapshot API limitations.
- [WEP020] AMTSO use and misuse of antimalware test files.

[WEP001]: https://learn.microsoft.com/en-us/windows/win32/wesp/wesp-requirements
[WEP002]: https://techcommunity.microsoft.com/blog/Windows-ITPro-blog/whats-next-windows-endpoint-security-platform-and-driver-quality/4572663
[WEP003]: https://github.com/microsoft/windows-drivers-rs/blob/main/README.md
[WEP004]: https://learn.microsoft.com/en-us/windows/win32/etw/about-event-tracing
[WEP005]: https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-controltracew
[WEP006]: https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/security-malware-windows-defender-disableantispyware
[WEP007]: https://learn.microsoft.com/en-us/windows/win32/amsi/antimalware-scan-interface-portal
[WEP008]: https://www.microsoft.com/en-us/wdsi/defenderupdates
[WEP009]: https://www.bitdefender.com/consumer/support/answer/10690/
[WEP010]: https://github.com/hasherezade/pe-sieve/blob/7517ed395b2cc26cff8069f2b819417aaf8d5d11/README.md
[WEP011]: https://github.com/hasherezade/hollows_hunter/blob/cd694375bbc810e9b0faa93530568953118278ce/README.md
[WEP012]: https://github.com/rabbitstack/fibratus/blob/0d2cb65b379673542da6ff35992f81fa603fe5a1/README.md
[WEP013]: https://github.com/Karib0u/rustinel/blob/901f2e6ab966089b621470bd28499ffb0572e8db/README.md
[WEP014]: https://github.com/VirusTotal/yara-x/blob/ea1d215af89760325a9e08713ad1a1fc05a9a439/README.md
[WEP015]: https://github.com/openprx/prx-sd/blob/df613b75e8460831708c54475a9e93bf618a7400/README.md
[WEP016]: https://github.com/LeewayOpenSoftware/Sentinella/releases/tag/v0.1.13
[WEP017]: https://github.com/LeewayOpenSoftware/Sentinella/releases/tag/v0.1.12
[WEP018]: https://github.com/appwrite/defender/blob/5ce7189f2b197b60f1b55696b032fae1ed8ba85e/README.md
[WEP019]: https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-createtoolhelp32snapshot
[WEP020]: https://www.amtso.org/wp-content/uploads/2018/05/AMTSO-Use-and-Misuse-of-Test-Files-in-Anti-Malware-Testing-FINAL.pdf
