# Progress import durability repair — 2026-11-13

Base: `979cdfa72d213bec29fa88ffdb69249ec016c4b4`.

A storage quota/error during progress import triggered the existing session-only warning, but import immediately overwrote it with a success message. The imported draft remained in memory, while durable storage retained its previous value. This could mislead someone into leaving without exporting.

The save operation now returns its persistence outcome. Import reports either saved progress or session-only progress with an explicit export instruction. It preserves existing confirmation, validation, latest-import ownership, in-memory recovery and last-good browser storage behavior.

## Evidence

- Both added UI regression assertions failed on the original source.
- All 23 UI tests pass after the change.
- Full `npm test` passes: 135 shell/DOM tests, 105 media tests, repository Python validation, networking/package/workshop integration checks and all five offline workshop suites.
- The public runtime allowlist changes only the reviewed `app.js` hash.
- A focused Chromium acceptance runner covers simulated quota failure, last-good stored data, retained imported notes, export and successful retry/reload. Local Chromium could not launch because its process-singleton socket was not permitted. No real-browser pass is claimed locally. The runner is included before the existing combined browser CI gate.

This is a bounded import correctness repair, not full Athena release acceptance, private Foundry integration, real-provider playback or Windows engine qualification. Existing release gates remain in force.

## CI-discovered queued-close repair

The focused import browser gate passed on CI. The existing combined gate exposed a separate native-dialog race: Escape restores focus before its queued close event; after navigation and review interaction, that late event rerendered the new route and erased feedback or stole focus. Runs 43476569358, 43477812670 and 43478193850 retain failed browser artifacts. The bounded event trace records feedback/question focus followed by unexpected heading focus without navigation.

A deterministic queued-close regression fails on the original handler. A close from an obsolete route/query now leaves the newer view and focus untouched. All 25 accessibility DOM tests pass. The unmodified acceptance requirements still require hosted browser verification; this is not an accessibility conformance claim.

Run 43479062743 advanced through review feedback but exposed the same queued-close race during immediate Tab-to-next-lesson movement on the same route. Escape's cancel event and the close button now settle the close synchronously; the later native close event is inert. A second deterministic deferred-close regression covers this. All 26 accessibility DOM tests pass; final hosted acceptance remains required.
