# Recover failed Lab reads without waiting for stream cleanup

## Scope and lineage

This is a narrow correctness port into Athena, based on its published main
`ee911ee94acae88ee037885daba35a6723e5d7f2`. It reconciles only the reader-cleanup
portion of [Engineering Atlas draft #7](https://github.com/Herbertofury/Engineering-Atlas/pull/7),
whose source head remains `1333c5dd7833573687966c32781ea87b68ec9a14` and source base
`de9481e07b31a12918fa2cd53909e706d207b225`.

The two implementation modules match that draft's correction exactly. Its four
regression cases are retained, with added cleanup-throw/rejection coverage and
Athena lifecycle checks. The unrelated audio-player changes in that source
draft are **not** imported. No source PR is closed, no other draft is accepted,
and no migration deletion gate is declared complete.

## Reproduced defect

Both the job receipt reader and saved-archive reader awaited `cancel()` while
handling already-invalid responses. A response stream is allowed to leave
cancellation pending. That cleanup could therefore hide the original error
indefinitely: the job action stayed locked and the saved-response loader did
not return to its retained last-good view.

The baseline run used current Athena implementation bytes, the existing reader
tests, and four source-draft regressions. It passed 16 of 20 tests and failed all
four stalled-cancellation cases. [The original failed log](baseline-tests.log)
is retained. This is a controlled response-stream fixture, not evidence of a
live provider outage or a target-project speedup.

## Correction

- Request cancellation once, attach rejection handling immediately, and do not
  await it before returning the original validation error.
- Abort the job transport when its receipt becomes unconfirmed, attempt lock
  release, and keep the exact existing warning to check Overview before retrying.
- Preserve exact-byte, hash, identity, namespace, size, generation and receipt
  validation. The fix does not accept partial or invalid data.
- Regenerate the unified Lab's modules from the retained source. There is no
  dependency on the old repository at execution time.

## Verification before publication

- [Reader protocol suite](fixed-reader-tests.log): **30 passed**, including all
  project/version/upstream tests, permanent pending cancellation, synchronous
  cancellation throws, rejected cancellation promises, lock release and a
  single job request with an aborted transport.
- [Native Lab DOM/lifecycle suite](fixed-lab-tests.log): **8 passed**, including
  unlocked failed submissions with an unconfirmed warning and an available
  exact last-good archive after cleanup fails. No automatic job resubmission.
- [Normal aggregate suite](aggregate-tests.log): **70 root JavaScript tests**
  passed. One of those runs the 30-test protocol suite. The Python suites also
  passed: 3 wiki, 7 network fixture, 8 loopback and 12 packaging tests, plus
  catalog/link validation. Counts are overlapping, not additive.
- Both adapter generators reproduce their expected bytes. The browser harness
  passes syntax checking. A new actual-Chromium check exercises four native
  `ReadableStream` failure paths with in-memory responses and records exact
  request/cancellation counts; it does not submit extra durable jobs.

Actual Chromium acceptance of this change remains pending the destination PR's
CI. The previous implementation's browser pass does not certify these new
bytes. Local Chromium is not retried after its earlier permission restriction.
The full existing CI lane will also recheck actual Rust-backed queue behavior,
controlled restart, served hashes, SQLite integrity and same-origin protection.

## Limits and reproduction

This bounds error-path cleanup. It does not make arbitrary injected transports
that ignore abort obey a read deadline, prove real provider playback, establish
Windows behavior, or certify power-loss durability. It changes no host/CSP
rules, cloud settings, credentials, database schema or source visibility.

From the Athena root:

```sh
node --test engineering/tests/job-submit.test.mjs engineering/tests/archive-view.test.mjs engineering/tests/version-archive-view.test.mjs engineering/tests/upstream-archive-view.test.mjs
node --test tests/lab_workspace.test.cjs
python3 scripts/build_lab_workspace.py --check
python3 scripts/build_engineering_workspaces.py --check
npm test
npm run test:browser
```

`provenance.json` records source and changed-file identities and log hashes.
Only the local repository prefix was replaced by `<REPOSITORY>` in logs.
No screenshot, credentials, real provider payload or private database is
published with this evidence.
