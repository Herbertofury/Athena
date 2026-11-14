# Windows PC Optimization: measure first, change deliberately

**Research reviewed:** 2026-11-14. **Status:** documented candidates, not measured improvements on the owner's PC. No Windows settings were changed. This is an organized decision guide, not a one-click debloat preset.

## Find your goal

| Goal | Start here | Evidence required before calling it better |
|---|---|---|
| Find files instantly | [Search and desktop](#search-and-desktop) | Same filename/content queries, correct results, cold/warm latency |
| Recover an unresponsive app | [End Task](#end-task-without-opening-task-manager) | Disposable app test; accept possible lost edits |
| Less startup/background noise | [Startup and services](#startup-and-services) | Startup trace, idle resources, essential workflows still working |
| Reclaim disk safely | [Storage](#storage-and-cleanup) | Bytes reclaimed, restore test, offline assets retained |
| Faster sustained work | [CPU and power](#cpu-power-and-thermals) | Real task duration, temperatures, watts, stability |
| Smoother games or creation viewport | [GPU and gaming](#gpu-display-and-gaming) | Frame times and input latency, not just average FPS |
| Faster builds | [Developer workloads](#developer-workloads) | Clean/incremental builds, restore, tests, durable files |

Related: [Windows utilities and creation tools](Engineering-Windows-Utilities-and-Creation-Tools.md), [developer cleanup catalog](../research/developer-cleanup-2026-11-14/README.md), [measurement worksheet](../research/windows-optimization-2026-11-14/BENCHMARK.md). GitHub stars and review ratings are discovery signals, not evidence that a tweak improves this machine.

## Measure and recover first

1. Record Windows edition/build, hardware, driver versions, power mode, free space and the exact slow task. Keep account names, paths, traces and serials private.
2. Save work and a tested backup. Record each original setting and how to restore it. A restore point is not a substitute for a file backup.
3. Measure baseline and one changed variable with the same workload and conditions. Repeat, separating cold startup from warm-cache runs. Include task correctness and background workload.
4. Use Task Manager for triage; use Microsoft's [Windows Performance Recorder](https://learn.microsoft.com/en-us/windows-hardware/test/wpt/windows-performance-recorder) and [Analyzer](https://learn.microsoft.com/en-us/windows-hardware/test/wpt/windows-performance-analyzer) when the bottleneck is unclear. ETW traces can contain private information; do not publish raw personal-machine traces.
5. Accept only reproducible, worthwhile improvement without correctness, security, accessibility, battery or reliability regressions. Keep failed results and restore the original configuration otherwise.

## Search and desktop

### Everything alongside Windows Search

**Good candidate:** Everything for filename/path lookup across large local file collections. Its [official documentation](https://www.voidtools.com/support/everything/) describes its fast filename index. That is vendor documentation, not an Athena benchmark.

**Do not automatically disable Windows Search.** Windows Search has [content/property indexing and integration responsibilities](https://learn.microsoft.com/en-us/windows/win32/search/-search-indexing-process-overview), including supported application stores. Everything's content and system-index functions vary by version; some searches may use the Windows index. Check the installed release's [search functions](https://www.voidtools.com/support/everything/search_functions/) instead of assuming feature parity.

**Trial:** install only the official release, leave Windows Search intact, and compare known filename, document-content and application-search tasks. Start with Everything's default local search. Do not expose its HTTP/ETP servers or index private/network locations without separate need and approval. The [Everything service](https://www.voidtools.com/support/everything/everything_service/) enables privileged indexing while the UI need not run elevated; installing a service is not the same as replacing a Windows service.

If Windows indexing consumes excessive resources, inspect its selected locations and [Microsoft's indexing diagnostics](https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/windows-search-performance-issues). Reduce unnecessary scope before considering disabling functionality. Record the original scope; restore it to roll back. Rebuilding an index can temporarily create work, so do not use repeated rebuilds as a performance ritual.

**Acceptance:** correct filename and content results, acceptable index build/idle costs, working Start/application workflows, no unexpected remote access. Everything is freeware, not automatically a source-code base available for reuse.

### End Task without opening Task Manager

On Windows 11 **25H2 and later**, open **Settings → System → Advanced → Taskbar → End Task**. Earlier releases may expose the option under **For developers**; use the actual build's UI. [Microsoft documents the move and feature](https://learn.microsoft.com/en-us/windows/advanced-settings/). Do not enable Developer Mode merely for this convenience.

Enable the toggle, then right-click a running app's taskbar icon. Force termination can lose unsaved data: use normal Close first, and test only with disposable work. Roll back by switching End Task off. This saves clicks; it is not an FPS or CPU-speed improvement.

## Startup and services

| Action | Safe scope | Rollback and stop condition |
|---|---|---|
| Review startup applications | Task Manager Startup apps; identify owner and necessity first | Re-enable the item if sync, accessibility, peripherals or security stops working |
| Inspect persistent launch entries | [Microsoft Autoruns](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns); inspect third-party entries; uncheck rather than delete | Recheck exact entry; retain original configuration; do not upload files to reputation services automatically |
| Diagnose software conflicts | [Microsoft clean boot procedure](https://support.microsoft.com/en-us/windows/experience/startup-boot/how-to-perform-a-clean-boot-in-windows); hide Microsoft services before diagnostic third-party disablement | Restore normal startup after diagnosis; not a permanent optimization recipe |
| Replace a background utility | Establish its dependencies, actual resource cost and feature parity first | Keep installer/configuration and test reversible replacement before removing original |

**There is no universal list of Windows services to “clean.”** Athena policy: do not trade away Defender, firewall, updates, encryption or core OS dependencies for benchmark scores. Do not apply bulk service-disable scripts or registry-cleaner sweeps. A missing process is not proof of a faster or safer PC. Prefer removing an unwanted application through its supported uninstaller over deleting its service manually.

## Storage and cleanup

Use **Settings → System → Storage** to inspect usage before deleting. Review [Storage Sense](https://support.microsoft.com/en-us/windows/experience/storage-filemanagement/manage-drive-space-with-storage-sense) categories and retention periods. Recycle Bin cleanup removes a recovery path; Downloads and cloud-content handling require particular care. Cloud files becoming online-only is not the same as deletion, but may break offline work.

For media, models, game mods and build inputs, confirm a usable retained copy before cleanup. Protect required offline assets. Disable future scheduled cleanup to roll back configuration, but that does **not** restore files already deleted: backups/recovery are separate. Prefer a disk analyzer when the goal is understanding space. Do not clear every application cache by default: measure subsequent rebuild/download costs as part of the trial.

## CPU, power and thermals

**Baseline: Balanced.** Trial **Best performance** only for a measured, plugged-in workload. In Windows 11, **Settings → System → Power & battery → Power mode**, select the relevant power source. [Microsoft's instructions](https://support.microsoft.com/en-us/windows/experience/change-the-power-mode-for-your-windows-pc) explain the available modes and how a custom power plan can affect selection. Restore the exact prior mode afterward if the benefit is not worthwhile.

Measure sustained task time alongside heat, fan noise, energy and stability. Best performance is not a universal recommendation for every desktop, and forcing a 100% minimum CPU state is not this guide's default. Cooling and workload bottlenecks matter; short synthetic wins do not establish sustained benefit.

**Expert-only candidates:** overclocking, undervolting, memory timing/XMP/EXPO and firmware changes. They need exact hardware support, known recovery, vendor instructions and extended correctness tests. [Intel XTU compatibility](https://www.intel.com/content/www/us/en/support/articles/000005774/processors-processor-utilities-and-programs.html) is model-specific. If a utility conflicts with virtualization-based security, do not disable protection to accommodate it. This guide provides no universal voltage/frequency values and makes no warranty or stability guarantee.

## GPU, display and gaming

### Correct GPU, then presentation

Under **Settings → System → Display → Graphics**, inspect per-application GPU preference. On multi-GPU systems, test the intended renderer rather than assuming a global override is best. Restore **Let Windows decide** or the recorded original preference if unsuitable; restart the app after changes.

[Optimizations for windowed games](https://support.microsoft.com/en-us/windows/hardware/display-graphics/optimizations-for-windowed-games-in-windows-11) specifically target compatible **DirectX 10/11 windowed/borderless games**. Test the global or per-app setting and restart the game. Auto HDR can enable the option automatically, so record both settings. Do not generalize this result to all DX12/Vulkan games or creation software.

[NVIDIA FrameView](https://www.nvidia.com/en-eu/geforce/technologies/frameview/) records frame-rate/frame-time and supported power measurements. Record tool/version and metric availability; power readings across GPU vendors may not describe equivalent quantities. Use matching game scene/resolution/settings, repeated runs and frame-time tails. A smoother viewport and a faster render are different goals.

### Hardware tuning is a separate experiment

[AMD tuning documentation](https://www.amd.com/en/resources/support-articles/faqs/DH3-020.html) is device/driver dependent. Save the original profile and learn the supported reset path before testing. A successful stress test alone does not establish stability for long renders, video encoding, AI workloads or games. Retain crash/artifact evidence; no automatic overclock/undervolt prescriptions here.

## Developer workloads

[Dev Drive](https://learn.microsoft.com/en-us/windows/dev-drive/) is a candidate for Windows development storage, not a general replacement for every volume. Validate current build/hardware requirements and migration/backup needs first. [Defender performance mode](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-endpoint-antivirus-performance-mode) is designed for designated Dev Drives with protection retained, not a reason to broadly exclude project trees or disable antivirus. Do not infer WSL performance gains from Windows-native results.

Compare package restore, clean/incremental builds, test results, disk usage and reliable reads/writes. Changing a filesystem or security trust setting requires a separate planned operation; this documentation performs neither.

## Evidence and promotion rules

- **Documented:** primary source describes feature/constraints. This page's current tier.
- **Locally tested:** a specific machine/workload has retained raw measurements and correctness checks.
- **Recommended for that workload:** paired baseline comparison shows a worthwhile improvement, requirements intact, rollback verified.
- **Not established:** “best optimizer,” universal service replacements, guaranteed FPS boosts, lowest latency for every application, or superiority based on stars alone.

Use the [benchmark worksheet](../research/windows-optimization-2026-11-14/BENCHMARK.md) before upgrading a candidate's evidence tier. The [source register](../research/windows-optimization-2026-11-14/SOURCES.md) separates documentation from measurements. Repository wiki source publication does not itself prove that the separate live GitHub Wiki was synchronized.
