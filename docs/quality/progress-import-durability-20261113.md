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
