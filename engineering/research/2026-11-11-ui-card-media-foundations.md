# UI, accessibility and card/media acceptance foundations

**Checked:** 2026-11-11. **Evidence:** primary documentation plus original design synthesis; synthetic tooling tests only. **Baseline:** Athena main `44384b809c80e03adbd62f8be9617d01e6ad9922`.

## Decision and prior-art review

The existing [performance guide](../docs/performance.md), [desktop architecture](../docs/desktop.md), [card lab](../docs/card-lab/index.html), [media lab](../docs/media-lab/index.html), [media contract](../docs/adapters/author-post-media-contract.md) and [release guide](../docs/testing-release.md) already cover scheduling, worker transfer, card strategies, source identities and evidence limits. They do not need another generic framework list or a synthetic throughput leaderboard.

Open Athena drafts were inspected before work. [#24](https://github.com/Herbertofury/Athena/pull/24) owns the navigation/focus correction; [#13](https://github.com/Herbertofury/Athena/pull/13) owns gallery metadata presentation; [#8](https://github.com/Herbertofury/Athena/pull/8) owns missing-cover semantics. [#27](https://github.com/Herbertofury/Athena/pull/27) and [#28](https://github.com/Herbertofury/Athena/pull/28) add mod and recovery-first app foundations. Their source, tests and index additions are not copied or modified. Active integrated-release and native-platform work are outside this contribution.

The gap addressed here is a reusable **acceptance contract joining interaction measurements, accessible input/focus, complete card content and real media states**. The [guide](../docs/ui-card-media-acceptance.md) and [unrun receipt](../templates/ui-acceptance-receipt.json) turn that into concrete checks. The [small diagnostic utility](../experiments/ui-interaction-evidence/README.md) prevents common metric mistakes without pretending to supply a browser test result.

## Opened primary sources and applicability

All fourteen URLs were opened and relevant sections read on the checked date. Summaries are original; no third-party images, media or source code are copied. Living/editor documents may change, and documented behavior is not proof of support in a pinned embedded webview.

| ID | Source and observed document | Contribution |
|---|---|---|
| [UIAC26001] | [web.dev INP](https://web.dev/articles/inp), updated 2025-09-02 | Response versus completion, field versus local statistics |
| [UIAC26002] | [Event Timing](https://w3c.github.io/event-timing/), current editor document | Event grouping, timestamps, rounded durations and observation limits |
| [UIAC26003] | [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Recommendation 2024-12-12 | Normative reference distinct from partial checks |
| [UIAC26004] | [Reflow understanding](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), current informative guidance | Narrow/zoomed layout and bounded exceptions |
| [UIAC26005] | [Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), current informative guidance | AA minimum versus AAA enhanced and exceptions |
| [UIAC26006] | [APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), current pattern | Focus ownership and logical return |
| [UIAC26007] | [Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), current informative guidance | Sticky-content and visible-focus inspection |
| [UIAC26008] | [Status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), current informative guidance | Useful announcements without taking focus |
| [UIAC26009] | [Animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), current informative guidance | Reduced motion and correct AAA labeling |
| [UIAC26010] | [HTML images](https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element), Living Standard dated 2026-11-09 | Image selection, size and loading/decoding distinction |
| [UIAC26011] | [WAI alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/), current tutorial | Purpose-specific alternatives |
| [UIAC26012] | [HTML media](https://html.spec.whatwg.org/multipage/media.html#media-elements), Living Standard dated 2026-11-09 | Play rejection and preload hints |
| [UIAC26013] | [APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), current pattern | Visual grid versus composite interaction model |
| [UIAC26014] | [web.dev CLS](https://web.dev/articles/optimize-cls), current article | Reserved dimensions, post-load and iframe observation gaps |

## Executed and unexecuted evidence

All 1,549 existing Engineering blobs were verified against the exact main Git tree before editing. Only one existing file changes: the additive source-index entry for `ui-card-media-20261111.json`. The guide, template, source fragment, research note and utility/tests are new. Preserve this fragment alongside concurrent draft fragments during any later integration; do not replace the entire index with one branch's version.

The utility has 34 deterministic tests. Its six synthetic entries produce three identified interactions and explicitly retain the zero-ID count. The retained JSON summary is re-derived in a test. Tests cover grouping, missing evidence, finite/numeric validation, ordering, privacy projection, unsupported/error distinction, observer options, pending records, stop idempotence, overflow and snapshot isolation. Independent review found that non-buffered observation was overstated as scenario isolation and that CLI output could omit collector-loss metadata. The corrected wording explicitly retains in-flight boundary uncertainty; the CLI now validates and carries collection status/loss fields, labels entry-only coverage unknown, rejects partial collector metadata rather than losing supplied failure evidence, and never certifies completeness. Eight added regressions cover these boundaries. No production browser telemetry or private trace is included.

Full engineering test/check results and exact remote identity are reported in the draft pull request. The baseline has an inherited Research-check failure for the Lab README's cross-root documentation link; this work does not weaken that checker or copy the separate correction from draft #4. Any local partial or failed aggregate check remains qualified rather than silently called green.

**Not run:** real browser input, Event Timing delivery in a browser, scrolling/frame traces, computed card layout, image decoding, video playback, keyboard/focus acceptance, assistive technology, native webviews, full-app latency/memory comparison, installed launch or release acceptance. The receipt starts every real scenario at `not_run`. No browser sandbox change or browser launch is part of this contribution. No app/mod is made faster or declared accessible by these synthetic checks.

## Rejected shortcuts and next gate

- Do not label observed event p95 as field INP or use a fast handler as complete-task evidence.
- Do not choose virtualization or a new framework before identifying actual retained-DOM/layout/CPU costs.
- Do not make a dense catalog less complete to achieve a nicer screenshot or shorter timing.
- Do not treat accessibility attributes or synthetic observer tests as assistive-technology acceptance.
- Do not merge this research into release branches automatically. First run the receipt on the actual target build, compare equivalent-work candidates and retain failure history.

This adds an operational foundation, not a target-project adoption decision. Revisit when the target runtime, accessibility scope, data shape or measured bottleneck changes.
