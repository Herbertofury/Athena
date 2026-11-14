# Windows PC utility and creation-tool research

Checked 2026-11-14. **30 source-backed candidates, not an exhaustive catalog or a Windows runtime certification.** This expands rather than replaces the [66-entry cleanup snapshot](../developer-cleanup-2026-11-14/README.md). That older star ranking measures popularity only; this catalog ranks **evaluation priority within each category**, not proven quality. 1 = start here, 2 = compare next, 3 = specialist or higher operational risk. Prices and current release compatibility must be checked again before installation. No tools were installed, security settings changed, or private data supplied.

## Browse the sortable table

[Open the interactive research table](https://herbertofury.github.io/Athena/research/windows-utilities-2026-11-14/): filter by category/search, sort by GitHub stars, editorial priority, or attributed SourceForge user rating/review count. Stars use the retained official repository snapshot. Two user-rating snapshots are available (Audacity 4.6/5, 286 reviews; BleachBit 4.8/5, 60 reviews), from their [SourceForge](https://sourceforge.net/projects/audacity/reviews/) [review pages](https://sourceforge.net/projects/bleachbit/reviews/) observed November 14. These indexed, self-selected historical reviews may lag live counts and are not current-version performance evidence. Missing ratings remain unranked; incompatible sources/scales are not normalized together. The table works when served over HTTP; GitHub source view does not execute it.

## Practical starting shortlist

Inspect before modifying: Process Explorer/System Informer for process ownership; WinDirStat for disk accounting; BCUninstaller versus Revo for uninstall workflows; PowerToys/Everything for everyday navigation; restic for independently verified recovery. Process Lasso is worth a controlled responsiveness experiment, not a promise of extra FPS. Security tools are separate choices, not a stack to install together. For creation: Blender, Krita, Kdenlive and Audacity are first evaluation candidates.

## Ranked by use case

### process

- **Priority 1: [Process Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer)**. Handle and DLL ownership investigation; process tree. License: Microsoft Sysinternals proprietary terms.
  - Risk: Elevated inspection exposes process details; termination can lose work.
  - Candidate experiment: Measure time to identify a synthetic locked file versus Task Manager.
  - Build/reuse decision: Behavioral inspiration only; documentation repository is not a license to copy binary implementation.
- **Priority 2: [System Informer](https://github.com/winsiderss/systeminformer)**. Detailed resources, process inspection and debugging. License: MIT main repository; audit driver/dependency licenses.
  - Risk: Kernel driver and process manipulation require separate informed approval.
  - Candidate experiment: Compare handle diagnosis and idle overhead with Process Explorer on same workload.
  - Build/reuse decision: Candidate reusable code under MIT notices; isolate privileged driver from UI.
- **Priority 3: [Process Lasso](https://bitsum.com/apps/process-lasso/docs/)**. Persistent process rules, CPU affinity/sets and ProBalance. License: Proprietary; free edition plus paid Pro.
  - Risk: Scheduler/power changes can worsen particular workloads; no universal FPS claim.
  - Candidate experiment: Randomized baseline versus one rule: p95 input latency, build time, power and rollback.
  - Build/reuse decision: Behavioral inspiration only; independent policy engine with exportable rules, no proprietary code copying.

### cleanup

- **Priority 1: [Bulk Crap Uninstaller](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller)**. Batch uninstall orchestration and leftover review. License: Apache-2.0.
  - Risk: Leftover detection can include shared data; never bulk-delete unchecked results.
  - Candidate experiment: Disposable VM fixtures: missed leftovers, false positives, shared files preserved.
  - Build/reuse decision: Candidate adapter orchestration under Apache notices/patent terms; separate inventory from execution.
- **Priority 1: [WinDirStat](https://github.com/windirstat/windirstat)**. Disk usage visualization, large-file discovery. License: GPL-3.0 repository classification.
  - Risk: Deletion is separate from inspection; junctions and hardlinks complicate accounting.
  - Candidate experiment: Compare reported allocated/logical bytes on sparse, compressed and hardlinked fixtures.
  - Build/reuse decision: Copyleft candidate: inspect exact file licenses before distributing derivative code.
- **Priority 2: [Revo Uninstaller](https://www.revouninstaller.com/products/revo-uninstaller-free/)**. Built-in uninstaller followed by leftover scan; Hunter Mode. License: Proprietary freeware; separate paid Pro terms.
  - Risk: Registry/file cleanup and permanent erase are destructive; restore points are not full backups.
  - Candidate experiment: Compare against BCUninstaller using identical installers and shared-file sentinels.
  - Build/reuse decision: Behavioral inspiration only; no permission to reuse proprietary code/assets.
- **Priority 2: [Czkawka / Krokiet](https://github.com/qarmin/czkawka)**. Duplicate and similar-image discovery. License: Mixed/component licenses; GitHub NOASSERTION is not approval.
  - Risk: Similar image is not identical; preserve originals and review groups.
  - Candidate experiment: Byte-identical, near-duplicate and distinct-image fixtures; false-positive rate before deletion.
  - Build/reuse decision: Reuse unresolved until component LICENSE files reviewed; consider bounded external adapter first.
- **Priority 3: [BleachBit](https://github.com/bleachbit/bleachbit)**. Application-specific cleanup definitions. License: GPL-3.0 repository classification.
  - Risk: Can erase sessions/history and useful caches; regeneration costs matter.
  - Candidate experiment: Preview versus actual removal on disposable profile; protected files and rebuild latency.
  - Build/reuse decision: Copyleft definitions/engine candidate after exact component audit; declarative preview is useful architecture.

### security

- **Priority 1: [Autoruns](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns)**. Broad startup persistence inventory. License: Microsoft Sysinternals proprietary terms.
  - Risk: Disabling services/drivers can break boot or protection; external reputation lookup may transmit data.
  - Candidate experiment: Read-only inventory a VM with known startup fixtures; compare coverage and reversible disable.
  - Build/reuse decision: Behavioral inspiration only; auditable read-only collectors before any modifier.
- **Priority 1: [KeePassXC](https://github.com/keepassxreboot/keepassxc)**. Local password database workflow. License: Mixed/component licenses; verify COPYING before reuse.
  - Risk: Password/key loss can make vault unrecoverable; no real credentials in pilot.
  - Candidate experiment: Synthetic vault backup/restore, lock behavior and clipboard expiry.
  - Build/reuse decision: Reuse unresolved at component level; encrypted storage design is inspiration, not cryptographic proof.
- **Priority 2: [Wireshark](https://gitlab.com/wireshark/wireshark)**. Packet analysis, filters and protocol dissectors. License: GPLv2 Wireshark; Npcap separately licensed.
  - Risk: Captures may contain credentials/personal data; capture only authorized traffic; driver needs review.
  - Candidate experiment: Offline synthetic PCAP: expected protocols, redaction, export roundtrip and resource use.
  - Build/reuse decision: Copyleft dissector reuse requires license review; Npcap is not covered by Wireshark GPL.
- **Priority 3: [simplewall](https://github.com/henrypp/simplewall)**. Windows Filtering Platform rules with per-app control. License: GPL-3.0.
  - Risk: Firewall changes can cut off remote access or break updates.
  - Candidate experiment: Isolated VM only: allow/deny fixture matrix, rollback and reboot persistence.
  - Build/reuse decision: Copyleft candidate; keep policy planning separate from privileged WFP enforcement.
- **Priority 3: [Portmaster](https://github.com/safing/portmaster)**. Per-application connection visibility and blocking. License: GPL-3.0 main; inspect UI/driver/services separately.
  - Risk: Network driver/filter changes and DNS policies can disrupt VPNs; paid services separate.
  - Candidate experiment: VM compatibility matrix with VPN/DNS and baseline connection latency.
  - Build/reuse decision: Study event-to-policy architecture; component licensing and service agreements independently checked.
- **Priority 3: [Sandboxie Plus](https://github.com/sandboxie-plus/Sandboxie)**. Application isolation and disposable sandboxes. License: Mixed: GPL core, custom SandMan UI, LGPL components; not uniformly GPL.
  - Risk: Not an absolute malware boundary; kernel component and certificate/commercial restrictions.
  - Candidate experiment: Disposable benign fixture: filesystem/registry isolation, recovery and compatibility.
  - Build/reuse decision: No blanket reuse: review LICENSE.Plus and each component; custom UI not presumed open-source reusable.

### productivity

- **Priority 1: [PowerToys](https://github.com/microsoft/PowerToys)**. Modular Windows productivity utilities. License: MIT main repository.
  - Risk: Keyboard hooks, rename actions and clipboard tools need scoped permissions.
  - Candidate experiment: Enable one module at a time; measure startup/idle cost and verify module-off isolation.
  - Build/reuse decision: Strong modular architecture candidate under MIT notices; test each tool removable independently.
- **Priority 1: [Everything](https://www.voidtools.com/support/everything/)**. Fast indexed filename search. License: Vendor binary license; closed-source, do not infer source rights.
  - Risk: Indexes reveal filenames; service elevation and network sharing need explicit review.
  - Candidate experiment: Cold indexing and p50/p95 query latency versus Windows Search on same fixture tree.
  - Build/reuse decision: Behavioral inspiration only; study incremental indexing with independent implementation.
- **Priority 2: [UniGetUI](https://github.com/Devolutions/UniGetUI)**. Unified GUI across package managers. License: MIT.
  - Risk: Package trust and install/update side effects remain manager/package-specific.
  - Candidate experiment: Read-only inventory adapters; duplicate package identity and failed-update recovery.
  - Build/reuse decision: MIT adapter/UI patterns candidate; optional adapters must fail independently.
- **Priority 2: [ShareX](https://github.com/ShareX/ShareX)**. Capture, recording and configurable output workflows. License: GPL-3.0.
  - Risk: Automatic upload can expose private screen content; keep uploads off.
  - Candidate experiment: Local-only synthetic screenshot workflow, metadata redaction and undoable output naming.
  - Build/reuse decision: Copyleft workflow ideas; upload connector isolation and preview-before-send are useful.
- **Priority 3: [AutoHotkey](https://github.com/AutoHotkey/AutoHotkey)**. Windows hotkeys and scriptable automation. License: GPL-2.0 repository classification.
  - Risk: Scripts execute with user permissions; untrusted scripts are not harmless configuration.
  - Candidate experiment: Benign scoped hotkey with focus isolation and emergency stop; no secret capture.
  - Build/reuse decision: Copyleft engine; independently licensed scripts assessed separately; prefer current stable over default alpha branch.

### backup

- **Priority 1: [restic](https://github.com/restic/restic)**. Encrypted deduplicating backup snapshots. License: BSD-2-Clause.
  - Risk: Lost password prevents restore; prune removes history; backup is unproven until restored.
  - Candidate experiment: Synthetic full+incremental backups then independent restore with exact hashes.
  - Build/reuse decision: Permissive code candidate with notices; reusable snapshot/restore verification patterns.

### 3d-assets

- **Priority 1: [Blender](https://www.blender.org/about/license/)**. Integrated modeling, geometry workflows, animation and asset production. License: GPL; inspect current exact release/component license (website and source can differ).
  - Risk: Complex scenes exceed GPU/RAM; add-ons and assets have independent licenses.
  - Candidate experiment: Golden mesh roundtrip: topology, UVs, normals, units, materials and export hashes; render time/peak RAM.
  - Build/reuse decision: GPL code reuse needs compatible distribution; artwork is not automatically GPL; independent file/CLI adapter avoids coupling.

### photo-art

- **Priority 1: [Krita](https://krita.org/en/download/)**. Digital painting and layered artwork. License: GPLv3.
  - Risk: Color profiles and plugin compatibility can change exported appearance.
  - Candidate experiment: Layered fixture roundtrip, ICC-aware export, tablet latency and crash recovery.
  - Build/reuse decision: GPL engine reuse requires compliance; brushes/fonts/assets separately licensed; test interchange adapter.

### video

- **Priority 1: [Kdenlive](https://apps.kde.org/kdenlive/)**. Nonlinear timeline editing using MLT/KDE framework. License: GPL-3.0-only; third-party codecs separate.
  - Risk: Proxy/render mismatch, codecs and GPU support vary on Windows.
  - Candidate experiment: Reference clips: frame count, audio sync, color, proxy/fullres fidelity and export time.
  - Build/reuse decision: Copyleft editor; evaluate maintained MLT integration rather than invent timeline engine.

### audio

- **Priority 1: [Audacity](https://github.com/audacity/audacity)**. Multitrack recording/editing and export. License: Current README GPLv3; older manual says GPLv2, pin exact release.
  - Risk: Plugins/codecs separately licensed; destructive edits require project backup.
  - Candidate experiment: Synthetic tones: sample count, clipping, resample error, project recovery and export metadata.
  - Build/reuse decision: GPL code reuse after pinned LICENSE check; plugin/process boundary and nondestructive history are evaluation targets.

## Evidence and architecture decisions

The machine-readable catalog records official sources, Windows scope, licenses, risks and unrun experiments. `source-snapshot.json` records dated GitHub metadata, including stars and archive status; these are discovery signals, not safety/performance scores. GitHub license detection is not a legal audit: NOASSERTION remains unresolved, and Sandboxie demonstrates why a root GPL badge does not license all components. Wireshark is maintained on GitLab; its GitHub mirror is not the canonical contribution destination. Vendor freeware is not open-source code. Read exact release LICENSE/NOTICE/dependency files before embedding; preserve attribution and comply with copyleft distribution obligations. No proprietary binaries, icons, models or sample assets are copied here.

For a future better tool, first prove a specific improvement: independently removable adapters, inventory/plan/apply boundaries, preview and recovery, provenance per finding, bounded elevated helpers, explicit permission prompts and versioned export formats. Do not combine scheduler, firewall and cleaner changes into one opaque optimization switch. Capture baseline and candidate on the same workload, retain failures, measure false positives as well as speed, and test disabled-module behavior. Interoperating through a CLI is not automatically license-free; redistribution and bundled dependencies still require review.

## Staged expansion queue (not yet researched/ranked)

- Photo/RAW/vector: GIMP, darktable, RawTherapee, Inkscape; proprietary Photoshop/Affinity comparisons under their actual current terms.
- Video/compositing: DaVinci Resolve, Shotcut, Olive, Natron, FFmpeg; codec/build licensing and Windows hardware matrix.
- Meshes/CAD/assets: MeshLab, FreeCAD, Open3D, UV/retopology/baking tools, texture/material workflows and game-export validators.
- Audio/music: REAPER, Ardour, LMMS, plugin hosts, sample editors; ASIO/plugin/model/sample licenses separate.
- Everyday PC: archivers, PDF/office, terminal, clipboard, launchers, file synchronization, display management, device monitoring and accessible input.

Each next tranche needs primary-source checks, licensing boundaries, concrete fixtures and a falsifiable reason to build instead of integrate. No claim of exhaustive coverage, best-in-class performance, malware prevention, or successful native Windows acceptance is made.

## Release/platform evidence and exceptions

See [dated vendor evidence](VENDOR-EVIDENCE.md): current Process Explorer requires Windows 11+, not older Windows 10 assumptions; Process Lasso commercial-use licensing differs from personal Free; simplewall uninstall does not remove filters. Catalog JSON carries the source-backed support detail. Sandboxie UI/core licenses differ. This report never treats a repository badge as a complete licensing audit.

## Expanded creative evidence

[Ten-tool primary-source creative review](CREATIVE-EVIDENCE.md) adds GIMP, MeshLab/PyMeshLab, Instant Meshes, ArmorPaint, LMMS and F3D beyond the initial ranked24, with Windows support, official GitLab/GitHub/vendor provenance, code reuse boundaries and unverified requirements. These six additional candidates are researched but not yet assigned numerical evaluation priority or added to the JSON tranche.

## Complete tranche table

| Tool | Category | Stars snapshot | Rating snapshot | Reuse / inspiration |
|---|---|---:|---|---|
| [Process Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer) | process | Not recorded | Not recorded | Behavioral inspiration only; documentation repository is not a license to copy binary implementation |
| [System Informer](https://github.com/winsiderss/systeminformer) | process | 16496 | Not recorded | Candidate reusable code under MIT notices; isolate privileged driver from UI |
| [Process Lasso](https://bitsum.com/apps/process-lasso/docs/) | process | Not recorded | Not recorded | Behavioral inspiration only; independent policy engine with exportable rules, no proprietary code copying |
| [Bulk Crap Uninstaller](https://github.com/BCUninstaller/Bulk-Crap-Uninstaller) | cleanup | 22481 | Not recorded | Candidate adapter orchestration under Apache notices/patent terms; separate inventory from execution |
| [Revo Uninstaller](https://www.revouninstaller.com/products/revo-uninstaller-free/) | cleanup | Not recorded | Not recorded | Behavioral inspiration only; no permission to reuse proprietary code/assets |
| [WinDirStat](https://github.com/windirstat/windirstat) | cleanup | 4535 | Not recorded | Copyleft candidate: inspect exact file licenses before distributing derivative code |
| [Czkawka / Krokiet](https://github.com/qarmin/czkawka) | cleanup | 35173 | Not recorded | Reuse unresolved until component LICENSE files reviewed; consider bounded external adapter first |
| [BleachBit](https://github.com/bleachbit/bleachbit) | cleanup | 7491 | 4.8/5 · 60 SourceForge reviews | Copyleft definitions/engine candidate after exact component audit; declarative preview is useful architecture |
| [Autoruns](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns) | security | Not recorded | Not recorded | Behavioral inspiration only; auditable read-only collectors before any modifier |
| [Wireshark](https://gitlab.com/wireshark/wireshark) | security | Not recorded | Not recorded | Copyleft dissector reuse requires license review; Npcap is not covered by Wireshark GPL |
| [simplewall](https://github.com/henrypp/simplewall) | security | 9313 | Not recorded | Copyleft candidate; keep policy planning separate from privileged WFP enforcement |
| [Portmaster](https://github.com/safing/portmaster) | security | 14084 | Not recorded | Study event-to-policy architecture; component licensing and service agreements independently checked |
| [Sandboxie Plus](https://github.com/sandboxie-plus/Sandboxie) | security | 19959 | Not recorded | No blanket reuse: review LICENSE.Plus and each component; custom UI not presumed open-source reusable |
| [KeePassXC](https://github.com/keepassxreboot/keepassxc) | security | 29993 | Not recorded | Reuse unresolved at component level; encrypted storage design is inspiration, not cryptographic proof |
| [PowerToys](https://github.com/microsoft/PowerToys) | productivity | 140986 | Not recorded | Strong modular architecture candidate under MIT notices; test each tool removable independently |
| [Everything](https://www.voidtools.com/support/everything/) | productivity | Not recorded | Not recorded | Behavioral inspiration only; study incremental indexing with independent implementation |
| [UniGetUI](https://github.com/Devolutions/UniGetUI) | productivity | 27038 | Not recorded | MIT adapter/UI patterns candidate; optional adapters must fail independently |
| [ShareX](https://github.com/ShareX/ShareX) | productivity | 41040 | Not recorded | Copyleft workflow ideas; upload connector isolation and preview-before-send are useful |
| [restic](https://github.com/restic/restic) | backup | 37225 | Not recorded | Permissive code candidate with notices; reusable snapshot/restore verification patterns |
| [AutoHotkey](https://github.com/AutoHotkey/AutoHotkey) | productivity | 13478 | Not recorded | Copyleft engine; independently licensed scripts assessed separately; prefer current stable over default alpha branch |
| [Blender](https://www.blender.org/about/license/) | 3d-assets | Not recorded | Not recorded | GPL code reuse needs compatible distribution; artwork is not automatically GPL; independent file/CLI adapter avoids coupling |
| [Krita](https://krita.org/en/download/) | photo-art | Not recorded | Not recorded | GPL engine reuse requires compliance; brushes/fonts/assets separately licensed; test interchange adapter |
| [Kdenlive](https://apps.kde.org/kdenlive/) | video | Not recorded | Not recorded | Copyleft editor; evaluate maintained MLT integration rather than invent timeline engine |
| [Audacity](https://github.com/audacity/audacity) | audio | Not recorded | 4.6/5 · 286 SourceForge reviews | GPL code reuse after pinned LICENSE check; plugin/process boundary and nondestructive history are evaluation targets |
| [GIMP](https://gitlab.gnome.org/GNOME/gimp) | photo-art | Not recorded | Not recorded | Prefer plugins or batch adapter before full GPL-compatible fork |
| [MeshLab / PyMeshLab](https://github.com/cnr-isti-vclab/meshlab) | 3d-assets | Not recorded | Not recorded | Python filter adapter candidate; GPL obligations need review |
| [Instant Meshes](https://github.com/wjakob/instant-meshes) | 3d-assets | Not recorded | Not recorded | Focused algorithm candidate after full LICENSE and maintenance review |
| [ArmorPaint](https://github.com/armory3d/armorpaint) | 3d-assets | Not recorded | Not recorded | Permissive core candidate for painting architecture; inspect dependencies |
| [LMMS](https://github.com/LMMS/lmms) | audio | Not recorded | Not recorded | GPL composition architecture candidate, not audio-editor parity proof |
| [F3D](https://github.com/f3d-app/f3d) | 3d-assets | Not recorded | Not recorded | Lightweight preview code candidate under BSD notices |
