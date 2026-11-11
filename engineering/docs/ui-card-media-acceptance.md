# UI foundations: responsive, accessible, complete cards

**Research checked 2026-11-11. Design synthesis and test protocol, not acceptance of Athena or another app.** Use with [performance](performance.md), [desktop architecture](desktop.md), [adapter/media contracts](adapters/author-post-media-contract.md), and [release evidence](testing-release.md). Existing card labs already study rendering strategies; this guide adds the user-facing acceptance contract, not another framework ranking.

## 1. Define the usable outcome before optimizing

A mod manager, library, learning app or asset browser needs three separate clocks:

1. **Input feedback:** the app acknowledges the action without freezing input.
2. **Complete usable result:** the correct records, metadata, warnings, controls and required media state are available.
3. **Durable result:** a promised save has committed and the required restart/readback check succeeds.

This separation is our application-design synthesis. A spinner can improve feedback while the full task remains slow. A search with missing warnings is an incorrect result even if it is fast. Declare workload size, content/byte distribution, accepted failure states, target hardware and budgets before testing. Retain both cold and warm conditions, complete outputs, failed attempts and exact build identities.

### Choose metrics that answer the actual question

INP concerns click/tap/keyboard response through the next paint opportunity, not completion of later network work. It does not measure scrolling. The documented good field threshold is at most 200 ms at the 75th percentile of page visits, segmented by mobile/desktop; that is not a p95 gate for arbitrary local samples. A diagnostic test should report its own scope and measure completion separately. [UIAC26001](https://web.dev/articles/inp)

Event Timing exposes event start, handler start/end and a quantized duration. Events with the same nonzero interaction ID belong together; use their maximum duration rather than summing them. Zero IDs do not represent an identified interaction. Feature support, thresholds, delivery timing and missing samples matter. The [bounded local collector](../experiments/ui-interaction-evidence/README.md) produces observed-sample statistics, deliberately not INP. [UIAC26002](https://w3c.github.io/event-timing/)

Use browser traces for main-thread/layout attribution, a separately declared scroll/frame protocol, and a complete-result oracle. Node DOM timings do not measure browser layout, image decoding, focus behavior, accessibility trees, GPU memory or visible pixels. A double-animation-frame wait is a scheduling proxy. Do not rename it physical input-to-paint evidence.

## 2. Keep dense cards understandable

Adopt a stable information hierarchy, then compare density variants on actual tasks:

- First: title, creator/source identity, type/version compatibility, freshness and completeness.
- Next: concise description and the primary action with its actual state.
- Explicit details: complete body, ordered galleries/files/dependencies, provenance and warnings.
- Never merge distinct authors/accounts just because display names match. Never infer an unavailable cover from a gallery image without labeling the transformation.

These are proposed product contracts, not WCAG requirements or measured gains. Test full-record search, selected state, keyboard position and details after filtering, sorting and refresh. The count of DOM nodes or number of cards in a screenshot cannot establish useful density. Record the task, viewport, zoom, visible information, clicks/keystrokes and mistakes as well as elapsed time.

Start with semantic lists, headings, links and buttons. A CSS grid layout does not require an ARIA grid. An interactive ARIA grid is a composite widget with an explicit directional-key and focus model; add it only when that interaction serves the task and can be maintained and tested. [UIAC26013](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)

### Reflow and control size are not optional density tradeoffs

For ordinary horizontally written content, verify reflow at a 320 CSS-pixel width without loss or two-dimensional scrolling. A 1280 CSS-pixel viewport at 400% zoom is a useful corresponding setup. Necessary two-dimensional regions can qualify for exceptions; a whole card catalog does not gain an exception merely because it is visually a grid. Preserve readable labels and details. [UIAC26004](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

WCAG 2.2 AA target-size minimum is 24 by 24 CSS pixels, with specified spacing and other exceptions. The 44 by 44 criterion is enhanced AAA, not the AA minimum. Prefer comfortably larger primary controls where possible; if using an exception, record which and test it rather than counting all small icons as automatic failures or passes. [UIAC26005](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## 3. Give focus a single owner

Treat route changes, asynchronous results and overlay close events as competing generations. This is a proposed application pattern: only the current owner may publish results or restore focus. A completed stale request must not steal focus from the new page. Preserve stable element identity when practical and check ownership immediately before publication.

For a modal, move focus inside on open; keep its tab sequence contained; make Escape and a visible close control work. Restore focus to the invoker or a logical next location when the invoker is absent or workflow has advanced. A long structured dialog may need initial focus on its title rather than forcing all content into one description. APG is informative implementation guidance, not an independent WCAG conformance certificate. [UIAC26006](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

Test repeated open/close, Escape followed by route navigation, old close events arriving after a new modal, filtering away the invoker, Back/Forward and an error arriving after dismissal. Assert actual focused element, displayed page, URL/history and visible state after the sequence. A timeout added to the test runner is not a product fix.

Sticky headers, banners and panels must not entirely obscure a component when it receives keyboard focus under SC 2.4.11. Full unobscured visibility is the stronger enhanced goal. Separately inspect focus indication and contrast; a correct DOM focus value alone is inadequate. [UIAC26007](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)

Announce brief search completion, waiting and error status without moving focus when they are status messages. Do not turn every result card into an assertive live announcement. Verify the actual announcement with a screen reader rather than treating an attribute inspection as sufficient. [UIAC26008](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

Respect reduced-motion preferences and offer a way to disable non-essential interaction animation. SC 2.3.3 is AAA; supporting it can still be a product requirement. Automatic motion has separate pause/stop/hide considerations. Keep meaningful progress and completion states when animation is disabled. [UIAC26009](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## 4. Distinguish metadata, loading and usable media

Use an explicit state model rather than a single green check:

`unrequested → loading → ready`, with separate `failed`, `blocked`, `cancelled` and `unavailable` outcomes. Image-ready, metadata-ready, playback-started and completed playback answer different questions. These state names are our suggested contract, not a browser API enum. A provider or source-identity failure must remain visible through filtering and later successful loads.

For images, reserve dimensions/aspect ratio, keep an honest placeholder and use responsive source selection where appropriate. Lazy loading controls deferral; it does not establish that decoding succeeded. The HTML documentation distinguishes loading policy, decoding hints and image APIs. Keep a missing source different from a failed request. [UIAC26010](https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element)

Choose alternative text from the image's purpose: informative meaning, functional destination/action, or empty alternative for decoration/redundancy where appropriate. Filenames and repeated card titles are not a universal solution. A missing-image message is state information, not a substitute for the original image's meaning. [UIAC26011](https://www.w3.org/WAI/tutorials/images/decision-tree/)

Treat `play()` as asynchronous and handle policy and unsupported-source rejection. A poster or metadata event does not establish playback. `preload` is a hint and may be ignored; it is not a guarantee of zero requests. If a product requires no remote media before explicit activation, defer attaching remote sources/embeds and verify the network trace. Recheck behavior in the intended webview. [UIAC26012](https://html.spec.whatwg.org/multipage/media.html#media-elements)

Reserve space for embeds as well as images and inspect shifts during loading and later interactions. A load-only test can miss later instability. Document gaps in frame/iframe observability rather than converting an unavailable counter to zero. [UIAC26014](https://web.dev/articles/optimize-cls)

Test a visible card while its image fails, while a video starts, after a blocked play, after changing source, during filtering and after switching workspaces. Verify player position/selection preservation where promised, explicit cleanup where required, and no stale events rewriting the new card state. An optimization that remounts active players or hides warnings fails parity.

## 5. Choose the smallest intervention that addresses evidence

| Candidate | Worth testing when | Disqualifying cost or missing proof |
|---|---|---|
| Stable keyed updates | Repeated updates recreate meaningful DOM | Wrong keys preserve another record's state; focus/media parity required |
| Batched rendering or cooperative chunks | Traces locate long main-thread work | Extra delay to full completion, stale result publication, partial-state bugs |
| Worker preparation | CPU preparation dominates | Transfer/validation/commit still blocks; account for all stages |
| Offscreen rendering containment | Layout/paint dominates, retained DOM affordable | Search, focus, hidden descendants and layout shifts must be checked |
| Virtualization/windowing | Measured retained DOM/memory is limiting | Unmounted search/selection/focus/media must have a correct alternative |
| Compact cards with details | Actual reading task benefits | Truncation, extra navigation, lost warnings or inaccessible details |

This is a decision matrix, not a ranking. Existing [card lab](card-lab/index.html), [worker ownership guidance](worker-transport-and-ownership.md) and [performance guide](performance.md) provide deeper implementation research. Reject rewriting everything, adding a worker for every task or choosing virtualization from record count alone. Measure the actual bottleneck and maintenance cost.

## 6. Acceptance protocol

Use the [unrun receipt template](../templates/ui-acceptance-receipt.json). Pick exact browser/webview and OS versions, hardware, app revision and package hash. Freeze workload identity, feature/security/output parity and scenario budgets before candidate runs. Record network/cache conditions, media mode and observer configuration. Do not pool unloaded previews with decoded images or active players.

1. Execute known-result functional and state-ownership cases first.
2. Measure paired baseline/candidate runs in alternating or randomized order, retaining individual samples and failed attempts. State how many independent runs and scenarios were observed.
3. Record actual keyboard/touch/pointer behavior, visible layout at narrow/zoomed sizes, and relevant assistive-technology results.
4. Report feedback, complete usable result, persistence, memory and scrolling separately. Declare unsupported, not run, blocked and failed states explicitly.
5. Inspect the release artifact and installed launch path. Require the same acceptance after integration or dependency/runtime changes.

WCAG 2.2 is the normative reference; its Understanding documents and APG help interpretation. A subset of automated checks, a screenshot or this protocol cannot establish full conformance. Include manual evaluation and users/assistive technologies appropriate to the intended audience. [UIAC26003](https://www.w3.org/TR/WCAG22/)

**Current result:** only the diagnostic collector's synthetic tests and offline evidence arithmetic are executed by this contribution. All real browser, media, accessibility, native-webview and performance-comparison gates remain unrun. No target app receives an optimization recommendation from this document alone.
