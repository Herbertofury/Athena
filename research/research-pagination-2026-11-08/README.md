# Preserve the selected Research page

Date: 2026-11-08. Base: Athena `b1f82a9f1ac516848f6c95d4b9b87801e6090589`.

## Reproduced defect

The workspace host intentionally sends its current search after a mount. Research treated even an unchanged search as a new filter and reset the page to one. Consequently page links, reloads and saved page restoration could lose the requested page. Four isolated real-host/native-adapter regressions fail on the exact base; the changed-search control passes. The retained 283-entry public catalog is unchanged.

## Narrow correction

Normalize the query with the existing 300-character limit, then return when it equals the current Research query. A genuinely different query still resets pagination and rerenders. This is scoped to the generated Research adapter and its exact generator. It does not change the shell lifecycle, original standalone Explorer, provider access, shortlist storage, ranking or catalog data. Changing host initialization instead was rejected because other workspaces may need its initial synchronization.

## Verification

Eight focused tests, 141 root JavaScript tests, 105 standalone Media tests and 313 Python tests pass. All 18 generated workspace files reproduce; the 37-file reviewed public-preview package passes exact hashes. The independent research checker still reports its existing `apps/atlas-lab/README.md` cross-root link error; no guard was weakened.

The additive existing-browser-lane check verifies the served Research module hash, page 2 deep link, different page 3 cards, reload, saved workspace return, and page-one reset on a changed query. Actual Chromium acceptance is pending CI, not inferred from DOM emulation. No local browser launch or permissions/workflow changes occurred.

Raw local logs are retained and their exact SHA-256 hashes are in [evidence.json](evidence.json). The fix claims correctness only, not a measured performance gain. Other open drafts and held/denied actions are not included.
