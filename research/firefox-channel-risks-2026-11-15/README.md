# Firefox security channels and lifecycle evidence
Reviewed 2026-11-15 UTC. Research only: no installation, settings change, account connection or performance comparison.

## Current official security checkpoint

Mozilla's November 10 advisories mark Firefox 160, ESR 153.7 and ESR 115.45 as the respective fixed versions for their listed vulnerabilities, each with overall high impact. These are distinct channels, not interchangeable version numbers. Selected examples include sandbox escape and memory-safety issues; this review does not reproduce exploits or establish that the user's installed browser is affected.

- [Firefox 160: MFSA 2026-125](https://www.mozilla.org/en-US/security/advisories/mfsa2026-125/)
- [ESR 153.7: MFSA 2026-127](https://www.mozilla.org/en-US/security/advisories/mfsa2026-127/)
- [ESR 115.45: MFSA 2026-126](https://www.mozilla.org/en-US/security/advisories/mfsa2026-126/)

Use the advisory for the installed channel rather than treating a numerically older ESR branch as automatically unpatched. A security maintenance checkpoint is not evidence that Firefox outperforms another browser.

## Windows support and conflicting lifecycle text

[Firefox 160 requirements](https://www.firefox.com/en-US/firefox/160.0/system-requirements/?redirect_source=mozilla-org) specify Windows 10 or later, 32/64-bit, with recommended 1 GHz processor, 1 GB RAM (2 GB for 64-bit) and 500 MB disk. These are vendor figures, not measured installed footprint or this project's workload budget.

[Version-specific ESR 115.45 release notes](https://www.firefox.com/en-US/firefox/115.45.0/releasenotes/) date that release November 10 and limit its supported platforms to Windows 7–8.1 and macOS 10.12–10.14. The generic [Windows 7/8/8.1 support article](https://support.mozilla.org/en-US/kb/firefox-users-windows-7-8-and-81-moving-extended-support) still describes security updates through August 2026 followed by a future extension/end-of-support decision. Therefore that August text must not be used to deny the directly evidenced November release or invent a new future end date.

There is another stale-looking cross-reference: ESR 115.45 notes direct other platforms to ESR 140, whereas the current November advisory names ESR 153.7. Retain this discrepancy instead of silently substituting a branch. Resolve current channel selection against the platform-specific release and enterprise policy before deployment. **Future ESR 115 support end date remains unverified here.** Browser maintenance does not establish that its old operating system remains supported.

## License and reuse boundaries

Mozilla's [MPL 2.0 FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) describes file-level copyleft and source/notice obligations when distributing modified covered files. Firefox includes separately licensed components; consult the actual source notices before extracting code. A source-code license is not blanket permission for Mozilla trademarks or third-party bundled assets. No code, installer or artwork is redistributed by this note.

## Evidence limits and practical follow-up

All claims above come from official advisory, release, requirements and licensing pages inspected on the review date. Search snippets alone were not used to settle release identity. One requirements URL initially failed to open; the official redirect-query variant returned the versioned page. No local browser inventory, binary authenticity test, exploit test, comparative benchmark, native Windows trial or new release since the previous hourly pass is asserted. This is newly recorded channel/lifecycle research, not a claim that the upstream release occurred today.
