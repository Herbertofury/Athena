# Separate cover-only results from complete media

Checked 2026-10-27. Source ID: GDL02. [Exact upstream commit](https://codeberg.org/mikf/gallery-dl/commit/46163680fda0cbc976790d5678095d02b39d2b3e), parent `51d62e8cee646364cb2589a7f0b8ba2bf1a1f0ea`. This is a newly recorded master checkpoint, not a claim that stable 1.32.18 changed or that this commit appeared after the preceding hourly check.

## Static observations

The commit adds a dedicated Instagram highlight-cover extractor and corresponding documentation/test cases. That path requests the highlight tray and deliberately empties each entry's story-item collection before passing it onward for cover extraction. Cover metadata also gains an explicit cover type; its code field is derived from the identifier instead of copying the identifier unchanged. Four files changed in the reviewed diff.

These are upstream code observations, not a successful run. No upstream extractor was installed or executed, and no Instagram page/API, private account, cookies or tokens were accessed. The included upstream test case is not evidence that Atlas ran or passed it.

## Atlas consequence: candidate contract, not adoption

A future permitted adapter wrapping this kind of narrow route must label its result **covers only**. A deliberately empty story-item list cannot establish that a story has no media, and should not erase a previously complete snapshot. Preserve the raw source representation and distinguish cover identity from complete-post identity before deduplication or migration. This is a review hypothesis for future adapter acceptance, not a discovered failure in an implemented Atlas Instagram adapter.

The reviewed diff does not establish permission to use the provider route, authenticated completeness, performance, recovery or license compatibility for redistribution. Official/permitted access must be separately established. Keep the candidate isolated and make no recommendation in any other project's wiki or TODO without actual target evidence.
