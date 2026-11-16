# Software coverage and refresh priorities

[Catalog](Software-Catalog) · [Decision guides](Software-Decision-Guides) · [Method](Software-Methodology)

Reviewed 2026-11-16. The integrated catalog contains **1069 applications in 373 categories**. It is a substantial expansion, not a claim of complete software coverage. 102 categories currently contain one application and need stronger comparison sets.

## Evidence that remains open

| Field | Unresolved records |
| --- | ---: |
| Pricing model | 251 |
| License classification | 29 |
| Dated maintenance evidence | 417 |

The counts overlap. Unknown pricing can mean that free source code was verified but the distribution terms were not established. Unverified maintenance is not the same as an abandoned project. All nonlegacy records with known licensing, pricing, platform or download claims must include corresponding source annotations; the build rejects missing mappings. An annotation identifies the source's intended role and is not a substitute for reading it.

There are also 73 mentions of alternatives outside this catalog. The refresh queue records their names and referring records as research leads; they are not counted as verified applications or promoted to ranked choices.

The [machine-readable refresh queue](https://github.com/Herbertofury/Athena/blob/main/research/software-expansion-2026-11-15/refresh-queue.json) contains 570 records needing more research and 0 source URLs due for review. Every cited source has its own age: checking a homepage again does not refresh an older license or platform document. Run `python3 scripts/report_software_coverage.py --output software-refresh-report.json` to recompute the queue using today's date. Pull requests and the weekly source audit retain this report alongside HTTP outcomes and real-browser evidence. A 90-day review interval is a scheduling policy, not a factual expiration date.

## Next coverage areas

### Complete evidence and lifecycle reviews

Resolve uncertain current licensing and distribution pricing; Check dated maintenance and successor projects; Verify current installer routes and supported host versions.

The current catalog already includes communication, radio, bioinformatics, BIM/CAM, industrial control and business workflows. Use the generated refresh queue to select unresolved fields across these records. Recheck the exact license, release or platform document; a reachable homepage does not establish current maintenance, a free distribution, or compatibility.

### Strengthen existing single-application categories

Compare additional candidates for cleanup, startup inventory and client-server backup; Deepen screen magnification, accessible reading, document question answering and data cleaning; Add peers for specialized scientific measurement and control tasks.

The integrated review has 102 single-application categories; 34 of the original 112 singleton categories gained alternatives. Use expansion-progress.json and the refresh queue for current totals and identities. Preserve the cleanup library, including unranked and excluded research; do not promote a candidate merely to increase a category count.

### Installed workflow, accessibility and resource measurements

Reproduce complete task workflows on supported operating systems; Measure startup, memory, storage and task completion with declared inputs; Exercise keyboard access, screen readers and recovery from failed operations.

Most recommendations are documentation-based. Establish public or licensed fixtures, pinned versions, equivalent outputs and reproducible environments before asserting lightweight, faster or more reliable choices. The existing grep/ripgrep experiment is scoped to its tested versions, workload and environment; it does not rank unrelated applications.

### Communication account and interoperability boundaries

Compare messaging and conference workflows across desktop clients; Verify account, server and identity requirements; Test export, retention and free-plan limits.

Desktop chat, protocol clients, team communication and conferencing now have comparison sets. Next verify complete account-to-account workflows, supported interoperability and data portability. Client availability does not establish end-to-end encryption, retention guarantees or every hosted plan feature.

### Radio hardware and signal workflow validation

Match SDR receivers to supported hardware and drivers; Reproduce digital decoding and logging handoffs; Verify device programming, packet radio and satellite data formats.

SDR, amateur radio, RF analysis and satellite workflows now have sourced entries and guides. Compare hardware generations, firmware, driver requirements and operating-system packages; distinguish reception, offline signal analysis and any licensed transmission requirements. Follow documented end-of-life and successor-project notices.

### Reproducible bioinformatics and laboratory work

Compare sequence analysis and phylogenetic workflows with known inputs; Check genomic visualization format limits and reproducible installation; Research laboratory information management and electronic lab notebooks.

Sequence, alignment, phylogeny and genome visualization coverage is established in this expansion. Next use reference datasets and exact program versions to verify workflow compatibility. Dedicated laboratory record systems remain a research lead, with deployment, data portability and access-control evidence needed before inclusion.

### BIM, building simulation and manufacturing interchange

Compare IFC import/export and model review round trips; Validate building-energy and lighting model exchange; Test CAM postprocessors, nesting and CNC handoffs on safe fixtures.

BIM, building analysis, CAM, nesting and machine-control records now exist. Verify complete workflows and their edition, platform, machine and postprocessor constraints. A supported file extension does not prove a lossless round trip; a simulator does not establish a safe real-machine program.

### Audio quality, restoration and delivery comparisons

Compare recorded dialogue restoration on licensed samples; Measure live microphone filtering with supported routing; Verify loudness delivery, plug-in formats and standalone availability.

The catalog now distinguishes documented recorded-audio restoration from live input suppression and supplies conditional setup notes. Add controlled sample, latency and quality comparisons, retaining raw measurements and artifacts. Confirm edition-specific modules and the microphone, host, model and plug-in configuration used.

### Industrial simulation and controller compatibility

Compare robot simulation and offline programming workflows; Verify PLC languages, supported controllers and deployment terms; Research FPGA design and HDL simulation or verification.

Robot, PLC and factory-simulation comparison sets now exist. Verify model fidelity, controller coverage and simulation-to-deployment boundaries with documented fixtures and vendor requirements. FPGA/HDL workflows remain an underrepresented research direction; research their toolchain licensing and hardware dependencies separately.

### Business deployment, planning and data portability

Compare inventory, accounting, ERP, CRM and invoicing handoffs; Verify scheduling, resource planning and project interchange; Exercise self-hosted backup, restore, upgrade and export paths.

Project planning and operational business software now have sourced records and guides. Next compare deployment effort, edition boundaries, team licensing, import/export completeness and recoverability. Local application pricing, hosted subscription terms and the cost of a full operational deployment are separate claims.

### Scientific comparison depth and additional specialist work

Add peers for groundwater, river hydraulics and stormwater workflows; Research mathematical optimization and constraint solvers; Research screenwriting, storyboarding and production scheduling.

Scientific coverage now includes molecular dynamics, CFD/FEA, hydrology, astronomical capture and video measurement. Several model-specific categories still have one record. Compare like-for-like tasks and validated inputs rather than treating different scientific models as interchangeable. Optimization and production-planning leads require primary-source research before they become recommendations.

## Categories with one researched candidate

These are useful starting points but do not yet support a broad within-category comparison. Related tools can still appear in task guides and explicit alternative links.

| Category | Current application |
| --- | --- |
| Cache and temporary file cleanup | [BleachBit](https://www.bleachbit.org/) |
| Container management | [Portainer Community Edition](https://github.com/portainer/portainer) |
| Reproducible development machines | [Vagrant](https://developer.hashicorp.com/vagrant) |
| Infrastructure monitoring | [Netdata](https://github.com/netdata/netdata) |
| Log analysis | [lnav](https://github.com/tstack/lnav) |
| Startup and persistence inventory | [Autoruns](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns) |
| Storage I/O activity | [iotop-c](https://github.com/Tomas-M/iotop) |
| Storage diagnostics | [nvme-cli](https://github.com/linux-nvme/nvme-cli) |
| Quick file previews | [QuickLook](https://github.com/QL-Win/QuickLook) |
| Client-server backup | [UrBackup](https://www.urbackup.org/) |
| Security audit event tracing | [Linux Audit](https://github.com/linux-audit/audit-userspace) |
| Adware and unwanted software removal | [Malwarebytes AdwCleaner](https://www.malwarebytes.com/adwcleaner) |
| Detection rule engineering | [Sigma rules](https://github.com/SigmaHQ/sigma) |
| USB device access control | [USBGuard](https://usbguard.github.io/) |
| Disk encryption | [VeraCrypt](https://veracrypt.io/) |
| Encrypted folder management | [SiriKali](https://mhogomchungu.github.io/sirikali/) |
| Endpoint inventory queries | [osquery](https://github.com/osquery/osquery) |
| Endpoint investigation | [Velociraptor](https://github.com/Velocidex/velociraptor) |
| Endpoint event telemetry | [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) |
| File integrity monitoring | [AIDE](https://aide.github.io/) |
| File pattern matching | [YARA-X](https://github.com/VirusTotal/yara-x) |
| Executable signature verification | [Sigcheck](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck) |
| Managed endpoint monitoring | [Wazuh agent](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html) |
| Repair and disinfection orchestration | [Tron](https://github.com/bmrf/tron) |
| Static executable analysis | [Detect It Easy](https://github.com/horsicq/Detect-It-Easy) |
| Bandwidth usage accounting | [vnStat](https://humdi.net/vnstat/) |
| Bandwidth limits and prioritization | [NetLimiter](https://www.netlimiter.com/) |
| Cloud storage clients | [Rclone Browser](https://github.com/kapitainsky/RcloneBrowser) |
| Local network file sharing | [LocalSend](https://github.com/localsend/localsend) |
| Mesh VPN control planes | [Headscale](https://headscale.net/) |
| Command-line packet capture | [tcpdump](https://www.tcpdump.org/) |
| Remote management | [MeshCentral](https://github.com/Ylianst/MeshCentral) |
| Service availability monitoring | [Uptime Kuma](https://github.com/louislam/uptime-kuma) |
| Academic writing | [Zettlr](https://www.zettlr.com/) |
| Accessible reading | [Thorium Reader](https://www.edrlab.org/software/thorium-reader/) |
| Application launchers | [Flow Launcher](https://github.com/Flow-Launcher/Flow.Launcher) |
| Clipboard managers | [CopyQ](https://github.com/hluk/CopyQ) |
| Tabular data cleaning | [OpenRefine](https://openrefine.org/) |
| Desktop utility suites | [PowerToys](https://github.com/microsoft/PowerToys) |
| Dictionary lookup | [GoldenDict-ng](https://xiaoyifang.github.io/goldendict-ng/) |
| Document conversion | [Pandoc](https://pandoc.org/) |
| Focused prose writing | [FocusWriter](https://gottcode.org/focuswriter/) |
| Markdown editors | [ghostwriter](https://ghostwriter.kde.org/) |
| Mind mapping | [Freeplane](https://www.freeplane.org/) |
| PDF content editors | [Adobe Acrobat Pro](https://www.adobe.com/acrobat/acrobat-pro.html) |
| PDF processing | [Stirling PDF](https://stirling.com/) |
| Screen magnification | [ZoomText](https://vispero.com/zoomtext-screen-magnifier-software/) |
| Screen readers | [JAWS](https://vispero.com/jaws-screen-reader-software/) |
| Spaced repetition learning | [Anki](https://apps.ankiweb.net/) |
| Task planning and focus timers | [Super Productivity](https://super-productivity.com/) |
| Document typesetting | [Typst](https://typst.app/) |
| 2D animation | [Tahoma2D](https://tahoma2d.org/) |
| 3D model viewers | [F3D](https://github.com/f3d-app/f3d) |
| Animation lip synchronization | [Papagayo-NG](https://github.com/morevnaproject-org/papagayo-ng) |
| Collaborative drawing | [Drawpile](https://drawpile.net/) |
| DJ mixing | [Mixxx](https://mixxx.org/) |
| Drum sequencing | [Hydrogen](https://github.com/hydrogen-music/hydrogen) |
| Graphic design suites | [Affinity](https://www.affinity.studio/) |
| Guitar tablature | [TuxGuitar](https://www.tuxguitar.app/) |
| HDR photography | [Luminance HDR](https://qtpfsgui.sourceforge.net/) |
| Live coding for music | [Sonic Pi](https://sonic-pi.net/) |
| Media centers | [Kodi](https://kodi.tv/) |
| Media containers and remuxing | [MKVToolNix](https://mkvtoolnix.download/) |
| Media metadata inspection | [MediaInfo](https://mediaarea.net/en/MediaInfo) |
| Media servers | [Jellyfin](https://jellyfin.org/) |
| Panorama stitching | [Hugin](https://hugin.sourceforge.io/) |
| Photo libraries and metadata | [digiKam](https://www.digikam.org/) |
| Visual reference boards | [PureRef](https://www.pureref.com/) |
| Singing voice synthesis | [OpenUtau](https://openutau.com/) |
| Speaker and crossover processing | [CamillaDSP](https://github.com/HEnquist/camilladsp) |
| Stop-motion animation | [Dragonframe](https://www.dragonframe.com/) |
| Lossless video trimming | [LosslessCut](https://mifi.no/losslesscut/) |
| Command benchmarking | [Hyperfine](https://github.com/sharkdp/hyperfine) |
| Data application frameworks | [SQLPage](https://sql-page.com/) |
| Data publishing | [Datasette](https://datasette.io/) |
| Document question answering | [AnythingLLM](https://anythingllm.com/) |
| Amateur radio digital voice | [FreeDV](https://freedv.org/) |
| Astronomical image analysis | [AstroImageJ](https://astroimagej.com/) |
| Breadboard and circuit documentation | [Fritzing](https://fritzing.org/) |
| CNC machine control | [LinuxCNC](https://linuxcnc.org/) |
| CNC toolpath simulation | [CAMotics](https://camotics.org/) |
| Crystal structure visualization | [VESTA](https://jp-minerals.org/vesta/en/) |
| Device telemetry dashboards | [Serial Studio](https://serial-studio.com/) |
| Econometrics | [Gretl](https://gretl.sourceforge.net/) |
| Ecosystem modeling | [InVEST](https://naturalcapitalalliance.stanford.edu/software/invest) |
| Electrical diagrams | [QElectroTech](https://qelectrotech.org/) |
| Factory simulation | [Factory I/O](https://factoryio.com/) |
| Groundwater modeling | [MODFLOW 6](https://www.usgs.gov/software/modflow-6-usgs-modular-hydrologic-model) |
| Simulation mesh generation | [Gmsh](https://gmsh.info/) |
| Microscope control | [Micro-Manager](https://micro-manager.org/) |
| Molecular modeling | [Avogadro](https://avogadro.cc/) |
| Radio transceiver control | [flrig](https://www.w1hkj.org/) |
| River hydraulics | [HEC-RAS](https://www.hec.usace.army.mil/software/hec-ras/) |
| Offline robot programming | [RoboDK](https://robodk.com/) |
| Satellite signal reception | [SatDump](https://github.com/SatDump/SatDump) |
| Software-defined radio development | [GNU Radio](https://www.gnuradio.org/) |
| Simulation geometry and preprocessing | [SALOME](https://www.salome-platform.org/) |
| Stormwater modeling | [EPA SWMM](https://www.epa.gov/water-research/storm-water-management-model-swmm) |
| Microscopy surface analysis | [Gwyddion](https://gwyddion.net/) |
| Physical system modeling | [OpenModelica](https://openmodelica.org/) |
| Motion measurement from video | [Tracker](https://opensourcephysics.github.io/tracker-website/) |
| Water distribution modeling | [EPANET](https://www.epa.gov/water-research/epanet) |
