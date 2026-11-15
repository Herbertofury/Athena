# Files, backup & recovery

Find, organize, transfer, protect and recover files.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=files) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

57 applications. Reviewed 2026-11-14; individual records identify inherited research.

## Archive creation and extraction

### 7-Zip

Archive creation and extraction

- **Platforms:** Windows, macOS, Linux. **License:** Mostly LGPL; BSD-3-Clause parts; unRAR restrictions. **Pricing model:** free.
- **Pick for:** Archive creation and extraction
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Archive creation and extraction
- **Limitations:** Audit unRAR scope before code reuse; test malformed archives and extraction path containment; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.7-zip.org/) · [Official installation / downloads](https://www.7-zip.org/download.html) · [Repository](https://github.com/ip7z/7zip)
- **Sources:** [Official no-charge use and component-license statement](https://www.7-zip.org/) (2026-11-14; features, identity, license, pricing); [Official 7-Zip platform downloads and repository link](https://www.7-zip.org/download.html) (2026-11-14; downloads, identity, platforms)
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

- **Platforms:** Windows. **License:** MIT for NanaZip code; inherited 7-Zip, third-party codec and artwork licenses apply. **Pricing model:** free.
- **Pick for:** Fits Windows users who want modern shell integration for archive tasks.
- **Compare when:** Includes components under several licenses
- **Strengths:** Fits Windows users who want modern shell integration for archive tasks.
- **Limitations:** Includes components under several licenses; Supported Windows version depends on the release.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-26. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/M2Team/NanaZip/releases.atom))
- [Official project](https://github.com/M2Team/NanaZip) · [Official installation / downloads](https://github.com/M2Team/NanaZip/releases) · [Repository](https://github.com/M2Team/NanaZip)
- **Sources:** [Official project documentation](https://github.com/M2Team/NanaZip) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/M2Team/NanaZip/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/M2Team/NanaZip/HEAD/License.md) (2026-11-14; license); [Official release activity](https://github.com/M2Team/NanaZip/releases.atom) (2026-11-14; maintenance)
### PeaZip

Multi-format archive UI around compression backends

- **Platforms:** Windows, macOS, Linux. **License:** Open-source multi-component tool; precise component licenses require review. **Pricing model:** free.
- **Pick for:** Multi-format archive UI around compression backends
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Multi-format archive UI around compression backends
- **Limitations:** Do not infer common license for included compression engines; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://peazip.github.io/) · [Official installation / downloads](https://peazip.github.io/) · [Repository](https://github.com/peazip/PeaZip)
- **Sources:** [Official PeaZip platform download portal](https://peazip.github.io/) (2026-11-14; downloads, features, identity, platforms); [Official free-of-charge personal and professional use statement](https://peazip.github.io/peazip-free-archiver.html) (2026-11-14; license, pricing); [Official PeaZip repository](https://github.com/peazip/PeaZip) (2026-11-14; identity)
### WinRAR

Windows archive utility for creating RAR archives and working with many archive formats.

- **Platforms:** Windows. **License:** Proprietary shareware. **Pricing model:** paid.
- **Pick for:** Useful when creating RAR archives or using their recovery features is required.
- **Compare when:** Trial is time-limited under the license
- **Strengths:** Useful when creating RAR archives or using their recovery features is required.
- **Limitations:** Trial is time-limited under the license; Windows GUI and command-line distributions have different platform coverage.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.rarlab.com/) · [Official installation / downloads](https://www.rarlab.com/download.htm)
- **Sources:** [Official project documentation](https://www.rarlab.com/) (2026-11-14; identity, features, pricing); [Official download or installation landing page](https://www.rarlab.com/download.htm) (2026-11-14; downloads)

## Data recovery

### DMDE

Disk editor and recovery tool with filesystem reconstruction and RAID capabilities.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary; free and paid editions. **Pricing model:** freemium.
- **Pick for:** A specialist recovery and inspection option when detailed filesystem control is needed.
- **Compare when:** Free-edition recovery limits apply
- **Strengths:** A specialist recovery and inspection option when detailed filesystem control is needed.
- **Limitations:** Free-edition recovery limits apply; Disk editing can alter recoverable evidence.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://dmde.com/) · [Official installation / downloads](https://dmde.com/download.html)
- **Sources:** [Official project documentation](https://dmde.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://dmde.com/download.html) (2026-11-14; downloads)
### GNU ddrescue

Data recovery copier that prioritizes readable areas and records progress in a mapfile.

- **Platforms:** Linux, macOS. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Appropriate for imaging readable portions of failing media before logical recovery.
- **Compare when:** Not a filesystem undelete tool
- **Strengths:** Appropriate for imaging readable portions of failing media before logical recovery.
- **Limitations:** Not a filesystem undelete tool; Incorrect source and destination selection can overwrite data.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.gnu.org/software/ddrescue/) · [Official installation / downloads](https://www.gnu.org/software/ddrescue/)
- **Sources:** [Official project documentation](https://www.gnu.org/software/ddrescue/) (2026-11-14; identity, features, license, downloads)
### PhotoRec

File-carving recovery utility that locates supported file signatures independently of filesystem metadata.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Useful when filesystem metadata is damaged but recoverable file content remains.
- **Compare when:** Recovered files may lose original names and folder structure
- **Strengths:** Useful when filesystem metadata is damaged but recoverable file content remains.
- **Limitations:** Recovered files may lose original names and folder structure; Save recovered output to a different drive.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.cgsecurity.org/wiki/PhotoRec) · [Official installation / downloads](https://www.cgsecurity.org/wiki/TestDisk_Download)
- **Sources:** [Official project documentation](https://www.cgsecurity.org/wiki/PhotoRec) (2026-11-14; identity, features, platforms, license); [Official download or installation landing page](https://www.cgsecurity.org/wiki/TestDisk_Download) (2026-11-14; downloads)
### R-Studio

Commercial recovery suite for supported filesystems, disk images and RAID reconstruction.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** Useful for advanced recovery workflows needing a commercial graphical tool.
- **Compare when:** Trial recovery restrictions and edition-specific features apply
- **Strengths:** Useful for advanced recovery workflows needing a commercial graphical tool.
- **Limitations:** Trial recovery restrictions and edition-specific features apply; Cannot guarantee recovery after overwrites or hardware failure.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.r-studio.com/) · [Official installation / downloads](https://www.r-studio.com/Data_Recovery_Download.shtml)
- **Sources:** [Official project documentation](https://www.r-studio.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.r-studio.com/Data_Recovery_Download.shtml) (2026-11-14; downloads)
### TestDisk

Partition recovery utility for diagnosing lost partitions and repairing supported filesystem structures.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Specialist option when a partition disappeared but the storage device remains readable.
- **Compare when:** Repair operations can change disk structures
- **Strengths:** Specialist option when a partition disappeared but the storage device remains readable.
- **Limitations:** Repair operations can change disk structures; Work from an image when failing hardware or valuable data is involved.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.cgsecurity.org/wiki/TestDisk) · [Official installation / downloads](https://www.cgsecurity.org/wiki/TestDisk_Download)
- **Sources:** [Official project documentation](https://www.cgsecurity.org/wiki/TestDisk) (2026-11-14; identity, features, platforms, license); [Official download or installation landing page](https://www.cgsecurity.org/wiki/TestDisk_Download) (2026-11-14; downloads)

## System imaging and recovery

### Clonezilla

Bootable disk imaging and cloning suite for partition and machine recovery.

- **Platforms:** Bootable. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** A specialist choice for offline disk images and repeatable machine deployment.
- **Compare when:** Typically requires booting separate recovery media
- **Strengths:** A specialist choice for offline disk images and repeatable machine deployment.
- **Limitations:** Typically requires booting separate recovery media; Restoring an image overwrites the selected destination.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-14. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/stevenshiau/clonezilla/releases.atom))
- [Official project](https://clonezilla.org/) · [Official installation / downloads](https://clonezilla.org/downloads.php) · [Repository](https://github.com/stevenshiau/clonezilla)
- **Sources:** [Official project documentation](https://clonezilla.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/stevenshiau/clonezilla) (2026-11-14; identity, features); [Official download or installation landing page](https://clonezilla.org/downloads.php) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/stevenshiau/clonezilla/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/stevenshiau/clonezilla/releases.atom) (2026-11-14; maintenance)
### Macrium Reflect

Windows disk imaging and recovery software for scheduled image backups and rescue media.

- **Platforms:** Windows. **License:** Proprietary commercial license. **Pricing model:** subscription.
- **Pick for:** Useful for Windows users seeking an integrated commercial imaging and restore workflow.
- **Compare when:** Commercial edition and licensing terms must be checked for the intended use
- **Strengths:** Useful for Windows users seeking an integrated commercial imaging and restore workflow.
- **Limitations:** Commercial edition and licensing terms must be checked for the intended use; Restore testing is still needed on the target hardware.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.macrium.com/products/home) · [Official installation / downloads](https://www.macrium.com/products/home)
- **Sources:** [Official project documentation](https://www.macrium.com/products/home) (2026-11-14; identity, features, platforms, pricing, downloads)
### Rescuezilla

Bootable graphical disk imaging and recovery environment compatible with Clonezilla images.

- **Platforms:** Bootable. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** A graphical route to offline disk imaging and restore operations.
- **Compare when:** Requires booting the live environment
- **Strengths:** A graphical route to offline disk imaging and restore operations.
- **Limitations:** Requires booting the live environment; Verify target disk and current release warnings before restoration.
- **Maintenance:** active — Official release feed contains activity dated 2026-05-16. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/rescuezilla/rescuezilla/releases.atom))
- [Official project](https://rescuezilla.com/) · [Official installation / downloads](https://rescuezilla.com/download) · [Repository](https://github.com/rescuezilla/rescuezilla)
- **Sources:** [Official project documentation](https://rescuezilla.com/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/rescuezilla/rescuezilla) (2026-11-14; identity, features); [Official download or installation landing page](https://rescuezilla.com/download) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/rescuezilla/rescuezilla/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/rescuezilla/rescuezilla/releases.atom) (2026-11-14; maintenance)
### Veeam Agent for Microsoft Windows

Windows endpoint backup software supporting system, volume and file recovery.

- **Platforms:** Windows. **License:** Proprietary; free and commercial editions. **Pricing model:** freemium.
- **Pick for:** A Windows-focused option for whole-machine backup with a free edition.
- **Compare when:** Feature limits differ between free and licensed editions
- **Strengths:** A Windows-focused option for whole-machine backup with a free edition.
- **Limitations:** Feature limits differ between free and licensed editions; Registration and supported Windows versions should be checked before deployment.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.veeam.com/products/free/microsoft-windows.html) · [Official installation / downloads](https://www.veeam.com/products/free/microsoft-windows.html)
- **Sources:** [Official project documentation](https://www.veeam.com/products/free/microsoft-windows.html) (2026-11-14; identity, features, platforms, pricing, downloads)

## Duplicate detection

### Czkawka / Krokiet

Duplicate and similar-image discovery

- **Platforms:** Windows. **License:** Mixed/component licenses; GitHub NOASSERTION is not approval. **Pricing model:** unknown.
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
- **Sources:** [Official project documentation](https://dupeguru.voltaicideas.net/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/arsenetar/dupeguru) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/arsenetar/dupeguru/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/arsenetar/dupeguru/releases.atom) (2026-11-14; maintenance)
### fclones

Command-line duplicate-file finder supporting grouped reports and controlled file actions.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Fits scripted duplicate audits where a reviewable report is needed before changes.
- **Compare when:** Command-line tool
- **Strengths:** Fits scripted duplicate audits where a reviewable report is needed before changes.
- **Limitations:** Command-line tool; Deletion or linking requires checking application and filesystem assumptions.
- **Maintenance:** unverified — Official release feed contains activity dated 2025-03-03. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/pkolaczk/fclones/releases.atom))
- [Official project](https://github.com/pkolaczk/fclones) · [Official installation / downloads](https://github.com/pkolaczk/fclones/releases) · [Repository](https://github.com/pkolaczk/fclones)
- **Sources:** [Official project documentation](https://github.com/pkolaczk/fclones) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/pkolaczk/fclones/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/pkolaczk/fclones/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/pkolaczk/fclones/releases.atom) (2026-11-14; maintenance)
### jdupes

Command-line duplicate scanner with optional deletion and link-based consolidation.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for repeatable duplicate scans with explicit command-line control.
- **Compare when:** Linking changes how later edits affect files
- **Strengths:** Useful for repeatable duplicate scans with explicit command-line control.
- **Limitations:** Linking changes how later edits affect files; Review destructive flags before applying actions.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://codeberg.org/jbruchon/jdupes) · [Official installation / downloads](https://codeberg.org/jbruchon/jdupes/releases) · [Repository](https://codeberg.org/jbruchon/jdupes)
- **Sources:** [Official project documentation](https://codeberg.org/jbruchon/jdupes) (2026-11-14; identity, features, platforms, license); [Official download or installation landing page](https://codeberg.org/jbruchon/jdupes/releases) (2026-11-14; downloads)

## Graphical file managers

### Directory Opus

Queued copies, dual panes, metadata and batch rename

- **Platforms:** Windows. **License:** Proprietary commercial; reuse not established. **Pricing model:** unknown.
- **Pick for:** Queued copies, dual panes, metadata and batch rename
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Queued copies, dual panes, metadata and batch rename
- **Limitations:** Do not copy vendor performance superlatives into ranking; benchmark large-tree navigation; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.gpsoft.com.au/)
- **Sources:** [Preserved original research source](https://www.gpsoft.com.au/) (2026-11-14; identity, features)
### Dolphin (KDE file manager)

KDE file manager with split views, tabs and integrated file-management services.

- **Platforms:** Linux, Windows. **License:** GPL-2.0-or-later. **Pricing model:** free.
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
- **Pick for:** Dual-pane file manager
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Dual-pane file manager
- **Limitations:** Test long paths, Unicode, junctions and copy conflict policies; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/doublecmd/doublecmd) · [Official installation / downloads](https://sourceforge.net/p/doublecmd/wiki/Download/) · [Repository](https://github.com/doublecmd/doublecmd)
- **Sources:** [Official Double Commander repository](https://github.com/doublecmd/doublecmd) (2026-11-14; features, identity); [Official free application overview](https://doublecmd.sourceforge.io/) (2026-11-14; pricing); [Maintainer platform requirements](https://github.com/doublecmd/doublecmd/wiki/Supported-platforms) (2026-11-14; platforms); [Maintainer download portal linked by the project homepage](https://sourceforge.net/p/doublecmd/wiki/Download/) (2026-11-14; downloads, platforms)
### Explorer++

Tabbed Windows file manager with a portable distribution.

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Compact option for users who want tabs and familiar Windows file operations.
- **Compare when:** Windows-only
- **Strengths:** Compact option for users who want tabs and familiar Windows file operations.
- **Limitations:** Windows-only; Feature depth differs from commercial dual-pane file managers.
- **Maintenance:** unverified — Official release feed contains activity dated 2024-01-28. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/derceg/explorerplusplus/releases.atom))
- [Official project](https://explorerplusplus.com/) · [Official installation / downloads](https://explorerplusplus.com/download) · [Repository](https://github.com/derceg/explorerplusplus)
- **Sources:** [Official project documentation](https://explorerplusplus.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/derceg/explorerplusplus) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://explorerplusplus.com/download) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/derceg/explorerplusplus/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/derceg/explorerplusplus/releases.atom) (2026-11-14; maintenance)
### Files

Tabs, file tags and multitasking navigation

- **Platforms:** Windows. **License:** MIT and MPL-2.0 files; audit per-file boundary. **Pricing model:** unknown.
- **Pick for:** Tabs, file tags and multitasking navigation
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Tabs, file tags and multitasking navigation
- **Limitations:** Test rename/copy cancellation and Explorer fallback before replacement; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/files-community/Files) · [Repository](https://github.com/files-community/Files)
- **Sources:** [Preserved original research source](https://github.com/files-community/Files) (2026-11-14; identity, features)
### GNOME Files

GNOME desktop file manager for local files and supported remote locations.

- **Platforms:** Linux. **License:** GPL-3.0-or-later. **Pricing model:** free.
- **Pick for:** A consistent default for GNOME users managing everyday documents and shares.
- **Compare when:** Advanced bulk operations may require extensions or external tools
- **Strengths:** A consistent default for GNOME users managing everyday documents and shares.
- **Limitations:** Advanced bulk operations may require extensions or external tools; Available remote backends depend on the system.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://apps.gnome.org/Nautilus/) · [Official installation / downloads](https://apps.gnome.org/Nautilus/)
- **Sources:** [Official project documentation](https://apps.gnome.org/Nautilus/) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/GNOME/nautilus/HEAD/LICENSE) (2026-11-14; license); [Official Nautilus documentation and license](https://gnome.pages.gitlab.gnome.org/nautilus/) (2026-11-14; identity, features, license)
### Multi Commander

Windows multi-tabbed dual-pane file manager with tools and extension support.

- **Platforms:** Windows. **License:** Proprietary freeware. **Pricing model:** free.
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
- **Sources:** [Official project documentation](https://github.com/linuxmint/nemo) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/linuxmint/nemo/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/linuxmint/nemo/releases.atom) (2026-11-14; maintenance)
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

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** Fits users seeking a focused graphical Linux file manager.
- **Compare when:** Advanced previews and services may need extensions
- **Strengths:** Fits users seeking a focused graphical Linux file manager.
- **Limitations:** Advanced previews and services may need extensions; Desktop integration is centered on Xfce.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://docs.xfce.org/xfce/thunar/start) · [Official installation / downloads](https://docs.xfce.org/xfce/thunar/start)
- **Sources:** [Official project documentation](https://docs.xfce.org/xfce/thunar/start) (2026-11-14; identity, features, downloads); [Official source license](https://raw.githubusercontent.com/xfce-mirror/thunar/HEAD/COPYING) (2026-11-14; license)
### Total Commander

Dual-pane file operations, archives and multi-rename

- **Platforms:** Windows. **License:** Proprietary/shareware; reuse not established. **Pricing model:** unknown.
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
- **Sources:** [Official project documentation](https://www.xyplorer.com/) (2026-11-14; identity, features, platforms, pricing, maintenance); [Official download or installation landing page](https://www.xyplorer.com/download.php) (2026-11-14; downloads)

## Quick file previews

### QuickLook

Spacebar file previews

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** unknown.
- **Pick for:** Spacebar file previews
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Spacebar file previews
- **Limitations:** Preview parsers and plugins handle untrusted files; test unsupported-format behavior; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/QL-Win/QuickLook) · [Repository](https://github.com/QL-Win/QuickLook)
- **Sources:** [Preserved original research source](https://github.com/QL-Win/QuickLook) (2026-11-14; identity, features)

## File and folder search

### broot

Interactive directory tree browser with fuzzy search and configurable file commands.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for discovering and jumping through large directory trees.
- **Compare when:** Shell integration varies by environment
- **Strengths:** Useful for discovering and jumping through large directory trees.
- **Limitations:** Shell integration varies by environment; Not a full graphical file-management replacement.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-01. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/Canop/broot/releases.atom))
- [Official project](https://dystroy.org/broot/) · [Official installation / downloads](https://dystroy.org/broot/install/) · [Repository](https://github.com/Canop/broot)
- **Sources:** [Official project documentation](https://dystroy.org/broot/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/Canop/broot) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://dystroy.org/broot/install/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/Canop/broot/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/Canop/broot/releases.atom) (2026-11-14; maintenance)
### Everything

Fast indexed filename search

- **Platforms:** Windows. **License:** Vendor binary license; closed-source, do not infer source rights. **Pricing model:** free.
- **Pick for:** Fast indexed filename search
- **Compare when:** Cold indexing and p50/p95 query latency versus Windows Search on same fixture tree
- **Strengths:** Fast indexed filename search
- **Limitations:** Indexes reveal filenames; service elevation and network sharing need explicit review; Behavioral inspiration only; study incremental indexing with independent implementation
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.voidtools.com/support/everything/) · [Official installation / downloads](https://www.voidtools.com/downloads/)
- **Sources:** [Preserved original research source](https://www.voidtools.com/support/everything/) (2026-11-14; identity, features); [Official freeware, Windows requirements and Lite-edition FAQ](https://www.voidtools.com/faq/) (2026-11-14; features, platforms, pricing); [Official stable and beta download portal](https://www.voidtools.com/downloads/) (2026-11-14; downloads)

## File synchronization

### FreeFileSync

Visual folder comparison and synchronization

- **Platforms:** Windows, macOS, Linux. **License:** Edition-specific; business/government installation requires Business Edition license per FAQ. **Pricing model:** freemium.
- **Pick for:** Visual folder comparison and synchronization
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Visual folder comparison and synchronization
- **Limitations:** Do not treat free download as blanket commercial-use or source-reuse authorization; No code reuse until edition/component license audit; proprietary tools are behavioral inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://freefilesync.org/faq.php) · [Official installation / downloads](https://freefilesync.org/download.php)
- **Sources:** [Official platforms and edition terms](https://freefilesync.org/faq.php) (2026-11-14; features, identity, license, platforms, pricing); [Preserved original research source](https://freefilesync.org/) (2026-11-14; identity, features); [Official FreeFileSync downloads](https://freefilesync.org/download.php) (2026-11-14; downloads, platforms)
### Syncthing

Peer-to-peer continuous synchronization

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MPL-2.0. **Pricing model:** unknown.
- **Pick for:** Peer-to-peer continuous synchronization
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Peer-to-peer continuous synchronization
- **Limitations:** Synchronization can propagate deletions; compare versioning and recovery separately from backup; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/syncthing/syncthing) · [Official installation / downloads](https://syncthing.net/downloads/) · [Repository](https://github.com/syncthing/syncthing)
- **Sources:** [Official Syncthing repository](https://github.com/syncthing/syncthing) (2026-11-14; features, identity); [Official Syncthing platform and open-source overview](https://syncthing.net/) (2026-11-14; license, platforms); [Official publicly distributed Syncthing builds](https://syncthing.net/downloads/) (2026-11-14; downloads, platforms)

## Client-server backup

### UrBackup

Client/server backup system combining file and supported image backup workflows.

- **Platforms:** Windows, Linux, macOS. **License:** AGPL-3.0-or-later server; client component licenses vary. **Pricing model:** free.
- **Pick for:** Useful when several PCs need centrally managed backup schedules.
- **Compare when:** Image-backup capabilities vary by client OS
- **Strengths:** Useful when several PCs need centrally managed backup schedules.
- **Limitations:** Image-backup capabilities vary by client OS; Server storage capacity and restore-media testing remain required.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-09. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/uroni/urbackup_backend/releases.atom))
- [Official project](https://www.urbackup.org/) · [Official installation / downloads](https://www.urbackup.org/download.html) · [Repository](https://github.com/uroni/urbackup_backend)
- **Sources:** [Official project documentation](https://www.urbackup.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/uroni/urbackup_backend) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.urbackup.org/download.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/uroni/urbackup_backend/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/uroni/urbackup_backend/releases.atom) (2026-11-14; maintenance)

## Disk space analysis

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
- **Sources:** [Official project documentation](https://dev.yorhel.nl/ncdu) (2026-11-14; identity, features, platforms, license, downloads)
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

- **Platforms:** Windows. **License:** GPL-3.0 repository classification. **Pricing model:** unknown.
- **Pick for:** Disk usage visualization, large-file discovery
- **Compare when:** Compare reported allocated/logical bytes on sparse, compressed and hardlinked fixtures
- **Strengths:** Disk usage visualization, large-file discovery
- **Limitations:** Deletion is separate from inspection; junctions and hardlinks complicate accounting; Copyleft candidate: inspect exact file licenses before distributing derivative code
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/windirstat/windirstat) · [Repository](https://github.com/windirstat/windirstat)
- **Sources:** [Preserved original research source](https://github.com/windirstat/windirstat) (2026-11-14; identity, features)
### WizTree

Disk-space analyzer with a visual treemap; Windows and separate WizTreeMac editions are available.

- **Platforms:** Windows, macOS. **License:** Proprietary; personal-use freeware and commercial licenses. **Pricing model:** mixed.
- **Pick for:** Useful for inspecting which files occupy space on Windows NTFS volumes.
- **Compare when:** Business use requires the appropriate license
- **Strengths:** Useful for inspecting which files occupy space on Windows NTFS volumes.
- **Limitations:** Business use requires the appropriate license; Scanning speed and privileges depend on filesystem and disk access.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://diskanalyzer.com/) · [Official installation / downloads](https://diskanalyzer.com/download)
- **Sources:** [Official project documentation](https://diskanalyzer.com/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://diskanalyzer.com/download) (2026-11-14; downloads)

## Terminal file managers

### lf

Terminal file manager written in Go with configurable commands and a client/server design.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** A compact terminal option for users who prefer configuring external tools.
- **Compare when:** Previews and archives depend on configured external commands
- **Strengths:** A compact terminal option for users who prefer configuring external tools.
- **Limitations:** Previews and archives depend on configured external commands; Not a graphical desktop file manager.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-31. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/gokcehan/lf/releases.atom))
- [Official project](https://github.com/gokcehan/lf) · [Official installation / downloads](https://github.com/gokcehan/lf/releases) · [Repository](https://github.com/gokcehan/lf)
- **Sources:** [Official project documentation](https://github.com/gokcehan/lf) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/gokcehan/lf/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/gokcehan/lf/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/gokcehan/lf/releases.atom) (2026-11-14; maintenance)
### nnn

Compact terminal file manager with plugins and shell integration.

- **Platforms:** Linux, macOS. **License:** BSD-2-Clause. **Pricing model:** free.
- **Pick for:** Fits minimalist terminal workflows with optional task-specific plugins.
- **Compare when:** Many advanced actions are delegated to external programs
- **Strengths:** Fits minimalist terminal workflows with optional task-specific plugins.
- **Limitations:** Many advanced actions are delegated to external programs; Windows generally requires a Unix-like environment.
- **Maintenance:** active — Official release feed contains activity dated 2026-08-17. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/jarun/nnn/releases.atom))
- [Official project](https://github.com/jarun/nnn) · [Official installation / downloads](https://github.com/jarun/nnn/releases) · [Repository](https://github.com/jarun/nnn)
- **Sources:** [Official project documentation](https://github.com/jarun/nnn) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/jarun/nnn/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/jarun/nnn/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/jarun/nnn/releases.atom) (2026-11-14; maintenance)
### ranger

Console file manager with a three-column view and configurable previews.

- **Platforms:** Linux, macOS. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Familiar keyboard-driven navigation for users already comfortable with Vim-style keys.
- **Compare when:** Preview helpers add dependencies
- **Strengths:** Familiar keyboard-driven navigation for users already comfortable with Vim-style keys.
- **Limitations:** Preview helpers add dependencies; Native Windows support is not the primary target.
- **Maintenance:** unverified — Official release feed contains activity dated 2024-11-04. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/ranger/ranger/releases.atom))
- [Official project](https://ranger.github.io/) · [Official installation / downloads](https://ranger.github.io/download.html) · [Repository](https://github.com/ranger/ranger)
- **Sources:** [Official project documentation](https://ranger.github.io/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/ranger/ranger) (2026-11-14; identity, features); [Official download or installation landing page](https://ranger.github.io/download.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/ranger/ranger/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/ranger/ranger/releases.atom) (2026-11-14; maintenance)
### Yazi

Terminal file manager written in Rust with asynchronous operations and configurable previews.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for keyboard-driven file navigation inside an existing terminal workflow.
- **Compare when:** Preview support depends on terminal and helper programs
- **Strengths:** Useful for keyboard-driven file navigation inside an existing terminal workflow.
- **Limitations:** Preview support depends on terminal and helper programs; Configuration and key bindings take time to learn.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/sxyazi/yazi/releases.atom))
- [Official project](https://yazi-rs.github.io/) · [Official installation / downloads](https://yazi-rs.github.io/docs/installation/) · [Repository](https://github.com/sxyazi/yazi)
- **Sources:** [Official project documentation](https://yazi-rs.github.io/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/sxyazi/yazi) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://yazi-rs.github.io/docs/installation/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/sxyazi/yazi/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/sxyazi/yazi/releases.atom) (2026-11-14; maintenance)

## Versioned file backup

### Arq Backup

Desktop backup application that encrypts data before storing it in supported local or cloud destinations.

- **Platforms:** Windows, macOS. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** Commercial desktop workflow for encrypted backups to a storage provider of your choice.
- **Compare when:** Software licensing and destination storage can be separate costs
- **Strengths:** Commercial desktop workflow for encrypted backups to a storage provider of your choice.
- **Limitations:** Software licensing and destination storage can be separate costs; Provider credentials and encryption-password recovery require planning.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.arqbackup.com/) · [Official installation / downloads](https://www.arqbackup.com/download/)
- **Sources:** [Official project documentation](https://www.arqbackup.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.arqbackup.com/download/) (2026-11-14; downloads)
### Back In Time

Linux snapshot backup application based on rsync and hard links.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
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
- **Sources:** [Official project documentation](https://www.borgbackup.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/borgbackup/borg) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.borgbackup.org/releases/) (2026-11-14; downloads, maintenance); [Official source license](https://raw.githubusercontent.com/borgbackup/borg/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/borgbackup/borg/releases.atom) (2026-11-14; maintenance)
### Duplicacy

Deduplicating backup tool with multiple storage backends and CLI or web interfaces.

- **Platforms:** Windows, macOS, Linux. **License:** Duplicacy CLI custom source-available license; paid Web Edition. **Pricing model:** mixed.
- **Pick for:** Fits users comparing deduplicated backups across several machines and cloud targets.
- **Compare when:** CLI commercial-use terms and Web Edition pricing differ
- **Strengths:** Fits users comparing deduplicated backups across several machines and cloud targets.
- **Limitations:** CLI commercial-use terms and Web Edition pricing differ; Source availability does not imply an OSI-approved license.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-27. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/gilbertchen/duplicacy/releases.atom))
- [Official project](https://duplicacy.com/) · [Official installation / downloads](https://duplicacy.com/download.html) · [Repository](https://github.com/gilbertchen/duplicacy)
- **Sources:** [Official project documentation](https://duplicacy.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/gilbertchen/duplicacy) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://duplicacy.com/download.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/gilbertchen/duplicacy/HEAD/LICENSE.md) (2026-11-14; license); [Official release activity](https://github.com/gilbertchen/duplicacy/releases.atom) (2026-11-14; maintenance)
### Duplicati

Encrypted incremental cloud backup

- **Platforms:** Windows, macOS, Linux. **License:** MIT core; proprietary/ directory separately licensed. **Pricing model:** freemium.
- **Pick for:** Encrypted incremental cloud backup
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Encrypted incremental cloud backup
- **Limitations:** Do not label entire distribution MIT; validate restore and database recovery; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/duplicati/duplicati) · [Official installation / downloads](https://duplicati.com/download) · [Repository](https://github.com/duplicati/duplicati)
- **Sources:** [Official platform and component-license declarations](https://github.com/duplicati/duplicati) (2026-11-14; features, identity, license, platforms); [Official Duplicati downloads](https://duplicati.com/download) (2026-11-14; downloads); [Official management-console pricing](https://duplicati.com/pricing) (2026-11-14; pricing)
### Duplicity

Encrypted incremental backup utility supporting local and remote storage backends.

- **Platforms:** Linux, macOS. **License:** GNU GPL; exact version not verified in this review. **Pricing model:** free.
- **Pick for:** Scriptable encrypted backups where supported storage integrations matter.
- **Compare when:** Incremental-chain retention and restores need deliberate planning
- **Strengths:** Scriptable encrypted backups where supported storage integrations matter.
- **Limitations:** Incremental-chain retention and restores need deliberate planning; Graphical convenience depends on a separate frontend.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://duplicity.gitlab.io/) · [Official installation / downloads](https://duplicity.gitlab.io/)
- **Sources:** [Official project documentation](https://duplicity.gitlab.io/) (2026-11-14; identity, features, platforms, license, downloads)
### Déjà Dup

GNOME personal backup application with an automated restore-oriented workflow.

- **Platforms:** Linux. **License:** Free software; exact application license grant was not retrievable in this review. **Pricing model:** free.
- **Pick for:** A compact desktop choice for automated personal-file protection.
- **Compare when:** Backend and storage-provider support depend on the installed release
- **Strengths:** A compact desktop choice for automated personal-file protection.
- **Limitations:** Backend and storage-provider support depend on the installed release; Not a full-system disk clone.; The application source license could not be retrieved during this review; the GNOME page footer licenses page content and is not treated as the application grant.
- **Maintenance:** active — The GNOME app page reports version 50.2 released on 2026-09-05; its current documented backend is Restic. Installed behavior was not tested. ([evidence](https://apps.gnome.org/DejaDup/))
- [Official project](https://apps.gnome.org/DejaDup/) · [Official installation / downloads](https://apps.gnome.org/DejaDup/)
- **Sources:** [Official project documentation](https://apps.gnome.org/DejaDup/) (2026-11-14; identity, features, platforms, downloads, maintenance)
### Kopia

Encrypted deduplicated snapshots

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** Apache-2.0. **Pricing model:** unknown.
- **Pick for:** Encrypted deduplicated snapshots
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Encrypted deduplicated snapshots
- **Limitations:** Test recovery of deleted files and a lost local index; key loss can make backups unrecoverable; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/kopia/kopia) · [Official installation / downloads](https://kopia.io/docs/installation/) · [Repository](https://github.com/kopia/kopia)
- **Sources:** [Official Kopia repository and Apache license declaration](https://github.com/kopia/kopia) (2026-11-14; features, identity, license); [Official Kopia desktop-platform overview](https://kopia.io/) (2026-11-14; platforms); [Official public Kopia installation and download instructions](https://kopia.io/docs/installation/) (2026-11-14; downloads, platforms)
### Pika Backup

GNOME backup application using Borg to keep encrypted personal-file backups.

- **Platforms:** Linux. **License:** GPL-3.0-only. **Pricing model:** free.
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
- **Pick for:** Encrypted deduplicating backup snapshots
- **Compare when:** Synthetic full+incremental backups then independent restore with exact hashes
- **Strengths:** Encrypted deduplicating backup snapshots
- **Limitations:** Lost password prevents restore; prune removes history; backup is unproven until restored; Permissive code candidate with notices; reusable snapshot/restore verification patterns
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/restic/restic) · [Official installation / downloads](https://restic.readthedocs.io/en/stable/020_installation.html) · [Repository](https://github.com/restic/restic)
- **Sources:** [Official restic repository](https://github.com/restic/restic) (2026-11-14; features, identity); [Official restic platform, pricing and license overview](https://restic.net/) (2026-11-14; license, platforms, pricing); [Official restic installation guide](https://restic.readthedocs.io/en/stable/020_installation.html) (2026-11-14; downloads, platforms)
### Vorta

Desktop interface for scheduling and restoring BorgBackup archives.

- **Platforms:** Linux, macOS. **License:** GPL-3.0. **Pricing model:** free.
- **Pick for:** Adds a desktop workflow to Borg backup profiles and retention.
- **Compare when:** Depends on Borg and its repository compatibility
- **Strengths:** Adds a desktop workflow to Borg backup profiles and retention.
- **Limitations:** Depends on Borg and its repository compatibility; Official desktop support is Linux and macOS.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-12. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/borgbase/vorta/releases.atom))
- [Official project](https://vorta.borgbase.com/) · [Official installation / downloads](https://vorta.borgbase.com/install/) · [Repository](https://github.com/borgbase/vorta)
- **Sources:** [Official project documentation](https://vorta.borgbase.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/borgbase/vorta) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://vorta.borgbase.com/install/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/borgbase/vorta/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/borgbase/vorta/releases.atom) (2026-11-14; maintenance)
