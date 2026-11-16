# Process inspection: separate telemetry from a malware verdict

Reviewed 2026-11-15. This is independent release-risk analysis, not a tool ranking, automatic cleanup recipe or installation recommendation.

## Sysmon: useful relationships, not automatic conclusions

Microsoft identifies [Sysmon 15.22](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) with a publication date of September 10, 2026. It is a persistent Windows service/driver that records telemetry; it does not analyze those events for the operator.

For investigating processes interacting with other processes, distinguish:
- Event 8: a process created a thread in another process.
- Event 10: one process opened another process.
- Event 25: detected process-image tampering.

Image-load telemetry is disabled by default and can create substantial logging volume. These are different observations, not interchangeable proof of compromise. Correlate process identity, signer, parent/target context and surrounding activity before drawing a conclusion.

The Windows distribution has [Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms), not an assumed open-source license inherited from the separate Linux project. Those terms warn that saved diagnostic data may contain sensitive information. Keep raw process-state material out of public research repositories.

## PE-sieve: narrow bug fixes and targeted inspection

The official latest release endpoint resolved to [PE-sieve 0.4.1.1](https://github.com/hasherezade/pe-sieve/releases/tag/v0.4.1.1). Its notes report a fix for dumping reflectively loaded PE files and protection against DLL hijacking. This does not establish that every injection technique is detected.

The [project](https://github.com/hasherezade/pe-sieve) describes a single-process inspection engine for potentially malicious implants, hooks and memory patches, available as an executable or library. Its root license is BSD-2-Clause; dependency and pinned-file terms still need review before reuse.

The [official FAQ](https://github.com/hasherezade/pe-sieve/wiki/1.-FAQ) reports testing from Windows 7 through Windows 11 24H2 and says the 64-bit build can inspect both 32-bit and 64-bit processes. That is upstream testing scope, not our compatibility acceptance or a guarantee on newer Windows.

## System Informer: investigation interface and compatibility boundary

The official latest endpoint resolved to [4.0.26241.138](https://github.com/winsiderss/systeminformer/releases/tag/v4.0.26241.138). Its [README](https://github.com/winsiderss/systeminformer) specifies Windows 10 or newer, 32-bit or 64-bit, and the repository identifies an MIT license. No specific release improvement is asserted here because this review did not recover sufficient release-body detail.

## Practical interpretation and remaining verification

Legitimate debuggers, monitoring software and security products can interact with other processes. A suspicious observation is a lead, not grounds for automatic termination or deletion. Memory dumps can expose private documents, credentials or other account material; do not collect or upload them casually.

The rendered PE-sieve and System Informer release dates omitted a year, so full publication dates remain unverified here. No software was downloaded, installed or executed; no service or driver was configured; no process was terminated or dumped. No benchmark, detection-rate comparison or exhaustive protection claim is made.

A future authorized lab comparison should retain benign examples and measure false positives, missing events and overhead. It must distinguish upstream claims, actual observations and interpretation. This note changes no catalog records, runtime configuration or manifest.
