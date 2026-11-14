# Investigating processes interacting with other processes

Research snapshot: 2026-11-14. Documentation review only: no tools were installed, no malware samples were run, and no private memory was collected. These are workflow-fit candidates, not benchmark winners.

## What does “attached to another process” mean?

It can mean an open process handle, debugger attachment, DLL loading, a remote thread, a hook, or injected executable memory. These are different observations. Legitimate debuggers, accessibility tools, overlays and security software can interact with other processes. A suspicious artifact needs context, not automatic deletion.

| Investigation question | Useful starting point | What it does not prove |
|---|---|---|
| Which process has this handle or DLL? | [Process Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer), [System Informer](https://github.com/winsiderss/systeminformer) | An open handle or module alone is not malware evidence. |
| What file, registry or process activity occurred? | [Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) | A trace is not a verdict or prevention engine. |
| Which process opened another or created a remote thread? | [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) | Events are telemetry, not a complete injection detector or EDR. |
| Is executable memory suspicious? | [PE-sieve](https://github.com/hasherezade/pe-sieve) for one process; [HollowsHunter](https://github.com/hasherezade/hollows_hunter) for multiple processes | Suspicious hooks/patches need analyst review; dumps can contain secrets. |
| What remains in event logs? | [Hayabusa](https://github.com/Yamato-Security/hayabusa), [Chainsaw](https://github.com/WithSecureOpenSource/chainsaw) | No tool can recover telemetry that was never collected merely by applying more rules. |
| What was present in a memory image? | [Volatility 3](https://github.com/volatilityfoundation/volatility3), [MemProcFS](https://github.com/ufrisk/MemProcFS) | Acquisition quality, OS support and symbols constrain interpretation. |

Sysmon has Event 8 for remote-thread creation, Event 10 for process access and Event 7 for module loading. Image-load logging is disabled by default; indiscriminate image/process-access logging can be expensive and noisy. Configuration and privacy review come before installing a persistent service/driver. [Microsoft documentation](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)

## Keep cleanup separate from investigation

[Malwarebytes](https://www.malwarebytes.com/solutions/virus-scanner) offers on-demand scanning; free scanning and paid continuous protection are not interchangeable. [AdwCleaner](https://www.malwarebytes.com/adwcleaner) specifically targets adware and unwanted software. Neither is a process-attachment visualization tool.

[Tron](https://github.com/bmrf/tron) orchestrates cleanup, repair and disinfection tools. It belongs in **advanced remediation**, not routine performance tuning. Its official README requires the complete distribution rather than a GitHub source download, warns about reboot/pending-update risk and documents lengthy runs. Its MIT script license does not make bundled proprietary tools MIT. Do not enable log-emailing or publish incident logs.

## Safe evaluation order

1. Define the symptom and preserve relevant non-sensitive evidence before remediation.
2. Start with bounded read-only observations. Avoid blindly terminating processes, disabling services or closing handles.
3. For a suspicious process, correlate identity, provenance, signature, behavior and multiple evidence sources. Signing is not a guarantee of safety.
4. Keep memory dumps, packet captures and machine-specific logs private. Do not upload to public repositories or reputation services by default.
5. Test any future Athena integration on synthetic/authorized fixtures first: known benign hooks, reproducible false positives, performance overhead, permissions and failure cases.
6. Label observation, suspicious finding, analyst-confirmed issue and remediation separately. No UI should imply that a green scan proves a system clean.

## Reuse priorities, not product rankings

- **Permissive-code candidates:** PE-sieve and HollowsHunter (BSD-2-Clause), System Informer and Detect It Easy (MIT), YARA-X (BSD-3-Clause). Verify dependencies and exact pinned versions before copying.
- **Copyleft evaluation:** Hayabusa and Velociraptor (AGPLv3), Chainsaw/simplewall (GPL-3.0), ClamAV (GPLv2). Network-service integration and redistribution require deliberate license review.
- **Separate content licenses:** Sigma/Hayabusa rules use DRL 1.1. Wireshark's GPL does not cover Npcap's separate restrictions. Volatility 3 uses VSL 1.0.
- **Inspiration only unless permission is established:** proprietary Microsoft Sysinternals, Malwarebytes, ESET and Emsisoft products.

## Evidence gaps retained

No numeric user-feedback score was established in this pass. No current exact GitHub star count was established; rounded web counts were deliberately not converted into fake precise counts. Existing catalog integration can fetch dated API counts separately. No claim is made that this is every security tool, that a new release is automatically better, or that one engine outperforms another. Moneta's exact license remains pending and it is not authorized as a code-reuse base.
