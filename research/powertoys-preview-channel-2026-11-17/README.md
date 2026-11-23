# PowerToys preview: chart surfaces and release-channel evidence

Reviewed 2026-11-17. Source study, not Windows runtime acceptance. No software installed, settings changed or third-party code copied.

## Verified update

Microsoft labels [v0.103.3151](https://github.com/microsoft/PowerToys/releases/tag/v0.103.3151), published November 13, a **development preview / prerelease**. Its release notes describe Adaptive Card vertical, horizontal and stacked bar charts from Command Palette extensions. The CPU card adds a minute-long history, per-processor information and top-process context; performance cards receive their initial sample immediately. These are upstream feature claims, not measured results. They must not be represented as stable-channel features or verified Athena capabilities.

## Comparison with retained Athena knowledge

The existing [PowerToys enrichment](../../data/software/legacy-systems-enrichment.json) describes a general Windows utility suite. A separate Workspaces study covers project-window capture/restore, not chart integration. That draft retained an inaccessible older release-tag observation. This directly opened **different tag** supplies new channel evidence; it does not prove the old URL is repaired or rewrite that historical observation.

Existing [Terminal](../terminal-servicing-risks-2026-11-15/README.md) and [Git for Windows](../git-windows-release-risks-2026-11-15/README.md) studies already cover the official versions rechecked in this pass. No duplicate catalog entries or generated catalog edits are needed here.

## Athena application, explicitly an inference

For Athena diagnostics and reusable UI libraries, evaluate native chart components that expose a meaningful first sample and distinguish per-core utilization from aggregate load. A first frame with data is a useful candidate behavior, not proof of lower latency. Preserve accessible text/table equivalents, keyboard access, sample timestamps, empty/error states and reduced-motion preferences. Do not infer that Microsoft extension APIs can run unchanged in Athena's web/native shell.

Before any reuse, inspect the exact chart renderer and extension contracts, test supported data shapes and absent/invalid samples, and compare equivalent workloads. Capture initial-data latency, update cost and memory with the same sampling cadence. This pass did not inspect those implementation files, run benchmarks, install the preview or establish compatibility. Those are remaining acceptance tasks, not completed features.

## Rights and adoption boundary

The [tagged root license](https://github.com/microsoft/PowerToys/blob/v0.103.3151/LICENSE) is MIT and requires preservation of the copyright and permission notice. Review each selected dependency, asset and trademark separately before copying; the root license is not a blanket clearance for every component. No installer or source payload is retained here. Choosing a preview for production requires separate suitability review; this research does not recommend upgrading the user's machine.

## Receipt and checks

[evidence.json](evidence.json) stores source identities, channel, comparison and explicit unrun states. Validation checks JSON structure, matching source references, absence of runtime claims and existing local comparison targets. This documentation-only pass does not establish a fresh stable version, full repository audit or UI acceptance.
