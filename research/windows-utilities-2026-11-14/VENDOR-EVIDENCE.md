# Windows utilities: official-source research, checked 2026-11-14

Read-only research. No installs, binaries executed, security changes, provider requests, or benchmarks. Versions below are vendor-page observations, not installed/tested builds. Beta is not automatically preferred. No tool is declared universally best.

## Process control and diagnostics

### Process Lasso — proprietary / Free + paid Pro
- Official current download page reports stable **19.0.0.94, November 2 2026**, beta **19.1.0.37, November 13 2026**; Windows10/11/Server, x86-64, x86-32, ARM64 installers. Older main-domain search copy showed18.4; use current checked download page, recheck before installing.
- Notable: persistent priority/CPU affinity/CPU Sets, ProBalance responsiveness control, power-profile automation; Pro adds CPU Limiter, hard throttling, watchdog, instance balancing and related automation. Current feature matrix distinguishes current-only memory priority from persistent Pro rules.
- License: indefinitely usable Free with feature limits; current matrix says commercial use needs a license within30days. Proprietary, not reusable open-source code. Pro pricing/terms must be checked at purchase, not inferred from version.
- Evaluation: meaningful candidate for measured responsiveness under contention, not proof of higher throughput/FPS. Affinity, priority, throttling/power changes may hurt another workload; establish baseline, test per application, keep reversible rules.
- Future-build inspiration (independent design, not copied code): transparent per-process rule engine; explicit current vs persisted rules; traceable action log; reversible profile switching and conflict precedence. Benchmark p95 input latency, frame-time tails, throughput and power together.
- Sources: https://dl.bitsum.com/download-process-lasso/ ; https://dl.bitsum.com/process-lasso-free-vs-pro/ ; https://dl.bitsum.com/terms-of-use/ ; https://bitsum.com/process-lasso-faq/

### System Informer — MIT open source
- Official about links MIT license and source; current downloads list Windows10/11,32/64bit and a separately labeled Canary track. Do not rely on obsolete SourceForge README saying Windows7 for current support.
- Process/resource inspection and debugging/malware-investigation candidate, not antivirus or automatic safe-to-kill classifier.
- Future reuse: inspect actual upstream module/file license and driver requirements before importing. Good reference for process tree, resource graphs and detail panels; optional elevated inspection should remain independently removable. Terminating a process or loading privileged components is separate from read-only inspection.
- Sources: https://systeminformer.com/about ; https://systeminformer.com/downloads ; official source linked there https://github.com/winsiderss/systeminformer

### Process Explorer — Microsoft proprietary freeware, not open source
- Current official page **17.21, November5 2026** lists **Windows11+, Server2019+**. Important: do not promise currentWindows10 support from older documentation.
- Handles/DLL search and process-owner/module visibility useful for locked files, handle leaks and DLL-version investigation. Observation is not malware verdict; closing handles/killing processes can corrupt application work.
- Future inspiration: inspectable process-to-resource relationships and source-linked evidence, not copied proprietary implementation.
- Sources: https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer ; https://learn.microsoft.com/en-us/sysinternals/license-terms

## Uninstall / inventory

### Revo Uninstaller — proprietary Free / Pro
- Pro history reports **5.5.4 September23 2026**; Free history reports **2.7.2 October6 2026**. Online FAQ supports native64bit Windows7 through11; do not use oldPDF as current platform authority.
- Pro runs vendor uninstallers then scans leftovers; forced uninstall, batch/quiet operation, installation tracing, app and extension handling. Backups/restore points are conditional; not a guarantee every deletion is reversible. Free andPro are distinct feature sets; Pro30day trial then paid license.
- Safety: review leftover ownership and preserve app/userdata first. Never indiscriminately delete shared registry entries, system components or all-user apps. Restoration is not equivalent to full file backup.
- Future inspiration: staged inventory→vendor uninstaller→evidence-scored leftovers→explicit review, auditable trace logs and rollback receipts. Proprietary implementation cannot be copied/relicensed into Athena; integration through documented interfaces only, with separate license.
- Sources: https://www.revouninstaller.com/products/revo-uninstaller-pro/ ; https://www.revouninstaller.com/revo-uninstaller-pro-full-version-history/ ; https://www.revouninstaller.com/version-history/ ; https://www.revouninstaller.com/online-manual/frequently-asked-questions/ ; https://www.revouninstaller.com/online-manual/registration-and-activation/

