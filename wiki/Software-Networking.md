# Networks & remote access

Connect machines, inspect traffic and work remotely.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=networking) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

83 applications. Reviewed 2026-11-15; individual records identify inherited research.

## Bandwidth Accounting

### vnStat

Interface-traffic accounting tool storing bandwidth usage totals over time.

- **Platforms:** Linux, FreeBSD. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux/FreeBSD interface-accounting tool; per-platform kernel support should be checked.
- **Pick for:** Fits tracking daily or monthly data use without recording packet contents.
- **Compare when:** Counters measure interfaces rather than attributing usage to individual applications.
- **Strengths:** Fits tracking daily or monthly data use without recording packet contents.
- **Limitations:** Counters measure interfaces rather than attributing usage to individual applications.; Collection starts when configured; it cannot reconstruct unrecorded historical traffic.
- **Maintenance:** active — Official release-feed entry 'vnStat 2.14' updated 2026-10-31. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/vergoh/vnstat/releases.atom))
- [Official project](https://humdi.net/vnstat/) · [Official installation / downloads](https://github.com/vergoh/vnstat) · [Repository](https://github.com/vergoh/vnstat)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/vergoh/vnstat/HEAD/README.md) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://humdi.net/vnstat/) (2026-11-14; identity, platforms); [Official application license text](https://raw.githubusercontent.com/vergoh/vnstat/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/vergoh/vnstat) (2026-11-14; downloads); [Official release activity or lifecycle basis](https://github.com/vergoh/vnstat/releases.atom) (2026-11-14; maintenance)

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
- **Sources:** [Official project documentation](https://www.netlimiter.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.netlimiter.com/download) (2026-11-14; downloads); [Official application license agreement](https://netlimiter.com/eula) (2026-11-14; license)

## BitTorrent clients

### Deluge

BitTorrent client with a daemon architecture, graphical and web interfaces, and plugins.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0 with OpenSSL exception. **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Separate a torrent daemon from its interactive management interface.
- **Compare when:** Packaging and plugin support vary across operating systems.
- **Strengths:** Its client-daemon design supports managing transfers from a separate interface.
- **Limitations:** Packaging and plugin support vary across operating systems.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-03-07. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/deluge-torrent/deluge))
- [Official project](https://deluge-torrent.org/) · [Official installation / downloads](https://dev.deluge-torrent.org/wiki/Download) · [Repository](https://github.com/deluge-torrent/deluge)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/deluge-torrent/deluge) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/deluge-torrent/deluge/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official license text](https://raw.githubusercontent.com/deluge-torrent/deluge/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://deluge-torrent.org/) (2026-11-14; identity, features); [Official platforms download documentation](https://dev.deluge-torrent.org/wiki/Download) (2026-11-14; identity, features, platforms, downloads); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/deluge-torrent/deluge/archive/HEAD.zip) (2026-11-14; downloads, pricing)
### qBittorrent

BitTorrent client with a desktop interface, web interface, search plugins, and transfer controls.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0-or-later source / GPL-3.0-or-later binaries; OpenSSL exception. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Manage authorized torrent downloads without an advertising-funded client.
- **Compare when:** Search plugins and remotely exposed web access need separate trust and configuration checks.
- **Strengths:** Desktop controls and optional web management cover both local and remote transfer workflows.
- **Limitations:** Search plugins and remotely exposed web access need separate trust and configuration checks.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/qbittorrent/qBittorrent))
- [Official project](https://www.qbittorrent.org/) · [Official installation / downloads](https://github.com/qbittorrent/qBittorrent/releases) · [Repository](https://github.com/qbittorrent/qBittorrent)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/qbittorrent/qBittorrent) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/qbittorrent/qBittorrent/HEAD/README.md) (2026-11-14; identity, features); [Official license text](https://raw.githubusercontent.com/qbittorrent/qBittorrent/HEAD/COPYING) (2026-11-14; license); [Official official documentation](https://www.qbittorrent.org/) (2026-11-14; identity, features); [Official release inspected: release-5.3.0](https://github.com/qbittorrent/qBittorrent/releases/tag/release-5.3.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/qbittorrent/qBittorrent/releases/download/release-5.3.0/qbittorrent_5.3.0_x64_setup.exe) (2026-11-14; downloads, pricing)
### Transmission

BitTorrent client offering native interfaces and a daemon with remote management.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 or GPL-3.0, with OpenSSL permission and separately licensed files. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Use a focused torrent client or a separately managed download daemon.
- **Compare when:** Feature availability varies between interfaces and packaged versions.
- **Strengths:** Native clients and a daemon allow either a simple desktop or separated download setup.
- **Limitations:** Feature availability varies between interfaces and packaged versions.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/transmission/transmission))
- [Official project](https://transmissionbt.com/) · [Official installation / downloads](https://github.com/transmission/transmission/releases) · [Repository](https://github.com/transmission/transmission)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/transmission/transmission) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/transmission/transmission/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/transmission/transmission/HEAD/COPYING) (2026-11-14; license); [Official official documentation](https://transmissionbt.com/) (2026-11-14; identity, features); [Official release inspected: 4.1.4](https://github.com/transmission/transmission/releases/tag/4.1.4) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/transmission/transmission/releases/download/4.1.4/transmission-4.1.4-x64.msi) (2026-11-14; downloads, pricing)

## Cloud Storage Clients

### Rclone Browser

Desktop graphical front end for browsing and transferring data through rclone remotes.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** README lists Windows, macOS, Linux and BSD; desktop packages and mount requirements differ.
- **Pick for:** May fit an existing rclone workflow that needs a conventional desktop file interface.
- **Compare when:** The reviewed release feed only establishes old releases; current rclone compatibility needs testing.
- **Strengths:** May fit an existing rclone workflow that needs a conventional desktop file interface.
- **Limitations:** The reviewed release feed only establishes old releases; current rclone compatibility needs testing.; Requires rclone and any platform-specific mount dependencies.
- **Maintenance:** unverified — Official release-feed entry 'Rclone Browser 1.8.0' updated 2020-02-17. Feed activity can include prereleases; it does not establish installed stability. The reviewed feed does not establish recent maintenance. ([evidence](https://github.com/kapitainsky/RcloneBrowser/releases.atom))
- [Official project](https://github.com/kapitainsky/RcloneBrowser) · [Official installation / downloads](https://github.com/kapitainsky/RcloneBrowser) · [Repository](https://github.com/kapitainsky/RcloneBrowser)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/kapitainsky/RcloneBrowser/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/kapitainsky/RcloneBrowser/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/kapitainsky/RcloneBrowser) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/kapitainsky/RcloneBrowser/releases.atom) (2026-11-14; maintenance)

## Dns Filtering

### AdGuard Home

Self-hosted DNS filtering server for applying domain-level rules to a home network.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** README and official installation guidance cover Windows and Unix-like hosts; clients use the configured resolver.
- **Pick for:** Useful for applying one DNS policy across devices without installing a browser extension on each one.
- **Compare when:** DNS filtering cannot remove same-domain advertising or replace a browser content blocker.
- **Strengths:** Useful for applying one DNS policy across devices without installing a browser extension on each one.
- **Limitations:** DNS filtering cannot remove same-domain advertising or replace a browser content blocker.; Devices that bypass the configured resolver may bypass its policy.
- **Maintenance:** active — Official release-feed entry 'AdGuard Home v1.0.0-b.2' updated 2026-11-05. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/AdguardTeam/AdGuardHome/releases.atom))
- [Official project](https://github.com/AdguardTeam/AdGuardHome) · [Official installation / downloads](https://github.com/AdguardTeam/AdGuardHome) · [Repository](https://github.com/AdguardTeam/AdGuardHome)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/HEAD/README.md) (2026-11-14; features, identity, pricing); [Official supported-platform and installation documentation](https://github.com/AdguardTeam/AdGuardHome/wiki/Getting-Started) (2026-11-14; platforms); [Official application license text](https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/HEAD/LICENSE.txt) (2026-11-14; license); [Official download or installation landing page](https://github.com/AdguardTeam/AdGuardHome) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/AdguardTeam/AdGuardHome/releases.atom) (2026-11-14; maintenance)
### Pi-hole

Linux-hosted DNS sinkhole with a browser dashboard and optional DHCP service.

- **Platforms:** Linux, Web. **License:** EUPL-1.2 for current Pi-hole Core; earlier code and components retain their licenses. **Pricing model:** free.
- **Compatibility details:** Linux server; Web denotes its management interface, not a hosted filtering subscription.
- **Pick for:** Fits a home network that needs centrally managed DNS blocklists and query visibility.
- **Compare when:** Requires a reliably reachable Linux host or supported container deployment.
- **Strengths:** Fits a home network that needs centrally managed DNS blocklists and query visibility.
- **Limitations:** Requires a reliably reachable Linux host or supported container deployment.; DNS blocking does not remove every kind of advertisement and needs network DNS configuration.
- **Maintenance:** active — Official release-feed entry 'v6.6' updated 2026-11-11. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/pi-hole/pi-hole/releases.atom))
- [Official project](https://github.com/pi-hole/pi-hole) · [Official installation / downloads](https://github.com/pi-hole/pi-hole) · [Repository](https://github.com/pi-hole/pi-hole)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/pi-hole/pi-hole/HEAD/README.md) (2026-11-14; features, identity, platforms, pricing); [Official application license text](https://raw.githubusercontent.com/pi-hole/pi-hole/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/pi-hole/pi-hole) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/pi-hole/pi-hole/releases.atom) (2026-11-14; maintenance)

## Dns Servers

### Technitium DNS Server

Self-hosted recursive and authoritative DNS server with a graphical web console.

- **Platforms:** Windows, macOS, Linux, Web. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** The official README explicitly lists Windows, Linux and macOS; the management console runs in a browser.
- **Pick for:** Choose when a local DNS setup needs both administrative control and more than simple domain blocking.
- **Compare when:** Publishing an unrestricted resolver or changing authoritative records requires deliberate network configuration.
- **Strengths:** Choose when a local DNS setup needs both administrative control and more than simple domain blocking.
- **Limitations:** Publishing an unrestricted resolver or changing authoritative records requires deliberate network configuration.; The cross-platform server depends on the supported .NET runtime.
- **Maintenance:** active — Official release-feed entry 'Technitium DNS Server v15.6.2 Released!' updated 2026-10-17. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/TechnitiumSoftware/DnsServer/releases.atom))
- [Official project](https://github.com/TechnitiumSoftware/DnsServer) · [Official installation / downloads](https://github.com/TechnitiumSoftware/DnsServer) · [Repository](https://github.com/TechnitiumSoftware/DnsServer)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/TechnitiumSoftware/DnsServer/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/TechnitiumSoftware/DnsServer/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/TechnitiumSoftware/DnsServer) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/TechnitiumSoftware/DnsServer/releases.atom) (2026-11-14; maintenance)
### Unbound

Validating recursive DNS resolver with caching and DNSSEC verification.

- **Platforms:** Windows, Linux, FreeBSD. **License:** BSD-3-Clause. **Pricing model:** unknown.
- **Compatibility details:** Official download page lists Windows binaries and Linux/BSD package paths; additional source ports are not assumed.
- **Pick for:** Fits a local resolver deployment that needs protocol-level control rather than a browsing-policy dashboard.
- **Compare when:** Administration requires DNS and network configuration knowledge.
- **Strengths:** Fits a local resolver deployment that needs protocol-level control rather than a browsing-policy dashboard.
- **Limitations:** Administration requires DNS and network configuration knowledge.; A recursive resolver does not automatically provide application-level tracking protection.
- **Maintenance:** active — Official release-feed entry 'Unbound 1.26.2' updated 2026-10-21. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/NLnetLabs/unbound/releases.atom))
- [Official project](https://nlnetlabs.nl/projects/unbound/about/) · [Official installation / downloads](https://nlnetlabs.nl/projects/unbound/download/) · [Repository](https://github.com/NLnetLabs/unbound)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/NLnetLabs/unbound/HEAD/README.md) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://nlnetlabs.nl/projects/unbound/download/) (2026-11-14; downloads, platforms); [Official application license text](https://raw.githubusercontent.com/NLnetLabs/unbound/HEAD/LICENSE) (2026-11-14; license); [Official project identity and product page](https://nlnetlabs.nl/projects/unbound/about/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/NLnetLabs/unbound/releases.atom) (2026-11-14; maintenance)

## Download managers

### aria2

Command-line download utility supporting HTTP, FTP, BitTorrent, Metalink, and segmented transfers.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Automate resumable downloads using a scriptable transfer engine.
- **Compare when:** Remote-control interfaces need explicit secure configuration.
- **Strengths:** Protocol support and an RPC interface make transfers easy to integrate into other tools.
- **Limitations:** Remote-control interfaces need explicit secure configuration.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-06-25. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/aria2/aria2))
- [Official project](https://aria2.github.io/) · [Official installation / downloads](https://github.com/aria2/aria2/releases) · [Repository](https://github.com/aria2/aria2)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/aria2/aria2) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/aria2/aria2/HEAD/README.rst) (2026-11-14; identity, features); [Official official documentation](https://aria2.github.io/) (2026-11-14; identity, features); [Official release inspected: release-1.37.0](https://github.com/aria2/aria2/releases/tag/release-1.37.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip) (2026-11-15; downloads, pricing)
### Motrix

Desktop download manager using aria2 with HTTP, FTP, BitTorrent, and magnet support.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for application code; bundled components have separate notices. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Manage a visible queue of resumable downloads on a desktop.
- **Compare when:** Site-specific authentication and download restrictions can require another tool.
- **Strengths:** An aria2-based engine is exposed through a desktop queue with transfer management.
- **Limitations:** Site-specific authentication and download restrictions can require another tool.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/agalwood/Motrix))
- [Official project](https://motrix.app/) · [Official installation / downloads](https://github.com/agalwood/Motrix/releases) · [Repository](https://github.com/agalwood/Motrix)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/agalwood/Motrix) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/agalwood/Motrix/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/agalwood/Motrix/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://motrix.app/) (2026-11-14; identity, features); [Official release inspected: v2.4.1](https://github.com/agalwood/Motrix/releases/tag/v2.4.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/agalwood/Motrix/releases/download/v2.4.1/Motrix-2.4.1-x64.dmg) (2026-11-14; downloads, pricing)

## Encrypted Dns

### dnscrypt-proxy

Configurable DNS proxy supporting encrypted upstream transports and local filtering.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** ISC. **Pricing model:** unknown.
- **Pick for:** Useful for an administrator who wants explicit control over the local encrypted DNS path.
- **Compare when:** Upstream resolver and relay choices still determine trust and availability.
- **Strengths:** Useful for an administrator who wants explicit control over the local encrypted DNS path.
- **Limitations:** Upstream resolver and relay choices still determine trust and availability.; It protects DNS transport; it is not a general traffic VPN or complete anonymity system.
- **Maintenance:** active — Official release-feed entry '2.1.20' updated 2026-10-22. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/DNSCrypt/dnscrypt-proxy/releases.atom))
- [Official project](https://github.com/DNSCrypt/dnscrypt-proxy) · [Official installation / downloads](https://github.com/DNSCrypt/dnscrypt-proxy) · [Repository](https://github.com/DNSCrypt/dnscrypt-proxy)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/DNSCrypt/dnscrypt-proxy/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/DNSCrypt/dnscrypt-proxy/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/DNSCrypt/dnscrypt-proxy) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/DNSCrypt/dnscrypt-proxy/releases.atom) (2026-11-14; maintenance)
### NextDNS CLI

Command-line DNS-over-HTTPS client with NextDNS policy integration and split-DNS capabilities.

- **Platforms:** Windows, macOS, Linux. **License:** MIT client; NextDNS hosted service has separate terms. **Pricing model:** freemium.
- **Compatibility details:** README covers Windows, macOS and Unix/router deployments; service terms are separate from the MIT client.
- **Pick for:** Fits people who want NextDNS policy control through an open-source command-line client.
- **Compare when:** NextDNS service filtering has a free query quota and paid plans; the client license does not include unlimited hosted service.
- **Strengths:** Fits people who want NextDNS policy control through an open-source command-line client.
- **Limitations:** NextDNS service filtering has a free query quota and paid plans; the client license does not include unlimited hosted service.; A CLI configuration is less approachable than a graphical desktop client.
- **Maintenance:** active — Official release-feed entry 'nextdns-v1.49.0' updated 2026-10-29. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/nextdns/nextdns/releases.atom))
- [Official project](https://github.com/nextdns/nextdns) · [Official installation / downloads](https://github.com/nextdns/nextdns) · [Repository](https://github.com/nextdns/nextdns)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/nextdns/nextdns/HEAD/README.md) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://github.com/nextdns/nextdns/releases.atom) (2026-11-14; maintenance, platforms); [Official application license text](https://raw.githubusercontent.com/nextdns/nextdns/HEAD/LICENSE) (2026-11-14; license); [Official price or edition-policy statement](https://nextdns.io/pricing) (2026-11-14; pricing); [Official download or installation landing page](https://github.com/nextdns/nextdns) (2026-11-14; downloads, identity)

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
- **Sources:** [Official project documentation](https://cyberduck.io/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/iterate-ch/cyberduck) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://cyberduck.io/download/) (2026-11-14; downloads, pricing); [Official source license](https://raw.githubusercontent.com/iterate-ch/cyberduck/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/iterate-ch/cyberduck/releases.atom) (2026-11-14; maintenance)
### FileZilla Client

Graphical FTP, FTPS and SFTP client for managing remote files.

- **Platforms:** Windows, macOS, Linux. **License:** License text was not readable in this retrieval; verify the official Client license before redistribution. **Pricing model:** free.
- **Pick for:** Cross-platform remote-file transfers with an inspectable queue.
- **Compare when:** FTP without TLS does not encrypt traffic
- **Strengths:** Cross-platform remote-file transfers with an inspectable queue.
- **Limitations:** FTP without TLS does not encrypt traffic; Check the exact installer and distinguish Client from Server and Pro.; The official license endpoint returned JavaScript-obfuscated content; the exact grant is left unverified.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://filezilla-project.org/) · [Official installation / downloads](https://filezilla-project.org/download.php?type=client)
- **Sources:** [Official comparison of free Client and Pro](https://filezillapro.com/filezilla-pro/) (2026-11-14; identity, features, pricing); [Official Client and Pro transfer-queue guide](https://filezillapro.com/docs/v3/getting-started/what-is-the-transfer-queue/) (2026-11-14; features); [Official Client download landing; scripted body not inspected](https://filezilla-project.org/download.php?type=client) (2026-11-14; downloads); [Official project or distribution platform documentation](https://sourceforge.net/projects/filezilla/) (2026-11-14; platforms)
### rclone

Multi-provider cloud transfer and mount tooling

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Command-line binaries are available for all listed platforms. The download page documents release-specific OS minimums; cloud-storage service charges remain separate.
- **Pick for:** Choose rclone for scripted transfers, checks, synchronization and mounts across many remote storage services.
- **Compare when:** Compare Cyberduck for interactive transfers or Syncthing for continuous synchronization between your own devices.
- **Strengths:** Multi-provider cloud transfer and mount tooling
- **Limitations:** Sync operations can delete destination files to match the source; review the direction and use the documented dry-run option for unfamiliar jobs.; Provider API limits, credentials, storage charges and filesystem differences still apply; this is primarily a command-line workflow.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/rclone/rclone) · [Official installation / downloads](https://rclone.org/downloads/) · [Repository](https://github.com/rclone/rclone)
- **Sources:** [Official capabilities and practical usage basis](https://github.com/rclone/rclone) (2026-11-15; features, identity, license); [Official rclone downloads and OS requirements](https://rclone.org/downloads/) (2026-11-14; downloads, features, identity, platforms); [Official destructive-sync semantics and dry-run guidance](https://rclone.org/commands/rclone_sync/) (2026-11-15; features); [Maintainer application package publicly available without payment](https://downloads.rclone.org/rclone-current-windows-amd64.zip) (2026-11-15; downloads, pricing)
### WinSCP

SFTP, SCP, WebDAV and S3 plus automation

- **Platforms:** Windows. **License:** GPL-3.0-or-later; installer/icons have separate terms. **Pricing model:** unknown.
- **Compatibility details:** Windows file transfer client
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
- **Compatibility details:** Desktop Windows, macOS and Linux clients are listed. The current repository documents Windows 10 and macOS 12 minimums; Linux requires the documented desktop portal packages.
- **Pick for:** Choose LocalSend for occasional files or messages between nearby devices on the same local network.
- **Compare when:** Compare Syncthing for ongoing folder synchronization or croc for transfers that must cross networks.
- **Strengths:** Local network file transfer
- **Limitations:** Firewall rules and Wi-Fi client isolation can prevent local discovery or transfers.; Both devices must be reachable for the transfer; the application does not provide an asynchronous cloud inbox.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/localsend/localsend) · [Official installation / downloads](https://localsend.org/download) · [Repository](https://github.com/localsend/localsend)
- **Sources:** [Official capabilities and practical usage basis](https://github.com/localsend/localsend) (2026-11-15; features, identity, platforms); [Official platform and free-of-charge FAQ](https://localsend.org/) (2026-11-14; platforms, pricing); [Official LocalSend downloads](https://localsend.org/download) (2026-11-14; downloads, platforms)

## Media downloading

### Streamlink

Command-line utility extracting supported streams and sending them to an external media player.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-2-Clause. **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Play an authorized supported stream in a desktop media player.
- **Compare when:** Supported-service changes can break playback and authentication flows.
- **Strengths:** Sending streams to a chosen player separates playback from a service's web interface.
- **Limitations:** Supported-service changes can break playback and authentication flows.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/streamlink/streamlink))
- [Official project](https://streamlink.github.io/) · [Official installation / downloads](https://github.com/streamlink/streamlink/releases) · [Repository](https://github.com/streamlink/streamlink)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/streamlink/streamlink) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/streamlink/streamlink/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://streamlink.github.io/) (2026-11-14; identity, features); [Official release inspected: 8.6.3](https://github.com/streamlink/streamlink/releases/tag/8.6.3) (2026-11-14; downloads, maintenance); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/streamlink/streamlink/releases/download/8.6.3/streamlink-8.6.3.tar.gz) (2026-11-14; downloads, pricing)
### yt-dlp

Command-line media downloader with site extractors, format selection, and post-processing integration.

- **Platforms:** Windows, macOS, Linux. **License:** Unlicense. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Download permitted media in selected formats for personal workflows.
- **Compare when:** Site changes can break extractors, and downloading remains subject to access rights and terms.
- **Strengths:** Explicit format selection and post-processing fit repeatable permitted-media workflows.
- **Limitations:** Site changes can break extractors, and downloading remains subject to access rights and terms.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/yt-dlp/yt-dlp))
- [Official project](https://github.com/yt-dlp/yt-dlp) · [Official installation / downloads](https://github.com/yt-dlp/yt-dlp/releases) · [Repository](https://github.com/yt-dlp/yt-dlp)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/yt-dlp/yt-dlp) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/yt-dlp/yt-dlp/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official release inspected: 2026.10.26](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.10.26) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/yt-dlp/yt-dlp/releases/download/2026.10.26/yt-dlp.exe) (2026-11-14; downloads, pricing)

## Private mesh networks

### Nebula

Certificate-based encrypted overlay network connecting computers across different networks.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Official README provides Windows, macOS, Linux and FreeBSD release paths.
- **Pick for:** Useful for a private mesh when the operator wants explicit certificate and network-policy control.
- **Compare when:** Certificate lifecycle and reachable discovery infrastructure must be managed.
- **Strengths:** Useful for a private mesh when the operator wants explicit certificate and network-policy control.
- **Limitations:** Certificate lifecycle and reachable discovery infrastructure must be managed.; A mesh network does not automatically secure applications exposed through it.
- **Maintenance:** active — Official release-feed entry 'Release v1.12.0' updated 2026-10-29. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/slackhq/nebula/releases.atom))
- [Official project](https://github.com/slackhq/nebula) · [Official installation / downloads](https://github.com/slackhq/nebula) · [Repository](https://github.com/slackhq/nebula)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/slackhq/nebula/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/slackhq/nebula/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/slackhq/nebula) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/slackhq/nebula/releases.atom) (2026-11-14; maintenance)
### NetBird

WireGuard-based private networking platform with hosted and self-hosted control-plane options.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause client; management components include AGPL-3.0 terms. **Pricing model:** freemium.
- **Pick for:** Good comparison candidate when self-hosted device coordination is a requirement.
- **Compare when:** Operating the self-hosted components adds administrative work
- **Strengths:** Good comparison candidate when self-hosted device coordination is a requirement.
- **Limitations:** Operating the self-hosted components adds administrative work; Hosted pricing and included features can change.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-13. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/netbirdio/netbird/releases.atom))
- [Official project](https://github.com/netbirdio/netbird) · [Official installation / downloads](https://github.com/netbirdio/netbird/releases) · [Repository](https://github.com/netbirdio/netbird)
- **Sources:** [Official project documentation](https://github.com/netbirdio/netbird) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/netbirdio/netbird/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/netbirdio/netbird/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/netbirdio/netbird/releases.atom) (2026-11-14; maintenance); [Official distribution price or edition policy](https://netbird.io/pricing) (2026-11-14; pricing)
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
- **Sources:** [Official project documentation](https://www.zerotier.com/) (2026-11-14; identity, features); [Official source repository and README](https://github.com/zerotier/ZeroTierOne) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://www.zerotier.com/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/zerotier/ZeroTierOne/HEAD/LICENSE.txt) (2026-11-14; license); [Official release activity](https://github.com/zerotier/ZeroTierOne/releases.atom) (2026-11-14; maintenance); [Official distribution price or edition policy](https://www.zerotier.com/pricing/) (2026-11-14; pricing)

## Mesh Vpn Control

### Headscale

Self-hosted implementation of the Tailscale coordination server for controlled tailnets.

- **Platforms:** Linux. **License:** BSD-3-Clause. **Pricing model:** unknown.
- **Compatibility details:** This record scopes the server to the documented Debian/Ubuntu Linux installation; client OS support is separate.
- **Pick for:** Fits a technical operator who wants to run the coordination service for a small private mesh.
- **Compare when:** Requires operating and updating the server plus compatible clients.
- **Strengths:** Fits a technical operator who wants to run the coordination service for a small private mesh.
- **Limitations:** Requires operating and updating the server plus compatible clients.; It does not reproduce every hosted Tailscale feature; configuration must match the deployed release.
- **Maintenance:** active — Official release-feed entry 'v0.29.7' updated 2026-10-30. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/juanfont/headscale/releases.atom))
- [Official project](https://headscale.net/) · [Official installation / downloads](https://headscale.net/stable/setup/install/official/) · [Repository](https://github.com/juanfont/headscale)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/juanfont/headscale/HEAD/README.md) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://headscale.net/stable/setup/install/official/) (2026-11-14; downloads, platforms); [Official application license text](https://raw.githubusercontent.com/juanfont/headscale/HEAD/LICENSE) (2026-11-14; license); [Official project identity and product page](https://headscale.net/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/juanfont/headscale/releases.atom) (2026-11-14; maintenance)

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
- **Sources:** [Official project documentation](https://angryip.org/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/angryip/ipscan) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://angryip.org/download/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/angryip/ipscan/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/angryip/ipscan/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/angryip/ipscan/releases/expanded_assets/3.12.1) (2026-11-14; pricing)
### gping

Terminal ping tool that graphs latency for multiple hosts and can chart command execution time.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Official README lists Windows, macOS, Linux and a FreeBSD package path.
- **Pick for:** Fits a quick visual comparison of latency variation while staying in a terminal.
- **Compare when:** Blocked or deprioritized ICMP can make ping an incomplete measure of application performance.
- **Strengths:** Fits a quick visual comparison of latency variation while staying in a terminal.
- **Limitations:** Blocked or deprioritized ICMP can make ping an incomplete measure of application performance.; It does not replace throughput testing or packet-path diagnosis.
- **Maintenance:** active — Official release-feed entry 'gping-v1.21.0' updated 2026-08-31. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/orf/gping/releases.atom))
- [Official project](https://github.com/orf/gping) · [Official installation / downloads](https://github.com/orf/gping) · [Repository](https://github.com/orf/gping)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/orf/gping/HEAD/readme.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/orf/gping/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/orf/gping) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/orf/gping/releases.atom) (2026-11-14; maintenance)
### iperf3

Client/server network throughput measurement tool maintained by ESnet.

- **Platforms:** Linux, macOS. **License:** BSD-3-Clause. **Pricing model:** unknown.
- **Pick for:** Useful for measuring a controlled network path between two endpoints.
- **Compare when:** Both endpoints need compatible test processes
- **Strengths:** Useful for measuring a controlled network path between two endpoints.
- **Limitations:** Both endpoints need compatible test processes; Windows is not an officially supported primary platform.
- **Maintenance:** active — Official release feed contains activity dated 2026-09-29. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/esnet/iperf/releases.atom))
- [Official project](https://software.es.net/iperf/) · [Official installation / downloads](https://software.es.net/iperf/obtaining.html) · [Repository](https://github.com/esnet/iperf)
- **Sources:** [Official project documentation](https://software.es.net/iperf/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/esnet/iperf) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://software.es.net/iperf/obtaining.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/esnet/iperf/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/esnet/iperf/releases.atom) (2026-11-14; maintenance)
### MTR

Network diagnostic tool combining traceroute paths with repeated latency and packet-loss measurements.

- **Platforms:** Linux, macOS. **License:** GPL-2.0. **Pricing model:** unknown.
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
- **Sources:** [Official project documentation](https://nmap.org/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/nmap/nmap) (2026-11-14; features, identity, platforms, pricing); [Official download or installation landing page](https://nmap.org/download.html) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/nmap/nmap/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/nmap/nmap/releases.atom) (2026-11-14; maintenance)
### PingPlotter

Graphical path monitoring tool for recording latency and packet-loss history.

- **Platforms:** Windows, macOS. **License:** Proprietary commercial license. **Pricing model:** mixed.
- **Pick for:** Useful for collecting time-series network symptoms to discuss with an administrator or ISP.
- **Compare when:** Edition and subscription terms differ
- **Strengths:** Useful for collecting time-series network symptoms to discuss with an administrator or ISP.
- **Limitations:** Edition and subscription terms differ; Intermediate routers can deprioritize probes without causing end-to-end loss.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.pingplotter.com/) · [Official installation / downloads](https://www.pingplotter.com/download/)
- **Sources:** [Official project documentation](https://www.pingplotter.com/) (2026-11-14; identity, features, platforms, pricing); [Official download or installation landing page](https://www.pingplotter.com/download/) (2026-11-14; downloads); [Official application license agreement](https://www.pingman.com/licenseagreement.html) (2026-11-14; license)
### Trippy

Interactive network diagnostic tool combining traceroute and ping-style statistics.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** A terminal choice for exploring route behavior with richer interactive detail.
- **Compare when:** Raw network probing may require privileges
- **Strengths:** A terminal choice for exploring route behavior with richer interactive detail.
- **Limitations:** Raw network probing may require privileges; Probe responses are not the same as application performance.
- **Maintenance:** unverified — Official release feed contains activity dated 2025-05-05. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/fujiapple852/trippy/releases.atom))
- [Official project](https://trippy.rs/) · [Official installation / downloads](https://trippy.rs/start/installation/) · [Repository](https://github.com/fujiapple852/trippy)
- **Sources:** [Official project documentation](https://trippy.rs/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/fujiapple852/trippy) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://trippy.rs/start/installation/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/fujiapple852/trippy/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/fujiapple852/trippy/releases.atom) (2026-11-14; maintenance); [Official public application distribution](https://github.com/fujiapple852/trippy/releases/expanded_assets/0.13.0) (2026-11-14; pricing)

## Network Speed Tests

### LibreSpeed

Self-hosted browser speed test with upload, download, latency and optional results storage.

- **Platforms:** Web. **License:** LGPL-3.0-or-later. **Pricing model:** unknown.
- **Compatibility details:** Browser client with a self-hosted web backend; runtime requirements depend on the selected backend.
- **Pick for:** Fits a controlled network test page when retaining or comparing test results is useful.
- **Compare when:** The chosen backend, server and browser can limit measured throughput.
- **Strengths:** Fits a controlled network test page when retaining or comparing test results is useful.
- **Limitations:** The chosen backend, server and browser can limit measured throughput.; Telemetry and result-sharing features need deliberate deployment and privacy settings.
- **Maintenance:** active — Official release-feed entry 'LibreSpeed 6.3.1' updated 2026-10-21. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/librespeed/speedtest/releases.atom))
- [Official project](https://librespeed.org/) · [Official installation / downloads](https://github.com/librespeed/speedtest) · [Repository](https://github.com/librespeed/speedtest)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/librespeed/speedtest/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/librespeed/speedtest/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/librespeed/speedtest) (2026-11-14; downloads); [Official project identity and product page](https://librespeed.org/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/librespeed/speedtest/releases.atom) (2026-11-14; maintenance)
### OpenSpeedTest

Browser-based throughput test that can be served from a local web server.

- **Platforms:** Web. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** This record covers the browser test and self-hosted static web assets; desktop server wrappers are separate packaging.
- **Pick for:** Useful for measuring a browser-to-server network path without installing a test client on every device.
- **Compare when:** Browser, web-server and endpoint limits affect the result.
- **Strengths:** Useful for measuring a browser-to-server network path without installing a test client on every device.
- **Limitations:** Browser, web-server and endpoint limits affect the result.; A test to a local server measures that path; it is not automatically an Internet-provider benchmark.
- **Maintenance:** unverified — Official project/download documentation was reviewed; dated release or maintenance activity was not established by the sources reviewed. ([evidence](https://openspeedtest.com/))
- [Official project](https://openspeedtest.com/) · [Official installation / downloads](https://github.com/openspeedtest/Speed-Test) · [Repository](https://github.com/openspeedtest/Speed-Test)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/openspeedtest/Speed-Test/HEAD/README.md) (2026-11-14; features, identity, platforms, pricing); [Official application license text](https://raw.githubusercontent.com/openspeedtest/Speed-Test/HEAD/License.md) (2026-11-14; license); [Official download or installation landing page](https://github.com/openspeedtest/Speed-Test) (2026-11-14; downloads); [Official project identity and product page](https://openspeedtest.com/) (2026-11-14; identity, maintenance)

## Packet capture analysis

### Termshark

Terminal interface to tshark for inspecting packet captures with Wireshark-style navigation.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Inspect packet captures over SSH without a graphical desktop.
- **Compare when:** Requires tshark and its capture permissions or an existing capture file.
- **Strengths:** Packet captures can be explored interactively in a remote terminal session.
- **Limitations:** Requires tshark and its capture permissions or an existing capture file.; Repository activity is older than one year; current maintenance has not been established.
- **Maintenance:** unverified — Repository not archived; latest repository push observed 2024-04-30. Activity is not a runtime, security, or support guarantee. No push within the preceding year was observed; current support status needs reassessment. ([evidence](https://api.github.com/repos/gcla/termshark))
- [Official project](https://termshark.io/) · [Official installation / downloads](https://github.com/gcla/termshark/releases) · [Repository](https://github.com/gcla/termshark)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/gcla/termshark) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/gcla/termshark/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://termshark.io/) (2026-11-14; identity, features); [Official release inspected: v2.4.0](https://github.com/gcla/termshark/releases/tag/v2.4.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/gcla/termshark/archive/HEAD.zip) (2026-11-14; downloads, pricing)
### Wireshark

Packet analysis, filters and protocol dissectors

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** GPLv2 Wireshark; Npcap separately licensed. **Pricing model:** free.
- **Compatibility details:** Official Windows and macOS packages and Linux/BSD distribution packages are documented. Requirements differ by release; Windows live capture uses Npcap, which has separate licensing.
- **Pick for:** Choose Wireshark to inspect captured network protocols, filter conversations and investigate a reproducible connectivity problem.
- **Compare when:** Compare TCPView for process-to-connection inspection on Windows or tcpdump for command-line capture on Unix-like systems.
- **Strengths:** Packet analysis, filters and protocol dissectors
- **Limitations:** It analyzes available traffic; it does not automatically prevent attacks or explain every connection without protocol knowledge.; Capture permissions and network visibility constrain what can be recorded. Captures may contain sensitive traffic and require careful sharing.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://gitlab.com/wireshark/wireshark) · [Official installation / downloads](https://www.wireshark.org/download.html) · [Repository](https://gitlab.com/wireshark/wireshark)
- **Sources:** [Preserved original research source](https://gitlab.com/wireshark/wireshark) (2026-11-14; identity, features); [Official Wireshark downloads and capture-driver note](https://www.wireshark.org/download.html) (2026-11-14; downloads, features, identity, platforms); [Official capabilities and practical usage basis](https://www.wireshark.org/docs/wsug_html_chunked/ChapterIntroduction.html) (2026-11-15; features, identity); [Official platforms and no-license-fee FAQ](https://www.wireshark.org/) (2026-11-14; platforms, pricing); [Official platform requirements including FreeBSD](https://www.wireshark.org/docs/wsug_html_chunked/ChIntroPlatforms.html) (2026-11-14; platforms)

## Packet Capture

### tcpdump

Command-line packet capture and inspection tool built around libpcap capture filters.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** BSD-3-Clause. **Pricing model:** unknown.
- **Compatibility details:** Official README lists Unix-like systems and Windows; Windows requires the documented build toolchain and WinPcap/Npcap.
- **Pick for:** Fits reproducible packet collection over a terminal or remote shell.
- **Compare when:** Capture typically needs elevated permissions and careful handling of sensitive traffic.
- **Strengths:** Fits reproducible packet collection over a terminal or remote shell.
- **Limitations:** Capture typically needs elevated permissions and careful handling of sensitive traffic.; Windows building and capture-driver requirements differ from Unix packages.
- **Maintenance:** active — Official release-feed entry 'tcpdump-4.99.7' updated 2026-09-21. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/the-tcpdump-group/tcpdump/releases.atom))
- [Official project](https://www.tcpdump.org/) · [Official installation / downloads](https://github.com/the-tcpdump-group/tcpdump) · [Repository](https://github.com/the-tcpdump-group/tcpdump)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/the-tcpdump-group/tcpdump/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/the-tcpdump-group/tcpdump/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/the-tcpdump-group/tcpdump) (2026-11-14; downloads); [Official project identity and product page](https://www.tcpdump.org/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/the-tcpdump-group/tcpdump/releases.atom) (2026-11-14; maintenance)

## Peer File Transfer

### croc

Code-based file-transfer tool with encrypted peer transfers and relay fallback.

- **Platforms:** Windows, macOS, Linux, Web. **License:** MIT. **Pricing model:** unknown.
- **Pick for:** Choose for sending files between two computers using a short shared transfer code.
- **Compare when:** Both endpoints must coordinate the code and be reachable through the selected transfer path.
- **Strengths:** Choose for sending files between two computers using a short shared transfer code.
- **Limitations:** Both endpoints must coordinate the code and be reachable through the selected transfer path.; Relay availability and network limits can affect completion; verify the recipient before sending.
- **Maintenance:** active — Official release-feed entry 'v11.6.5' updated 2026-11-07. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/schollz/croc/releases.atom))
- [Official project](https://github.com/schollz/croc) · [Official installation / downloads](https://github.com/schollz/croc) · [Repository](https://github.com/schollz/croc)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/schollz/croc/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/schollz/croc/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/schollz/croc) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/schollz/croc/releases.atom) (2026-11-14; maintenance)
### Magic Wormhole

Command-line file and text transfer using single-use human-readable connection codes.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Official installation documentation covers Unix-like systems and Windows; Python requirements depend on the release.
- **Pick for:** Fits ad-hoc terminal transfers where exchanging a short code is easier than configuring accounts.
- **Compare when:** The two endpoints need compatible clients and access to the rendezvous infrastructure.
- **Strengths:** Fits ad-hoc terminal transfers where exchanging a short code is easier than configuring accounts.
- **Limitations:** The two endpoints need compatible clients and access to the rendezvous infrastructure.; It is a transfer tool rather than continuous synchronization or versioned backup.
- **Maintenance:** active — Official release-feed entry '0.24.0' updated 2026-05-05. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/magic-wormhole/magic-wormhole/releases.atom))
- [Official project](https://magic-wormhole.readthedocs.io/) · [Official installation / downloads](https://github.com/magic-wormhole/magic-wormhole) · [Repository](https://github.com/magic-wormhole/magic-wormhole)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/magic-wormhole/magic-wormhole/HEAD/README.md) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://raw.githubusercontent.com/magic-wormhole/magic-wormhole/HEAD/docs/welcome.rst) (2026-11-14; platforms); [Official application license text](https://raw.githubusercontent.com/magic-wormhole/magic-wormhole/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/magic-wormhole/magic-wormhole) (2026-11-14; downloads); [Official project identity and product page](https://magic-wormhole.readthedocs.io/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/magic-wormhole/magic-wormhole/releases.atom) (2026-11-14; maintenance)
### OnionShare

Desktop sharing tool that uses Tor onion services for files, websites and chat.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0; bundled third-party components have separate licenses. **Pricing model:** unknown.
- **Pick for:** Useful when a sharing workflow should use Tor instead of exposing an ordinary public server address.
- **Compare when:** Transfers depend on Tor connectivity and the sender keeping the service available.
- **Strengths:** Useful when a sharing workflow should use Tor instead of exposing an ordinary public server address.
- **Limitations:** Transfers depend on Tor connectivity and the sender keeping the service available.; An onion address alone does not prevent the recipient from redistributing shared material.
- **Maintenance:** active — Official release-feed entry 'OnionShare 2.7.2' updated 2026-11-07. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/onionshare/onionshare/releases.atom))
- [Official project](https://onionshare.org/) · [Official installation / downloads](https://onionshare.org/) · [Repository](https://github.com/onionshare/onionshare)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/onionshare/onionshare/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/onionshare/onionshare/HEAD/LICENSE.txt) (2026-11-14; license); [Official download or installation landing page](https://onionshare.org/) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/onionshare/onionshare/releases.atom) (2026-11-14; maintenance)
### PairDrop

Browser-based file sharing for nearby devices, paired devices and temporary transfer rooms.

- **Platforms:** Web. **License:** GPL-3.0. **Pricing model:** unknown.
- **Compatibility details:** Runs in a modern web browser; self-hosting requires the documented server/container environment.
- **Pick for:** Fits occasional transfers across operating systems when installing a desktop client is inconvenient.
- **Compare when:** Modern browser and network permissions are required.
- **Strengths:** Fits occasional transfers across operating systems when installing a desktop client is inconvenient.
- **Limitations:** Modern browser and network permissions are required.; Internet transfers may use a TURN relay; a browser transfer is not durable cloud storage.
- **Maintenance:** unverified — Official release-feed entry 'v1.11.2' updated 2025-02-24. Feed activity can include prereleases; it does not establish installed stability. The reviewed feed does not establish recent maintenance. ([evidence](https://github.com/schlagmichdoch/PairDrop/releases.atom))
- [Official project](https://pairdrop.net/) · [Official installation / downloads](https://github.com/schlagmichdoch/PairDrop) · [Repository](https://github.com/schlagmichdoch/PairDrop)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/schlagmichdoch/PairDrop/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/schlagmichdoch/PairDrop/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/schlagmichdoch/PairDrop) (2026-11-14; downloads); [Official project identity and product page](https://pairdrop.net/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/schlagmichdoch/PairDrop/releases.atom) (2026-11-14; maintenance)

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
- **Sources:** [Official project documentation](https://anydesk.com/) (2026-11-14; identity, features, pricing); [Official AnyDesk downloads](https://anydesk.com/en/downloads) (2026-11-14; platforms, downloads); [Official application license agreement](https://anydesk.com/en/terms) (2026-11-14; license)
### Apache Guacamole

Browser-based remote desktop gateway supporting RDP, VNC and SSH.

- **Platforms:** Web, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful when users need remote access through a browser without installing a local client.
- **Compare when:** Requires a deployed gateway and reachable target services
- **Strengths:** Useful when users need remote access through a browser without installing a local client.
- **Limitations:** Requires a deployed gateway and reachable target services; Gateway capacity and authentication need administration.
- **Maintenance:** active — Official release feed contains activity dated 2025-06-23. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/apache/guacamole-client/releases.atom))
- [Official project](https://guacamole.apache.org/) · [Official installation / downloads](https://guacamole.apache.org/releases/) · [Repository](https://github.com/apache/guacamole-client)
- **Sources:** [Official project documentation](https://guacamole.apache.org/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/apache/guacamole-client) (2026-11-14; identity, features); [Official download or installation landing page](https://guacamole.apache.org/releases/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/apache/guacamole-client/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/apache/guacamole-client/releases.atom) (2026-11-14; maintenance)
### FreeRDP

Open-source implementation and clients for the Remote Desktop Protocol.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** unknown.
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
- **Sources:** [Official project documentation](https://remmina.org/) (2026-11-14; features, identity, platforms, pricing); [Official source repository and README](https://github.com/FreeRDP/Remmina) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://remmina.org/how-to-install-remmina/) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/FreeRDP/Remmina/HEAD/LICENSE) (2026-11-14; license); [Official release activity](https://github.com/FreeRDP/Remmina/releases.atom) (2026-11-14; maintenance)
### RustDesk

Remote desktop application supporting public infrastructure or a self-hosted server.

- **Platforms:** Windows, macOS, Linux. **License:** AGPL-3.0 client; separate server Pro licensing. **Pricing model:** freemium.
- **Pick for:** Useful when controlling remote PCs with the option to operate your own coordination servers.
- **Compare when:** Unattended access needs careful authentication and permissions
- **Strengths:** Useful when controlling remote PCs with the option to operate your own coordination servers.
- **Limitations:** Unattended access needs careful authentication and permissions; Open-source server and paid Server Pro capabilities differ.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-11. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/rustdesk/rustdesk/releases.atom))
- [Official project](https://rustdesk.com/) · [Official installation / downloads](https://rustdesk.com/download) · [Repository](https://github.com/rustdesk/rustdesk)
- **Sources:** [Official project documentation](https://rustdesk.com/) (2026-11-14; identity, features, platforms); [Official source repository and README](https://github.com/rustdesk/rustdesk) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://rustdesk.com/download) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/rustdesk/rustdesk/HEAD/LICENCE) (2026-11-14; license); [Official release activity](https://github.com/rustdesk/rustdesk/releases.atom) (2026-11-14; maintenance); [Official distribution price or edition policy](https://rustdesk.com/pricing.html) (2026-11-14; pricing)
### TeamViewer Remote

Remote support and access software for desktop devices.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary; personal and commercial terms differ. **Pricing model:** freemium.
- **Pick for:** Useful when a support recipient already uses the TeamViewer ecosystem.
- **Compare when:** Commercial use requires paid licensing
- **Strengths:** Useful when a support recipient already uses the TeamViewer ecosystem.
- **Limitations:** Commercial use requires paid licensing; Features and device limits depend on plan and platform.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.teamviewer.com/) · [Official installation / downloads](https://www.teamviewer.com/en/download/)
- **Sources:** [Official project documentation](https://www.teamviewer.com/) (2026-11-14; identity, features, pricing); [Official TeamViewer downloads](https://www.teamviewer.com/en/download/) (2026-11-14; platforms, downloads); [Official application license agreement](https://www.teamviewer.com/en/legal/eula/) (2026-11-14; license)
### TigerVNC

VNC client and server implementation for remote graphical desktop access.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Pick for:** Useful for interoperable VNC access to remote graphical sessions.
- **Compare when:** Server availability and session behavior differ by OS
- **Strengths:** Useful for interoperable VNC access to remote graphical sessions.
- **Limitations:** Server availability and session behavior differ by OS; Configure secure authentication and transport before exposing access.
- **Maintenance:** active — Official release feed contains activity dated 2026-03-26. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/TigerVNC/tigervnc/releases.atom))
- [Official project](https://tigervnc.org/) · [Official installation / downloads](https://tigervnc.org/) · [Repository](https://github.com/TigerVNC/tigervnc)
- **Sources:** [Official project documentation](https://tigervnc.org/) (2026-11-14; identity, features, platforms, downloads); [Official source repository and README](https://github.com/TigerVNC/tigervnc) (2026-11-14; identity, features, platforms); [Official source license](https://raw.githubusercontent.com/TigerVNC/tigervnc/HEAD/LICENCE.TXT) (2026-11-14; license); [Official release activity](https://github.com/TigerVNC/tigervnc/releases.atom) (2026-11-14; maintenance)
### xrdp

RDP server for Unix-like systems that allows compatible clients to open graphical sessions.

- **Platforms:** Linux. **License:** Apache-2.0. **Pricing model:** unknown.
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
- **Sources:** [Official project documentation](https://mountainduck.io/) (2026-11-14; identity, features, platforms, pricing, downloads, maintenance); [Official application license agreement](https://mountainduck.io/buy/eula/) (2026-11-14; license)
### SSHFS

FUSE-based filesystem client that mounts a remote directory over SFTP.

- **Platforms:** Linux, macOS, FreeBSD. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux is the main documented distribution target; macOS and BSD require their platform FUSE integration.
- **Pick for:** Fits Unix-like workflows that need a server directory mounted without installing a new server protocol.
- **Compare when:** The project reports limited maintainer capacity and known issues.
- **Strengths:** Fits Unix-like workflows that need a server directory mounted without installing a new server protocol.
- **Limitations:** The project reports limited maintainer capacity and known issues.; Requires FUSE support and compatible SSH/SFTP services; network latency affects filesystem operations.
- **Maintenance:** active — Official release-feed entry 'SSHFS 3.7.7' updated 2026-11-11. Feed activity can include prereleases; it does not establish installed stability. The README also says regular active contributors are unavailable and maintainer capacity is limited to critical/high-impact issues. ([evidence](https://github.com/libfuse/sshfs/releases.atom))
- [Official project](https://github.com/libfuse/sshfs) · [Official installation / downloads](https://github.com/libfuse/sshfs) · [Repository](https://github.com/libfuse/sshfs)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/libfuse/sshfs/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/libfuse/sshfs/HEAD/COPYING) (2026-11-14; license); [Official download or installation landing page](https://github.com/libfuse/sshfs) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/libfuse/sshfs/releases.atom) (2026-11-14; maintenance)
### SSHFS-Win

Windows port of SSHFS for presenting an SSH/SFTP directory as a mapped drive.

- **Platforms:** Windows. **License:** GPL-2.0-or-later; WinFsp and bundled components use additional open-source licenses. **Pricing model:** unknown.
- **Compatibility details:** Windows client; the remote machine needs an SSH server with SFTP support.
- **Pick for:** Useful for Windows workflows that need an SSH-hosted folder to appear as a drive.
- **Compare when:** Requires WinFsp and an accessible SFTP server.
- **Strengths:** Useful for Windows workflows that need an SSH-hosted folder to appear as a drive.
- **Limitations:** Requires WinFsp and an accessible SFTP server.; The reviewed release feed is old; test current Windows and authentication compatibility before relying on it.; Documented key-mapping modes have passphrase restrictions.
- **Maintenance:** unverified — Official release-feed entry 'SSHFS-Win 2021.1 Beta2' updated 2021-02-03. Feed activity can include prereleases; it does not establish installed stability. The reviewed feed does not establish recent maintenance. ([evidence](https://github.com/winfsp/sshfs-win/releases.atom))
- [Official project](https://github.com/winfsp/sshfs-win) · [Official installation / downloads](https://github.com/winfsp/sshfs-win) · [Repository](https://github.com/winfsp/sshfs-win)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/winfsp/sshfs-win/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/winfsp/sshfs-win/HEAD/License.txt) (2026-11-14; license); [Official download or installation landing page](https://github.com/winfsp/sshfs-win) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/winfsp/sshfs-win/releases.atom) (2026-11-14; maintenance)

## Remote management

### MeshCentral

Self-hosted device management platform with browser-based remote desktop, terminal and file access.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Apache-2.0. **Pricing model:** unknown.
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

- **Platforms:** Windows, macOS, Linux. **License:** BSD-style licenses; component notices apply. **Pricing model:** unknown.
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
- **Compatibility details:** Official Windows executables and Unix source releases are available; some Linux distributions provide packages. The current FAQ states that the core project has no release-quality native macOS port.
- **Pick for:** Choose PuTTY for SSH or serial terminal sessions with saved connection settings.
- **Compare when:** Compare Windows Terminal with OpenSSH for a broader terminal workspace, or WinSCP when graphical file transfer is the main task.
- **Strengths:** SSH terminal and transfer companions
- **Limitations:** PSCP and PSFTP are command-line file-transfer companions; the main PuTTY window is a terminal client.; Host-key prompts identify the remote server and need to be checked; saved sessions do not eliminate server authentication requirements.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://www.chiark.greenend.org.uk/~sgtatham/putty/) · [Official installation / downloads](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
- **Sources:** [Preserved original research source](https://www.chiark.greenend.org.uk/~sgtatham/putty/) (2026-11-14; identity, features); [Preserved original research source](https://www.chiark.greenend.org.uk/~sgtatham/putty/licence.html) (2026-11-14; identity, features); [Official capabilities and practical usage basis](https://www.chiark.greenend.org.uk/~sgtatham/putty/faq.html) (2026-11-15; features, platforms, pricing); [Official PuTTY stable downloads](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html) (2026-11-14; downloads, platforms)

## Self Hosted File Servers

### copyparty

Self-hosted file server with a browser interface and resumable upload and download workflows.

- **Platforms:** Windows, macOS, Linux, Web. **License:** MIT; optional bundled components retain their own licenses. **Pricing model:** unknown.
- **Compatibility details:** Python server with documented Linux, macOS/Homebrew and Windows execution; browser clients are platform independent.
- **Pick for:** Useful for serving a personal file collection through browsers while keeping control of the host and storage.
- **Compare when:** The operator must configure authentication, TLS and reachable directories appropriately.
- **Strengths:** Useful for serving a personal file collection through browsers while keeping control of the host and storage.
- **Limitations:** The operator must configure authentication, TLS and reachable directories appropriately.; Optional media features and additional protocols require dependencies and configuration.
- **Maintenance:** active — Official release-feed entry 'one 20 26' updated 2026-10-15. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/9001/copyparty/releases.atom))
- [Official project](https://github.com/9001/copyparty) · [Official installation / downloads](https://github.com/9001/copyparty) · [Repository](https://github.com/9001/copyparty)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/9001/copyparty/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/9001/copyparty/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/9001/copyparty) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/9001/copyparty/releases.atom) (2026-11-14; maintenance)
### SFTPGo Community

Managed file-transfer server connecting standard protocols to local or cloud storage.

- **Platforms:** Windows, Linux, Web. **License:** AGPL-3.0-only with additional terms; proprietary WebAdmin/WebClient theme restrictions. **Pricing model:** free.
- **Compatibility details:** Windows and Linux server deployment; Web refers to its browser interface. Enterprise and SaaS products have separate terms.
- **Pick for:** Fits self-hosted file exchange that needs per-user storage access and familiar transfer protocols.
- **Compare when:** The web interface theme has separate reuse restrictions; the full product is not uniformly open source.
- **Strengths:** Fits self-hosted file exchange that needs per-user storage access and familiar transfer protocols.
- **Limitations:** The web interface theme has separate reuse restrictions; the full product is not uniformly open source.; Enterprise-only automation and support must not be assumed to be in the Community edition.
- **Maintenance:** active — Official release-feed entry 'v2.7.6' updated 2026-09-19. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/drakkan/sftpgo/releases.atom))
- [Official project](https://github.com/drakkan/sftpgo) · [Official installation / downloads](https://github.com/drakkan/sftpgo) · [Repository](https://github.com/drakkan/sftpgo)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/drakkan/sftpgo/HEAD/README.md) (2026-11-14; features, identity, license, platforms, pricing); [Official supported-platform and installation documentation](https://github.com/drakkan/sftpgo/releases.atom) (2026-11-14; maintenance, platforms); [Official application license text](https://raw.githubusercontent.com/drakkan/sftpgo/HEAD/LICENSE) (2026-11-14; license); [Official additional licensing terms and theme restrictions](https://raw.githubusercontent.com/drakkan/sftpgo/HEAD/NOTICE) (2026-11-14; license); [Official download or installation landing page](https://github.com/drakkan/sftpgo) (2026-11-14; downloads, identity)

## Service Monitoring

### Uptime Kuma

Self-hosted availability monitor with status pages and notification integrations.

- **Platforms:** Windows, Linux, Web. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Official README supports major Linux distributions and Windows; Docker and native Node.js setup have separate prerequisites.
- **Pick for:** Useful for checking whether personal services remain reachable and surfacing outages.
- **Compare when:** The monitoring host must stay running and have a useful network vantage point.
- **Strengths:** Useful for checking whether personal services remain reachable and surfacing outages.
- **Limitations:** The monitoring host must stay running and have a useful network vantage point.; Availability checks do not establish application correctness or diagnose every outage.
- **Maintenance:** active — Official release-feed entry '2.5.11' updated 2026-11-12. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/louislam/uptime-kuma/releases.atom))
- [Official project](https://github.com/louislam/uptime-kuma) · [Official installation / downloads](https://github.com/louislam/uptime-kuma) · [Repository](https://github.com/louislam/uptime-kuma)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/louislam/uptime-kuma/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/louislam/uptime-kuma/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/louislam/uptime-kuma) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/louislam/uptime-kuma/releases.atom) (2026-11-14; maintenance)

## Traffic and connection monitoring

### bandwhich

Terminal bandwidth monitor organized by process, connection and remote address.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Windows requires the documented packet-capture dependencies; capabilities vary by OS.
- **Pick for:** Useful for finding which process is using network bandwidth on a Unix-like desktop.
- **Compare when:** Packet capture needs elevated access
- **Strengths:** Useful for finding which process is using network bandwidth on a Unix-like desktop.
- **Limitations:** Packet capture needs elevated access; Process attribution and interface behavior vary by platform.
- **Maintenance:** unverified — The project explicitly states passive maintenance: critical issues are addressed, with no new features planned. ([evidence](https://github.com/imsnif/bandwhich))
- [Official project](https://github.com/imsnif/bandwhich) · [Official installation / downloads](https://github.com/imsnif/bandwhich/releases) · [Repository](https://github.com/imsnif/bandwhich)
- **Sources:** [Official project documentation](https://github.com/imsnif/bandwhich) (2026-11-14; identity, features, platforms, maintenance); [Official download or installation landing page](https://github.com/imsnif/bandwhich/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/imsnif/bandwhich/HEAD/LICENSE.md) (2026-11-14; license); [Official public application distribution](https://github.com/imsnif/bandwhich/releases/expanded_assets/v0.23.1) (2026-11-14; pricing)
### bmon

Terminal bandwidth monitor with interface statistics and scriptable output.

- **Platforms:** macOS, Linux, FreeBSD. **License:** BSD-2-Clause and MIT. **Pricing model:** unknown.
- **Compatibility details:** Current maintained repository documents Linux, macOS and FreeBSD builds.
- **Pick for:** Useful for watching interface throughput in a terminal without a full packet capture.
- **Compare when:** Interface counters do not identify application payloads or every process.
- **Strengths:** Useful for watching interface throughput in a terminal without a full packet capture.
- **Limitations:** Interface counters do not identify application payloads or every process.; Data source and interface support vary by operating system.
- **Maintenance:** active — Official release-feed entry 'bmon 5.0' updated 2026-09-22. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/tgraf/bmon/releases.atom))
- [Official project](https://github.com/Jafaral/bmon) · [Official installation / downloads](https://github.com/Jafaral/bmon) · [Repository](https://github.com/Jafaral/bmon)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/tgraf/bmon/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/Jafaral/bmon/HEAD/LICENSE.BSD) (2026-11-14; license); [Official application license text](https://raw.githubusercontent.com/Jafaral/bmon/HEAD/LICENSE.MIT) (2026-11-14; license); [Official download or installation landing page](https://github.com/Jafaral/bmon) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/tgraf/bmon/releases.atom) (2026-11-14; maintenance)
### GlassWire

Windows network activity monitor with visual history and connection alerts.

- **Platforms:** Windows. **License:** Proprietary; free and paid plans. **Pricing model:** freemium.
- **Pick for:** Useful for understanding which Windows applications connect and how usage changes.
- **Compare when:** Plan limits and privacy settings differ
- **Strengths:** Useful for understanding which Windows applications connect and how usage changes.
- **Limitations:** Plan limits and privacy settings differ; Connection visibility alone does not establish whether traffic is malicious.
- **Maintenance:** unverified — Official project documentation retrieved; release cadence and installed behavior have not been audited.
- [Official project](https://www.glasswire.com/) · [Official installation / downloads](https://www.glasswire.com/download/)
- **Sources:** [Official project documentation](https://www.glasswire.com/) (2026-11-14; identity, features, pricing); [Official download or installation landing page](https://www.glasswire.com/download/) (2026-11-14; downloads, platforms); [Official application license agreement](https://www.glasswire.com/license/) (2026-11-14; license)
### NetHogs

Linux network monitor that groups bandwidth consumption by process.

- **Platforms:** Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Pick for:** Direct way to associate Linux traffic with the responsible process.
- **Compare when:** Requires sufficient packet-capture privileges
- **Strengths:** Direct way to associate Linux traffic with the responsible process.
- **Limitations:** Requires sufficient packet-capture privileges; Not a long-term traffic accounting database.
- **Maintenance:** active — Official release feed contains activity dated 2026-07-22. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/raboof/nethogs/releases.atom))
- [Official project](https://github.com/raboof/nethogs) · [Official installation / downloads](https://github.com/raboof/nethogs) · [Repository](https://github.com/raboof/nethogs)
- **Sources:** [Official project documentation](https://github.com/raboof/nethogs) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/raboof/nethogs/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/raboof/nethogs/releases.atom) (2026-11-14; maintenance)
### Sniffnet

Graphical network-traffic monitor showing captured connections, hosts and traffic statistics.

- **Platforms:** Windows, macOS, Linux. **License:** MIT OR Apache-2.0. **Pricing model:** free.
- **Pick for:** Useful for inspecting everyday network activity through a visual desktop interface.
- **Compare when:** Capture permissions and platform-specific packet-capture dependencies are required.
- **Strengths:** Useful for inspecting everyday network activity through a visual desktop interface.
- **Limitations:** Capture permissions and platform-specific packet-capture dependencies are required.; Observed metadata does not decrypt encrypted application payloads.
- **Maintenance:** active — Official release-feed entry 'v1.5.1' updated 2026-07-22. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/GyulyVGC/sniffnet/releases.atom))
- [Official project](https://sniffnet.app/) · [Official installation / downloads](https://sniffnet.app/download/) · [Repository](https://github.com/GyulyVGC/sniffnet)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/GyulyVGC/sniffnet/HEAD/README.md) (2026-11-14; features, identity, platforms, pricing); [Official application license text](https://raw.githubusercontent.com/GyulyVGC/sniffnet/HEAD/LICENSE-MIT) (2026-11-14; license); [Official application license text](https://raw.githubusercontent.com/GyulyVGC/sniffnet/HEAD/LICENSE-APACHE) (2026-11-14; license); [Official download or installation landing page](https://sniffnet.app/download/) (2026-11-14; downloads); [Official project identity and product page](https://sniffnet.app/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/GyulyVGC/sniffnet/releases.atom) (2026-11-14; maintenance)
### TCPView

Lists TCP/UDP endpoints and owning processes.

- **Platforms:** Windows. **License:** Microsoft Sysinternals Software License Terms (proprietary).. **Pricing model:** free.
- **Compatibility details:** Windows 8.1 or newer, or Windows Server 2012 or newer, according to the official download page.
- **Pick for:** Choose TCPView to associate current Windows TCP and UDP endpoints with their owning processes.
- **Compare when:** Compare Wireshark for packet contents or Sysmon for configured historical connection telemetry.
- **Strengths:** Lists TCP/UDP endpoints and owning processes.
- **Limitations:** It shows endpoint state rather than a full packet capture or long-term traffic history.; Closing a connection interrupts that session; connection ownership alone does not establish whether traffic is trustworthy.
- **Maintenance:** unverified — Official product page lists a release published 2023-04-11. This older release date does not establish current release activity. ([evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview))
- [Official project](https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview) · [Official installation / downloads](https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview)
- **Sources:** [Official release or lifecycle evidence](https://learn.microsoft.com/en-us/sysinternals/downloads/tcpview) (2026-11-15; downloads, features, identity, maintenance, platforms); [Microsoft Sysinternals license terms](https://learn.microsoft.com/en-us/sysinternals/license-terms) (2026-11-15; license); [Microsoft application archive publicly available without payment](https://download.sysinternals.com/files/TCPView.zip) (2026-11-15; downloads, pricing)

## VPN clients and protocols

### OpenVPN Community

Open-source VPN software for client/server encrypted network access.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 with exceptions for Community software. **Pricing model:** unknown.
- **Pick for:** Useful for existing infrastructure that already uses OpenVPN profiles and servers.
- **Compare when:** Community software and commercial OpenVPN services differ
- **Strengths:** Useful for existing infrastructure that already uses OpenVPN profiles and servers.
- **Limitations:** Community software and commercial OpenVPN services differ; Server setup, certificate lifecycle and routing need administration.
- **Maintenance:** active — Official release feed contains activity dated 2026-11-06. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/OpenVPN/openvpn/releases.atom))
- [Official project](https://github.com/OpenVPN/openvpn) · [Official installation / downloads](https://github.com/OpenVPN/openvpn/releases) · [Repository](https://github.com/OpenVPN/openvpn)
- **Sources:** [Official project documentation](https://github.com/OpenVPN/openvpn) (2026-11-14; identity, features, platforms); [Official download or installation landing page](https://github.com/OpenVPN/openvpn/releases) (2026-11-14; downloads); [Official source license](https://raw.githubusercontent.com/OpenVPN/openvpn/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/OpenVPN/openvpn/releases.atom) (2026-11-14; maintenance)
### SoftEther VPN

Cross-platform VPN suite supporting multiple VPN protocols and server deployment modes.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Official README lists Windows, Linux, macOS and FreeBSD; component support differs by OS.
- **Pick for:** Useful when a self-hosted VPN must interoperate with several client or protocol types.
- **Compare when:** The development repository contains experimental code; select the appropriate stable distribution.
- **Strengths:** Useful when a self-hosted VPN must interoperate with several client or protocol types.
- **Limitations:** The development repository contains experimental code; select the appropriate stable distribution.; Server, bridge and client capabilities differ across operating systems.
- **Maintenance:** active — Official release-feed entry '5.2.5189' updated 2026-11-05. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/SoftEtherVPN/SoftEtherVPN/releases.atom))
- [Official project](https://www.softether.org/) · [Official installation / downloads](https://www.softether-download.com/) · [Repository](https://github.com/SoftEtherVPN/SoftEtherVPN)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/SoftEtherVPN/SoftEtherVPN/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/SoftEtherVPN/SoftEtherVPN/HEAD/LICENSE) (2026-11-14; license); [Official price or edition-policy statement](https://www.softether-download.com/) (2026-11-14; downloads, pricing); [Official project identity and product page](https://www.softether.org/) (2026-11-14; identity); [Official release activity or lifecycle basis](https://github.com/SoftEtherVPN/SoftEtherVPN/releases.atom) (2026-11-14; maintenance)
### strongSwan

IPsec and IKE VPN implementation for client, gateway and site-to-site configurations.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** GPL-2.0-or-later with exceptions; commercial licenses available. **Pricing model:** mixed.
- **Compatibility details:** Official site lists Linux plus ports to FreeBSD, macOS and Windows; specific daemon and plugin capabilities vary.
- **Pick for:** Fits standards-based VPN deployments that need detailed control over authentication and routing.
- **Compare when:** Configuration complexity is greater than a managed consumer VPN.
- **Strengths:** Fits standards-based VPN deployments that need detailed control over authentication and routing.
- **Limitations:** Configuration complexity is greater than a managed consumer VPN.; Supported plugins and operating-system integration differ by platform; commercial licensing is separate.
- **Maintenance:** active — Official release-feed entry 'strongSwan 6.1.0' updated 2026-09-07. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/strongswan/strongswan/releases.atom))
- [Official project](https://www.strongswan.org/) · [Official installation / downloads](https://www.strongswan.org/) · [Repository](https://github.com/strongswan/strongswan)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/strongswan/strongswan/HEAD/README.md) (2026-11-14; features, identity); [Official supported-platform and installation documentation](https://www.strongswan.org/) (2026-11-14; downloads, identity, platforms, pricing); [Official application license text](https://raw.githubusercontent.com/strongswan/strongswan/HEAD/LICENSE) (2026-11-14; license); [Official release activity or lifecycle basis](https://github.com/strongswan/strongswan/releases.atom) (2026-11-14; maintenance)
### WireGuard

VPN protocol and implementations for encrypted network tunnels.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 for wireguard-tools; other components vary. **Pricing model:** unknown.
- **Pick for:** A focused foundation for connecting devices or networks under your control.
- **Compare when:** Peer discovery, identity management and routing are separate configuration concerns
- **Strengths:** A focused foundation for connecting devices or networks under your control.
- **Limitations:** Peer discovery, identity management and routing are separate configuration concerns; A tunnel does not itself provide an Internet VPN service.
- **Maintenance:** active — Official release feed contains activity dated 2026-02-23. This may include prereleases and is not a runtime or stability certification. ([evidence](https://github.com/WireGuard/wireguard-tools/releases.atom))
- [Official project](https://github.com/WireGuard/wireguard-tools) · [Official installation / downloads](https://github.com/WireGuard/wireguard-tools) · [Repository](https://github.com/WireGuard/wireguard-tools)
- **Sources:** [Official project documentation](https://github.com/WireGuard/wireguard-tools) (2026-11-14; identity, features, platforms, downloads); [Official source license](https://raw.githubusercontent.com/WireGuard/wireguard-tools/HEAD/COPYING) (2026-11-14; license); [Official release activity](https://github.com/WireGuard/wireguard-tools/releases.atom) (2026-11-14; maintenance)

## Vpn Clients

### OpenConnect

Multi-protocol SSL VPN client interoperating with several enterprise VPN gateways.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** LGPL-2.1. **Pricing model:** unknown.
- **Compatibility details:** Use the official supported-platform list and frontend documentation; protocol support does not imply every vendor feature works.
- **Pick for:** Fits connecting a supported workstation to an existing compatible organizational VPN gateway.
- **Compare when:** Gateway features, authentication methods and organizational policy determine compatibility.
- **Strengths:** Fits connecting a supported workstation to an existing compatible organizational VPN gateway.
- **Limitations:** Gateway features, authentication methods and organizational policy determine compatibility.; It is independently developed and not vendor-endorsed support for those gateways.
- **Maintenance:** unverified — Current official download/platform documentation was reviewed; the older GitHub mirror release feed does not establish current activity at the canonical GitLab upstream. ([evidence](https://www.infradead.org/openconnect/download.html))
- [Official project](https://www.infradead.org/openconnect/) · [Official installation / downloads](https://www.infradead.org/openconnect/download.html) · [Repository](https://gitlab.com/openconnect/openconnect)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/openconnect/openconnect/HEAD/README.md) (2026-11-14; features, identity, license); [Official supported-platform and installation documentation](https://www.infradead.org/openconnect/platforms.html) (2026-11-14; platforms); [Official download or installation landing page](https://www.infradead.org/openconnect/download.html) (2026-11-14; downloads, maintenance); [Official project identity and product page](https://www.infradead.org/openconnect/) (2026-11-14; identity)

## Web browsers

### Brave

Chromium-based browser with integrated tracking protection and optional additional services.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Use Chromium-compatible browsing with built-in blocking controls.
- **Compare when:** Bundled optional services and defaults should be reviewed against personal preferences.
- **Strengths:** Chromium site compatibility is combined with built-in controls for tracker and ad blocking.
- **Limitations:** Bundled optional services and defaults should be reviewed against personal preferences.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/brave/brave-browser))
- [Official project](https://brave.com/) · [Official installation / downloads](https://github.com/brave/brave-browser/releases) · [Repository](https://github.com/brave/brave-browser)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/brave/brave-browser) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/brave/brave-browser/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://brave.com/) (2026-11-14; identity, features, platforms); [Official release inspected: v1.99.57](https://github.com/brave/brave-browser/releases/tag/v1.99.57) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/brave/brave-browser/releases/download/v1.99.57/Brave-Browser-x64.dmg) (2026-11-15; downloads, pricing)
### Firefox

General-purpose browser using Mozilla's Gecko engine with extensions, synchronization, and privacy controls.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 for Mozilla code; included components have separate license notices. **Pricing model:** free.
- **Pick for:** Browse with an alternative browser engine and configurable privacy settings.
- **Compare when:** Site compatibility and preferred extension behavior should be tested for your workflow.
- **Strengths:** Gecko offers a separately developed browser engine with a configurable extension ecosystem.
- **Limitations:** Site compatibility and preferred extension behavior should be tested for your workflow.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mozilla-firefox/firefox))
- [Official project](https://www.firefox.com/) · [Official installation / downloads](https://www.firefox.com/en-US/download/all/) · [Repository](https://github.com/mozilla-firefox/firefox)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mozilla-firefox/firefox) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/mozilla-firefox/firefox/HEAD/README.md) (2026-11-14; identity); [Official license text](https://raw.githubusercontent.com/mozilla-firefox/firefox/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://www.firefox.com/) (2026-11-14; identity, features, platforms); [Official license canonical documentation](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/toolkit/content/license.html.mako) (2026-11-14; license); [Official Firefox distribution selector](https://www.firefox.com/en-US/download/all/) (2026-11-14; downloads, platforms); [Official source: Mozilla explicitly states that the browser has no usage charge and supports Windows, macOS and Linux.](https://www.firefox.com/en-US/more/faq/) (2026-11-14; pricing, platforms)
### Floorp

Firefox-based browser with workspaces, split views, web panels and interface customization.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 with separately licensed third-party components. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Keep reference pages, tools and separate accounts together while browsing.
- **Compare when:** Container isolation separates sessions rather than all browser data; website and extension behavior still needs a personal compatibility check.
- **Strengths:** Built-in layout controls help compare pages while keeping frequently used sites alongside the main view.
- **Limitations:** Container isolation separates sessions rather than all browser data; website and extension behavior still needs a personal compatibility check.
- **Maintenance:** active — An upstream release was observed dated 2026-11-13. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/Floorp-Projects/Floorp/releases/tag/v12.21.2))
- [Official project](https://floorp.app/) · [Official installation / downloads](https://floorp.app/download) · [Repository](https://github.com/Floorp-Projects/Floorp)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/Floorp-Projects/Floorp/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/Floorp-Projects/Floorp/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://floorp.app/download) (2026-11-14; downloads); [Official documentation: Free Firefox-derived browser for Windows, macOS and Linux with workspace and sidebar customization.](https://floorp.app/) (2026-11-14; platforms, pricing, features); [Official documentation: Split-view features and layout controls.](https://docs.floorp.app/docs/features/split-view/) (2026-11-14; features); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/Floorp-Projects/Floorp/releases/download/v12.21.2/floorp-12.21.2.deb) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/Floorp-Projects/Floorp/releases/tag/v12.21.2) (2026-11-14; downloads, maintenance)
### LibreWolf

Independent Firefox-based browser with privacy-oriented settings, removed telemetry, and an included content blocker.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 for LibreWolf code; dependencies retain their terms. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Use a Firefox-derived browser configured around tracking resistance and minimal telemetry.
- **Compare when:** Stricter defaults can affect site behavior, and DRM media compatibility differs from default Firefox settings.
- **Strengths:** Privacy-oriented defaults and an included blocker reduce the configuration needed for that browsing preference.
- **Limitations:** Stricter defaults can affect site behavior, and DRM media compatibility differs from default Firefox settings.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://librewolf.net/))
- [Official project](https://librewolf.net/) · [Official installation / downloads](https://librewolf.net/installation/)
- **Sources:** [Official project scope and features](https://librewolf.net/) (2026-11-14; identity, features); [Official platform installation instructions](https://librewolf.net/installation/) (2026-11-14; downloads, platforms); [Official software license declaration](https://librewolf.net/license-disclaimers/) (2026-11-14; license); [Public upstream app/package distribution: availability without payment or authentication checked](https://dl.librewolf.net/librewolf/159.0.1-1/librewolf-159.0.1-1-windows-x86_64-setup.exe) (2026-11-14; downloads, pricing)
### Nyxt

Lisp-extensible keyboard browser with fuzzy tab switching, multi-selection and structured bookmark commands.

- **Platforms:** Linux. **License:** BSD-3-Clause with separately licensed dependencies. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Build a command-driven browsing workflow on Linux.
- **Compare when:** The reviewed supported release path is GNU/Linux; macOS and Windows are in development and the interaction model requires learning.
- **Strengths:** Commands can operate across tabs and bookmarks for highly customized browsing workflows.
- **Limitations:** The reviewed supported release path is GNU/Linux; macOS and Windows are in development and the interaction model requires learning.
- **Maintenance:** active — An upstream release was observed dated 2026-01-18. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/atlas-engineer/nyxt/releases/tag/4.0.0))
- [Official project](https://nyxt-browser.com/) · [Official installation / downloads](https://flathub.org/en/apps/engineer.atlas.Nyxt) · [Repository](https://github.com/atlas-engineer/nyxt)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/atlas-engineer/nyxt/HEAD/README.org) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/atlas-engineer/nyxt/HEAD/nyxt.asd) (2026-11-14; license); [Official downloads or installation instructions](https://flathub.org/en/apps/engineer.atlas.Nyxt) (2026-11-14; downloads); [Official documentation: GNU/Linux is the primary supported platform; the current repository identifies macOS and Windows work as in development.](https://nyxt.atlas.engineer/download) (2026-11-14; platforms, downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/atlas-engineer/nyxt/releases/download/4.0.0/Linux-Nyxt-x86_64.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/atlas-engineer/nyxt/releases/tag/4.0.0) (2026-11-14; downloads, maintenance)
### qutebrowser

Keyboard-focused web browser with a minimal interface, command controls and configurable keybindings.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0-or-later. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Browse primarily through keyboard commands and link hints.
- **Compare when:** QtWebEngine packaging determines codec and security-update behavior; it does not offer the ordinary Chrome/Firefox extension ecosystem.
- **Strengths:** Keyboard-centric navigation can reduce dependence on pointer-driven browser controls.
- **Limitations:** QtWebEngine packaging determines codec and security-update behavior; it does not offer the ordinary Chrome/Firefox extension ecosystem.
- **Maintenance:** active — An upstream release was observed dated 2026-04-03. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/qutebrowser/qutebrowser/releases/tag/v3.7.0))
- [Official project](https://qutebrowser.org/) · [Official installation / downloads](https://qutebrowser.org/INSTALL.html) · [Repository](https://github.com/qutebrowser/qutebrowser)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/qutebrowser/qutebrowser/HEAD/README.asciidoc) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/qutebrowser/qutebrowser/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://qutebrowser.org/INSTALL.html) (2026-11-14; downloads, platforms); [Official documentation: Keyboard-oriented Python/Qt browser under GPL-3.0-or-later.](https://www.qutebrowser.org/) (2026-11-14; features, license); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/qutebrowser/qutebrowser/releases/download/v3.7.0/qutebrowser-3.7.0-amd64.exe) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/qutebrowser/qutebrowser/releases/tag/v3.7.0) (2026-11-14; downloads, maintenance)
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
- **Sources:** [Official feature descriptions](https://vivaldi.com/features/) (2026-11-14; identity, features); [Official platform download selector](https://vivaldi.com/download/) (2026-11-14; downloads, platforms); [Official executable and third-party license scope](https://vivaldi.com/privacy/vivaldi-end-user-license-agreement/) (2026-11-14; license); [Official source: The vendor explicitly describes providing the browser free of charge through partner revenue.](https://vivaldi.com/privacy/browser/) (2026-11-14; pricing)
### Waterfox

Firefox-derived browser with interface customization, private tabs and built-in blocking controls.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 and other licenses documented in the Mozilla-derived codebase. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** The reviewed upstream source is distributed at no charge and includes a documented build/install route. This does not establish free prebuilt binaries for every platform.
- **Pick for:** Use Firefox-compatible extensions with additional tab and privacy controls.
- **Compare when:** Independent maintenance and search-service choices differ from Firefox; Chrome-only extensions do not transfer automatically.
- **Strengths:** Private tabs and tree organization offer additional session and tab controls in a Gecko-based browser.
- **Limitations:** Independent maintenance and search-service choices differ from Firefox; Chrome-only extensions do not transfer automatically.
- **Maintenance:** active — An upstream release was observed dated 2026-11-07. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/BrowserWorks/Waterfox/releases/tag/6.7.8))
- [Official project](https://www.waterfox.com/) · [Official installation / downloads](https://www.waterfox.com/download/) · [Repository](https://github.com/BrowserWorks/Waterfox)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/BrowserWorks/Waterfox/HEAD/README.md) (2026-11-14; downloads, features, identity); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/BrowserWorks/Waterfox/HEAD/toolkit/content/license.html) (2026-11-14; license); [Official downloads or installation instructions](https://www.waterfox.com/download/) (2026-11-14; downloads, platforms); [Official documentation: Free browser with private-tab and customization features; browser use does not require a premium plan.](https://www.waterfox.com/) (2026-11-14; features, pricing); [Public upstream source distribution; binary packaging is separate](https://github.com/BrowserWorks/Waterfox/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/BrowserWorks/Waterfox/releases/tag/6.7.8) (2026-11-14; downloads, maintenance)
### Zen Browser

Firefox-derived browser emphasizing workspaces, compact layouts and side-by-side page views.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Organize research pages and accounts into visual workspaces.
- **Compare when:** The reviewed FAQ reports missing Widevine DRM support on Windows and macOS; rapidly changing features should be checked before switching.
- **Strengths:** Related pages and separate sign-in contexts can be organized within one browser window.
- **Limitations:** The reviewed FAQ reports missing Widevine DRM support on Windows and macOS; rapidly changing features should be checked before switching.
- **Maintenance:** active — An upstream release was observed dated 2026-11-12. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/zen-browser/desktop/releases/tag/1.24.2b))
- [Official project](https://zen-browser.app/) · [Official installation / downloads](https://zen-browser.app/download/) · [Repository](https://github.com/zen-browser/desktop)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/zen-browser/desktop/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/zen-browser/desktop/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://zen-browser.app/download/) (2026-11-14; downloads); [Official documentation: The FAQ documents unavailable Widevine DRM on Windows/macOS and other compatibility limits.](https://docs.zen-browser.app/faq) (2026-11-14; features, platforms); [Official documentation: Workspace organization and container-based cookie separation have different scopes.](https://docs.zen-browser.app/user-manual/workspaces) (2026-11-14; features); [Official documentation: Split-view browsing places multiple tabs in one workspace.](https://docs.zen-browser.app/user-manual/split-view) (2026-11-14; features); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/zen-browser/desktop/releases/download/1.24.2b/zen-aarch64.AppImage) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/zen-browser/desktop/releases/tag/1.24.2b) (2026-11-14; downloads, maintenance)

## Wireless Diagnostics

### wavemon

Terminal wireless monitor showing signal, noise, device settings and packet statistics.

- **Platforms:** Linux. **License:** GPL-3.0-or-later; ISC-licensed third-party code. **Pricing model:** unknown.
- **Compatibility details:** Linux wireless-device tool; features vary with kernel and driver support.
- **Pick for:** Useful for inspecting a Linux Wi-Fi adapter from a terminal or remote shell.
- **Compare when:** Available measurements depend on the adapter and Linux driver.
- **Strengths:** Useful for inspecting a Linux Wi-Fi adapter from a terminal or remote shell.
- **Limitations:** Available measurements depend on the adapter and Linux driver.; It observes local wireless metrics; it does not establish total Internet throughput.
- **Maintenance:** active — Official release-feed entry '0.9.7' updated 2026-02-08. Feed activity can include prereleases; it does not establish installed stability. ([evidence](https://github.com/uoaerg/wavemon/releases.atom))
- [Official project](https://github.com/uoaerg/wavemon) · [Official installation / downloads](https://github.com/uoaerg/wavemon) · [Repository](https://github.com/uoaerg/wavemon)
- **Sources:** [Official project feature documentation](https://raw.githubusercontent.com/uoaerg/wavemon/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official application license text](https://raw.githubusercontent.com/uoaerg/wavemon/HEAD/LICENSE) (2026-11-14; license); [Official download or installation landing page](https://github.com/uoaerg/wavemon) (2026-11-14; downloads, identity); [Official release activity or lifecycle basis](https://github.com/uoaerg/wavemon/releases.atom) (2026-11-14; maintenance)
