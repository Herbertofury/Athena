# Security & privacy

Protect identities and data; investigate suspicious behavior.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=security) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

54 applications. Reviewed 2026-11-15; individual records identify inherited research.

## Activity Tracing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Factivity-tracing)

### Linux Audit

Linux audit userspace tools for collecting kernel audit events and querying who performed recorded actions.

- **Platforms:** Linux. **License:** GPL-2.0 tools and LGPL-2.1 libraries. **Pricing model:** unknown.
- **Pick for:** Maintain an attributable audit trail when specific system actions need persistent records.
- **Compare when:** Events depend on configured rules and kernel auditing; absent records do not prove an action never happened.
- **Strengths:** Maintain an attributable audit trail when specific system actions need persistent records.
- **Limitations:** Events depend on configured rules and kernel auditing; absent records do not prove an action never happened.; Broad rules can overwhelm queues or storage, so lost-event counters and retention need attention.
- **Maintenance:** active — Official release feed contains audit-4.2.1 with an updated timestamp of 2026-07-29. This is release-channel activity evidence, not proof of a stable build, installed compatibility or security testing. ([evidence](https://github.com/linux-audit/audit-userspace/releases.atom))
- [Official project](https://github.com/linux-audit/audit-userspace) · [Official installation / downloads](https://github.com/linux-audit/audit-userspace/releases) · [Repository](https://github.com/linux-audit/audit-userspace)
- **Sources:** [Official documentation and distribution evidence](https://github.com/linux-audit/audit-userspace) (2026-11-15; identity, features, platforms, license, downloads); [Official release or lifecycle evidence](https://github.com/linux-audit/audit-userspace/releases.atom) (2026-11-15; maintenance)

## Adware and unwanted software removal

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fadware-removal)

### Malwarebytes AdwCleaner

Specialized adware, potentially unwanted program and unwanted preinstalled-software cleanup.

- **Platforms:** Windows. **License:** Proprietary freeware. **Pricing model:** unknown.
- **Compatibility details:** Current Windows requirements must be checked; older Windows may require legacy unsupported releases.
- **Pick for:** Specialized adware, potentially unwanted program and unwanted preinstalled-software cleanup.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Specialized adware, potentially unwanted program and unwanted preinstalled-software cleanup.
- **Limitations:** Cleaning changes the system; inspect detections, close work and retain rollback/quarantine.; Workflow inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.malwarebytes.com/adwcleaner)
- **Sources:** [Preserved original research source](https://www.malwarebytes.com/adwcleaner) (2026-11-14; identity, features); [Preserved original research source](https://help.malwarebytes.com/hc/en-us/articles/31589231147035-Scan-and-clean-a-device-with-AdwCleaner) (2026-11-14; identity, features); [Preserved original research source](https://help.malwarebytes.com/hc/en-us/articles/31589274807579-System-requirements-for-AdwCleaner) (2026-11-14; identity, features)

## Application firewalls

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fapplication-firewalls)

### Little Snitch

macOS network monitor and application firewall with rule-based connection control.

- **Platforms:** macOS. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** A commercial Mac option for detailed connection visibility and policy control.
- **Compare when:** Requires supported macOS networking permissions
- **Strengths:** A commercial Mac option for detailed connection visibility and policy control.
- **Limitations:** Requires supported macOS networking permissions; Rules need review as application behavior changes.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.obdev.at/products/littlesnitch/) · [Official installation / downloads](https://www.obdev.at/products/littlesnitch/download.html)
- **Sources:** [Official project documentation](https://www.obdev.at/products/littlesnitch/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://www.obdev.at/products/littlesnitch/download.html) (2026-11-14; downloads)
### LuLu

Open-source macOS firewall for monitoring and blocking outbound application connections.

- **Platforms:** macOS. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for Mac users who want a focused outbound connection-control tool.
- **Compare when:** macOS permissions and extension approval are required
- **Strengths:** Useful for Mac users who want a focused outbound connection-control tool.
- **Limitations:** macOS permissions and extension approval are required; Connection prompts alone do not identify malicious intent.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-02. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/objective-see/LuLu/releases.atom))
- [Official project](https://objective-see.org/products/lulu.html) · [Official installation / downloads](https://objective-see.org/products/lulu.html) · [Repository](https://github.com/objective-see/LuLu)
- **Sources:** [Official project documentation](https://objective-see.org/products/lulu.html) (2026-11-14; downloads, features, identity, platforms, pricing); [Official source repository and README](https://github.com/objective-see/LuLu) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/objective-see/LuLu/HEAD/LICENSE.md) (2026-11-14; license); [Official release activity](https://github.com/objective-see/LuLu/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/objective-see/LuLu/releases/expanded_assets/v4.5.7) (2026-11-14; pricing)
### OpenSnitch

Linux application firewall with a graphical interface for reviewing outbound connections.

- **Platforms:** Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for Linux desktop users who want to review application network access.
- **Compare when:** Rule prompts and policies require maintenance
- **Strengths:** Useful for Linux desktop users who want to review application network access.
- **Limitations:** Rule prompts and policies require maintenance; System networking integration and permissions need setup.
- **Maintenance:** active — Official release feed contains activity dated 2026-04-15. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/evilsocket/opensnitch/releases.atom))
- [Official project](https://github.com/evilsocket/opensnitch) · [Official installation / downloads](https://github.com/evilsocket/opensnitch/releases) · [Repository](https://github.com/evilsocket/opensnitch)
- **Sources:** [Official project documentation](https://github.com/evilsocket/opensnitch) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/evilsocket/opensnitch/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/evilsocket/opensnitch/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/evilsocket/opensnitch/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/evilsocket/opensnitch/releases/expanded_assets/v1.8.0) (2026-11-14; pricing)
### Portmaster

Per-application connection visibility and blocking

- **Platforms:** Windows. **License:** GPL-3.0 main; inspect UI/driver/services separately. **Pricing model:** unknown.
- **Compatibility details:** Windows; see linked upstream requirements for exact supported build/architecture
- **Pick for:** Per-application connection visibility and blocking
- **Compare when:** VM compatibility matrix with VPN/DNS and baseline connection latency
- **Strengths:** Per-application connection visibility and blocking
- **Limitations:** Network driver/filter changes and DNS policies can disrupt VPNs; paid services separate; Study event-to-policy architecture; component licensing and service agreements independently checked
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/safing/portmaster) · [Repository](https://github.com/safing/portmaster)
- **Sources:** [Preserved original research source](https://github.com/safing/portmaster) (2026-11-14; identity, features)
### simplewall

Windows Filtering Platform rules with per-app control

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Upstream Windows 7/8/8.1/10/11, 64-bit/ARM64, admin required
- **Pick for:** Windows Filtering Platform rules with per-app control
- **Compare when:** Isolated VM only: allow/deny fixture matrix, rollback and reboot persistence
- **Strengths:** Windows Filtering Platform rules with per-app control
- **Limitations:** Firewall changes can cut off remote access or break updates; upstream documents uninstall leaves filters active until disabled/removed; Copyleft candidate; keep policy planning separate from privileged WFP enforcement
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/henrypp/simplewall) · [Repository](https://github.com/henrypp/simplewall)
- **Sources:** [Preserved original research source](https://github.com/henrypp/simplewall) (2026-11-14; identity, features)

## Application sandboxing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fapplication-sandboxing)

### Firejail

Linux application sandbox using namespaces, seccomp and configurable profiles to limit process access.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Pick for:** Apply explicit isolation profiles to supported Linux desktop applications.
- **Compare when:** A profile must match the application and desired permissions; incompatible restrictions can break functionality.
- **Strengths:** Apply explicit isolation profiles to supported Linux desktop applications.
- **Limitations:** A profile must match the application and desired permissions; incompatible restrictions can break functionality.; Sandboxing reduces selected access paths but does not prove an application safe or replace system updates.
- **Maintenance:** active — Official release feed contains Release 0.9.82.2 with an updated timestamp of 2026-11-04. This is release-channel activity evidence, not proof of a stable build, installed compatibility or security testing. ([evidence](https://github.com/netblue30/firejail/releases.atom))
- [Official project](https://firejail.wordpress.com/) · [Official installation / downloads](https://github.com/netblue30/firejail/releases) · [Repository](https://github.com/netblue30/firejail)
- **Sources:** [Official documentation and distribution evidence](https://github.com/netblue30/firejail) (2026-11-15; identity, features, platforms, license, downloads); [Official release or lifecycle evidence](https://github.com/netblue30/firejail/releases.atom) (2026-11-15; maintenance)
### Sandboxie Plus

Application isolation and disposable sandboxes

- **Platforms:** Windows. **License:** Mixed: GPL core, custom SandMan UI, LGPL components; not uniformly GPL. **Pricing model:** unknown.
- **Compatibility details:** Windows; see linked upstream requirements for exact supported build/architecture
- **Pick for:** Application isolation and disposable sandboxes
- **Compare when:** Disposable benign fixture: filesystem/registry isolation, recovery and compatibility
- **Strengths:** Application isolation and disposable sandboxes
- **Limitations:** Not an absolute malware boundary; kernel component and certificate/commercial restrictions; No blanket reuse: review LICENSE.Plus and each component; custom UI not presumed open-source reusable
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/sandboxie-plus/Sandboxie) · [Repository](https://github.com/sandboxie-plus/Sandboxie)
- **Sources:** [Preserved original research source](https://github.com/sandboxie-plus/Sandboxie) (2026-11-14; identity, features); [Preserved original research source](https://github.com/sandboxie-plus/Sandboxie/blob/master/LICENSE.Plus) (2026-11-14; identity, features)

## Authenticator Apps

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fauthenticator-apps)

### Ente Auth

Authenticator application with optional encrypted synchronization and an offline account-free mode.

- **Platforms:** Windows, macOS, Linux, Web. **License:** AGPL-3.0. **Pricing model:** free.
- **Compatibility details:** Official Auth page explicitly links Windows, macOS and Linux apps plus a web client.
- **Pick for:** Fits users who want authenticator codes across devices while retaining export and offline options.
- **Compare when:** Cloud recovery depends on protecting the account and recovery material.
- **Strengths:** Fits users who want authenticator codes across devices while retaining export and offline options.
- **Limitations:** Cloud recovery depends on protecting the account and recovery material.; A software authenticator does not provide the same physical separation as a hardware security key.
- **Maintenance:** active — Official release-feed entry 'auth-v4.4.27-rc' updated 2026-11-12. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/ente-io/ente/releases.atom))
- [Official project](https://ente.com/auth/) · [Official installation / downloads](https://ente.com/auth/) · [Repository](https://github.com/ente/ente)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/ente-io/ente/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/ente-io/ente/HEAD/LICENSE) (2026-11-14; license); [Official price or edition-policy statement](https://ente.com/auth/) (2026-11-14; downloads, identity, pricing); [Official release activity or lifecycle basis](https://github.com/ente-io/ente/releases.atom) (2026-11-14; maintenance)
### Yubico Authenticator

Companion application for managing YubiKey-backed credentials and authenticator codes.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** unknown.
- **Compatibility details:** Official README supports Windows 10+ x64, macOS 13+ and Ubuntu 22.04+; older systems receive best-effort support.
- **Pick for:** Choose when authentication secrets and supported credential management should live on a compatible hardware key.
- **Compare when:** A compatible YubiKey is required and is purchased separately.
- **Strengths:** Choose when authentication secrets and supported credential management should live on a compatible hardware key.
- **Limitations:** A compatible YubiKey is required and is purchased separately.; Features depend on the key model, firmware and connection interface.
- **Maintenance:** active — Official release-feed entry 'Yubico Authenticator 7.5.0' updated 2026-11-03. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/Yubico/yubioath-flutter/releases.atom))
- [Official project](https://www.yubico.com/products/yubico-authenticator/) · [Official installation / downloads](https://www.yubico.com/products/yubico-authenticator/) · [Repository](https://github.com/Yubico/yubioath-flutter)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/Yubico/yubioath-flutter/HEAD/README.adoc) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/Yubico/yubioath-flutter/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://www.yubico.com/products/yubico-authenticator/) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/Yubico/yubioath-flutter/releases.atom) (2026-11-14; maintenance)

## Configuration Auditing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fconfiguration-auditing)

### Lynis

Local Unix security-auditing utility that reports configuration findings and hardening suggestions.

- **Platforms:** macOS, Linux, FreeBSD. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Official README lists Linux, macOS and BSD families.
- **Pick for:** Useful for a structured review of a Unix-like workstation or server configuration.
- **Compare when:** Audit suggestions require interpretation for the specific host and workload.
- **Strengths:** Useful for a structured review of a Unix-like workstation or server configuration.
- **Limitations:** Audit suggestions require interpretation for the specific host and workload.; A completed scan is not a security certification or proof that no vulnerabilities exist.
- **Maintenance:** active — Official release-feed entry 'Lynis 3.1.7' updated 2026-06-25. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/CISOfy/lynis/releases.atom))
- [Official project](https://cisofy.com/lynis/) · [Official installation / downloads](https://github.com/CISOfy/lynis) · [Repository](https://github.com/CISOfy/lynis)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/CISOfy/lynis/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/CISOfy/lynis/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/CISOfy/lynis) (2026-11-14; downloads); [Official project identity and product page](https://cisofy.com/lynis/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/CISOfy/lynis/releases.atom) (2026-11-14; maintenance)
### OpenSCAP

Standards-based security configuration scanner for evaluating systems against SCAP content and generating reports.

- **Platforms:** Linux. **License:** LGPL-2.1. **Pricing model:** unknown.
- **Compatibility details:** Upstream explicitly removed Windows support; Linux is the supported catalog target.
- **Pick for:** Evaluate a system against a specified machine-readable baseline with reproducible findings.
- **Compare when:** Useful results require applicable, current policy content; passing one profile is not comprehensive security assurance.
- **Strengths:** Evaluate a system against a specified machine-readable baseline with reproducible findings.
- **Limitations:** Useful results require applicable, current policy content; passing one profile is not comprehensive security assurance.; Upstream removed Windows support; this record does not promise current Windows operation.
- **Maintenance:** active — Official release feed contains 1.4.6 with an updated timestamp of 2026-10-22. This is release-channel activity evidence, not proof of a stable build, installed compatibility or security testing. ([evidence](https://github.com/OpenSCAP/openscap/releases.atom))
- [Official project](https://www.open-scap.org/) · [Official installation / downloads](https://www.open-scap.org/download/) · [Repository](https://github.com/OpenSCAP/openscap)
- **Sources:** [Official documentation and distribution evidence](https://www.open-scap.org/) (2026-11-15; identity, features, downloads); [Official documentation and distribution evidence](https://github.com/OpenSCAP/openscap) (2026-11-15; license, platforms, features, downloads); [Official documentation and distribution evidence](https://github.com/OpenSCAP/openscap/blob/main/docs/windows.md) (2026-11-15; platforms, maintenance); [Official release or lifecycle evidence](https://github.com/OpenSCAP/openscap/releases.atom) (2026-11-15; maintenance)

## Detection rule engineering

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fdetection-rules)

### Sigma rules

Portable detection-rule corpus for supported log sources; not a standalone scanner.

- **Platforms:** Windows. **License:** Detection Rule License 1.1 for the rule collection; specification and logo are public domain. **Pricing model:** free.
- **Compatibility details:** Rules require a compatible engine, backend and configured telemetry.
- **Pricing details:** The upstream rule collection is available at no cost. Conversion, collection and SIEM products used with it have separate licenses and operating costs.
- **Pick for:** Portable detection-rule corpus for supported log sources; not a standalone scanner.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Portable detection-rule corpus for supported log sources; not a standalone scanner.
- **Limitations:** Do not assume rules work unchanged on every backend.; Treat rule content separately from engine licensing.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/SigmaHQ/sigma) · [Repository](https://github.com/SigmaHQ/sigma)
- **Sources:** [Official Sigma rule collection and no-cost distribution statement](https://github.com/SigmaHQ/sigma) (2026-11-15; features, identity, pricing); [Rule, specification and logo licensing boundaries](https://github.com/SigmaHQ/sigma/blob/master/LICENSE) (2026-11-15; features, identity, license); [Official DRL description and author-attribution requirements](https://github.com/SigmaHQ/Detection-Rule-License) (2026-11-15; license)

## USB device access control

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fdevice-access-control)

### USBGuard

Linux USB device authorization framework using allow and block rules.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Pick for:** Useful when a Linux workstation needs explicit control over permitted USB devices.
- **Compare when:** Incorrect policy can block input devices
- **Strengths:** Useful when a Linux workstation needs explicit control over permitted USB devices.
- **Limitations:** Incorrect policy can block input devices; Requires administrative integration and a recovery plan.
- **Maintenance:** active — Official release feed contains activity dated 2025-07-15. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/USBGuard/usbguard/releases.atom))
- [Official project](https://usbguard.github.io/) · [Official installation / downloads](https://usbguard.github.io/documentation/installation.html) · [Repository](https://github.com/USBGuard/usbguard)
- **Sources:** [Official project documentation](https://usbguard.github.io/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/USBGuard/usbguard) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://usbguard.github.io/documentation/installation.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/USBGuard/usbguard/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/USBGuard/usbguard/releases.atom) (2026-11-14; maintenance)

## Disk encryption

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fdisk-encryption)

### VeraCrypt

Disk-encryption application for encrypted containers and supported device encryption.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 code plus inherited TrueCrypt License components. **Pricing model:** free.
- **Pick for:** Useful for mounting an encrypted volume that multiple desktop applications can use.
- **Compare when:** System-encryption support is platform-specific
- **Strengths:** Useful for mounting an encrypted volume that multiple desktop applications can use.
- **Limitations:** System-encryption support is platform-specific; Password and recovery-material loss can make encrypted data inaccessible.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-05. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/veracrypt/VeraCrypt/releases.atom))
- [Official project](https://veracrypt.io/) · [Official installation / downloads](https://veracrypt.io/en/Downloads.html) · [Repository](https://github.com/veracrypt/VeraCrypt)
- **Sources:** [Official project documentation](https://veracrypt.io/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/veracrypt/VeraCrypt) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://veracrypt.io/en/Downloads.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/veracrypt/VeraCrypt/HEAD/License.txt) (2026-11-14; license); [Official release activity](https://github.com/veracrypt/VeraCrypt/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/veracrypt/VeraCrypt/releases/expanded_assets/VeraCrypt_1.26.31) (2026-11-14; pricing)

## Encrypted Folder Managers

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fencrypted-folder-managers)

### SiriKali

Graphical manager for supported encrypted-folder tools and selected SSHFS workflows.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Official page lists Windows, macOS and Linux with a separate backend-support matrix.
- **Pick for:** Useful when operating several encrypted-folder backends through a common desktop interface.
- **Compare when:** Encryption depends on the chosen backend and its version; not every backend works on every OS.
- **Strengths:** Useful when operating several encrypted-folder backends through a common desktop interface.
- **Limitations:** Encryption depends on the chosen backend and its version; not every backend works on every OS.; The project notes unsigned Windows installers and macOS packaging limitations.
- **Maintenance:** active — Official release-feed entry '1.8.6' updated 2026-03-06. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/mhogomchungu/sirikali/releases.atom))
- [Official project](https://mhogomchungu.github.io/sirikali/) · [Official installation / downloads](https://mhogomchungu.github.io/sirikali/) · [Repository](https://github.com/mhogomchungu/sirikali)
- **Sources:** [Official project feature documentation](https://mhogomchungu.github.io/sirikali/) (2026-11-14; downloads, features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/mhogomchungu/sirikali/HEAD/LICENSE) (2026-11-14; license); [Official release activity or lifecycle basis](https://github.com/mhogomchungu/sirikali/releases.atom) (2026-11-14; maintenance)

## Endpoint inventory queries

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fendpoint-inventory)

### osquery

SQL-style operating-system instrumentation and inventory.

- **Platforms:** Windows. **License:** Apache-2.0 OR GPL-2.0-only; see repository license. **Pricing model:** unknown.
- **Compatibility details:** Windows, Linux and macOS.
- **Pick for:** SQL-style operating-system instrumentation and inventory.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** SQL-style operating-system instrumentation and inventory.
- **Limitations:** Inventory queries are not equivalent to malware prevention; scheduled telemetry has privacy and resource costs.; Useful schema/extension reference, with exact dependency license review.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/osquery/osquery) · [Repository](https://github.com/osquery/osquery)
- **Sources:** [Preserved original research source](https://github.com/osquery/osquery) (2026-11-14; identity, features); [Preserved original research source](https://github.com/osquery/osquery/blob/master/LICENSE) (2026-11-14; identity, features)

## Endpoint investigation

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fendpoint-investigation)

### Velociraptor

VQL-based host-state collection and endpoint investigation.

- **Platforms:** Windows. **License:** AGPLv3 main repository. **Pricing model:** unknown.
- **Compatibility details:** Windows client builds; deployment architecture requires planning.
- **Pick for:** VQL-based host-state collection and endpoint investigation.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** VQL-based host-state collection and endpoint investigation.
- **Limitations:** Managed deployment may create persistent collection and powerful access; not an install-and-forget cleaner.; VQL and artifact architecture inspiration; main engine license differs from MIT pyvelociraptor.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/Velocidex/velociraptor) · [Repository](https://github.com/Velocidex/velociraptor)
- **Sources:** [Preserved original research source](https://github.com/Velocidex/velociraptor) (2026-11-14; identity, features); [Preserved original research source](https://github.com/Velocidex/velociraptor/blob/master/CONTRIBUTING.md) (2026-11-14; identity, features)

## Endpoint event telemetry

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fendpoint-telemetry)

### Sysmon

Persistent telemetry service/driver. Event 8 remote-thread creation, 10 process access and 7 image loading support investigation.

- **Platforms:** Windows. **License:** Microsoft Sysinternals Software License Terms (proprietary).. **Pricing model:** free.
- **Compatibility details:** This record covers the Windows service and driver: Windows 11 or newer or Server 2019 or newer. A separate Linux implementation is linked upstream.
- **Pick for:** Choose Sysmon to record persistent Windows process and related activity in the event log for later analysis.
- **Compare when:** Compare Process Monitor for a focused interactive reproduction, or TCPView for a current connection list.
- **Strengths:** Persistent telemetry service/driver. Event 8 remote-thread creation, 10 process access and 7 image loading support investigation.
- **Limitations:** Sysmon records events but does not analyze them for you; useful detection requires a configuration and a separate review or collection workflow.; Network connection logging is disabled in the documented default configuration; event selection and retention determine coverage and volume.
- **Maintenance:** active — Official product page lists a release published 2026-09-10. Release date reviewed; application not executed. ([evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon))
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) · [Official installation / downloads](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)
- **Sources:** [Official release or lifecycle evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) (2026-11-15; downloads, features, identity, maintenance, platforms); [Preserved original research source](https://learn.microsoft.com/en-us/windows/security/operating-system-security/sysmon/sysmon-events) (2026-11-14; identity, features); [Microsoft Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms) (2026-11-15; license); [Microsoft application archive publicly available without payment](https://download.sysinternals.com/files/Sysmon.zip) (2026-11-15; downloads, pricing)

## Event log forensics

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fevent-log-forensics)

### Chainsaw

Searches and hunts Windows forensic artifacts with rule-driven analysis.

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Windows build available; verify release artifact because upstream noted a prior Windows build failure.
- **Pick for:** Searches and hunts Windows forensic artifacts with rule-driven analysis.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Searches and hunts Windows forensic artifacts with rule-driven analysis.
- **Limitations:** No detection without suitable input artifacts; preserve originals and inspect false positives.; Rust analysis implementation candidate subject to GPL and rule licensing.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/WithSecureOpenSource/chainsaw) · [Repository](https://github.com/WithSecureOpenSource/chainsaw)
- **Sources:** [Preserved original research source](https://github.com/WithSecureOpenSource/chainsaw) (2026-11-14; identity, features); [Preserved original research source](https://github.com/WithSecureOpenSource/chainsaw/releases) (2026-11-14; identity, features)
### Hayabusa

Sigma-based threat hunting and forensic timelines from Windows event logs.

- **Platforms:** Windows. **License:** Engine AGPLv3; detection rules DRL 1.1. **Pricing model:** unknown.
- **Compatibility details:** Windows event-log analysis; select supported build.
- **Pick for:** Sigma-based threat hunting and forensic timelines from Windows event logs.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Sigma-based threat hunting and forensic timelines from Windows event logs.
- **Limitations:** Rule matches require investigation; missing telemetry and false positives matter.; Engine and rule licenses are separate; evaluate AGPL and DRL obligations before reuse.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/Yamato-Security/hayabusa) · [Repository](https://github.com/Yamato-Security/hayabusa)
- **Sources:** [Preserved original research source](https://github.com/Yamato-Security/hayabusa) (2026-11-14; identity, features)

## File encryption

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Ffile-encryption)

### age

Small command-line file encryption tool using explicit recipients and modern cryptographic design.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause. **Pricing model:** free.
- **Pick for:** Useful for encrypting files in scripts without a full mail-key ecosystem.
- **Compare when:** Recipients and secret keys must be managed separately
- **Strengths:** Useful for encrypting files in scripts without a full mail-key ecosystem.
- **Limitations:** Recipients and secret keys must be managed separately; Not a mounted encrypted filesystem or password manager.
- **Maintenance:** active — Official release feed contains activity dated 2026-08-29. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/FiloSottile/age/releases.atom))
- [Official project](https://age-encryption.org/) · [Official installation / downloads](https://github.com/FiloSottile/age#installation) · [Repository](https://github.com/FiloSottile/age)
- **Sources:** [Official project documentation](https://age-encryption.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/FiloSottile/age) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/FiloSottile/age#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/FiloSottile/age/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/FiloSottile/age/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/FiloSottile/age/releases/expanded_assets/v1.3.2) (2026-11-14; pricing)
### CryFS

Encrypted filesystem designed to conceal file contents and structure before cloud synchronization.

- **Platforms:** macOS, Linux, Windows. **License:** LGPL-3.0. **Pricing model:** free.
- **Compatibility details:** Stable-series docs cover Linux and macOS; Windows is explicitly experimental. Alpha-series support differs.
- **Pick for:** Fits encrypting a directory before sending its underlying data through a chosen sync provider.
- **Compare when:** Use the stable 1.0 series: the default 2.0 alpha branch explicitly warns of data loss.
- **Strengths:** Fits encrypting a directory before sending its underlying data through a chosen sync provider.
- **Limitations:** Use the stable 1.0 series: the default 2.0 alpha branch explicitly warns of data loss.; Windows support is experimental and platform filesystem dependencies are required.
- **Maintenance:** active — Official release-feed entry '1.0.3' updated 2025-12-21. Feed activity can include prereleases; it does not establish installed stability. This record targets stable 1.0; the 2.0 development branch explicitly warns of unsafe alpha/data-loss risk. ([evidence](https://github.com/cryfs/cryfs/releases.atom))
- [Official project](https://www.cryfs.org/) · [Official installation / downloads](https://www.cryfs.org/#download) · [Repository](https://github.com/cryfs/cryfs)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/cryfs/cryfs/release/1.0/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/cryfs/cryfs/release/1.0/LICENSE.txt) (2026-11-14; license); [Official price or edition-policy statement](https://www.cryfs.org/) (2026-11-14; identity, pricing); [Official download or installation landing page](https://www.cryfs.org/#download) (2026-11-14; downloads); [Official release activity or lifecycle basis](https://github.com/cryfs/cryfs/releases.atom) (2026-11-14; maintenance)
### Cryptomator

Client-side encrypted vault application designed for files stored in cloud-synced folders.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0 desktop; separate mobile and commercial terms. **Pricing model:** mixed.
- **Pick for:** Useful when keeping filenames and file contents encrypted before cloud upload.
- **Compare when:** Cloud provider sync behavior still applies
- **Strengths:** Useful when keeping filenames and file contents encrypted before cloud upload.
- **Limitations:** Cloud provider sync behavior still applies; Mobile and business offerings can have separate charges.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/cryptomator/cryptomator/releases.atom))
- [Official project](https://cryptomator.org/) · [Official installation / downloads](https://cryptomator.org/downloads/) · [Repository](https://github.com/cryptomator/cryptomator)
- **Sources:** [Official project documentation](https://cryptomator.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/cryptomator/cryptomator) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://cryptomator.org/downloads/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/cryptomator/cryptomator/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/cryptomator/cryptomator/releases.atom) (2026-11-14; maintenance); [Official distribution price or edition policy](https://cryptomator.org/pricing/) (2026-11-14; pricing)
### GnuPG

OpenPGP cryptographic suite for encryption, signatures and key management.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0-or-later. **Pricing model:** free.
- **Pick for:** Useful where interoperability with OpenPGP signatures and encrypted files is required.
- **Compare when:** Key lifecycle and trust models require understanding
- **Strengths:** Useful where interoperability with OpenPGP signatures and encrypted files is required.
- **Limitations:** Key lifecycle and trust models require understanding; Windows desktop use often benefits from Gpg4win packaging.
- **Maintenance:** active — Official release news lists GnuPG 2.5.24 on 2026-09-23. Installed behavior was not tested. ([evidence](https://gnupg.org/))
- [Official project](https://gnupg.org/) · [Official installation / downloads](https://gnupg.org/download/)
- **Sources:** [Official project documentation](https://gnupg.org/) (2026-11-14; identity, features, platforms, maintenance); [Official download or installation landing page](https://gnupg.org/download/) (2026-11-14; downloads, pricing); [Official GnuPG grant in distribution notices](https://www.gpg4win.org/license.html) (2026-11-14; license)
### gocryptfs

FUSE encrypted filesystem storing encrypted files individually in a backing directory.

- **Platforms:** Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for Linux workflows that need file-level encrypted backing storage.
- **Compare when:** Requires FUSE and key management
- **Strengths:** Useful for Linux workflows that need file-level encrypted backing storage.
- **Limitations:** Requires FUSE and key management; macOS behavior and dependencies differ from the primary Linux path.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-11. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/rfjakob/gocryptfs/releases.atom))
- [Official project](https://nuetzlich.net/gocryptfs/) · [Official installation / downloads](https://github.com/rfjakob/gocryptfs/releases) · [Repository](https://github.com/rfjakob/gocryptfs)
- **Sources:** [Official project documentation](https://nuetzlich.net/gocryptfs/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/rfjakob/gocryptfs) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/rfjakob/gocryptfs/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/rfjakob/gocryptfs/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/rfjakob/gocryptfs/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/rfjakob/gocryptfs/releases/expanded_assets/v2.7.0) (2026-11-14; pricing)
### Gpg4win

Windows distribution combining GnuPG with graphical certificate and file-encryption tools.

- **Platforms:** Windows. **License:** Free-software suite; component GPL and other licenses. **Pricing model:** free.
- **Pick for:** Useful for a graphical Windows workflow around GnuPG keys and signatures.
- **Compare when:** A suite containing components rather than a separate encryption format
- **Strengths:** Useful for a graphical Windows workflow around GnuPG keys and signatures.
- **Limitations:** A suite containing components rather than a separate encryption format; Email integration depends on the supported client.
- **Maintenance:** active — Official release news lists Gpg4win 5.1.1 on 2026-09-23. Installed behavior was not tested. ([evidence](https://www.gpg4win.org/))
- [Official project](https://www.gpg4win.org/) · [Official installation / downloads](https://www.gpg4win.org/download.html)
- **Sources:** [Official project documentation](https://www.gpg4win.org/) (2026-11-14; identity, features, platforms, maintenance); [Official download or installation landing page](https://www.gpg4win.org/download.html) (2026-11-14; downloads); [Official component license notices](https://www.gpg4win.org/license.html) (2026-11-14; license); [Official distribution price or edition policy](https://www.gpg4win.org/get-gpg4win.html) (2026-11-14; pricing)

## File Integrity Monitoring

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Ffile-integrity-monitoring)

### AIDE

File-integrity checker comparing filesystem attributes and hashes against a stored baseline.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** This entry scopes the documented Unix build to Linux; other Unix ports require separate platform review.
- **Pick for:** Useful for detecting unexpected changes to selected system files after establishing a trusted baseline.
- **Compare when:** The baseline and reports need protection and careful review.
- **Strengths:** Useful for detecting unexpected changes to selected system files after establishing a trusted baseline.
- **Limitations:** The baseline and reports need protection and careful review.; Expected updates generate changes too; it does not automatically determine whether a change is malicious.
- **Maintenance:** active — Official release-feed entry 'v0.19.5' updated 2026-10-22. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/aide/aide/releases.atom))
- [Official project](https://aide.github.io/) · [Official installation / downloads](https://github.com/aide/aide) · [Repository](https://github.com/aide/aide)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/aide/aide/HEAD/README) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/aide/aide/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/aide/aide) (2026-11-14; downloads); [Official project identity and product page](https://aide.github.io/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/aide/aide/releases.atom) (2026-11-14; maintenance)

## File pattern matching

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Ffile-pattern-matching)

### YARA-X

Rust implementation of YARA-style pattern matching.

- **Platforms:** Windows. **License:** BSD-3-Clause. **Pricing model:** unknown.
- **Compatibility details:** Cross-platform engine; verify Windows release package for selected version.
- **Pick for:** Rust implementation of YARA-style pattern matching.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Rust implementation of YARA-style pattern matching.
- **Limitations:** Rules can generate false positives; matching engine alone is not antivirus or EDR.; Permissive engine reuse candidate; third-party rule licenses remain separate.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/VirusTotal/yara-x) · [Repository](https://github.com/VirusTotal/yara-x)
- **Sources:** [Preserved original research source](https://github.com/VirusTotal/yara-x) (2026-11-14; identity, features)

## Executable signature verification

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Ffile-signature-verification)

### Sigcheck

File version, timestamp, digital signature and certificate-chain inspection.

- **Platforms:** Windows. **License:** Microsoft Sysinternals Software License Terms (proprietary).. **Pricing model:** free.
- **Compatibility details:** Current Windows utility: Windows 11 or newer, Server 2019 or newer, or Nano Server 2019 or newer.
- **Pick for:** Choose Sigcheck to inspect file versions, hashes, signing information and optional reputation results from the command line.
- **Compare when:** Compare ListDLLs for modules loaded in running processes or Process Explorer for interactive process investigation.
- **Strengths:** File version, timestamp, digital signature and certificate-chain inspection.
- **Limitations:** A valid signature establishes signing information, not that a file is suitable or harmless for your use.; Optional VirusTotal operations contact an external service; review the selected query or upload options before including private files.
- **Maintenance:** active — Official product page lists a release published 2026-10-15. Release date reviewed; application not executed. ([evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck))
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck) · [Official installation / downloads](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck)
- **Sources:** [Official release or lifecycle evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck) (2026-11-15; downloads, features, identity, maintenance, platforms); [Microsoft Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms) (2026-11-15; license); [Microsoft application archive publicly available without payment](https://download.sysinternals.com/files/Sigcheck.zip) (2026-11-15; downloads, pricing)

## Process injection detection

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Finjection-detection)

### HollowsHunter

PE-sieve-based multi-process scanner with filters and optional repeated/ETW-triggered scanning.

- **Platforms:** Windows. **License:** BSD-2-Clause. **Pricing model:** unknown.
- **Compatibility details:** Windows; ETW mode documented for 64-bit build.
- **Pick for:** PE-sieve-based multi-process scanner with filters and optional repeated/ETW-triggered scanning.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** PE-sieve-based multi-process scanner with filters and optional repeated/ETW-triggered scanning.
- **Limitations:** Not full EDR; dumps can expose private memory. Continuous scanning needs overhead measurement.; Reuse orchestration ideas and permissive code with submodule review; do not replace target benchmarking.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/hasherezade/hollows_hunter) · [Repository](https://github.com/hasherezade/hollows_hunter)
- **Sources:** [Preserved original research source](https://github.com/hasherezade/hollows_hunter) (2026-11-14; identity, features)
### Moneta

Live user-mode memory analysis for indicators of compromise.

- **Platforms:** Windows. **License:** GNU General Public License version 3. **Pricing model:** unknown.
- **Compatibility details:** Release page identifies 64-bit Windows only.
- **Pick for:** Live user-mode memory analysis for indicators of compromise.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Live user-mode memory analysis for indicators of compromise.
- **Limitations:** Analyst tool, not a universal malware verdict. Validate maintenance and Windows compatibility before recommending.; Architecture inspiration only until exact license reviewed.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/forrest-orr/moneta) · [Repository](https://github.com/forrest-orr/moneta)
- **Sources:** [Upstream Windows memory-analysis project and usage documentation](https://github.com/forrest-orr/moneta) (2026-11-15; features, identity, platforms); [Preserved original research source](https://github.com/forrest-orr/moneta/releases) (2026-11-14; identity, features); [Upstream Moneta GPL version 3 license](https://github.com/forrest-orr/moneta/blob/master/LICENSE) (2026-11-15; license)
### PE-sieve

Scans one process for suspicious injected/replaced executable code, hooks and in-memory patches; offers DLL API.

- **Platforms:** Windows. **License:** BSD-2-Clause. **Pricing model:** unknown.
- **Compatibility details:** Windows process scanner.
- **Pick for:** Scans one process for suspicious injected/replaced executable code, hooks and in-memory patches; offers DLL API.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Scans one process for suspicious injected/replaced executable code, hooks and in-memory patches; offers DLL API.
- **Limitations:** Findings are suspicious artifacts, not proof of compromise. Memory dumps may contain secrets.; Strong candidate for reuse as a narrow scanning engine; inspect submodules and false-positive behavior before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/hasherezade/pe-sieve) · [Repository](https://github.com/hasherezade/pe-sieve)
- **Sources:** [Preserved original research source](https://github.com/hasherezade/pe-sieve) (2026-11-14; identity, features)

## Intrusion Prevention

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fintrusion-prevention)

### CrowdSec Security Engine

Behavior-based detection engine that analyzes logs and connects to separate remediation components.

- **Platforms:** Windows, Linux. **License:** MIT engine; optional services have separate terms. **Pricing model:** unknown.
- **Compatibility details:** Official README links Linux, Windows and container deployment paths; remediation support depends on the target component.
- **Pick for:** Fits a self-hosted service stack that needs coordinated detection and blocking across components.
- **Compare when:** Blocking requires configuring the appropriate remediation component.
- **Strengths:** Fits a self-hosted service stack that needs coordinated detection and blocking across components.
- **Limitations:** Blocking requires configuring the appropriate remediation component.; Cloud intelligence, console and commercial services have separate data-sharing and pricing considerations.
- **Maintenance:** active — Official release-feed entry 'v1.8.2' updated 2026-10-27. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/crowdsecurity/crowdsec/releases.atom))
- [Official project](https://github.com/crowdsecurity/crowdsec) · [Official installation / downloads](https://github.com/crowdsecurity/crowdsec) · [Repository](https://github.com/crowdsecurity/crowdsec)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/crowdsecurity/crowdsec/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/crowdsecurity/crowdsec/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/crowdsecurity/crowdsec) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/crowdsecurity/crowdsec/releases.atom) (2026-11-14; maintenance)
### Fail2Ban

Log-driven service that temporarily blocks sources matching configured abuse patterns.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Compatibility details:** The README documents Linux installation and kernel requirements; firewall and log backend support varies.
- **Pick for:** Fits reducing repeated login abuse against services with suitable logs and clear allowlist requirements.
- **Compare when:** It cannot compensate for weak authentication or vulnerable services.
- **Strengths:** Fits reducing repeated login abuse against services with suitable logs and clear allowlist requirements.
- **Limitations:** It cannot compensate for weak authentication or vulnerable services.; Incorrect thresholds or allowlists can block legitimate users.
- **Maintenance:** active — Official release-feed entry '1.1.1 (2026/08/15) - triple-one-win' updated 2026-08-15. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/fail2ban/fail2ban/releases.atom))
- [Official project](https://github.com/fail2ban/fail2ban) · [Official installation / downloads](https://github.com/fail2ban/fail2ban) · [Repository](https://github.com/fail2ban/fail2ban)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/fail2ban/fail2ban/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/fail2ban/fail2ban/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/fail2ban/fail2ban) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/fail2ban/fail2ban/releases.atom) (2026-11-14; maintenance)

## Malware scanning and removal

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fmalware-scanning)

### ClamAV

Open-source scanning engine with official Windows builds.

- **Platforms:** Windows. **License:** GPLv2. **Pricing model:** unknown.
- **Compatibility details:** Windows supported; Linux on-access scanning is not provided on Windows.
- **Pick for:** Open-source scanning engine with official Windows builds.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Open-source scanning engine with official Windows builds.
- **Limitations:** Do not present Windows ClamAV as a drop-in real-time Defender replacement. Signature updates and tuning needed.; GPL engine integration candidate; evaluate detection and performance on permitted fixtures.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.clamav.net/downloads)
- **Sources:** [Preserved original research source](https://www.clamav.net/downloads) (2026-11-14; identity, features); [Preserved original research source](https://docs.clamav.net/faq/faq-win32.html) (2026-11-14; identity, features); [Preserved original research source](https://docs.clamav.net/manual/Development/libclamav.html) (2026-11-14; identity, features)
### Emsisoft Emergency Kit

Portable toolkit to scan and clean infected computers without conventional installation.

- **Platforms:** Windows. **License:** Proprietary; verify personal/business usage terms. **Pricing model:** unknown.
- **Compatibility details:** Vendor page: Windows 10 64-bit, Server 2016 and higher; check supported-build policy.
- **Pick for:** Portable toolkit to scan and clean infected computers without conventional installation.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Portable toolkit to scan and clean infected computers without conventional installation.
- **Limitations:** Portable does not mean no system effects: cleaning/quarantine changes data.; Workflow inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.emsisoft.com/en/emergency-kit/)
- **Sources:** [Preserved original research source](https://www.emsisoft.com/en/emergency-kit/) (2026-11-14; identity, features); [Preserved original research source](https://www.emsisoft.com/en/help/2881/supported-operating-systems-and-platforms/) (2026-11-14; identity, features)
### ESET Online Scanner

On-demand Windows malware scanning with vendor detection engine.

- **Platforms:** Windows. **License:** Proprietary free scanning tool. **Pricing model:** unknown.
- **Compatibility details:** Windows; internet/download requirements apply.
- **Pick for:** On-demand Windows malware scanning with vendor detection engine.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** On-demand Windows malware scanning with vendor detection engine.
- **Limitations:** Review removal options and optional periodic scanning; do not email reports.; Workflow inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.eset.com/us/home/online-scanner/)
- **Sources:** [Preserved original research source](https://www.eset.com/us/home/online-scanner/) (2026-11-14; identity, features); [Preserved original research source](https://help.eset.com/eos/en-US/) (2026-11-14; identity, features)
### Malwarebytes

On-demand malware scan/removal; paid product adds ongoing protection.

- **Platforms:** Windows. **License:** Proprietary; free scanner and paid protection differ. **Pricing model:** unknown.
- **Compatibility details:** Windows product; confirm current edition requirements.
- **Pick for:** On-demand malware scan/removal; paid product adds ongoing protection.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** On-demand malware scan/removal; paid product adds ongoing protection.
- **Limitations:** Review quarantine and trial/subscription choices. Do not confuse free scan with continuous protection.; Product/workflow inspiration only, no source reuse grant.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.malwarebytes.com/solutions/virus-scanner)
- **Sources:** [Preserved original research source](https://www.malwarebytes.com/solutions/virus-scanner) (2026-11-14; identity, features)
### Microsoft Safety Scanner

On-demand Windows malware scan/removal tool.

- **Platforms:** Windows. **License:** Microsoft proprietary utility. **Pricing model:** unknown.
- **Compatibility details:** Windows; fresh download required because package expires after ten days.
- **Pick for:** On-demand Windows malware scan/removal tool.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** On-demand Windows malware scan/removal tool.
- **Limitations:** Not continuous antivirus; review removals and keep protection enabled.; Workflow inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://learn.microsoft.com/microsoft-365/security/intelligence/safety-scanner-download)
- **Sources:** [Preserved original research source](https://learn.microsoft.com/microsoft-365/security/intelligence/safety-scanner-download) (2026-11-14; identity, features)

## Managed endpoint monitoring

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fmanaged-endpoint-monitoring)

### Wazuh agent

Windows endpoint agent for a managed Wazuh monitoring deployment.

- **Platforms:** Windows. **License:** Wazuh GPLv2; audit full stack licenses. **Pricing model:** unknown.
- **Compatibility details:** Windows 11 and Server 2025 documented among supported systems.
- **Pick for:** Windows endpoint agent for a managed Wazuh monitoring deployment.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Windows endpoint agent for a managed Wazuh monitoring deployment.
- **Limitations:** Requires managed backend/configuration; persistent agent is not a standalone PC cleaner.; Architecture candidate, not a desktop drop-in; confirm exact component licenses.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html)
- **Sources:** [Preserved original research source](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html) (2026-11-14; identity, features)

## Memory forensics

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fmemory-forensics)

### MemProcFS

Memory-analysis toolkit exposing memory artifacts through a filesystem-oriented workflow.

- **Platforms:** Windows. **License:** AGPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Windows-oriented memory tooling; verify acquisition/backend prerequisites.
- **Pick for:** Memory-analysis toolkit exposing memory artifacts through a filesystem-oriented workflow.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Memory-analysis toolkit exposing memory artifacts through a filesystem-oriented workflow.
- **Limitations:** Forensic memory data is sensitive; do not acquire or publish user dumps for catalog tests.; AGPL-sensitive integration candidate; separately audit acquisition libraries.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/ufrisk/MemProcFS) · [Repository](https://github.com/ufrisk/MemProcFS)
- **Sources:** [Preserved original research source](https://github.com/ufrisk/MemProcFS) (2026-11-14; identity, features)
### Volatility 3

Framework for analyzing memory images, including Windows artifacts.

- **Platforms:** Windows. **License:** Volatility Software License 1.0; custom copyleft terms cover changes and qualifying additions, including dedicated wrappers. **Pricing model:** free.
- **Compatibility details:** Windows memory analysis; Python/dependency and symbol requirements apply.
- **Pricing details:** The upstream VSL grants no-cost use, sharing and modification under its terms. This classification covers the framework, not commercial training, support or surrounding forensic products.
- **Pick for:** Framework for analyzing memory images, including Windows artifacts.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Framework for analyzing memory images, including Windows artifacts.
- **Limitations:** Memory acquisition and analysis can expose highly sensitive content; some Windows 11 images have documented issues.; Read VSL 1.0 directly; do not label as generic GPL or unrestricted reuse.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/volatilityfoundation/volatility3) · [Repository](https://github.com/volatilityfoundation/volatility3)
- **Sources:** [Official framework, stable-branch and installation documentation](https://github.com/volatilityfoundation/volatility3) (2026-11-15; downloads, features, identity); [Preserved original research source](https://github.com/volatilityfoundation/volatility3/releases) (2026-11-14; identity, features); [Upstream Volatility Software License 1.0 grant and copyleft scope](https://github.com/volatilityfoundation/volatility3/blob/develop/LICENSE.txt) (2026-11-15; license, pricing)

## Password managers

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fpassword-managers)

### 1Password

Subscription password manager with cross-platform apps and shared vault workflows.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Proprietary commercial service. **Pricing model:** subscription.
- **Pick for:** A commercial option for users who value integrated shared-vault administration.
- **Compare when:** Ongoing subscription
- **Strengths:** A commercial option for users who value integrated shared-vault administration.
- **Limitations:** Ongoing subscription; Recovery and sharing capabilities depend on account type.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://1password.com/) · [Official installation / downloads](https://1password.com/downloads)
- **Sources:** [Official project documentation](https://1password.com/) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://1password.com/downloads) (2026-11-14; downloads); [Official 1Password plans](https://1password.com/pricing) (2026-11-14; pricing); [Official application license agreement](https://1password.com/legal/terms-of-service) (2026-11-14; license)
### Bitwarden

Password-management suite with desktop apps, browser integration and sync services.

- **Platforms:** Windows, macOS, Linux, Web. **License:** GPL-3.0 and Bitwarden License components; hosted service terms. **Pricing model:** freemium.
- **Pick for:** Useful for cross-device password management with a free entry tier.
- **Compare when:** Some advanced features require paid plans
- **Strengths:** Useful for cross-device password management with a free entry tier.
- **Limitations:** Some advanced features require paid plans; Account recovery and organizational policy choices need deliberate setup.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-05. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/bitwarden/clients/releases.atom))
- [Official project](https://bitwarden.com/) · [Official installation / downloads](https://bitwarden.com/download/) · [Repository](https://github.com/bitwarden/clients)
- **Sources:** [Official project documentation](https://bitwarden.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/bitwarden/clients) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://bitwarden.com/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/bitwarden/clients/HEAD/LICENSE.txt) (2026-11-14; license); [Official Bitwarden plans](https://bitwarden.com/pricing/) (2026-11-14; pricing); [Official release activity](https://github.com/bitwarden/clients/releases.atom) (2026-11-14; maintenance)
### gopass

Command-line secret manager using encrypted files and versioned stores for individuals and teams.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** README explicitly lists Linux, macOS, BSD and Windows; integrations may need GPG, Git or an external editor.
- **Pick for:** Fits terminal-focused teams that want explicit ownership of secret storage and synchronization.
- **Compare when:** Key management, repository access and backup policy remain the operator's responsibility.
- **Strengths:** Fits terminal-focused teams that want explicit ownership of secret storage and synchronization.
- **Limitations:** Key management, repository access and backup policy remain the operator's responsibility.; The project warns that some distribution packages named gopass refer to an unrelated program.
- **Maintenance:** active — Official release-feed entry 'v1.17.4' updated 2026-10-10. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/gopasspw/gopass/releases.atom))
- [Official project](https://github.com/gopasspw/gopass) · [Official installation / downloads](https://github.com/gopasspw/gopass) · [Repository](https://github.com/gopasspw/gopass)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/gopasspw/gopass/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/gopasspw/gopass/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/gopasspw/gopass) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/gopasspw/gopass/releases.atom) (2026-11-14; maintenance)
### KeePass

Windows password manager using a local encrypted database and plugin ecosystem.

- **Platforms:** Windows. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Useful when a Windows-local password database and established plugins are priorities.
- **Compare when:** Sync and mobile clients are separate choices
- **Strengths:** Useful when a Windows-local password database and established plugins are priorities.
- **Limitations:** Sync and mobile clients are separate choices; Plugin trust and compatibility require review.
- **Maintenance:** active — Official news lists KeePass 2.62 on 2026-11-04. Installed behavior was not tested. ([evidence](https://keepass.info/))
- [Official project](https://keepass.info/) · [Official installation / downloads](https://keepass.info/download.html)
- **Sources:** [Official project documentation](https://keepass.info/) (2026-11-14; identity, features, pricing, maintenance); [Official KeePass 2 license](https://keepass.info/help/v2/license.html) (2026-11-14; license); [Official download or installation landing page](https://keepass.info/download.html) (2026-11-14; downloads, platforms)
### KeePassXC

Local password database workflow

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0-or-GPL-3.0 application, with separately documented open-source component licenses.. **Pricing model:** free.
- **Compatibility details:** Native Windows, macOS and Linux editions. Official downloads distinguish current architectures, OS requirements and legacy builds; browser integration also requires its companion extension.
- **Pick for:** Choose KeePassXC when you want a local encrypted password database under your own control.
- **Compare when:** Compare Bitwarden or 1Password when hosted synchronization, account recovery and team administration are central requirements.
- **Strengths:** Local password database workflow
- **Limitations:** You manage the database file, backup copies and any synchronization service yourself.; Losing the master credentials or required key file can prevent access; an offline vault does not provide a hosted account-recovery service.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/keepassxreboot/keepassxc) · [Official installation / downloads](https://keepassxc.org/download/) · [Repository](https://github.com/keepassxreboot/keepassxc)
- **Sources:** [Official capabilities and practical usage basis](https://github.com/keepassxreboot/keepassxc) (2026-11-15; features, identity); [Official free and cross-platform application overview](https://keepassxc.org/) (2026-11-14; platforms, pricing); [Official KeePassXC downloads and requirements](https://keepassxc.org/download/) (2026-11-14; downloads, platforms); [Official application and component copyright/license inventory](https://raw.githubusercontent.com/keepassxreboot/keepassxc/develop/COPYING) (2026-11-15; license); [Official database, credentials and backup guidance](https://keepassxc.org/docs/KeePassXC_GettingStarted) (2026-11-15; features)
### Proton Pass

Password manager with cross-device vaults, autofill and email-alias features.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Open-source client applications; hosted service terms. **Pricing model:** freemium.
- **Pick for:** Useful when password management and email aliases are wanted in one service.
- **Compare when:** Alias and sharing limits vary by plan
- **Strengths:** Useful when password management and email aliases are wanted in one service.
- **Limitations:** Alias and sharing limits vary by plan; It remains tied to a hosted account ecosystem.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://proton.me/pass) · [Official installation / downloads](https://proton.me/pass/download)
- **Sources:** [Official project documentation](https://proton.me/pass) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://proton.me/pass/download) (2026-11-14; downloads); [Official Proton Pass plans](https://proton.me/pass/pricing) (2026-11-14; pricing); [Official client source-code and license overview](https://proton.me/community/open-source) (2026-11-14; license); [Official hosted-service terms](https://proton.me/legal/terms) (2026-11-14; license)

## Privacy VPN services

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fprivacy-vpn)

### Mullvad VPN

Commercial VPN service with open-source desktop clients and account-number access.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0 application; paid VPN service. **Pricing model:** subscription.
- **Pick for:** Useful when a paid VPN service and inspectable desktop client are desired.
- **Compare when:** A VPN shifts network trust rather than making activity anonymous
- **Strengths:** Useful when a paid VPN service and inspectable desktop client are desired.
- **Limitations:** A VPN shifts network trust rather than making activity anonymous; Subscription and exit-location availability must be checked.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/mullvad/mullvadvpn-app/releases.atom))
- [Official project](https://github.com/mullvad/mullvadvpn-app) · [Official installation / downloads](https://github.com/mullvad/mullvadvpn-app/releases) · [Repository](https://github.com/mullvad/mullvadvpn-app)
- **Sources:** [Official project documentation](https://github.com/mullvad/mullvadvpn-app) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/mullvad/mullvadvpn-app/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/mullvad/mullvadvpn-app/HEAD/LICENSE.md) (2026-11-14; license); [Official release activity](https://github.com/mullvad/mullvadvpn-app/releases.atom) (2026-11-14; maintenance); [Official distribution price or edition policy](https://mullvad.net/en/pricing) (2026-11-14; pricing)
### Proton VPN

VPN service offering desktop clients and free or paid service tiers.

- **Platforms:** Windows, macOS, Linux. **License:** Open-source client applications; hosted service terms. **Pricing model:** freemium.
- **Pick for:** A comparison option when a no-cost VPN tier is needed before choosing paid service.
- **Compare when:** Free and paid capabilities differ
- **Strengths:** A comparison option when a no-cost VPN tier is needed before choosing paid service.
- **Limitations:** Free and paid capabilities differ; VPN use does not remove browser fingerprinting or account-based tracking.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://protonvpn.com/) · [Official installation / downloads](https://protonvpn.com/download)
- **Sources:** [Official desktop downloads and service comparison](https://protonvpn.com/download) (2026-11-14; identity, features, platforms, pricing, downloads); [Official client source-code and license overview](https://proton.me/community/open-source) (2026-11-14; license); [Official hosted-service terms](https://proton.me/legal/terms) (2026-11-14; license)

## Repair and disinfection orchestration

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Frepair-orchestration)

### Tron

Batch-script orchestration of multiple Windows cleanup, repair and disinfection tools.

- **Platforms:** Windows. **License:** MIT scripts; bundled third-party tools have separate terms. **Pricing model:** unknown.
- **Compatibility details:** Windows administrator workflow; upstream warns against unsupported OS overrides.
- **Pick for:** Batch-script orchestration of multiple Windows cleanup, repair and disinfection tools.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Batch-script orchestration of multiple Windows cleanup, repair and disinfection tools.
- **Limitations:** High-impact remediation, not a routine optimizer or injection detector. Upstream warns to reboot first and use full official package, not GitHub source archive; can take hours. No log emailing.; Reuse scripts only under MIT and review all third-party licensing/actions; do not redistribute whole bundle as MIT.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/bmrf/tron) · [Repository](https://github.com/bmrf/tron)
- **Sources:** [Preserved original research source](https://github.com/bmrf/tron) (2026-11-14; identity, features)

## Static executable analysis

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=security%2Fstatic-file-analysis)

### Detect It Easy

File-format, packer and compiler inspection with signatures and heuristics.

- **Platforms:** Windows. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Windows, Linux and macOS; release-specific builds.
- **Pick for:** File-format, packer and compiler inspection with signatures and heuristics.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** File-format, packer and compiler inspection with signatures and heuristics.
- **Limitations:** Packed/obfuscated files are not automatically malware. Do not execute unknown samples.; Useful static-analysis/UI reference; inspect engine/submodule licenses.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/horsicq/Detect-It-Easy) · [Repository](https://github.com/horsicq/Detect-It-Easy)
- **Sources:** [Preserved original research source](https://github.com/horsicq/Detect-It-Easy) (2026-11-14; identity, features); [Preserved original research source](https://github.com/horsicq/Detect-It-Easy/blob/master/changelog.txt) (2026-11-14; identity, features)
