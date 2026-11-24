# System & hardware

Inspect, maintain and understand your computer.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=system) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

89 applications. Reviewed 2026-11-16; individual records identify inherited research.

## File, registry and process tracing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Factivity-tracing)

### Process Monitor

Real-time filesystem, Registry and process/thread activity with filters and stacks.

- **Platforms:** Windows. **License:** Microsoft Sysinternals Software License Terms (proprietary).. **Pricing model:** free.
- **Compatibility details:** Current Windows build: Windows 11 or newer, or Windows Server 2019 or newer. The linked Linux implementation is a separate project.
- **Pick for:** Choose Process Monitor to capture and filter Windows file-system, registry and process/thread events while reproducing a problem.
- **Compare when:** Compare Process Explorer for a current handle or DLL owner, and Sysmon for persistent event-log telemetry.
- **Strengths:** Real-time filesystem, Registry and process/thread activity with filters and stacks.
- **Limitations:** You generally need to capture while the problem happens; a trace is not a record of activity before capture began.; Broad captures can be large and contain sensitive paths and process information; useful analysis requires filters and a bounded reproduction.
- **Maintenance:** active — Official product page lists a release published 2026-11-05. Release date reviewed; application not executed. ([evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon))
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) · [Official installation / downloads](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon)
- **Sources:** [Official release or lifecycle evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) (2026-11-15; downloads, features, identity, maintenance, platforms); [Microsoft Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms) (2026-11-15; license); [Microsoft application archive publicly available without payment](https://download.sysinternals.com/files/ProcessMonitor.zip) (2026-11-15; downloads, pricing)
### strace

Linux command-line tracer for system calls, signals and process-kernel interactions.

- **Platforms:** Linux. **License:** LGPL-2.1-or-later; test suite GPL-2.0-or-later. **Pricing model:** unknown.
- **Pick for:** Find missing files, failing syscalls or unexpected process interactions without modifying the application source.
- **Compare when:** Tracing changes execution timing and can produce large amounts of sensitive output.
- **Strengths:** Find missing files, failing syscalls or unexpected process interactions without modifying the application source.
- **Limitations:** Tracing changes execution timing and can produce large amounts of sensitive output.; Attaching to processes requires suitable permissions and is not a substitute for a language-level profiler.
- **Maintenance:** active — Official release feed contains strace 7.3 with an updated timestamp of 2026-10-22. This is release-channel activity evidence, not proof of a stable build, installed compatibility or security testing. ([evidence](https://github.com/strace/strace/releases.atom))
- [Official project](https://strace.io/) · [Official installation / downloads](https://strace.io/) · [Repository](https://github.com/strace/strace)
- **Sources:** [Official documentation and distribution evidence](https://strace.io/) (2026-11-15; identity, features); [Official documentation and distribution evidence](https://github.com/strace/strace) (2026-11-15; license, platforms, downloads); [Official release or lifecycle evidence](https://github.com/strace/strace/releases.atom) (2026-11-15; maintenance)
### Sysdig OSS

Linux system-call capture and troubleshooting tool with container context and reusable trace files.

- **Platforms:** Linux. **License:** Apache-2.0 userspace; drivers and dependencies have separate licenses. **Pricing model:** unknown.
- **Pick for:** Inspect process and container behavior from captured operating-system events.
- **Compare when:** Capture depends on a compatible kernel driver or probe and appropriate privileges.
- **Strengths:** Inspect process and container behavior from captured operating-system events.
- **Limitations:** Capture depends on a compatible kernel driver or probe and appropriate privileges.; Event capture can be high-volume and may include application data; filter scope and retention should fit the investigation.
- **Maintenance:** active — Official release feed contains 0.41.4 with an updated timestamp of 2026-01-29. This is release-channel activity evidence, not proof of a stable build, installed compatibility or security testing. ([evidence](https://github.com/draios/sysdig/releases.atom))
- [Official project](https://github.com/draios/sysdig) · [Official installation / downloads](https://github.com/draios/sysdig/releases) · [Repository](https://github.com/draios/sysdig)
- **Sources:** [Official documentation and distribution evidence](https://github.com/draios/sysdig) (2026-11-15; identity, features, platforms, license, downloads); [Official release or lifecycle evidence](https://github.com/draios/sysdig/releases.atom) (2026-11-15; maintenance)

## Bootable USB and installation media

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fboot-media)

### balenaEtcher

Graphical image writer for flashing operating-system images onto SD cards and USB drives.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** unknown.
- **Compatibility details:** README lists Windows 10+, macOS 10.13+ and x64 Linux; architecture availability varies.
- **Pick for:** Fits straightforward image flashing when a shared graphical workflow across desktop platforms matters.
- **Compare when:** Flashing replaces the destination contents.
- **Strengths:** Fits straightforward image flashing when a shared graphical workflow across desktop platforms matters.
- **Limitations:** Flashing replaces the destination contents.; Use Rufus when Windows-installer customization and boot-format controls are the main requirement.
- **Maintenance:** active — Official release-feed entry 'v2.1.9' updated 2026-10-22. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/balena-io/etcher/releases.atom))
- [Official project](https://etcher.balena.io/) · [Official installation / downloads](https://github.com/balena-io/etcher/releases) · [Repository](https://github.com/balena-io/etcher)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/balena-io/etcher/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/balena-io/etcher/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/balena-io/etcher/releases) (2026-11-14; downloads); [Official project identity and product page](https://etcher.balena.io/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/balena-io/etcher/releases.atom) (2026-11-14; maintenance)
### Raspberry Pi Imager

Raspberry Pi imaging application for writing supported operating systems to removable media.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 main code; bundled components have their own open-source licenses. **Pricing model:** unknown.
- **Pick for:** A task-specific choice for preparing Raspberry Pi storage from a desktop computer.
- **Compare when:** Writing an image replaces the selected medium.
- **Strengths:** A task-specific choice for preparing Raspberry Pi storage from a desktop computer.
- **Limitations:** Writing an image replaces the selected medium.; Anonymous usage metrics are enabled by default according to the project README; review the setting if relevant.
- **Maintenance:** active — Official release-feed entry 'v2.0.12' updated 2026-10-08. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/raspberrypi/rpi-imager/releases.atom))
- [Official project](https://www.raspberrypi.com/software/) · [Official installation / downloads](https://www.raspberrypi.com/software/) · [Repository](https://github.com/raspberrypi/rpi-imager)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/raspberrypi/rpi-imager/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/raspberrypi/rpi-imager/HEAD/license.txt) (2026-11-14; license); [Official download or installation landing page](https://www.raspberrypi.com/software/) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/raspberrypi/rpi-imager/releases.atom) (2026-11-14; maintenance)
### Rufus

Portable Windows utility for creating bootable USB installation and recovery media.

- **Platforms:** Windows. **License:** GPL-3.0-or-later. **Pricing model:** free.
- **Compatibility details:** Current official downloads require Windows 8 or later; x86, x64 and ARM64 builds are listed.
- **Pick for:** Choose for preparing Windows or Linux installers from a Windows PC with control over boot settings.
- **Compare when:** Writing an image erases the chosen destination; confirm the device first.
- **Strengths:** Choose for preparing Windows or Linux installers from a Windows PC with control over boot settings.
- **Limitations:** Writing an image erases the chosen destination; confirm the device first.; A bootable installer does not establish that the target hardware or operating system is supported.
- **Maintenance:** active — Official release-feed entry 'Rufus 4.16 BETA 2' updated 2026-11-11. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/pbatard/rufus/releases.atom))
- [Official project](https://rufus.ie/) · [Official installation / downloads](https://rufus.ie/) · [Repository](https://github.com/pbatard/rufus)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/pbatard/rufus/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/pbatard/rufus/HEAD/LICENSE.txt) (2026-11-14; license); [Official price or edition-policy statement](https://rufus.ie/) (2026-11-14; downloads, identity, pricing); [Official release activity or lifecycle basis](https://github.com/pbatard/rufus/releases.atom) (2026-11-14; maintenance)
### Ventoy

Boot-menu utility that starts several ISO and other supported image files from one prepared drive.

- **Platforms:** Windows, Linux, Bootable. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Windows and Linux prepare the drive; Bootable describes the resulting firmware boot environment, not a native macOS installer.
- **Pick for:** Useful for carrying several installers and rescue environments without rewriting the USB drive for each image.
- **Compare when:** The initial installation reformats the target drive.
- **Strengths:** Useful for carrying several installers and rescue environments without rewriting the USB drive for each image.
- **Limitations:** The initial installation reformats the target drive.; Image, firmware and Secure Boot compatibility must be checked for the intended PC.
- **Maintenance:** active — Official release-feed entry 'Ventoy 1.1.18 release' updated 2026-10-09. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/ventoy/Ventoy/releases.atom))
- [Official project](https://www.ventoy.net/) · [Official installation / downloads](https://www.ventoy.net/en/doc_start.html) · [Repository](https://github.com/ventoy/Ventoy)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/ventoy/Ventoy/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/ventoy/Ventoy/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://www.ventoy.net/en/doc_start.html) (2026-11-14; downloads); [Official project identity and product page](https://www.ventoy.net/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/ventoy/Ventoy/releases.atom) (2026-11-14; maintenance)

## Cache and temporary file cleanup

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fcleanup)

### BleachBit

Application-specific cleanup definitions

- **Platforms:** Windows, Linux. **License:** GPL-3.0-or-later application and cleaner definitions.. **Pricing model:** free.
- **Compatibility details:** Windows and Linux distributions. Current Windows 6.x releases require Windows 10/11; older builds are provided separately for legacy Windows.
- **Pick for:** Choose BleachBit for explicit, previewable cleanup of selected cache, history and temporary-file categories.
- **Compare when:** Compare Windows Storage Sense for integrated routine cleanup or an uninstaller such as BCUninstaller when the goal is removing an application.
- **Strengths:** Application-specific cleanup definitions
- **Limitations:** Selected cleaners can remove cookies, saved sessions or other application data; preview and review the selected categories before deletion.; Cleaning data does not establish a general performance improvement, and deletion is not a substitute for a backup or a device-specific sanitization procedure.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.bleachbit.org/) · [Official installation / downloads](https://www.bleachbit.org/download) · [Repository](https://github.com/bleachbit/bleachbit)
- **Sources:** [Official license and preview-before-delete workflow](https://github.com/bleachbit/bleachbit) (2026-11-15; features, identity, license); [Official selected-cleanup capabilities and no-charge distribution](https://www.bleachbit.org/) (2026-11-15; features, identity, platforms, pricing); [Official desktop distribution channels](https://www.bleachbit.org/download) (2026-11-15; downloads, platforms, pricing); [Official current and legacy Windows requirements](https://www.bleachbit.org/download/windows) (2026-11-15; downloads, platforms)

## Desktop container environments

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fcontainer-environments)

### Colima

Command-line manager for container runtimes inside desktop Linux virtual machines.

- **Platforms:** macOS, Linux. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Official README lists macOS on Intel/Apple Silicon and Linux.
- **Pick for:** Fits a Mac or Linux workflow that prefers CLI-managed container environments over a full desktop dashboard.
- **Compare when:** Requires the selected runtime client and underlying VM stack.
- **Strengths:** Fits a Mac or Linux workflow that prefers CLI-managed container environments over a full desktop dashboard.
- **Limitations:** Requires the selected runtime client and underlying VM stack.; Architecture emulation and specialized GPU features have additional host and version requirements.
- **Maintenance:** active — Official release-feed entry 'v0.10.3' updated 2026-06-04. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/abiosoft/colima/releases.atom))
- [Official project](https://colima.run/) · [Official installation / downloads](https://github.com/abiosoft/colima) · [Repository](https://github.com/abiosoft/colima)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/abiosoft/colima/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/abiosoft/colima/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/abiosoft/colima) (2026-11-14; downloads); [Official project identity and product page](https://colima.run/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/abiosoft/colima/releases.atom) (2026-11-14; maintenance)
### Distrobox

Tool for running user environments from other Linux distributions through container engines.

- **Platforms:** Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for using another distribution’s packages on an existing Linux desktop.
- **Compare when:** Designed for host integration rather than a strong security sandbox
- **Strengths:** Useful for using another distribution’s packages on an existing Linux desktop.
- **Limitations:** Designed for host integration rather than a strong security sandbox; Requires a supported container engine.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-25. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/89luca89/distrobox/releases.atom))
- [Official project](https://distrobox.it/) · [Official installation / downloads](https://distrobox.it/#installation) · [Repository](https://github.com/89luca89/distrobox)
- **Sources:** [Official project documentation](https://distrobox.it/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/89luca89/distrobox) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://distrobox.it/#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/89luca89/distrobox/HEAD/COPYING.md) (2026-11-14; license); [Official release activity](https://github.com/89luca89/distrobox/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/89luca89/distrobox/releases/expanded_assets/2.0.0-rc.4) (2026-11-14; pricing)
### Docker Desktop

Desktop application bundling container runtime integration and a graphical development workflow.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary Docker Desktop subscription terms; bundled OSS components. **Pricing model:** freemium.
- **Pick for:** Useful when a team’s development workflow already standardizes on Docker tooling.
- **Compare when:** Commercial-use eligibility determines subscription requirements
- **Strengths:** Useful when a team’s development workflow already standardizes on Docker tooling.
- **Limitations:** Commercial-use eligibility determines subscription requirements; Linux containers on Windows/macOS use virtualization resources.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.docker.com/products/docker-desktop/) · [Official installation / downloads](https://docs.docker.com/desktop/)
- **Sources:** [Official project documentation](https://www.docker.com/products/docker-desktop/) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://docs.docker.com/desktop/) (2026-11-14; downloads); [Official Docker Desktop use and subscription terms](https://docs.docker.com/subscription/desktop-license/) (2026-11-14; license, pricing)
### OrbStack

macOS application integrating Docker-compatible containers and Linux virtual machines.

- **Platforms:** macOS. **License:** Proprietary. **Pricing model:** freemium.
- **Compatibility details:** Official download page lists Apple Silicon and Intel builds for macOS 14+.
- **Pick for:** Fits a Mac workflow that wants containers and Linux machines managed together in a native app.
- **Compare when:** Free use has personal/non-commercial eligibility limits in the terms; professional, nonprofit, government and other covered uses require a license.
- **Strengths:** Fits a Mac workflow that wants containers and Linux machines managed together in a native app.
- **Limitations:** Free use has personal/non-commercial eligibility limits in the terms; professional, nonprofit, government and other covered uses require a license.; Current downloads require macOS 14 or later; vendor speed comparisons were not independently reproduced.
- **Maintenance:** unverified — Official project/download documentation was reviewed; dated release or maintenance activity was not established by the sources reviewed. ([evidence](https://orbstack.dev/))
- [Official project](https://orbstack.dev/) · [Official installation / downloads](https://orbstack.dev/download)
- **Sources:** [Official project feature documentation](https://orbstack.dev/) (2026-11-14; features, identity, maintenance); [Official supported-platform and installation documentation](https://orbstack.dev/download) (2026-11-14; downloads, platforms); [Official project application-license declaration](https://orbstack.dev/terms) (2026-11-14; license, pricing); [Official price or edition-policy statement](https://orbstack.dev/pricing) (2026-11-14; pricing)
### Podman Desktop

Desktop interface for working with containers, Podman and related development environments.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for developers wanting a graphical container workflow around Podman.
- **Compare when:** Windows and macOS generally use a Linux VM for Linux containers
- **Strengths:** Useful for developers wanting a graphical container workflow around Podman.
- **Limitations:** Windows and macOS generally use a Linux VM for Linux containers; Runtime and extension behavior differ by environment.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/podman-desktop/podman-desktop/releases.atom))
- [Official project](https://podman-desktop.io/) · [Official installation / downloads](https://podman-desktop.io/downloads) · [Repository](https://github.com/podman-desktop/podman-desktop)
- **Sources:** [Official project documentation](https://podman-desktop.io/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/podman-desktop/podman-desktop) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://podman-desktop.io/downloads) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/podman-desktop/podman-desktop/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/podman-desktop/podman-desktop/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/podman-desktop/podman-desktop/releases/expanded_assets/v1.30.7) (2026-11-14; pricing)
### Rancher Desktop

Desktop application for local Kubernetes and container management.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for developers who need a local Kubernetes-oriented container environment.
- **Compare when:** A local cluster consumes host resources
- **Strengths:** Useful for developers who need a local Kubernetes-oriented container environment.
- **Limitations:** A local cluster consumes host resources; Runtime selection affects CLI and image workflows.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-05. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/rancher-sandbox/rancher-desktop/releases.atom))
- [Official project](https://rancherdesktop.io/) · [Official installation / downloads](https://rancherdesktop.io/) · [Repository](https://github.com/rancher-sandbox/rancher-desktop)
- **Sources:** [Official project documentation](https://rancherdesktop.io/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/rancher-sandbox/rancher-desktop) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/rancher-sandbox/rancher-desktop/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/rancher-sandbox/rancher-desktop/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/rancher-sandbox/rancher-desktop/releases/expanded_assets/v1.25.0) (2026-11-14; pricing)

## Container management

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fcontainer-management)

### Portainer Community Edition

Self-hosted container-management interface for homelabs; CE 2.45 is the final Community Edition line.

- **Platforms:** Linux, Web. **License:** Zlib. **Pricing model:** free.
- **Compatibility details:** Linux container deployment with a browser UI; connected container environments have their own platform requirements.
- **Pick for:** Choose for learning or administering personal container environments through a web interface.
- **Compare when:** CE 2.45 receives bug/security fixes only until August 2027; the vendor says Portainer 3 has no Community Edition.
- **Strengths:** Choose for learning or administering personal container environments through a web interface.
- **Limitations:** CE 2.45 receives bug/security fixes only until August 2027; the vendor says Portainer 3 has no Community Edition.; The Community edition is self-supported and intended for non-production use; plan migration before its fixes end.
- **Maintenance:** active — Maintenance-only CE 2.45 line: the vendor announcement states bug/security fixes continue through August 2027, with no new CE features and no CE release for Portainer 3. ([evidence](https://www.portainer.io/blog/portainer-3-is-kubernetes-first-not-kubernetes-only))
- [Official project](https://github.com/portainer/portainer) · [Official installation / downloads](https://docs.portainer.io/start/install-ce/server/docker/linux) · [Repository](https://github.com/portainer/portainer)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/portainer/portainer/HEAD/README.md) (2026-11-14; features, identity, platforms, pricing); [Official supported-platform and installation documentation](https://docs.portainer.io/start/install-ce/server/docker/linux) (2026-11-14; downloads, platforms); [Official application license text](https://raw.githubusercontent.com/portainer/portainer/HEAD/LICENSE) (2026-11-14; license); [Official project identity and product page](https://github.com/portainer/portainer) (2026-11-14; identity); [Official release activity or lifecycle basis](https://www.portainer.io/blog/portainer-3-is-kubernetes-first-not-kubernetes-only) (2026-11-14; features, maintenance)

## Fan and cooling controls

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fcooling-control)

### CoolerControl

Linux cooling-control application for supported fans, sensors and liquid-cooling devices.

- **Platforms:** Linux. **License:** GPL-3.0-or-later. **Pricing model:** unknown.
- **Pick for:** Useful for coordinating supported Linux cooling hardware around temperature sensors.
- **Compare when:** Device availability depends on kernel drivers and liquidctl support
- **Strengths:** Useful for coordinating supported Linux cooling hardware around temperature sensors.
- **Limitations:** Device availability depends on kernel drivers and liquidctl support; Cooling profiles need validation on the actual hardware.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://coolercontrol.org/) · [Official installation / downloads](https://coolercontrol.org/)
- **Sources:** [Official project documentation](https://coolercontrol.org/) (2026-11-14; identity, features, platforms, license, downloads)
### Fan Control

Windows fan-control application with configurable curves and sensor sources.

- **Platforms:** Windows. **License:** Proprietary; free for personal and noncommercial use only. **Pricing model:** free.
- **Pick for:** Useful for shaping supported PC cooling behavior around measured temperatures.
- **Compare when:** The published license permits personal and noncommercial use only.
- **Strengths:** Useful for shaping supported PC cooling behavior around measured temperatures.
- **Limitations:** The published license permits personal and noncommercial use only.; Hardware compatibility varies; verify cooling under load after changing curves.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-02. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/Rem0o/FanControl.Releases/releases.atom))
- [Official project](https://getfancontrol.com/) · [Official installation / downloads](https://getfancontrol.com/) · [Repository](https://github.com/Rem0o/FanControl.Releases)
- **Sources:** [Official project documentation](https://getfancontrol.com/) (2026-11-14; identity, features, platforms, pricing, downloads); [Official source repository and README](https://github.com/Rem0o/FanControl.Releases) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/Rem0o/FanControl.Releases/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/Rem0o/FanControl.Releases/releases.atom) (2026-11-14; maintenance)
### liquidctl

Command-line control and monitoring for supported liquid coolers, power supplies and related hardware.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for controlling supported cooling hardware without a full vendor desktop suite.
- **Compare when:** Device support is model-specific
- **Strengths:** Useful for controlling supported cooling hardware without a full vendor desktop suite.
- **Limitations:** Device support is model-specific; Persistent configuration and safe settings depend on the hardware.
- **Maintenance:** active — Official release feed contains activity dated 2026-03-03. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/liquidctl/liquidctl/releases.atom))
- [Official project](https://github.com/liquidctl/liquidctl) · [Official installation / downloads](https://github.com/liquidctl/liquidctl#installation) · [Repository](https://github.com/liquidctl/liquidctl)
- **Sources:** [Official project documentation](https://github.com/liquidctl/liquidctl) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/liquidctl/liquidctl#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/liquidctl/liquidctl/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/liquidctl/liquidctl/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/liquidctl/liquidctl/releases/expanded_assets/v1.16.0) (2026-11-14; pricing)

## Reproducible development machines

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fdevelopment-environments)

### Vagrant

Command-line environment manager that describes repeatable virtual-machine development setups.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for current main source; provider and box terms remain separate. **Pricing model:** free.
- **Pick for:** Maintaining or migrating an existing Vagrant-based development environment while evaluating community-maintained successors.
- **Compare when:** Vagrant itself has an announced end of life at the end of 2026; vendor maintenance is ending and community continuation is uncertain.
- **Strengths:** Declarative machine definitions can help reproduce existing Vagrant environments; current MIT source allows community continuation.
- **Limitations:** Vagrant itself has an announced end of life at the end of 2026; vendor maintenance is ending and community continuation is uncertain.; The HCP Vagrant Box Registry is also being deprecated; existing boxes and metadata may need export.; Provider software, boxes and plugins have separate licenses and requirements.
- **Maintenance:** unverified — HashiCorp announced on 2026-11-12 that Vagrant will reach end of life at the end of 2026 and that its repository will be archived within the following months, with no further vendor maintenance. Community continuation is possible under MIT but not established by this review. ([evidence](https://discuss.hashicorp.com/t/vagrant-is-moving-to-an-open-source-model/78189))
- [Official project](https://developer.hashicorp.com/vagrant) · [Official installation / downloads](https://developer.hashicorp.com/vagrant/downloads) · [Repository](https://github.com/hashicorp/vagrant)
- **Sources:** [Official project documentation](https://developer.hashicorp.com/vagrant) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/hashicorp/vagrant) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://developer.hashicorp.com/vagrant/downloads) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/hashicorp/vagrant/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/hashicorp/vagrant/releases.atom) (2026-11-14; maintenance); [HashiCorp Vagrant end-of-life and MIT transition announcement](https://discuss.hashicorp.com/t/vagrant-is-moving-to-an-open-source-model/78189) (2026-11-14; maintenance, license); [Official public application distribution](https://github.com/hashicorp/vagrant/releases/expanded_assets/2.4.10.dev%2B000834-2757db88) (2026-11-14; pricing)

## Monitor brightness controls

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fdisplay-controls)

### MonitorControl

Mac menu-bar utility for supported external display brightness and volume control.

- **Platforms:** macOS. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for controlling compatible external displays from macOS keys and menu bar.
- **Compare when:** Display protocol and connection support vary
- **Strengths:** Useful for controlling compatible external displays from macOS keys and menu bar.
- **Limitations:** Display protocol and connection support vary; Some adapters and monitors limit available controls.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-15. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/MonitorControl/MonitorControl/releases.atom))
- [Official project](https://github.com/MonitorControl/MonitorControl) · [Official installation / downloads](https://github.com/MonitorControl/MonitorControl/releases) · [Repository](https://github.com/MonitorControl/MonitorControl)
- **Sources:** [Official project documentation](https://github.com/MonitorControl/MonitorControl) (2026-11-14; features, identity, platforms, pricing); [Official download or installation landing page](https://github.com/MonitorControl/MonitorControl/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/MonitorControl/MonitorControl/HEAD/License.txt) (2026-11-14; license); [Official release activity](https://github.com/MonitorControl/MonitorControl/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/MonitorControl/MonitorControl/releases/expanded_assets/v4.4.0) (2026-11-14; pricing)
### Monitorian

Windows tray application for adjusting supported monitor brightness.

- **Platforms:** Windows. **License:** MIT. **Pricing model:** freemium.
- **Pick for:** Useful when external displays support software brightness controls.
- **Compare when:** Requires monitor and connection support for DDC/CI
- **Strengths:** Useful when external displays support software brightness controls.
- **Limitations:** Requires monitor and connection support for DDC/CI; Some docks or adapters prevent control.; The Microsoft Store version offers subscription add-ons; confirm which brightness-control features are included in the base application.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-08. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/emoacht/Monitorian/releases.atom))
- [Official project](https://github.com/emoacht/Monitorian) · [Official installation / downloads](https://github.com/emoacht/Monitorian/releases) · [Repository](https://github.com/emoacht/Monitorian)
- **Sources:** [Official project documentation](https://github.com/emoacht/Monitorian) (2026-11-14; features, identity, platforms, pricing); [Official download or installation landing page](https://github.com/emoacht/Monitorian/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/emoacht/Monitorian/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/emoacht/Monitorian/releases.atom) (2026-11-14; maintenance)
### Twinkle Tray

Tray brightness controls

- **Platforms:** Windows. **License:** MIT application.. **Pricing model:** free.
- **Compatibility details:** Windows 10/11. Brightness control depends on monitor support for DDC/CI or WMI and the connection path.
- **Pick for:** Choose Twinkle Tray to adjust compatible monitor brightness from the Windows tray, hotkeys or a schedule.
- **Compare when:** Compare Monitorian for another multi-display workflow, or a monitor’s hardware controls when software access is unsupported.
- **Strengths:** Tray brightness controls
- **Limitations:** DDC/CI may need enabling on the monitor; some docks, adapters and connection types do not pass the required commands.; Monitor firmware behavior varies, and graphics-driver color controls can interfere; verify the exact monitor and connection combination.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://twinkletray.com/) · [Official installation / downloads](https://twinkletray.com/) · [Repository](https://github.com/xanderfrangos/twinkle-tray)
- **Sources:** [Official MIT license and hardware-compatibility caveats](https://github.com/xanderfrangos/twinkle-tray) (2026-11-15; features, identity, license, platforms); [Official brightness features, Windows support, no-charge use and downloads](https://twinkletray.com/) (2026-11-15; downloads, features, identity, platforms, pricing)

## Firmware updates and flashing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Ffirmware-updates)

### flashrom

Command-line utility for identifying, reading, writing, verifying and erasing supported flash chips through supported programmers.

- **Platforms:** Linux, macOS, FreeBSD, Windows. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Windows support is partial and does not provide internal BIOS programming.
- **Pick for:** Work with a documented flash-chip/programmer combination when vendor firmware utilities do not cover the lab workflow.
- **Compare when:** The project warns against unsupported laptop use because embedded-controller interactions can damage operation.
- **Strengths:** Work with a documented flash-chip/programmer combination when vendor firmware utilities do not cover the lab workflow.
- **Limitations:** The project warns against unsupported laptop use because embedded-controller interactions can damage operation.; Windows support is partial and excludes internal programmers; firmware writing requires exact hardware and image compatibility.
- **Maintenance:** active — Official release feed contains v1.8.0 with an updated timestamp of 2026-08-27. This is release-channel activity evidence, not proof of a stable build, installed compatibility or security testing. ([evidence](https://github.com/flashrom/flashrom/releases.atom))
- [Official project](https://www.flashrom.org/) · [Official installation / downloads](https://www.flashrom.org/) · [Repository](https://github.com/flashrom/flashrom)
- **Sources:** [Official documentation and distribution evidence](https://www.flashrom.org/) (2026-11-15; identity, features, platforms, downloads); [Official documentation and distribution evidence](https://github.com/flashrom/flashrom) (2026-11-15; license, features); [Official release or lifecycle evidence](https://github.com/flashrom/flashrom/releases.atom) (2026-11-15; maintenance)
### fwupd

Firmware update service connecting supported Linux hardware to vendor-provided update metadata.

- **Platforms:** Linux. **License:** LGPL-2.1. **Pricing model:** unknown.
- **Compatibility details:** This entry covers the documented Linux end-user workflow; device support is separate from OS support.
- **Pick for:** Choose for updating supported device firmware through the Linux distribution's maintained integration.
- **Compare when:** Only supported devices with suitable vendor metadata can be updated.
- **Strengths:** Choose for updating supported device firmware through the Linux distribution's maintained integration.
- **Limitations:** Only supported devices with suitable vendor metadata can be updated.; Firmware updates depend on device-specific requirements; the project recommends distribution packages for ordinary users.
- **Maintenance:** active — Official release-feed entry '2.1.9' updated 2026-10-23. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/fwupd/fwupd/releases.atom))
- [Official project](https://fwupd.org/) · [Official installation / downloads](https://github.com/fwupd/fwupd) · [Repository](https://github.com/fwupd/fwupd)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/fwupd/fwupd/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/fwupd/fwupd/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/fwupd/fwupd) (2026-11-14; downloads); [Official project identity and product page](https://fwupd.org/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/fwupd/fwupd/releases.atom) (2026-11-14; maintenance)

## GPU power and performance controls

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fgpu-controls)

### CoreCtrl

GNU/Linux hardware-control application using profiles for supported GPU and CPU settings.

- **Platforms:** Linux. **License:** GPL-3.0-or-later. **Pricing model:** free.
- **Pick for:** Apply per-application hardware profiles on a supported Linux system.
- **Compare when:** The project is in maintenance mode and explicitly plans no new features or hardware support.
- **Strengths:** Apply per-application hardware profiles on a supported Linux system.
- **Limitations:** The project is in maintenance mode and explicitly plans no new features or hardware support.; AMD support has model/driver limitations, and newer hardware is not guaranteed; compare LACT for current-device needs.
- **Maintenance:** active — The project remains available for fixes, but its current README explicitly limits development to maintenance and rules out new features or hardware support. ([evidence](https://gitlab.com/corectrl/corectrl/))
- [Official project](https://gitlab.com/corectrl/corectrl) · [Official installation / downloads](https://gitlab.com/corectrl/corectrl#installation) · [Repository](https://gitlab.com/corectrl/corectrl)
- **Sources:** [Official documentation and distribution evidence](https://gitlab.com/corectrl/corectrl/) (2026-11-15; identity, features, platforms, license, pricing, maintenance); [Official release or lifecycle evidence](https://gitlab.com/corectrl/corectrl/) (2026-11-15; maintenance); [Current README installation instructions and maintenance policy](https://gitlab.com/corectrl/corectrl/-/raw/master/README.md) (2026-11-16; downloads, features, maintenance, platforms)
### LACT

Linux GPU configuration and monitoring application for supported hardware.

- **Platforms:** Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for supported Linux GPU management through a desktop interface.
- **Compare when:** Available controls depend on vendor and driver
- **Strengths:** Useful for supported Linux GPU management through a desktop interface.
- **Limitations:** Available controls depend on vendor and driver; Clock and power changes require separate stability and thermal checks.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-09. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ilya-zlobintsev/LACT/releases.atom))
- [Official project](https://github.com/ilya-zlobintsev/LACT) · [Official installation / downloads](https://github.com/ilya-zlobintsev/LACT/releases) · [Repository](https://github.com/ilya-zlobintsev/LACT)
- **Sources:** [Official project documentation](https://github.com/ilya-zlobintsev/LACT) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/ilya-zlobintsev/LACT/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ilya-zlobintsev/LACT/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/ilya-zlobintsev/LACT/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/ilya-zlobintsev/LACT/releases/expanded_assets/test-build) (2026-11-14; pricing)
### MSI Afterburner

Windows graphics-card tuning and monitoring utility with configurable fan curves and supported-card controls.

- **Platforms:** Windows. **License:** Vendor-distributed freeware; exact redistribution terms were not established in reviewed documentation. **Pricing model:** free.
- **Pricing details:** Afterburner is free. Promotional third-party trials elsewhere on the vendor page are separate products.
- **Pick for:** Monitor and tune a supported Windows graphics card through an established desktop interface.
- **Compare when:** Available controls vary by GPU, driver and board firmware.
- **Strengths:** Monitor and tune a supported Windows graphics card through an established desktop interface.
- **Limitations:** Available controls vary by GPU, driver and board firmware.; Tuning outcomes depend on the individual card; vendor claims are not a stability or performance benchmark for the user’s hardware.
- **Maintenance:** unverified — Product documentation reviewed; a current dated release or lifecycle commitment has not been established for this record.
- [Official project](https://www.msi.com/Landing/afterburner/graphics-cards) · [Official installation / downloads](https://www.msi.com/Landing/afterburner/graphics-cards)
- **Sources:** [Official documentation and distribution evidence](https://www.msi.com/Landing/afterburner/graphics-cards) (2026-11-15; identity, features, platforms, license, pricing, downloads)

## Hardware identification

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fhardware-identification)

### CPU-X

Linux hardware-information application for processor, motherboard and system details.

- **Platforms:** Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for a Linux graphical counterpart to hardware-identification utilities.
- **Compare when:** The lead developer states that they are no longer maintaining CPU-X; review current activity before relying on new hardware support.
- **Strengths:** Useful for a Linux graphical counterpart to hardware-identification utilities.
- **Limitations:** The lead developer states that they are no longer maintaining CPU-X; review current activity before relying on new hardware support.; Hardware details depend on permissions and the operating system.
- **Maintenance:** unverified — The project README states that its lead developer is no longer maintaining CPU-X; continuing community maintenance has not been established. ([evidence](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X))
- [Official project](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X) · [Official installation / downloads](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X/releases) · [Repository](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X)
- **Sources:** [Official project documentation](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X) (2026-11-14; identity, features, platforms, maintenance); [Official download or installation landing page](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/TheTumultuousUnicornOfDarkness/CPU-X/HEAD/COPYING) (2026-11-14; license); [Official public application distribution](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X/releases/expanded_assets/v5.4.1) (2026-11-14; pricing)
### CPU-Z

Windows utility for identifying processor, motherboard and memory configuration.

- **Platforms:** Windows. **License:** Proprietary freeware. **Pricing model:** free.
- **Pick for:** Useful for checking core hardware specifications before troubleshooting or upgrades.
- **Compare when:** Identification accuracy depends on supported hardware
- **Strengths:** Useful for checking core hardware specifications before troubleshooting or upgrades.
- **Limitations:** Identification accuracy depends on supported hardware; A hardware inventory is not a stability test.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.cpuid.com/softwares/cpu-z.html) · [Official installation / downloads](https://www.cpuid.com/softwares/cpu-z.html)
- **Sources:** [Official project documentation](https://www.cpuid.com/softwares/cpu-z.html) (2026-11-14; identity, features, platforms, license, pricing, downloads)
### GPU-Z

Windows graphics-card information tool with GPU sensors and bus details.

- **Platforms:** Windows. **License:** Proprietary freeware for personal and commercial use; commercial redistribution requires separate permission. **Pricing model:** free.
- **Pick for:** Useful for inspecting a graphics adapter and its live sensor data.
- **Compare when:** Hardware support varies by GPU generation
- **Strengths:** Useful for inspecting a graphics adapter and its live sensor data.
- **Limitations:** Hardware support varies by GPU generation; Sensor observation is not proof of overall system stability.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.techpowerup.com/gpuz/) · [Official installation / downloads](https://www.techpowerup.com/download/techpowerup-gpu-z/)
- **Sources:** [Official project documentation](https://www.techpowerup.com/gpuz/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://www.techpowerup.com/download/techpowerup-gpu-z/) (2026-11-14; downloads)
### Hardinfo2

Linux system information and benchmarking application with generated hardware reports.

- **Platforms:** Linux. **License:** GPL-2.0-or-later main license; bundled components include GPL-3.0 and LGPL-2.1 terms. **Pricing model:** unknown.
- **Pick for:** Useful for collecting a structured Linux workstation hardware overview.
- **Compare when:** Synthetic results are workload-specific
- **Strengths:** Useful for collecting a structured Linux workstation hardware overview.
- **Limitations:** Synthetic results are workload-specific; Hardware detection depends on kernel and platform support.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-03. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/hardinfo2/hardinfo2/releases.atom))
- [Official project](https://hardinfo2.org/) · [Official installation / downloads](https://hardinfo2.org/) · [Repository](https://github.com/hardinfo2/hardinfo2)
- **Sources:** [Official project documentation](https://hardinfo2.org/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/hardinfo2/hardinfo2) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/hardinfo2/hardinfo2/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/hardinfo2/hardinfo2/releases.atom) (2026-11-14; maintenance)

## Hardware inventory

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fhardware-inventory)

### hw-probe

Hardware snapshot utility that connects device information and logs with a community hardware database.

- **Platforms:** Linux, FreeBSD. **License:** LGPL-2.1-or-later OR BSD-4-Clause. **Pricing model:** unknown.
- **Compatibility details:** README covers Linux and BSD workflows; report collection may require optional system tools.
- **Pick for:** Useful for reporting Linux or BSD hardware compatibility with structured diagnostic context.
- **Compare when:** Uploading a probe publishes system information and logs; review the report before sharing.
- **Strengths:** Useful for reporting Linux or BSD hardware compatibility with structured diagnostic context.
- **Limitations:** Uploading a probe publishes system information and logs; review the report before sharing.; An automated operability label is not an exhaustive physical hardware test.
- **Maintenance:** unverified — Official release-feed entry '1.6.6' updated 2025-01-11. Feed activity can include prereleases; it does not establish installed stability. The reviewed feed does not establish recent maintenance. ([evidence](https://github.com/linuxhw/hw-probe/releases.atom))
- [Official project](https://github.com/linuxhw/hw-probe) · [Official installation / downloads](https://github.com/linuxhw/hw-probe) · [Repository](https://github.com/linuxhw/hw-probe)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/linuxhw/hw-probe/HEAD/README.md) (2026-11-14; features, identity, license); [Official supported-platform and installation documentation](https://raw.githubusercontent.com/linuxhw/hw-probe/HEAD/INSTALL.md) (2026-11-14; platforms); [Official download or installation landing page](https://github.com/linuxhw/hw-probe) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/linuxhw/hw-probe/releases.atom) (2026-11-14; maintenance)
### inxi

Command-line system-information script for readable hardware and operating-system reports.

- **Platforms:** Linux, FreeBSD. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Linux is the principal target; BSD support is best effort according to the project description.
- **Pick for:** Fits creating a concise system description for troubleshooting or support discussions.
- **Compare when:** Available detail depends on permissions and helper tools.
- **Strengths:** Fits creating a concise system description for troubleshooting or support discussions.
- **Limitations:** Available detail depends on permissions and helper tools.; The GitHub repository is an archived mirror; the project directs current development and downloads to Codeberg.
- **Maintenance:** unverified — The old GitHub mirror is archived and directs development to Codeberg; current license and installation documents were reviewed, but dated release activity at the current upstream was not independently established. ([evidence](https://smxi.org/docs/inxi-installation.htm))
- [Official project](https://smxi.org/docs/inxi.htm) · [Official installation / downloads](https://smxi.org/docs/inxi-installation.htm) · [Repository](https://codeberg.org/smxi/inxi)
- **Sources:** [Official project feature documentation](https://smxi.org/docs/inxi.htm) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://raw.githubusercontent.com/smxi/inxi/HEAD/README.txt) (2026-11-14; platforms); [Official application license text](https://codeberg.org/smxi/inxi/raw/branch/master/LICENSE.txt) (2026-11-14; license); [Official download or installation landing page](https://smxi.org/docs/inxi-installation.htm) (2026-11-14; downloads, maintenance)

## Hardware sensor monitoring

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fhardware-monitoring)

### HWiNFO

Windows hardware identification, sensor monitoring and reporting utility.

- **Platforms:** Windows. **License:** Proprietary; personal free and commercial Pro terms. **Pricing model:** freemium.
- **Pick for:** Useful for detailed Windows hardware and sensor inspection.
- **Compare when:** Sensor coverage depends on hardware and firmware
- **Strengths:** Useful for detailed Windows hardware and sensor inspection.
- **Limitations:** Sensor coverage depends on hardware and firmware; Commercial-use and advanced feature limits differ by edition.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.hwinfo.com/) · [Official installation / downloads](https://www.hwinfo.com/download/)
- **Sources:** [Official project documentation](https://www.hwinfo.com/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://www.hwinfo.com/download/) (2026-11-14; downloads); [Official HWiNFO license comparison](https://www.hwinfo.com/licenses/) (2026-11-14; license, pricing)
### Libre Hardware Monitor

Temperature, fan, clock and voltage sensors

- **Platforms:** Windows. **License:** MPL-2.0; third-party notices. **Pricing model:** unknown.
- **Compatibility details:** Windows Forms GUI available; Avalonia UI marked in development
- **Pick for:** Temperature, fan, clock and voltage sensors
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Temperature, fan, clock and voltage sensors
- **Limitations:** Hardware/driver support varies; distinguish observation from unsafe tuning; avoid unrecommended UI as default; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) · [Repository](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor)
- **Sources:** [Preserved original research source](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) (2026-11-14; identity, features)

## Infrastructure monitoring

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Finfrastructure-monitoring)

### Netdata

System and service monitoring platform with local metric collection, dashboards and alerts.

- **Platforms:** Windows, macOS, Linux, FreeBSD, Web. **License:** GPL-3.0-or-later agent; proprietary NCUL1 UI and separate Cloud terms. **Pricing model:** freemium.
- **Compatibility details:** Official capability matrix includes Linux, FreeBSD, macOS and Windows; feature coverage is not identical.
- **Pick for:** Fits diagnosing a home server or small fleet when a correlated metrics dashboard is needed.
- **Compare when:** The agent, UI and hosted Cloud have different licenses and pricing terms.
- **Strengths:** Fits diagnosing a home server or small fleet when a correlated metrics dashboard is needed.
- **Limitations:** The agent, UI and hosted Cloud have different licenses and pricing terms.; Collector and operating-system coverage vary; vendor performance claims were not benchmarked here.
- **Maintenance:** active — Official release-feed entry 'v2.12.3' updated 2026-11-10. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/netdata/netdata/releases.atom))
- [Official project](https://github.com/netdata/netdata) · [Official installation / downloads](https://github.com/netdata/netdata) · [Repository](https://github.com/netdata/netdata)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/netdata/netdata/HEAD/README.md) (2026-11-14; features, identity, license, platforms, pricing); [Official application license text](https://raw.githubusercontent.com/netdata/netdata/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/netdata/netdata) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/netdata/netdata/releases.atom) (2026-11-14; maintenance)

## Log analysis

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Flog-analysis)

### lnav

Terminal log viewer that merges supported logs by time and exposes structured querying.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** BSD-2-Clause. **Pricing model:** unknown.
- **Compatibility details:** Current README lists Linux, macOS and Windows release binaries plus FreeBSD installation.
- **Pick for:** Choose for investigating several local log files without deploying a central logging service.
- **Compare when:** Automatic parsing depends on supported or configured log formats.
- **Strengths:** Choose for investigating several local log files without deploying a central logging service.
- **Limitations:** Automatic parsing depends on supported or configured log formats.; Large inputs still need sufficient local storage and memory; collection from remote hosts is a separate concern.
- **Maintenance:** active — Official release-feed entry 'v0.15.0-beta1' updated 2026-09-28. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/tstack/lnav/releases.atom))
- [Official project](https://github.com/tstack/lnav) · [Official installation / downloads](https://github.com/tstack/lnav) · [Repository](https://github.com/tstack/lnav)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/tstack/lnav/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/tstack/lnav/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/tstack/lnav) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/tstack/lnav/releases.atom) (2026-11-14; maintenance)

## Memory diagnostics

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fmemory-diagnostics)

### MemTest86

PassMark standalone UEFI memory-testing software distributed as bootable media.

- **Platforms:** Bootable. **License:** Vendor application license; exact EULA not independently established in this review. **Pricing model:** freemium.
- **Compatibility details:** Standalone UEFI boot media for compatible hardware; not a Linux desktop application.
- **Pick for:** Useful for boot-time RAM diagnosis on compatible UEFI hardware.
- **Compare when:** Bootable environment rather than a desktop Linux application
- **Strengths:** Useful for boot-time RAM diagnosis on compatible UEFI hardware.
- **Limitations:** Bootable environment rather than a desktop Linux application; Advanced tests and reports depend on edition.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.memtest86.com/) · [Official installation / downloads](https://www.memtest86.com/download.htm)
- **Sources:** [Official project documentation](https://www.memtest86.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.memtest86.com/download.htm) (2026-11-14; downloads)
### Memtest86+

Standalone bootable memory tester supporting documented PC architectures outside the installed operating system.

- **Platforms:** Bootable. **License:** GPL-2.0. **Pricing model:** free.
- **Compatibility details:** Boot media support includes x86/x86-64, AArch64 and LoongArch64; firmware and build requirements vary by architecture.
- **Pick for:** Useful for testing supported PC memory outside the installed operating system.
- **Compare when:** Runs from boot media rather than as a Linux desktop app
- **Strengths:** Useful for testing supported PC memory outside the installed operating system.
- **Limitations:** Runs from boot media rather than as a Linux desktop app; A clean run cannot exclude every intermittent hardware issue.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-15. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/memtest86plus/memtest86plus/releases.atom))
- [Official project](https://memtest.org/) · [Official installation / downloads](https://memtest.org/) · [Repository](https://github.com/memtest86plus/memtest86plus)
- **Sources:** [Official project documentation](https://memtest.org/) (2026-11-14; downloads, features, identity, platforms, pricing); [Official source repository and README](https://github.com/memtest86plus/memtest86plus) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/memtest86plus/memtest86plus/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/memtest86plus/memtest86plus/releases.atom) (2026-11-14; maintenance)

## Application package management

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fpackage-managers)

### Scoop

User-oriented package installation and buckets

- **Platforms:** Windows. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Windows command-line installer
- **Pick for:** User-oriented package installation and buckets
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** User-oriented package installation and buckets
- **Limitations:** Package manifests and payload licenses/trust differ; do not blindly execute installation scripts; Potential source reference under listed license; retain notices and audit dependencies, exceptions, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/ScoopInstaller/Scoop) · [Repository](https://github.com/ScoopInstaller/Scoop)
- **Sources:** [Preserved original research source](https://github.com/ScoopInstaller/Scoop) (2026-11-14; identity, features); [Preserved original research source](https://github.com/ScoopInstaller/Scoop/blob/master/LICENSE) (2026-11-14; identity, features)
### UniGetUI

Unified GUI across package managers

- **Platforms:** Windows. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Windows; see linked upstream requirements for exact supported build/architecture
- **Pick for:** Unified GUI across package managers
- **Compare when:** Read-only inventory adapters; duplicate package identity and failed-update recovery
- **Strengths:** Unified GUI across package managers
- **Limitations:** Package trust and install/update side effects remain manager/package-specific; MIT adapter/UI patterns candidate; optional adapters must fail independently
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/Devolutions/UniGetUI) · [Repository](https://github.com/Devolutions/UniGetUI)
- **Sources:** [Preserved original research source](https://github.com/Devolutions/UniGetUI) (2026-11-14; identity, features)
### WinGet

Package discovery, installation and upgrades

- **Platforms:** Windows. **License:** MIT client; each package has its own terms. **Pricing model:** unknown.
- **Compatibility details:** Windows Package Manager
- **Pick for:** Package discovery, installation and upgrades
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Package discovery, installation and upgrades
- **Limitations:** Source agreements and package licenses are separate; inspect upgrade plans; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/microsoft/winget-cli) · [Repository](https://github.com/microsoft/winget-cli)
- **Sources:** [Preserved original research source](https://github.com/microsoft/winget-cli) (2026-11-14; identity, features)

## Historical performance monitoring

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fperformance-history)

### atop

Linux process and system monitor with recorded activity for later investigation.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux monitor; optional collectors determine extra metric availability.
- **Pick for:** Choose when live monitoring and replaying recorded Linux activity are both useful.
- **Compare when:** Historical visibility depends on the collection configuration.
- **Strengths:** Choose when live monitoring and replaying recorded Linux activity are both useful.
- **Limitations:** Historical visibility depends on the collection configuration.; Some network and GPU details need optional components and extra privileges.
- **Maintenance:** active — Official release-feed entry 'v2.13.0' updated 2026-07-19. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/Atoptool/atop/releases.atom))
- [Official project](https://github.com/Atoptool/atop) · [Official installation / downloads](https://github.com/Atoptool/atop) · [Repository](https://github.com/Atoptool/atop)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/Atoptool/atop/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/Atoptool/atop/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/Atoptool/atop) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/Atoptool/atop/releases.atom) (2026-11-14; maintenance)
### sysstat

Linux performance-tool suite including sar, iostat, mpstat and pidstat.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux-only tool suite; includes several related commands rather than separately counted applications.
- **Pick for:** Fits investigating resource usage that happened before an interactive monitor was opened.
- **Compare when:** Historical analysis requires collection to have been enabled beforehand.
- **Strengths:** Fits investigating resource usage that happened before an interactive monitor was opened.
- **Limitations:** Historical analysis requires collection to have been enabled beforehand.; Sampling frequency and available kernel counters limit what can be inferred.
- **Maintenance:** active — Official release-feed entry 'v12.8.0' updated 2026-08-28. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/sysstat/sysstat/releases.atom))
- [Official project](https://github.com/sysstat/sysstat) · [Official installation / downloads](https://github.com/sysstat/sysstat) · [Repository](https://github.com/sysstat/sysstat)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/sysstat/sysstat/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/sysstat/sysstat/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/sysstat/sysstat) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/sysstat/sysstat/releases.atom) (2026-11-14; maintenance)

## Power management

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fpower-management)

### PowerTOP

Linux power diagnostic utility with interactive inspection of power-management settings.

- **Platforms:** Linux. **License:** GPL-2.0-only. **Pricing model:** unknown.
- **Compatibility details:** Linux-only diagnostic and tuning tool.
- **Pick for:** Useful for investigating battery drain and identifying Linux components that prevent low-power operation.
- **Compare when:** Power estimates and available counters depend on hardware and calibration.
- **Strengths:** Useful for investigating battery drain and identifying Linux components that prevent low-power operation.
- **Limitations:** Power estimates and available counters depend on hardware and calibration.; Changing tunables can affect device behavior; measured battery improvement must be established on the actual laptop.
- **Maintenance:** active — Official release-feed entry '2.16.1 maintenance release' updated 2026-10-07. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/fenrus75/powertop/releases.atom))
- [Official project](https://github.com/fenrus75/powertop) · [Official installation / downloads](https://github.com/fenrus75/powertop) · [Repository](https://github.com/fenrus75/powertop)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/fenrus75/powertop/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/fenrus75/powertop/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/fenrus75/powertop) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/fenrus75/powertop/releases.atom) (2026-11-14; maintenance)
### TLP

Linux laptop power-management service with configurable AC and battery profiles.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux laptop utility; support for each charge-control feature depends on laptop firmware and drivers.
- **Pick for:** Fits managing repeatable laptop power settings without manually setting every kernel parameter.
- **Compare when:** Battery controls and possible savings depend on the specific hardware.
- **Strengths:** Fits managing repeatable laptop power settings without manually setting every kernel parameter.
- **Limitations:** Battery controls and possible savings depend on the specific hardware.; Competing power-management services and custom settings need coordination.
- **Maintenance:** active — Official release-feed entry '1.11.0' updated 2026-11-12. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/linrunner/TLP/releases.atom))
- [Official project](https://linrunner.de/tlp/) · [Official installation / downloads](https://github.com/linrunner/TLP) · [Repository](https://github.com/linrunner/TLP)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/linrunner/TLP/HEAD/README.rst) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/linrunner/TLP/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/linrunner/TLP) (2026-11-14; downloads); [Official project identity and product page](https://linrunner.de/tlp/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/linrunner/TLP/releases.atom) (2026-11-14; maintenance)

## Process inspection and management

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fprocess-management)

### ListDLLs

Command-line loaded-DLL viewer.

- **Platforms:** Windows. **License:** Microsoft Sysinternals Software License Terms (proprietary).. **Pricing model:** free.
- **Compatibility details:** Command-line Windows utility; official requirements list Vista or newer, Server 2008 or newer, and Nano Server 2016 or newer.
- **Pick for:** Choose ListDLLs for command-line reports of loaded DLLs, versions and signatures in Windows processes.
- **Compare when:** Compare Process Explorer for an interactive process tree and handle search, or Sigcheck for files that are not currently loaded.
- **Strengths:** Command-line loaded-DLL viewer.
- **Limitations:** It inventories loaded modules rather than recording a complete history of process or filesystem events.; A reported module or unsigned file requires interpretation; its presence does not by itself demonstrate a fault or malicious behavior.
- **Maintenance:** active — Official product page lists a release published 2026-10-15. Release date reviewed; application not executed. ([evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/listdlls))
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/listdlls) · [Official installation / downloads](https://learn.microsoft.com/en-us/sysinternals/downloads/listdlls)
- **Sources:** [Official release or lifecycle evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/listdlls) (2026-11-15; downloads, features, identity, maintenance, platforms); [Microsoft Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms) (2026-11-15; license); [Microsoft application archive publicly available without payment](https://download.sysinternals.com/files/ListDlls.zip) (2026-11-15; downloads, pricing)
### Process Explorer

Handle and DLL ownership investigation; process tree

- **Platforms:** Windows. **License:** Microsoft Sysinternals Software License Terms (proprietary).. **Pricing model:** free.
- **Compatibility details:** Current official build: Windows 11 or newer, or Windows Server 2019 or newer.
- **Pick for:** Choose Process Explorer to identify the process holding a file handle or loaded DLL and inspect its process tree.
- **Compare when:** Compare Process Monitor for time-ordered file and registry events, or System Informer for broader resource, service and network views.
- **Strengths:** Handle and DLL ownership investigation; process tree
- **Limitations:** It focuses on current processes and handles; reproducing a sequence of file or registry operations is better served by a dedicated event capture.; Saved diagnostic information can contain sensitive paths or process state; process and handle changes can disrupt the application being investigated.
- **Maintenance:** active — Official product page lists a release published 2026-11-05. Release date reviewed; application not executed. ([evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer))
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer) · [Official installation / downloads](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer)
- **Sources:** [Official release or lifecycle evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer) (2026-11-15; downloads, features, identity, maintenance, platforms); [Microsoft Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms) (2026-11-15; license); [Microsoft application archive publicly available without payment](https://download.sysinternals.com/files/ProcessExplorer.zip) (2026-11-15; downloads, pricing)
### Process Lasso

Persistent process rules, CPU affinity/sets and ProBalance

- **Platforms:** Windows. **License:** Proprietary Bitsum EULA; Free and Pro editions with use-specific licensing.. **Pricing model:** freemium.
- **Compatibility details:** The current download page targets Windows 10/11 and Windows Server, with x86-64, x86-32 and ARM64 installers. Consult the selected release for older Windows support.
- **Pick for:** Choose Process Lasso when you need persistent per-process priorities, CPU affinities or power-plan policies.
- **Compare when:** Compare System Informer for diagnosis before applying rules; measure your actual workload when deciding whether a policy helps.
- **Strengths:** Persistent process rules, CPU affinity/sets and ProBalance
- **Limitations:** Priority and affinity policies can change responsiveness and throughput in different ways; benefits depend on the workload and configuration.; Advanced features require Pro after the trial. Deployment documentation requires commercial users to purchase within 30 days; confirm the applicable license when deploying.
- **Maintenance:** active — Official download page lists stable 19.0.0.94 released 2026-11-02 and separate beta builds; no performance benchmark was run. ([evidence](https://bitsum.com/download-process-lasso/))
- [Official project](https://bitsum.com/) · [Official installation / downloads](https://bitsum.com/download-process-lasso/)
- **Sources:** [Preserved original research source](https://bitsum.com/apps/process-lasso/docs/) (2026-11-14; identity, features); [Preserved original research source](https://bitsum.com/process-lasso-free-vs-pro/) (2026-11-14; identity, features); [Preserved original research source](https://dl.bitsum.com/terms-of-use/) (2026-11-14; identity, features); [Official process-policy capabilities and Free/Pro overview](https://bitsum.com/) (2026-11-15; features, identity, pricing); [Official release or lifecycle evidence](https://bitsum.com/download-process-lasso/) (2026-11-15; downloads, maintenance, platforms, pricing); [Official Bitsum EULA](https://bitsum.com/terms-of-use/) (2026-11-15; license); [Official deployment licensing and commercial-use policy](https://bitsum.com/apps/process-lasso/docs/deployment/licensing/) (2026-11-15; license, pricing)
### System Informer

Detailed resources, process inspection and debugging

- **Platforms:** Windows. **License:** MIT application; individual dependencies retain their own notices.. **Pricing model:** free.
- **Compatibility details:** The current download page and repository list Windows 10/11, 32-bit or 64-bit. Canary builds are offered separately from the main downloads.
- **Pick for:** Choose System Informer for detailed Windows process, resource, service and network inspection with an open-source interface.
- **Compare when:** Compare Process Explorer for a focused handle/DLL investigation, Process Monitor for event traces, or Process Lasso for persistent process policies.
- **Strengths:** Detailed resources, process inspection and debugging
- **Limitations:** Closing handles or changing processes and services can cause data loss or disrupt applications; use the inspection views before taking control actions.; Some disk/network plugin information requires administrative rights. Match plugins to the build and distinguish main downloads from Canary builds.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://systeminformer.com/) · [Official installation / downloads](https://systeminformer.com/downloads) · [Repository](https://github.com/winsiderss/systeminformer)
- **Sources:** [Official project and current requirements](https://github.com/winsiderss/systeminformer) (2026-11-15; features, identity, platforms); [Official capabilities, no-charge distribution and handle-closure warning](https://systeminformer.com/) (2026-11-15; features, identity, pricing); [Official download channels and current Windows support](https://systeminformer.com/downloads) (2026-11-15; downloads, platforms); [Official MIT license](https://raw.githubusercontent.com/winsiderss/systeminformer/master/LICENSE.txt) (2026-11-15; license); [Official plugin and administrative-rights limitations](https://systeminformer.com/readme) (2026-11-15; features)

## System and GPU resource monitoring

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fresource-monitoring)

### bottom

Cross-platform terminal process and system-resource monitor written in Rust.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for a consistent terminal monitoring interface across desktop platforms.
- **Compare when:** Sensor and process details vary by OS
- **Strengths:** Useful for a consistent terminal monitoring interface across desktop platforms.
- **Limitations:** Sensor and process details vary by OS; No background historical database is implied.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ClementTsang/bottom/releases.atom))
- [Official project](https://clementtsang.github.io/bottom/) · [Official installation / downloads](https://github.com/ClementTsang/bottom#installation) · [Repository](https://github.com/ClementTsang/bottom)
- **Sources:** [Official project documentation](https://clementtsang.github.io/bottom/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/ClementTsang/bottom) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/ClementTsang/bottom#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ClementTsang/bottom/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/ClementTsang/bottom/releases.atom) (2026-11-14; maintenance); [Official stable release distribution; supersedes expired nightly evidence (see research/software-source-refresh-2026-11-20.md)](https://github.com/ClementTsang/bottom/releases/tag/0.15.0) (2026-11-20; pricing)
### btop

Terminal resource monitor displaying CPU, memory, disk, network and process information.

- **Platforms:** Linux, macOS. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for monitoring a Unix-like desktop or server from one terminal view.
- **Compare when:** GPU and platform features depend on build and hardware
- **Strengths:** Useful for monitoring a Unix-like desktop or server from one terminal view.
- **Limitations:** GPU and platform features depend on build and hardware; Native Windows uses a separate related project.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-25. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/aristocratos/btop/releases.atom))
- [Official project](https://github.com/aristocratos/btop) · [Official installation / downloads](https://github.com/aristocratos/btop/releases) · [Repository](https://github.com/aristocratos/btop)
- **Sources:** [Official project documentation](https://github.com/aristocratos/btop) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/aristocratos/btop/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/aristocratos/btop/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/aristocratos/btop/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/aristocratos/btop/releases/expanded_assets/v1.4.8) (2026-11-14; pricing)
### Glances

System monitoring application with terminal, web and export-oriented views.

- **Platforms:** Windows, macOS, Linux. **License:** LGPL-3.0. **Pricing model:** unknown.
- **Pick for:** Useful when one monitoring tool needs both local views and optional integrations.
- **Compare when:** The default development branch is Glances 5 beta; the project recommends stable version 4 for production and notes API incompatibilities.
- **Strengths:** Useful when one monitoring tool needs both local views and optional integrations.
- **Limitations:** The default development branch is Glances 5 beta; the project recommends stable version 4 for production and notes API incompatibilities.; Some plugins depend on external packages or privileges; Platform-specific metrics differ.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-07. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/nicolargo/glances/releases.atom))
- [Official project](https://nicolargo.github.io/glances/) · [Official installation / downloads](https://glances.readthedocs.io/en/latest/install.html) · [Repository](https://github.com/nicolargo/glances)
- **Sources:** [Official project documentation](https://nicolargo.github.io/glances/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/nicolargo/glances) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://glances.readthedocs.io/en/latest/install.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/nicolargo/glances/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/nicolargo/glances/releases.atom) (2026-11-14; maintenance)
### htop

Interactive terminal process viewer with filtering and resource meters.

- **Platforms:** Linux, macOS. **License:** GPL-2.0. **Pricing model:** unknown.
- **Pick for:** Useful for quick process inspection in a Unix-like terminal.
- **Compare when:** Process-control permissions depend on the account
- **Strengths:** Useful for quick process inspection in a Unix-like terminal.
- **Limitations:** Process-control permissions depend on the account; Killing a process can discard unsaved work.
- **Maintenance:** active — Official release feed contains activity dated 2026-08-16. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/htop-dev/htop/releases.atom))
- [Official project](https://htop.dev/) · [Official installation / downloads](https://htop.dev/downloads.html) · [Repository](https://github.com/htop-dev/htop)
- **Sources:** [Official project documentation](https://htop.dev/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/htop-dev/htop) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://htop.dev/downloads.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/htop-dev/htop/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/htop-dev/htop/releases.atom) (2026-11-14; maintenance)
### nvtop

Terminal GPU monitor supporting multiple GPU vendors through platform interfaces.

- **Platforms:** Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for observing supported GPUs and their process usage on Linux.
- **Compare when:** Vendor driver and kernel support determine available metrics
- **Strengths:** Useful for observing supported GPUs and their process usage on Linux.
- **Limitations:** Vendor driver and kernel support determine available metrics; Not a GPU stability test.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-08. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/Syllo/nvtop/releases.atom))
- [Official project](https://github.com/Syllo/nvtop) · [Official installation / downloads](https://github.com/Syllo/nvtop/releases) · [Repository](https://github.com/Syllo/nvtop)
- **Sources:** [Official project documentation](https://github.com/Syllo/nvtop) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/Syllo/nvtop/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/Syllo/nvtop/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/Syllo/nvtop/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/Syllo/nvtop/releases/expanded_assets/3.4.0) (2026-11-14; pricing)

## RGB lighting controls

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Frgb-lighting)

### Artemis RGB

Plugin-based RGB lighting application with layered effects and conditions driven by games and desktop data.

- **Platforms:** Windows, Linux. **License:** PolyForm Noncommercial 1.0.0. **Pricing model:** unknown.
- **Pricing details:** The noncommercial source license is verified, but current binary distribution pricing was not established from the reviewed static product page.
- **Pick for:** Create detailed reactive lighting profiles when plugin extensibility and conditional layers matter.
- **Compare when:** The source license is noncommercial, not a general open-source grant.
- **Strengths:** Create detailed reactive lighting profiles when plugin extensibility and conditional layers matter.
- **Limitations:** The source license is noncommercial, not a general open-source grant.; Builds are prerelease and device plugins have uneven hardware testing; Linux setup is less polished than Windows.
- **Maintenance:** unverified — The reviewed official release feed's newest observed entry is Artemis 2 (updated 2023-05-24). Recent maintenance remains unverified; this does not prove the project is abandoned. ([evidence](https://github.com/Artemis-RGB/Artemis/releases.atom))
- [Official project](https://artemis-rgb.com/) · [Official installation / downloads](https://wiki.artemis-rgb.com/) · [Repository](https://github.com/Artemis-RGB/Artemis)
- **Sources:** [Official documentation and distribution evidence](https://artemis-rgb.com/) (2026-11-15; identity, features); [PolyForm Noncommercial source license](https://raw.githubusercontent.com/Artemis-RGB/Artemis/master/LICENSE) (2026-11-16; license); [Official documentation and distribution evidence](https://wiki.artemis-rgb.com/) (2026-11-15; platforms, downloads); [Official documentation and distribution evidence](https://github.com/Artemis-RGB/Artemis) (2026-11-15; features); [Official release or lifecycle evidence](https://github.com/Artemis-RGB/Artemis/releases.atom) (2026-11-15; maintenance)
### OpenRGB

Cross-vendor RGB lighting control application for supported computer components and peripherals.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for coordinating supported RGB devices through one application.
- **Compare when:** Support and device-specific cautions must be checked before use
- **Strengths:** Useful for coordinating supported RGB devices through one application.
- **Limitations:** Support and device-specific cautions must be checked before use; Not all proprietary lighting effects are reproducible.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://openrgb.org/) · [Official installation / downloads](https://openrgb.org/releases.html)
- **Sources:** [Official project documentation](https://openrgb.org/) (2026-11-14; identity, features, platforms, license); [Official download or installation landing page](https://openrgb.org/releases.html) (2026-11-14; downloads, pricing)
### SignalRGB

Cross-brand lighting and desktop-device control app with effects, game integrations and optional paid content.

- **Platforms:** Windows, Linux. **License:** Proprietary WhirlwindFX terms; personal, noncommercial use. **Pricing model:** freemium.
- **Compatibility details:** Windows distribution and Linux beta have different maturity; verify device support for the selected OS.
- **Pricing details:** Free core application; Pro is a subscription and Light Points purchase individual content.
- **Pick for:** Coordinate supported RGB devices through one effect canvas and device-control application.
- **Compare when:** Exact device support matters, and other lighting software can compete for control.
- **Strengths:** Coordinate supported RGB devices through one effect canvas and device-control application.
- **Limitations:** Exact device support matters, and other lighting software can compete for control.; Linux is explicitly a beta distribution; Pro subscriptions and individual content purchases unlock different extras.; The standard platform license is limited to personal, noncommercial purposes; a Pro subscription does not establish commercial-use permission.
- **Maintenance:** unverified — Product documentation reviewed; a current dated release or lifecycle commitment has not been established for this record.
- [Official project](https://signalrgb.com/) · [Official installation / downloads](https://signalrgb.com/)
- **Sources:** [Official documentation and distribution evidence](https://signalrgb.com/) (2026-11-15; identity, features, platforms, pricing, downloads); [Official documentation and distribution evidence](https://signalrgb.com/devices) (2026-11-15; features); [Official documentation and distribution evidence](https://signalrgb.com/pricing/) (2026-11-15; pricing); [Official Linux beta distributions and compatibility limits](https://signalrgb.com/linux) (2026-11-16; downloads, platforms); [Official platform use, subscription and virtual-content terms](https://signalrgb.com/terms/) (2026-11-16; license, pricing)

## Server administration

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fserver-administration)

### Cockpit

Browser administration interface for Linux services, storage, networking and system logs.

- **Platforms:** Linux, Web. **License:** LGPL-2.1-or-later and other listed open-source component licenses. **Pricing model:** unknown.
- **Compatibility details:** Linux server; a browser or Cockpit Client supplies the management interface.
- **Pick for:** Fits managing a Linux machine through a browser while retaining normal system tools and configuration.
- **Compare when:** Administrative permissions remain powerful and must be assigned deliberately.
- **Strengths:** Fits managing a Linux machine through a browser while retaining normal system tools and configuration.
- **Limitations:** Administrative permissions remain powerful and must be assigned deliberately.; Available functionality depends on installed Cockpit modules and the Linux distribution.
- **Maintenance:** active — Official release-feed entry '372' updated 2026-11-10. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/cockpit-project/cockpit/releases.atom))
- [Official project](https://cockpit-project.org/) · [Official installation / downloads](https://cockpit-project.org/running.html) · [Repository](https://github.com/cockpit-project/cockpit)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/cockpit-project/cockpit/HEAD/README.md) (2026-11-14; features, identity, license, platforms); [Official download or installation landing page](https://cockpit-project.org/running.html) (2026-11-14; downloads); [Official project identity and product page](https://cockpit-project.org/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/cockpit-project/cockpit/releases.atom) (2026-11-14; maintenance)
### Webmin

Modular browser-based administration tool for Unix-like operating systems and common services.

- **Platforms:** Linux, FreeBSD, Web. **License:** BSD-3-Clause. **Pricing model:** unknown.
- **Compatibility details:** Unix-like server support; use the vendor supported-system list for the exact distribution and version.
- **Pick for:** Useful when a Unix-like server needs graphical administration across several service types.
- **Compare when:** Module behavior and supported services differ by operating system.
- **Strengths:** Useful when a Unix-like server needs graphical administration across several service types.
- **Limitations:** Module behavior and supported services differ by operating system.; The web interface grants significant system access and requires maintained authentication and HTTPS configuration.
- **Maintenance:** active — Official release-feed entry '2.670' updated 2026-09-21. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/webmin/webmin/releases.atom))
- [Official project](https://webmin.com/) · [Official installation / downloads](https://webmin.com/download/) · [Repository](https://github.com/webmin/webmin)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/webmin/webmin/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/webmin/webmin/HEAD/LICENCE) (2026-11-14; license); [Official download or installation landing page](https://webmin.com/download/) (2026-11-14; downloads); [Official project identity and product page](https://webmin.com/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/webmin/webmin/releases.atom) (2026-11-14; maintenance)

## Startup and persistence inventory

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fstartup-management)

### Autoruns

Broad startup persistence inventory

- **Platforms:** Windows. **License:** Microsoft Sysinternals Software License Terms (proprietary).. **Pricing model:** free.
- **Compatibility details:** Windows startup-entry utility; supported entry types and command-line switches are documented on the official page.
- **Pick for:** Choose Autoruns to inspect Windows autostart locations, services, scheduled tasks and other persistence entries in one view.
- **Compare when:** Compare Task Manager for basic startup apps or System Informer for inspecting a process that is already running.
- **Strengths:** Broad startup persistence inventory
- **Limitations:** Disabling or deleting an unfamiliar startup entry can affect software, device functions or sign-in; identify the entry before changing it.; Signature and reputation results are investigation clues; the presence of an entry alone does not establish that it is malicious.
- **Maintenance:** active — Official product page lists a release published 2026-06-17. Release date reviewed; application not executed. ([evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns))
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns) · [Official installation / downloads](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns)
- **Sources:** [Official release or lifecycle evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns) (2026-11-15; downloads, features, identity, maintenance, platforms); [Microsoft Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms) (2026-11-15; license); [Microsoft application archive publicly available without payment](https://download.sysinternals.com/files/Autoruns.zip) (2026-11-15; downloads, pricing)

## Storage I/O activity

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fstorage-activity)

### iotop-c

Terminal monitor for identifying Linux processes generating storage I/O.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Compatibility details:** Linux packages are commonly named iotop-c to distinguish the implementation from the earlier Python tool.
- **Pick for:** Fits locating which Linux process is reading or writing during storage pressure.
- **Compare when:** Kernel accounting support and appropriate privileges are required.
- **Strengths:** Fits locating which Linux process is reading or writing during storage pressure.
- **Limitations:** Kernel accounting support and appropriate privileges are required.; It identifies activity; it does not establish drive health or repair a storage device.
- **Maintenance:** active — Official release-feed entry 'Version 1.33' updated 2026-10-21. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/Tomas-M/iotop/releases.atom))
- [Official project](https://github.com/Tomas-M/iotop) · [Official installation / downloads](https://github.com/Tomas-M/iotop) · [Repository](https://github.com/Tomas-M/iotop)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/Tomas-M/iotop/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/Tomas-M/iotop/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/Tomas-M/iotop) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/Tomas-M/iotop/releases.atom) (2026-11-14; maintenance)

## Storage benchmarks

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fstorage-benchmarks)

### CrystalDiskMark

Windows storage benchmark for sequential and random read/write workloads.

- **Platforms:** Windows. **License:** MIT. **Pricing model:** unknown.
- **Pick for:** Useful for repeatable Windows storage checks with visible workload settings.
- **Compare when:** Results depend on cache, free space, workload and test size
- **Strengths:** Useful for repeatable Windows storage checks with visible workload settings.
- **Limitations:** Results depend on cache, free space, workload and test size; Benchmarks write data and should not be run repeatedly without need.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://crystalmark.info/en/software/crystaldiskmark/) · [Official installation / downloads](https://crystalmark.info/en/download/) · [Repository](https://github.com/hiyohiyo/CrystalDiskMark)
- **Sources:** [Official project documentation](https://crystalmark.info/en/software/crystaldiskmark/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/hiyohiyo/CrystalDiskMark) (2026-11-14; identity, features); [Official download or installation landing page](https://crystalmark.info/en/download/) (2026-11-14; downloads); [Official CrystalDiskMark MIT license](https://crystalmark.info/en/software/crystaldiskmark/crystaldiskmark-license/) (2026-11-14; license)
### DiskSpd

Microsoft command-line storage workload generator for Windows performance analysis.

- **Platforms:** Windows. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for reproducible Windows storage experiments with documented parameters.
- **Compare when:** Write tests can modify target data
- **Strengths:** Useful for reproducible Windows storage experiments with documented parameters.
- **Limitations:** Write tests can modify target data; Interpret results with host caching and device state recorded.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-04. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/microsoft/diskspd/releases.atom))
- [Official project](https://github.com/microsoft/diskspd) · [Official installation / downloads](https://github.com/microsoft/diskspd/releases) · [Repository](https://github.com/microsoft/diskspd)
- **Sources:** [Official project documentation](https://github.com/microsoft/diskspd) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/microsoft/diskspd/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/microsoft/diskspd/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/microsoft/diskspd/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/microsoft/diskspd/releases/expanded_assets/v2.3) (2026-11-14; pricing)
### fio

Configurable I/O workload generator and benchmark for storage testing.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for storage experiments requiring explicit workloads and reproducible parameters.
- **Compare when:** Poorly selected targets or write jobs can destroy data
- **Strengths:** Useful for storage experiments requiring explicit workloads and reproducible parameters.
- **Limitations:** Poorly selected targets or write jobs can destroy data; Results need workload and cache context.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-23. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/axboe/fio/releases.atom))
- [Official project](https://fio.readthedocs.io/) · [Official installation / downloads](https://github.com/axboe/fio/releases) · [Repository](https://github.com/axboe/fio)
- **Sources:** [Official project documentation](https://fio.readthedocs.io/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/axboe/fio) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/axboe/fio/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/axboe/fio/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/axboe/fio/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/axboe/fio/releases/expanded_assets/fio-3.43) (2026-11-14; pricing)

## Storage diagnostics

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fstorage-diagnostics)

### nvme-cli

Command-line management and diagnostic tool for NVMe storage and supported fabric connections.

- **Platforms:** Linux, FreeBSD. **License:** GPL-2.0 for nvme-cli; libnvme and components have separate licenses. **Pricing model:** unknown.
- **Compatibility details:** Current README lists Linux distributions and FreeBSD packaging; controller capabilities remain device-specific.
- **Pick for:** Fits specialist investigation of NVMe devices beyond a general-purpose disk dashboard.
- **Compare when:** Administrative commands can alter or erase devices; inspect the exact command before use.
- **Strengths:** Fits specialist investigation of NVMe devices beyond a general-purpose disk dashboard.
- **Limitations:** Administrative commands can alter or erase devices; inspect the exact command before use.; Supported commands depend on controller firmware, operating system and privileges.
- **Maintenance:** active — Official release-feed entry 'v3.2' updated 2026-10-30. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/linux-nvme/nvme-cli/releases.atom))
- [Official project](https://github.com/linux-nvme/nvme-cli) · [Official installation / downloads](https://github.com/linux-nvme/nvme-cli) · [Repository](https://github.com/linux-nvme/nvme-cli)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/linux-nvme/nvme-cli/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/linux-nvme/nvme-cli/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/linux-nvme/nvme-cli) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/linux-nvme/nvme-cli/releases.atom) (2026-11-14; maintenance)

## Drive health and SMART diagnostics

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fstorage-health)

### CrystalDiskInfo

SSD/HDD health and SMART inspection

- **Platforms:** Windows. **License:** MIT application; themed editions include separately attributed assets.. **Pricing model:** unknown.
- **Compatibility details:** Windows drive-health utility with x86, x64 and ARM64 editions. NVMe support requires Windows 10/Server 2016 or newer; other feature and installer requirements vary.
- **Pick for:** Choose CrystalDiskInfo to inspect Windows drive-health attributes, temperature and supported device information.
- **Compare when:** Compare smartmontools for command-line drive interrogation or CrystalDiskMark when the task is measuring transfer performance.
- **Strengths:** SSD/HDD health and SMART inspection
- **Limitations:** USB and RAID support covers only some controllers and bridges; an unavailable reading can reflect the connection path.; A health label describes reported device data and does not guarantee future reliability; keep a separate backup regardless of the displayed status.
- **Maintenance:** active — Official developer pages list CrystalDiskInfo 9.9.4 dated 2026-11-03. Package contents and drive behavior were not tested. ([evidence](https://crystalmark.info/en/download/))
- [Official project](https://crystalmark.info/en/software/crystaldiskinfo/) · [Official installation / downloads](https://crystalmark.info/en/download/#CrystalDiskInfo)
- **Sources:** [Official drive-health scope, supported interfaces and Windows requirements](https://crystalmark.info/en/software/crystaldiskinfo/) (2026-11-15; features, identity, platforms); [Preserved original research source](https://github.com/hiyohiyo/CrystalDiskInfo) (2026-11-14; identity, features); [Official MIT application license](https://crystalmark.info/en/software/crystaldiskinfo/crystaldiskinfo-license/) (2026-11-15; license); [Official release or lifecycle evidence](https://crystalmark.info/en/download/) (2026-11-15; downloads, maintenance)
### GSmartControl

Graphical interface to smartctl for drive SMART data and self-test control.

- **Platforms:** Windows, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful when smartmontools data needs a desktop interface.
- **Compare when:** Depends on smartmontools and device/controller support
- **Strengths:** Useful when smartmontools data needs a desktop interface.
- **Limitations:** Depends on smartmontools and device/controller support; Drive health indicators cannot guarantee future reliability.
- **Maintenance:** unverified — Official release feed contains activity dated 2025-02-24. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ashaduri/gsmartcontrol/releases.atom))
- [Official project](https://gsmartcontrol.shaduri.dev/) · [Official installation / downloads](https://gsmartcontrol.shaduri.dev/downloads) · [Repository](https://github.com/ashaduri/gsmartcontrol)
- **Sources:** [Official project documentation](https://gsmartcontrol.shaduri.dev/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/ashaduri/gsmartcontrol) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://gsmartcontrol.shaduri.dev/downloads) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ashaduri/gsmartcontrol/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/ashaduri/gsmartcontrol/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/ashaduri/gsmartcontrol/releases/expanded_assets/v2.0.2) (2026-11-14; pricing)
### smartmontools

Disk health tools for reading SMART information and running supported device self-tests.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Pick for:** Useful for scriptable storage-health inspection across operating systems.
- **Compare when:** USB bridges and RAID controllers may hide SMART data
- **Strengths:** Useful for scriptable storage-health inspection across operating systems.
- **Limitations:** USB bridges and RAID controllers may hide SMART data; A passing self-test does not guarantee a drive will not fail.
- **Maintenance:** active — Official release feed contains activity dated 2025-05-31. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/smartmontools/smartmontools/releases.atom))
- [Official project](https://www.smartmontools.org/) · [Official installation / downloads](https://www.smartmontools.org/wiki/Download) · [Repository](https://github.com/smartmontools/smartmontools)
- **Sources:** [Official project documentation](https://www.smartmontools.org/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/smartmontools/smartmontools) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.smartmontools.org/wiki/Download) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/smartmontools/smartmontools/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/smartmontools/smartmontools/releases.atom) (2026-11-14; maintenance)

## Stress testing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fstress-testing)

### OCCT

Hardware stability testing and monitoring application for CPU, GPU and memory workloads.

- **Platforms:** Windows, Linux. **License:** Proprietary; personal and commercial edition terms. **Pricing model:** freemium.
- **Pick for:** Useful for controlled component-stability testing with visible sensors.
- **Compare when:** Stress workloads increase heat and power demand
- **Strengths:** Useful for controlled component-stability testing with visible sensors.
- **Limitations:** Stress workloads increase heat and power demand; Edition and platform features differ.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.ocbase.com/) · [Official installation / downloads](https://www.ocbase.com/download)
- **Sources:** [Official project documentation](https://www.ocbase.com/) (2026-11-14; identity, features, license, pricing); [Official download or installation landing page](https://www.ocbase.com/download) (2026-11-14; downloads, platforms)
### stress-ng

System stress tool with many CPU, memory, filesystem and kernel exercise workloads.

- **Platforms:** Linux, macOS. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for targeted Linux stress experiments and regression reproduction.
- **Compare when:** Available stressors vary by OS and privilege
- **Strengths:** Useful for targeted Linux stress experiments and regression reproduction.
- **Limitations:** Available stressors vary by OS and privilege; Stress results are not a general-purpose performance ranking.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-03. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ColinIanKing/stress-ng/releases.atom))
- [Official project](https://github.com/ColinIanKing/stress-ng) · [Official installation / downloads](https://github.com/ColinIanKing/stress-ng/releases) · [Repository](https://github.com/ColinIanKing/stress-ng)
- **Sources:** [Official project documentation](https://github.com/ColinIanKing/stress-ng) (2026-11-14; features, identity, platforms, pricing); [Official download or installation landing page](https://github.com/ColinIanKing/stress-ng/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ColinIanKing/stress-ng/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/ColinIanKing/stress-ng/releases.atom) (2026-11-14; maintenance)

## System snapshots and rollback

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fsystem-snapshots)

### Snapper

Linux filesystem snapshot manager with comparison and rollback support.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Pick for:** Well suited to Btrfs installations that need inspectable system rollback points.
- **Compare when:** Filesystem and distribution integration determine supported rollback behavior
- **Strengths:** Well suited to Btrfs installations that need inspectable system rollback points.
- **Limitations:** Filesystem and distribution integration determine supported rollback behavior; Snapshots on the same disk are not off-device backups.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-07. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/openSUSE/snapper/releases.atom))
- [Official project](https://github.com/openSUSE/snapper) · [Official installation / downloads](https://github.com/openSUSE/snapper#installing-and-running-snapper) · [Repository](https://github.com/openSUSE/snapper)
- **Sources:** [Official project documentation](https://github.com/openSUSE/snapper) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/openSUSE/snapper#installing-and-running-snapper) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/openSUSE/snapper/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/openSUSE/snapper/releases.atom) (2026-11-14; maintenance)
### Timeshift

Linux system restore snapshots using rsync or supported Btrfs layouts.

- **Platforms:** Linux. **License:** GPL-2.0-or-later per the current project Debian copyright; component notices apply. **Pricing model:** unknown.
- **Pick for:** Useful for restoring a Linux system after problematic updates.
- **Compare when:** Designed for system files rather than a substitute for personal-data backups
- **Strengths:** Useful for restoring a Linux system after problematic updates.
- **Limitations:** Designed for system files rather than a substitute for personal-data backups; Btrfs mode requires a supported subvolume layout.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/linuxmint/timeshift/releases.atom))
- [Official project](https://github.com/linuxmint/timeshift) · [Official installation / downloads](https://github.com/linuxmint/timeshift/releases) · [Repository](https://github.com/linuxmint/timeshift)
- **Sources:** [Official project documentation](https://github.com/linuxmint/timeshift) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/linuxmint/timeshift/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/linuxmint/timeshift/HEAD/debian/copyright) (2026-11-14; license); [Official release activity](https://github.com/linuxmint/timeshift/releases.atom) (2026-11-14; maintenance)

## Application uninstallers

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Funinstallers)

### Bulk Crap Uninstaller

Batch uninstall orchestration and leftover review

- **Platforms:** Windows. **License:** Apache-2.0.. **Pricing model:** free.
- **Compatibility details:** BCUninstaller v6 officially targets Windows 10 or newer and .NET 8; the self-contained portable package includes its runtime. Older branches have different requirements.
- **Pick for:** Choose BCUninstaller for batch removal of multiple Windows applications and review of leftover or orphaned entries.
- **Compare when:** Compare Revo Uninstaller for its guided workflow and edition features, or Windows Settings for a straightforward single-app removal.
- **Strengths:** Batch uninstall orchestration and leftover review
- **Limitations:** Leftover and orphan detection requires judgment; review proposed removals before deleting shared-looking files or registry entries.; The project is looking for maintainers. Installer behavior varies by application, so bulk removal does not guarantee every uninstaller runs without prompts.
- **Maintenance:** unverified — Current official README explicitly requests maintainers. Download options are present, but no release cadence or support commitment was established in this overlay review. ([evidence](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller))
- [Official project](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller) · [Official installation / downloads](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller) · [Repository](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller)
- **Sources:** [Official release or lifecycle evidence](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller) (2026-11-15; downloads, features, identity, license, maintenance, platforms, pricing)
### Revo Uninstaller

Built-in uninstaller followed by leftover scan; Hunter Mode

- **Platforms:** Windows. **License:** Proprietary Revo Uninstaller Freeware License Agreement; Pro is a separately licensed edition.. **Pricing model:** freemium.
- **Compatibility details:** Windows 7/8/8.1/10/11 and Windows Server editions, 32-bit or 64-bit, according to the vendor’s Free-edition page.
- **Pick for:** Choose Revo Uninstaller for a guided Windows uninstall followed by a review of detected leftovers.
- **Compare when:** Compare BCUninstaller for bulk-removal workflows and open-source licensing; compare Free and Pro features before buying.
- **Strengths:** Built-in uninstaller followed by leftover scan; Hunter Mode
- **Limitations:** Detected leftovers still need review; shared components and personal data should not be removed solely because a scanner lists them.; Free and Pro have different capabilities. Paid update-subscription terms allow continued use of an already purchased version after the update period ends.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.revouninstaller.com/products/revo-uninstaller-free/) · [Official installation / downloads](https://www.revouninstaller.com/products/revo-uninstaller-free/)
- **Sources:** [Official Free/Pro comparison, uninstall workflow, requirements and downloads](https://www.revouninstaller.com/products/revo-uninstaller-free/) (2026-11-15; downloads, features, identity, platforms, pricing); [LicenseAgreement.txt inside the official Free Portable distribution](https://revouninstaller.b-cdn.net/ruf272/RevoUninstaller_Portable.zip) (2026-11-15; downloads, license, pricing)

## USB device sharing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fusb-sharing)

### USB Network Gate

Cross-platform USB-over-network application for sharing supported peripherals with remote computers.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary Electronic Team software terms. **Pricing model:** unknown.
- **Compatibility details:** Vendor Linux requirements list distributions newer than the stated kernel range; verify actual kernel compatibility before selecting.
- **Pricing details:** The current product homepage advertises free use, while the vendor purchase page still lists personal/corporate licenses. Edition applicability was not resolved; do not assume a universal free or paid policy.
- **Pick for:** Evaluate remote USB access when the peripheral must stay physically attached to another host.
- **Compare when:** Device compatibility and network timing must be checked with the intended workload.
- **Strengths:** Evaluate remote USB access when the peripheral must stay physically attached to another host.
- **Limitations:** Device compatibility and network timing must be checked with the intended workload.; The current Linux page lists a kernel support range only through 5.x, so current-distribution compatibility is unresolved.
- **Maintenance:** unverified — Product documentation reviewed; a current dated release or lifecycle commitment has not been established for this record.
- [Official project](https://www.electronic.us/products/usb-over-ethernet/) · [Official installation / downloads](https://www.electronic.us/products/usb-over-ethernet/download/)
- **Sources:** [Official documentation and distribution evidence](https://www.electronic.us/products/usb-over-ethernet/) (2026-11-15; identity, features, platforms, pricing, downloads); [Official documentation and distribution evidence](https://www.electronic.us/products/usb-over-ethernet/download/) (2026-11-15; downloads, platforms); [Official documentation and distribution evidence](https://www.electronic.us/products/usb-over-ethernet/purchase/) (2026-11-15; pricing, license)
### usbipd-win

Windows USB/IP host service for sharing local USB devices with other machines and WSL 2.

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Windows 10 or Windows Server 2019 version 1809 or later, x64/ARM64, as documented by the project.
- **Pick for:** Useful when a USB device attached to Windows must be used inside a Linux environment.
- **Compare when:** Sharing exposes selected devices to USB/IP clients and requires deliberate network access control.
- **Strengths:** Useful when a USB device attached to Windows must be used inside a Linux environment.
- **Limitations:** Sharing exposes selected devices to USB/IP clients and requires deliberate network access control.; Device behavior and simultaneous host access depend on the USB device and attachment state.
- **Maintenance:** active — Official release-feed entry 'usbipd-win 5.3.0' updated 2025-10-11. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/dorssel/usbipd-win/releases.atom))
- [Official project](https://github.com/dorssel/usbipd-win) · [Official installation / downloads](https://github.com/dorssel/usbipd-win) · [Repository](https://github.com/dorssel/usbipd-win)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/dorssel/usbipd-win/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/dorssel/usbipd-win/HEAD/COPYING.md) (2026-11-14; license); [Official download or installation landing page](https://github.com/dorssel/usbipd-win) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/dorssel/usbipd-win/releases.atom) (2026-11-14; maintenance)
### VirtualHere

USB-over-network server and client software that makes a supported remote USB device available to another computer.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary VirtualHere license. **Pricing model:** paid.
- **Pricing details:** Per-server perpetual license with trial; client is free and may be installed on multiple machines.
- **Pick for:** Attach a USB peripheral to a nearby server while using it from another supported computer.
- **Compare when:** Device behavior depends on latency, bandwidth and driver compatibility.
- **Strengths:** Attach a USB peripheral to a nearby server while using it from another supported computer.
- **Limitations:** Device behavior depends on latency, bandwidth and driver compatibility.; The server license is hardware-bound and nontransferable; the client is free but does not eliminate server licensing.
- **Maintenance:** unverified — Product documentation reviewed; a current dated release or lifecycle commitment has not been established for this record.
- [Official project](https://www.virtualhere.com/) · [Official installation / downloads](https://www.virtualhere.com/)
- **Sources:** [Official documentation and distribution evidence](https://www.virtualhere.com/) (2026-11-15; identity, features, platforms, downloads); [Official documentation and distribution evidence](https://www.virtualhere.com/purchase) (2026-11-15; license, pricing)

## Virtual machine environments

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=system%2Fvirtual-machines)

### GNOME Boxes

GNOME application for creating and using virtual machines with a simplified interface.

- **Platforms:** Linux. **License:** LGPL-2.1-or-later. **Pricing model:** unknown.
- **Pick for:** Useful for trying Linux desktop guests with a streamlined graphical setup.
- **Compare when:** Advanced virtualization controls are intentionally limited
- **Strengths:** Useful for trying Linux desktop guests with a streamlined graphical setup.
- **Limitations:** Advanced virtualization controls are intentionally limited; Acceleration requires suitable host hardware and permissions.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://apps.gnome.org/Boxes/) · [Official installation / downloads](https://apps.gnome.org/Boxes/)
- **Sources:** [Official project documentation](https://apps.gnome.org/Boxes/) (2026-11-14; identity, features, platforms, downloads); [Official application metadata license](https://raw.githubusercontent.com/GNOME/gnome-boxes/HEAD/data/org.gnome.Boxes.metainfo.xml.in) (2026-11-14; license)
### Incus

System-container and virtual-machine manager for running complete Linux environments.

- **Platforms:** Linux. **License:** Apache-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux host for system containers/VMs; clients and guest systems have separate compatibility requirements.
- **Pick for:** Fits a Linux workstation or home server that needs several managed system environments.
- **Compare when:** Host kernel, virtualization and storage capabilities determine available workloads.
- **Strengths:** Fits a Linux workstation or home server that needs several managed system environments.
- **Limitations:** Host kernel, virtualization and storage capabilities determine available workloads.; It has different operating assumptions from a single-app container desktop.
- **Maintenance:** active — Official release-feed entry 'Incus 7.6' updated 2026-10-30. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/lxc/incus/releases.atom))
- [Official project](https://linuxcontainers.org/incus/) · [Official installation / downloads](https://linuxcontainers.org/incus/docs/main/tutorial/first_steps/) · [Repository](https://github.com/lxc/incus)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/lxc/incus/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/lxc/incus/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://linuxcontainers.org/incus/docs/main/tutorial/first_steps/) (2026-11-14; downloads); [Official project identity and product page](https://linuxcontainers.org/incus/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/lxc/incus/releases.atom) (2026-11-14; maintenance)
### Lima

Linux virtual-machine launcher with integrated file sharing and port forwarding.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** unknown.
- **Compatibility details:** Current README documents macOS/Linux hosts and a Windows WinGet installation path; check backend requirements for the host.
- **Pick for:** Useful when a desktop development workflow needs managed Linux machines and a command-line interface.
- **Compare when:** Host backend and architecture determine guest support and integration details.
- **Strengths:** Useful when a desktop development workflow needs managed Linux machines and a command-line interface.
- **Limitations:** Host backend and architecture determine guest support and integration details.; It provides Linux VMs rather than a complete graphical general-purpose hypervisor experience.
- **Maintenance:** active — Official release-feed entry 'v2.3.0' updated 2026-11-06. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/lima-vm/lima/releases.atom))
- [Official project](https://lima-vm.io/) · [Official installation / downloads](https://github.com/lima-vm/lima) · [Repository](https://github.com/lima-vm/lima)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/lima-vm/lima/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/lima-vm/lima/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/lima-vm/lima) (2026-11-14; downloads); [Official project identity and product page](https://lima-vm.io/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/lima-vm/lima/releases.atom) (2026-11-14; maintenance)
### Multipass

Canonical tool for launching and managing Ubuntu virtual machines from the command line.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for quickly creating Ubuntu-based development or administration labs.
- **Compare when:** Focused on Ubuntu images
- **Strengths:** Useful for quickly creating Ubuntu-based development or administration labs.
- **Limitations:** Focused on Ubuntu images; Hypervisor support and resource needs vary by host OS.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/canonical/multipass/releases.atom))
- [Official project](https://multipass.run/) · [Official installation / downloads](https://multipass.run/install) · [Repository](https://github.com/canonical/multipass)
- **Sources:** [Official project documentation](https://multipass.run/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/canonical/multipass) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://multipass.run/install) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/canonical/multipass/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/canonical/multipass/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/canonical/multipass/releases/expanded_assets/v1.17.1) (2026-11-14; pricing)
### Parallels Desktop

Mac virtualization application for running supported Windows and other guest systems alongside macOS.

- **Platforms:** macOS. **License:** Parallels proprietary license; perpetual or subscription options depend on edition. **Pricing model:** mixed.
- **Compatibility details:** macOS host only. The current release supports compatible Apple-silicon Macs; Parallels Desktop 26 is the documented Intel-Mac route. Guest architecture and operating-system support differ by processor and product version.
- **Pick for:** Choose it when integrated Windows application use on a Mac matters more than a general cross-platform VM manager.
- **Compare when:** Windows and other guest OS licenses are separate; edition limits and upgrade rights differ.
- **Strengths:** Choose it when integrated Windows application use on a Mac matters more than a general cross-platform VM manager.; Guided guest setup reduces some manual VM configuration work.
- **Limitations:** Windows and other guest OS licenses are separate; edition limits and upgrade rights differ.; Apple-silicon Macs normally require ARM guests; application, driver, GPU and game compatibility must be checked individually.
- **Maintenance:** unverified — Current product and distribution documentation reviewed; a dated release history was not independently established for this entry.
- [Official project](https://www.parallels.com/products/desktop/) · [Official installation / downloads](https://www.parallels.com/products/desktop/download/)
- **Sources:** [Official Parallels download, trial and host information](https://www.parallels.com/products/desktop/download/) (2026-11-14; identity, features, downloads, platforms, pricing); [Official Parallels desktop license agreement](https://www.parallels.com/about/legal/eula/) (2026-11-14; license, pricing); [Official Parallels edition and purchase comparison](https://www.parallels.com/products/desktop/buy/) (2026-11-14; pricing)
### QEMU

Machine emulator and virtualizer supporting multiple architectures and hardware models.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 and compatible component licenses. **Pricing model:** unknown.
- **Pick for:** Useful for architecture emulation and configurable virtual-machine research.
- **Compare when:** Performance depends strongly on acceleration and host/guest architecture
- **Strengths:** Useful for architecture emulation and configurable virtual-machine research.
- **Limitations:** Performance depends strongly on acceleration and host/guest architecture; Direct command-line setup is more involved than a desktop frontend.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-10. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/qemu/qemu/releases.atom))
- [Official project](https://www.qemu.org/) · [Official installation / downloads](https://www.qemu.org/download/) · [Repository](https://github.com/qemu/qemu)
- **Sources:** [Official project documentation](https://www.qemu.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/qemu/qemu) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.qemu.org/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/qemu/qemu/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/qemu/qemu/releases.atom) (2026-11-14; maintenance)
### Quickemu

QEMU wrapper that automates guest-image retrieval and virtual-machine configuration.

- **Platforms:** macOS, Linux. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** The README lists Linux and macOS hosts; supported guest systems are a separate list.
- **Pick for:** Useful for trying operating systems with less manual QEMU configuration.
- **Compare when:** QEMU and the documented host dependencies are still required.
- **Strengths:** Useful for trying operating systems with less manual QEMU configuration.
- **Limitations:** QEMU and the documented host dependencies are still required.; Guest operating-system licenses, hardware support and architecture restrictions still apply.
- **Maintenance:** active — Official release-feed entry '4.9.9' updated 2026-02-10. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/quickemu-project/quickemu/releases.atom))
- [Official project](https://github.com/quickemu-project/quickemu) · [Official installation / downloads](https://github.com/quickemu-project/quickemu) · [Repository](https://github.com/quickemu-project/quickemu)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/quickemu-project/quickemu/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/quickemu-project/quickemu/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/quickemu-project/quickemu) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/quickemu-project/quickemu/releases.atom) (2026-11-14; maintenance)
### UTM

Mac virtualization and emulation application built around QEMU and Apple virtualization technologies.

- **Platforms:** macOS. **License:** Apache-2.0 application plus QEMU components. **Pricing model:** mixed.
- **Pick for:** Useful for Mac users who want a graphical interface to supported virtual machines and emulation.
- **Compare when:** Guest acceleration depends on the chosen backend and architecture
- **Strengths:** Useful for Mac users who want a graphical interface to supported virtual machines and emulation.
- **Limitations:** Guest acceleration depends on the chosen backend and architecture; App Store distribution and direct download differ in purchase model.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-18. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/utmapp/UTM/releases.atom))
- [Official project](https://mac.getutm.app/) · [Official installation / downloads](https://mac.getutm.app/) · [Repository](https://github.com/utmapp/UTM)
- **Sources:** [Official project documentation](https://mac.getutm.app/) (2026-11-14; downloads, features, identity, platforms, pricing); [Official source repository and README](https://github.com/utmapp/UTM) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/utmapp/UTM/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/utmapp/UTM/releases.atom) (2026-11-14; maintenance)
### Virtual Machine Manager

Graphical manager for libvirt virtual machines and their host resources.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Pick for:** Useful for a Linux desktop controlling local or remote KVM/libvirt guests.
- **Compare when:** Requires virtualization infrastructure such as libvirt and QEMU
- **Strengths:** Useful for a Linux desktop controlling local or remote KVM/libvirt guests.
- **Limitations:** Requires virtualization infrastructure such as libvirt and QEMU; Not a standalone hypervisor.
- **Maintenance:** active — Official release feed contains activity dated 2026-01-21. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/virt-manager/virt-manager/releases.atom))
- [Official project](https://virt-manager.org/) · [Official installation / downloads](https://github.com/virt-manager/virt-manager) · [Repository](https://github.com/virt-manager/virt-manager)
- **Sources:** [Official project documentation](https://virt-manager.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/virt-manager/virt-manager) (2026-11-14; identity, features, downloads); [Official source license](https://raw.githubusercontent.com/virt-manager/virt-manager/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/virt-manager/virt-manager/releases.atom) (2026-11-14; maintenance)
### VirtualBox

Desktop virtualization platform for running supported guest operating systems in virtual machines.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0 base; Extension Pack under separate PUEL terms. **Pricing model:** mixed.
- **Pick for:** Useful for desktop labs needing several guest operating systems and snapshots.
- **Compare when:** Host architecture and guest support must match
- **Strengths:** Useful for desktop labs needing several guest operating systems and snapshots.
- **Limitations:** Host architecture and guest support must match; Extension Pack use has separate licensing restrictions.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.virtualbox.org/) · [Official installation / downloads](https://www.virtualbox.org/wiki/Downloads)
- **Sources:** [Official project documentation](https://www.virtualbox.org/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://www.virtualbox.org/wiki/Downloads) (2026-11-14; downloads)
### VMware Workstation Pro and Fusion Pro

VMware desktop hypervisor family: Workstation Pro for Windows/Linux hosts and Fusion Pro for Mac hosts.

- **Platforms:** Windows, Linux, macOS. **License:** VMware/Broadcom proprietary software terms; no-charge personal, educational and commercial desktop use. **Pricing model:** free.
- **Compatibility details:** One product-family record preserves the distinction: Workstation hosts are Windows/Linux; Fusion hosts are macOS. Guest OS and CPU architecture support must be checked per product.
- **Pick for:** Choose it for a desktop VM workflow where Workstation or Fusion compatibility is already useful.
- **Compare when:** Downloads require a Broadcom account and profile checks; guest operating systems retain their own licensing requirements.
- **Strengths:** Choose it for a desktop VM workflow where Workstation or Fusion compatibility is already useful.; Current qualifying releases are free for personal, educational and commercial use.
- **Limitations:** Downloads require a Broadcom account and profile checks; guest operating systems retain their own licensing requirements.; Workstation and Fusion have different host and guest support, especially on Apple silicon; this record does not imply identical platform capabilities.
- **Maintenance:** unverified — Current product and distribution documentation reviewed; a dated release history was not independently established for this entry.
- [Official project](https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion) · [Official installation / downloads](https://knowledge.broadcom.com/external/article/368667/download-and-license-free-vmware-desktop.html)
- **Sources:** [Official Workstation and Fusion family overview](https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion) (2026-11-14; identity, features, platforms); [Official free desktop licensing and download instructions](https://knowledge.broadcom.com/external/article/368667/download-and-license-free-vmware-desktop.html) (2026-11-14; license, pricing, downloads); [Official all-users licensing announcement](https://blogs.vmware.com/cloud-foundation/2024/11/11/vmware-fusion-and-workstation-are-now-free-for-all-users/) (2026-11-14; pricing)
