# Windows PC tools: research and comparison atlas

**105 deduplicated candidates across 42 categories**, observed 2026-11-14. This is a broad research tranche, not every tool in existence, a measured best-of ranking, or Windows runtime certification. The [original 66-tool cleanup snapshot](../developer-cleanup-2026-11-14/README.md) is unchanged and may overlap this catalog.

[Open the sortable table](https://herbertofury.github.io/Athena/research/windows-utilities-2026-11-14/) · [JSON](catalog.json)

## How to use it

- Filter by category and search features, licensing, evidence or risks. Sort by GitHub stars or editorial evaluation priority.
- Ratings and review counts sort only within the selected provider and original scale. Two retained SourceForge snapshots are historical, self-selected feedback, not safety or current-version evidence. Unknown is not zero.
- Priority 1/2/3 is an evaluation starting order, not proof of superiority. New specialist/discovery rows remain candidates. Some prerequisites and component licenses are explicitly unresolved.
- Research sources include vendor documentation, GitHub, GitLab and project-hosted code. Inspect exact pinned licenses, dependencies, assets and models before reusing code. Proprietary tools are workflow inspiration only.
- No installation, security change, private capture, live malware execution or benchmark was performed in this pass.

[Detailed process-interaction investigation guide](PROCESS-ATTACHMENT-GUIDE.md)

## Security: processes interacting with processes

Process handles, loaded DLLs and remote-thread events are observations, not malware verdicts. Begin with Process Explorer/System Informer for context, Process Monitor for activity, and bounded Sysmon telemetry where separately authorized. PE-sieve and Hollows Hunter investigate suspicious memory; false positives and coverage limits require correlation. Malwarebytes is a scanner/remediation product; Tron is a broad modification/remediation bundle, not an attachment detector or default optimization. Do not stack security products or run cleanup scripts to diagnose an unexplained process.

## Coverage index

- [3d-assets](#3d-assets) — 5 candidates
- [accessibility](#accessibility) — 1 candidates
- [animation](#animation) — 3 candidates
- [archive](#archive) — 2 candidates
- [asset-management](#asset-management) — 1 candidates
- [audio](#audio) — 5 candidates
- [backup](#backup) — 6 candidates
- [cad](#cad) — 2 candidates
- [cleanup](#cleanup) — 5 candidates
- [compositing](#compositing) — 1 candidates
- [developer](#developer) — 6 candidates
- [display](#display) — 1 candidates
- [file-management](#file-management) — 4 candidates
- [hardware-monitoring](#hardware-monitoring) — 2 candidates
- [materials](#materials) — 3 candidates
- [modeling](#modeling) — 3 candidates
- [networking](#networking) — 3 candidates
- [photo](#photo) — 2 candidates
- [photo-art](#photo-art) — 2 candidates
- [photogrammetry](#photogrammetry) — 1 candidates
- [pixel-art](#pixel-art) — 1 candidates
- [process](#process) — 3 candidates
- [productivity](#productivity) — 8 candidates
- [security](#security) — 6 candidates
- [security/activity tracing](#security-activity tracing) — 1 candidates
- [security/adware remediation](#security-adware remediation) — 1 candidates
- [security/detection engineering](#security-detection engineering) — 1 candidates
- [security/endpoint inventory](#security-endpoint inventory) — 1 candidates
- [security/endpoint investigation](#security-endpoint investigation) — 1 candidates
- [security/endpoint telemetry](#security-endpoint telemetry) — 1 candidates
- [security/event-log forensics](#security-event-log forensics) — 2 candidates
- [security/file trust](#security-file trust) — 1 candidates
- [security/injection hunting](#security-injection hunting) — 3 candidates
- [security/malware scanning](#security-malware scanning) — 5 candidates
- [security/managed endpoint monitoring](#security-managed endpoint monitoring) — 1 candidates
- [security/memory forensics](#security-memory forensics) — 2 candidates
- [security/network inspection](#security-network inspection) — 1 candidates
- [security/pattern matching](#security-pattern matching) — 1 candidates
- [security/process inspection](#security-process inspection) — 1 candidates
- [security/repair orchestration](#security-repair orchestration) — 1 candidates
- [security/static file analysis](#security-static file analysis) — 1 candidates
- [video](#video) — 4 candidates

## 3d-assets

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Blender](https://www.blender.org/about/license/) | Integrated modeling, geometry workflows, animation and asset production | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPL; inspect current exact release/component license (website and source can differ); GPL code reuse needs compatible distribution; artwork is not automatically GPL; independent file/CLI adapter avoids coupling | Complex scenes exceed GPU/RAM; add-ons and assets have independent licenses; Golden mesh roundtrip: topology, UVs, normals, units, materials and export hashes; render time/peak RAM |
| [MeshLab / PyMeshLab](https://github.com/cnr-isti-vclab/meshlab) | Mesh cleaning, reconstruction, texture and format conversion | Windows binary; exact OS/GPU minimum unverified; official documentation inspected; not installed or benchmarked | GPL3; Python filter adapter candidate; GPL obligations need review | Repair can alter topology, UVs and attributes; Measure topology, units, UVs, normals and metadata after synthetic mesh repair |
| [Instant Meshes](https://github.com/wjakob/instant-meshes) | Interactive field-aligned mesh generation and retopology | Intel64 Windows binary; current build compatibility unverified; official documentation inspected; not installed or benchmarked | BSD3-style plus contributed-enhancements grant; preserve full license; Focused algorithm candidate after full LICENSE and maintenance review | Older compiler guidance; not a complete asset pipeline; Compare topology and feature preservation against source mesh |
| [ArmorPaint](https://github.com/armory3d/armorpaint) | GPU PBR painting, layers, nodes and baking | Official manual recommends Windows10+; portable; official documentation inspected; not installed or benchmarked | zlib/libpng core; assets and dependencies separate; Permissive core candidate for painting architecture; inspect dependencies | Neural models, assets and packaged binary access have separate terms; Material-channel roundtrip, GPU memory, cancellation and source preservation |
| [F3D](https://github.com/f3d-app/f3d) | Minimal 3D viewing and preview workflow | Windows release and hardware requirements unverified; attempted install link404; official documentation inspected; not installed or benchmarked | BSD3; Lightweight preview code candidate under BSD notices | Viewer is not model creation; unsupported formats require explicit handling; Compare bounded mesh preview latency, memory and missing attributes |

## accessibility

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [NVDA](https://www.nvaccess.org/about-nvda/) | Screen reading, braille and keyboard accessibility | Current page recommends Windows 11 64-bit; AMD64/ARM64; older minimum differs; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | GPL-2.0-or-later with non-GPL plugin/driver and Microsoft distributable exceptions; Potential source reference under listed license; retain notices and audit dependencies, exceptions, trademarks and assets before integration. | Validate with actual assistive workflows; addons and remote help need separate review; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## animation

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Synfig Studio](https://www.synfig.org/) | Vector tweening, bitmap cutout bones and linked parameters | Official site lists Windows 7+, 2GHz dual core and 2GB RAM; validate selected binary; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPLv3; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Stable and development downloads differ; old OS support is not an OS security recommendation; Animation timing, interpolation, render and project reopen tests |
| [OpenToonz](https://opentoonz.github.io/e/) | 2D ink/paint and animation production; effect SDK | Windows release requirements need follow-up verification; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | New BSD source license; installer rules separate; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Source license does not grant rights to studio sample artwork; Raster/vector scene reopen, frame timing and effect export fixtures |
| [Pencil2D](https://www.pencil2d.org/) | Hand-drawn animation with raster/vector workflows | Official site confirms Windows; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPL-2.0 repository classification; pin exact release/file notices; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Stable release and nightly installers differ; Onion skin, frame timing, tablet input and lossless export fixtures |

## archive

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [7-Zip](https://www.7-zip.org/) | Archive creation and extraction | Windows x64, ARM64 and x86 downloads; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | Mostly LGPL; BSD-3-Clause parts; unRAR restrictions; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Audit unRAR scope before code reuse; test malformed archives and extraction path containment; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [PeaZip](https://peazip.github.io/) | Multi-format archive UI around compression backends | Windows download explicitly available; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | Open-source multi-component tool; precise component licenses require review; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only. | Do not infer common license for included compression engines; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## asset-management

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [PureRef](https://www.pureref.com/) | Reference boards, image arrangement, annotations and always-on-top viewer | Official site confirms Windows; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary; inspect license agreement for chosen use; Proprietary product: workflow inspiration only; no code or asset copying. | Reference-image possession does not grant reuse rights; Large-board memory, image quality, save/reopen and portable links |

## audio

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Audacity](https://github.com/audacity/audacity) | Multitrack recording/editing and export | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | Current README GPLv3; older manual says GPLv2, pin exact release; GPL code reuse after pinned LICENSE check; plugin/process boundary and nondestructive history are evaluation targets | Plugins/codecs separately licensed; destructive edits require project backup; Synthetic tones: sample count, clipping, resample error, project recovery and export metadata |
| [LMMS](https://github.com/LMMS/lmms) | Music sequencing and composition workflow | Windows download; exact minimum/version unverified; official documentation inspected; not installed or benchmarked | GPLv2 per license file; GPL composition architecture candidate, not audio-editor parity proof | Plugins and samples have separate rights and compatibility; Synthetic sequence export: timing, channels and project recovery |
| [REAPER](https://www.reaper.fm/) | Multitrack audio/MIDI, routing, scripting, portable operation and plugin support | Official Windows x64/x86; Windows 11 ARM64EC listed as beta; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary paid license; 60-day full evaluation, not permanent freeware; Proprietary product: workflow inspiration only; no code or asset copying. | ARM beta and plugin architectures differ; samples/extensions have separate licenses; ASIO latency, dropout, project reopen and plugin compatibility comparison |
| [FL Studio](https://www.image-line.com/fl-studio) | Beat sequencing, piano-roll composition, arrangement, instruments and effects | Official product page confirms Windows; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary; editions and optional FL Cloud plans differ; Proprietary product: workflow inspiration only; no code or asset copying. | Do not mistake optional cloud/rent-to-own plans for standalone terms; samples separate; Workflow speed, MIDI editing, plugin stability and export parity |
| [Ableton Live](https://www.ableton.com/en/live/) | Music creation and performance; step sequencing, automation and ARA 2 in current product page | Exact Windows requirements not inspected in this pass; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary; editions and rent-to-own terms differ; Proprietary product: workflow inspiration only; no code or asset copying. | Feature/edition and hardware compatibility need verification; Live performance dropout, clip arrangement and project exchange tests |

## backup

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [restic](https://github.com/restic/restic) | Encrypted deduplicating backup snapshots | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | BSD-2-Clause; Permissive code candidate with notices; reusable snapshot/restore verification patterns | Lost password prevents restore; prune removes history; backup is unproven until restored; Synthetic full+incremental backups then independent restore with exact hashes |
| [Kopia](https://github.com/kopia/kopia) | Encrypted deduplicated snapshots | Windows cross-platform CLI and GUI; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | Apache-2.0; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Test recovery of deleted files and a lost local index; key loss can make backups unrecoverable; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Duplicati](https://github.com/duplicati/duplicati) | Encrypted incremental cloud backup | Windows supported by current README; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT core; proprietary/ directory separately licensed; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Do not label entire distribution MIT; validate restore and database recovery; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Syncthing](https://github.com/syncthing/syncthing) | Peer-to-peer continuous synchronization | Windows binaries documented and signed; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MPL-2.0; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Synchronization can propagate deletions; compare versioning and recovery separately from backup; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [rclone](https://github.com/rclone/rclone) | Multi-provider cloud transfer and mount tooling | Official v1.76.0 downloads list Windows 10 or Server 2016 minimum; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | sync may delete destination files; cloud grants and storage charges require separate authorization; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [FreeFileSync](https://freefilesync.org/faq.php) | Visual folder comparison and synchronization | Native Windows supported; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | Edition-specific; business/government installation requires Business Edition license per FAQ; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only. | Do not treat free download as blanket commercial-use or source-reuse authorization; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## cad

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [FreeCAD](https://www.freecad.org/) | Parametric CAD; source mirrored beyond GitHub on GitLab/Codeberg/SourceForge | Official stable download requires Windows 10+, x86_64 installer and portable; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | LGPL2+ per official documentation; dependency/file licenses separately reviewed; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Weekly development builds explicitly not production-ready; Parametric edit, STEP roundtrip and topology regression fixtures |
| [OpenSCAD](https://openscad.org/) | Script-driven CAD candidate | Official Windows x64 installers and ZIPs; distinguish TEST releases and snapshots; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPLv2-or-later with CGAL linking exception per official project license inventory; selected binary dependencies separately reviewed; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Download page mixes test/snapshot releases; do not call newest stable without checking; Geometry validity and reproducible model generation fixtures |

## cleanup

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Bulk Crap Uninstaller](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller) | Batch uninstall orchestration and leftover review | Current README: Windows 7+ since v5; website older XP/Vista language conflicts; check chosen release; official documentation inspected; not installed or benchmarked | Apache-2.0; Candidate adapter orchestration under Apache notices/patent terms; separate inventory from execution | Leftover detection can include shared data; never bulk-delete unchecked results; Disposable VM fixtures: missed leftovers, false positives, shared files preserved |
| [Revo Uninstaller](https://www.revouninstaller.com/products/revo-uninstaller-free/) | Built-in uninstaller followed by leftover scan; Hunter Mode | Current FAQ: Windows 7–11 native 64-bit; Free and Pro distinct; official documentation inspected; not installed or benchmarked | Proprietary freeware; separate paid Pro terms; Behavioral inspiration only; no permission to reuse proprietary code/assets | Registry/file cleanup and permanent erase are destructive; restore points are not full backups; Compare against BCUninstaller using identical installers and shared-file sentinels |
| [WinDirStat](https://github.com/windirstat/windirstat) | Disk usage visualization, large-file discovery | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPL-3.0 repository classification; Copyleft candidate: inspect exact file licenses before distributing derivative code | Deletion is separate from inspection; junctions and hardlinks complicate accounting; Compare reported allocated/logical bytes on sparse, compressed and hardlinked fixtures |
| [Czkawka / Krokiet](https://github.com/qarmin/czkawka) | Duplicate and similar-image discovery | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | Mixed/component licenses; GitHub NOASSERTION is not approval; Reuse unresolved until component LICENSE files reviewed; consider bounded external adapter first | Similar image is not identical; preserve originals and review groups; Byte-identical, near-duplicate and distinct-image fixtures; false-positive rate before deletion |
| [BleachBit](https://github.com/bleachbit/bleachbit) | Application-specific cleanup definitions | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPL-3.0 repository classification; Copyleft definitions/engine candidate after exact component audit; declarative preview is useful architecture | Can erase sessions/history and useful caches; regeneration costs matter; Preview versus actual removal on disposable profile; protected files and rebuild latency |

## compositing

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Natron](https://natrongithub.github.io/) | Node-based compositor and OpenFX effects | Official Windows binaries; x86/x64 requirements described upstream; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPLv2; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Upstream asks for maintainers; snapshots may be unstable and plugin licenses vary; Node graph reopening, alpha/color fidelity and render regression fixtures |

## developer

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [DevToys](https://github.com/DevToys-app/DevToys) | Developer conversion and formatting utility suite | Windows 10/11 repository topics; exact build prerequisites pending; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT; third-party notices and extension terms separate; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Old embedded Store rating dated 2024 is not a current 2026 rating; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Windows Terminal](https://github.com/microsoft/terminal) | Tabbed terminal and console host tooling | Windows terminal application; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Terminal is not a shell or sandbox; test accessibility and large-output latency; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [PowerShell](https://github.com/PowerShell/PowerShell) | Cross-platform object-oriented shell and automation | Windows supported; release-specific lifecycle applies; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT core; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Scripts run with account privileges; no blanket execution-policy change; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Scoop](https://github.com/ScoopInstaller/Scoop) | User-oriented package installation and buckets | Windows command-line installer; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT; Potential source reference under listed license; retain notices and audit dependencies, exceptions, trademarks and assets before integration. | Package manifests and payload licenses/trust differ; do not blindly execute installation scripts; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [WinGet](https://github.com/microsoft/winget-cli) | Package discovery, installation and upgrades | Windows Package Manager; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT client; each package has its own terms; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Source agreements and package licenses are separate; inspect upgrade plans; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Notepad++](https://github.com/notepad-plus-plus/notepad-plus-plus) | Text/code editing and language support | Windows source editor; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | GPL-3.0 with project clarifications and exceptions; Potential source reference under listed license; retain notices and audit dependencies, exceptions, trademarks and assets before integration. | Plugins execute code; test large files and encoding round trips; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## display

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Twinkle Tray](https://github.com/xanderfrangos/twinkle-tray) | Tray brightness controls | Windows 10 and 11; compatible external displays; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Monitor DDC/CI compatibility varies; brightness control is not a CPU/GPU speed optimization; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## file-management

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Files](https://github.com/files-community/Files) | Tabs, file tags and multitasking navigation | Windows file manager; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT and MPL-2.0 files; audit per-file boundary; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Test rename/copy cancellation and Explorer fallback before replacement; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Double Commander](https://github.com/doublecmd/doublecmd) | Dual-pane file manager | Cross-platform; exact current Windows release requirements pending; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | GPL-2.0; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Test long paths, Unicode, junctions and copy conflict policies; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Total Commander](https://www.ghisler.com/) | Dual-pane file operations, archives and multi-rename | Official current Windows release; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | Proprietary/shareware; reuse not established; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only. | Behavioral inspiration only; verify paid terms and extension trust separately; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [Directory Opus](https://www.gpsoft.com.au/) | Queued copies, dual panes, metadata and batch rename | Native 64-bit Windows file manager; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | Proprietary commercial; reuse not established; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only. | Do not copy vendor performance superlatives into ranking; benchmark large-tree navigation; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## hardware-monitoring

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Libre Hardware Monitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) | Temperature, fan, clock and voltage sensors | Windows Forms GUI available; Avalonia UI marked in development; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MPL-2.0; third-party notices; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Hardware/driver support varies; distinguish observation from unsafe tuning; avoid unrecommended UI as default; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [CrystalDiskInfo](https://crystalmark.info/en/software/crystaldiskinfo/) | SSD/HDD health and SMART inspection | Windows x86/x64/ARM64 documented; NVMe requires Windows 10/Server 2016+; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT main repository; audit bundled assets separately; Potential source reference under listed license; retain notices and audit dependencies, exceptions, trademarks and assets before integration. | Healthy SMART is not proof a drive will not fail; back up before risky diagnostics; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## materials

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Material Maker](https://www.materialmaker.org/) | Godot-based procedural texture graph, PBR export and experimental painting | Official repository documents Windows availability; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | MIT by default unless files specify otherwise; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Community materials have separate rights; painting is explicitly experimental; PBR channel/normal conventions, graph determinism, texture seams and export tests |
| [Marmoset Toolbag](https://marmoset.co/) | Texture baking, painting and ray-traced/raster rendering | Exact Windows/GPU requirements unresolved; attempted requirements URL unavailable; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary commercial product; Proprietary product: workflow inspiration only; no code or asset copying. | Asset library rights and bake/GPU requirements separate; Normal-map tangent agreement, cage artifacts and target-engine rendering comparison |
| [Adobe Substance 3D Painter](https://www.adobe.com/products/substance3d/apps/painter.html) | Non-destructive 3D painting, UDIMs, smart masks, custom export presets and Python scripting | Exact Windows/GPU requirements linked by vendor but not inspected in this pass; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary; commercial subscription and education noncommercial terms differ; Proprietary product: workflow inspiration only; no code or asset copying. | Education use restrictions, assets and AI service rights require separate review; Bake-to-engine normal/color convention tests and stroke/project recovery |

## modeling

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Blockbench](https://blockbench.net/) | Low-poly modeling, UV templates, texture painting and rigged animation | Web app confirmed; exact current Windows binary requirements need verification; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPLv3 core; external API plugins/themes may be proprietary under exception; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Minecraft-specific formats and general meshes have different constraints; Target-game UV, pivot, animation and export roundtrip fixtures |
| [Houdini](https://www.sidefx.com/products/houdini/) | Procedural geometry, simulation, terrain, USD layout and look development | Houdini 22 official requirements: Windows 11 64-bit; Windows 10/Server unsupported; x86-64-v3 minimum since H21; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary; FX/Core/Indie/Education/Apprentice have distinct terms; Proprietary product: workflow inspiration only; no code or asset copying. | License eligibility/file restrictions and GPU/RAM needs must be checked; Target mesh/terrain/simulation fixtures with memory and deterministic recook measures |
| [Wings 3D](https://www.wings3d.com/) | Subdivision mesh modeling and AutoUV; explicitly no animation support | Official repository provides Windows build/binary guidance; requires working OpenGL driver, not DirectX; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Open source per official site; exact code license not inspected; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Not a full animation/DCC substitute; Mesh topology, UV preservation and export roundtrip comparison |

## networking

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [WinSCP](https://winscp.net/eng/docs/introduction) | SFTP, SCP, WebDAV and S3 plus automation | Windows file transfer client; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | GPL-3.0-or-later; installer/icons have separate terms; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Verify remote host identity; prefer encrypted transports; never expose stored credentials; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/) | SSH terminal and transfer companions | Windows and Unix supported; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | SSH agent forwarding expands exposure; Telnet is not encrypted; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [LocalSend](https://github.com/localsend/localsend) | Local network file transfer | Current README minimum Windows 10; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | Apache-2.0; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Verify intended receiver; do not disable encryption or firewall as a generic optimization; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## photo

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [RawTherapee](https://www.rawtherapee.com/) | Non-destructive floating-point RAW processing, demosaicing and pixel-shift workflows | Official Windows 64-bit and ARM64 downloads; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPLv3; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Camera-specific RAW behavior and color profiles require testing; Camera fixture color, highlight recovery and batch export comparison |
| [digiKam](https://www.digikam.org/) | Local photo/video catalog, EXIF/IPTC/XMP search, batch processing and RAW support | Official about page confirms Windows; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Open source; exact code SPDX not inspected here; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Remote-service plugins differ from local operation; faces/location are private data; Metadata preservation, duplicate-safe import and large-library search tests |

## photo-art

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Krita](https://krita.org/en/download/) | Digital painting and layered artwork | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPLv3; GPL engine reuse requires compliance; brushes/fonts/assets separately licensed; test interchange adapter | Color profiles and plugin compatibility can change exported appearance; Layered fixture roundtrip, ICC-aware export, tablet latency and crash recovery |
| [GIMP](https://gitlab.gnome.org/GNOME/gimp) | Layered raster editing, color management and batch export | Windows10 1903+ installer; Store requirements differ; official documentation inspected; not installed or benchmarked | GPLv3-or-later; Prefer plugins or batch adapter before full GPL-compatible fork | Plugin/file formats can lose layer or profile information; Layered image and ICC profile roundtrip with source unchanged |

## photogrammetry

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Meshroom](https://meshroom.org/) | Node-based photogrammetry and reconstruction workflows | Official Windows ZIP release exists; plugin/backend GPU requirements separately required; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | MPL-2.0 classification; review component licenses; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Nightly is explicitly unstable; backend CUDA/resource needs not verified in this pass; Known-scale image set: reconstruction completeness, accuracy, memory and textures |

## pixel-art

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [LibreSprite](https://libresprite.github.io/) | Sprite animation, onion skins, layers and tiled drawing | Upstream offers Windows downloads; verify chosen asset rather than old temporary binary; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPLv2; distinct from current proprietary Aseprite; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Release list includes temporary/continuous builds; do not choose an undocumented executable; Palette/transparency, sprite-sheet framing and animation timing tests |

## process

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Process Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer) | Handle and DLL ownership investigation; process tree | Current official page: Windows 11+, Server 2019+; v17.21 observed, not installed; official documentation inspected; not installed or benchmarked | Microsoft Sysinternals proprietary terms; Behavioral inspiration only; documentation repository is not a license to copy binary implementation | Elevated inspection exposes process details; termination can lose work; Measure time to identify a synthetic locked file versus Task Manager |
| [System Informer](https://github.com/winsiderss/systeminformer) | Detailed resources, process inspection and debugging | Current official downloads: Windows 10/11, 32/64-bit; Canary separate; official documentation inspected; not installed or benchmarked | MIT main repository; audit driver/dependency licenses; Candidate reusable code under MIT notices; isolate privileged driver from UI | Kernel driver and process manipulation require separate informed approval; Compare handle diagnosis and idle overhead with Process Explorer on same workload |
| [Process Lasso](https://bitsum.com/apps/process-lasso/docs/) | Persistent process rules, CPU affinity/sets and ProBalance | Current official download: Windows 10/11/Server; x86-64, x86-32, ARM64; stable 19.0.0.94 observed; official documentation inspected; not installed or benchmarked | Proprietary; free edition plus paid Pro; current vendor matrix requires commercial license within 30 days; Behavioral inspiration only; independent policy engine with exportable rules, no proprietary code copying | Scheduler/power changes can worsen particular workloads; no universal FPS claim; Randomized baseline versus one rule: p95 input latency, build time, power and rollback |

## productivity

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [PowerToys](https://github.com/microsoft/PowerToys) | Modular Windows productivity utilities | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | MIT main repository; Strong modular architecture candidate under MIT notices; test each tool removable independently | Keyboard hooks, rename actions and clipboard tools need scoped permissions; Enable one module at a time; measure startup/idle cost and verify module-off isolation |
| [Everything](https://www.voidtools.com/support/everything/) | Fast indexed filename search | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | Vendor binary license; closed-source, do not infer source rights; Behavioral inspiration only; study incremental indexing with independent implementation | Indexes reveal filenames; service elevation and network sharing need explicit review; Cold indexing and p50/p95 query latency versus Windows Search on same fixture tree |
| [UniGetUI](https://github.com/Devolutions/UniGetUI) | Unified GUI across package managers | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | MIT; MIT adapter/UI patterns candidate; optional adapters must fail independently | Package trust and install/update side effects remain manager/package-specific; Read-only inventory adapters; duplicate package identity and failed-update recovery |
| [ShareX](https://github.com/ShareX/ShareX) | Capture, recording and configurable output workflows | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPL-3.0; Copyleft workflow ideas; upload connector isolation and preview-before-send are useful | Automatic upload can expose private screen content; keep uploads off; Local-only synthetic screenshot workflow, metadata redaction and undoable output naming |
| [AutoHotkey](https://github.com/AutoHotkey/AutoHotkey) | Windows hotkeys and scriptable automation | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPL-2.0 repository classification; Copyleft engine; independently licensed scripts assessed separately; prefer current stable over default alpha branch | Scripts execute with user permissions; untrusted scripts are not harmless configuration; Benign scoped hotkey with focus isolation and emergency stop; no secret capture |
| [Flow Launcher](https://github.com/Flow-Launcher/Flow.Launcher) | Keyboard launcher and search | Windows launcher; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | MIT core; plugins require separate review; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Plugin ecosystems introduce independent code and privacy risks; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [CopyQ](https://github.com/hluk/CopyQ) | Searchable clipboard history and scripting | Windows release compatibility pending per-version check; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | GPL-3.0; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Clipboard history can retain passwords and private content; exclusions and retention matter; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |
| [QuickLook](https://github.com/QL-Win/QuickLook) | Spacebar file previews | Windows preview utility; Official page/repository inspected 2026-11-14; some exact prerequisites/license details explicitly pending. Not installed or benchmarked. | GPL-3.0; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration. | Preview parsers and plugins handle untrusted files; test unsupported-format behavior; Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass. |

## security

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Autoruns](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns) | Broad startup persistence inventory | Windows utility; inspected page does not establish current minimum OS; official documentation inspected; not installed or benchmarked | Microsoft Sysinternals proprietary terms; Behavioral inspiration only; auditable read-only collectors before any modifier | Disabling services/drivers can break boot or protection; external reputation lookup may transmit data; Read-only inventory a VM with known startup fixtures; compare coverage and reversible disable |
| [Wireshark](https://gitlab.com/wireshark/wireshark) | Packet analysis, filters and protocol dissectors | Windows x64/ARM64; 4.6 last branch supporting Windows 10 v1809/Server 2019; observed stable4.6.9; official documentation inspected; not installed or benchmarked | GPLv2 Wireshark; Npcap separately licensed; Copyleft dissector reuse requires license review; Npcap is not covered by Wireshark GPL | Captures may contain credentials/personal data; capture only authorized traffic; driver needs review; Offline synthetic PCAP: expected protocols, redaction, export roundtrip and resource use |
| [simplewall](https://github.com/henrypp/simplewall) | Windows Filtering Platform rules with per-app control | Upstream Windows 7/8/8.1/10/11, 64-bit/ARM64, admin required; official documentation inspected; not installed or benchmarked | GPL-3.0; Copyleft candidate; keep policy planning separate from privileged WFP enforcement | Firewall changes can cut off remote access or break updates; upstream documents uninstall leaves filters active until disabled/removed; Isolated VM only: allow/deny fixture matrix, rollback and reboot persistence |
| [Portmaster](https://github.com/safing/portmaster) | Per-application connection visibility and blocking | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPL-3.0 main; inspect UI/driver/services separately; Study event-to-policy architecture; component licensing and service agreements independently checked | Network driver/filter changes and DNS policies can disrupt VPNs; paid services separate; VM compatibility matrix with VPN/DNS and baseline connection latency |
| [Sandboxie Plus](https://github.com/sandboxie-plus/Sandboxie) | Application isolation and disposable sandboxes | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | Mixed: GPL core, custom SandMan UI, LGPL components; not uniformly GPL; No blanket reuse: review LICENSE.Plus and each component; custom UI not presumed open-source reusable | Not an absolute malware boundary; kernel component and certificate/commercial restrictions; Disposable benign fixture: filesystem/registry isolation, recovery and compatibility |
| [KeePassXC](https://github.com/keepassxreboot/keepassxc) | Local password database workflow | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | Mixed/component licenses; verify COPYING before reuse; Reuse unresolved at component level; encrypted storage design is inspiration, not cryptographic proof | Password/key loss can make vault unrecoverable; no real credentials in pilot; Synthetic vault backup/restore, lock behavior and clipboard expiry |

<a id="security-activity tracing"></a>

## security/activity tracing

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) | Real-time filesystem, Registry and process/thread activity with filters and stacks. | Windows; check current release requirements.; Official documentation reviewed; not installed or benchmarked | Microsoft proprietary utility; Sysinternals license; Workflow inspiration, not reusable source. | Large traces can expose private paths and command lines; bounded capture required. Not an antivirus.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-adware remediation"></a>

## security/adware remediation

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Malwarebytes AdwCleaner](https://www.malwarebytes.com/adwcleaner) | Specialized adware, potentially unwanted program and unwanted preinstalled-software cleanup. | Current Windows requirements must be checked; older Windows may require legacy unsupported releases.; Official documentation reviewed; not installed or benchmarked | Proprietary freeware; Workflow inspiration only. | Cleaning changes the system; inspect detections, close work and retain rollback/quarantine.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-detection engineering"></a>

## security/detection engineering

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Sigma rules](https://github.com/SigmaHQ/sigma) | Portable detection-rule corpus for supported log sources; not a standalone scanner. | Rules require a compatible engine, backend and configured telemetry.; Official documentation reviewed; not installed or benchmarked | Detection Rule License 1.1; specification differs; Treat rule content separately from engine licensing. | Do not assume rules work unchanged on every backend.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-endpoint inventory"></a>

## security/endpoint inventory

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [osquery](https://github.com/osquery/osquery) | SQL-style operating-system instrumentation and inventory. | Windows, Linux and macOS.; Official documentation reviewed; not installed or benchmarked | Apache-2.0 OR GPL-2.0-only; see repository license; Useful schema/extension reference, with exact dependency license review. | Inventory queries are not equivalent to malware prevention; scheduled telemetry has privacy and resource costs.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-endpoint investigation"></a>

## security/endpoint investigation

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Velociraptor](https://github.com/Velocidex/velociraptor) | VQL-based host-state collection and endpoint investigation. | Windows client builds; deployment architecture requires planning.; Official documentation reviewed; not installed or benchmarked | AGPLv3 main repository; VQL and artifact architecture inspiration; main engine license differs from MIT pyvelociraptor. | Managed deployment may create persistent collection and powerful access; not an install-and-forget cleaner.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-endpoint telemetry"></a>

## security/endpoint telemetry

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) | Persistent telemetry service/driver. Event 8 remote-thread creation, 10 process access and 7 image loading support investigation. | Windows service and driver; installation persists over reboot.; Official documentation reviewed; not installed or benchmarked | Microsoft proprietary Windows utility; Windows product inspiration only; Linux source has separate licensing. | Not an analysis engine or complete EDR. Configuration, noise, storage and privacy need review; not all injection is caught by one event.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-event-log forensics"></a>

## security/event-log forensics

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Hayabusa](https://github.com/Yamato-Security/hayabusa) | Sigma-based threat hunting and forensic timelines from Windows event logs. | Windows event-log analysis; select supported build.; Official documentation reviewed; not installed or benchmarked | Engine AGPLv3; detection rules DRL 1.1; Engine and rule licenses are separate; evaluate AGPL and DRL obligations before reuse. | Rule matches require investigation; missing telemetry and false positives matter.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [Chainsaw](https://github.com/WithSecureOpenSource/chainsaw) | Searches and hunts Windows forensic artifacts with rule-driven analysis. | Windows build available; verify release artifact because upstream noted a prior Windows build failure.; Official documentation reviewed; not installed or benchmarked | GPL-3.0; Rust analysis implementation candidate subject to GPL and rule licensing. | No detection without suitable input artifacts; preserve originals and inspect false positives.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-file trust"></a>

## security/file trust

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Sigcheck](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck) | File version, timestamp, digital signature and certificate-chain inspection. | Windows CLI.; Official documentation reviewed; not installed or benchmarked | Microsoft proprietary utility; Trust-display UX inspiration only. | A valid signature does not establish benign behavior; review optional external reputation lookups before sending data.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-injection hunting"></a>

## security/injection hunting

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [PE-sieve](https://github.com/hasherezade/pe-sieve) | Scans one process for suspicious injected/replaced executable code, hooks and in-memory patches; offers DLL API. | Windows process scanner.; Official documentation reviewed; not installed or benchmarked | BSD-2-Clause; Strong candidate for reuse as a narrow scanning engine; inspect submodules and false-positive behavior before integration. | Findings are suspicious artifacts, not proof of compromise. Memory dumps may contain secrets.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [HollowsHunter](https://github.com/hasherezade/hollows_hunter) | PE-sieve-based multi-process scanner with filters and optional repeated/ETW-triggered scanning. | Windows; ETW mode documented for 64-bit build.; Official documentation reviewed; not installed or benchmarked | BSD-2-Clause; Reuse orchestration ideas and permissive code with submodule review; do not replace target benchmarking. | Not full EDR; dumps can expose private memory. Continuous scanning needs overhead measurement.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [Moneta](https://github.com/forrest-orr/moneta) | Live user-mode memory analysis for indicators of compromise. | Release page identifies 64-bit Windows only.; Official documentation reviewed; not installed or benchmarked | Exact license review pending; Architecture inspiration only until exact license reviewed. | Analyst tool, not a universal malware verdict. Validate maintenance and Windows compatibility before recommending.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-malware scanning"></a>

## security/malware scanning

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Malwarebytes](https://www.malwarebytes.com/solutions/virus-scanner) | On-demand malware scan/removal; paid product adds ongoing protection. | Windows product; confirm current edition requirements.; Official documentation reviewed; not installed or benchmarked | Proprietary; free scanner and paid protection differ; Product/workflow inspiration only, no source reuse grant. | Review quarantine and trial/subscription choices. Do not confuse free scan with continuous protection.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [Microsoft Safety Scanner](https://learn.microsoft.com/microsoft-365/security/intelligence/safety-scanner-download) | On-demand Windows malware scan/removal tool. | Windows; fresh download required because package expires after ten days.; Official documentation reviewed; not installed or benchmarked | Microsoft proprietary utility; Workflow inspiration only. | Not continuous antivirus; review removals and keep protection enabled.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [ESET Online Scanner](https://www.eset.com/us/home/online-scanner/) | On-demand Windows malware scanning with vendor detection engine. | Windows; internet/download requirements apply.; Official documentation reviewed; not installed or benchmarked | Proprietary free scanning tool; Workflow inspiration only. | Review removal options and optional periodic scanning; do not email reports.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [Emsisoft Emergency Kit](https://www.emsisoft.com/en/emergency-kit/) | Portable toolkit to scan and clean infected computers without conventional installation. | Vendor page: Windows 10 64-bit, Server 2016 and higher; check supported-build policy.; Official documentation reviewed; not installed or benchmarked | Proprietary; verify personal/business usage terms; Workflow inspiration only. | Portable does not mean no system effects: cleaning/quarantine changes data.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [ClamAV](https://www.clamav.net/downloads) | Open-source scanning engine with official Windows builds. | Windows supported; Linux on-access scanning is not provided on Windows.; Official documentation reviewed; not installed or benchmarked | GPLv2; GPL engine integration candidate; evaluate detection and performance on permitted fixtures. | Do not present Windows ClamAV as a drop-in real-time Defender replacement. Signature updates and tuning needed.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-managed endpoint monitoring"></a>

## security/managed endpoint monitoring

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Wazuh agent](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html) | Windows endpoint agent for a managed Wazuh monitoring deployment. | Windows 11 and Server 2025 documented among supported systems.; Official documentation reviewed; not installed or benchmarked | Wazuh GPLv2; audit full stack licenses; Architecture candidate, not a desktop drop-in; confirm exact component licenses. | Requires managed backend/configuration; persistent agent is not a standalone PC cleaner.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-memory forensics"></a>

## security/memory forensics

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Volatility 3](https://github.com/volatilityfoundation/volatility3) | Framework for analyzing memory images, including Windows artifacts. | Windows memory analysis; Python/dependency and symbol requirements apply.; Official documentation reviewed; not installed or benchmarked | Volatility Software License 1.0; Read VSL 1.0 directly; do not label as generic GPL or unrestricted reuse. | Memory acquisition and analysis can expose highly sensitive content; some Windows 11 images have documented issues.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |
| [MemProcFS](https://github.com/ufrisk/MemProcFS) | Memory-analysis toolkit exposing memory artifacts through a filesystem-oriented workflow. | Windows-oriented memory tooling; verify acquisition/backend prerequisites.; Official documentation reviewed; not installed or benchmarked | AGPL-3.0; AGPL-sensitive integration candidate; separately audit acquisition libraries. | Forensic memory data is sensitive; do not acquire or publish user dumps for catalog tests.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-network inspection"></a>

## security/network inspection

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [TCPView](https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview) | Lists TCP/UDP endpoints and owning processes. | Windows native utility.; Official documentation reviewed; not installed or benchmarked | Microsoft proprietary utility; Endpoint/process correlation workflow inspiration only. | A connection is not proof of malware; closing connections is disruptive.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-pattern matching"></a>

## security/pattern matching

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [YARA-X](https://github.com/VirusTotal/yara-x) | Rust implementation of YARA-style pattern matching. | Cross-platform engine; verify Windows release package for selected version.; Official documentation reviewed; not installed or benchmarked | BSD-3-Clause; Permissive engine reuse candidate; third-party rule licenses remain separate. | Rules can generate false positives; matching engine alone is not antivirus or EDR.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-process inspection"></a>

## security/process inspection

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [ListDLLs](https://learn.microsoft.com/en-us/sysinternals/downloads/listdlls) | Command-line loaded-DLL viewer. | Windows CLI.; Official documentation reviewed; not installed or benchmarked | Microsoft proprietary utility; CLI output/inspection workflow inspiration only. | A loaded DLL is not necessarily malicious.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-repair orchestration"></a>

## security/repair orchestration

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Tron](https://github.com/bmrf/tron) | Batch-script orchestration of multiple Windows cleanup, repair and disinfection tools. | Windows administrator workflow; upstream warns against unsupported OS overrides.; Official documentation reviewed; not installed or benchmarked | MIT scripts; bundled third-party tools have separate terms; Reuse scripts only under MIT and review all third-party licensing/actions; do not redistribute whole bundle as MIT. | High-impact remediation, not a routine optimizer or injection detector. Upstream warns to reboot first and use full official package, not GitHub source archive; can take hours. No log emailing.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

<a id="security-static file analysis"></a>

## security/static file analysis

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Detect It Easy](https://github.com/horsicq/Detect-It-Easy) | File-format, packer and compiler inspection with signatures and heuristics. | Windows, Linux and macOS; release-specific builds.; Official documentation reviewed; not installed or benchmarked | MIT; Useful static-analysis/UI reference; inspect engine/submodule licenses. | Packed/obfuscated files are not automatically malware. Do not execute unknown samples.; Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware. |

## video

| Tool / official source | Features | Windows / evidence | License and reuse | Risk / proposed comparison |
|---|---|---|---|---|
| [Kdenlive](https://apps.kde.org/kdenlive/) | Nonlinear timeline editing using MLT/KDE framework | Windows; see linked upstream requirements for exact supported build/architecture; official documentation inspected; not installed or benchmarked | GPL-3.0-only; third-party codecs separate; Copyleft editor; evaluate maintained MLT integration rather than invent timeline engine | Proxy/render mismatch, codecs and GPU support vary on Windows; Reference clips: frame count, audio sync, color, proxy/fullres fidelity and export time |
| [Shotcut](https://shotcut.org/) | Native timeline editing, track compositing, color tools, motion tracking and proxy-oriented workflows | Official Windows downloads; check selected release GPU/OS requirements; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | GPLv3 per official FAQ; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Codec/GPU support is workload dependent; Timeline playback and export on identical 1080p/4K fixtures |
| [HandBrake](https://handbrake.fr/) | Queued video transcoding; AV1/H.264/H.265; optional hardware encoding | Windows x64 and ARM64 downloads; latest requirements list Windows 11 supported, Windows 10 deprecated and .NET Desktop Runtime 10; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Mostly GPLv2; BSD portions and mixed licensed dependencies; Source reuse is conditional on exact release/file and dependency license review; assets, fonts, plugins and models are separate. | Hardware encoders trade compression quality and speed; not an editor or DRM bypass tool; Same-source quality/size/time comparison with chosen encoder |
| [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) | Integrated editing, grading, Fusion compositing and Fairlight audio | Confirm Windows/GPU requirements against exact selected release; Official product/repository evidence inspected 2026-11-14; research candidate, not installed or benchmarked | Proprietary; free and Studio editions need edition-specific terms; Proprietary product: workflow inspiration only; no code or asset copying. | Free versus Studio codec/AI limits and GPU RAM requirements require checking; Target codec playback, color/export and project roundtrip comparison |

## Evidence and remaining work

Every JSON row retains official source links. Existing detailed [vendor evidence](VENDOR-EVIDENCE.md) and [creative evidence](CREATIVE-EVIDENCE.md) remain. Source inspection is not independent testing. Exact release compatibility, pinned file-level license audit and representative Windows tests remain gates before recommending a winner or adopting code. Larger discovery breadth does not replace those gates.
