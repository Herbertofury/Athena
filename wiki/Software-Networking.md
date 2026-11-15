# Networks & remote access

Connect machines, inspect traffic and work remotely.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=networking) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

49 applications. Reviewed 2026-11-14; individual records identify inherited research.

## Bandwidth limits and prioritization

### NetLimiter

Windows application for per-program traffic monitoring, limits and network rules.

- **Platforms:** Windows. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** Useful when particular Windows applications need controlled bandwidth allocation.
- **Compare when:** Traffic-control rules can affect application connectivity
- **Strengths:** Useful when particular Windows applications need controlled bandwidth allocation.
- **Limitations:** Traffic-control rules can affect application connectivity; Commercial licensing and supported versions need review.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.netlimiter.com/) · [Official installation / downloads](https://www.netlimiter.com/download)
- **Sources:** [Official project documentation](https://www.netlimiter.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.netlimiter.com/download) (2026-11-14; downloads)

## BitTorrent clients

### Deluge

BitTorrent client with a daemon architecture, graphical and web interfaces, and plugins.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0 with OpenSSL exception. **Pricing model:** free.
- **Pick for:** Separate a torrent daemon from its interactive management interface.
- **Compare when:** Packaging and plugin support vary across operating systems.
- **Strengths:** Its client-daemon design supports managing transfers from a separate interface.
- **Limitations:** Packaging and plugin support vary across operating systems.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-03-07. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/deluge-torrent/deluge))
- [Official project](https://deluge-torrent.org/) · [Official installation / downloads](https://dev.deluge-torrent.org/wiki/Download) · [Repository](https://github.com/deluge-torrent/deluge)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/deluge-torrent/deluge) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/deluge-torrent/deluge/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official license text](https://raw.githubusercontent.com/deluge-torrent/deluge/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://deluge-torrent.org/) (2026-11-14; identity, features); [Official platforms download documentation](https://dev.deluge-torrent.org/wiki/Download) (2026-11-14; identity, features, platforms, downloads)
### qBittorrent

BitTorrent client with a desktop interface, web interface, search plugins, and transfer controls.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0-or-later source / GPL-3.0-or-later binaries; OpenSSL exception. **Pricing model:** free.
- **Pick for:** Manage authorized torrent downloads without an advertising-funded client.
- **Compare when:** Search plugins and remotely exposed web access need separate trust and configuration checks.
- **Strengths:** Desktop controls and optional web management cover both local and remote transfer workflows.
- **Limitations:** Search plugins and remotely exposed web access need separate trust and configuration checks.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/qbittorrent/qBittorrent))
- [Official project](https://www.qbittorrent.org/) · [Official installation / downloads](https://github.com/qbittorrent/qBittorrent/releases) · [Repository](https://github.com/qbittorrent/qBittorrent)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/qbittorrent/qBittorrent) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/qbittorrent/qBittorrent/HEAD/README.md) (2026-11-14; identity, features); [Official license text](https://raw.githubusercontent.com/qbittorrent/qBittorrent/HEAD/COPYING) (2026-11-14; license); [Official official documentation](https://www.qbittorrent.org/) (2026-11-14; identity, features); [Official release inspected: release-5.3.0](https://github.com/qbittorrent/qBittorrent/releases/tag/release-5.3.0) (2026-11-14; downloads, maintenance, platforms)
### Transmission

BitTorrent client offering native interfaces and a daemon with remote management.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 or GPL-3.0, with OpenSSL permission and separately licensed files. **Pricing model:** free.
- **Pick for:** Use a focused torrent client or a separately managed download daemon.
- **Compare when:** Feature availability varies between interfaces and packaged versions.
- **Strengths:** Native clients and a daemon allow either a simple desktop or separated download setup.
- **Limitations:** Feature availability varies between interfaces and packaged versions.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/transmission/transmission))
- [Official project](https://transmissionbt.com/) · [Official installation / downloads](https://github.com/transmission/transmission/releases) · [Repository](https://github.com/transmission/transmission)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/transmission/transmission) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/transmission/transmission/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/transmission/transmission/HEAD/COPYING) (2026-11-14; license); [Official official documentation](https://transmissionbt.com/) (2026-11-14; identity, features); [Official release inspected: 4.1.4](https://github.com/transmission/transmission/releases/tag/4.1.4) (2026-11-14; downloads, maintenance, platforms)

## Download managers

### aria2

Command-line download utility supporting HTTP, FTP, BitTorrent, Metalink, and segmented transfers.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Automate resumable downloads using a scriptable transfer engine.
- **Compare when:** Remote-control interfaces need explicit secure configuration.
- **Strengths:** Protocol support and an RPC interface make transfers easy to integrate into other tools.
- **Limitations:** Remote-control interfaces need explicit secure configuration.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-06-25. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/aria2/aria2))
- [Official project](https://aria2.github.io/) · [Official installation / downloads](https://github.com/aria2/aria2/releases) · [Repository](https://github.com/aria2/aria2)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/aria2/aria2) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/aria2/aria2/HEAD/README.rst) (2026-11-14; identity, features); [Official official documentation](https://aria2.github.io/) (2026-11-14; identity, features); [Official release inspected: release-1.37.0](https://github.com/aria2/aria2/releases/tag/release-1.37.0) (2026-11-14; downloads, maintenance, platforms)
### Motrix

Desktop download manager using aria2 with HTTP, FTP, BitTorrent, and magnet support.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for application code; bundled components have separate notices. **Pricing model:** free.
- **Pick for:** Manage a visible queue of resumable downloads on a desktop.
- **Compare when:** Site-specific authentication and download restrictions can require another tool.
- **Strengths:** An aria2-based engine is exposed through a desktop queue with transfer management.
- **Limitations:** Site-specific authentication and download restrictions can require another tool.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/agalwood/Motrix))
- [Official project](https://motrix.app/) · [Official installation / downloads](https://github.com/agalwood/Motrix/releases) · [Repository](https://github.com/agalwood/Motrix)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/agalwood/Motrix) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/agalwood/Motrix/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/agalwood/Motrix/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://motrix.app/) (2026-11-14; identity, features); [Official release inspected: v2.4.1](https://github.com/agalwood/Motrix/releases/tag/v2.4.1) (2026-11-14; downloads, maintenance, platforms)

## Remote file transfer

### Cyberduck

Desktop client for remote file transfers and supported cloud object storage.

- **Platforms:** Windows, macOS. **License:** GPL-3.0; distribution purchase and donation options. **Pricing model:** mixed.
- **Pick for:** Useful when desktop file transfers span both servers and cloud storage.
- **Compare when:** Storage services may incur separate charges
- **Strengths:** Useful when desktop file transfers span both servers and cloud storage.
- **Limitations:** Storage services may incur separate charges; Some integration behavior depends on the backend.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-05. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/iterate-ch/cyberduck/releases.atom))
- [Official project](https://cyberduck.io/) · [Official installation / downloads](https://cyberduck.io/download/) · [Repository](https://github.com/iterate-ch/cyberduck)
- **Sources:** [Official project documentation](https://cyberduck.io/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/iterate-ch/cyberduck) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://cyberduck.io/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/iterate-ch/cyberduck/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/iterate-ch/cyberduck/releases.atom) (2026-11-14; maintenance)
### FileZilla Client

Graphical FTP, FTPS and SFTP client for managing remote files.

- **Platforms:** Windows, macOS, Linux. **License:** License text was not readable in this retrieval; verify the official Client license before redistribution. **Pricing model:** free.
- **Pick for:** Cross-platform remote-file transfers with an inspectable queue.
- **Compare when:** FTP without TLS does not encrypt traffic
- **Strengths:** Cross-platform remote-file transfers with an inspectable queue.
- **Limitations:** FTP without TLS does not encrypt traffic; Check the exact installer and distinguish Client from Server and Pro.; The official license endpoint returned JavaScript-obfuscated content; the exact grant is left unverified.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://filezilla-project.org/) · [Official installation / downloads](https://filezilla-project.org/download.php?type=client)
- **Sources:** [Official comparison of free Client and Pro](https://filezillapro.com/filezilla-pro/) (2026-11-14; identity, features, pricing); [Official Client and Pro transfer-queue guide](https://filezillapro.com/docs/v3/getting-started/what-is-the-transfer-queue/) (2026-11-14; features); [Official Client download landing; scripted body not inspected](https://filezilla-project.org/download.php?type=client) (2026-11-14; downloads)
### rclone

Multi-provider cloud transfer and mount tooling

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** unknown.
- **Pick for:** Multi-provider cloud transfer and mount tooling
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Multi-provider cloud transfer and mount tooling
- **Limitations:** sync may delete destination files; cloud grants and storage charges require separate authorization; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/rclone/rclone) · [Official installation / downloads](https://rclone.org/downloads/) · [Repository](https://github.com/rclone/rclone)
- **Sources:** [Official rclone repository and free-software license declaration](https://github.com/rclone/rclone) (2026-11-14; features, identity, license); [Official rclone downloads and OS requirements](https://rclone.org/downloads/) (2026-11-14; downloads, features, identity, platforms)
### WinSCP

SFTP, SCP, WebDAV and S3 plus automation

- **Platforms:** Windows. **License:** GPL-3.0-or-later; installer/icons have separate terms. **Pricing model:** unknown.
- **Pick for:** SFTP, SCP, WebDAV and S3 plus automation
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** SFTP, SCP, WebDAV and S3 plus automation
- **Limitations:** Verify remote host identity; prefer encrypted transports; never expose stored credentials; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://winscp.net/eng/docs/introduction)
- **Sources:** [Preserved original research source](https://winscp.net/eng/docs/introduction) (2026-11-14; identity, features); [Preserved original research source](https://winscp.net/eng/docs/license) (2026-11-14; identity, features)

## Local network file sharing

### LocalSend

Local network file transfer

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Local network file transfer
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Local network file transfer
- **Limitations:** Verify intended receiver; do not disable encryption or firewall as a generic optimization; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/localsend/localsend) · [Official installation / downloads](https://localsend.org/download) · [Repository](https://github.com/localsend/localsend)
- **Sources:** [Official repository and OS prerequisites](https://github.com/localsend/localsend) (2026-11-14; features, identity, platforms); [Official platform and free-of-charge FAQ](https://localsend.org/) (2026-11-14; platforms, pricing); [Official LocalSend downloads](https://localsend.org/download) (2026-11-14; downloads, platforms)

## Media downloading

### Streamlink

Command-line utility extracting supported streams and sending them to an external media player.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-2-Clause. **Pricing model:** free.
- **Pick for:** Play an authorized supported stream in a desktop media player.
- **Compare when:** Supported-service changes can break playback and authentication flows.
- **Strengths:** Sending streams to a chosen player separates playback from a service's web interface.
- **Limitations:** Supported-service changes can break playback and authentication flows.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/streamlink/streamlink))
- [Official project](https://streamlink.github.io/) · [Official installation / downloads](https://github.com/streamlink/streamlink/releases) · [Repository](https://github.com/streamlink/streamlink)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/streamlink/streamlink) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/streamlink/streamlink/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://streamlink.github.io/) (2026-11-14; identity, features); [Official release inspected: 8.6.3](https://github.com/streamlink/streamlink/releases/tag/8.6.3) (2026-11-14; downloads, maintenance)
### yt-dlp

Command-line media downloader with site extractors, format selection, and post-processing integration.

- **Platforms:** Windows, macOS, Linux. **License:** Unlicense. **Pricing model:** free.
- **Pick for:** Download permitted media in selected formats for personal workflows.
- **Compare when:** Site changes can break extractors, and downloading remains subject to access rights and terms.
- **Strengths:** Explicit format selection and post-processing fit repeatable permitted-media workflows.
- **Limitations:** Site changes can break extractors, and downloading remains subject to access rights and terms.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/yt-dlp/yt-dlp))
- [Official project](https://github.com/yt-dlp/yt-dlp) · [Official installation / downloads](https://github.com/yt-dlp/yt-dlp/releases) · [Repository](https://github.com/yt-dlp/yt-dlp)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/yt-dlp/yt-dlp) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/yt-dlp/yt-dlp/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official release inspected: 2026.10.26](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.10.26) (2026-11-14; downloads, maintenance, platforms)

## Private mesh networks

### NetBird

WireGuard-based private networking platform with hosted and self-hosted control-plane options.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause client; management components include AGPL-3.0 terms. **Pricing model:** freemium.
- **Pick for:** Good comparison candidate when self-hosted device coordination is a requirement.
- **Compare when:** Operating the self-hosted components adds administrative work
- **Strengths:** Good comparison candidate when self-hosted device coordination is a requirement.
- **Limitations:** Operating the self-hosted components adds administrative work; Hosted pricing and included features can change.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/netbirdio/netbird/releases.atom))
- [Official project](https://github.com/netbirdio/netbird) · [Official installation / downloads](https://github.com/netbirdio/netbird/releases) · [Repository](https://github.com/netbirdio/netbird)
- **Sources:** [Official project documentation](https://github.com/netbirdio/netbird) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/netbirdio/netbird/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/netbirdio/netbird/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/netbirdio/netbird/releases.atom) (2026-11-14; maintenance)
### Tailscale

Managed mesh networking service using WireGuard connections and identity-based device access.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause core client; hosted service and some clients have separate terms. **Pricing model:** freemium.
- **Pick for:** Convenient for connecting personal devices with less manual peer configuration.
- **Compare when:** Hosted coordination and account policies are part of the service
- **Strengths:** Convenient for connecting personal devices with less manual peer configuration.
- **Limitations:** Hosted coordination and account policies are part of the service; Plan limits and advanced controls differ by tier.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-12. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/tailscale/tailscale/releases.atom))
- [Official project](https://tailscale.com/) · [Official installation / downloads](https://tailscale.com/download) · [Repository](https://github.com/tailscale/tailscale)
- **Sources:** [Official project documentation](https://tailscale.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/tailscale/tailscale) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://tailscale.com/download) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/tailscale/tailscale/HEAD/LICENSE) (2026-11-14; license); [Official service plans](https://tailscale.com/pricing) (2026-11-14; pricing); [Official release activity](https://github.com/tailscale/tailscale/releases.atom) (2026-11-14; maintenance)
### ZeroTier

Software-defined networking platform connecting devices through virtual networks.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 core plus nonfree source-available components; hosted service terms. **Pricing model:** freemium.
- **Pick for:** Useful when a virtual network model fits remote PCs and homelab devices.
- **Compare when:** Controller/service terms and plan limits differ
- **Strengths:** Useful when a virtual network model fits remote PCs and homelab devices.
- **Limitations:** Controller/service terms and plan limits differ; Source availability should not be treated as an unrestricted open-source license.
- **Maintenance:** active — Official release feed contains activity dated 2026-05-28. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/zerotier/ZeroTierOne/releases.atom))
- [Official project](https://www.zerotier.com/) · [Official installation / downloads](https://www.zerotier.com/download/) · [Repository](https://github.com/zerotier/ZeroTierOne)
- **Sources:** [Official project documentation](https://www.zerotier.com/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/zerotier/ZeroTierOne) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.zerotier.com/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/zerotier/ZeroTierOne/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/zerotier/ZeroTierOne/releases.atom) (2026-11-14; maintenance)

## Network discovery and diagnostics

### Angry IP Scanner

Graphical IP and port scanner for discovering hosts on authorized networks.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Accessible GUI for quickly surveying a managed subnet.
- **Compare when:** Reachability probes are not a vulnerability assessment
- **Strengths:** Accessible GUI for quickly surveying a managed subnet.
- **Limitations:** Reachability probes are not a vulnerability assessment; Only scan networks you are authorized to test.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-02. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/angryip/ipscan/releases.atom))
- [Official project](https://angryip.org/) · [Official installation / downloads](https://angryip.org/download/) · [Repository](https://github.com/angryip/ipscan)
- **Sources:** [Official project documentation](https://angryip.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/angryip/ipscan) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://angryip.org/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/angryip/ipscan/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/angryip/ipscan/releases.atom) (2026-11-14; maintenance)
### iperf3

Client/server network throughput measurement tool maintained by ESnet.

- **Platforms:** Linux, macOS. **License:** BSD-3-Clause. **Pricing model:** free.
- **Pick for:** Useful for measuring a controlled network path between two endpoints.
- **Compare when:** Both endpoints need compatible test processes
- **Strengths:** Useful for measuring a controlled network path between two endpoints.
- **Limitations:** Both endpoints need compatible test processes; Windows is not an officially supported primary platform.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-29. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/esnet/iperf/releases.atom))
- [Official project](https://software.es.net/iperf/) · [Official installation / downloads](https://software.es.net/iperf/obtaining.html) · [Repository](https://github.com/esnet/iperf)
- **Sources:** [Official project documentation](https://software.es.net/iperf/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/esnet/iperf) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://software.es.net/iperf/obtaining.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/esnet/iperf/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/esnet/iperf/releases.atom) (2026-11-14; maintenance)
### MTR

Network diagnostic tool combining traceroute paths with repeated latency and packet-loss measurements.

- **Platforms:** Linux, macOS. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for examining where a network path may be behaving differently over time.
- **Compare when:** Routers may rate-limit diagnostic replies without dropping forwarded traffic
- **Strengths:** Useful for examining where a network path may be behaving differently over time.
- **Limitations:** Routers may rate-limit diagnostic replies without dropping forwarded traffic; Interpret intermediate-hop loss alongside destination behavior.
- **Maintenance:** active — Official release feed contains activity dated 2025-07-06. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/traviscross/mtr/releases.atom))
- [Official project](https://github.com/traviscross/mtr) · [Official installation / downloads](https://github.com/traviscross/mtr) · [Repository](https://github.com/traviscross/mtr)
- **Sources:** [Official project documentation](https://github.com/traviscross/mtr) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/traviscross/mtr/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/traviscross/mtr/releases.atom) (2026-11-14; maintenance)
### Nmap

Network discovery and security auditing suite with host and service detection.

- **Platforms:** Windows, macOS, Linux. **License:** Nmap Public Source License; Npcap licensing separate. **Pricing model:** mixed.
- **Pick for:** Useful for inventorying and diagnosing networks you administer.
- **Compare when:** License and Npcap redistribution terms require review
- **Strengths:** Useful for inventorying and diagnosing networks you administer.
- **Limitations:** License and Npcap redistribution terms require review; Active probes should be limited to systems you are authorized to assess.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-12. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/nmap/nmap/releases.atom))
- [Official project](https://nmap.org/) · [Official installation / downloads](https://nmap.org/download.html) · [Repository](https://github.com/nmap/nmap)
- **Sources:** [Official project documentation](https://nmap.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/nmap/nmap) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://nmap.org/download.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/nmap/nmap/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/nmap/nmap/releases.atom) (2026-11-14; maintenance)
### PingPlotter

Graphical path monitoring tool for recording latency and packet-loss history.

- **Platforms:** Windows, macOS. **License:** Proprietary commercial license. **Pricing model:** mixed.
- **Pick for:** Useful for collecting time-series network symptoms to discuss with an administrator or ISP.
- **Compare when:** Edition and subscription terms differ
- **Strengths:** Useful for collecting time-series network symptoms to discuss with an administrator or ISP.
- **Limitations:** Edition and subscription terms differ; Intermediate routers can deprioritize probes without causing end-to-end loss.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.pingplotter.com/) · [Official installation / downloads](https://www.pingplotter.com/download/)
- **Sources:** [Official project documentation](https://www.pingplotter.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.pingplotter.com/download/) (2026-11-14; downloads)
### Trippy

Interactive network diagnostic tool combining traceroute and ping-style statistics.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** A terminal choice for exploring route behavior with richer interactive detail.
- **Compare when:** Raw network probing may require privileges
- **Strengths:** A terminal choice for exploring route behavior with richer interactive detail.
- **Limitations:** Raw network probing may require privileges; Probe responses are not the same as application performance.
- **Maintenance:** unverified — Official release feed contains activity dated 2025-05-05. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/fujiapple852/trippy/releases.atom))
- [Official project](https://trippy.rs/) · [Official installation / downloads](https://trippy.rs/start/installation/) · [Repository](https://github.com/fujiapple852/trippy)
- **Sources:** [Official project documentation](https://trippy.rs/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/fujiapple852/trippy) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://trippy.rs/start/installation/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/fujiapple852/trippy/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/fujiapple852/trippy/releases.atom) (2026-11-14; maintenance)

## Packet capture analysis

### Termshark

Terminal interface to tshark for inspecting packet captures with Wireshark-style navigation.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Inspect packet captures over SSH without a graphical desktop.
- **Compare when:** Requires tshark and its capture permissions or an existing capture file.
- **Strengths:** Packet captures can be explored interactively in a remote terminal session.
- **Limitations:** Requires tshark and its capture permissions or an existing capture file.; Repository activity is older than one year; current maintenance has not been established.
- **Maintenance:** unverified — Repository not archived; latest repository push observed 2024-04-30. Activity is not a runtime, security, or support guarantee. No push within the preceding year was observed; current support status needs reassessment. ([evidence](https://api.github.com/repos/gcla/termshark))
- [Official project](https://termshark.io/) · [Official installation / downloads](https://github.com/gcla/termshark/releases) · [Repository](https://github.com/gcla/termshark)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/gcla/termshark) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/gcla/termshark/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://termshark.io/) (2026-11-14; identity, features); [Official release inspected: v2.4.0](https://github.com/gcla/termshark/releases/tag/v2.4.0) (2026-11-14; downloads, maintenance, platforms)
### Wireshark

Packet analysis, filters and protocol dissectors

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** GPLv2 Wireshark; Npcap separately licensed. **Pricing model:** free.
- **Pick for:** Packet analysis, filters and protocol dissectors
- **Compare when:** Offline synthetic PCAP: expected protocols, redaction, export roundtrip and resource use
- **Strengths:** Packet analysis, filters and protocol dissectors
- **Limitations:** Captures may contain credentials/personal data; capture only authorized traffic; driver needs review; Copyleft dissector reuse requires license review; Npcap is not covered by Wireshark GPL
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://gitlab.com/wireshark/wireshark) · [Official installation / downloads](https://www.wireshark.org/download.html) · [Repository](https://gitlab.com/wireshark/wireshark)
- **Sources:** [Preserved original research source](https://gitlab.com/wireshark/wireshark) (2026-11-14; identity, features); [Official Wireshark downloads and capture-driver note](https://www.wireshark.org/download.html) (2026-11-14; downloads, features, identity, platforms); [Preserved original research source](https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html) (2026-11-14; identity, features); [Official platforms and no-license-fee FAQ](https://www.wireshark.org/) (2026-11-14; platforms, pricing); [Official platform requirements including FreeBSD](https://www.wireshark.org/docs/wsug_html_chunked/ChIntroPlatforms.html) (2026-11-14; platforms)

## Remote desktop

### AnyDesk

Commercial remote access application with desktop support and file-transfer workflows.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary; personal and commercial terms differ. **Pricing model:** freemium.
- **Pick for:** Useful for users seeking a commercial remote-support workflow across desktop systems.
- **Compare when:** Business use requires the appropriate paid license
- **Strengths:** Useful for users seeking a commercial remote-support workflow across desktop systems.
- **Limitations:** Business use requires the appropriate paid license; Unattended access settings need deliberate review.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://anydesk.com/) · [Official installation / downloads](https://anydesk.com/en/downloads)
- **Sources:** [Official project documentation](https://anydesk.com/) (2026-11-14; identity, features, pricing); [Official AnyDesk downloads](https://anydesk.com/en/downloads) (2026-11-14; platforms, downloads)
### Apache Guacamole

Browser-based remote desktop gateway supporting RDP, VNC and SSH.

- **Platforms:** Web, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful when users need remote access through a browser without installing a local client.
- **Compare when:** Requires a deployed gateway and reachable target services
- **Strengths:** Useful when users need remote access through a browser without installing a local client.
- **Limitations:** Requires a deployed gateway and reachable target services; Gateway capacity and authentication need administration.
- **Maintenance:** active — Official release feed contains activity dated 2025-06-23. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/apache/guacamole-client/releases.atom))
- [Official project](https://guacamole.apache.org/) · [Official installation / downloads](https://guacamole.apache.org/releases/) · [Repository](https://github.com/apache/guacamole-client)
- **Sources:** [Official project documentation](https://guacamole.apache.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/apache/guacamole-client) (2026-11-14; identity, features); [Official download or installation landing page](https://guacamole.apache.org/releases/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/apache/guacamole-client/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/apache/guacamole-client/releases.atom) (2026-11-14; maintenance)
### FreeRDP

Open-source implementation and clients for the Remote Desktop Protocol.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for scripting RDP sessions or integrating RDP functionality.
- **Compare when:** Feature support depends on build configuration and server
- **Strengths:** Useful for scripting RDP sessions or integrating RDP functionality.
- **Limitations:** Feature support depends on build configuration and server; A library or CLI build may be less convenient than a desktop frontend.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-10. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/FreeRDP/FreeRDP/releases.atom))
- [Official project](https://www.freerdp.com/) · [Official installation / downloads](https://github.com/FreeRDP/FreeRDP/wiki/PreBuilds) · [Repository](https://github.com/FreeRDP/FreeRDP)
- **Sources:** [Official project documentation](https://www.freerdp.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/FreeRDP/FreeRDP) (2026-11-14; identity, features); [Official download or installation landing page](https://github.com/FreeRDP/FreeRDP/wiki/PreBuilds) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/FreeRDP/FreeRDP/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/FreeRDP/FreeRDP/releases.atom) (2026-11-14; maintenance)
### NoMachine

Remote desktop software with multimedia-oriented desktop access and commercial deployment options.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary commercial subscription; free Player client is separate. **Pricing model:** subscription.
- **Pick for:** A comparison candidate for interactive desktop sessions with audio and graphics.
- **Compare when:** NoMachine 10 discontinued the free personal server edition; Personal Edition now requires a subscription or evaluation license.
- **Strengths:** A comparison candidate for interactive desktop sessions with audio and graphics.
- **Limitations:** NoMachine 10 discontinued the free personal server edition; Personal Edition now requires a subscription or evaluation license.; Direct connectivity and host permissions still need setup.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.nomachine.com/) · [Official installation / downloads](https://download.nomachine.com/)
- **Sources:** [Official project documentation](https://www.nomachine.com/) (2026-11-14; identity, features, pricing); [Official NoMachine installation and licensing guide](https://www.nomachine.com/support/documents/getting-started-with-nomachine) (2026-11-14; features, platforms, license, pricing); [Official NoMachine downloads](https://download.nomachine.com/) (2026-11-14; downloads, platforms, pricing)
### Remmina

Linux remote desktop client supporting RDP, VNC, SSH and plugins.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Pick for:** A practical Linux desktop hub for multiple remote connection protocols.
- **Compare when:** Protocol features depend on installed plugins
- **Strengths:** A practical Linux desktop hub for multiple remote connection protocols.
- **Limitations:** Protocol features depend on installed plugins; It is a client and still requires a remote server.
- **Maintenance:** active — Official release feed contains activity dated 2025-08-11. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/FreeRDP/Remmina/releases.atom))
- [Official project](https://remmina.org/) · [Official installation / downloads](https://remmina.org/how-to-install-remmina/) · [Repository](https://github.com/FreeRDP/Remmina)
- **Sources:** [Official project documentation](https://remmina.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/FreeRDP/Remmina) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://remmina.org/how-to-install-remmina/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/FreeRDP/Remmina/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/FreeRDP/Remmina/releases.atom) (2026-11-14; maintenance)
### RustDesk

Remote desktop application supporting public infrastructure or a self-hosted server.

- **Platforms:** Windows, macOS, Linux. **License:** AGPL-3.0 client; separate server Pro licensing. **Pricing model:** freemium.
- **Pick for:** Useful when controlling remote PCs with the option to operate your own coordination servers.
- **Compare when:** Unattended access needs careful authentication and permissions
- **Strengths:** Useful when controlling remote PCs with the option to operate your own coordination servers.
- **Limitations:** Unattended access needs careful authentication and permissions; Open-source server and paid Server Pro capabilities differ.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-11. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/rustdesk/rustdesk/releases.atom))
- [Official project](https://rustdesk.com/) · [Official installation / downloads](https://rustdesk.com/download) · [Repository](https://github.com/rustdesk/rustdesk)
- **Sources:** [Official project documentation](https://rustdesk.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/rustdesk/rustdesk) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://rustdesk.com/download) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/rustdesk/rustdesk/HEAD/LICENCE) (2026-11-14; license); [Official release activity](https://github.com/rustdesk/rustdesk/releases.atom) (2026-11-14; maintenance)
### TeamViewer Remote

Remote support and access software for desktop devices.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary; personal and commercial terms differ. **Pricing model:** freemium.
- **Pick for:** Useful when a support recipient already uses the TeamViewer ecosystem.
- **Compare when:** Commercial use requires paid licensing
- **Strengths:** Useful when a support recipient already uses the TeamViewer ecosystem.
- **Limitations:** Commercial use requires paid licensing; Features and device limits depend on plan and platform.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.teamviewer.com/) · [Official installation / downloads](https://www.teamviewer.com/en/download/)
- **Sources:** [Official project documentation](https://www.teamviewer.com/) (2026-11-14; identity, features, pricing); [Official TeamViewer downloads](https://www.teamviewer.com/en/download/) (2026-11-14; platforms, downloads)
### TigerVNC

VNC client and server implementation for remote graphical desktop access.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Useful for interoperable VNC access to remote graphical sessions.
- **Compare when:** Server availability and session behavior differ by OS
- **Strengths:** Useful for interoperable VNC access to remote graphical sessions.
- **Limitations:** Server availability and session behavior differ by OS; Configure secure authentication and transport before exposing access.
- **Maintenance:** active — Official release feed contains activity dated 2026-03-26. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/TigerVNC/tigervnc/releases.atom))
- [Official project](https://tigervnc.org/) · [Official installation / downloads](https://tigervnc.org/) · [Repository](https://github.com/TigerVNC/tigervnc)
- **Sources:** [Official project documentation](https://tigervnc.org/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/TigerVNC/tigervnc) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/TigerVNC/tigervnc/HEAD/LICENCE.TXT) (2026-11-14; license); [Official release activity](https://github.com/TigerVNC/tigervnc/releases.atom) (2026-11-14; maintenance)
### xrdp

RDP server for Unix-like systems that allows compatible clients to open graphical sessions.

- **Platforms:** Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for accessing a Linux desktop through an existing RDP client.
- **Compare when:** Desktop environment and display-server integration require configuration
- **Strengths:** Useful for accessing a Linux desktop through an existing RDP client.
- **Limitations:** Desktop environment and display-server integration require configuration; Not a complete desktop environment by itself.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-07. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/neutrinolabs/xrdp/releases.atom))
- [Official project](https://www.xrdp.org/) · [Official installation / downloads](https://github.com/neutrinolabs/xrdp) · [Repository](https://github.com/neutrinolabs/xrdp)
- **Sources:** [Official project documentation](https://www.xrdp.org/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/neutrinolabs/xrdp) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/neutrinolabs/xrdp/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/neutrinolabs/xrdp/releases.atom) (2026-11-14; maintenance)

## Mounted remote storage

### Mountain Duck

Desktop tool that mounts supported remote storage as a local filesystem view.

- **Platforms:** Windows, macOS. **License:** Proprietary commercial license. **Pricing model:** paid.
- **Pick for:** Useful when applications need a filesystem-like view of remote storage.
- **Compare when:** Network latency and remote consistency still apply
- **Strengths:** Useful when applications need a filesystem-like view of remote storage.
- **Limitations:** Network latency and remote consistency still apply; Software and cloud-storage charges are separate.
- **Maintenance:** active — Official download page lists version 5.4.0 dated 2026-11-05 for Windows and macOS. Installed behavior was not tested. ([evidence](https://mountainduck.io/))
- [Official project](https://mountainduck.io/) · [Official installation / downloads](https://mountainduck.io/)
- **Sources:** [Official project documentation](https://mountainduck.io/) (2026-11-14; identity, features, platforms, pricing, downloads, maintenance)

## Remote management

### MeshCentral

Self-hosted device management platform with browser-based remote desktop, terminal and file access.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for managing several personally administered computers from a self-hosted console.
- **Compare when:** Server hardening, access control and updates are operator responsibilities
- **Strengths:** Useful for managing several personally administered computers from a self-hosted console.
- **Limitations:** Server hardening, access control and updates are operator responsibilities; Feature support varies by agent platform.
- **Maintenance:** active — Official release feed contains activity dated 2026-10-23. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/Ylianst/MeshCentral/releases.atom))
- [Official project](https://github.com/Ylianst/MeshCentral) · [Official installation / downloads](https://github.com/Ylianst/MeshCentral#installation) · [Repository](https://github.com/Ylianst/MeshCentral)
- **Sources:** [Official project documentation](https://github.com/Ylianst/MeshCentral) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/Ylianst/MeshCentral#installation) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/Ylianst/MeshCentral/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/Ylianst/MeshCentral/releases.atom) (2026-11-14; maintenance)

## SSH clients and servers

### MobaXterm

Windows remote-work toolbox combining terminal sessions, SFTP browsing and an X server.

- **Platforms:** Windows. **License:** Proprietary; free Home and paid Professional editions. **Pricing model:** freemium.
- **Pick for:** Convenient Windows interface for several remote administration workflows.
- **Compare when:** Home and Professional feature and usage terms differ
- **Strengths:** Convenient Windows interface for several remote administration workflows.
- **Limitations:** Home and Professional feature and usage terms differ; Bundled tools do not replace server-side security configuration.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://mobaxterm.mobatek.net/) · [Official installation / downloads](https://mobaxterm.mobatek.net/download.html)
- **Sources:** [Official project documentation](https://mobaxterm.mobatek.net/) (2026-11-14; identity, features, platforms, license, pricing); [Official download or installation landing page](https://mobaxterm.mobatek.net/download.html) (2026-11-14; downloads)
### OpenSSH

SSH suite providing encrypted remote login, file transfer and forwarding.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-style licenses; component notices apply. **Pricing model:** free.
- **Pick for:** Standard building block for encrypted administration and scripted transfers.
- **Compare when:** Windows distribution and Unix portable builds have different installation paths
- **Strengths:** Standard building block for encrypted administration and scripted transfers.
- **Limitations:** Windows distribution and Unix portable builds have different installation paths; Host-key verification and key protection remain essential.
- **Maintenance:** active — Official homepage lists OpenSSH 10.6 released on 2026-10-06. Installed behavior was not tested. ([evidence](https://www.openssh.com/))
- [Official project](https://www.openssh.com/) · [Official installation / downloads](https://www.openssh.com/portable.html)
- **Sources:** [Official project documentation](https://www.openssh.com/) (2026-11-14; identity, features, license, maintenance); [Official download or installation landing page](https://www.openssh.com/portable.html) (2026-11-14; downloads); [Microsoft OpenSSH for Windows overview](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh-overview) (2026-11-14; platforms, features)
### PuTTY

SSH terminal and transfer companions

- **Platforms:** Windows, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** SSH terminal and transfer companions
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** SSH terminal and transfer companions
- **Limitations:** SSH agent forwarding expands exposure; Telnet is not encrypted; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.chiark.greenend.org.uk/~sgtatham/putty/) · [Official installation / downloads](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
- **Sources:** [Preserved original research source](https://www.chiark.greenend.org.uk/~sgtatham/putty/) (2026-11-14; identity, features); [Preserved original research source](https://www.chiark.greenend.org.uk/~sgtatham/putty/licence.html) (2026-11-14; identity, features); [Official no-cost use and platform-port FAQ](https://www.chiark.greenend.org.uk/~sgtatham/putty/faq.html) (2026-11-14; platforms, pricing); [Official PuTTY stable downloads](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html) (2026-11-14; downloads, platforms)

## Traffic and connection monitoring

### bandwhich

Terminal bandwidth monitor organized by process, connection and remote address.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pick for:** Useful for finding which process is using network bandwidth on a Unix-like desktop.
- **Compare when:** Packet capture needs elevated access
- **Strengths:** Useful for finding which process is using network bandwidth on a Unix-like desktop.
- **Limitations:** Packet capture needs elevated access; Process attribution and interface behavior vary by platform.
- **Maintenance:** unverified — The project explicitly states passive maintenance: critical issues are addressed, with no new features planned. ([evidence](https://github.com/imsnif/bandwhich))
- [Official project](https://github.com/imsnif/bandwhich) · [Official installation / downloads](https://github.com/imsnif/bandwhich/releases) · [Repository](https://github.com/imsnif/bandwhich)
- **Sources:** [Official project documentation](https://github.com/imsnif/bandwhich) (2026-11-14; identity, features, platforms, maintenance); [Official download or installation landing page](https://github.com/imsnif/bandwhich/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/imsnif/bandwhich/HEAD/LICENSE.md) (2026-11-14; license)
### GlassWire

Windows network activity monitor with visual history and connection alerts.

- **Platforms:** Windows. **License:** Proprietary; free and paid plans. **Pricing model:** freemium.
- **Pick for:** Useful for understanding which Windows applications connect and how usage changes.
- **Compare when:** Plan limits and privacy settings differ
- **Strengths:** Useful for understanding which Windows applications connect and how usage changes.
- **Limitations:** Plan limits and privacy settings differ; Connection visibility alone does not establish whether traffic is malicious.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.glasswire.com/) · [Official installation / downloads](https://www.glasswire.com/download/)
- **Sources:** [Official project documentation](https://www.glasswire.com/) (2026-11-14; identity, features, pricing); [Official download or installation landing page](https://www.glasswire.com/download/) (2026-11-14; downloads)
### NetHogs

Linux network monitor that groups bandwidth consumption by process.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pick for:** Direct way to associate Linux traffic with the responsible process.
- **Compare when:** Requires sufficient packet-capture privileges
- **Strengths:** Direct way to associate Linux traffic with the responsible process.
- **Limitations:** Requires sufficient packet-capture privileges; Not a long-term traffic accounting database.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-22. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/raboof/nethogs/releases.atom))
- [Official project](https://github.com/raboof/nethogs) · [Official installation / downloads](https://github.com/raboof/nethogs) · [Repository](https://github.com/raboof/nethogs)
- **Sources:** [Official project documentation](https://github.com/raboof/nethogs) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/raboof/nethogs/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/raboof/nethogs/releases.atom) (2026-11-14; maintenance)
### TCPView

Lists TCP/UDP endpoints and owning processes.

- **Platforms:** Windows. **License:** Microsoft proprietary utility. **Pricing model:** unknown.
- **Pick for:** Lists TCP/UDP endpoints and owning processes.
- **Compare when:** Compare benign known-positive and known-negative fixtures, false positives, missing events and collection overhead in an isolated VM; no live malware.
- **Strengths:** Lists TCP/UDP endpoints and owning processes.
- **Limitations:** A connection is not proof of malware; closing connections is disruptive.; Endpoint/process correlation workflow inspiration only.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview)
- **Sources:** [Preserved original research source](https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview) (2026-11-14; identity, features)

## VPN clients and protocols

### OpenVPN Community

Open-source VPN software for client/server encrypted network access.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 with exceptions for Community software. **Pricing model:** free.
- **Pick for:** Useful for existing infrastructure that already uses OpenVPN profiles and servers.
- **Compare when:** Community software and commercial OpenVPN services differ
- **Strengths:** Useful for existing infrastructure that already uses OpenVPN profiles and servers.
- **Limitations:** Community software and commercial OpenVPN services differ; Server setup, certificate lifecycle and routing need administration.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-06. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/OpenVPN/openvpn/releases.atom))
- [Official project](https://github.com/OpenVPN/openvpn) · [Official installation / downloads](https://github.com/OpenVPN/openvpn/releases) · [Repository](https://github.com/OpenVPN/openvpn)
- **Sources:** [Official project documentation](https://github.com/OpenVPN/openvpn) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/OpenVPN/openvpn/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/OpenVPN/openvpn/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/OpenVPN/openvpn/releases.atom) (2026-11-14; maintenance)
### WireGuard

VPN protocol and implementations for encrypted network tunnels.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 for wireguard-tools; other components vary. **Pricing model:** free.
- **Pick for:** A focused foundation for connecting devices or networks under your control.
- **Compare when:** Peer discovery, identity management and routing are separate configuration concerns
- **Strengths:** A focused foundation for connecting devices or networks under your control.
- **Limitations:** Peer discovery, identity management and routing are separate configuration concerns; A tunnel does not itself provide an Internet VPN service.
- **Maintenance:** active — Official release feed contains activity dated 2026-02-23. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/WireGuard/wireguard-tools/releases.atom))
- [Official project](https://github.com/WireGuard/wireguard-tools) · [Official installation / downloads](https://github.com/WireGuard/wireguard-tools) · [Repository](https://github.com/WireGuard/wireguard-tools)
- **Sources:** [Official project documentation](https://github.com/WireGuard/wireguard-tools) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/WireGuard/wireguard-tools/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/WireGuard/wireguard-tools/releases.atom) (2026-11-14; maintenance)

## Web browsers

### Brave

Chromium-based browser with integrated tracking protection and optional additional services.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0. **Pricing model:** free.
- **Pick for:** Use Chromium-compatible browsing with built-in blocking controls.
- **Compare when:** Bundled optional services and defaults should be reviewed against personal preferences.
- **Strengths:** Chromium site compatibility is combined with built-in controls for tracker and ad blocking.
- **Limitations:** Bundled optional services and defaults should be reviewed against personal preferences.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/brave/brave-browser))
- [Official project](https://brave.com/) · [Official installation / downloads](https://github.com/brave/brave-browser/releases) · [Repository](https://github.com/brave/brave-browser)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/brave/brave-browser) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/brave/brave-browser/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://brave.com/) (2026-11-14; identity, features, platforms); [Official release inspected: v1.99.57](https://github.com/brave/brave-browser/releases/tag/v1.99.57) (2026-11-14; downloads, maintenance, platforms)
### Firefox

General-purpose browser using Mozilla's Gecko engine with extensions, synchronization, and privacy controls.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 for Mozilla code; included components have separate license notices. **Pricing model:** free.
- **Pick for:** Browse with an alternative browser engine and configurable privacy settings.
- **Compare when:** Site compatibility and preferred extension behavior should be tested for your workflow.
- **Strengths:** Gecko offers a separately developed browser engine with a configurable extension ecosystem.
- **Limitations:** Site compatibility and preferred extension behavior should be tested for your workflow.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mozilla-firefox/firefox))
- [Official project](https://www.firefox.com/) · [Official installation / downloads](https://www.firefox.com/en-US/download/all/) · [Repository](https://github.com/mozilla-firefox/firefox)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mozilla-firefox/firefox) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/mozilla-firefox/firefox/HEAD/README.md) (2026-11-14; identity); [Official license text](https://raw.githubusercontent.com/mozilla-firefox/firefox/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://www.firefox.com/) (2026-11-14; identity, features, platforms); [Official license canonical documentation](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/toolkit/content/license.html.mako) (2026-11-14; license); [Official Firefox distribution selector](https://www.firefox.com/en-US/download/all/) (2026-11-14; downloads, platforms)
### LibreWolf

Independent Firefox-based browser with privacy-oriented settings, removed telemetry, and an included content blocker.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 for LibreWolf code; dependencies retain their terms. **Pricing model:** free.
- **Pick for:** Use a Firefox-derived browser configured around tracking resistance and minimal telemetry.
- **Compare when:** Stricter defaults can affect site behavior, and DRM media compatibility differs from default Firefox settings.
- **Strengths:** Privacy-oriented defaults and an included blocker reduce the configuration needed for that browsing preference.
- **Limitations:** Stricter defaults can affect site behavior, and DRM media compatibility differs from default Firefox settings.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://librewolf.net/))
- [Official project](https://librewolf.net/) · [Official installation / downloads](https://librewolf.net/installation/)
- **Sources:** [Official project scope and features](https://librewolf.net/) (2026-11-14; identity, features); [Official platform installation instructions](https://librewolf.net/installation/) (2026-11-14; downloads, platforms); [Official software license declaration](https://librewolf.net/license-disclaimers/) (2026-11-14; license)
### Tor Browser

Browser configured to route browsing through the Tor network, isolate sites, and access onion services.

- **Platforms:** Windows, macOS, Linux. **License:** Open-source distribution with component-specific licenses; Tor branding is separately protected. **Pricing model:** free.
- **Pick for:** Browse through Tor or access onion services using the official coordinated browser configuration.
- **Compare when:** Network latency and site compatibility differ from ordinary browsing; extra plugins and personal account sign-ins can undermine privacy goals.
- **Strengths:** Browser configuration and Tor routing are supplied as one coordinated privacy workflow.
- **Limitations:** Network latency and site compatibility differ from ordinary browsing; extra plugins and personal account sign-ins can undermine privacy goals.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://www.torproject.org/))
- [Official project](https://www.torproject.org/) · [Official installation / downloads](https://download.torproject.org/tor-browser-for-desktop/)
- **Sources:** [Official desktop downloads, routing and usage guidance](https://download.torproject.org/tor-browser-for-desktop/) (2026-11-14; identity, features, platforms, downloads); [Official free software distribution and branding policy](https://www.torproject.org/about/trademark/) (2026-11-14; license, pricing)
### Vivaldi

Customizable Chromium-based browser with tab workspaces, tiling, side panels, and integrated productivity tools.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary Vivaldi executable EULA; separately licensed open-source components. **Pricing model:** free.
- **Pick for:** Organize many websites into workspaces and side-by-side views.
- **Compare when:** The full browser is not open source; extensive options can require time to configure.
- **Strengths:** Built-in tab organization and split views suit workflows with many active web applications.
- **Limitations:** The full browser is not open source; extensive options can require time to configure.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://vivaldi.com/))
- [Official project](https://vivaldi.com/) · [Official installation / downloads](https://vivaldi.com/download/)
- **Sources:** [Official feature descriptions](https://vivaldi.com/features/) (2026-11-14; identity, features); [Official platform download selector](https://vivaldi.com/download/) (2026-11-14; downloads, platforms); [Official executable and third-party license scope](https://vivaldi.com/privacy/vivaldi-end-user-license-agreement/) (2026-11-14; license)
