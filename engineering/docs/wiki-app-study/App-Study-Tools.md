# Article tool inventory

[Study guide](https://github.com/Herbertofury/Engineering-Atlas/wiki/App-Study) · [Practical workflows](https://github.com/Herbertofury/Engineering-Atlas/wiki/App-Study-Workflows) · [References and corrections](https://github.com/Herbertofury/Engineering-Atlas/wiki/App-Study-References)

Scope: names in the article's prose, commands, examples and relevant tool diagrams. A row can group tightly related commands or components. These are **candidates and links**, not installed or accepted tools. Tool licenses do not grant rights to a target app or its assets. Check the pinned release and all bundled/dependency notices before redistribution.

## Inspection and agent tools

| Tool / primary source | Article role and useful first action | Access, licensing and limits |
|---|---|---|
| [REA / `rea-agents`](https://github.com/morluto/rea) | MCP/CLI inspection, application maps, evidence bundles and unknown ledger. Review setup, run availability checks, then inspect one copied artifact. | MIT project; providers separate. Setup edits agent configuration. Current Node requirements differ from article. See [upstream CLI](https://github.com/morluto/rea/blob/main/docs/cli.md). |
| [Craft Anything](https://github.com/storytold/craft-anything) | Desktop/CLI/MCP study → build → check → refine loop. Start with `doctor` and a small original/spec-only project. | MIT OR Apache-2.0; assets/trademarks have separate terms. Early alpha; agent access and dependency commands are separate permissions. |
| [Claude Code](https://code.claude.com/docs/en/overview) / Claude / article's “Opus 5.5” | Agent host and model used in the author's workflow; scope one feature and collect evidence. | Hosted model/service terms and usage charges apply. “Opus 5.5” is the article's label, not an Atlas-required or benchmarked model. Verify models offered by your account. |
| [Codex](https://github.com/openai/codex) | Another REA agent host; source inspection and implementation. | CLI license and hosted-service terms differ. Craft Anything's adapter is not established as live-tested by this article. |
| [Cursor](https://cursor.com/docs) | Editor/agent and possible MCP host, also a product used as a comparison target. | Proprietary service terms/plans. Do not confuse it with OpenCursor. |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | Alternative coding-agent host recognized by REA. | Apache-2.0 CLI; model/account quotas and terms separate. |
| [Grok CLI references](https://docs.x.ai/) | Mentioned as an underlying agent for an example project. | The article does not pin a CLI repository or version. Resolve the exact supported integration from that project's docs; do not install a look-alike package. |
| [MCP](https://modelcontextprotocol.io/) | Protocol connecting an agent to inspection tools, not a decompiler itself. | Review tool capabilities, credentials, filesystem/network scope and persistent registration before enabling a server. |
| [Ghidra](https://github.com/NationalSecurityAgency/ghidra) | Native binary analysis/decompilation; GUI or `analyzeHeadless`. | Apache-2.0 with notices/dependencies. Use the JDK required by the selected Ghidra release. Article's 12.1.4/JDK 21 combination is article-specific, not a universal pin; GhidraMCP still documents 12.1.4. |
| [GhidraMCP](https://github.com/LaurieWired/GhidraMCP) | Separate bridge/plugin exposing Ghidra operations to an MCP client. | Apache-2.0; compatibility is version-specific. REA's Ghidra provider and this plugin are distinct routes, not automatically both required. |
| [IDA](https://hex-rays.com/ida-pro) | Alternative native analysis provider. | [Official MCP guide](https://docs.hex-rays.com/add-ons/mcp.md). IDA Free is noncommercial and uses cloud decompilation; review data transmission and edition compatibility. |
| [Hopper](https://www.hopperapp.com/) | Native provider shown in the article's REA comparison diagram. | Commercial tool; demo limitations and OS support apply. Do not let optional setup install it silently. |
| [Kuna provider guide](https://github.com/morluto/rea/blob/main/docs/kuna-provider.md) | Fourth REA provider named in the comparison diagram. | Use this provider guide to resolve the exact upstream/runtime, acquisition and terms. Not a claim of equivalent support on all hosts. |
| [Electron ASAR / `@electron/asar`](https://github.com/electron/asar) | List or extract an authorized Electron archive; map main/renderer/preload boundaries. | MIT tooling; reviewed package requires Node >=22.12.0. Extraction does not grant permission to copy proprietary JavaScript. Inspect paths and keep output outside the target. |
| [Playwright](https://playwright.dev/docs/intro) / Chromium | Repeatable UI capture, screenshots, browser recording, requests and viewport comparisons. | Apache-2.0 Playwright; browser notices separate. Avoid authenticated profiles/private payloads unless explicitly approved. Network recording can expose secrets. |
| [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) | Inspect/screenshot an owned packaged Electron app and collect browser evidence. | Debug access is powerful. Loopback only, temporary session, no production profile. Check Electron/Chromium version compatibility. |
| [Apktool](https://apktool.org/) | Decode APK manifest/resources/layouts on a copy. | Apache-2.0 tooling; target rights separate. Do not patch/repackage a third-party APK as part of this study. |
| [JADX](https://github.com/skylot/jadx) | Recover readable Java-like code and browse Android references. | Apache-2.0; decompiled output can be incomplete or misleading. It is not original Java/Kotlin source. |
| [FFmpeg and ffprobe](https://ffmpeg.org/documentation.html) | Read recording duration; extract timed frames/contact sheets; render/mix media. | Build-dependent LGPL/GPL and codec obligations. A contact sheet misses timing/audio; retain the source clip/timecodes. |
| [`file`](https://www.darwinsys.com/file/) | Identify copied artifact format/architecture before choosing deeper tooling. | Static format evidence, not proof of behavior or safety. |
| [GNU Binutils: `strings`, `objdump`](https://www.gnu.org/software/binutils/) | Strings/imports and PE library inventory. | GPL utilities; system implementations may differ. String presence does not prove execution or purpose. |
| [`otool` / Apple developer tools](https://developer.apple.com/documentation/xcode) | Mach-O linked-library inventory on macOS. | Platform developer-tool terms; not a Windows/ELF universal command. |
| [`jq`](https://jqlang.org/) | Select package metadata and JSON evidence fields. | MIT project. Preserve the full original record, not just a convenient summary. |
| [Mermaid](https://mermaid.js.org/) | Draw the screen-navigation graph in the map. | MIT project; a rendered graph expresses collected evidence, not additional verification. |

## Build, test and delivery stack

| Tool / source | Useful first action | Access, licensing and limits |
|---|---|---|
| [Electron](https://www.electronjs.org/docs/latest/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/docs/) | Define typed IPC and test a minimal vertical slice before parallel modules. | Electron and React: MIT; TypeScript: Apache-2.0. Chromium/Node and bundled dependencies retain notices. Electron is an article choice, not a universal Atlas ranking. |
| [Node.js](https://nodejs.org/), [npm / npx](https://docs.npmjs.com/), [Rust / Cargo](https://www.rust-lang.org/tools/install) | Check runtime versions; review pinned packages/manifests before install/build. | Runtime/tool licenses differ. npm lifecycle scripts and Cargo build scripts execute code. `npx` is not read-only. |
| [Python](https://www.python.org/), [Git](https://git-scm.com/doc) | Local evidence scripts and revision-pinned source checkouts. | PSF/GPL tooling respectively; cloning is not a license to reuse target material. |
| [Homebrew](https://brew.sh/), [WinGet](https://learn.microsoft.com/windows/package-manager/winget/), [APT](https://wiki.debian.org/Apt) | Article's alternative dependency managers. | Match official package/OS; review install changes. They are alternatives, not a single portable install command. |
| [OpenJDK / JDK](https://openjdk.org/) and Debian/Ubuntu XKB, Wayland, X11, XRandR, Xi, Mesa GL, GTK development libraries | Provider/compiler and Craft Anything GUI prerequisites. | Use the versions actually required by the chosen release; each package has its own license. GUI packages are not needed for every static-analysis task. |
| [electron-builder](https://www.electron.build/) | Package the app for each explicitly selected OS/architecture. | MIT project. Signing, certificates, notarization and update channels need separate setup. `--publish never` prevents its publishing, not other release actions. |
| [GitHub Actions](https://docs.github.com/en/actions) and [Releases](https://docs.github.com/en/repositories/releasing-projects-on-github) | CI build/test, retain artifacts and publish an approved release. | Hosted quotas/charges/terms; least-privilege token. Pin reviewed Actions to commit SHAs. |
| [`actions/checkout`](https://github.com/actions/checkout), [`actions/setup-node`](https://github.com/actions/setup-node), [`softprops/action-gh-release`](https://github.com/softprops/action-gh-release) | Actions named in the article's YAML. | Their v4/v2 tags are article snapshots. Release upload is a consequential publication step even when electron-builder itself does not publish. |
| [Vercel](https://vercel.com/docs) | Optional preview of the launch site with working OS/architecture download links. | Hosting terms/limits and production deployment approval. Check git auto-deploy rather than assuming it is disabled. |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse) | Reproducible site audit alongside manual small-screen and accessibility checks. | A score target is not evidence the target was reached; keep exact settings and report. |
| [PowerShell](https://learn.microsoft.com/powershell/), [`reg.exe`](https://learn.microsoft.com/windows-server/administration/windows-commands/reg), [`netsh`](https://learn.microsoft.com/windows-server/administration/windows-commands/netsh) | Windows-specific helpers and failure examples. | Prefer structured output; re-read actual state. No registry, startup, firewall or network changes are authorized by this inventory. |
| [Retrofit](https://square.github.io/retrofit/), [OkHttp](https://square.github.io/okhttp/), WebSocket | Android network-library/protocol names searched in the article. | Reference indicators, not mandatory dependencies; endpoint strings do not authorize API access. |

## Design, animation, film and analytics

| Tool / source | Useful first action | Access, licensing and limits |
|---|---|---|
| [GSAP / ScrollTrigger](https://gsap.com/docs/) | Prototype one scroll sequence with reduced-motion and phone fallbacks. | [Current GSAP license](https://gsap.com/community/standard-license/) is not MIT; review restrictions, especially competing visual animation builders. |
| [Lenis](https://github.com/darkroomengineering/lenis) | Optional smooth-scroll layer, tested with keyboard/touch/navigation. | MIT project; avoid imposing motion or breaking native scrolling. |
| HTML/CSS, [WebGL](https://www.khronos.org/webgl/) | Interactive concept pages, reusable tokens and optional shader effects. | Web standards, not paid tools. Profile on actual low-end devices; reduced motion is a whole-experience behavior, not just zeroing two CSS variables. |
| [Remotion / `create-video`](https://www.remotion.dev/docs/) | Build an original storyboard as a frame-based video and inspect stills before rendering. | [Remotion eligibility/pricing](https://www.remotion.dev/docs/license/pricing) can require a company license. Do not label the whole stack free or MIT. |
| [snapcn](https://snapcn.dev/) / [current upstream](https://github.com/shadcn-labs/snapcn) | Remotion component registry for device frames, captions, terminals and scenes. | MIT project. Article's `snapcndev/snapcn` redirects. Installing an agent skill alone does not install project components. |
| [`skills` CLI](https://github.com/vercel-labs/skills) | The article uses `npx skills add …` to install agent instructions. | Review the skill source and persistent configuration changes first; a skill is untrusted software/instructions, not permission. |
| [Rive](https://rive.app/docs/) | Build and test an interaction state machine for reusable original micro-animation. | [Editor/export plans](https://rive.app/pricing) and runtime licenses differ. An HTML animation is not automatically a valid Rive export. |
| [Jitter](https://jitter.video/) | Turn a timed motion specification into a hero-shot composition. | [Proprietary service/plan/export rights](https://jitter.video/pricing/). A “Jitter-ready spec” is documentation, not a rendered file. |
| [Fish Audio](https://docs.fish.audio/) / [S2.1 Pro through OpenRouter](https://openrouter.ai/fish-audio/s2.1-pro) | Optional generated narration from approved original text; align and review timings. | Paid/usage-limited services and voice rights apply; exact route verified separately. Do not use an identifiable person's voice without permission. |
| [OpenRouter](https://openrouter.ai/docs) | Model/provider gateway named for narration. | Transmits content to providers; API credentials, model pricing/terms and retention need review. Never put keys in the wiki, repo or prompt. |
| [Upstash Redis / `@upstash/redis`](https://upstash.com/docs/redis/overall/getstarted) | Optional analytics counters, approximate distinct counts and batched requests. | Hosted terms/limits; credentials and data-sharing approval separate. Redis SDK and Redis server licenses are not interchangeable. |
| [Redis](https://redis.io/docs/latest/) | Pipeline/hash/HyperLogLog concepts used in the sample. | Approximate counts are not exact people/download completions. Inspect all retention keys and failure paths. |
| [Node crypto](https://nodejs.org/api/crypto.html) | Hash and compare controlled analytics/auth values. | A salted IP/user-agent hash is pseudonymous data, not a blanket anonymity/privacy guarantee. |
| [Figma](https://www.figma.com/) | Mentioned as a contrast to working HTML concept pages. | Optional design tool, not required for the article's workflow. |
| Unbounded, Onest, JetBrains Mono; Inter and Roboto | Article's font examples and rejected stylistic choices. | See [Google Fonts](https://fonts.google.com/) and [JetBrains Mono](https://www.jetbrains.com/lp/mono/); inspect each font's exact license and permitted embedding. A font preference is not a quality rule. |

The article explicitly does **not** use [Google Analytics](https://developers.google.com/analytics) for its dashboard. It is context, not an added dependency.

## Article-specific snippets, not separately verified tools

`tools/ipc-map.mjs`, `tools/capture.mjs`, `tools/nocopy.py`, `ListFunctions.java`, `track.js`, `download.js`, `dashboard.js`, `timeline.ts`, `video-voiceover`, and the `agent()` / `parallel()` / `pipeline()` orchestration example are sample filenames/functions or proposed artifacts. The article does not provide a complete, versioned runnable package for all of them. Do not install a package with a matching name and assume it is the author's tool.

The same applies to `MAP.md`, `FEATURE.md`, `FORK.md`, `BINARY.md`, `STYLE-REF.md`, `STYLE.md`, `MATRIX.md`, `MINIMAL.md`, `CONTRACT.md`, `KEEP.md`, `PROTOCOL.md` and `shared/types.ts`: these are useful deliverables to author, not external products. [Workflows](https://github.com/Herbertofury/Engineering-Atlas/wiki/App-Study-Workflows) explains what each should prove.

## Named tool calls inside the two engines

These are **API/CLI capabilities, not separate packages**. Names were checked against upstream documentation on the review date; availability still depends on the installed version, provider, platform and permissions. Use current `tools/list`, `--help` and availability output rather than guessing arguments. Keep all limitations/error records.

### REA calls shown in the article's diagram

[Generated MCP contract](https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md)

- Electron/JS: `analyze_javascript_application`, `trace_application_feature`, `trace_javascript_semantics`, `compare_source_to_bundle`.
- Native: `open_binary`, `analyze_function`, `get_call_graph`, `trace_call_path`, `close_binary`.
- Apple: `inspect_macho`, `decode_interface_builder`.
- Packages: `inspect_artifact`, `inspect_wasm_artifact`.
- Runtime: `capture_process_scenario`. This can run/interact with a target, so it is not the same permission boundary as static inspection.
- Evidence: `get_evidence_bundle`, `export_evidence_bundle`, `list_unknowns`, `record_unknown`.

The article also names CLI `setup`, `doctor`, `providers`, `inspect-artifact`, `analyze-javascript-application`, `analyze`, `search`, `function`, `decompile`, `xrefs`, `trace`, `compare`, `evidence-export`, and `mcp`. CLI names/argument forms are not interchangeable with MCP names; consult the [CLI guide](https://github.com/morluto/rea/blob/main/docs/cli.md) for the exact selected release.

### Craft Anything calls named in the prose

[Generated tool catalog](https://github.com/storytold/craft-anything/blob/main/docs/tools.md) · [Tool status and limitations](https://github.com/storytold/craft-anything/blob/main/docs/tool-status.md)

- Scope/triage: `core_target_triage`, `core_feature_find`.
- Browser evidence: `web_site_capture`, `web_walkthrough_record`, `web_pixels_compare`.
- Electron/JS: `js_app_map`, `js_electron_walkthrough_record`.
- Android: `android_package_show`.
- Native: `native_function_pseudocode`.
- Claim tracking: `app_ledger_build`, `app_rebuild_claim_check`.

CLI entry points in the article are `doctor`, `commands`, `mcp`, `rebuild`, with `--rounds`, `--continue-in`, `--project-folder`, `--existing edit` and `--clean-room`. Validate flags against the installed CLI. The existing-project edit mode writes in place, so use an isolated version-controlled copy. The claim checker is an aid, not complete behavioral or legal proof.

---

Canonical source: [docs/app-study/tools.md](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/app-study/tools.md). Prepared November 6, 2026; separate wiki publication must be verified.
