# Local Rust runtime integration evidence

`http-receipt.json` retains the actual local Rust process/HTTP results against a frozen Athena package and a new generated-fixture database. The fixed deduplication workload is synthetic and is not a target-project optimization result.

The receipt records exact binary, harness and package SHA-256 identities, 31 served assets, security checks, the complete bounded experiment output and different ephemeral engine identities before/after a controlled restart. It excludes private account data and real user databases. The journal/archive remained intact after the controlled restart. This is not a power-loss test.

The full browser attempt reached and passed the same HTTP asset/security checks, then Chromium failed before opening a page with `socket() failed: Operation not permitted`. That environment failure is retained with the task's raw logs; it is not represented as a browser pass. The full public CI harness is `scripts/test_lab_runtime.cjs` and must independently pass native UI acceptance.

Local checks: 144 Rust library tests, 6 persistence tests, 3 ownership tests, all-target clippy, and 19 focused native adapter/theme tests passed. A first partial-checkout build failed because experiment source dependencies had not yet been materialized; verified published source dependencies were then copied and tests rerun. An initial DOM fixture used ShadowRoot.textContent, which LinkeDOM reports as null; the test now checks the actual paragraph node. No production guard was loosened to satisfy tests.

## Independent review corrections

The initial HTTP-only harness did not perform the final SQLite integrity/count assertion. Its unchanged earlier receipt is retained as `http-receipt-before-integrity-check.json`; it proves only the checks it lists. Both execution modes now share the same final read-only integrity/count validation before success. The corrected receipt records that additional check explicitly, with `integrity: "ok\n1"`.

Independent lifecycle review also reproduced a write while the initial Overview request was still pending. The adapter now disables all six write controls until initialization finishes and independently checks readiness/disposal in the submission function. A stalled-overview regression covers disabled controls, an artificially re-enabled programmatic submit, and navigation abort with zero POSTs. The existing post-ready uncertain-receipt behavior remains tested.
