# Portfolio viewer: deployed-bundle source study

Public source read on 2026-11-13 from the script URL linked by the actual Compact HTML:
https://www.kshv.me/_next/static/chunks/2sskne4s_ndv_.js?dpl=dpl_3JaKLDLxn4nXtGZjPCAKm1kXh537

SHA256: `889408d21dec78a96d56e0e00104175e7b32c6cd6548b7c98a4da1e174557357`.

This is read-only inspection of publicly delivered JavaScript, not a reusable-source license grant. No bundle code is copied into Athena, and none was executed in this analysis. It establishes the deployed **viewer shell**, not the implementation internals of each lazy-loaded experiment. URLs and behavior may change with deployment.

## Confirmed mechanisms

The registry contains all 18 named experiments and explicit slugs, dimensions, content widths and optional settling delays. Important non-obvious mappings are Dot meters to `halftone` and The Blue Hour to `blue-hour`. Viewer code constructs `/experiments/<slug>` links and source-owned `-still.webp` images from that registry, establishing provenance for the still-image study.

The overlay measures available size using ResizeObserver and bounds scale by content width and height. It morphs from a source tile using transform/clip geometry, falls back to opacity, and uses a reduced-motion branch. A still image remains underneath while the component is lazy-loaded after entry; a settling delay precedes the live layer's appearance. Cleanup stops registered animations, clears delayed activation and ignores late load completion after disposal.

The dialog sets modal semantics, labels itself with the experiment title, puts the underlying page in an inert state, locks document scrolling, focuses its close button and handles Escape. Previous/next controls wrap through the registry. Source also includes decorative muted preview video with play/pause driven by supplied state and a poster fallback.

## Gaps and transfer decisions

- The inspected lazy-load promise chain has no explicit rejection handler in that path. A failed chunk is a regression-test candidate, not a verified runtime failure.
- Modal role/inert/focus code is not proof of complete focus trapping or correct focus return. Test keyboard and browser Back explicitly.
- Source video-play rejection is swallowed; a poster fallback is useful, but do not interpret a displayed poster as playing video.
- The shell can drive preview playback. Athena's autoplay-off requirement overrides this reference behavior.
- Scaling a fixed-size experiment is not evidence of an accessible responsive layout. Check target size and readability at narrow widths and zoom.
- Measured mounting delay, input latency, GPU cost and memory are still missing. Do not promote constants or motion durations as optimal values.

## Original implementation plan

Use a registry with explicit route, title, preview and evidence status; keep navigable links functional without the overlay. Prefer a native dialog with audited focus return, route synchronization and a semantic document beneath it. Preload only on deliberate interaction or a bounded visible window; represent loading/error/retry explicitly. Preserve the static preview through successful readiness, but label it as a preview if the interactive module fails. Abort obsolete work on route change, stop animation resources on close, and never let a failed effect hide the close control. Keep motion as an optional layer over working navigation.

Acceptance: direct link and Back/Forward; keyboard open/close/previous/next; reduced motion; module404/network timeout; rapid next/close; mobile and200% zoom; resource disposal across100 opens; idle CPU and memory; and source-owned asset rights review. None has been claimed passed here.
