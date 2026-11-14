# Conditional edit and revalidation lab

Original standard-library Python experiment using generated SQLite state and a real, temporary, synchronous loopback HTTP server. **Not a production service, general HTTP implementation, browser cache test, or application upgrade.** [Foundation guide](../../docs/conditional-edit-foundations.md) · [Research note](../../research/2026-11-11-conditional-edit-foundations.md).

## Reproduce

From `engineering`, with Python 3.12 and its SQLite module:

```sh
python3 -m unittest discover -s tests -p 'test_conditional_edit.py' -v
python3 -O -m unittest discover -s tests -p 'test_conditional_edit.py' -v
python3 experiments/conditional-edit-lab/run_demo.py /tmp/athena-conditional-NEW
```

Choose a nonexistent output directory. The demonstration refuses to reuse it and retains every generated database and result. Tests retain their generated `athena-synthetic-conditional-*` temporary directories and receipts; they do not delete previous evidence. No dependencies, external network calls, credentials, real app databases or automatic retries are needed. Loopback socket permission is required. Versions actually executed are in the receipt; a documentation version is not an execution version.

## Evidence

- [Six-case complete HTTP demonstration](demo-result.json), including exact request/response body hex, headers, source hashes, original/final document and history.
- [Initial 36-test log](initial-tests.log), before transport hardening.
- [Final focused suite](focused-tests.log), 37 tests.
- [Optimized-Python suite](optimized-tests.log), 37 tests; runtime validation does not rely on removable assert statements.
- [Aggregate validation](validation-summary.json), with inherited failure disclosed separately.
- [Independent review](review-summary.json), distinguishing early code-only review from final artifact review.

The six scenarios are stale-editor refusal, wildcard overwrite negative control, weak write refusal, missing condition explanation, a tiny cache-revalidation client model and exact-byte JSON/HEAD responses. The fixture uses a 1024-byte body cap, eight parsed tags and a 1024-byte condition-field cap. These are local design limits, not protocol-wide recommendations.

The 37-test suite additionally checks two SQLite writer connections, precommit rollback, postcommit response loss, version reuse, precedence, condition grammar, framing/header guards and revision exhaustion. The HTTP server is intentionally synchronous. A transport failure after commit remains an unknown result to the caller; a stale retry is not proof of non-commit or a deduplicated response.

Strong base-tag edits protect the tested old revision; wildcard edits deliberately do not. A 304 has no payload and no Content-Length here. The minimal client model retains its old bytes rather than replacing them with the empty payload. No browser, proxy, HTTP/2/3, TLS, login, load, crash/power-loss durability, performance, restore-epoch or production acceptance is claimed.

The SQLite artifact is generated research state only. Do not point this code at a user-selected database or expose the fixture listener as an application API. Read the guide's target acceptance gates before any adaptation.
