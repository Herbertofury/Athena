# Local Rust runtime integration evidence

`http-receipt.json` retains the actual local Rust process/HTTP results against a frozen Athena package and a new generated-fixture database. The fixed deduplication workload is synthetic and is not a target-project optimization result.

The receipt records exact binary, harness and package SHA-256 identities, 31 served assets, security checks, the complete bounded experiment output and different ephemeral engine identities before/after a controlled restart. It excludes private account data and real user databases. The journal/archive remained intact after the controlled restart. This is not a power-loss test.

The full browser attempt reached and passed the same HTTP asset/security checks, then Chromium failed before opening a page with `socket() failed: Operation not permitted`. That environment failure is retained with the task's raw logs; it is not represented as a browser pass. The full public CI harness is `scripts/test_lab_runtime.cjs`; it subsequently passed independently in the CI run below.

Local checks: 144 Rust library tests, 6 persistence tests, 3 ownership tests, all-target clippy, and 19 focused native adapter/theme tests passed. A first partial-checkout build failed because experiment source dependencies had not yet been materialized; verified published source dependencies were then copied and tests rerun. An initial DOM fixture used ShadowRoot.textContent, which LinkeDOM reports as null; the test now checks the actual paragraph node. No production guard was loosened to satisfy tests.

## Independent review corrections

The initial HTTP-only harness did not perform the final SQLite integrity/count assertion. Its unchanged earlier receipt is retained as `http-receipt-before-integrity-check.json`; it proves only the checks it lists. Both execution modes now share the same final read-only integrity/count validation before success. The corrected receipt records that additional check explicitly, with `integrity: "ok\n1"`.

Independent lifecycle review also reproduced a write while the initial Overview request was still pending. The adapter now disables all six write controls until initialization finishes and independently checks readiness/disposal in the submission function. A stalled-overview regression covers disabled controls, an artificially re-enabled programmatic submit, and navigation abort with zero POSTs. The existing post-ready uncertain-receipt behavior remains tested.


## Completed full CI acceptance

[Run 42360535804](https://github.com/Herbertofury/Athena/actions/runs/42360535804) passed on exact repository commit `74c8191f776838edce29fc56d57c27bf46393a9a`:

- 9 static Chromium checks and 8 actual Rust-backed Chromium checks passed on Chromium 151.0.7922.34.
- 191 Rust all-target tests passed with zero failures; clippy passed. The earlier local 153-test count is preserved above rather than retroactively changed.
- 31 served assets matched their package manifest. Exact archived JSON survived dialog display and download, including the large generation ID and original Unicode/number spellings. A real bounded synthetic job recorded its full result and acceptance policy in SQLite. A controlled engine restart preserved the job and archive, and the final read-only SQLite check returned `ok` with one job.
- The tested flows produced no CSP violations, script errors or unexpected external requests. No provider collection, authenticated request or actual third-party playback was performed.

[ci/provenance.json](ci/provenance.json) records commit, run, artifact and file identities plus the precise path-redaction policy. Original artifact `athena-browser-evidence` has ID `13570015396` and GitHub-reported SHA-256 `9b3c9fb000aad856db73b01f5d4fd22360210473d73b9ea02aea45d8fe1ea133`. JSON reports are retained unchanged; CI checkout/temp prefixes alone are redacted in logs, with original and retained hashes recorded. The artifact also holds screenshots and the generated test database. None is a user's real database.

This establishes the listed Linux/Chromium integration behaviors, not every original runtime path, Windows support, interrupted-write/power-loss durability, unbounded stress acceptance, provider playback, a performance improvement, full Foundry integration or safe deletion of the old repository. The existing Pages setup remains unavailable; loopback tests are not a public deployed-site verification.
