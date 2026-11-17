# Files, backup & recovery

Find, organize, transfer, protect and recover files.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=files) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

65 applications. Reviewed 2026-11-16; individual records identify inherited research.

## Archive creation and extraction

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Farchives)

### 7-Zip

Archive creation and extraction

- **Platforms:** Windows, macOS, Linux. **License:** Mostly LGPL; BSD-3-Clause parts; unRAR restrictions. **Pricing model:** free.
- **Compatibility details:** Windows includes the graphical file manager and shell integration. The official Linux and macOS releases listed here are console editions, not the Windows GUI.
- **Pick for:** Choose 7-Zip for 7z and ZIP creation, archive extraction and command-line compression jobs.
- **Compare when:** Compare PeaZip for an alternative archive-management interface and WinRAR when creating RAR archives is required.
- **Strengths:** Archive creation and extraction
- **Limitations:** RAR support is extraction-only; creating a RAR archive requires another tool.; The official macOS and Linux distributions are command-line editions; the Windows graphical interface is not supplied for those platforms.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.7-zip.org/) · [Official installation / downloads](https://www.7-zip.org/download.html) · [Repository](https://github.com/ip7z/7zip)
- **Sources:** [Official capabilities and practical usage basis](https://www.7-zip.org/) (2026-11-15; features, identity, license, pricing); [Official 7-Zip platform downloads and repository link](https://www.7-zip.org/download.html) (2026-11-14; downloads, identity, platforms)
### Bandizip

Graphical archive manager with Windows and macOS editions.

- **Platforms:** Windows, macOS. **License:** Proprietary; edition-specific terms. **Pricing model:** freemium.
- **Pick for:** A commercial comparison candidate for users wanting a polished archive interface.
- **Compare when:** Free Windows edition and paid editions differ
- **Strengths:** A commercial comparison candidate for users wanting a polished archive interface.
- **Limitations:** Free Windows edition and paid editions differ; macOS licensing is separate.
- **Maintenance:** active — Official page lists Bandizip 7.47 dated 2026-10-13. Installed behavior was not tested. ([evidence](https://www.bandisoft.com/bandizip/))
- [Official project](https://www.bandisoft.com/bandizip/) · [Official installation / downloads](https://www.bandisoft.com/bandizip/)
- **Sources:** [Official project documentation](https://www.bandisoft.com/bandizip/) (2026-11-14; identity, features, platforms, license, pricing, downloads, maintenance)
### NanaZip

Windows archive manager derived from 7-Zip with modern shell integration.

- **Platforms:** Windows. **License:** MIT for NanaZip code; inherited 7-Zip, third-party codec and artwork licenses apply. **Pricing model:** mixed.
- **Pick for:** Fits Windows users who want modern shell integration for archive tasks.
- **Compare when:** Includes components under several licenses
- **Strengths:** Fits Windows users who want modern shell integration for archive tasks.
- **Limitations:** Includes components under several licenses; Supported Windows version depends on the release.; Standard builds and the separately priced Sponsor Edition have different distribution terms.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-26. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/M2Team/NanaZip/releases.atom))
- [Official project](https://github.com/M2Team/NanaZip) · [Official installation / downloads](https://github.com/M2Team/NanaZip/releases) · [Repository](https://github.com/M2Team/NanaZip)
- **Sources:** [Official project documentation](https://github.com/M2Team/NanaZip) (2026-11-14; features, identity, platforms, pricing); [Official download or installation landing page](https://github.com/M2Team/NanaZip/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/M2Team/NanaZip/HEAD/License.md) (2026-11-14; license); [Official release activity](https://github.com/M2Team/NanaZip/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/M2Team/NanaZip/releases/expanded_assets/7.0.1882.0) (2026-11-14; pricing)
### PeaZip

Multi-format archive UI around compression backends

- **Platforms:** Windows, macOS, Linux. **License:** LGPL-3.0 application; bundled archivers and optional plugins carry their own license terms.. **Pricing model:** free.
- **Compatibility details:** Native Windows, macOS and Linux releases are listed by the project. Architecture coverage and experimental builds differ by platform; included compression engines retain their own licenses.
- **Pick for:** Choose PeaZip for a graphical archive manager with multiple formats, encryption options and exportable command-line tasks.
- **Compare when:** Compare 7-Zip for a compact Windows workflow; use WinRAR when native RAR creation is essential.
- **Strengths:** Multi-format archive UI around compression backends
- **Limitations:** Archive creation and extraction support differ by format; RAR creation requires an installed RAR tool.; ACE extraction requires an optional legacy plugin that the project does not recommend because it is no longer maintained.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://peazip.github.io/) · [Official installation / downloads](https://peazip.github.io/) · [Repository](https://github.com/peazip/PeaZip)
- **Sources:** [Official application license and optional-plugin boundaries](https://peazip.github.io/) (2026-11-15; downloads, features, identity, license, platforms); [Official capabilities and practical usage basis](https://peazip.github.io/peazip-free-archiver.html) (2026-11-15; features, license, pricing); [Official PeaZip repository](https://github.com/peazip/PeaZip) (2026-11-14; identity)
### WinRAR

Windows archive utility for creating RAR archives and working with many archive formats.

- **Platforms:** Windows. **License:** Proprietary shareware. **Pricing model:** paid.
- **Pick for:** Useful when creating RAR archives or using their recovery features is required.
- **Compare when:** Trial is time-limited under the license
- **Strengths:** Useful when creating RAR archives or using their recovery features is required.
- **Limitations:** Trial is time-limited under the license; Windows GUI and command-line distributions have different platform coverage.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.rarlab.com/) · [Official installation / downloads](https://www.rarlab.com/download.htm)
- **Sources:** [Official project documentation](https://www.rarlab.com/) (2026-11-14; identity, features, pricing); [Official download or installation landing page](https://www.rarlab.com/download.htm) (2026-11-14; downloads, platforms); [Official application license agreement](https://www.win-rar.com/winrarlicense.html?&L=0) (2026-11-14; license)

## Data recovery

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fdata-recovery)

### DMDE

Disk editor and recovery tool with filesystem reconstruction and RAID capabilities.

- **Platforms:** Windows, macOS, Linux. **License:** Vendor application license; exact EULA not independently established in this review. **Pricing model:** freemium.
- **Pick for:** A specialist recovery and inspection option when detailed filesystem control is needed.
- **Compare when:** Free-edition recovery limits apply
- **Strengths:** A specialist recovery and inspection option when detailed filesystem control is needed.
- **Limitations:** Free-edition recovery limits apply; Disk editing can alter recoverable evidence.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://dmde.com/) · [Official installation / downloads](https://dmde.com/download.html)
- **Sources:** [Official project documentation](https://dmde.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://dmde.com/download.html) (2026-11-14; downloads)
### GNU ddrescue

Data recovery copier that prioritizes readable areas and records progress in a mapfile.

- **Platforms:** Linux, macOS. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Pick for:** Appropriate for imaging readable portions of failing media before logical recovery.
- **Compare when:** Not a filesystem undelete tool
- **Strengths:** Appropriate for imaging readable portions of failing media before logical recovery.
- **Limitations:** Not a filesystem undelete tool; Incorrect source and destination selection can overwrite data.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.gnu.org/software/ddrescue/) · [Official installation / downloads](https://www.gnu.org/software/ddrescue/)
- **Sources:** [Official project documentation](https://www.gnu.org/software/ddrescue/) (2026-11-14; identity, features, license, downloads); [Official project or distribution platform documentation](https://formulae.brew.sh/formula/ddrescue) (2026-11-14; platforms)
### PhotoRec

File-carving recovery utility that locates supported file signatures independently of filesystem metadata.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Useful when filesystem metadata is damaged but recoverable file content remains.
- **Compare when:** Recovered files may lose original names and folder structure
- **Strengths:** Useful when filesystem metadata is damaged but recoverable file content remains.
- **Limitations:** Recovered files may lose original names and folder structure; Save recovered output to a different drive.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.cgsecurity.org/wiki/PhotoRec) · [Official installation / downloads](https://www.cgsecurity.org/wiki/TestDisk_Download)
- **Sources:** [Official project documentation](https://www.cgsecurity.org/wiki/PhotoRec) (2026-11-14; features, identity, license, platforms, pricing); [Official download or installation landing page](https://www.cgsecurity.org/wiki/TestDisk_Download) (2026-11-14; downloads)
### R-Studio

Commercial recovery suite for supported filesystems, disk images and RAID reconstruction.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** Useful for advanced recovery workflows needing a commercial graphical tool.
- **Compare when:** Trial recovery restrictions and edition-specific features apply
- **Strengths:** Useful for advanced recovery workflows needing a commercial graphical tool.
- **Limitations:** Trial recovery restrictions and edition-specific features apply; Cannot guarantee recovery after overwrites or hardware failure.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.r-studio.com/) · [Official installation / downloads](https://www.r-studio.com/Data_Recovery_Download.shtml)
- **Sources:** [Official project documentation](https://www.r-studio.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.r-studio.com/Data_Recovery_Download.shtml) (2026-11-14; downloads); [Official application license agreement](https://www.r-studio.com/includes/eula/PopupEulaDRC.shtml?R-STUDIO) (2026-11-14; license)
### TestDisk

Partition recovery utility for diagnosing lost partitions and repairing supported filesystem structures.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Specialist option when a partition disappeared but the storage device remains readable.
- **Compare when:** Repair operations can change disk structures
- **Strengths:** Specialist option when a partition disappeared but the storage device remains readable.
- **Limitations:** Repair operations can change disk structures; Work from an image when failing hardware or valuable data is involved.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.cgsecurity.org/wiki/TestDisk) · [Official installation / downloads](https://www.cgsecurity.org/wiki/TestDisk_Download)
- **Sources:** [Official project documentation](https://www.cgsecurity.org/wiki/TestDisk) (2026-11-14; features, identity, license, platforms, pricing); [Official download or installation landing page](https://www.cgsecurity.org/wiki/TestDisk_Download) (2026-11-14; downloads)

## System imaging and recovery

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fdisk-imaging)

### Clonezilla

Bootable disk imaging and cloning suite for partition and machine recovery.

- **Platforms:** Bootable. **License:** GPL-2.0. **Pricing model:** free.
- **Compatibility details:** Runs from separate boot media on supported PC hardware, outside the installed desktop operating system.
- **Pick for:** A specialist choice for offline disk images and repeatable machine deployment.
- **Compare when:** Typically requires booting separate recovery media
- **Strengths:** A specialist choice for offline disk images and repeatable machine deployment.
- **Limitations:** Typically requires booting separate recovery media; Restoring an image overwrites the selected destination.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-14. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/stevenshiau/clonezilla/releases.atom))
- [Official project](https://clonezilla.org/) · [Official installation / downloads](https://clonezilla.org/downloads.php) · [Repository](https://github.com/stevenshiau/clonezilla)
- **Sources:** [Official project documentation](https://clonezilla.org/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/stevenshiau/clonezilla) (2026-11-14; identity, features); [Official download or installation landing page](https://clonezilla.org/downloads.php) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/stevenshiau/clonezilla/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/stevenshiau/clonezilla/releases.atom) (2026-11-14; maintenance)
### Macrium Reflect

Windows disk imaging and recovery software for scheduled image backups and rescue media.

- **Platforms:** Windows. **License:** Proprietary commercial license. **Pricing model:** subscription.
- **Pick for:** Useful for Windows users seeking an integrated commercial imaging and restore workflow.
- **Compare when:** Commercial edition and licensing terms must be checked for the intended use
- **Strengths:** Useful for Windows users seeking an integrated commercial imaging and restore workflow.
- **Limitations:** Commercial edition and licensing terms must be checked for the intended use; Restore testing is still needed on the target hardware.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.macrium.com/products/home) · [Official installation / downloads](https://www.macrium.com/products/home)
- **Sources:** [Official project documentation](https://www.macrium.com/products/home) (2026-11-14; identity, features, platforms, pricing, downloads); [Official application license agreement](https://www.macrium.com/eula) (2026-11-14; license)
### Rescuezilla

Bootable graphical disk imaging and recovery environment compatible with Clonezilla images.

- **Platforms:** Bootable. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** Runs from separate boot media on supported PC hardware, outside the installed desktop operating system.
- **Pick for:** A graphical route to offline disk imaging and restore operations.
- **Compare when:** Requires booting the live environment
- **Strengths:** A graphical route to offline disk imaging and restore operations.
- **Limitations:** Requires booting the live environment; Verify target disk and current release warnings before restoration.
- **Maintenance:** active — Official release feed contains activity dated 2026-05-16. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/rescuezilla/rescuezilla/releases.atom))
- [Official project](https://rescuezilla.com/) · [Official installation / downloads](https://rescuezilla.com/download) · [Repository](https://github.com/rescuezilla/rescuezilla)
- **Sources:** [Official project documentation](https://rescuezilla.com/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/rescuezilla/rescuezilla) (2026-11-14; identity, features); [Official download or installation landing page](https://rescuezilla.com/download) (2026-11-14; downloads, platforms); [Official source license](https://raw.githubusercontent.com/rescuezilla/rescuezilla/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/rescuezilla/rescuezilla/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/rescuezilla/rescuezilla/releases/expanded_assets/2.6.2) (2026-11-14; pricing)
### Veeam Agent for Microsoft Windows

Windows endpoint backup software supporting system, volume and file recovery.

- **Platforms:** Windows. **License:** Proprietary; free and commercial editions. **Pricing model:** freemium.
- **Pick for:** A Windows-focused option for whole-machine backup with a free edition.
- **Compare when:** Feature limits differ between free and licensed editions
- **Strengths:** A Windows-focused option for whole-machine backup with a free edition.
- **Limitations:** Feature limits differ between free and licensed editions; Registration and supported Windows versions should be checked before deployment.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.veeam.com/products/free/microsoft-windows.html) · [Official installation / downloads](https://www.veeam.com/products/free/microsoft-windows.html)
- **Sources:** [Official project documentation](https://www.veeam.com/products/free/microsoft-windows.html) (2026-11-14; identity, features, platforms, pricing, downloads); [Official application license agreement](https://www.veeam.com/legal/eula.html) (2026-11-14; license)

## Duplicate detection

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fduplicate-detection)

### Czkawka / Krokiet

Duplicate and similar-image discovery

- **Platforms:** Windows. **License:** Mixed/component licenses; GitHub NOASSERTION is not approval. **Pricing model:** unknown.
- **Compatibility details:** Windows; see linked upstream requirements for exact supported build/architecture
- **Pick for:** Duplicate and similar-image discovery
- **Compare when:** Byte-identical, near-duplicate and distinct-image fixtures; false-positive rate before deletion
- **Strengths:** Duplicate and similar-image discovery
- **Limitations:** Similar image is not identical; preserve originals and review groups; Reuse unresolved until component LICENSE files reviewed; consider bounded external adapter first
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/qarmin/czkawka) · [Repository](https://github.com/qarmin/czkawka)
- **Sources:** [Preserved original research source](https://github.com/qarmin/czkawka) (2026-11-14; identity, features)
### dupeGuru

Graphical duplicate-file finder with dedicated music and picture matching modes.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Useful when duplicate review needs a GUI and media-aware matching.
- **Compare when:** Similarity matches still need manual review
- **Strengths:** Useful when duplicate review needs a GUI and media-aware matching.
- **Limitations:** Similarity matches still need manual review; Removing duplicates can break references in other applications.
- **Maintenance:** unverified — Official release feed contains activity dated 2022-07-16. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/arsenetar/dupeguru/releases.atom))
- [Official project](https://dupeguru.voltaicideas.net/) · [Official installation / downloads](https://dupeguru.voltaicideas.net/) · [Repository](https://github.com/arsenetar/dupeguru)
- **Sources:** [Official project documentation](https://dupeguru.voltaicideas.net/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/arsenetar/dupeguru) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/arsenetar/dupeguru/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/arsenetar/dupeguru/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/arsenetar/dupeguru/releases/expanded_assets/4.3.1) (2026-11-14; pricing)
### fclones

Command-line duplicate-file finder supporting grouped reports and controlled file actions.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Fits scripted duplicate audits where a reviewable report is needed before changes.
- **Compare when:** Command-line tool
- **Strengths:** Fits scripted duplicate audits where a reviewable report is needed before changes.
- **Limitations:** Command-line tool; Deletion or linking requires checking application and filesystem assumptions.
- **Maintenance:** unverified — Official release feed contains activity dated 2025-03-03. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/pkolaczk/fclones/releases.atom))
- [Official project](https://github.com/pkolaczk/fclones) · [Official installation / downloads](https://github.com/pkolaczk/fclones/releases) · [Repository](https://github.com/pkolaczk/fclones)
- **Sources:** [Official project documentation](https://github.com/pkolaczk/fclones) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/pkolaczk/fclones/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/pkolaczk/fclones/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/pkolaczk/fclones/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/pkolaczk/fclones/releases/expanded_assets/v0.35.0) (2026-11-14; pricing)
### jdupes

Command-line duplicate scanner with optional deletion and link-based consolidation.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for repeatable duplicate scans with explicit command-line control.
- **Compare when:** Linking changes how later edits affect files
- **Strengths:** Useful for repeatable duplicate scans with explicit command-line control.
- **Limitations:** Linking changes how later edits affect files; Review destructive flags before applying actions.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://codeberg.org/jbruchon/jdupes) · [Official installation / downloads](https://codeberg.org/jbruchon/jdupes/releases) · [Repository](https://codeberg.org/jbruchon/jdupes)
- **Sources:** [Official project documentation](https://codeberg.org/jbruchon/jdupes) (2026-11-14; identity, features, platforms, license); [Official download or installation landing page](https://codeberg.org/jbruchon/jdupes/releases) (2026-11-14; downloads, pricing)

## Graphical file managers

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Ffile-managers)

### Directory Opus

Queued copies, dual panes, metadata and batch rename

- **Platforms:** Windows. **License:** Proprietary commercial; reuse not established. **Pricing model:** unknown.
- **Compatibility details:** Native 64-bit Windows file manager
- **Pick for:** Queued copies, dual panes, metadata and batch rename
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Queued copies, dual panes, metadata and batch rename
- **Limitations:** Do not copy vendor performance superlatives into ranking; benchmark large-tree navigation; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.gpsoft.com.au/)
- **Sources:** [Preserved original research source](https://www.gpsoft.com.au/) (2026-11-14; identity, features)
### Dolphin (KDE file manager)

KDE file manager with split views, tabs and integrated file-management services.

- **Platforms:** Linux, Windows. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Compatibility details:** KDE lists Windows distribution; strongest integration is with the KDE Linux desktop.
- **Pick for:** A strong KDE desktop fit for navigating files with graphical and terminal workflows.
- **Compare when:** Best integrated with KDE services
- **Strengths:** A strong KDE desktop fit for navigating files with graphical and terminal workflows.
- **Limitations:** Best integrated with KDE services; Network and preview capabilities depend on installed plugins.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://apps.kde.org/dolphin/) · [Official installation / downloads](https://apps.kde.org/dolphin/)
- **Sources:** [Official project documentation](https://apps.kde.org/dolphin/) (2026-11-14; identity, features, platforms, license, downloads)
### Double Commander

Dual-pane file manager

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** GPL-2.0. **Pricing model:** free.
- **Compatibility details:** Windows, Linux and native Cocoa macOS builds are offered; FreeBSD is available through ports. Linux GTK and Qt builds have different toolkit dependencies.
- **Pick for:** Choose Double Commander for a keyboard-friendly two-panel file-management workflow across desktop platforms.
- **Compare when:** Compare Total Commander for its Windows ecosystem or FreeFileSync for dedicated synchronization-job previews.
- **Strengths:** Dual-pane file manager
- **Limitations:** Two-panel copy and move operations require attention to the active source pane and destination.; Platform builds use different GUI libraries; verify required plugins and integration features on the operating system you use.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/doublecmd/doublecmd) · [Official installation / downloads](https://sourceforge.net/p/doublecmd/wiki/Download/) · [Repository](https://github.com/doublecmd/doublecmd)
- **Sources:** [Official Double Commander repository](https://github.com/doublecmd/doublecmd) (2026-11-14; features, identity); [Official capabilities and practical usage basis](https://doublecmd.sourceforge.io/) (2026-11-15; features, pricing); [Maintainer platform requirements](https://github.com/doublecmd/doublecmd/wiki/Supported-platforms) (2026-11-14; platforms); [Maintainer download portal linked by the project homepage](https://sourceforge.net/p/doublecmd/wiki/Download/) (2026-11-14; downloads, platforms)
### Explorer++

Tabbed Windows file manager with a portable distribution.

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Compact option for users who want tabs and familiar Windows file operations.
- **Compare when:** Windows-only
- **Strengths:** Compact option for users who want tabs and familiar Windows file operations.
- **Limitations:** Windows-only; Feature depth differs from commercial dual-pane file managers.
- **Maintenance:** unverified — Official release feed contains activity dated 2024-01-28. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/derceg/explorerplusplus/releases.atom))
- [Official project](https://explorerplusplus.com/) · [Official installation / downloads](https://explorerplusplus.com/download) · [Repository](https://github.com/derceg/explorerplusplus)
- **Sources:** [Official project documentation](https://explorerplusplus.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/derceg/explorerplusplus) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://explorerplusplus.com/download) (2026-11-14; downloads, pricing); [Official source license](https://raw.githubusercontent.com/derceg/explorerplusplus/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/derceg/explorerplusplus/releases.atom) (2026-11-14; maintenance)
### Files

Tabs, file tags and multitasking navigation

- **Platforms:** Windows. **License:** MIT and MPL-2.0 files; audit per-file boundary. **Pricing model:** unknown.
- **Compatibility details:** Windows file manager
- **Pick for:** Tabs, file tags and multitasking navigation
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Tabs, file tags and multitasking navigation
- **Limitations:** Test rename/copy cancellation and Explorer fallback before replacement; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/files-community/Files) · [Repository](https://github.com/files-community/Files)
- **Sources:** [Preserved original research source](https://github.com/files-community/Files) (2026-11-14; identity, features)
### GNOME Files

GNOME desktop file manager for local files and supported remote locations.

- **Platforms:** Linux. **License:** GPL-3.0-or-later. **Pricing model:** unknown.
- **Pick for:** A consistent default for GNOME users managing everyday documents and shares.
- **Compare when:** Advanced bulk operations may require extensions or external tools
- **Strengths:** A consistent default for GNOME users managing everyday documents and shares.
- **Limitations:** Advanced bulk operations may require extensions or external tools; Available remote backends depend on the system.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://apps.gnome.org/Nautilus/) · [Official installation / downloads](https://apps.gnome.org/Nautilus/)
- **Sources:** [Official project documentation](https://apps.gnome.org/Nautilus/) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/GNOME/nautilus/HEAD/LICENSE) (2026-11-14; license); [Official Nautilus documentation and license](https://gnome.pages.gitlab.gnome.org/nautilus/) (2026-11-14; identity, features, license)
### Multi Commander

Windows multi-tabbed dual-pane file manager with tools and extension support.

- **Platforms:** Windows. **License:** Vendor application license; exact EULA not independently established in this review. **Pricing model:** free.
- **Pick for:** A free graphical option for users comfortable with commander-style navigation.
- **Compare when:** Windows-only proprietary application
- **Strengths:** A free graphical option for users comfortable with commander-style navigation.
- **Limitations:** Windows-only proprietary application; Many options add a learning cost.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://multicommander.com/) · [Official installation / downloads](https://multicommander.com/downloads)
- **Sources:** [Official project documentation](https://multicommander.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://multicommander.com/downloads) (2026-11-14; downloads)
### Nemo

Cinnamon file manager offering desktop integration and expandable file actions.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Natural fit for Linux Mint Cinnamon users wanting integrated folder management.
- **Compare when:** Linux desktop application
- **Strengths:** Natural fit for Linux Mint Cinnamon users wanting integrated folder management.
- **Limitations:** Linux desktop application; Extensions and distribution packaging affect capabilities.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/linuxmint/nemo/releases.atom))
- [Official project](https://github.com/linuxmint/nemo) · [Official installation / downloads](https://github.com/linuxmint/nemo) · [Repository](https://github.com/linuxmint/nemo)
- **Sources:** [Official project documentation](https://github.com/linuxmint/nemo) (2026-11-14; downloads, features, identity, platforms, pricing); [Official source license](https://raw.githubusercontent.com/linuxmint/nemo/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/linuxmint/nemo/releases.atom) (2026-11-14; maintenance)
### OneCommander

Modern Windows file manager with dual-pane layouts and visual file navigation.

- **Platforms:** Windows. **License:** Proprietary; personal free and commercial/Pro terms. **Pricing model:** freemium.
- **Pick for:** Good comparison candidate for visual dual-pane Windows file management.
- **Compare when:** Edition and commercial-use terms differ
- **Strengths:** Good comparison candidate for visual dual-pane Windows file management.
- **Limitations:** Edition and commercial-use terms differ; Requires a supported modern Windows environment.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.onecommander.com/) · [Official installation / downloads](https://onecommander.com/download)
- **Sources:** [Official project documentation](https://www.onecommander.com/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://onecommander.com/download) (2026-11-14; downloads)
### Q-Dir

Windows file manager centered on configurable multiple folder panes.

- **Platforms:** Windows. **License:** Proprietary freeware. **Pricing model:** free.
- **Pick for:** Convenient for comparing and moving files across several folders at once.
- **Compare when:** Proprietary Windows utility
- **Strengths:** Convenient for comparing and moving files across several folders at once.
- **Limitations:** Proprietary Windows utility; Dense multi-pane layouts may be less suitable on small displays.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.softwareok.com/?seite=Freeware/Q-Dir) · [Official installation / downloads](https://www.softwareok.com/?Download=Q-Dir)
- **Sources:** [Official project documentation](https://www.softwareok.com/?seite=Freeware/Q-Dir) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://www.softwareok.com/?Download=Q-Dir) (2026-11-14; downloads)
### Thunar

Xfce file manager with custom actions and bulk renaming.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Pick for:** Fits users seeking a focused graphical Linux file manager.
- **Compare when:** Advanced previews and services may need extensions
- **Strengths:** Fits users seeking a focused graphical Linux file manager.
- **Limitations:** Advanced previews and services may need extensions; Desktop integration is centered on Xfce.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://docs.xfce.org/xfce/thunar/start) · [Official installation / downloads](https://docs.xfce.org/xfce/thunar/start)
- **Sources:** [Official project documentation](https://docs.xfce.org/xfce/thunar/start) (2026-11-14; identity, features, downloads); [Official source license](https://raw.githubusercontent.com/xfce-mirror/thunar/HEAD/COPYING) (2026-11-14; license); [Official project or distribution platform documentation](https://archlinux.org/packages/extra/x86_64/thunar/) (2026-11-14; platforms)
### Total Commander

Dual-pane file operations, archives and multi-rename

- **Platforms:** Windows. **License:** Proprietary/shareware; reuse not established. **Pricing model:** unknown.
- **Compatibility details:** Official current Windows release
- **Pick for:** Dual-pane file operations, archives and multi-rename
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Dual-pane file operations, archives and multi-rename
- **Limitations:** Behavioral inspiration only; verify paid terms and extension trust separately; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.ghisler.com/)
- **Sources:** [Preserved original research source](https://www.ghisler.com/) (2026-11-14; identity, features)
### XYplorer

Portable Windows file manager with tabs, scripting and detailed file search.

- **Platforms:** Windows. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** Useful for scripted file workflows and portable Windows folder organization.
- **Compare when:** Commercial license
- **Strengths:** Useful for scripted file workflows and portable Windows folder organization.
- **Limitations:** Commercial license; Its scripting model requires learning for advanced automation.
- **Maintenance:** active — Official site lists the 64-bit 28.40.0600 release dated 2026-10-13. Installed behavior was not tested. ([evidence](https://www.xyplorer.com/))
- [Official project](https://www.xyplorer.com/) · [Official installation / downloads](https://www.xyplorer.com/download.php)
- **Sources:** [Official project documentation](https://www.xyplorer.com/) (2026-11-14; identity, features, platforms, pricing, maintenance); [Official download or installation landing page](https://www.xyplorer.com/download.php) (2026-11-14; downloads); [Official application license agreement](https://www.xyplorer.com/purchase.php?lic=SL) (2026-11-14; license)

## Quick file previews

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Ffile-preview)

### QuickLook

Spacebar file previews

- **Platforms:** Windows. **License:** GPL-3.0 application; plugins can have separate requirements.. **Pricing model:** free.
- **Compatibility details:** Windows file-preview application. Installer and Store variants differ in integration; supported formats may require separate plugins.
- **Pick for:** Choose QuickLook to preview a selected Windows file with the Space key before opening its editing application.
- **Compare when:** Compare PowerToys Peek for a different preview workflow; choose by the file types and file-manager integration you use.
- **Strengths:** Spacebar file previews
- **Limitations:** File-format coverage depends on the bundled viewer and optional plugins; a preview is not a full editing application.; Store and installer variants have different integration limits, including support for Open/Save dialogs.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/QL-Win/QuickLook) · [Official installation / downloads](https://github.com/QL-Win/QuickLook/releases) · [Repository](https://github.com/QL-Win/QuickLook)
- **Sources:** [Official preview capabilities, distribution options, free-use statement and license](https://github.com/QL-Win/QuickLook) (2026-11-15; downloads, features, identity, license, platforms, pricing)

## File and folder search

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Ffile-search)

### broot

Interactive directory tree browser with fuzzy search and configurable file commands.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for discovering and jumping through large directory trees.
- **Compare when:** Shell integration varies by environment
- **Strengths:** Useful for discovering and jumping through large directory trees.
- **Limitations:** Shell integration varies by environment; Not a full graphical file-management replacement.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-01. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/Canop/broot/releases.atom))
- [Official project](https://dystroy.org/broot/) · [Official installation / downloads](https://dystroy.org/broot/install/) · [Repository](https://github.com/Canop/broot)
- **Sources:** [Official project documentation](https://dystroy.org/broot/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/Canop/broot) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://dystroy.org/broot/install/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/Canop/broot/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/Canop/broot/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/Canop/broot/releases/expanded_assets/v1.62.0) (2026-11-14; pricing)
### Everything

Fast indexed filename search

- **Platforms:** Windows. **License:** Vendor-distributed freeware with MIT-style binary license text; full application source availability was not verified.. **Pricing model:** free.
- **Compatibility details:** Windows application; stable and beta downloads are separately labeled. NTFS indexing requires its service or appropriate elevation. Lite omits IPC and screen-reader/accessibility integration.
- **Pick for:** Choose Everything for finding files by name or path on indexed Windows storage.
- **Compare when:** Compare DocFetcher for indexed document-content search or Listary for launcher-style file selection in application dialogs.
- **Strengths:** Fast indexed filename search
- **Limitations:** The standard filename index does not index document contents; content searches read files and can be much slower.; NTFS indexing requires the Everything service or administrative access; network and other filesystem locations use different indexing methods.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.voidtools.com/support/everything/) · [Official installation / downloads](https://www.voidtools.com/downloads/)
- **Sources:** [Preserved original research source](https://www.voidtools.com/support/everything/) (2026-11-14; identity, features); [Official capabilities and practical usage basis](https://www.voidtools.com/faq/) (2026-11-15; features, platforms, pricing); [Official stable and beta download portal](https://www.voidtools.com/downloads/) (2026-11-14; downloads); [Official license text accompanying the distributed binary](https://www.voidtools.com/License.txt) (2026-11-15; license)

## File synchronization

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Ffile-synchronization)

### FreeFileSync

Visual folder comparison and synchronization

- **Platforms:** Windows, macOS, Linux. **License:** Edition-specific; business/government installation requires Business Edition license per FAQ. **Pricing model:** freemium.
- **Compatibility details:** Native Windows, macOS and Linux editions. Standard and Donation editions are for private personal use; businesses, organizations and commercial use require Business Edition.
- **Pick for:** Choose FreeFileSync for visual folder comparisons and repeatable one-way or two-way synchronization jobs.
- **Compare when:** Compare Syncthing for continuous device synchronization or restic and Kopia when retained encrypted snapshots are the priority.
- **Strengths:** Visual folder comparison and synchronization
- **Limitations:** Mirror and two-way modes handle deletions differently; inspect the comparison and choose a direction before applying changes.; The standard and Donation editions are for private personal use. Commercial users and organizations require the Business Edition.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://freefilesync.org/faq.php) · [Official installation / downloads](https://freefilesync.org/download.php)
- **Sources:** [Official capabilities and practical usage basis](https://freefilesync.org/faq.php) (2026-11-15; features, identity, license, platforms, pricing); [Preserved original research source](https://freefilesync.org/) (2026-11-14; identity, features); [Official FreeFileSync downloads](https://freefilesync.org/download.php) (2026-11-14; downloads, platforms); [Official synchronization directions and deletion behavior](https://freefilesync.org/manual.php?topic=synchronization-settings) (2026-11-15; features)
### rsync

Scriptable local and remote copying tool using differential transfer to update files.

- **Platforms:** Linux, macOS, FreeBSD. **License:** GPL-3.0 with OpenSSL/xxhash linking exceptions. **Pricing model:** unknown.
- **Compatibility details:** Native Unix-like package/build workflows; Windows users need a supported port or compatibility environment.
- **Pick for:** Fits repeatable one-way file synchronization and scripted transfer workflows on Unix-like systems.
- **Compare when:** Deletion and direction options can overwrite or remove destination data.
- **Strengths:** Fits repeatable one-way file synchronization and scripted transfer workflows on Unix-like systems.
- **Limitations:** Deletion and direction options can overwrite or remove destination data.; Remote transfers need compatible tooling and permissions; bidirectional conflict resolution is not its main role.
- **Maintenance:** active — Official project homepage announces rsync 3.5.2 released 2026-11-04. This is documentation/release evidence, not installed compatibility testing. ([evidence](https://rsync.samba.org/))
- [Official project](https://rsync.samba.org/) · [Official installation / downloads](https://rsync.samba.org/download.html) · [Repository](https://github.com/RsyncProject/rsync)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/RsyncProject/rsync/HEAD/README.md) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://raw.githubusercontent.com/RsyncProject/rsync/HEAD/INSTALL.md) (2026-11-14; platforms); [Official application license text](https://raw.githubusercontent.com/RsyncProject/rsync/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://rsync.samba.org/download.html) (2026-11-14; downloads); [Official project identity and product page](https://rsync.samba.org/) (2026-11-14; identity, maintenance)
### Syncthing

Peer-to-peer continuous synchronization

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MPL-2.0. **Pricing model:** free.
- **Compatibility details:** The base distribution is a daemon or command-line application with a browser interface. Desktop tray integrations are separate projects and may have different requirements.
- **Pick for:** Choose Syncthing to keep selected folders synchronized among your own computers without a mandatory central storage provider.
- **Compare when:** Compare LocalSend for an occasional nearby transfer and restic or Kopia for independent historical backups.
- **Strengths:** Peer-to-peer continuous synchronization
- **Limitations:** Deletions and unwanted changes can propagate to other devices; synchronization alone is not an independent backup.; Peers need connectivity and time online to exchange changes; desktop tray applications are separate projects from the core daemon.; File versioning is disabled by default and cannot archive an earlier version when the file is changed locally on the same device.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/syncthing/syncthing) · [Official installation / downloads](https://syncthing.net/downloads/) · [Repository](https://github.com/syncthing/syncthing)
- **Sources:** [Official capabilities and practical usage basis](https://github.com/syncthing/syncthing) (2026-11-15; features, identity); [Official Syncthing platform and open-source overview](https://syncthing.net/) (2026-11-14; license, platforms); [Official publicly distributed Syncthing builds](https://syncthing.net/downloads/) (2026-11-14; downloads, platforms); [Official synchronization and backup caveats](https://docs.syncthing.net/users/faq.html) (2026-11-15; features); [Maintainer application package publicly available without payment](https://github.com/syncthing/syncthing/releases/download/v2.1.7/syncthing-windows-amd64-v2.1.7.zip) (2026-11-15; downloads, pricing); [Official current file-versioning defaults and remote-change boundary](https://docs.syncthing.net/users/versioning.html) (2026-11-17; features)
### Unison

Two-way file synchronizer that reconciles changes made independently in two directory trees.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** GPL-3.0. **Pricing model:** unknown.
- **Pick for:** Choose for periodically reconciling two working directories while retaining explicit conflict review.
- **Compare when:** Compatible Unison versions and configuration are needed at both ends.
- **Strengths:** Choose for periodically reconciling two working directories while retaining explicit conflict review.
- **Limitations:** Compatible Unison versions and configuration are needed at both ends.; Synchronization can propagate deletion; it does not replace independent backup history.
- **Maintenance:** active — Official release-feed entry 'v2.54.0' updated 2026-05-01. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/bcpierce00/unison/releases.atom))
- [Official project](https://github.com/bcpierce00/unison) · [Official installation / downloads](https://github.com/bcpierce00/unison) · [Repository](https://github.com/bcpierce00/unison)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/bcpierce00/unison/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/bcpierce00/unison/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/bcpierce00/unison) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/bcpierce00/unison/releases.atom) (2026-11-14; maintenance)

## Filesystem drivers and bridges

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Ffilesystem-bridges)

### WinBtrfs

Windows filesystem driver for reading and writing Btrfs volumes.

- **Platforms:** Windows. **License:** LGPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** The project documents Windows support and per-feature limitations; support for a particular Btrfs feature set is not assumed.
- **Pick for:** A specialist option for accessing an existing Btrfs data volume from Windows.
- **Compare when:** Filesystem-driver installation changes low-level storage behavior; keep an independent backup.
- **Strengths:** A specialist option for accessing an existing Btrfs data volume from Windows.
- **Limitations:** Filesystem-driver installation changes low-level storage behavior; keep an independent backup.; Feature coverage and Linux RAID arrangements require review; some configurations need additional drivers.
- **Maintenance:** active — Official release-feed entry 'Version 1.10' updated 2026-09-01. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/maharmstone/btrfs/releases.atom))
- [Official project](https://github.com/maharmstone/btrfs) · [Official installation / downloads](https://github.com/maharmstone/btrfs) · [Repository](https://github.com/maharmstone/btrfs)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/maharmstone/btrfs/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/maharmstone/btrfs/HEAD/LICENCE) (2026-11-14; license); [Official download or installation landing page](https://github.com/maharmstone/btrfs) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/maharmstone/btrfs/releases.atom) (2026-11-14; maintenance)
### WinFsp

Windows filesystem runtime that lets user-mode software expose storage as ordinary Windows drives.

- **Platforms:** Windows. **License:** GPL-3.0 with FLOSS exception; commercial licenses available. **Pricing model:** mixed.
- **Compatibility details:** README lists Windows 7–11 and x86, x64 and ARM64; the integrating application may impose stricter requirements.
- **Pick for:** Useful as the filesystem foundation for mounting tools and custom Windows storage integrations.
- **Compare when:** It is a runtime platform; an appropriate filesystem application is still needed.
- **Strengths:** Useful as the filesystem foundation for mounting tools and custom Windows storage integrations.
- **Limitations:** It is a runtime platform; an appropriate filesystem application is still needed.; Proprietary redistribution or integration needs review of the commercial license and FLOSS exception.
- **Maintenance:** active — Official release-feed entry 'WinFsp 2026 Beta5' updated 2026-10-13. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/winfsp/winfsp/releases.atom))
- [Official project](https://github.com/winfsp/winfsp) · [Official installation / downloads](https://github.com/winfsp/winfsp) · [Repository](https://github.com/winfsp/winfsp)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/winfsp/winfsp/HEAD/README.md) (2026-11-14; features, identity, license, platforms, pricing); [Official application license text](https://raw.githubusercontent.com/winfsp/winfsp/HEAD/License.txt) (2026-11-14; license); [Official download or installation landing page](https://github.com/winfsp/winfsp) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/winfsp/winfsp/releases.atom) (2026-11-14; maintenance)

## Client-server backup

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fnetwork-backup)

### UrBackup

Client/server backup system combining file and supported image backup workflows.

- **Platforms:** Windows, Linux, macOS. **License:** AGPL-3.0-or-later server; client component licenses vary. **Pricing model:** free.
- **Pick for:** Useful when several PCs need centrally managed backup schedules.
- **Compare when:** Image-backup capabilities vary by client OS
- **Strengths:** Useful when several PCs need centrally managed backup schedules.
- **Limitations:** Image-backup capabilities vary by client OS; Server storage capacity and restore-media testing remain required.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-09. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/uroni/urbackup_backend/releases.atom))
- [Official project](https://www.urbackup.org/) · [Official installation / downloads](https://www.urbackup.org/download.html) · [Repository](https://github.com/uroni/urbackup_backend)
- **Sources:** [Official project documentation](https://www.urbackup.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/uroni/urbackup_backend) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.urbackup.org/download.html) (2026-11-14; downloads, pricing); [Official source license](https://raw.githubusercontent.com/uroni/urbackup_backend/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/uroni/urbackup_backend/releases.atom) (2026-11-14; maintenance)

## Disk partition management

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fpartition-management)

### DiskGenius

Windows disk utility combining partition management, recovery inspection and cloning.

- **Platforms:** Windows. **License:** Vendor license; exact application EULA not independently reviewed. **Pricing model:** freemium.
- **Compatibility details:** Windows application; the official download page says current releases no longer support Windows XP.
- **Pick for:** Useful for a Windows workflow that needs several disk-management tasks in one application.
- **Compare when:** Free-edition recovery and advanced features are limited; verify the edition before purchase.
- **Strengths:** Useful for a Windows workflow that needs several disk-management tasks in one application.
- **Limitations:** Free-edition recovery and advanced features are limited; verify the edition before purchase.; Partition editing, wiping and repair operations can modify data; recovery results are not guaranteed.; The full application EULA still needs review; no open-source license classification is asserted.
- **Maintenance:** unverified — Official project/download documentation was reviewed; dated release or maintenance activity was not established by the sources reviewed. ([evidence](https://www.diskgenius.com/))
- [Official project](https://www.diskgenius.com/) · [Official installation / downloads](https://www.diskgenius.com/download.php)
- **Sources:** [Official project feature documentation](https://www.diskgenius.com/) (2026-11-14; features, identity, maintenance, pricing); [Official supported-platform and installation documentation](https://www.diskgenius.com/download.php) (2026-11-14; downloads, platforms)
### GNOME Disks

GNOME storage utility for inspecting devices, configuring volumes and mounting disk images.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux desktop application using the GNOME/UDisks storage stack.
- **Pick for:** Fits routine Linux disk inspection within the GNOME desktop.
- **Compare when:** Formatting and partition changes modify data on the selected device.
- **Strengths:** Fits routine Linux disk inspection within the GNOME desktop.
- **Limitations:** Formatting and partition changes modify data on the selected device.; Filesystem operations depend on the installed storage services and permissions.
- **Maintenance:** active — Official release-feed entry '51.beta' updated 2026-07-30. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/GNOME/gnome-disk-utility/releases.atom))
- [Official project](https://apps.gnome.org/DiskUtility/) · [Official installation / downloads](https://apps.gnome.org/DiskUtility/) · [Repository](https://github.com/GNOME/gnome-disk-utility)
- **Sources:** [Official project feature documentation](https://apps.gnome.org/DiskUtility/) (2026-11-14; downloads, features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/GNOME/gnome-disk-utility/HEAD/COPYING) (2026-11-14; license); [Official release activity or lifecycle basis](https://github.com/GNOME/gnome-disk-utility/releases.atom) (2026-11-14; maintenance)
### GParted

Graphical partition editor available as a Linux application and a bootable recovery environment.

- **Platforms:** Linux, Bootable. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Compatibility details:** The desktop application runs on Linux. Other operating systems are serviced by booting GParted Live, not by a native Windows or macOS build.
- **Pick for:** Choose for inspecting or changing supported partition layouts from independent boot media.
- **Compare when:** Resizing and moving partitions can lose data if interrupted or misconfigured.
- **Strengths:** Choose for inspecting or changing supported partition layouts from independent boot media.
- **Limitations:** Resizing and moving partitions can lose data if interrupted or misconfigured.; Supported operations differ by filesystem and may require an unmounted volume.
- **Maintenance:** unverified — Official project/download documentation was reviewed; dated release or maintenance activity was not established by the sources reviewed. ([evidence](https://gparted.org/))
- [Official project](https://gparted.org/) · [Official installation / downloads](https://gparted.org/download.php)
- **Sources:** [Official project feature documentation](https://gparted.org/) (2026-11-14; features, identity, license, maintenance, platforms, pricing); [Official download or installation landing page](https://gparted.org/download.php) (2026-11-14; downloads)

## Disk space analysis

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fstorage-analysis)

### duf

Terminal disk-space utility showing mounted filesystems with filters and structured output.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Official README lists Linux, BSD, macOS and Windows packages/binaries.
- **Pick for:** Fits checking capacity across mounted volumes quickly in a shell or script.
- **Compare when:** It reports filesystem totals rather than finding which folders consume the space.
- **Strengths:** Fits checking capacity across mounted volumes quickly in a shell or script.
- **Limitations:** It reports filesystem totals rather than finding which folders consume the space.; Mounted devices and available values depend on the operating system.
- **Maintenance:** active — Official release-feed entry 'v0.9.1' updated 2025-09-08. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/muesli/duf/releases.atom))
- [Official project](https://github.com/muesli/duf) · [Official installation / downloads](https://github.com/muesli/duf) · [Repository](https://github.com/muesli/duf)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/muesli/duf/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/muesli/duf/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/muesli/duf) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/muesli/duf/releases.atom) (2026-11-14; maintenance)
### GrandPerspective

macOS disk-usage visualizer that represents file sizes as a treemap.

- **Platforms:** macOS. **License:** GNU GPL; exact version not verified in this review. **Pricing model:** mixed.
- **Pick for:** A visual way to find large files on a Mac.
- **Compare when:** Scan access depends on macOS privacy permissions
- **Strengths:** A visual way to find large files on a Mac.
- **Limitations:** Scan access depends on macOS privacy permissions; App Store and direct-download distribution terms differ.
- **Maintenance:** active — Official release notes list 3.8.1 on 2026-09-13. Installed behavior was not tested. ([evidence](https://grandperspectiv.sourceforge.net/))
- [Official project](https://grandperspectiv.sourceforge.net/) · [Official installation / downloads](https://grandperspectiv.sourceforge.net/)
- **Sources:** [Official project documentation](https://grandperspectiv.sourceforge.net/) (2026-11-14; identity, features, platforms, license, pricing, downloads, maintenance)
### ncdu

Terminal disk-usage analyzer for navigating directory sizes interactively.

- **Platforms:** Linux, macOS. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for diagnosing disk space through a local or SSH terminal.
- **Compare when:** Filesystem permissions affect what is visible
- **Strengths:** Useful for diagnosing disk space through a local or SSH terminal.
- **Limitations:** Filesystem permissions affect what is visible; Scan results can change while files are being modified.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://dev.yorhel.nl/ncdu) · [Official installation / downloads](https://dev.yorhel.nl/ncdu)
- **Sources:** [Official project documentation](https://dev.yorhel.nl/ncdu) (2026-11-14; downloads, features, identity, license, platforms, pricing)
### TreeSize

Windows storage analysis software with folder-size reporting and paid advanced features.

- **Platforms:** Windows. **License:** Proprietary; Free and paid editions. **Pricing model:** freemium.
- **Pick for:** Useful for Windows folder-size investigation with a choice of free or commercial features.
- **Compare when:** Advanced reporting and enterprise features require paid editions
- **Strengths:** Useful for Windows folder-size investigation with a choice of free or commercial features.
- **Limitations:** Advanced reporting and enterprise features require paid editions; Permissions can hide protected folders.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.jam-software.com/treesize) · [Official installation / downloads](https://www.jam-software.com/treesize_free)
- **Sources:** [Official project documentation](https://www.jam-software.com/treesize) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://www.jam-software.com/treesize_free) (2026-11-14; downloads)
### WinDirStat

Disk usage visualization, large-file discovery

- **Platforms:** Windows. **License:** GPL-3.0-or-later application; logo under CC BY 3.0.. **Pricing model:** free.
- **Compatibility details:** Windows desktop application. The repository lists Windows 7 and newer for desktop binaries; Store/MSIX packages require Windows 10 version 1809 or newer.
- **Pick for:** Choose WinDirStat to investigate storage usage through file lists, extension statistics and visual maps.
- **Compare when:** Compare WizTree or TreeSize when their Windows scan and reporting workflows suit the job; measure scans on your own storage before making speed claims.
- **Strengths:** Disk usage visualization, large-file discovery
- **Limitations:** A large file is not automatically safe to delete; use the visualization to locate candidates and inspect their purpose.; Cloud scans use metadata listings and do not perform duplicate detection; incomplete scans and unknown physical allocation need to be read as such.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/windirstat/windirstat) · [Official installation / downloads](https://github.com/windirstat/windirstat/releases/) · [Repository](https://github.com/windirstat/windirstat)
- **Sources:** [Official disk-analysis capabilities, packages, requirements and license](https://github.com/windirstat/windirstat) (2026-11-15; downloads, features, identity, license, platforms); [Maintainer Windows installer publicly available without payment](https://github.com/windirstat/windirstat/releases/latest/download/WinDirStat-x64.msi) (2026-11-15; downloads, pricing)
### WizTree

Disk-space analyzer with a visual treemap; Windows and separate WizTreeMac editions are available.

- **Platforms:** Windows, macOS. **License:** Proprietary; personal-use freeware and commercial licenses. **Pricing model:** mixed.
- **Compatibility details:** Windows WizTree and the separately distributed WizTreeMac differ; NTFS metadata scanning describes the Windows edition.
- **Pick for:** Useful for inspecting which files occupy space on Windows NTFS volumes.
- **Compare when:** Business use requires the appropriate license
- **Strengths:** Useful for inspecting which files occupy space on Windows NTFS volumes.
- **Limitations:** Business use requires the appropriate license; Scanning speed and privileges depend on filesystem and disk access.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://diskanalyzer.com/) · [Official installation / downloads](https://diskanalyzer.com/download)
- **Sources:** [Official project documentation](https://diskanalyzer.com/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://diskanalyzer.com/download) (2026-11-14; downloads)

## Terminal file managers

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fterminal-file-managers)

### lf

Terminal file manager written in Go with configurable commands and a client/server design.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** A compact terminal option for users who prefer configuring external tools.
- **Compare when:** Previews and archives depend on configured external commands
- **Strengths:** A compact terminal option for users who prefer configuring external tools.
- **Limitations:** Previews and archives depend on configured external commands; Not a graphical desktop file manager.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-31. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/gokcehan/lf/releases.atom))
- [Official project](https://github.com/gokcehan/lf) · [Official installation / downloads](https://github.com/gokcehan/lf/releases) · [Repository](https://github.com/gokcehan/lf)
- **Sources:** [Official project documentation](https://github.com/gokcehan/lf) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/gokcehan/lf/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/gokcehan/lf/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/gokcehan/lf/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/gokcehan/lf/releases/expanded_assets/r42) (2026-11-14; pricing)
### nnn

Compact terminal file manager with plugins and shell integration.

- **Platforms:** Linux, macOS. **License:** BSD-2-Clause. **Pricing model:** free.
- **Pick for:** Fits minimalist terminal workflows with optional task-specific plugins.
- **Compare when:** Many advanced actions are delegated to external programs
- **Strengths:** Fits minimalist terminal workflows with optional task-specific plugins.
- **Limitations:** Many advanced actions are delegated to external programs; Windows generally requires a Unix-like environment.
- **Maintenance:** active — Official release feed contains activity dated 2026-08-17. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/jarun/nnn/releases.atom))
- [Official project](https://github.com/jarun/nnn) · [Official installation / downloads](https://github.com/jarun/nnn/releases) · [Repository](https://github.com/jarun/nnn)
- **Sources:** [Official project documentation](https://github.com/jarun/nnn) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/jarun/nnn/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/jarun/nnn/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/jarun/nnn/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/jarun/nnn/releases/expanded_assets/v5.3) (2026-11-14; pricing)
### ranger

Console file manager with a three-column view and configurable previews.

- **Platforms:** Linux, macOS. **License:** GPL-3.0. **Pricing model:** unknown.
- **Pick for:** Familiar keyboard-driven navigation for users already comfortable with Vim-style keys.
- **Compare when:** Preview helpers add dependencies
- **Strengths:** Familiar keyboard-driven navigation for users already comfortable with Vim-style keys.
- **Limitations:** Preview helpers add dependencies; Native Windows support is not the primary target.
- **Maintenance:** unverified — Official release feed contains activity dated 2024-11-04. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ranger/ranger/releases.atom))
- [Official project](https://ranger.github.io/) · [Official installation / downloads](https://ranger.github.io/download.html) · [Repository](https://github.com/ranger/ranger)
- **Sources:** [Official project documentation](https://ranger.github.io/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/ranger/ranger) (2026-11-14; identity, features); [Official download or installation landing page](https://ranger.github.io/download.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ranger/ranger/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/ranger/ranger/releases.atom) (2026-11-14; maintenance); [Official project or distribution platform documentation](https://github.com/ranger/ranger/wiki/Official-user-guide) (2026-11-14; platforms)
### Yazi

Terminal file manager written in Rust with asynchronous operations and configurable previews.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for keyboard-driven file navigation inside an existing terminal workflow.
- **Compare when:** Preview support depends on terminal and helper programs
- **Strengths:** Useful for keyboard-driven file navigation inside an existing terminal workflow.
- **Limitations:** Preview support depends on terminal and helper programs; Configuration and key bindings take time to learn.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/sxyazi/yazi/releases.atom))
- [Official project](https://yazi-rs.github.io/) · [Official installation / downloads](https://yazi-rs.github.io/docs/installation/) · [Repository](https://github.com/sxyazi/yazi)
- **Sources:** [Official project documentation](https://yazi-rs.github.io/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/sxyazi/yazi) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://yazi-rs.github.io/docs/installation/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/sxyazi/yazi/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/sxyazi/yazi/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/sxyazi/yazi/releases/expanded_assets/nightly) (2026-11-14; pricing)

## Versioned file backup

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=files%2Fversioned-backup)

### Arq Backup

Desktop backup application that encrypts data before storing it in supported local or cloud destinations.

- **Platforms:** Windows, macOS. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** Commercial desktop workflow for encrypted backups to a storage provider of your choice.
- **Compare when:** Software licensing and destination storage can be separate costs
- **Strengths:** Commercial desktop workflow for encrypted backups to a storage provider of your choice.
- **Limitations:** Software licensing and destination storage can be separate costs; Provider credentials and encryption-password recovery require planning.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.arqbackup.com/) · [Official installation / downloads](https://www.arqbackup.com/download/)
- **Sources:** [Official project documentation](https://www.arqbackup.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.arqbackup.com/download/) (2026-11-14; downloads); [Official application license agreement](https://www.arqbackup.com/documentation/arq6docs/English.lproj/license.html) (2026-11-14; license)
### Back In Time

Linux snapshot backup application based on rsync and hard links.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** unknown.
- **Pick for:** Versioned file snapshots remain directly browsable on the destination.
- **Compare when:** Hard-link snapshot storage needs a suitable filesystem
- **Strengths:** Versioned file snapshots remain directly browsable on the destination.
- **Limitations:** Hard-link snapshot storage needs a suitable filesystem; Does not create a bare-metal disk image.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-14. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/bit-team/backintime/releases.atom))
- [Official project](https://backintime.readthedocs.io/) · [Official installation / downloads](https://github.com/bit-team/backintime#installation) · [Repository](https://github.com/bit-team/backintime)
- **Sources:** [Official project documentation](https://backintime.readthedocs.io/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/bit-team/backintime) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/bit-team/backintime#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/bit-team/backintime/HEAD/LICENSES/GPL-2.0-or-later.txt) (2026-11-14; license); [Official release activity](https://github.com/bit-team/backintime/releases.atom) (2026-11-14; maintenance)
### BorgBackup

Deduplicating command-line backup with compression and authenticated encryption.

- **Platforms:** Linux, macOS. **License:** BSD-3-Clause. **Pricing model:** free.
- **Pick for:** Strong fit for encrypted versioned backups to a local disk or SSH repository.
- **Compare when:** Borg 2 is testing
- **Strengths:** Strong fit for encrypted versioned backups to a local disk or SSH repository.
- **Limitations:** Borg 2 is testing;  use the supported stable series for production backups; Windows support varies by series and experimental compatibility layer.
- **Maintenance:** active — The official release page lists Borg 1.4.5 on 2026-07-19; Borg 2 remains testing and should not be treated as a production release. Installed behavior was not tested. ([evidence](https://www.borgbackup.org/releases/))
- [Official project](https://www.borgbackup.org/) · [Official installation / downloads](https://www.borgbackup.org/releases/) · [Repository](https://github.com/borgbackup/borg)
- **Sources:** [Official project documentation](https://www.borgbackup.org/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/borgbackup/borg) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.borgbackup.org/releases/) (2026-11-14; downloads, maintenance); [Official source license](https://raw.githubusercontent.com/borgbackup/borg/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/borgbackup/borg/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/borgbackup/borg/releases/expanded_assets/2.0.0b25) (2026-11-14; pricing)
### Duplicacy

Deduplicating backup tool with multiple storage backends and CLI or web interfaces.

- **Platforms:** Windows, macOS, Linux. **License:** Duplicacy CLI custom source-available license; paid Web Edition. **Pricing model:** mixed.
- **Pick for:** Fits users comparing deduplicated backups across several machines and cloud targets.
- **Compare when:** CLI commercial-use terms and Web Edition pricing differ
- **Strengths:** Fits users comparing deduplicated backups across several machines and cloud targets.
- **Limitations:** CLI commercial-use terms and Web Edition pricing differ; Source availability does not imply an OSI-approved license.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-27. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/gilbertchen/duplicacy/releases.atom))
- [Official project](https://duplicacy.com/) · [Official installation / downloads](https://duplicacy.com/download.html) · [Repository](https://github.com/gilbertchen/duplicacy)
- **Sources:** [Official project documentation](https://duplicacy.com/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/gilbertchen/duplicacy) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://duplicacy.com/download.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/gilbertchen/duplicacy/HEAD/LICENSE.md) (2026-11-14; license); [Official release activity](https://github.com/gilbertchen/duplicacy/releases.atom) (2026-11-14; maintenance)
### Duplicati

Encrypted incremental cloud backup

- **Platforms:** Windows, macOS, Linux. **License:** MIT core; proprietary/ directory separately licensed. **Pricing model:** freemium.
- **Compatibility details:** Desktop backup software supports Windows, macOS and Linux. The optional management console offers free and paid tiers; its proprietary components are distinct from the MIT core.
- **Pick for:** Choose Duplicati for scheduled, encrypted file backups to cloud or remote storage through a browser interface.
- **Compare when:** Compare Kopia for a desktop snapshot workflow or restic for scripts; distinguish the backup client from optional management-console plans.
- **Strengths:** Encrypted incremental cloud backup
- **Limitations:** Cloud storage limits and provider charges remain separate from the backup client.; Backup encryption credentials and a tested restore procedure are essential; optional management features have separate free and paid plans.; Portable mode documents server-data placement, not proof that every cache, temporary file, credential or OS artifact stays in one folder; relocation and restore still need testing.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/duplicati/duplicati) · [Official installation / downloads](https://duplicati.com/download) · [Repository](https://github.com/duplicati/duplicati)
- **Sources:** [Official capabilities and practical usage basis](https://github.com/duplicati/duplicati) (2026-11-15; features, identity, license, platforms); [Official Duplicati downloads](https://duplicati.com/download) (2026-11-14; downloads); [Official management-console pricing](https://duplicati.com/pricing) (2026-11-14; pricing); [Official server data-location and portable-mode documentation](https://github.com/duplicati/documentation/blob/main/duplicati-programs/server.md) (2026-11-17; features)
### Duplicity

Encrypted incremental backup utility supporting local and remote storage backends.

- **Platforms:** Linux, macOS. **License:** GNU GPL; exact version not verified in this review. **Pricing model:** unknown.
- **Pick for:** Scriptable encrypted backups where supported storage integrations matter.
- **Compare when:** Incremental-chain retention and restores need deliberate planning
- **Strengths:** Scriptable encrypted backups where supported storage integrations matter.
- **Limitations:** Incremental-chain retention and restores need deliberate planning; Graphical convenience depends on a separate frontend.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://duplicity.gitlab.io/) · [Official installation / downloads](https://duplicity.gitlab.io/)
- **Sources:** [Official project documentation](https://duplicity.gitlab.io/) (2026-11-14; identity, features, platforms, license, downloads)
### Déjà Dup

GNOME personal backup application with an automated restore-oriented workflow.

- **Platforms:** Linux. **License:** Free software; exact application license grant was not retrievable in this review. **Pricing model:** unknown.
- **Pick for:** A compact desktop choice for automated personal-file protection.
- **Compare when:** Backend and storage-provider support depend on the installed release
- **Strengths:** A compact desktop choice for automated personal-file protection.
- **Limitations:** Backend and storage-provider support depend on the installed release; Not a full-system disk clone.; The application source license could not be retrieved during this review; the GNOME page footer licenses page content and is not treated as the application grant.
- **Maintenance:** active — The GNOME app page reports version 50.2 released on 2026-09-05; its current documented backend is Restic. Installed behavior was not tested. ([evidence](https://apps.gnome.org/DejaDup/))
- [Official project](https://apps.gnome.org/DejaDup/) · [Official installation / downloads](https://apps.gnome.org/DejaDup/)
- **Sources:** [Official project documentation](https://apps.gnome.org/DejaDup/) (2026-11-14; identity, features, platforms, downloads, maintenance)
### Kopia

Encrypted deduplicated snapshots

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** GUI and CLI distributions are documented for Windows, macOS and Linux. FreeBSD is documented through ports; this does not imply that KopiaUI is supplied there. Storage providers may charge separately.
- **Pick for:** Choose Kopia for encrypted file snapshots with both a desktop interface and command-line automation.
- **Compare when:** Compare restic for a command-line workflow or a disk-imaging tool such as Clonezilla when full-machine images are required.
- **Strengths:** Encrypted deduplicated snapshots
- **Limitations:** Kopia backs up selected files and directories; it does not create a complete machine image.; You provision the storage destination and retain its credentials and repository password. Rclone-backed storage is marked experimental by the project.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/kopia/kopia) · [Official installation / downloads](https://kopia.io/docs/installation/) · [Repository](https://github.com/kopia/kopia)
- **Sources:** [Official capabilities and practical usage basis](https://github.com/kopia/kopia) (2026-11-15; features, identity, license); [Official Kopia desktop-platform overview](https://kopia.io/) (2026-11-14; platforms); [Official public Kopia installation and download instructions](https://kopia.io/docs/installation/) (2026-11-14; downloads, platforms); [Maintainer application package publicly available without payment](https://github.com/kopia/kopia/releases/download/v0.23.1/kopia-0.23.1-windows-x64.zip) (2026-11-15; downloads, pricing)
### Pika Backup

GNOME backup application using Borg to keep encrypted personal-file backups.

- **Platforms:** Linux. **License:** GPL-3.0-only. **Pricing model:** unknown.
- **Pick for:** Accessible GNOME workflow for protecting personal folders.
- **Compare when:** Personal-file backup rather than full-system imaging
- **Strengths:** Accessible GNOME workflow for protecting personal folders.
- **Limitations:** Personal-file backup rather than full-system imaging; Requires a supported Borg storage location.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://apps.gnome.org/PikaBackup/) · [Official installation / downloads](https://apps.gnome.org/PikaBackup/)
- **Sources:** [Official project documentation](https://apps.gnome.org/PikaBackup/) (2026-11-14; identity, features, platforms, downloads); [Official package license declaration](https://github.com/pika-backup/pika-backup/blob/main/Cargo.toml) (2026-11-14; license)
### restic

Encrypted deduplicating backup snapshots

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** BSD-2-Clause. **Pricing model:** free.
- **Compatibility details:** Command-line application; the official installation guide covers native binaries and packages for each listed platform.
- **Pick for:** Choose restic for scriptable encrypted, versioned file backups to a storage location you control.
- **Compare when:** Compare Kopia for a desktop interface and Duplicati for browser-managed scheduling; choose by restore workflow and backend fit.
- **Strengths:** Encrypted deduplicating backup snapshots
- **Limitations:** The primary interface is a command line; scheduling, retention and restoration need deliberate setup.; The repository password is required for recovery. Keep independent recovery information and test restores; remote storage charges are separate.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/restic/restic) · [Official installation / downloads](https://restic.readthedocs.io/en/stable/020_installation.html) · [Repository](https://github.com/restic/restic)
- **Sources:** [Official capabilities and practical usage basis](https://github.com/restic/restic) (2026-11-15; features, identity); [Official restic platform, pricing and license overview](https://restic.net/) (2026-11-14; license, platforms, pricing); [Official restic installation guide](https://restic.readthedocs.io/en/stable/020_installation.html) (2026-11-14; downloads, platforms); [Official retention and pruning behavior](https://restic.readthedocs.io/en/stable/060_forget.html) (2026-11-15; features)
### Vorta

Desktop interface for scheduling and restoring BorgBackup archives.

- **Platforms:** Linux, macOS. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Adds a desktop workflow to Borg backup profiles and retention.
- **Compare when:** Depends on Borg and its repository compatibility
- **Strengths:** Adds a desktop workflow to Borg backup profiles and retention.
- **Limitations:** Depends on Borg and its repository compatibility; Official desktop support is Linux and macOS.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-12. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/borgbase/vorta/releases.atom))
- [Official project](https://vorta.borgbase.com/) · [Official installation / downloads](https://vorta.borgbase.com/install/) · [Repository](https://github.com/borgbase/vorta)
- **Sources:** [Official project documentation](https://vorta.borgbase.com/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/borgbase/vorta) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://vorta.borgbase.com/install/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/borgbase/vorta/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/borgbase/vorta/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/borgbase/vorta/releases/expanded_assets/v0.12.1) (2026-11-14; pricing)
