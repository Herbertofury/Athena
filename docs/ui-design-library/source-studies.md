# UI reference research: Keshav Bagaade + Three.js

Status: public-source research, 2026-11-13. User-selected favorites/inspiration, NOT measured best-in-class or approved replacements. No rendered interaction or target-project performance tests were performed in this pass. No X post-level inventory verified: https://x.com/kshvbgde returned403. Public portfolio was readable through web search. Source analysis is distinct from runtime acceptance.

## Verified creator inventory
Primary index: https://www.kshv.me/ ; creator spells name **Keshav Bagaade**. Index links X https://x.com/kshvbgde and GitHub https://github.com/keshav-exe.

Projects: mdxcn https://www.mdxcn.dev/ ; Gradii https://gradii.kshv.me/ ; Clove https://clove.kshv.me/ ; Shotput https://shotput.kshv.me/ . Additional index references: Nodge https://nodge.app/ ; BetterCSS https://bettercss.dev/ ; macOS26 Tahoe recreation https://macos.kshv.me/ ; Fermion https://fermion.app/ ; Colors https://colors.kshv.me/ . These are attribution/index findings, not full audits.

18 sandbox designs indexed: Headroom; Compact; Sieve; Errand; Almanac; Spill; Sand; Aqua bubble; Burn; The Blue Hour; Dot meters; Omnitrix; Walkman; Model cards; Hearth; Liquid slider; Letter toast; Sundial. Headroom, Compact and Liquid slider detail pages returned title-only content in text extraction. Do not fabricate materials, motion, controls or implementation from their names. Each still needs desktop rendered observation and state-by-state capture. Only homepage-discovered detail links should be persisted, not guessed slugs.

## Gradii: implementation-level study
Primary source: https://github.com/keshav-exe/gradii/tree/6a492df048ba30de6f5f469ff08aea67cebe28a7 . Cloned and read, not executed. LICENSE is MIT, copyright2025 Keshav Bagaade. Preserve license and attribution for reused source. Repository source and currently deployed site identity have NOT been proven identical.

### Composition and adaptive layout
`components/studio/studio.tsx` implements desktop preset rail264px, flexible center artboard and inspector320px. Inspector separates Gradient/Effects/Layers. Floating size and tool controls sit over the artboard. Mobile replaces the side rails with a bottom controls section46dvh and four panel tabs. Focus mode removes chrome, retains an exit action. `ResizeObserver` in `stage.tsx` fits output dimensions into available artboard space rather than stretching content.

Transferable recipe (proposal): isolate document state from panel/focus state; provide a stable center preview and contextual inspector; use shared controls across desktop/mobile; use min-height0 and separate overflow regions to avoid trapped scrolling. Retain semantic labels and keyboard navigation. Test320px through ultrawide,200% zoom, safe-area insets and long translated labels. Exact rail sizes are reference values, not a recommendation for Athena without comparison.

### Rendering/motion
`stage.tsx` layers a WebGL canvas with separate image and text canvases. Preview quality samples24 frame intervals; above22ms reduces scale by0.8 to minimum0.45; below13ms increases by1.15 up to1. Device-pixel ratio is capped2 and draw surface roughly5MP. Dirty flag avoids unnecessary draws, but requestAnimationFrame loop continues. Reduced-motion preference disables initial playback in `studio.tsx`. Context-loss/restoration handlers exist. Overlay async loading checks against current document before drawing, preventing stale overlays.

Transferable recipe (proposal): keep semantic UI in DOM, isolate expensive visual engine, adapt preview pixel budget separately from full-quality export, invalidate on state/size changes, and explicitly recover GPU context. Do NOT assume zero idle cost: the source loop still schedules frames. Actual CPU/GPU memory and hidden-tab performance require measurement. Renderer cleanup deliberately avoids disposal on remount; stress-test repeated mount/unmount before borrowing that lifetime strategy.

### Undo and persistence
`store/studio.ts` uses Zustand; edits update document immediately and settle into undo history after350ms, with about80 prior states. LocalStorage persists document, saved library and handle visibility after400ms. Up to60 saved entries. Hydration validates saved documents. IMPORTANT weakness: quota failure falls back to persisting the document with image.src=null; broad catches suppress errors. This is NOT complete durable storage and must not be copied into Atlas/Athena as proof of reliability.

