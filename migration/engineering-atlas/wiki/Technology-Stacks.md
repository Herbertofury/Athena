[← Atlas home](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home) · [Canonical source](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/stack-selection.md)

# Choose the stack by the constraint

**Status: decision framework; candidates are not comparative benchmark winners. Reviewed 2026-10-26.**

Start with a one-page decision record: target OS/devices, offline needs, native integration, workload size, latency/memory budgets, security boundaries, deployment/update requirements and team expertise. An existing working stack gets a fair baseline before a rewrite is proposed.

| Workload | Candidate | Choose when | Disqualifying test |
|---|---|---|---|
| Desktop product with a substantial existing web UI | Electron + typed UI + isolated native/worker services | Shared browser behavior and existing integration matter | Installed startup, RAM, input latency and privileged IPC fail the project's budget |
| Desktop tool with a Rust core and web UI | Tauri | A narrow native boundary and system-webview testing fit the product | Required webview/platform behavior or plugins fail target-device tests |
| Windows-first native desktop app | WinUI 3 / Windows App SDK with C# or C++ | Windows-native integration and accessibility dominate | Cross-platform requirements or deployment constraints make it unsuitable |
| Existing mature desktop app | Improve the current architecture first | Profiling finds local algorithm/IO/threading problems | A measured prototype proves replacement pays its migration and regression costs |
| Static reference/catalog site | HTML/CSS/JS, generated data where useful | No private server operation is required | Authentication secrets, authoritative writes or private API operations require a backend |
| File/archive-heavy native service | Rust or another existing systems runtime | Safety, bounded memory and deployment integration fit | Serialization/process boundaries erase the measured benefit |
| Minecraft mod | The target version's actual loader/JDK/API | Compatibility is the product requirement | Newer language/loader cannot run with the required modpack |
| Game prototype or tool | Engine/runtime matching the target platforms and art pipeline | A vertical slice proves the workflow | Export, renderer, licensing or deployment requirements fail |

Electron and Tauri both require careful process boundaries; neither makes slow algorithms disappear. Microsoft currently recommends WinUI 3 for new general-purpose Windows apps, not for every cross-platform workload. These are source-backed platform facts, not a measured ranking. [E01](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/sources.md#e01)[T01](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/sources.md#t01)[W01](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/sources.md#w01)

Before adopting a candidate, build the **same vertical slice**: import representative data, identify all items, render real UI, cancel/restart, save/reopen and update/uninstall. Compare complete latency, p95 input delay, memory/IO peaks, accessibility and maintenance cost. Record why the runner-up lost.
