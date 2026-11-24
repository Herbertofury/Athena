# Network analysis: release identity and import boundaries

[Research directory](../) · [Athena](../../README.md)

Reviewed **2026-11-15 UTC**. Official-source research only: no installation, live capture, private traffic inspection, exploit execution or comparison benchmark. This is an independent note, not a runtime/catalog change or a recommendation to replace any project's implementation. Noxviola's active index and concurrent Athena work were checked first. The existing November 14 Windows-utilities review already records Wireshark 4.6.9 and separate Npcap licensing. This pass adds the specific profile-import advisory, November 11 release-label discrepancy and development migration caveats; it does not claim those baseline facts or the September advisory appeared this hour.

## Verified stable advisory

Wireshark advisory **wnpa-sec-2026-106**, dated September 23, 2026, identifies crafted configuration-profile import as a crash and possible arbitrary-code-execution boundary. It lists affected versions 4.6.0–4.6.8 and 4.4.0–4.4.18, and fixed versions 4.6.9 and 4.4.19. The vendor says it knows of no exploits. This is an upstream advisory, not a reproduced finding or evidence that the user's computer is affected. Do not treat shared configuration profiles as harmless UI settings. [Official advisory](https://www.wireshark.org/security/wnpa-sec-2026-106).

## Release identity: preserve the discrepancy

At review, the [download page](https://www.wireshark.org/download.html) labels **4.6.9 stable**, **4.4.19 old stable**, and **5.0.0rc2 development**; Windows x64 and Arm64 installers are listed. The [release-note index](https://www.wireshark.org/docs/relnotes/) also tops out at 4.6.9 and 4.4.19. Do not turn a planned 4.6.10 date into a verified release: its expected release-note URL could not be retrieved in this pass.

The [November 11 news page](https://www.wireshark.org/news/20261111.html) is headed 5.0.0rc1 yet describes changes since rc1. This conflicts with the download page's rc2 label. Keep that provenance discrepancy rather than silently “correcting” the source or calling 5.0 stable.

The same development news describes a Windows minimum of Windows 10 21H2/build 19044 or Server 2022, separate Visual C++ redistributable installation for MSI, graceful Windows extcap shutdown, and migration of coloring rules to JSONC. These are development-track notes, not requirements asserted for every stable installer. Color-rule parsing, migration and shutdown behavior remain untested locally.

## Licensing and capture permission are separate gates

Wireshark's [official FAQ](https://www.wireshark.org/faq.html) describes GPLv2 licensing and distinguishes commercial use from redistribution/derivative-code obligations. Preserve applicable notices/source obligations when reusing code; this pass copied none.

Windows live capture requires Npcap, according to the download page. Npcap is not covered by a blanket “Wireshark is GPL” assumption: its [OEM licensing page](https://npcap.com/oem/) describes limits and exceptions for free installations and separate redistribution/silent-install rights. Review the actual deployment and license before bundling or scaling it. No license acceptance, driver installation or security-setting change was attempted.

## Bounded next evaluation, not a result

Use only permitted, synthetic packet fixtures and disposable profiles, with the exact binary version/hash recorded. Test offline parsing, filter correctness, JSONC migration/rejection, theme and small-screen accessibility, memory and UI latency. Do not run a public malicious-profile sample to reproduce the advisory in an ordinary desktop session. Live capture requires a separately authorized scope and must not collect or publish unrelated traffic, credentials or account details.

No measured performance, complete security assurance, stable-upgrade execution or implementation superiority is claimed. Release identity needs fresh verification before any later installation.
