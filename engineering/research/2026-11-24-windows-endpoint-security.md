# Windows endpoint security research delta, November 24, 2026

**Evidence: primary documented, with an unexecuted evaluation queue.** This additive research uses public upstream and Microsoft material only. It contains no private application source, runtime traces, user data or unpublished project artifacts. No Windows security product was built, benchmarked, installed or disabled by this contribution.

## What changes an engineering decision

1. **Separate a memory finding from historical attribution.** A current snapshot can identify suspicious executable memory, while reliable claims about a source process need captured evidence. Optional monitoring necessarily creates blind intervals; expose them rather than filling them with inference.
2. **Make stop semantics part of architecture.** A component setting must control workers, sessions, schedules and retained memory. Event-triggered work still needs a listener, so it cannot truthfully be advertised as zero background activity. Shared resource ownership needs an explainable dependency model.
3. **Review WESP before custom kernel investment.** Microsoft's current requirements identify eligible Windows builds and distinct production access/signing gates. A supported newer platform is a candidate for comparison, not an excuse to assume access or coverage. [WEP001] [WEP002]
4. **Do not transfer platform claims.** PRX-SD's Windows watcher is not its Linux pre-execution path. Rust driver bindings are still labeled preproduction upstream. Rustinel documents missing prevention/anti-tamper scope. [WEP003] [WEP013] [WEP015]
5. **Convert upstream failures into explicit test cases.** Sentinella's release fixes make timeout-as-clean and prefix-only cache validation useful regression cases. Their presence in release notes is not a locally reproduced defect or accepted fix in another project. [WEP016] [WEP017]
6. **Distinguish an update package from an interoperable feed.** Defender and Bitdefender offline update instructions do not demonstrate native database support in an unrelated engine. Classify data adapters by actual semantics and retain provenance. [WEP008] [WEP009]

## Where to use this knowledge

The canonical [Windows endpoint security guide](../docs/windows-endpoint-security.md) provides lifecycle rules, conditional reuse choices, coverage fields, integration boundaries and eight proposed experiments (EP-01 through EP-08). Its recommendations are architecture hypotheses and source-based evaluation priorities. Existing target implementations remain authoritative until equivalent-work acceptance demonstrates a better compatible option.

## Source and publication scope

The additive [source shard](../data/sources.d/windows-endpoint-security-20261124.json) is indexed by the existing complete register. Source IDs WEP001 through WEP020 are preserved beside the claims. Sources are original upstream documentation, current README content, official product instructions and identified release notes. These are not local performance measurements.

The new wiki page is projected from the canonical guide using the repository's existing Markdown projection helper and registered mapping. Repository preparation and live GitHub Wiki publication are separate outcomes; the publishing agent must verify the latter before claiming it complete.

[WEP001]: https://learn.microsoft.com/en-us/windows/win32/wesp/wesp-requirements
[WEP002]: https://techcommunity.microsoft.com/blog/Windows-ITPro-blog/whats-next-windows-endpoint-security-platform-and-driver-quality/4572663
[WEP003]: https://github.com/microsoft/windows-drivers-rs/blob/main/README.md
[WEP004]: https://learn.microsoft.com/en-us/windows/win32/etw/about-event-tracing
[WEP005]: https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-controltracew
[WEP006]: https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/security-malware-windows-defender-disableantispyware
[WEP007]: https://learn.microsoft.com/en-us/windows/win32/amsi/antimalware-scan-interface-portal
[WEP008]: https://www.microsoft.com/en-us/wdsi/defenderupdates
[WEP009]: https://www.bitdefender.com/consumer/support/answer/10690/
[WEP010]: https://github.com/hasherezade/pe-sieve/blob/7517ed395b2cc26cff8069f2b819417aaf8d5d11/README.md
[WEP011]: https://github.com/hasherezade/hollows_hunter/blob/cd694375bbc810e9b0faa93530568953118278ce/README.md
[WEP012]: https://github.com/rabbitstack/fibratus/blob/0d2cb65b379673542da6ff35992f81fa603fe5a1/README.md
[WEP013]: https://github.com/Karib0u/rustinel/blob/901f2e6ab966089b621470bd28499ffb0572e8db/README.md
[WEP014]: https://github.com/VirusTotal/yara-x/blob/ea1d215af89760325a9e08713ad1a1fc05a9a439/README.md
[WEP015]: https://github.com/openprx/prx-sd/blob/df613b75e8460831708c54475a9e93bf618a7400/README.md
[WEP016]: https://github.com/LeewayOpenSoftware/Sentinella/releases/tag/v0.1.13
[WEP017]: https://github.com/LeewayOpenSoftware/Sentinella/releases/tag/v0.1.12
[WEP018]: https://github.com/appwrite/defender/blob/5ce7189f2b197b60f1b55696b032fae1ed8ba85e/README.md
[WEP019]: https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-createtoolhelp32snapshot
[WEP020]: https://www.amtso.org/wp-content/uploads/2018/05/AMTSO-Use-and-Misuse-of-Test-Files-in-Anti-Malware-Testing-FINAL.pdf
