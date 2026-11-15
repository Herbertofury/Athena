# Software decision guides

[Open Athena](https://herbertofury.github.io/Athena/#software) · [Catalog](Software-Catalog)

These are conditional editorial recommendations based on cited product capabilities. They are not benchmark results. Ranking applies only to the stated task and constraints; prices and exact OS requirements need a final upstream check before purchase or installation.

## Design page layouts and scalable artwork

Match the tool to page layout, vector illustration, everyday documents or programmable typesetting.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Print layout | [Scribus](https://www.scribus.net/) | Page layout, color management and PDF output suit brochures and multi-page publications. | Check imported assets and press requirements; proprietary layout-document interchange is limited. |
| Vector artwork | [Inkscape](https://inkscape.org/) | SVG-native editing suits icons, logos and illustrations that must remain scalable. | It is primarily a drawing workflow; complex multi-page publishing needs a layout application. |
| Office documents | [LibreOffice](https://www.libreoffice.org/) | Writer, Calc and Impress cover ordinary documents without a separate publishing stack. | Complex imported Office files and macros need compatibility checks. |
| Programmable documents | [Typst](https://typst.app/) | The open-source compiler and templates support repeatable technical reports. | The markup workflow and hosted-editor plans differ from traditional desktop word processing. |

## Inspect and process image files

Choose for RAW development, minimal viewing, broad browsing or repeatable image processing.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| RAW photography | [darktable](https://www.darktable.org/) | Non-destructive processing and image-library tools fit photographic development. | Learn the processing pipeline and verify camera support. |
| Minimal viewing | [qView](https://interversehq.com/qview/) | A sparse viewer interface keeps attention on the image. | It omits full cataloging and photo-editing features. |
| Browse and batch | [XnView MP](https://www.xnview.com/en/xnviewmp/) | Viewing, metadata and batch conversion are available in one application. | Company use needs an appropriate paid license. |
| Scripted processing | [ImageMagick](https://imagemagick.org/) | Command-line transforms support repeatable conversion and image-composition pipelines. | Build options, delegates and security policy affect supported formats. |

## Trim, convert and inspect media

Use the operation you need to choose between trimming, transcoding, container changes and technical inspection.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Trim without full re-encoding | [LosslessCut](https://mifi.no/losslesscut/) | Stream-preserving cuts suit long recordings with unwanted sections. | Keyframes constrain some cuts; store builds and direct-download pricing differ. |
| Graphical conversion | [Shutter Encoder](https://www.shutterencoder.com/) | An FFmpeg-based desktop interface exposes production-oriented conversion and rewrapping. | Quality and delivery compatibility depend on the selected settings. |
| Matroska tracks | [MKVToolNix](https://mkvtoolnix.download/) | Dedicated muxing and metadata tools manage tracks and chapters in MKV files. | This does not replace a video-effects or general transcoding workflow. |
| Diagnose a file | [MediaInfo](https://mediaarea.net/en/MediaInfo) | Reports codecs, tracks and technical properties before import or delivery. | Inspection does not repair the file. |

## Create and time subtitles

Compare a broad subtitle-editing workflow with detailed styled subtitle typesetting.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| General subtitle work | [Subtitle Edit](https://www.nikse.dk/subtitleedit) | Timing, conversion and video-assisted editing cover common subtitle preparation tasks. | Runtime and media dependencies differ by platform. |
| Styled typesetting | [Aegisub](https://aegisub.org/) | Audio timing, ASS styling and video preview support detailed subtitle placement. | Player support for complex ASS styling varies. |

## Write music notation and guitar tabs

Choose among visual score entry, reproducible engraving and instrument-specific notation.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Visual score editing | [MuseScore Studio](https://musescore.org/) | An open-source desktop score editor combines notation, playback and part extraction. | The desktop app is distinct from paid score-sharing and optional sound services. |
| Text-based engraving | [LilyPond](https://lilypond.org/) | Notation source can be versioned and compiled into printable scores. | Learning the notation language is required. |
| LilyPond editor | [Frescobaldi](https://www.frescobaldi.org/) | Editing aids and preview provide a focused environment for LilyPond projects. | LilyPond remains a separate required engraving engine. |
| Guitar tablature | [TuxGuitar](https://www.tuxguitar.app/) | Tablature and playback fit guitar-oriented composing and practice. | Check import fidelity and the newer file format before sharing with older versions. |

## Build a software synthesis workspace

Compare modular patching, a broad hybrid synth and a focused FM instrument.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Modular composition | [Bespoke Synth](https://www.bespokesynth.com/) | Visual patching combines synthesis, sequencing and processing modules. | Its workflow differs from a conventional linear DAW. |
| Virtual modular rack | [VCV Rack](https://vcvrack.com/Rack) | A module ecosystem and cable-based patching fit modular-synthesis study and sound design. | Rack Free, Rack Pro and third-party modules have separate feature and licensing choices. |
| Free hybrid instrument | [Surge XT](https://surge-synthesizer.github.io/) | Multiple synthesis methods and modulation options provide a broad sound-design palette. | Plugin compatibility and complex-patch CPU demands need checking. |
| FM specialist | [Dexed](https://asb2m10.github.io/dexed/) | DX7-inspired FM synthesis and patch workflows suit a specific sound-design approach. | It is intentionally narrower than a general-purpose synthesizer. |

## Choose a personal knowledge base

Decide whether notebooks, local Markdown, hierarchical rich notes or plain-text sync integration best match your work.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Open-source notebooks | [Joplin](https://joplinapp.org/) | Markdown notes, notebooks and several synchronization options suit a conventional research notebook. | Hosted Joplin Cloud is optional and paid; test sync and restore behavior. |
| Local linked files | [Obsidian](https://obsidian.md/) | Markdown vaults and links support a flexible, local-file knowledge graph. | The app is proprietary; optional Sync and Publish services are paid. |
| Rich hierarchy | [Trilium Notes](https://triliumnotes.org/) | Nested notes and multiple note types suit a structured personal knowledge base. | Scripting and self-hosted options add administration responsibilities. |
| Plain-text workflow | [QOwnNotes](https://www.qownnotes.org/) | Markdown files and optional Nextcloud/ownCloud integration suit file-centered note management. | The synchronization service is a separate component to configure. |

## Scan, search and organize paperwork

Choose a scanning interface, an automated OCR pipeline, or a focused page organizer.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Scan to searchable PDF | [NAPS2](https://www.naps2.com/) | Scanner acquisition, page handling and OCR are available in a desktop interface. | Driver support and scan quality affect the result. |
| Automated PDF OCR | [OCRmyPDF](https://ocrmypdf.readthedocs.io/) | A command-line workflow adds searchable text layers to existing scanned PDFs. | Language packs, dependencies and OCR review are required. |
| Organize pages | [PDF Arranger](https://github.com/pdfarranger/pdfarranger) | Merge, split, crop and reorder PDF pages interactively. | It does not replace text editing or a redaction tool. |
| Read and annotate | [Okular](https://okular.kde.org/) | Document viewing and PDF annotation support reviewing the result. | Annotation interoperability and platform packaging should be tested. |

## Analyze scientific images and simulation output

Match microscopy images, Python-based image stacks or simulation meshes to the appropriate analysis environment.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Microscopy toolbox | [Fiji](https://fiji.sc/) | The ImageJ distribution bundles many scientific imaging tools and plugins. | Validate the chosen analysis and plugin versions before drawing conclusions. |
| Python image stacks | [napari](https://napari.org/) | Multidimensional viewing and Python integration fit custom scientific imaging workflows. | Manage the Python environment, plugin versions and memory needs. |
| Simulation visualization | [ParaView](https://www.paraview.org/) | Data readers and a visualization pipeline fit numerical and mesh-based simulation outputs. | Large datasets and specialized formats require resource planning. |

## Map and process geospatial data

Choose a desktop map-making environment, analysis engine, terrain specialist or point-cloud pipeline.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Desktop GIS | [QGIS](https://qgis.org/) | Map composition and spatial editing support a broad geographic-information workflow. | Coordinate systems, data quality and plugins need review. |
| Repeatable geospatial analysis | [GRASS GIS](https://grass.osgeo.org/) | Dedicated raster/vector modules and scripting suit analytical processing. | Region and projection concepts have a learning curve. |
| Terrain specialist | [SAGA GIS](https://sourceforge.net/projects/saga-gis/) | Terrain, raster and geoscience modules support elevation-derived analysis. | Check module behavior and version-specific file support. |
| Point-cloud automation | [PDAL](https://pdal.org/) | Pipeline-based filtering and conversion suit batch LiDAR processing. | A separate viewer helps inspect the results. |

## Design and simulate electronics

Compare complete PCB design, a structured component workflow, accessible prototype documentation and circuit simulation.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| PCB design suite | [KiCad](https://www.kicad.org/) | Schematic capture, board layout and 3D viewing cover a complete board-design workflow. | Footprints and manufacturing outputs need checking against actual components and fabrication rules. |
| Integrated component libraries | [LibrePCB](https://librepcb.org/) | A consistent schematic/board/library model suits repeatable component-driven designs. | Confirm library coverage and advanced board requirements. |
| Prototype documentation | [Fritzing](https://fritzing.org/) | Breadboard, schematic and board views suit visually documenting accessible electronics projects. | Official binaries are paid; component accuracy still needs review. |
| Circuit simulation | [Qucs-S](https://ra3xdh.github.io/) | A graphical front end connects schematics with several SPICE-compatible simulators. | Models and simulator selection determine the validity of results. |

## Analyze tabular scientific data

Compare conventional statistics, Bayesian workflows, visual data mining and matrix-based numerical programming.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Spreadsheet-style statistics | [jamovi](https://www.jamovi.org/) | A graphical data editor and R-based analyses suit teaching and common statistical tasks. | Choose the model and assumptions deliberately; extra modules may be required. |
| Frequentist and Bayesian analysis | [JASP](https://jasp-stats.org/) | Graphical analysis and reporting cover both statistical approaches. | Interpretation and study design remain the responsibility of the analyst. |
| Visual analysis workflows | [Orange Data Mining](https://orangedatamining.com/) | Connected widgets make exploratory analysis and machine-learning steps visible. | Validate data splits and defaults to avoid misleading results. |
| Numerical programming | [GNU Octave](https://octave.org/) | Matrix-oriented syntax supports custom numerical experiments and plotting. | Compatibility with MATLAB toolboxes and specialized integrations is incomplete. |

## Choose an editor for your programming workflow

Match graphical tooling, terminal habits, and licensing preferences. These are workflow choices based on documented features, not measured speed rankings.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Broad graphical tooling | [Visual Studio Code](https://code.visualstudio.com/) | Integrated debugging, terminals, source control, and extensions support many languages in one workspace. | The official Microsoft binary has different terms from the MIT-licensed Code-OSS source; extensions have their own licenses. |
| Custom terminal workflow | [Neovim](https://neovim.io/) | Lua configuration and an embeddable API suit users who want to assemble a keyboard-driven environment. | Modal editing and plugin configuration require learning and ongoing choices. |
| Integrated terminal features | [Helix](https://helix-editor.com/) | Multiple selections, Tree-sitter editing, and built-in LSP support provide a cohesive terminal editing model. | Its selection-first controls differ from Vim and GUI editors. |
| Paid text-editing focus | [Sublime Text](https://www.sublimetext.com/) | Multiple selections and project navigation suit intensive text manipulation in a graphical editor. | Continued use requires a paid license, and deeper IDE features can require plugins. |

## Pick a Python workspace for learning or analysis

A debugger for learning, an interactive scientific IDE, and notebooks solve different problems.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Learn program execution | [Thonny](https://thonny.org/) | Its teaching-focused debugger exposes expression evaluation and variable state. | Larger multi-language projects may need a broader development environment. |
| Inspect scientific variables | [Spyder](https://www.spyder-ide.org/) | An IPython console and variable explorer support array and dataframe investigation beside scripts. | Scientific dependencies and environment selection must be kept consistent. |
| Combine code and explanation | [JupyterLab](https://jupyter.org/) | Notebooks keep narrative, code, outputs, and data exploration together. | Kernel and execution-order state need discipline for reproducible results. |

## Review changes and manage Git history

Choose by operating system and preference for a terminal, a guided client, or deeper graphical history tools.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Terminal Git workflow | [lazygit](https://github.com/jesseduffield/lazygit) | Status, diffs, staging, branches, and rebasing remain accessible from a keyboard-driven interface. | The visual interface does not remove the need to understand history-changing operations. |
| Guided commits | [GitHub Desktop](https://github.com/apps/desktop) | Visual diffs and a focused commit workflow help users review what they are about to commit. | Official distributions support Windows and macOS; advanced Git actions may need the CLI. |
| Windows repository inspection | [Git Extensions](https://gitextensions.github.io/) | A commit graph, branch tools, and Windows integration support detailed repository work. | Windows prerequisites and Git configuration still need setup. |
| Paid desktop history tools | [Fork](https://git-fork.com/) | Visual interactive rebase, image diffs, and a merge helper suit users who want a dedicated Git GUI. | Windows/macOS only, with a paid license following evaluation. |

## Build API collections or inspect live HTTP behavior

Sending a request, maintaining a test collection, and intercepting application traffic are distinct tasks.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Version API collections | [Bruno](https://www.usebruno.com/) | Local plain-text collections can live with the application repository and be reviewed in Git. | Some advanced and team features belong to paid editions. |
| Standalone request CLI | [xh](https://github.com/ducaale/xh) | Concise request syntax and formatted responses suit quick terminal investigation. | Not every HTTPie option or behavior is implemented. |
| Inspect and replay traffic | [mitmproxy](https://www.mitmproxy.org/) | An intercepting proxy with scripting supports repeatable HTTP debugging of authorized targets. | HTTPS interception requires explicit certificate trust and deliberate target configuration. |
| Visual application interception | [HTTP Toolkit](https://httptoolkit.com/) | Application integrations and request filtering help inspect supported HTTP clients through a GUI. | Advanced features and target integrations vary by plan and environment. |

## Inspect a local database or manage several engines

Start with the database engine and whether the task is browsing, querying, or administration.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Local SQLite files | [DB Browser for SQLite](https://sqlitebrowser.org/) | Visual tables and SQL execution let users inspect a SQLite file without a server. | This is a SQLite-focused tool, not a multi-engine administration suite. |
| Several database engines | [DBeaver Community](https://dbeaver.io/) | Drivers, SQL editing, and data browsing share one cross-platform interface. | Enterprise and cloud features can differ between Community and paid products. |
| PostgreSQL administration | [pgAdmin](https://www.pgadmin.org/) | PostgreSQL-specific object and server tooling provides dedicated administrative context. | It is specialized for PostgreSQL rather than every database engine. |
| Integrated SQL development | [JetBrains DataGrip](https://www.jetbrains.com/datagrip/) | Schema-aware SQL and interactive data tools suit database-centric development work. | Free non-commercial eligibility and commercial subscriptions have different conditions. |

## Choose a local AI interface or inference runtime

Choose the model and memory budget first, then the interface and deployment control you need. No hardware benchmark or model-quality winner is claimed.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Managed models and local API | [Ollama](https://ollama.com/) | Model management and an application-facing API simplify supported local-model workflows. | Model memory needs, acceleration support, optional cloud use, and model licenses must be checked. |
| Detailed runtime control | [llama.cpp](https://github.com/ggml-org/llama.cpp) | Explicit GGUF files and hardware backends suit users who want direct inference configuration. | Build options and supported architectures require more technical decisions. |
| Desktop chat interface | [Jan](https://www.jan.ai/) | A graphical workspace offers local models alongside configured external providers. | Privacy and cost depend on which provider and model are selected. |
| Questions over documents | [AnythingLLM](https://anythingllm.com/) | Document ingestion and retrieval can be organized into dedicated workspaces. | A local installation can still send data to configured external embedding or model services. |

## Automate service flows or repetitive typing

Use a flow engine for events and integrations, and a desktop text expander for repeated text. These tools can be complementary.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Event and device flows | [Node-RED](https://nodered.org/) | Visual message flows and reusable nodes support service, API, and device integration. | Installed nodes, credentials, and exposed endpoints require maintenance. |
| Internal service workflows | [n8n](https://n8n.io/) | Visual integration steps and custom code can be combined in hosted or self-hosted workflows. | Its Sustainable Use and enterprise licenses are source-available, with restrictions beyond standard open-source licenses. |
| Connector-based automation | [Activepieces](https://www.activepieces.com/) | Reusable pieces and visual flows support common service integrations. | Community and enterprise portions use different licensing and features. |
| Cross-application snippets | [Espanso](https://espanso.org/) | Typed triggers expand reusable text across supported desktop applications. | Input permissions and application compatibility vary by operating system. |

## Choose tools for a modded game setup

Match the game and mod ecosystem before choosing a manager; an editor or conflict checker complements deployment rather than replacing it.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Profiles and virtual files | [Mod Organizer 2](https://www.modorganizer.org/) | Virtual-filesystem deployment separates managed mods from original files for supported games. | Game support and a correct load order still need explicit verification. |
| Nexus-centered workflows | [Vortex](https://www.nexusmods.com:443/vortex) | Game extensions, deployment, and profiles integrate with supported Nexus Mods workflows. | Extension support, filesystem requirements, and site account features vary. |
| Isolated Minecraft instances | [Prism Launcher](https://prismlauncher.org/) | Separate instances organize Minecraft versions, loaders, Java settings, and modpacks. | The game account and all selected Java, loader, and mod versions must be compatible. |
| Bethesda record conflicts | [xEdit](https://tes5edit.github.io/) | Record-level views reveal plugin conflicts before creating a compatibility patch. | This is a specialist editor; incorrect changes can damage a load order and require backups. |

## Choose an emulator for the console and title

Console coverage is the first filter. Then consult each project's game compatibility and setup documentation; game and firmware data are separate.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| GameCube and Wii | [Dolphin](https://dolphin-emu.org/) | Controls and graphics configuration are specialized for GameCube and Wii software. | Per-game compatibility and required controller behavior vary. |
| PlayStation 2 | [PCSX2](https://pcsx2.net/) | PS2-specific configuration and rendering options support a large range of title-specific setups. | A suitable BIOS and game data are required, and performance depends on the title and hardware. |
| PlayStation 3 | [RPCS3](https://github.com/RPCS3/rpcs3) | The project documents title compatibility and per-game configuration for PS3 emulation. | Hardware demands are substantial for some titles; the official download page was blocked to this research environment. |
| Unified multi-core frontend | [RetroArch](https://www.retroarch.com/) | A common interface shares controller and display configuration across compatible Libretro cores. | Every core has separate compatibility and licensing; a frontend does not make all consoles equivalent. |

## Find the source of slow frames or expensive code

Match the measurement tool to the layer being investigated and use a reproducible workload.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Rendering pipeline inspection | [RenderDoc](https://renderdoc.org/) | A captured frame exposes resource contents, shaders, and pipeline state for supported APIs. | Use supported applications and APIs; upstream support is focused on programs you create. |
| Instrumented native programs | [Tracy](https://github.com/wolfpld/tracy) | CPU, memory, and synchronization events can be correlated on detailed timelines. | Instrumentation needs integration and can influence the measured workload. |
| Correlate system traces | [Perfetto](https://perfetto.dev/) | Trace timelines and SQL analysis support multiple event sources in one investigation. | System-wide recording is platform-specific; viewers and analysis tools have broader support. |
| Inspect sampled stacks | [Speedscope](https://www.speedscope.app/) | Interactive profile views help examine expensive call paths in an imported profile. | It is a viewer, so a separate profiler must first capture compatible data. |

## Choose a download tool for the transfer type

Select by protocol and automation needs, then use official sources and content you have permission to download.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Automated resumable transfers | [aria2](https://aria2.github.io/) | Several transfer protocols and an RPC interface suit scripted download queues. | Remote-control interfaces need deliberate configuration and access protection. |
| Desktop transfer queue | [Motrix](https://motrix.app/) | An aria2-based engine is exposed through a graphical queue. | Site-specific logins or restrictions may need a different workflow. |
| BitTorrent transfers | [qBittorrent](https://www.qbittorrent.org/) | Desktop and optional web interfaces provide torrent management and transfer controls. | Optional plugins and remote web access introduce additional configuration choices. |
| Permitted media extraction | [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Site extractors, format selection, and FFmpeg integration support repeatable media workflows. | Extractor compatibility changes with websites, and access rights remain separate from technical support. |

## Choose a browser by workflow and privacy needs

Browser engine, tab organization, defaults, and network routing are separate choices. No browser is claimed universally fastest or safest.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Independent browser engine | [Firefox](https://www.firefox.com/) | Gecko and Firefox's extension ecosystem offer an alternative to Chromium-based products. | Test required sites and extensions against the chosen browser and settings. |
| Organize many web tasks | [Vivaldi](https://vivaldi.com/) | Tab workspaces, tiling, and panels support many concurrent websites in one interface. | The full browser has proprietary terms and more configuration choices. |
| Privacy-oriented defaults | [LibreWolf](https://librewolf.net/) | A Firefox-derived configuration includes privacy settings and a content blocker. | Stricter defaults and DRM choices can reduce compatibility with some sites. |
| Tor routing and onion sites | [Tor Browser](https://www.torproject.org/) | The browser and Tor routing are configured together for a coordinated privacy workflow. | Expect network and site-compatibility tradeoffs; extra plugins or identifying account use can undermine privacy. |

## Keep recoverable versions of personal files

Choose by operating system, interface preference, and where encrypted backup history will be stored.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Open-source CLI fit | [restic](https://github.com/restic/restic) | Encrypted, versioned backups across supported local and remote storage backends. | Requires command-line setup and an independently tested restore process. |
| Linux and Mac desktop fit | [Vorta](https://vorta.borgbase.com/) | Puts Borg profiles, schedules and archive restoration behind a desktop interface. | Depends on Borg compatibility and does not provide native Windows support. |
| Premium desktop fit | [Arq Backup](https://www.arqbackup.com/) | Windows and macOS application for encrypted backups to selected local or cloud destinations. | Software licensing and storage-provider charges may be separate. |

## Prepare a complete PC recovery image

Disk imaging protects an operating-system installation; keep personal-file backups and restore tests as separate requirements.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Graphical boot-media fit | [Rescuezilla](https://rescuezilla.com/) | Creates and restores disk images through a GUI with Clonezilla image compatibility. | Requires booting recovery media and selecting the destination carefully. |
| Deployment specialist | [Clonezilla](https://clonezilla.org/) | Provides disk and partition imaging with specialist deployment workflows. | The boot-media workflow and many options require more familiarity. |
| Premium Windows fit | [Macrium Reflect](https://www.macrium.com/products/home) | Integrates Windows image backups and rescue-media recovery. | Commercial edition and subscription terms apply. |

## Choose a recovery tool by failure type

A failing device, lost partition, and missing file metadata need different tools; recover output to separate storage.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Read-error imaging | [GNU ddrescue](https://www.gnu.org/software/ddrescue/) | Copies readable areas of damaged media and records a resumable recovery map. | It copies sectors; it does not reconstruct a lost filesystem or undelete files. |
| Lost-partition specialist | [TestDisk](https://www.cgsecurity.org/wiki/TestDisk) | Investigates missing partitions and supported damaged filesystem structures. | Repair modes can modify disk metadata; work from an image when practical. |
| Signature-carving fit | [PhotoRec](https://www.cgsecurity.org/wiki/PhotoRec) | Looks for supported file content even when directory metadata is unusable. | Recovered files can lose their original names and folder layout. |
| Advanced graphical recovery | [DMDE](https://dmde.com/) | Offers filesystem reconstruction, disk inspection and RAID-related recovery. | Free-edition limits and advanced editing risks require review. |

## Find what is consuming disk space

Start with measurement and file review before choosing anything to delete.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Windows NTFS specialist | [WizTree](https://diskanalyzer.com/) | Combines a treemap with Windows NTFS metadata scanning. | Commercial use requires the appropriate license; WizTreeMac has different behavior. |
| Open-source Windows fit | [WinDirStat](https://github.com/windirstat/windirstat) | Shows a Windows directory-size breakdown and treemap. | A size visualization does not establish whether a file is disposable. |
| Terminal and SSH fit | [ncdu](https://dev.yorhel.nl/ncdu) | Provides interactive directory-size navigation without a graphical desktop. | Permissions limit visibility, and live files may change during a scan. |

## Manage files across several folders

Compare graphical dual-pane workflows with terminal-first navigation.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Open-source dual-pane fit | [Double Commander](https://github.com/doublecmd/doublecmd) | Offers a commander-style graphical interface across supported desktop platforms. | Advanced operations and plugins still have a learning curve. |
| Premium Windows workflow | [Directory Opus](https://www.gpsoft.com.au/) | Offers extensive Windows file-management customization and automation. | Commercial licensing and configuration effort apply. |
| Terminal workflow fit | [Yazi](https://yazi-rs.github.io/) | Combines asynchronous terminal navigation with configurable file previews. | Preview helpers and terminal image support need compatible setup. |

## Help someone on a remote computer

Match the connection model to the user’s setup and who operates the coordination service.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Self-hosting fit | [RustDesk](https://rustdesk.com/) | Supports remote desktop and file transfer with optional self-hosted coordination. | Operating a server and unattended-access policy adds administration. |
| Commercial support fit | [AnyDesk](https://anydesk.com/) | Provides a cross-platform remote-support workflow with commercial administration options. | Professional use requires the appropriate license. |
| Linux multi-protocol fit | [Remmina](https://remmina.org/) | Collects RDP, VNC and SSH connection profiles in one Linux desktop client. | It needs an existing remote server and suitable protocol plugins. |

## Connect private devices across networks

Mesh networking connects devices; it is distinct from buying an Internet exit VPN service.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Managed coordination fit | [Tailscale](https://tailscale.com/) | Automates private WireGuard-based device connectivity with identity and access policies. | Hosted coordination and plan-specific limits apply. |
| Self-hosted coordination fit | [NetBird](https://github.com/netbirdio/netbird) | Combines peer networking and access controls with a self-hosting path. | Running the management infrastructure adds operational work. |
| Manual tunnel specialist | [WireGuard](https://github.com/WireGuard/wireguard-tools) | Supplies focused encrypted tunnels with explicit peer configuration. | Identity management, discovery and routing must be designed separately. |

## Replace reused passwords with a vault

Choose between a locally controlled database and a hosted synchronization and sharing workflow.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Local encrypted vault | [KeePassXC](https://github.com/keepassxreboot/keepassxc) | Keeps a cross-platform encrypted password database under the user’s control. | Sync, backups and recovery must be arranged deliberately. |
| Hosted sharing fit | [Bitwarden](https://bitwarden.com/) | Offers cross-platform vault access and a free entry tier with optional paid sharing features. | Advanced account and organization features vary by plan. |
| Premium shared-vault fit | [1Password](https://1password.com/) | Provides integrated desktop and browser workflows for family and team vaults. | Requires an ongoing subscription and account recovery planning. |

## Encrypt files before storing or sharing them

Select a file vault, mounted container, or command-line envelope according to how applications access the data.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Cloud-folder fit | [Cryptomator](https://cryptomator.org/) | Encrypts files individually before a supported sync client uploads the vault. | Cloud synchronization conflicts and separate mobile terms still matter. |
| Mounted-container fit | [VeraCrypt](https://veracrypt.io/) | Lets desktop applications use a mounted encrypted volume. | Container synchronization and recovery planning need care. |
| Scripted-file fit | [age](https://age-encryption.org/) | Encrypts file streams for explicit recipients or a passphrase. | Secret keys and recipients are managed outside a graphical vault. |

## Run another operating system in a virtual machine

Match host architecture, desired guest, and setup complexity.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| General desktop lab | [VirtualBox](https://www.virtualbox.org/) | Provides a cross-platform graphical VM workflow with snapshots and virtual networks. | Guest architecture support and Extension Pack licensing must be checked. |
| Mac emulation fit | [UTM](https://mac.getutm.app/) | Provides a Mac interface to virtualization and architecture emulation. | Acceleration depends on backend and host/guest architecture. |
| Ubuntu CLI fit | [Multipass](https://multipass.run/) | Launches Ubuntu virtual machines with optional cloud-init configuration. | Focused on Ubuntu rather than arbitrary guest operating systems. |
| Simple Linux desktop fit | [GNOME Boxes](https://apps.gnome.org/Boxes/) | Offers a streamlined GNOME workflow to download and create desktop guests. | Advanced hypervisor controls are less exposed than in virt-manager. |

## Inspect hardware before changing settings

Separate component identification, disk health indicators, and stress testing.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Windows sensor fit | [HWiNFO](https://www.hwinfo.com/) | Combines detailed hardware inventory with sensor monitoring and logging. | Sensor availability is hardware-specific and commercial use has separate terms. |
| Linux report fit | [Hardinfo2](https://hardinfo2.org/) | Generates hardware and software information reports with optional benchmark tasks. | Synthetic benchmark results need workload context. |
| Storage-health specialist | [smartmontools](https://www.smartmontools.org/) | Reads supported drive health data and self-test logs through smartctl and smartd. | Controllers can hide data, and a passing health check does not guarantee future reliability. |
| Bootable RAM specialist | [Memtest86+](https://memtest.org/) | Exercises supported system memory outside the installed OS. | Requires boot media and cannot rule out every intermittent hardware problem. |

## Investigate a slow or unstable network

Measure the path, controlled throughput, and per-process usage separately.

| Fit | Tool | Why choose it | Tradeoff |
| --- | --- | --- | --- |
| Interactive path fit | [Trippy](https://trippy.rs/) | Shows route-level latency and probe statistics in a terminal. | Intermediate routers can rate-limit replies without dropping application traffic. |
| Controlled throughput fit | [iperf3](https://software.es.net/iperf/) | Measures a configured client/server network workload. | Needs a test process at both endpoints and is not a speed test of every application. |
| Windows per-app control | [NetLimiter](https://www.netlimiter.com/) | Tracks per-application traffic and allows bandwidth rules. | Commercial licensing applies and rules can affect application behavior. |
| Linux per-process view | [NetHogs](https://github.com/raboof/nethogs) | Groups live bandwidth by the responsible process. | Needs capture privileges and is not a long-term accounting database. |
