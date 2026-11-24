# Rufus: stable release versus security-fix channel

Reviewed 2026-11-15. Research only; no software installed, executable downloaded, drive written, settings changed or vulnerability reproduced.

## Verified upstream state

- The [official stable-release API](https://api.github.com/repos/pbatard/rufus/releases/latest) returned **v4.15**, published 2026-06-30T11:28:34Z, with prerelease=false. Its [release notes](https://github.com/pbatard/rufus/releases/tag/v4.15) include the earlier XML-parser correction. This is not evidence that all subsequently disclosed issues are fixed in that stable version.
- [v4.16_BETA2](https://github.com/pbatard/rufus/releases/tag/v4.16_BETA2), published 2026-11-11T18:38:36Z, is explicitly **prerelease=true**. Its notes list additional security fixes and boot-media validation changes. Do not relabel it as a stable release or silently substitute it for a tested stable baseline.
- The [maintainer-published executable-search advisory](https://github.com/pbatard/rufus/security/advisories/GHSA-xh22-8phc-hw8j), dated November 5, labels 4.15 affected and 4.16 patched. It describes elevated utility invocation resolving executable names through writable locations during particular operations. The page marks the report as AI-assisted. This review confirms what upstream states, not independent exploit reproduction or installation exposure.

## Windows and licensing

The [official download page](https://rufus.ie/en/) lists Windows 8 or later and stable x64, x86 and ARM64 downloads; the displayed beta download is x64. That is vendor compatibility guidance, not advice to use an unsupported Windows installation, and not evidence that every architecture has the same beta artifact. The site specifies GPL version 3 or later. The [pinned v4.15 README](https://github.com/pbatard/rufus/blob/v4.15/README.md) identifies GPLv3; inspect exact component notices, bundled boot components and distribution obligations before reusing source. No source is copied here.

## Evaluation boundary

A latest-stable-only inventory would miss the distinction between the advertised stable version and a security fix currently listed in a prerelease. Record both version and release channel alongside each advisory's stated affected/patched range. Do not infer that the user has Rufus installed, that all 4.16 fixes were reproduced, or that the beta is generally safer or superior.

Any future functional comparison needs disposable media, an explicitly verified target drive and reviewed ISO provenance. Formatting is destructive; portable execution is not read-only. No such test is authorized or performed by this research note. Do not change Windows setup/security options merely because the utility offers them.

## Evidence limitations

Official release metadata, pinned documentation, the vendor download page and one advisory were inspected. Binary signatures, hashes, runtime behavior, all listed advisories and downstream package versions were not independently verified. No catalog ranking, runtime manifest, app implementation or other project's recommendation changed. Keep this as a channel/provenance caution until representative testing exists.
