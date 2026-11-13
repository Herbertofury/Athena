# Sandbox still-image analysis and implementation plans

Reviewed 2026-11-13. These observations concern **creator-provided stills**, not live execution, source-confirmed effect mechanisms or successful interactions. Each source is the public portfolio's `/experiments/<slug>-still.webp`. Slugs and still URL construction were read from the deployed viewer registry, not guessed from display names. No images or code are redistributed here. Proposed implementations are original engineering plans, not reverse-engineering claims or target adoption recommendations.

All plans below require a semantic HTML baseline, keyboard/touch testing, reduced-motion behavior, explicit loading/error states and a measured comparison against the target's current implementation. An attractive reference is not evidence of improved usability. See also [Compact/Sieve observations](visual-studies.md).

## Headroom
Source: https://www.kshv.me/experiments/headroom-still.webp

Observed: dark storage dashboard, segmented pixel-textured usage bar, category amounts, free/used totals and cache action. Hierarchy prioritizes capacity before categories and contextual action.

Proposed architecture: normalize storage facts into `{capacity, used, available, categories, scannedAt, scanState}`; derive segment widths from actual bytes and reconcile rounding without inventing precision. Use CSS/SVG for segments, text for all amounts and a table equivalent. Decorative pixels must not imply exact allocation. Cache removal must show scope, recoverability and progress; never infer deletion permission from visual placement. Tests: inconsistent totals, zero/unknown capacity, huge sizes, stale scan, cancellation, inaccessible paths, overflow and dense-category readability. Original live view previously appeared sparse, so this still does not prove the runtime scan state.

## Errand
Source: https://www.kshv.me/experiments/errand-still.webp

Observed: dark bottom-anchored natural-language composer with submit affordance; no result or action state visible. Proposed implementation separates draft, parsed intent, proposed action and executed action. Keep input controlled, support IME/multiline, prevent duplicate submit and preserve draft after failure. A scheduling sentence is not permission for hidden external execution: show resolved participants/timezone and action boundary. Test empty/ambiguous requests, cancellation while processing, keyboard submit versus newline and server timeout. Additional expanded states remain unobserved.

## Almanac
Source: https://www.kshv.me/experiments/almanac-still.webp

Observed: two-part dark date/time capsule with differently colored icons and a divider. Proposed implementation uses one zoned timestamp model, separate date/time controls, explicit timezone and locale formatting; never parse the display string back into canonical time. A compact closed state should expand into keyboard-accessible inputs. Test DST gaps/overlaps, midnight rollover, 12/24-hour formatting, date-only values and narrow layouts. Calendar, picker and transition behavior are not visible.

## Spill
Source: https://www.kshv.me/experiments/spill-still.webp

Observed: compact dark inbox selector with icon and chevron. Proposed implementation uses a real menu button with expanded state, focus management, keyboard arrows and selected-item indication; use a select when simple selection is sufficient. Maintain stable IDs and separate unread count from route state. Test empty destinations, long names, slow loading, focus return, Escape and touch targets. Open menu geometry and motion are unknown.

## Sand
Source: https://www.kshv.me/experiments/sand-still.webp

Observed: centered workspace-setup heading, single pale input and prominent blue action. Proposed implementation uses a labeled form, explicit submit state and idempotent creation request, not decoration-driven state. Preserve input on failure, show validation adjacent to field, and distinguish a preview from a real workspace creation. Test whitespace/long/Unicode names, duplicate clicks, offline retry, permission denial and account boundary. Any sand/disintegration effect is unobserved and must not be asserted from the title.

## Aqua bubble
Source: https://www.kshv.me/experiments/aqua-bubble-still.webp

Observed: blue translucent bubble-like icon controls, selector, numeric slider and next button; grain and highlights blur edges. Proposed implementation keeps native controls/labels underneath a decorative CSS/SVG skin. Begin with layered gradients and shadows; only compare a shader if essential fidelity cannot be achieved within the budget. Maintain text contrast, enlarged hit areas and forced-colors fallback. Tests: keyboard range steps, drag capture/cancel, scaling, focus ring visibility and reduced-effects preference. Shader/refraction and pointer physics are unknown.

## Burn
Source: https://www.kshv.me/experiments/burn-still.webp

Observed: account-deletion warning with affected-data counts and hold-oriented action. Proposed implementation is a finite-state controller: idle, confirming, holding, canceled, submitting, succeeded/failed. Pointer release, lost capture, focus loss and Escape cancel before submission. Provide an accessible non-timed confirmation alternative. Backend authorization, idempotency and recovery policy are independent of animation. Test partial hold, double events, server failure and stale counts. A visual hold is not sufficient consent for irreversible deletion. No real deletion was attempted; burn animation is unobserved.

## The Blue Hour
Source: https://www.kshv.me/experiments/blue-hour-still.webp