### Bulk Crap Uninstaller — Apache-2.0 open source
- Official site identifies original-uninstaller-first bulk removal, portable/unregistered detection, leftover scanning, inventory export, filters, console automation and Steam/Store/Windows-feature integration.
- Website requirements contain legacyXP/Vista language; current GitHub README says since5.0 Windows7+. Thus **exact chosen release requirements must be checked**, not claim all present builds supportXP. Windows11 applicability is candidate status until actual run.
- Future reuse: Apache2.0 core code is plausible reusable material after file/dependency/license/NOTICE checks. Useful architecture: extensible application providers, operation planning, collision prevention, certificate checks, portable inventory. CLI automation must not erase review/backup boundaries; force removal can damage shared state.
- Sources: https://www.bcuninstaller.com/ ; https://github.com/BCUninstaller/Bulk-Crap-Uninstaller ; https://github.com/BCUninstaller/Bulk-Crap-Uninstaller/blob/master/README.md

## Security investigation / network controls

### Autoruns / Autorunsc — Microsoft proprietary freeware
- Official **14.3, June17 2026**. Enumerates startup/driver/service/task/shell-extension persistence; CLI supportsCSV/XML and offline Windows inspection. No current minimumOS was stated in inspected page: mark unverified rather than inherit another Sysinternals tool's requirements.
- Valuable read-only baseline/diff inventory. Disable/delete actions are security-sensitive changes and need deliberate approval; signed/unsigned is not good/bad proof. VirusTotal hash lookup and optional file upload are external disclosures, not automatic defaults.
- Future inspiration: provenance for each startup entry, before/after snapshots, read-only first, reversible disable distinct from delete. No source-code reuse claim.
- Sources: https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns ; https://learn.microsoft.com/en-us/sysinternals/license-terms

### Sigcheck — Microsoft proprietary freeware CLI
- Official **2.93, October15 2026**, Windows11+/Server2019+/Nano2019+. Hashes, signature/certificate chain and version inspection; CSV output.
- Critical privacy distinction: VirusTotal hash-query option differs from upload option; `s` modifier uploads previously unknown files. Do not turn either on for private files without explicit scope. Signed is not inherently safe; unsigned is not inherently malware. Keep certificate-revocation checking enabled unless separately justified, not to suppress failures.
- Future inspiration: local hash/signature evidence pipeline with explicit online/offline modes; quarantine judgments separate from raw evidence. No redistributable/open-source claim.
- Sources: https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck ; https://learn.microsoft.com/en-us/sysinternals/license-terms

### Wireshark / TShark — GPL-2.0-or-later; official GitLab upstream
- Official download observed stable **4.6.9**, old stable4.4.19 and development5.0.0rc2. Windowsx64 andARM64. The current guide says4.6 is last branch supportingWindows10v1809/Server2019; future major support must not be inferred from4.6.
- Official GitLab https://gitlab.com/wireshark/wireshark/ explicitly identifies itself as official source; GitHub is a read-only mirror.
- Protocol dissection, packet capture and offline analysis; TShark provides scriptable analysis. Npcap is a separate capture dependency with its own license/restrictions, not covered by WiresharkGPL. Offline capture-file analysis does not require enabling new live capture.
- Safety: capture only authorized interfaces/traffic; packet files can expose credentials, identifiers and content. Bound capture duration/storage, minimize retained data, keep sensitive pcaps private. Parser advisories make updating and isolating untrusted captures important; not an endpoint-protection replacement.
- Future reuse: GPL obligations and component/dependency licenses reviewed before incorporating code; a separate CLI process does not automatically settle license obligations. Inspiration: structured dissector/plugin boundaries and evidence-preserving filters, not blanket packet collection.
- Sources: https://www.wireshark.org/download.html ; https://gitlab.com/wireshark/wireshark/ ; https://www.wireshark.org/docs/wsug_html_chunked/ChIntroPlatforms.html ; https://www.wireshark.org/docs/wsdg_html_chunked/ChSrcBinary ; https://www.wireshark.org/docs/wsdg_html_chunked/ChLibsPcap

### simplewall — GPL-3.0; advanced Windows Filtering Platform controller
- Upstream README listsWindows7/8/8.1/10/11,64bit/ARM64 and admin rights; not a Windows Firewall UI. Rules, packet logging, WSL/Store support, temporary vs persistent filtering. Version not pinned in this pass.
- Important documented limitation: uninstalling the app leaves configured filters active until explicitly disabled/removed. This makes rollback testing essential; do not install/enable merely for evaluation. Security/network changes remain separately approved.
- Future reuse: GPL3 file/dependency review; WFP rule lifecycle and temporary-rule model useful inspiration, but no bypass of Windows protections. Keep ordinary observation separate from applying filters. Prevent lockout with a verified recovery plan.
- Source: https://github.com/henrypp/simplewall

## Cross-cutting catalog fields
Each entry should record: checked_at; exact source URL; observed version/channel; license category; code reuse conditions; supportedOS evidence; architecture; features; documented limitations; inferred risks (labeled); integration surface; required privilege; external disclosure; reversibility; measured acceptance (currently NOT RUN). Do not equate source availability with permissible reuse, popularity with safety, or beta with superiority. No installers or security changes were performed.
