# Archive extraction: provenance and SDK reuse boundaries

[Research directory](../) · [Athena](../../README.md)

Reviewed **2026-11-15 UTC** after checking Noxviola's continuation index, active Athena work and the existing Windows-utilities 7-Zip entry. This is a distinct source-backed follow-up, not a held catalog rewrite. No software was downloaded or installed; no user archive, exploit sample or private data was opened.

## Release identity and scoped fixes

The official homepage identifies **7-Zip 26.06**, dated **November 6, 2026**; the GitHub release was published **November 7**. Keep product date and publication timestamp separate. Windows x64, ARM64 and x86 downloads are offered. Upstream's broad historical Windows compatibility list is not a guarantee of security support for end-of-life Windows versions. [Vendor homepage](https://www.7-zip.org/) · [Pinned 26.06 release](https://github.com/ip7z/7zip/releases/tag/26.06).

The 26.06 notes specifically mention improved Linux split-file support and otherwise summarize bug/vulnerability fixes without identifying each issue. Do not invent a CVE mapping or claim comprehensive remediation from that summary.

A separately documented historical fix, **CVE-2026-58052**, appears in **26.03**: a crafted archive could cause loss of Mark-of-the-Web during extraction. The GitHub publication is September 4, 2026. This is a vendor-reported fix, not independently reproduced here, and not a newly disclosed November vulnerability. [Pinned 26.03 notes](https://github.com/ip7z/7zip/releases/tag/26.03).

For archive-ingestion design, this reinforces a distinct acceptance requirement: verify extracted content's trust/provenance state, not merely successful decompression. That is an engineering inference, not proof that any current application's extraction path is affected.

## Full archiver and LZMA SDK are different reuse units

The **26.06 source license** maps RAR code to LGPL plus the unRAR restriction, identifies BSD-3-Clause files for LZFSE/Zstandard and a BSD-2-Clause file, and allows public-domain status only where a source file says so. Other files default to LGPL, version 2.1 or later. File-level review and required notices remain necessary; do not label the entire archiver public domain. [Pinned source license](https://github.com/ip7z/7zip/blob/26.06/DOC/License.txt).

The vendor separately places the **LZMA SDK** in the public domain. Its reduced 7z tools and compression subset do not establish feature parity with the full 7-Zip application. The SDK page lists version 26.06, November 6, 2026, including Windows x86/x64/ARM64 binaries. Its performance figures are vendor claims, not Athena measurements. Inspect the exact reused package and files rather than applying the SDK declaration to the entire repository. [Official SDK](https://www.7-zip.org/sdk.html).

## Bounded evaluation proposal, not a recommendation

Use disposable synthetic archives in an isolated destination. Test traversal containment, symlinks, duplicate names, Unicode, split-volume completeness, interrupted extraction and resource budgets. Verify provenance metadata on the actual Windows/filesystem path intended for deployment, including nested archive behavior; a successful archive integrity check does not prove that metadata survived. Never execute extracted content as part of a generic decompression test.

Retain input hashes, tool version, output hashes and failures. Compare actual application requirements before selecting a replacement. No benchmark winner, complete remediation, user-installation assessment or native acceptance is claimed. Security settings, file associations and production archives remain unchanged.