Observed: newspaper-like editorial composition, oversized serif masthead, thin rules, metadata cells, columns and paper texture, partly cropped in the still. Proposed implementation keeps article DOM/heading hierarchy first; use CSS grid for masthead/metadata and responsive single-column reading before adding paper decoration. Avoid fixed-height clipping of actual text. Test font loading, long headlines, text selection, printing, zoom and screen-reader reading order. Perspective/drag effects are not established by the still.

## Dot meters
Source: https://www.kshv.me/experiments/halftone-still.webp

Observed: image-preview card with light frame and small action controls. The still does not reveal the meter animation. Proposed implementation separates job state from preview, uses object-fit without hidden cropping, and exposes progress text plus cancellation/retry if there is a real job. Decorative halftone should be a replaceable overlay, not the sole progress signal. Tests: missing image, expired URL, slow/error load, repeated regeneration and keyboard button labels. No actual generation service was exercised.

## Omnitrix
Source: https://www.kshv.me/experiments/omnitrix-still.webp

Observed: stylized missing-page composition using particle-like numerals and a mechanical circular center. Proposed implementation delivers correct HTTP404 and semantic explanatory text/navigation first, with a static original illustration fallback. A bounded particle layer may add decoration only after meaningful content loads. Pause when hidden and honor reduced motion. Test missing route versus asset failure, direct navigation, no-JS fallback, canvas loss and memory growth. Distinctive franchise imagery needs independent rights review; do not copy it into Athena.

## Walkman
Source: https://www.kshv.me/experiments/walkman-still.webp

Observed: skeuomorphic music-player shell with pixel-style display, artwork, timeline, transport, repeat/shuffle/favorite controls and volume dial. Proposed implementation wraps an HTML media element in a single playback state machine; derive controls from actual media events rather than optimistic icons. Use native range semantics for volume/seeking even when styled as dials. Autoplay stays off. Test play rejection, buffering, codec failure, seek bounds, ended state, audio focus and stale metadata. Displaying a track in the still is not evidence that audio played; music/artwork rights are separate.

## Model cards
Source: https://www.kshv.me/experiments/model-cards-still.webp

Observed: chat transcript, wide composer, small cartridge-like model indicator, send control and speaker icon. Proposed implementation separates draft, chosen model, request snapshot and response stream. Freeze model identity per submitted message; indicate unavailable model and preserve drafts during changes. Use a labeled selection control rather than relying on miniature artwork. Test streaming cancellation, switching during request, failed retry, very long transcripts and screen-reader announcements. Card swapping and sound behavior are not verified.

## Hearth
Source: https://www.kshv.me/experiments/hearth-still.webp

Observed: pixel-grid fireplace display in a metallic device frame, knobs, slider, transport and sound controls. Proposed implementation separates simulation state, render quality and optional audio. An original canvas effect can use fixed-step updates and interpolation, with capped resolution; preserve a static fallback and do not start audio automatically. Test pause actually stops computation, hidden-tab idle cost, rapid mount/unmount, control extremes and reduced-motion mode. Flame dynamics and audio playback are unverified.

## Liquid slider
Source: https://www.kshv.me/experiments/liquid-slider-still.webp

Observed: four labeled numeric sliders with glossy colored fills and narrow metallic-looking thumbs. Proposed implementation uses native range inputs with controlled numeric values, separate visual fill and optional animation; avoid a shader unless comparison justifies it. Label/unit/value remain readable outside the decoration. Test Home/End/arrows, RTL, touch scrolling versus drag, pointer cancellation, min=max, decimal steps and forced colors. Motion/refraction and actual volume/system-setting effects remain unknown.

## Letter toast
Source: https://www.kshv.me/experiments/letter-toast-still.webp

Observed: notification styling controls, duration/position choices and folded-paper notification with close affordance. Proposed implementation uses a bounded toast queue with stable IDs, polite status announcements and a persistent notification history for consequential messages. Pause expiry on focus/hover and offer non-expiring important notices; never steal focus for routine status. Use original CSS fold decoration, not copied textures/signature. Test burst updates, duplicate IDs, action failure, keyboard dismissal, safe-area positioning and timer cleanup. The depicted deployment message is sample content, not real deployment evidence.

## Sundial
Source: https://www.kshv.me/experiments/sundial-still.webp

Observed: illustrated architectural frame, seascape sunset and Roman-numeral circular dial. Proposed implementation models time/phase separately from illustration and exposes a plain-text time plus accessible range/buttons if adjustable. Original SVG layers can provide geometry; animate only optional decorative layers. Test timezone/locale, midnight wrap, reduced motion, keyboard adjustment and low-power fallback. Actual clock synchronization, dragging, lighting and sound are unverified.

## Cross-design acceptance matrix

For each reference, next evidence must include default/hover/focus/pressed/loading/error/empty/disabled states where applicable, touch and keyboard operation, mobile/zoom screenshots, reduced-motion capture, frame/input latency, idle and active memory, unmount cleanup and source/license identity. Compare original prototypes against the target baseline with identical data and hardware. None of these stills closes runtime acceptance or proves any mechanism is best.
