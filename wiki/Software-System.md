# System & hardware

Inspect, maintain and understand your computer.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=system) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

54 applications. Reviewed 2026-11-14; individual records identify inherited research.

## File, registry and process tracing

### Process Monitor

Real-time filesystem, Registry and process/thread activity with filters and stacks.

- **Platforms:** Windows. **License:** Microsoft proprietary utility; Sysinternals license. **Pricing model:** unknown.
- **Pick for:** Real-time filesystem, Registry and process/thread activity with filters and stacks.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Real-time filesystem, Registry and process/thread activity with filters and stacks.
- **Limitations:** Large traces can expose private paths and command lines; bounded capture required. Not an antivirus.; Workflow inspiration, not reusable source.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon)
- **Sources:** [Preserved original research source](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) (2026-11-14; identity, features)

## Cache and temporary file cleanup

### BleachBit

Application-specific cleanup definitions

- **Platforms:** Windows. **License:** GPL-3.0 repository classification. **Pricing model:** unknown.
- **Pick for:** Application-specific cleanup definitions
- **Compare when:** Preview versus actual removal on disposable profile; protected files and rebuild latency
- **Strengths:** Application-specific cleanup definitions
- **Limitations:** Can erase sessions/history and useful caches; regeneration costs matter; Copyleft definitions/engine candidate after exact component audit; declarative preview is useful architecture
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/bleachbit/bleachbit) · [Repository](https://github.com/bleachbit/bleachbit)
- **Sources:** [Preserved original research source](https://github.com/bleachbit/bleachbit) (2026-11-14; identity, features)

## Desktop container environments

### Distrobox

Tool for running user environments from other Linux distributions through container engines.

- **Platforms:** Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for using another distribution’s packages on an existing Linux desktop.
- **Compare when:** Designed for host integration rather than a strong security sandbox
- **Strengths:** Useful for using another distribution’s packages on an existing Linux desktop.
- **Limitations:** Designed for host integration rather than a strong security sandbox; Requires a supported container engine.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-25. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/89luca89/distrobox/releases.atom))
- [Official project](https://distrobox.it/) · [Official installation / downloads](https://distrobox.it/#installation) · [Repository](https://github.com/89luca89/distrobox)
- **Sources:** [Official project documentation](https://distrobox.it/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/89luca89/distrobox) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://distrobox.it/#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/89luca89/distrobox/HEAD/COPYING.md) (2026-11-14; license); [Official release activity](https://github.com/89luca89/distrobox/releases.atom) (2026-11-14; maintenance)
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
### Podman Desktop

Desktop interface for working with containers, Podman and related development environments.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for developers wanting a graphical container workflow around Podman.
- **Compare when:** Windows and macOS generally use a Linux VM for Linux containers
- **Strengths:** Useful for developers wanting a graphical container workflow around Podman.
- **Limitations:** Windows and macOS generally use a Linux VM for Linux containers; Runtime and extension behavior differ by environment.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/podman-desktop/podman-desktop/releases.atom))
- [Official project](https://podman-desktop.io/) · [Official installation / downloads](https://podman-desktop.io/downloads) · [Repository](https://github.com/podman-desktop/podman-desktop)
- **Sources:** [Official project documentation](https://podman-desktop.io/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/podman-desktop/podman-desktop) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://podman-desktop.io/downloads) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/podman-desktop/podman-desktop/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/podman-desktop/podman-desktop/releases.atom) (2026-11-14; maintenance)
### Rancher Desktop

Desktop application for local Kubernetes and container management.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for developers who need a local Kubernetes-oriented container environment.
- **Compare when:** A local cluster consumes host resources
- **Strengths:** Useful for developers who need a local Kubernetes-oriented container environment.
- **Limitations:** A local cluster consumes host resources; Runtime selection affects CLI and image workflows.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-05. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/rancher-sandbox/rancher-desktop/releases.atom))
- [Official project](https://rancherdesktop.io/) · [Official installation / downloads](https://rancherdesktop.io/) · [Repository](https://github.com/rancher-sandbox/rancher-desktop)
- **Sources:** [Official project documentation](https://rancherdesktop.io/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/rancher-sandbox/rancher-desktop) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/rancher-sandbox/rancher-desktop/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/rancher-sandbox/rancher-desktop/releases.atom) (2026-11-14; maintenance)

## Fan and cooling controls

### CoolerControl

Linux cooling-control application for supported fans, sensors and liquid-cooling devices.

- **Platforms:** Linux. **License:** GPL-3.0-or-later. **Pricing model:** free.
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
- **Sources:** [Official project documentation](https://github.com/liquidctl/liquidctl) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/liquidctl/liquidctl#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/liquidctl/liquidctl/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/liquidctl/liquidctl/releases.atom) (2026-11-14; maintenance)

## Reproducible development machines

### Vagrant

Command-line environment manager that describes repeatable virtual-machine development setups.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for current main source; provider and box terms remain separate. **Pricing model:** free.
- **Pick for:** Maintaining or migrating an existing Vagrant-based development environment while evaluating community-maintained successors.
- **Compare when:** Vagrant itself has an announced end of life at the end of 2026; vendor maintenance is ending and community continuation is uncertain.
- **Strengths:** Declarative machine definitions can help reproduce existing Vagrant environments; current MIT source allows community continuation.
- **Limitations:** Vagrant itself has an announced end of life at the end of 2026; vendor maintenance is ending and community continuation is uncertain.; The HCP Vagrant Box Registry is also being deprecated; existing boxes and metadata may need export.; Provider software, boxes and plugins have separate licenses and requirements.
- **Maintenance:** unverified — HashiCorp announced on 2026-11-12 that Vagrant will reach end of life at the end of 2026 and that its repository will be archived within the following months, with no further vendor maintenance. Community continuation is possible under MIT but not established by this review. ([evidence](https://discuss.hashicorp.com/t/vagrant-is-moving-to-an-open-source-model/78189))
- [Official project](https://developer.hashicorp.com/vagrant) · [Official installation / downloads](https://developer.hashicorp.com/vagrant/downloads) · [Repository](https://github.com/hashicorp/vagrant)
- **Sources:** [Official project documentation](https://developer.hashicorp.com/vagrant) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/hashicorp/vagrant) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://developer.hashicorp.com/vagrant/downloads) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/hashicorp/vagrant/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/hashicorp/vagrant/releases.atom) (2026-11-14; maintenance); [HashiCorp Vagrant end-of-life and MIT transition announcement](https://discuss.hashicorp.com/t/vagrant-is-moving-to-an-open-source-model/78189) (2026-11-14; maintenance, license)

## Monitor brightness controls

### MonitorControl

Mac menu-bar utility for supported external display brightness and volume control.

- **Platforms:** macOS. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for controlling compatible external displays from macOS keys and menu bar.
- **Compare when:** Display protocol and connection support vary
- **Strengths:** Useful for controlling compatible external displays from macOS keys and menu bar.
- **Limitations:** Display protocol and connection support vary; Some adapters and monitors limit available controls.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-15. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/MonitorControl/MonitorControl/releases.atom))
- [Official project](https://github.com/MonitorControl/MonitorControl) · [Official installation / downloads](https://github.com/MonitorControl/MonitorControl/releases) · [Repository](https://github.com/MonitorControl/MonitorControl)
- **Sources:** [Official project documentation](https://github.com/MonitorControl/MonitorControl) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/MonitorControl/MonitorControl/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/MonitorControl/MonitorControl/HEAD/License.txt) (2026-11-14; license); [Official release activity](https://github.com/MonitorControl/MonitorControl/releases.atom) (2026-11-14; maintenance)
### Monitorian

Windows tray application for adjusting supported monitor brightness.

- **Platforms:** Windows. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful when external displays support software brightness controls.
- **Compare when:** Requires monitor and connection support for DDC/CI
- **Strengths:** Useful when external displays support software brightness controls.
- **Limitations:** Requires monitor and connection support for DDC/CI; Some docks or adapters prevent control.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-08. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/emoacht/Monitorian/releases.atom))
- [Official project](https://github.com/emoacht/Monitorian) · [Official installation / downloads](https://github.com/emoacht/Monitorian/releases) · [Repository](https://github.com/emoacht/Monitorian)
- **Sources:** [Official project documentation](https://github.com/emoacht/Monitorian) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/emoacht/Monitorian/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/emoacht/Monitorian/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/emoacht/Monitorian/releases.atom) (2026-11-14; maintenance)
### Twinkle Tray

Tray brightness controls

- **Platforms:** Windows. **License:** MIT. **Pricing model:** unknown.
- **Pick for:** Tray brightness controls
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Tray brightness controls
- **Limitations:** Monitor DDC/CI compatibility varies; brightness control is not a CPU/GPU speed optimization; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/xanderfrangos/twinkle-tray) · [Repository](https://github.com/xanderfrangos/twinkle-tray)
- **Sources:** [Preserved original research source](https://github.com/xanderfrangos/twinkle-tray) (2026-11-14; identity, features)

## GPU power and performance controls

### LACT

Linux GPU configuration and monitoring application for supported hardware.

- **Platforms:** Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for supported Linux GPU management through a desktop interface.
- **Compare when:** Available controls depend on vendor and driver
- **Strengths:** Useful for supported Linux GPU management through a desktop interface.
- **Limitations:** Available controls depend on vendor and driver; Clock and power changes require separate stability and thermal checks.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-09. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ilya-zlobintsev/LACT/releases.atom))
- [Official project](https://github.com/ilya-zlobintsev/LACT) · [Official installation / downloads](https://github.com/ilya-zlobintsev/LACT/releases) · [Repository](https://github.com/ilya-zlobintsev/LACT)
- **Sources:** [Official project documentation](https://github.com/ilya-zlobintsev/LACT) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/ilya-zlobintsev/LACT/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ilya-zlobintsev/LACT/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/ilya-zlobintsev/LACT/releases.atom) (2026-11-14; maintenance)

## Hardware identification

### CPU-X

Linux hardware-information application for processor, motherboard and system details.

- **Platforms:** Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for a Linux graphical counterpart to hardware-identification utilities.
- **Compare when:** The lead developer states that they are no longer maintaining CPU-X; review current activity before relying on new hardware support.
- **Strengths:** Useful for a Linux graphical counterpart to hardware-identification utilities.
- **Limitations:** The lead developer states that they are no longer maintaining CPU-X; review current activity before relying on new hardware support.; Hardware details depend on permissions and the operating system.
- **Maintenance:** unverified — The project README states that its lead developer is no longer maintaining CPU-X; continuing community maintenance has not been established. ([evidence](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X))
- [Official project](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X) · [Official installation / downloads](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X/releases) · [Repository](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X)
- **Sources:** [Official project documentation](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X) (2026-11-14; identity, features, platforms, maintenance); [Official download or installation landing page](https://github.com/TheTumultuousUnicornOfDarkness/CPU-X/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/TheTumultuousUnicornOfDarkness/CPU-X/HEAD/COPYING) (2026-11-14; license)
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

- **Platforms:** Linux. **License:** GPL-2.0-or-later main license; bundled components include GPL-3.0 and LGPL-2.1 terms. **Pricing model:** free.
- **Pick for:** Useful for collecting a structured Linux workstation hardware overview.
- **Compare when:** Synthetic results are workload-specific
- **Strengths:** Useful for collecting a structured Linux workstation hardware overview.
- **Limitations:** Synthetic results are workload-specific; Hardware detection depends on kernel and platform support.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-03. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/hardinfo2/hardinfo2/releases.atom))
- [Official project](https://hardinfo2.org/) · [Official installation / downloads](https://hardinfo2.org/) · [Repository](https://github.com/hardinfo2/hardinfo2)
- **Sources:** [Official project documentation](https://hardinfo2.org/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/hardinfo2/hardinfo2) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/hardinfo2/hardinfo2/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/hardinfo2/hardinfo2/releases.atom) (2026-11-14; maintenance)

## Hardware sensor monitoring

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
- **Pick for:** Temperature, fan, clock and voltage sensors
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Temperature, fan, clock and voltage sensors
- **Limitations:** Hardware/driver support varies; distinguish observation from unsafe tuning; avoid unrecommended UI as default; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) · [Repository](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor)
- **Sources:** [Preserved original research source](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) (2026-11-14; identity, features)

## Memory diagnostics

### MemTest86

PassMark standalone UEFI memory-testing software distributed as bootable media.

- **Platforms:** Bootable. **License:** Proprietary; Free and paid editions. **Pricing model:** freemium.
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
- **Pick for:** Useful for testing supported PC memory outside the installed operating system.
- **Compare when:** Runs from boot media rather than as a Linux desktop app
- **Strengths:** Useful for testing supported PC memory outside the installed operating system.
- **Limitations:** Runs from boot media rather than as a Linux desktop app; A clean run cannot exclude every intermittent hardware issue.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-15. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/memtest86plus/memtest86plus/releases.atom))
- [Official project](https://memtest.org/) · [Official installation / downloads](https://memtest.org/) · [Repository](https://github.com/memtest86plus/memtest86plus)
- **Sources:** [Official project documentation](https://memtest.org/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/memtest86plus/memtest86plus) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/memtest86plus/memtest86plus/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/memtest86plus/memtest86plus/releases.atom) (2026-11-14; maintenance)

## Application package management

### Scoop

User-oriented package installation and buckets

- **Platforms:** Windows. **License:** MIT. **Pricing model:** unknown.
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
- **Pick for:** Package discovery, installation and upgrades
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Package discovery, installation and upgrades
- **Limitations:** Source agreements and package licenses are separate; inspect upgrade plans; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/microsoft/winget-cli) · [Repository](https://github.com/microsoft/winget-cli)
- **Sources:** [Preserved original research source](https://github.com/microsoft/winget-cli) (2026-11-14; identity, features)

## Process inspection and management

### ListDLLs

Command-line loaded-DLL viewer.

- **Platforms:** Windows. **License:** Microsoft proprietary utility. **Pricing model:** unknown.
- **Pick for:** Command-line loaded-DLL viewer.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Command-line loaded-DLL viewer.
- **Limitations:** A loaded DLL is not necessarily malicious.; CLI output/inspection workflow inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/listdlls)
- **Sources:** [Preserved original research source](https://learn.microsoft.com/en-us/sysinternals/downloads/listdlls) (2026-11-14; identity, features)
### Process Explorer

Handle and DLL ownership investigation; process tree

- **Platforms:** Windows. **License:** Microsoft Sysinternals proprietary terms. **Pricing model:** unknown.
- **Pick for:** Handle and DLL ownership investigation; process tree
- **Compare when:** Measure time to identify a synthetic locked file versus Task Manager
- **Strengths:** Handle and DLL ownership investigation; process tree
- **Limitations:** Elevated inspection exposes process details; termination can lose work; Behavioral inspiration only; documentation repository is not a license to copy binary implementation
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer)
- **Sources:** [Preserved original research source](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer) (2026-11-14; identity, features)
### Process Lasso

Persistent process rules, CPU affinity/sets and ProBalance

- **Platforms:** Windows. **License:** Proprietary; free edition plus paid Pro; current vendor matrix requires commercial license within 30 days. **Pricing model:** unknown.
- **Pick for:** Persistent process rules, CPU affinity/sets and ProBalance
- **Compare when:** Randomized baseline versus one rule: p95 input latency, build time, power and rollback
- **Strengths:** Persistent process rules, CPU affinity/sets and ProBalance
- **Limitations:** Scheduler/power changes can worsen particular workloads; no universal FPS claim; Behavioral inspiration only; independent policy engine with exportable rules, no proprietary code copying
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://bitsum.com/apps/process-lasso/docs/)
- **Sources:** [Preserved original research source](https://bitsum.com/apps/process-lasso/docs/) (2026-11-14; identity, features); [Preserved original research source](https://bitsum.com/process-lasso-free-vs-pro/) (2026-11-14; identity, features); [Preserved original research source](https://dl.bitsum.com/terms-of-use/) (2026-11-14; identity, features)
### System Informer

Detailed resources, process inspection and debugging

- **Platforms:** Windows. **License:** MIT main repository; audit driver/dependency licenses. **Pricing model:** unknown.
- **Pick for:** Detailed resources, process inspection and debugging
- **Compare when:** Compare handle diagnosis and idle overhead with Process Explorer on same workload
- **Strengths:** Detailed resources, process inspection and debugging
- **Limitations:** Kernel driver and process manipulation require separate informed approval; Candidate reusable code under MIT notices; isolate privileged driver from UI
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/winsiderss/systeminformer) · [Repository](https://github.com/winsiderss/systeminformer)
- **Sources:** [Preserved original research source](https://github.com/winsiderss/systeminformer) (2026-11-14; identity, features)

## System and GPU resource monitoring

### bottom

Cross-platform terminal process and system-resource monitor written in Rust.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for a consistent terminal monitoring interface across desktop platforms.
- **Compare when:** Sensor and process details vary by OS
- **Strengths:** Useful for a consistent terminal monitoring interface across desktop platforms.
- **Limitations:** Sensor and process details vary by OS; No background historical database is implied.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ClementTsang/bottom/releases.atom))
- [Official project](https://clementtsang.github.io/bottom/) · [Official installation / downloads](https://github.com/ClementTsang/bottom#installation) · [Repository](https://github.com/ClementTsang/bottom)
- **Sources:** [Official project documentation](https://clementtsang.github.io/bottom/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/ClementTsang/bottom) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/ClementTsang/bottom#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ClementTsang/bottom/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/ClementTsang/bottom/releases.atom) (2026-11-14; maintenance)
### btop

Terminal resource monitor displaying CPU, memory, disk, network and process information.

- **Platforms:** Linux, macOS. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for monitoring a Unix-like desktop or server from one terminal view.
- **Compare when:** GPU and platform features depend on build and hardware
- **Strengths:** Useful for monitoring a Unix-like desktop or server from one terminal view.
- **Limitations:** GPU and platform features depend on build and hardware; Native Windows uses a separate related project.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-25. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/aristocratos/btop/releases.atom))
- [Official project](https://github.com/aristocratos/btop) · [Official installation / downloads](https://github.com/aristocratos/btop/releases) · [Repository](https://github.com/aristocratos/btop)
- **Sources:** [Official project documentation](https://github.com/aristocratos/btop) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/aristocratos/btop/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/aristocratos/btop/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/aristocratos/btop/releases.atom) (2026-11-14; maintenance)
### Glances

System monitoring application with terminal, web and export-oriented views.

- **Platforms:** Windows, macOS, Linux. **License:** LGPL-3.0. **Pricing model:** free.
- **Pick for:** Useful when one monitoring tool needs both local views and optional integrations.
- **Compare when:** The default development branch is Glances 5 beta; the project recommends stable version 4 for production and notes API incompatibilities.
- **Strengths:** Useful when one monitoring tool needs both local views and optional integrations.
- **Limitations:** The default development branch is Glances 5 beta; the project recommends stable version 4 for production and notes API incompatibilities.; Some plugins depend on external packages or privileges; Platform-specific metrics differ.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-07. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/nicolargo/glances/releases.atom))
- [Official project](https://nicolargo.github.io/glances/) · [Official installation / downloads](https://glances.readthedocs.io/en/latest/install.html) · [Repository](https://github.com/nicolargo/glances)
- **Sources:** [Official project documentation](https://nicolargo.github.io/glances/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/nicolargo/glances) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://glances.readthedocs.io/en/latest/install.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/nicolargo/glances/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/nicolargo/glances/releases.atom) (2026-11-14; maintenance)
### htop

Interactive terminal process viewer with filtering and resource meters.

- **Platforms:** Linux, macOS. **License:** GPL-2.0. **Pricing model:** free.
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
- **Sources:** [Official project documentation](https://github.com/Syllo/nvtop) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/Syllo/nvtop/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/Syllo/nvtop/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/Syllo/nvtop/releases.atom) (2026-11-14; maintenance)

## RGB lighting controls

### OpenRGB

Cross-vendor RGB lighting control application for supported computer components and peripherals.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for coordinating supported RGB devices through one application.
- **Compare when:** Support and device-specific cautions must be checked before use
- **Strengths:** Useful for coordinating supported RGB devices through one application.
- **Limitations:** Support and device-specific cautions must be checked before use; Not all proprietary lighting effects are reproducible.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://openrgb.org/) · [Official installation / downloads](https://openrgb.org/releases.html)
- **Sources:** [Official project documentation](https://openrgb.org/) (2026-11-14; identity, features, platforms, license); [Official download or installation landing page](https://openrgb.org/releases.html) (2026-11-14; downloads)

## Startup and persistence inventory

### Autoruns

Broad startup persistence inventory

- **Platforms:** Windows. **License:** Microsoft Sysinternals proprietary terms. **Pricing model:** unknown.
- **Pick for:** Broad startup persistence inventory
- **Compare when:** Read-only inventory a VM with known startup fixtures; compare coverage and reversible disable
- **Strengths:** Broad startup persistence inventory
- **Limitations:** Disabling services/drivers can break boot or protection; external reputation lookup may transmit data; Behavioral inspiration only; auditable read-only collectors before any modifier
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns)
- **Sources:** [Preserved original research source](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns) (2026-11-14; identity, features)

## Storage benchmarks

### CrystalDiskMark

Windows storage benchmark for sequential and random read/write workloads.

- **Platforms:** Windows. **License:** MIT. **Pricing model:** free.
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
- **Sources:** [Official project documentation](https://github.com/microsoft/diskspd) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/microsoft/diskspd/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/microsoft/diskspd/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/microsoft/diskspd/releases.atom) (2026-11-14; maintenance)
### fio

Configurable I/O workload generator and benchmark for storage testing.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for storage experiments requiring explicit workloads and reproducible parameters.
- **Compare when:** Poorly selected targets or write jobs can destroy data
- **Strengths:** Useful for storage experiments requiring explicit workloads and reproducible parameters.
- **Limitations:** Poorly selected targets or write jobs can destroy data; Results need workload and cache context.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-23. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/axboe/fio/releases.atom))
- [Official project](https://fio.readthedocs.io/) · [Official installation / downloads](https://github.com/axboe/fio/releases) · [Repository](https://github.com/axboe/fio)
- **Sources:** [Official project documentation](https://fio.readthedocs.io/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/axboe/fio) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/axboe/fio/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/axboe/fio/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/axboe/fio/releases.atom) (2026-11-14; maintenance)

## Drive health and SMART diagnostics

### CrystalDiskInfo

SSD/HDD health and SMART inspection

- **Platforms:** Windows. **License:** MIT main repository; audit bundled assets separately. **Pricing model:** unknown.
- **Pick for:** SSD/HDD health and SMART inspection
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** SSD/HDD health and SMART inspection
- **Limitations:** Healthy SMART is not proof a drive will not fail; back up before risky diagnostics; Potential source reference under listed license; retain notices and audit dependencies, exceptions, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://crystalmark.info/en/software/crystaldiskinfo/)
- **Sources:** [Preserved original research source](https://crystalmark.info/en/software/crystaldiskinfo/) (2026-11-14; identity, features); [Preserved original research source](https://github.com/hiyohiyo/CrystalDiskInfo) (2026-11-14; identity, features)
### GSmartControl

Graphical interface to smartctl for drive SMART data and self-test control.

- **Platforms:** Windows, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful when smartmontools data needs a desktop interface.
- **Compare when:** Depends on smartmontools and device/controller support
- **Strengths:** Useful when smartmontools data needs a desktop interface.
- **Limitations:** Depends on smartmontools and device/controller support; Drive health indicators cannot guarantee future reliability.
- **Maintenance:** unverified — Official release feed contains activity dated 2025-02-24. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ashaduri/gsmartcontrol/releases.atom))
- [Official project](https://gsmartcontrol.shaduri.dev/) · [Official installation / downloads](https://gsmartcontrol.shaduri.dev/downloads) · [Repository](https://github.com/ashaduri/gsmartcontrol)
- **Sources:** [Official project documentation](https://gsmartcontrol.shaduri.dev/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/ashaduri/gsmartcontrol) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://gsmartcontrol.shaduri.dev/downloads) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ashaduri/gsmartcontrol/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/ashaduri/gsmartcontrol/releases.atom) (2026-11-14; maintenance)
### smartmontools

Disk health tools for reading SMART information and running supported device self-tests.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for scriptable storage-health inspection across operating systems.
- **Compare when:** USB bridges and RAID controllers may hide SMART data
- **Strengths:** Useful for scriptable storage-health inspection across operating systems.
- **Limitations:** USB bridges and RAID controllers may hide SMART data; A passing self-test does not guarantee a drive will not fail.
- **Maintenance:** active — Official release feed contains activity dated 2025-05-31. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/smartmontools/smartmontools/releases.atom))
- [Official project](https://www.smartmontools.org/) · [Official installation / downloads](https://www.smartmontools.org/wiki/Download) · [Repository](https://github.com/smartmontools/smartmontools)
- **Sources:** [Official project documentation](https://www.smartmontools.org/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/smartmontools/smartmontools) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.smartmontools.org/wiki/Download) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/smartmontools/smartmontools/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/smartmontools/smartmontools/releases.atom) (2026-11-14; maintenance)

## Stress testing

### OCCT

Hardware stability testing and monitoring application for CPU, GPU and memory workloads.

- **Platforms:** Windows, Linux. **License:** Proprietary; personal and commercial edition terms. **Pricing model:** freemium.
- **Pick for:** Useful for controlled component-stability testing with visible sensors.
- **Compare when:** Stress workloads increase heat and power demand
- **Strengths:** Useful for controlled component-stability testing with visible sensors.
- **Limitations:** Stress workloads increase heat and power demand; Edition and platform features differ.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.ocbase.com/) · [Official installation / downloads](https://www.ocbase.com/download)
- **Sources:** [Official project documentation](https://www.ocbase.com/) (2026-11-14; identity, features, license, pricing); [Official download or installation landing page](https://www.ocbase.com/download) (2026-11-14; downloads)
### stress-ng

System stress tool with many CPU, memory, filesystem and kernel exercise workloads.

- **Platforms:** Linux, macOS. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for targeted Linux stress experiments and regression reproduction.
- **Compare when:** Available stressors vary by OS and privilege
- **Strengths:** Useful for targeted Linux stress experiments and regression reproduction.
- **Limitations:** Available stressors vary by OS and privilege; Stress results are not a general-purpose performance ranking.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-03. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ColinIanKing/stress-ng/releases.atom))
- [Official project](https://github.com/ColinIanKing/stress-ng) · [Official installation / downloads](https://github.com/ColinIanKing/stress-ng/releases) · [Repository](https://github.com/ColinIanKing/stress-ng)
- **Sources:** [Official project documentation](https://github.com/ColinIanKing/stress-ng) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/ColinIanKing/stress-ng/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ColinIanKing/stress-ng/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/ColinIanKing/stress-ng/releases.atom) (2026-11-14; maintenance)

## System snapshots and rollback

### Snapper

Linux filesystem snapshot manager with comparison and rollback support.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Well suited to Btrfs installations that need inspectable system rollback points.
- **Compare when:** Filesystem and distribution integration determine supported rollback behavior
- **Strengths:** Well suited to Btrfs installations that need inspectable system rollback points.
- **Limitations:** Filesystem and distribution integration determine supported rollback behavior; Snapshots on the same disk are not off-device backups.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-07. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/openSUSE/snapper/releases.atom))
- [Official project](https://github.com/openSUSE/snapper) · [Official installation / downloads](https://github.com/openSUSE/snapper#installing-and-running-snapper) · [Repository](https://github.com/openSUSE/snapper)
- **Sources:** [Official project documentation](https://github.com/openSUSE/snapper) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/openSUSE/snapper#installing-and-running-snapper) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/openSUSE/snapper/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/openSUSE/snapper/releases.atom) (2026-11-14; maintenance)
### Timeshift

Linux system restore snapshots using rsync or supported Btrfs layouts.

- **Platforms:** Linux. **License:** GPL-2.0-or-later per the current project Debian copyright; component notices apply. **Pricing model:** free.
- **Pick for:** Useful for restoring a Linux system after problematic updates.
- **Compare when:** Designed for system files rather than a substitute for personal-data backups
- **Strengths:** Useful for restoring a Linux system after problematic updates.
- **Limitations:** Designed for system files rather than a substitute for personal-data backups; Btrfs mode requires a supported subvolume layout.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/linuxmint/timeshift/releases.atom))
- [Official project](https://github.com/linuxmint/timeshift) · [Official installation / downloads](https://github.com/linuxmint/timeshift/releases) · [Repository](https://github.com/linuxmint/timeshift)
- **Sources:** [Official project documentation](https://github.com/linuxmint/timeshift) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/linuxmint/timeshift/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/linuxmint/timeshift/HEAD/debian/copyright) (2026-11-14; license); [Official release activity](https://github.com/linuxmint/timeshift/releases.atom) (2026-11-14; maintenance)

## Application uninstallers

### Bulk Crap Uninstaller

Batch uninstall orchestration and leftover review

- **Platforms:** Windows. **License:** Apache-2.0. **Pricing model:** unknown.
- **Pick for:** Batch uninstall orchestration and leftover review
- **Compare when:** Disposable VM fixtures: missed leftovers, false positives, shared files preserved
- **Strengths:** Batch uninstall orchestration and leftover review
- **Limitations:** Leftover detection can include shared data; never bulk-delete unchecked results; Candidate adapter orchestration under Apache notices/patent terms; separate inventory from execution
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller) · [Repository](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller)
- **Sources:** [Preserved original research source](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller) (2026-11-14; identity, features)
### Revo Uninstaller

Built-in uninstaller followed by leftover scan; Hunter Mode

- **Platforms:** Windows. **License:** Proprietary freeware; separate paid Pro terms. **Pricing model:** unknown.
- **Pick for:** Built-in uninstaller followed by leftover scan; Hunter Mode
- **Compare when:** Compare against BCUninstaller using identical installers and shared-file sentinels
- **Strengths:** Built-in uninstaller followed by leftover scan; Hunter Mode
- **Limitations:** Registry/file cleanup and permanent erase are destructive; restore points are not full backups; Behavioral inspiration only; no permission to reuse proprietary code/assets
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.revouninstaller.com/products/revo-uninstaller-free/)
- **Sources:** [Preserved original research source](https://www.revouninstaller.com/products/revo-uninstaller-free/) (2026-11-14; identity, features)

## Virtual machine environments

### GNOME Boxes

GNOME application for creating and using virtual machines with a simplified interface.

- **Platforms:** Linux. **License:** LGPL-2.1-or-later. **Pricing model:** free.
- **Pick for:** Useful for trying Linux desktop guests with a streamlined graphical setup.
- **Compare when:** Advanced virtualization controls are intentionally limited
- **Strengths:** Useful for trying Linux desktop guests with a streamlined graphical setup.
- **Limitations:** Advanced virtualization controls are intentionally limited; Acceleration requires suitable host hardware and permissions.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://apps.gnome.org/Boxes/) · [Official installation / downloads](https://apps.gnome.org/Boxes/)
- **Sources:** [Official project documentation](https://apps.gnome.org/Boxes/) (2026-11-14; identity, features, platforms, downloads); [Official application metadata license](https://raw.githubusercontent.com/GNOME/gnome-boxes/HEAD/data/org.gnome.Boxes.metainfo.xml.in) (2026-11-14; license)
### Multipass

Canonical tool for launching and managing Ubuntu virtual machines from the command line.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful for quickly creating Ubuntu-based development or administration labs.
- **Compare when:** Focused on Ubuntu images
- **Strengths:** Useful for quickly creating Ubuntu-based development or administration labs.
- **Limitations:** Focused on Ubuntu images; Hypervisor support and resource needs vary by host OS.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/canonical/multipass/releases.atom))
- [Official project](https://multipass.run/) · [Official installation / downloads](https://multipass.run/install) · [Repository](https://github.com/canonical/multipass)
- **Sources:** [Official project documentation](https://multipass.run/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/canonical/multipass) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://multipass.run/install) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/canonical/multipass/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/canonical/multipass/releases.atom) (2026-11-14; maintenance)
### QEMU

Machine emulator and virtualizer supporting multiple architectures and hardware models.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 and compatible component licenses. **Pricing model:** free.
- **Pick for:** Useful for architecture emulation and configurable virtual-machine research.
- **Compare when:** Performance depends strongly on acceleration and host/guest architecture
- **Strengths:** Useful for architecture emulation and configurable virtual-machine research.
- **Limitations:** Performance depends strongly on acceleration and host/guest architecture; Direct command-line setup is more involved than a desktop frontend.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-10. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/qemu/qemu/releases.atom))
- [Official project](https://www.qemu.org/) · [Official installation / downloads](https://www.qemu.org/download/) · [Repository](https://github.com/qemu/qemu)
- **Sources:** [Official project documentation](https://www.qemu.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/qemu/qemu) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.qemu.org/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/qemu/qemu/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/qemu/qemu/releases.atom) (2026-11-14; maintenance)
### UTM

Mac virtualization and emulation application built around QEMU and Apple virtualization technologies.

- **Platforms:** macOS. **License:** Apache-2.0 application plus QEMU components. **Pricing model:** mixed.
- **Pick for:** Useful for Mac users who want a graphical interface to supported virtual machines and emulation.
- **Compare when:** Guest acceleration depends on the chosen backend and architecture
- **Strengths:** Useful for Mac users who want a graphical interface to supported virtual machines and emulation.
- **Limitations:** Guest acceleration depends on the chosen backend and architecture; App Store distribution and direct download differ in purchase model.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-18. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/utmapp/UTM/releases.atom))
- [Official project](https://mac.getutm.app/) · [Official installation / downloads](https://mac.getutm.app/) · [Repository](https://github.com/utmapp/UTM)
- **Sources:** [Official project documentation](https://mac.getutm.app/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/utmapp/UTM) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/utmapp/UTM/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/utmapp/UTM/releases.atom) (2026-11-14; maintenance)
### Virtual Machine Manager

Graphical manager for libvirt virtual machines and their host resources.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
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
