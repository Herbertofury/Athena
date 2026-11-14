# Native Delivery workshop integration

Source: original Athena #11 at `311991d6c0b1abd9f88a87077fc4be853a0c758b`.
All 28 original source files are recoverable at that donor. The 27 implementation/content files remain byte-identical; one test now checks the actually selected allowlisted Git binary rather than hardcoding the original machine path.
This integrates only Delivery, not the four remaining supplemental workshops.

The native catalog now has 98 lessons and six workshops. Delivery contributes
8 lessons and 24 explained checks. Its eight primary checks use existing progress,
notes and review; the 16 supplemental checks remain practice-only and grant no XP.
The existing 90 lesson IDs and progress schema remain unchanged. The browser never
executes Git; downloadable local exercises use isolated disposable repositories,
no remotes, user repository, credentials, hooks or publication.

## Local acceptance, November 14, 2026

- All 102 original Delivery Python/actual-Git tests passed.
- Full npm test passed, including all six pack suites and generated/docs parity.
- Six-workshop actual Chromium acceptance passed at 19:53:55 UTC: 50 workshop
  lessons, 100 supplemental checks, exact downloaded ZIP hashes, repeat/reset,
  keyboard focus, history, progress and desktop/mobile layouts.
- Full unified static Chromium acceptance passed at 19:54:30 UTC.
- Dedicated Delivery notes/read/primary-grade persistence regression passed.
- Runtime allowlist changes are catalog SHA-256 and one Delivery ZIP entry only.

Initial local failures exposed outdated exact-count assertions and one mistaken
count edit. These were corrected to the actual complete inventory; prior failures
were retained, and final suites passed without skipping old lesson checks.

CI initially exposed an original machine-specific Git-path assertion; the repair preserves the allowlisted executable check. Actual accessibility Chromium also passed for all 50 workshop lessons.

These receipts are local Linux evidence, not native Windows, new hosted deployment,
certification mastery, real cloud operation or source-retirement acceptance.
