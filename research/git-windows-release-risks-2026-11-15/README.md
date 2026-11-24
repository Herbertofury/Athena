# Git for Windows: release, advisory and changelog boundaries

[Research directory](../) · [Athena](../../README.md)

Reviewed 2026-11-15 UTC. Distinct coding-tool research, not a software installation, local vulnerability diagnosis, benchmark or implementation recommendation. Noxviola's continuation index was checked; ongoing native Athena work remains separate. No earlier Git-specific review checkpoint was found in the inspected Windows-utilities baseline. These findings are newly reviewed, not claimed to have appeared since the last hourly run.

## Pin the shipped release, not the moving changelog

The official latest release resolves to **Git for Windows 2.56.1**, tag **v2.56.1.windows.1**, published **November 10, 2026**. Its notes report six security fixes covering recursive clone, ref path traversal, signed-tag merge parsing, binary patch bounds, merge-buffer arithmetic and fast-import restrictions. The release supplies x64 and ARM64 installers and SHA-256 values; the presence of published hashes is not a claim that this pass downloaded or verified any binary. [Pinned release](https://github.com/git-for-windows/git/releases/tag/v2.56.1.windows.1).

The moving build-extra ReleaseNotes.md contains a section headed “Changes since Git for Windows v2.56.1” with Bash/GCM/runtime updates and a startup optimization. These are **post-release changelog entries**, not evidence that the pinned 2.56.1 installer contains them. Do not infer a measured speed improvement or install GCM from that section. [Moving changelog](https://github.com/git-for-windows/build-extra/blob/main/ReleaseNotes.md).

## Preserve a source disagreement

For **CVE-2026-111760 / GHSA-vp2w-7xxj-jvxr**, the Windows release says it addresses the issue. At review, the core Git advisory still lists all versions affected, no patched version, and patch discussion ongoing. It describes attacker-controlled recursive clones as the suspected trigger and advises avoiding untrusted repositories. This note records the mismatch instead of silently converting a release claim into independently verified remediation. Resolve exact patch/build coverage before a later security qualification. No malicious repository or proof of concept was run. [Official advisory](https://github.com/git/git/security/advisories/GHSA-vp2w-7xxj-jvxr).

## Windows and reuse constraints

The official prerequisites specify Windows 10+ for x64 and Windows 11 for ARM64. Full 32-bit distributions are no longer equivalent to current x64/ARM64 releases: MinGit is the remaining official 32-bit artifact and is a minimal subset. Historical Windows support endpoints are not endorsements to run unsupported systems. [Requirements](https://github.com/git-for-windows/git-for-windows.github.io/blob/main/content/requirements.md).

The release-notes license section identifies Git as GPLv2 and bundled Bash, curl, zlib, Tcl/Tk, Perl and MSYS2 components as separately licensed. Review the exact redistributed component set rather than applying one blanket license. The known-issues section discusses mitigation-disabling workarounds; this research does **not** authorize weakening ASLR, NTFS protection, host-key checks or any security setting. [License and known-issue context](https://github.com/git-for-windows/build-extra/blob/main/ReleaseNotes.md).

## Evidence-led follow-up

Before any later authorized upgrade, record the actually invoked Git executable and version, distinguish bundled IDE copies, verify the selected vendor artifact and preserve existing configuration. Use disposable benign repositories for clone, symlink, long-path, submodule and shell-compatibility checks. Credentials, production remotes and user repositories are out of scope for a generic fixture test. Retain failures and compare the target workflow, not a synthetic startup number alone.

This pass changed no executable, credential helper, account, repository configuration or security setting. It makes no claim that the user's installed Git is affected or patched, that the release is universally safe, or that a new implementation outperforms an existing one.
