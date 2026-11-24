# Windows Terminal: servicing claims and preview boundaries

[Research directory](../) · [Athena](../../README.md)

Reviewed **2026-11-15 UTC** against official pinned sources. Noxviola's active index, concurrent Athena work and the prior Windows-utilities Terminal entry were checked. This independent follow-up adds release-specific evidence, not a catalog rewrite or newly invented benchmark. No install, setting change, private terminal transcript or account access occurred.

## General availability versus preview

**Windows Terminal 1.25.3131.0**, published **November 11, 2026**, marks the 1.25 general-availability rollout. Upstream reports fixes for scaled-text confirmation dialogs, keyboard-protocol state across screen-buffer switches, injected key values and title-bar flicker. It also backports a console-host screen-clear change intended to avoid committing the full virtual text buffer. These are release claims, not locally reproduced latency or memory improvements.

One item deserves explicit uncertainty: the release describes a fix for URL clicks creating an extra mouse-release event, then adds a maintainer correction saying the fix cannot be confirmed. Preserve that correction in any acceptance checklist; do not convert the bullet into a verified success. [Pinned stable release](https://github.com/microsoft/terminal/releases/tag/v1.25.3131.0).

**Preview 1.26.3133.0**, also published November 11, remains a prerelease. Its additions include controls for tab drag/drop and the resize overlay, visible experimental-setting labels, and screen-reader improvements for settings cards. Do not attribute all preview features to stable merely because some fixes were backported. [Pinned preview](https://github.com/microsoft/terminal/releases/tag/v1.26.3133.0).

## Windows and licensing

The stable tag's README specifies **Windows 10 2004/build 19041 or later**. This is a runtime requirement, not an endorsement of unsupported Windows deployments, nor the same as the newer SDK/compiler needed to build source. Installation channels and dependent packages must be checked for the actual target architecture before any future authorized deployment. [Pinned README](https://github.com/microsoft/terminal/blob/v1.25.3131.0/README.md).

The core license is **MIT**, requiring its notice and permission text to be preserved. Review bundled dependencies, fonts, assets and trademarks separately before reuse. Terminal does not grant extra privileges or make commands safe; shell and program behavior remain separate. No code was copied. [Pinned license](https://github.com/microsoft/terminal/blob/v1.25.3131.0/LICENSE).

## Bounded acceptance proposal

On disposable fixtures, test text scaling, screen-reader focus, alternate-buffer switching, keyboard state, URL/mouse reporting and large-output scrolling. Measure committed memory as well as latency around screen clear, and retain before/after traces. Keep stable and preview binaries/configuration separate. No private session text should appear in public test evidence.

This is an evaluation plan, not a measured result or recommendation to replace an existing implementation. The unresolved mouse-event claim remains open until reproduced with an exact build and protocol fixture.
