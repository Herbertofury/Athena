# November 6, 2026: article-led app study tools

## Scope and decision

The user asked to add all tools and practical steps from Movez's app reverse-engineering article to Engineering Atlas and its wiki. This pass stays within that article: it does not start an app rebuild or add unrelated recommendations. The saved HTML, companion images and supplied PDF were available; relevant image tables were inspected as well as prose. The original article is [linked](https://x.com/0xMovez/status/2118736658006769893), not republished. Raw captures, account UI, copyrighted screenshots and private paths are excluded.

## Deliverables

- [Study guide](../docs/app-study/README.md), including route selection and access boundaries.
- [Tool inventory](../docs/app-study/tools.md), separating tools, libraries, services, snippets and 29 named engine operations.
- [Eight practical workflows](../docs/app-study/workflows.md), with bounded commands, evidence artifacts and acceptance gates.
- [Reference trail and corrections](../docs/app-study/references.md), separating example apps/galleries from dependencies and untested marketing claims.
- [Prepared wiki projection](../docs/wiki-app-study/README.md); this is not automatically a live wiki update.

## Evidence and alternatives

Selected upstream primary documentation was read directly. Source facts, article anecdotes and proposed workflows stay separate. This review did not run installers, create persistent access, authenticate, analyze target apps, probe networks, build an application, buy API usage or deploy a site. The article's model label, speed, stars, download counts and reviewer scores are not Atlas measurements. Other supporting-tool links are canonical navigation entries, not an audit of every release or every license clause.

Prefer a one-feature black-box study, then justify deeper analysis. Reject unattended whole-product cloning as a default: it lacks a bounded rights/data model and independently demonstrated parity. A licensed fork is an alternative when exact licensing/notice/source obligations fit the project; it must not be called a clean-room rewrite.

## Source register

Added one fragment without rewriting historical source rows. `data/source-index.json` includes it. Each entry records the check date separately from a release/version or documentation snapshot. Source IDs reviewed for this pass:

- [ARTOOL1001] REA package manifest
- [ARTOOL1002] REA README
- [ARTOOL1003] REA CLI and evidence
- [ARTOOL1004] REA MCP contracts
- [ARTOOL1005] REA installation
- [ARTOOL1006] REA Kuna provider
- [ARTOOL1007] Craft Anything README
- [ARTOOL1008] Craft Anything generated tools
- [ARTOOL1009] Craft Anything tool status
- [ARTOOL1010] Claude Code overview
- [ARTOOL1011] Codex CLI
- [ARTOOL1012] Gemini CLI
- [ARTOOL1013] Cursor documentation
- [ARTOOL1014] OpenCursor example
- [ARTOOL1015] OpenMausBot example
- [ARTOOL1016] TwinDesk example
- [ARTOOL1017] Open CoDesign example
- [ARTOOL1018] ArtCraft official suite
- [ARTOOL1019] Cloudflare Vinext account
- [ARTOOL1101] Ghidra
- [ARTOOL1102] GhidraMCP
- [ARTOOL1103] IDA Free
- [ARTOOL1104] Official IDA MCP
- [ARTOOL1105] Electron ASAR
- [ARTOOL1106] Playwright installation
- [ARTOOL1107] Playwright repository
- [ARTOOL1108] Playwright CDP
- [ARTOOL1109] Chrome DevTools Protocol
- [ARTOOL1110] JADX
- [ARTOOL1111] Apktool
- [ARTOOL1112] Apktool repository
- [ARTOOL1113] FFmpeg license
- [ARTOOL1114] electron-builder documentation
- [ARTOOL1115] electron-builder repository
- [ARTOOL1116] GitHub Actions
- [ARTOOL1117] GSAP ScrollTrigger
- [ARTOOL1118] GSAP no-charge license
- [ARTOOL1119] Lenis
- [ARTOOL1120] Remotion license and terms
- [ARTOOL1121] Remotion pricing license
- [ARTOOL1122] snapcn
- [ARTOOL1123] snapcn repository
- [ARTOOL1124] Rive plans
- [ARTOOL1125] Jitter plans
- [ARTOOL1126] Fish Audio capabilities
- [ARTOOL1127] OpenRouter Fish S2.1 Pro
- [ARTOOL1128] Upstash Redis getting started
- [ARTOOL1129] Upstash Redis JS SDK
- [ARTOOL1130] Refero Styles
- [ARTOOL1131] Inspora
- [ARTOOL1132] 60fps
- [ARTOOL1133] Bencho
- [ARTOOL1134] Recent
- [ARTOOL1135] GetLayers
- [ARTOOL1136] Launch Videos Gallery agents
- [ARTOOL1137] OpenRouter terms
- [ARTOOL1138] Upstash terms
- [ARTOOL1139] Vercel hosting terms
- [ARTOOL1140] GitHub terms
- [ARTOOL1141] Remotion terms

- [ARTOOL1020] TypeScript upstream license

## Retrieval and execution limits

Motionin, Beyond Media AI web design and Rent My Header could not be retrieved with the available web reader. Their article links are retained with unverified availability. FFmpeg's legal page timed out; the official source LICENSE was read instead. None is labeled dead solely because retrieval failed.

GitHub main and wiki were cloned read-only. Wiki HTTPS write preflight could not authenticate, so no wiki mutation executed. No browser/computer tool is available in this workspace, and no credential grant was created. A prepared projection and additive navigation remain available for a supported authenticated publisher. Main-repository publication and check results are recorded in the [accompanying validation receipt](../experiments/app-study-doc-validation/receipt.json), not inferred from local files.
