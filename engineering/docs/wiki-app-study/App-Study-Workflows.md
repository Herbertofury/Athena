# Practical steps: from observation to an original implementation

[Study guide](https://github.com/Herbertofury/Athena/wiki/Engineering-App-Study) · [Tool inventory](https://github.com/Herbertofury/Athena/wiki/Engineering-App-Study-Tools) · [References and corrections](https://github.com/Herbertofury/Athena/wiki/Engineering-App-Study-References)

**Documentation only, not executed in this review.** Commands below are deliberately small examples for a separately authorized workspace. Replace placeholders and verify each installed tool's help/version first. Tool installation, persistent MCP registration, runtime control, uploads, paid services and public releases are separate decisions. Nothing here authorizes bypassing access controls or running an unfamiliar binary.

## 1. Set the question and evidence contract

1. Choose **one user-visible feature** and an owned/open-source/explicitly permitted target. Record its license/terms, exact build or commit, OS/architecture, artifact hash, and what may be observed.
2. Choose black-box observation, authorized internal analysis, or a licensed fork. Do not quietly switch tracks. Record prohibited actions and sensitive data that must never be captured or uploaded.
3. Use separate `research/`, original implementation `src/`, and `checks/` areas. This organizes evidence; it does not alone establish clean-room independence.
4. Create `MAP.md`: screens and navigation; feature inputs/outputs; data read/written/transmitted; evidence location; limitations. Label unproved behavior **unknown**, rather than inferring it from a screenshot or import.
5. Maintain `MATRIX.md` with feature, reference behavior, evidence, original implementation decision, tests and risk. Mark inaccessible/protected behavior out of scope. `FEATURE.md` or `BINARY.md` can hold deeper trace notes.
6. Use an evidence record with target digest/version, tool/version, command or observation method, time, output path/hash, coverage, errors and unknowns. An engine `evidence_id` supplements this record.

**Completion gate:** the implementation brief contains only permitted, supported behavior or explicit original design decisions. No unexplained guesses become requirements.

## 2. Setup review, not a blind “three-minute install”

1. Read the chosen release's official installation and license pages. Pin the version/commit and record the expected runtime/provider. Do not copy the article's old runtime minimums to a current install.
2. Review what setup will write and which agent configurations it touches. Start with one intended client, not every detected agent. Avoid global installation unless needed.
3. If installation/configuration is authorized, complete it with least privilege and a trusted package source. Restart only the affected client.
4. On an existing reviewed installation, inspect health/capabilities:

```sh
rea --help
rea doctor --json
rea providers --json
craft-anything-cli doctor
craft-anything-cli commands
```

5. Save provider gaps and errors. A missing provider is a reason to narrow the task or configure a justified provider, not to silently download another executable. Do not run both engine setup paths simply because both appear in the article.

The article's `npx … setup`, `npm install --global`, `cargo install`, `cargo run`, package-manager commands, `claude auth login`, and `claude mcp add` **execute code or change configuration**. They are not passive discovery commands. `claude auth status` can check an existing account, but account creation/login is not required to write this Atlas documentation.

## 3. Black-box UI and motion study

1. Capture a permitted walkthrough with a clean profile/demo data: initial state, input, success, failure, empty/loading, cancellation and repeated action. Capture 390, 834 and 1440 pixel widths only where relevant; fixed widths are comparison fixtures, not universal device coverage.
2. Use FFprobe to record duration and FFmpeg to sample frames. For an authorized recording:

```sh
mkdir -p research
ffprobe -v error -show_entries format=duration -of csv=p=0 recording.mp4
ffmpeg -i recording.mp4 -vf 'fps=1/2,scale=480:-1,tile=3x3' research/sheet_%02d.png
```

3. Record the sampling rule: nine frames at two-second intervals represent roughly 18 seconds per sheet. Inspect original playback for transition timing, short events and sound. Scene-cut sampling is supplemental and can miss subtle motion.
4. With Playwright, prepare a local project/browser dependency, create output directories, capture selected states, and close the recording context to flush video. Prefer explicit readiness assertions over using `networkidle` as the sole readiness signal.
5. If DOM/computed-style inspection is permitted, record general layout/type/color/motion observations in `STYLE-REF.md`; identify licensed replacement fonts/assets. Keep it distinct from a strict no-source black-box track.
6. Redact request logs before saving or sharing: URLs/query parameters, headers and bodies may contain tokens, private identifiers or content. Observing a URL does not permit calling its API independently.
7. Write an original `STYLE.md`: chosen design tokens, original assets/copy, responsive states, keyboard/focus behavior and reduced-motion fallback.

**Gate:** every conclusion points to a state/timecode/measurement; unseen behavior remains unknown. Pixel similarity is not accessibility, correctness or legal clearance.

## 4. Electron and JavaScript applications

1. Copy the permitted artifact and record its digest. Start with archive inventory, not execution. REA can statically inspect an application directory or ASAR.
2. If using a reviewed ASAR CLI:

```sh
asar list research/target.asar
asar extract research/target.asar research/app-src
jq '{name, main, dependencies}' research/app-src/package.json
```

3. Record main, renderer, preload and worker entry points. Trace **one** UI action to handler, IPC, native module and any permitted network/storage boundary. Cite file/line or engine evidence; keep gaps.
4. Treat the article's regex-based `ipc-map.mjs` as a starting heuristic. It misses dynamic channel names, aliases, bundler transformations and runtime registration. Validate selected call sites rather than claiming a complete IPC inventory.
5. Write your own typed contract in `shared/types.ts`. State inputs, output/errors, events, validation and cancellation. Do not copy target code, strings or assets into implementation.
6. For a licensed fork, compare source and shipped bundle and retain `FORK.md` plus license/notice inventory. A mismatch is a finding; a superficial match does not establish reproducible-build equivalence.

**Gate:** static map and tested behavior are separate. Reading a `.node` filename does not explain its native implementation.

## 5. Android APKs

1. Use a permitted copied APK and record hash/version/signing context. Avoid private device extraction or runtime interaction unless separately in scope.
2. Decode resources and decompile into separate folders:

```sh
apktool d research/app.apk -o research/apk
jadx -d research/jadx research/app.apk
```

3. Preserve decoder errors. Read manifest permissions, activities, services and receivers; validate manifest XML rather than relying solely on the article's `grep` patterns.
4. Trace a selected feature and network-library call sites. A permission declaration does not prove a permission is used; a URL/string is only a clue.
5. Specify a new protocol only for systems you control. Record authentication, encryption, errors and versioning. Do not reuse target keys, tokens, servers or proprietary message content.

**Gate:** no patching, repackaging, redistribution or paid-feature unlocking. Decompiled Java is reconstructed evidence, not original Kotlin/Java or a complete app model.

## 6. Native binaries and provider analysis

1. Begin with static format/import/string inventory on a copy. Select only commands appropriate to its platform:

```sh
file research/target
strings -n 8 research/target > research/strings.txt
# macOS Mach-O:
otool -L research/target
# PE binary with GNU Binutils:
objdump -p research/target.exe
```

2. Review which strings can be retained publicly. Load the binary into a compatible Ghidra, Hopper, IDA or Kuna workflow; do not execute the target merely to inspect it. Cloud decompilation needs separate data-transmission review.
3. Find one user-visible string or documented function, inspect references, then examine callers/callees and side effects. Mark decompiler uncertainty, unresolved indirect calls and unsupported instructions.
4. Keep original artifact immutable. Renaming/commenting functions changes the analysis database, even if the binary is untouched; allow only those analysis writes intended by the task.
5. Save a bounded `BINARY.md`/feature report and close sessions. The article's headless `ListFunctions.java` example needs an actual reviewed script; the filename alone does not provide one.

**Gate:** pseudocode stays in the analysis track; claims about runtime effects need runtime evidence or explicit qualification. Keep debugging/MCP bridges local and close them after use.

## 7. Original build and the Craft Anything loop

1. Turn `MATRIX.md` into a behavior-only spec with acceptance tests. If independence matters, enforce what the builder can access; a `--clean-room` flag or folder convention is not sufficient assurance.
2. Create a few interactive concepts with identical **clearly labeled synthetic data**. Choose one before a broad implementation. Keep `STYLE.md` current; use `MINIMAL.md` only as an explicit project-specific design decision, never as a way to override safety or user authorization.
3. Author `CONTRACT.md`, typed IPC and file ownership boundaries. For a licensed fork, `KEEP.md` records compatibility identifiers that cannot be casually renamed.
4. Use a small isolated build first. A spec-only article-style CLI example, after checking the installed CLI's flags, is:

```sh
craft-anything-cli rebuild - 'Build an original demo from the approved behavior specification' --rounds 1
```

5. Review `capture/`, `checks/`, evidence and `inbox/` rather than trusting “ready.” Keep the selected agent account, cost limit, network access and package installation scope explicit. Existing-folder edit modes can modify files in place.
6. If parallel work helps, assign disjoint files, one integration owner and bounded reviewers. The article's `agent`/`parallel`/`pipeline` sample is orchestration pseudocode without a complete specified SDK/runtime, not a ready-to-run Claude Code program.
7. Test every chosen feature and failure state. `nocopy.py` is only a coarse duplicate-string signal: it misses short strings, modified text, assets and logic, and can flag shared boilerplate. Neither zero hits nor a whitelist proves compliance.

**Gate:** a working vertical slice with explicit unknowns, original/appropriately licensed assets, behavioral tests and reviewed permissions. No claim of full parity from screenshots alone.

## 8. Packaged QA, release and optional launch work

1. Test the actual packaged application for each promised OS/architecture. Retain its digest/version, real or synthetic test classification, failures, permissions and screenshots. Use disposable fixtures for delete/move/overwrite paths, symlinks, junctions, short names, localization and cancellation.
2. Do not activate destructive actions on a real home directory to satisfy a demo. Trash is recoverable but still a state-changing action. Realpath checks alone do not eliminate time-of-check/time-of-use races.
3. Build with reviewed CI actions and minimal permissions. Separate artifact creation, signing/notarization, release publication and production deployment. Test download links for actual artifact existence, architecture and checksum, not just a 302 response.
4. If a site is wanted, preview it first; test touch/keyboard/focus, reduced motion, overflow and download failure states. GSAP/ScrollTrigger/Lenis are optional. A Lighthouse target requires a retained run, not a promised score.
5. If a film is wanted, make an original storyboard, a frame timeline, selected stills and a short test render before a full Remotion render. snapcn components are optional. Check voice/music/font/asset rights and provider costs. Verify narration alignment and audio loudness rather than assuming generation solved them.
6. If analytics is wanted, review consent/notice, retention and data destinations. The article's visitor hash is pseudonymous, and its visitors key lacks the expiry applied to events. A redirect counter measures download intent, not transfer completion. Protect credentials server-side, authenticate/rate-limit the dashboard and do not claim pipelines are atomic transactions.
7. Retain license/notice inventory and secret-scan results. No scanner proves there are no secrets. Publish or deploy only within explicit authorization, then read back the exact release/site.

**Final report:** supported features, deliberately original choices, weaker/missing areas, exact tests run, failures, remaining unknowns and publication state. Never convert an article's successful anecdote into acceptance for another project.

---

Canonical source: [docs/app-study/workflows.md](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/app-study/workflows.md). Prepared November 6, 2026; separate wiki publication must be verified.
