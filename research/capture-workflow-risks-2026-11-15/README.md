# ShareX 22: capture workflow changes need regression evidence

Reviewed 2026-11-15. Independent research note, not a catalog expansion or runtime recommendation.

## Official release evidence

The [release API](https://api.github.com/repos/ShareX/ShareX/releases/latest) returned **v22.4.0**, published 2026-11-08T04:17:24Z. The [release page](https://github.com/ShareX/ShareX/releases/tag/v22.4.0) lists portable and setup x64 artifacts with SHA256 values. Their bytes and signatures were not downloaded or independently checked.

The [official changelog](https://getsharex.com/changelog#v22.4.0) describes revised capture-output selection, selectable task-list presentation and compact spacing, plus HDR recording tone mapping and automatic HEVC selection when recording dimensions exceed H.264 limits. Crucially, the October 20 entry for 22.0 explicitly warns that the major rewrite was expected to be less stable than ordinary releases. Later fixes do not themselves establish regression-free behavior. Its .NET 10 migration and native recording changes also mean that version 21 assumptions should not be carried forward without checking. These are upstream claims, not Athena measurements.

## Windows, privacy and reuse

The [pinned README](https://github.com/ShareX/ShareX/blob/v22.4.0/README.md) identifies Windows and configurable automatic after-capture actions, including uploads. Exact minimum Windows build and native ARM64 support were not established in this pass; x64 artifacts do not prove either. The [pinned license](https://github.com/ShareX/ShareX/blob/v22.4.0/LICENSE.txt) contains GPLv3. Source reuse requires compatible copyleft handling and separate dependency/component review. No code or assets were imported.

## Proposed evaluation, not results

Use a disposable configuration and synthetic screen content only. Explicitly disable upload actions before capture. Compare the same version-21 and version-22 tasks: saved pixel dimensions, HDR color fidelity, clipboard result, encoding/decoder compatibility, cancellation, output preservation and task latency. Check that changing the desired output does not unexpectedly transmit a capture. Validate screen/recording permissions separately and do not suppress deletion confirmations as part of the test.

No capture, installation, configuration change, benchmark, private-data collection or upload occurred. No superiority, security certification, other-project promotion or native acceptance is claimed. Existing catalog and held runtime payloads remain unchanged.
