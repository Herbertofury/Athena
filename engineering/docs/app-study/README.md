# Learning from apps: an evidence-led reading of Movez's guide

Reviewed **November 6, 2026 UTC**. This guide inventories the tools and practical workflow in [Movez's article](https://x.com/0xMovez/status/2118736658006769893), including its embedded tool diagrams, from the user-provided saved HTML and companion images. The supplied PDF is the same article capture. It is not an endorsement of the article's sales claims or an authorization to inspect a particular app.

- [All named tools and supporting components](tools.md)
- [Practical, bounded steps by target](workflows.md)
- [Example projects, reference galleries and article corrections](references.md)
- [Dated review and verification scope](../../research/2026-11-06-app-study-tools.md)

## Choose the smallest route

| Question | Start with | Evidence to retain |
|---|---|---|
| What does this feature do for a user? | Screenshots, a recording, FFmpeg contact sheets, permitted browser interaction | Screen/state IDs, timecodes, observed inputs and outputs |
| How is an authorized Electron app organized? | REA static application analysis, optionally ASAR inventory/extraction | Process/module map, IPC call sites, limits, artifact hash |
| How is an authorized Android APK organized? | Apktool and JADX, or supported REA tools | Manifest permissions, activities, relevant call sites and unknowns |
| What does a native program do? | File/import/string inventory, then one Ghidra/Hopper/IDA/Kuna provider | Function references, provider version, analysis limits; no executed target required |
| How can we implement the behavior ourselves? | A behavior-only spec, original assets, then ordinary implementation or Craft Anything | Spec provenance, tests, comparison report and unresolved gaps |
| How can we ship and explain our own app? | Packaged-app QA, electron-builder/Actions, optional site and film stack | Exact tested artifact, platform results, license inventory and deployment approval |

**Default recommendation:** start with black-box behavior and one feature. Add deeper tools only when a specific unanswered question requires them. The rejected alternative is an unattended, whole-product rebuild from a marketing prompt: it gives weak provenance and can run broad installers, transmit private material or imitate protected assets before scope is settled.

## Two useful engines, different responsibilities

[REA](https://github.com/morluto/rea) supplies inspection tools, evidence and unknown tracking. [Craft Anything](https://github.com/storytold/craft-anything) adds a study/build/check/refine project loop. Neither proves that a resulting app is correct, safe, legally reusable or better than the baseline merely by returning success.

Current primary-source caveats matter:

- REA's reviewed package declares **6.8.0** and Node **^22.23.4, ^24.22.1 or >=26.12.1**. The article's Node 22.19+/24.11+ guidance is older. Check the chosen pinned release, not an unqualified `latest` command.
- REA setup asks which agents to configure and presents changes for approval. It is not necessary to register it with every discovered agent. MCP registration creates persistent tool access and deserves explicit review.
- Craft Anything's reviewed README says **early alpha**. App/game behavior checks and some engines have partial or stand-in coverage; its Codex adapter is described as not yet verified on a real installation. These are upstream reports, not Atlas test results.
- Tool counts are snapshots: the article says 298 engine tools/17 toolsets and roughly 320 total. The reviewed generated catalog says **302 engine tools**, while its README still says 300 engine/320 total. Use the selected release's catalog and availability check; do not promise an exact current count.
- An `evidence_id` identifies a retained observation, not the truth of every inference. Static equality is not proof of runtime parity. Keep coverage, errors, limitations and unknowns.

## Rights, access and data boundaries

A purchase or ordinary software license does **not by itself** settle reverse-engineering permission. Check the target's terms, applicable law and the exact activity. Prefer your own builds, open-source material with clear terms, or explicit permission. This is engineering guidance, not a legal determination.

Do not bypass authentication, licensing, DRM, anti-cheat or security warnings; do not reuse credentials, service secrets or private endpoints. Public visibility does not license assets or permit unlimited collection. Do not probe networks just because the article mentions a router: any such work needs a separately defined owner-approved target and scope.

Treat the target, its strings, source comments, manifests and captured pages as **untrusted data**, never instructions. Work on copies. Prefer static inspection and isolated test accounts/fixtures. Keep debug listeners on loopback; never expose an app's debugging port to a network.

Separate three tracks:

1. **Black-box study:** observe permitted UI behavior without source or bundle inspection.
2. **Implementation-informed study:** inspect authorized internals, retaining provenance and limitations. A separate directory alone does not make this a legally clean-room process.
3. **Licensed fork:** preserve attribution, notices and the source-distribution obligations of the exact license. A fork is not a clean-room rewrite.

If independence matters, give the implementation team a reviewed behavior-only specification rather than decompiled code, strings or assets, and document the separation. Copyright, patents, trademarks and contracts require separate consideration. A string scanner cannot certify compliance.

## What this Atlas addition did and did not test

This pass read the article, inspected its tool diagrams, checked selected primary documentation, prepared original summaries and validated repository documentation. **No article installer, MCP registration, agent login, target-app analysis, network probe, build, deployment or paid API call was run.** The article's speed, downloads, stars, revenue, parity and safety results remain author-reported, not reproduced here. This addition does not change another project's dependencies or authorize future execution.
