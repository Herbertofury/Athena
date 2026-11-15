# Audio workflow release risks: project integrity and optional cloud conversion

Observed 2026-11-15. This independent research note records newly inspected upstream release behavior. It is not a catalog import, ranking, benchmark, installation or workflow migration.

## Audacity 4.0.2: project-integrity regression targets

The [official 4.0.2 release](https://github.com/audacity/audacity/releases/tag/Audacity-4.0.2) reports repairs for corruption involving empty clips and cross-project copying, clip loss/pitch errors when crossing sample rates, and Save As replacement/extension errors. Automatic saving during recording was restored. These upstream fixes suggest useful regression cases; they are not proof that all recovery problems are solved.

Before moving a real editing workflow, preserve untouched project copies and compare empty-clip reopen, cross-project copy, mixed-rate moves, Save As replacement and recording recovery. Count clips and samples and check timing, pitch and metadata. This is a proposed test plan, not executed evidence.

The [Windows download page](https://www.audacityteam.org/download/windows/) identifies 4.0.2 and provides x86_64 and ARM64 builds. ARM64 requires Windows 11 or later, has no plugin support, and needs its matching ARM FFmpeg library. Upstream also warns that ARM workflows have not been thoroughly tested. Do not equate the existence of a native ARM build with plugin parity.

The [release-pinned license](https://github.com/audacity/audacity/blob/Audacity-4.0.2/LICENSE.txt) resolves a common classification ambiguity: the application is GPLv3, while individual files can have other specified licenses and the unspecified-file default is GPLv2-or-later; documentation is CC-BY 3.0. Review exact files and dependencies before reuse.

## MuseScore Studio 4.7.7: local notation versus service conversion

[The official announcement](https://musescore.org/en/4.7.7) dates this release to **November 12, 2026**. It adds FFmpeg 9 support and provider-selection improvements, fixes some cloud-score refresh behavior, and adds a terms checkbox plus upload-limit messaging to Convert file to score. Treat that conversion flow as a distinct service interaction: a local notation installation is not authorization to upload a private score or accept new terms.

The [official download page](https://musescore.org/en/download) offers Windows 64-bit downloads, including an option without MuseHub and a portable EXE. Its Windows 10-or-higher statement explicitly describes MuseHub; this note does not misattribute that as complete Studio hardware/OS qualification.

The [source README](https://github.com/musescore/MuseScore#license) identifies GPL 3.0. That does not establish the same terms for optional sounds, fonts, service access or uploaded score content. A useful local acceptance case would compare MusicXML import/export, note timing, engraving and audio export on a retained score without invoking cloud conversion.

## Date and verification limits

MuseScore's full publication date is explicit. Audacity's viewed release label says November 2 without an explicit year; its full publication date remains unverified here. LMMS's latest stable endpoint still resolves to [1.2.2](https://github.com/LMMS/lmms/releases/tag/v1.2.2), whose notes explicitly reference 2020; no new stable release is claimed.

No executable or model was downloaded. No application test, cloud upload, account action or benchmark occurred. No held catalog rows, runtime manifest or generated database were changed or republished.
