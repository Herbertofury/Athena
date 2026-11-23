# PowerToys release review · 2026-11-17

Research-only stable-hotfix study. Catalog integration is pending: open PR #287 already owns a Workspaces enrichment of the same PowerToys identity, while #291 studies a development preview. This draft changes neither branch nor any generated catalog. The separately prepared local integration preserves historical records and has not been published.

## Meaningful change

The official [November 6 stable hotfix](https://github.com/microsoft/PowerToys/releases/tag/v0.102.3101) addresses thumbnail generation and Mouse Without Borders pairing. It also repairs optional diagnostic reporting, with diagnostic preferences retained. This matters to privacy-sensitive selection; do not label the suite telemetry-free.

The [pairing PR](https://github.com/microsoft/PowerToys/pull/51789) replaces identical-leaf-certificate comparison with independent trusted-Microsoft-signature checks. Its author reports an unavailable build and no demonstrated failing-test reproduction. That limitation is retained rather than converting released code into independently verified security evidence. The [diagnostics PR](https://github.com/microsoft/PowerToys/pull/51940) explains the managed/native event discrepancy.

## Platform, rights and boundaries

[Microsoft installation guidance](https://learn.microsoft.com/en-us/windows/powertoys/install) still lists Windows 10 build 19041 or newer / Windows 11 and x64/ARM64, with per-user and machine-wide installers. This is application compatibility documentation, not a Windows lifecycle support guarantee. The [release-pinned MIT license](https://raw.githubusercontent.com/microsoft/PowerToys/v0.102.3101/LICENSE) requires preserving notices; component rights need separate review before reuse. No third-party code was copied.

All evidence here is first-party documentation or maintainer discussion. No ratings, popularity ranking, measured speedup, native pairing test or independent security assessment is claimed. No software installation, user-setting change, diagnostic preference change, email or external data upload was performed.

## Acceptance

Catalog generation, record preservation, software search/sort/navigation tests and packaging checks are the relevant local gates. Browser and hosted publication results are reported separately; a generated Wiki mirror is not proof of live Wiki publication.

Local companion integration results (not this research-only publication): generated-catalog check, 26 Python and 38 JavaScript software tests pass. All 1,069 application IDs and their order are preserved; PowerToys is the only changed application record. The reviewed 131-file public-preview package builds successfully. Installed Chromium could not launch: `process_singleton_posix.cc: socket() failed: Operation not permitted`. No browser assertions ran; changing the authorized execution mode did not resolve that restriction. Nothing was installed and the assertions were not weakened. Draft source publication does not update the deployed site or live Wiki.
