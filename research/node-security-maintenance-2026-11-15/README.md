# Node.js November security maintenance
Reviewed 2026-11-15 UTC. Independent research, not a catalog ranking or runtime change.

## Verified release checkpoint

The [official November 11 advisory](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases/) says security releases are available as **22.23.5, 24.22.3 and 26.13.1**. Its retained pre-announcement text below the completed announcement is not evidence that release is still pending.

Relevant classes include HTTPS/HTTP2 memory disclosure and availability defects, TLS policy bypasses, proxy-credential disclosure in error messages, and permission-model gaps. The Windows/macOS recursive-watch issue **CVE-2026-123829** exposes denied descendant names and timing, not file contents. Application/API preconditions differ; no local project vulnerability or exploitation is established here.

The advisory lists some HTTP2 cases against 24/26 while the [22.23.5 release notes](https://nodejs.org/en/blog/release/v22.23.5) also list corresponding fixes. Preserve this scope discrepancy rather than infer every listed vulnerability applies identically to every branch. For concrete deployment decisions, inspect the exact application, runtime and affected API.

## Windows, provenance and reuse

Pinned [22.23.5 platform policy](https://github.com/nodejs/node/blob/v22.23.5/BUILDING.md) lists Windows 10/Server 2016 onward for x64/x86 Tier 1, with native x86 compilation experimental; Windows ARM64 is Tier 2. Older Windows 8.1/Server 2012 appears experimental, not equivalent supported production coverage. These statements are version-specific, not claims about every Node major.

The release provides Windows x86/x64/ARM64 MSI and binary links plus signed checksums. No artifact was downloaded or signature independently verified in this pass. Its SQLite dependency update does not upgrade Python's SQLite or Athena's Rust-linked SQLite.

The pinned [LICENSE](https://github.com/nodejs/node/blob/v22.23.5/LICENSE) contains the permissive Node core license and bundled dependency notices. Preserve the relevant licenses when reusing code; do not treat all bundled components as having one license.

## Limits and next use

This records newly reviewed evidence, not a release that occurred today. No installation, settings change, credential inspection, exploit test or benchmark occurred. Prefer a supported patched branch consistent with the application's compatibility requirements; a larger version number alone is not measured superiority. Any project update still needs its own regression and runtime-identity checks.
