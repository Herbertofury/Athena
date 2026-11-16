# Software coverage and refresh priorities

[Catalog](Software-Catalog) · [Decision guides](Software-Decision-Guides) · [Method](Software-Methodology)

Reviewed 2026-11-15. The integrated catalog contains **1019 applications in 357 categories**. It is a substantial expansion, not a claim of complete software coverage. 105 categories currently contain one application and need stronger comparison sets.

## Evidence that remains open

| Field | Unresolved records |
| --- | ---: |
| Pricing model | 237 |
| License classification | 29 |
| Dated maintenance evidence | 397 |

The counts overlap. Unknown pricing can mean that free source code was verified but the distribution terms were not established. Unverified maintenance is not the same as an abandoned project. All nonlegacy records with known licensing, pricing, platform or download claims must include corresponding source annotations; the build rejects missing mappings. An annotation identifies the source's intended role and is not a substitute for reading it.

There are also 76 mentions of alternatives outside this catalog. The refresh queue records their names and referring records as research leads; they are not counted as verified applications or promoted to ranked choices.

The [machine-readable refresh queue](https://github.com/Herbertofury/Athena/blob/main/research/software-expansion-2026-11-15/refresh-queue.json) contains 538 records needing more research and 0 source URLs due for review. Every cited source has its own age: checking a homepage again does not refresh an older license or platform document. Run `python3 scripts/report_software_coverage.py --output software-refresh-report.json` to recompute the queue using today's date. Pull requests and the weekly source audit retain this report alongside HTTP outcomes and real-browser evidence. A 90-day review interval is a scheduling policy, not a factual expiration date.

## Next coverage areas

### Desktop communication and conferencing

Private messaging and interoperable chat; Video meetings and screen sharing; Team communication and account boundaries.

Compare desktop clients, protocol interoperability, retention controls, account requirements and free-plan limits. Existing email and remote-desktop coverage does not establish chat or meeting coverage.

### Radio and signal workflows

Software-defined radio reception; Spectrum and antenna analysis; Amateur-radio logging and decoding.

Verify receiver hardware, drivers, operating-system support and protocol capabilities separately; network packet tools are not substitutes for radio processing.

### Bioinformatics and sequence analysis

Sequence alignment and assembly; Genomic visualization; Reproducible molecular data analysis.

Extend beyond the current imaging and molecular visualization records with documented formats, reproducibility and installation requirements.

### Building design and production manufacturing

Building information modeling and IFC exchange; Building-energy simulation; Production CAM, nesting and machine-specific postprocessing.

Evaluate interoperability and complete licensing costs; existing CAD, simulation and electronics entries do not establish a complete BIM or manufacturing workflow.

### Specialist audio restoration and delivery

Dialogue restoration and source separation; Mastering and loudness compliance; Audio-forensics and damaged-recording repair.

Add representative licensed sample tests and documented plug-in/standalone compatibility. Existing DAW and synthesis coverage is broader than current restoration coverage.

### Project, schedule and resource planning

Gantt and dependency planning; Resource and capacity scheduling; Portfolio and project file interchange.

Compare local and hosted project models, export/import limits, team licensing and offline behavior beyond simple task lists.

### Industrial robotics and control

Robot simulation and motion planning; PLC programming and industrial protocols; Hardware-in-the-loop development.

Verify supported controllers, simulation fidelity, host requirements and deployment licensing. General electronics and application automation do not establish industrial control coverage.

### Operational business software

Inventory and purchasing; Desktop or self-hosted ERP and point of sale; Small-business workflow integration.

Extend beyond personal accounting and general office tools with documented data portability, deployment requirements and business licensing. Existing accounting coverage includes some invoicing, but does not establish full ERP or inventory capability.

### Evidence depth and thin comparison sets

Second and third candidates for single-tool categories; Measured lightweight and accessibility comparisons; Refresh unresolved licensing, pricing and maintenance fields.

Use the generated refresh queue and coverage report. Do not turn documentation review, download availability or popularity into a speed, security or reliability ranking.

## Categories with one researched candidate

These are useful starting points but do not yet support a broad within-category comparison. Related tools can still appear in task guides and explicit alternative links.

| Category | Current application |
| --- | --- |
| Cache and temporary file cleanup | [BleachBit](https://www.bleachbit.org/) |
| Container Management | [Portainer Community Edition](https://github.com/portainer/portainer) |
| Reproducible development machines | [Vagrant](https://developer.hashicorp.com/vagrant) |
| Infrastructure Monitoring | [Netdata](https://github.com/netdata/netdata) |
| Log Analysis | [lnav](https://github.com/tstack/lnav) |
| Startup and persistence inventory | [Autoruns](https://learn.microsoft.com/en-us/sysinternals/downloads/autoruns) |
| Storage Activity | [iotop-c](https://github.com/Tomas-M/iotop) |
| Storage Diagnostics | [nvme-cli](https://github.com/linux-nvme/nvme-cli) |
| Quick file previews | [QuickLook](https://github.com/QL-Win/QuickLook) |
| Client-server backup | [UrBackup](https://www.urbackup.org/) |
| Activity Tracing | [Linux Audit](https://github.com/linux-audit/audit-userspace) |
| Adware and unwanted software removal | [Malwarebytes AdwCleaner](https://www.malwarebytes.com/adwcleaner) |
| Detection rule engineering | [Sigma rules](https://github.com/SigmaHQ/sigma) |
| USB device access control | [USBGuard](https://usbguard.github.io/) |
| Disk encryption | [VeraCrypt](https://veracrypt.io/) |
| Encrypted Folder Managers | [SiriKali](https://mhogomchungu.github.io/sirikali/) |
| Endpoint inventory queries | [osquery](https://github.com/osquery/osquery) |
| Endpoint investigation | [Velociraptor](https://github.com/Velocidex/velociraptor) |
| Endpoint event telemetry | [Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) |
| File Integrity Monitoring | [AIDE](https://aide.github.io/) |
| File pattern matching | [YARA-X](https://github.com/VirusTotal/yara-x) |
| Executable signature verification | [Sigcheck](https://learn.microsoft.com/en-us/sysinternals/downloads/sigcheck) |
| Managed endpoint monitoring | [Wazuh agent](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html) |
| Repair and disinfection orchestration | [Tron](https://github.com/bmrf/tron) |
| Static executable analysis | [Detect It Easy](https://github.com/horsicq/Detect-It-Easy) |
| Bandwidth Accounting | [vnStat](https://humdi.net/vnstat/) |
| Bandwidth limits and prioritization | [NetLimiter](https://www.netlimiter.com/) |
| Cloud Storage Clients | [Rclone Browser](https://github.com/kapitainsky/RcloneBrowser) |
| Local network file sharing | [LocalSend](https://github.com/localsend/localsend) |
| Mesh VPN control planes | [Headscale](https://headscale.net/) |
| Packet Capture | [tcpdump](https://www.tcpdump.org/) |
| Remote management | [MeshCentral](https://github.com/Ylianst/MeshCentral) |
| Service Monitoring | [Uptime Kuma](https://github.com/louislam/uptime-kuma) |
| Academic Writing | [Zettlr](https://www.zettlr.com/) |
| Accessible Reading | [Thorium Reader](https://www.edrlab.org/software/thorium-reader/) |
| Application launchers | [Flow Launcher](https://github.com/Flow-Launcher/Flow.Launcher) |
| Clipboard managers | [CopyQ](https://github.com/hluk/CopyQ) |
| Desktop utility suites | [PowerToys](https://github.com/microsoft/PowerToys) |
| Dictionary lookup | [GoldenDict-ng](https://xiaoyifang.github.io/goldendict-ng/) |
| Document conversion | [Pandoc](https://pandoc.org/) |
| Focused prose writing | [FocusWriter](https://gottcode.org/focuswriter/) |
| Markdown editors | [ghostwriter](https://ghostwriter.kde.org/) |
| Mind mapping | [Freeplane](https://www.freeplane.org/) |
| PDF content editors | [Adobe Acrobat Pro](https://www.adobe.com/acrobat/acrobat-pro.html) |
| PDF processing | [Stirling PDF](https://stirling.com/) |
| Screen Magnification | [ZoomText](https://vispero.com/zoomtext-screen-magnifier-software/) |
| Screen Readers | [JAWS](https://vispero.com/jaws-screen-reader-software/) |
| Spaced repetition learning | [Anki](https://apps.ankiweb.net/) |
| Task planning and focus timers | [Super Productivity](https://super-productivity.com/) |
| Document typesetting | [Typst](https://typst.app/) |
| 2D Animation | [Tahoma2D](https://tahoma2d.org/) |
| 3D model viewers | [F3D](https://github.com/f3d-app/f3d) |
| Animation Lip Sync | [Papagayo-NG](https://github.com/morevnaproject-org/papagayo-ng) |
| Audio conversion | [fre:ac](https://www.freac.org/) |
| Audio plug-in hosts | [Carla](https://kx.studio/Applications:Carla) |
| Collaborative drawing | [Drawpile](https://drawpile.net/) |
| DJ mixing | [Mixxx](https://mixxx.org/) |
| Drum sequencing | [Hydrogen](https://github.com/hydrogen-music/hydrogen) |
| Graphic Design Suites | [Affinity](https://www.affinity.studio/) |
| Guitar tablature | [TuxGuitar](https://www.tuxguitar.app/) |
| HDR photography | [Luminance HDR](https://qtpfsgui.sourceforge.net/) |
| Live Coding Music | [Sonic Pi](https://sonic-pi.net/) |
| Media centers | [Kodi](https://kodi.tv/) |
| Media containers and remuxing | [MKVToolNix](https://mkvtoolnix.download/) |
| Media metadata inspection | [MediaInfo](https://mediaarea.net/en/MediaInfo) |
| Media servers | [Jellyfin](https://jellyfin.org/) |
| Panorama stitching | [Hugin](https://hugin.sourceforge.io/) |
| Photo libraries and metadata | [digiKam](https://www.digikam.org/) |
| Visual reference boards | [PureRef](https://www.pureref.com/) |
| Singing Synthesis | [OpenUtau](https://openutau.com/) |
| Speaker and crossover processing | [CamillaDSP](https://github.com/HEnquist/camilladsp) |
| Stop Motion | [Dragonframe](https://www.dragonframe.com/) |
| Lossless video trimming | [LosslessCut](https://mifi.no/losslesscut/) |
| Command benchmarking | [Hyperfine](https://github.com/sharkdp/hyperfine) |
| Data Publishing | [Datasette](https://datasette.io/) |
| Package Managers | [pnpm](https://pnpm.io/) |
| Document question answering | [AnythingLLM](https://anythingllm.com/) |
| Game Graphics Tools | [ReShade](https://github.com/crosire/reshade) |
| Amateur Digital Voice | [FreeDV](https://freedv.org/) |
| Astronomical Image Analysis | [AstroImageJ](https://astroimagej.com/) |
| Breadboard and circuit documentation | [Fritzing](https://fritzing.org/) |
| Cnc Machine Control | [LinuxCNC](https://linuxcnc.org/) |
| CNC toolpath simulation | [CAMotics](https://camotics.org/) |
| Computational Fluid Dynamics | [OpenFOAM Foundation](https://openfoam.org/) |
| Crystal Visualization | [VESTA](https://jp-minerals.org/vesta/en/) |
| Curve Fitting | [Fityk](https://fityk.nieto.pl/) |
| Device Telemetry | [Serial Studio](https://serial-studio.com/) |
| Ecosystem Modeling | [InVEST](https://naturalcapitalalliance.stanford.edu/software/invest) |
| Electrical Diagrams | [QElectroTech](https://qelectrotech.org/) |
| Factory Simulation | [Factory I/O](https://factoryio.com/) |
| Simulation mesh generation | [Gmsh](https://gmsh.info/) |
| Microscope Control | [Micro-Manager](https://micro-manager.org/) |
| Molecular modeling | [Avogadro](https://avogadro.cc/) |
| Particle Analysis | [OVITO](https://www.ovito.org/) |
| Phonetics Analysis | [Praat](https://praat.org/) |
| Radio Control | [flrig](https://www.w1hkj.org/) |
| Robotics Offline Programming | [RoboDK](https://robodk.com/) |
| Satellite Reception | [SatDump](https://github.com/SatDump/SatDump) |
| Sdr Development | [GNU Radio](https://www.gnuradio.org/) |
| Simulation Preprocessing | [SALOME](https://www.salome-platform.org/) |
| Surface Analysis | [Gwyddion](https://gwyddion.net/) |
| Systems Simulation | [OpenModelica](https://openmodelica.org/) |
| Terrain analysis | [SAGA GIS](https://sourceforge.net/projects/saga-gis/) |
| Virtual Globes | [Marble](https://marble.kde.org/) |
| Visual data mining and analysis | [Orange Data Mining](https://orangedatamining.com/) |