Transferable recipe (proposal): coalesce drag edits into meaningful undo transactions, but use durable blob-capable storage and explicit failure/incomplete-save states. Test crash/reload inside debounce window, quota exceeded, malformed imports, full image roundtrip, cross-tab conflict and undo after loading. Keep last-good snapshot.

### Export correctness
`lib/export/video.ts` uses WebCodecs VideoEncoder plus mp4-muxer, probes H.264 configurations, rounds output to even dimensions, supports cancellation/progress. Frames are rendered offscreen at explicit phase values instead of screen-recording dropped realtime frames. `stage.tsx` imports overlay routines also used by export.

Transferable recipe (proposal): use a single scene/document representation and shared renderer for preview/export; capability-test codecs and show an unsupported state. Verify first/last loop continuity, exact frame count, overlay parity, cancellation cleanup, memory ceiling and export fidelity. Source comments claiming frame-perfect output are not independent runtime proof.

## Colors: second source-backed study
Source https://github.com/keshav-exe/colors/tree/70948597ea97c97338eece33c344456297187a83 . Cloned and inspected `app/page.tsx`, not run. No top-level LICENSE was found in this checkout: record reuse rights as unverified, do not copy its code just because public.

Source shows color input, uploaded-image pathway, a color store, format copying, CSS-variable/Tailwind export, and generator dialog modes palette/scheme/swatch with analogous, monochromatic, complementary and triadic choices. Useful pattern: one canonical color model feeding multiple output formats, explicit preview then apply flow, and contextual export. Proposed implementation must add parsing/error tests, gamut/alpha roundtrip checks, keyboard operation, clipboard-denial handling and contrast validation. Color-harmony generation itself is NOT an accessibility guarantee.

## mdxcn and Clove: official-page evidence, not code audit
mdxcn current source moved to https://github.com/shadcn-labs/mdxcn and current site https://www.mdxcn.dev/ states Shadcn Labs affiliation. It offers text-character React/MDX components and plain-text equivalents, screen-reader summaries and theme integration. Candidate use: compact evidence timelines and comparison tables. Test actual reading order and mobile reflow. Older markdown-graphs branding/API totals must not be treated as current registry facts.

Clove current landing https://clove.kshv.me/ describes configurable menu tiles, keyboard-oriented search/insert/copy, and storage breakdowns. Useful pattern: compact overview with details on demand and explicit action shortcuts. Site claims dormant panels avoid hidden work; unmeasured. Current pricing is paid lifetime/early-bird, unlike older free skill-only page. Do not propagate stale pricing or equate product claims with benchmark results.

## Excluded false source match
https://github.com/keshav-exe/www at96e64d575956479d0e5187b5a648376cd2dc343c is **Zen Browser Website**, according to README and package.json. It is NOT evidence of the current kshv.me sandbox implementation.

## Three.js reference track
User-added favorite/source: https://x.com/threejs . Official examples https://threejs.org/examples/ and source https://github.com/mrdoob/three.js . Three.js is an engine/example ecosystem, not a claim that every showcased UI should use3D.

Three verified official source pages for focused implementation studies:
- https://github.com/mrdoob/three.js/blob/dev/examples/webgl_materials_physical_transmission.html : physical transmission/material study; relevant to glass-like visual exploration. Evaluate text legibility, background dependency and rendering cost before applying to controls.
- https://github.com/mrdoob/three.js/blob/dev/examples/webgl_multiple_elements.html : multiple scene elements; candidate study for many interactive card previews. Need viewport/scissor, visibility and memory analysis before implementation claim.
- https://github.com/mrdoob/three.js/blob/dev/examples/css3d_periodictable.html : CSS3D layout example; useful spatial card arrangement study, not evidence3D improves retrieval over a flat grid.

These source pages were verified accessible but have not been deeply source-audited or rendered in this pass. Pin a commit before reuse. Resolve licenses for models/textures separately from engine license. Keep accessible DOM alternatives, reduced-motion controls, static fallbacks, no unsolicited autoplay, renderer/resource cleanup and bounded GPU budgets. Compare against existing Athena requirements before recommending adoption.

## Completion gates
For each design: preserve primary URL, creator, source commit if any, capture date, viewport/state, license, observed behavior, source-confirmed mechanisms, inferred recipe, keyboard/touch/reduced-motion findings, failure states, target comparison and next test. Separate indexed/source-read/rendered/interaction-tested/implemented/benchmarked/accepted statuses. Never upgrade status because a catalog entry exists.
