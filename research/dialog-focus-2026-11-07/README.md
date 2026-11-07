# Lesson dialog keyboard containment correction

Actual Chromium run [42405012444](https://github.com/Herbertofury/Athena/actions/runs/42405012444) on commit `131a6cbf` passed 13 static checks and all 12 workshop checks, then failed the lesson dialog Tab-containment assertion. The modal stayed open while focus left its subtree. No script error, CSP violation or outside request was recorded. Later Rust stages did not execute.

The application previously relied on native dialog behavior alone. The correction explicitly wraps Tab and Shift+Tab at visible, enabled, sequential controls. It recomputes controls after answers disable or replace buttons, handles title/feedback focus and a no-controls fallback, and leaves Escape, composition and browser shortcuts unchanged. Only `app.js` changes at runtime; its exact allowlist identity is refreshed. The browser assertion is not relaxed: it additionally retains focused-element and native modal diagnostics.

Three baseline unit regressions failed before the correction. All 24 focused accessibility tests now pass, and the complete local aggregate passes 236 JavaScript plus 313 Python tests with no failures or skips. The layout/focus model is explicitly synthetic. It is not browser evidence or WCAG conformance. Exact corrected Chromium and pinned Rust acceptance remain pending the next ordinary CI run. No local browser launch was retried. A separate review worker was unavailable; this is not independently reviewed.

The original browser reports are retained byte-for-byte. The original artifact is ID13587515228, SHA-256 `240604fdc79f2f3d2e022d0f4226f4bb33cd67461258145c687920d22446335f`. The baseline unit log redacts only its temporary checkout prefix; both hashes are recorded in `local-validation.json`. Original lesson content, workshop ZIPs, other workspaces, strict CSP and the unmerged reader-cancellation candidate are unchanged.

References: [WAI-ARIA dialog modal pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [WCAG focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).
