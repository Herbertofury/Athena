# Keyboard access and accessibility verification

This staging update improves keyboard behavior and markup across Athena's existing learning views and all five workshops. Automated checks do not establish WCAG conformance or a complete accessibility audit.

## Using the controls

- The first Tab stop is **Skip to workspace content**. It moves focus to the main landmark without changing your route.
- Use ordinary Tab and Shift+Tab to reach links, buttons, fields and expandable source registers. Enter activates links/buttons; Space activates buttons and checkboxes.
- The **/** shortcut moves focus to search. Open **Keyboard options** to disable it. Your choice stays in this browser under a separate accessibility preference, not in learning progress exports. The shortcut ignores Ctrl/Alt/Meta combinations, composition, repeats, fields and editable regions. A Shift-modified key whose actual character is `/` remains supported for keyboard layouts that need it.
- Escape clears a nonempty search field while keeping focus there. In a native lesson dialog, Escape closes the lesson.
- A lesson starts with focus on its title, making the beginning of the long content available before its controls. Closing returns to the particular opener used, including repeated Packet Trail lesson links. Navigating to another route focuses the new view heading instead.
- Answers move focus to a textual explanation, including the correct answer. The two supplemental workshop checks do not change learning XP or the review schedule. Their reset buttons focus the first answer for another attempt.
- Filters, quest selection and the next review question retain a useful focus position after the view changes. Search result counts use a persistent status region without moving typing focus.
- The theme button exposes whether the light theme is on. System forced-color and reduced-motion preferences have dedicated styles.
- Import cancellation preserves current learning progress. The same file can be selected again, and a slower older selection cannot overwrite a newer selected file. Supplemental checks and keyboard preferences remain separate from learning exports.

## Verified locally

DOM checks exercise focus requests, repeated and delayed close events, navigation, all 42 workshop lessons, primary/supplemental feedback, labels and referenced IDs, shortcut guards/opt-out, search status, theme state and import ordering/cancellation. The complete existing learning, workshop, workspace-host and offline exercise suites remain in the aggregate check.

LinkeDOM cannot prove native dialog containment, visual clipping, actual focus visibility, browser zoom, screen-reader announcements or accessible-name computation. Those are separate acceptance tasks. No Chromium launch was attempted for this staging update.

## Prepared browser acceptance

On an authorized CI environment with the pinned browser installed, run:

```sh
npm run build
npm test
npm run test:browser
npm run test:browser:workshops
npm run test:browser:accessibility
```

The accessibility runner serves the actual files over loopback with a restrictive content-security policy. It requires successful keyboard-only navigation, skip-link behavior, shortcut opt-out persistence, native dialog Tab/Shift+Tab containment and Escape/return, stale-close regressions, feedback/filter/review focus, status regions, labels/unique IDs, all five workshops, narrow layouts and forced-color/reduced-motion checks. It records file hashes, screenshots and a JSON receipt, rejects outside requests and fails rather than silently skipping a missing browser.

The enlarged-layout case uses a 640 × 500 CSS viewport, equivalent in layout area to a 1280 × 1000 viewport at 200% page zoom. It is **not** a native zoom or text-only enlargement test. Actual text enlargement, 400% reflow, high-contrast rendering and screen-reader workflows still require human/native-browser review. Browser acceptance is currently **unrun**, not passed.

## Official guidance

The implementation and test plan draw on these W3C/WAI sources. They are design guidance, not an endorsement or certification of this app.

- [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): initial focus, contained keyboard navigation, Escape and return focus.
- [WCAG 2.2 character key shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html): an off switch for single-character shortcuts.
- [WCAG 2.2 status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): meaningful results without requiring a focus change.
- [WCAG 2.2 focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html): preserve an understandable sequence when content changes.
- [WCAG 2.2 resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): text enlargement without lost content or function.
- [WCAG 2.2 reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): small effective viewports without avoidable two-dimensional scrolling.

## Remaining review

Run the prepared browser gates on the final merged revision. Then review keyboard and reading order with representative screen readers, platform/browser combinations and real zoom/text-size settings. Inspect focus visibility, contrast in each state, live-message verbosity, download/import usability and the separate engineering workspace interfaces. Preserve failures and unrun checks explicitly; a passing local DOM suite is not a substitute.
