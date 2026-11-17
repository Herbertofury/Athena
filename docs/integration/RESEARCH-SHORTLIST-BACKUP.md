# Native Research shortlist portability

The native Research workspace now offers **Download shortlist backup**, an explicit local file choice, a validated preview, **Replace shortlist**, and cancellation. This fills a recovery gap beside the existing CSV/test-plan exports; it is not a full Engineering migration or retirement claim.

Backup JSON contains only the format/version, catalog snapshot and ordered candidate IDs (zero to four). It contains no credentials, project content or execution instructions. Test-plan JSON is deliberately not accepted. All IDs must exist in the currently loaded catalog; a different snapshot produces a warning rather than silently discarding candidates. Unknown IDs, duplicates, oversized input and invalid formats leave the shortlist unchanged. The 16 KiB limit is checked before reading and against decoded UTF-8 bytes.

Replacement requires a separate user action after validation. A change to session selection or stored selection invalidates the pending replacement. Storage failure preserves current state. The cross-tab comparison is best-effort, not an atomic transaction across multiple browser tabs; serialize writers for reliable replacement. Cancellation, a later file selection and workspace disposal prevent delayed reads from admitting stale data. Export requests a browser download; it does not prove the operating system saved a file.

The retained original Explorer source and pure query engine remain unchanged. The native adapter copies the new focused module through the reproducible builder. No selected user data is committed. Explicit public packaging includes only the reviewed module and updated hashes.

## Acceptance

Focused model/DOM tests cover round-trip ordering, no implicit replacement, empty selections, invalid IDs/schema/size, storage failure, concurrent selection/storage changes, cancel/newer input, disposal and actual native mount. The browser acceptance harness adds a real download/import/cancel/round-trip test and screenshot. Its execution remains a separate gate; DOM tests are not proof of native file-picker or visual acceptance.
