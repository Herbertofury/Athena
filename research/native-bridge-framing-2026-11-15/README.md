# Native Foundry bridge framing regression

Athena's actual native HTTP handler accepted ambiguous duplicate Content-Type and
empty Transfer-Encoding headers. Its `str.isdigit()` length check also accepted
non-ASCII digit characters: superscript digits raised an uncaught `ValueError`,
while other Unicode digits reached parsing despite not being HTTP ASCII decimals.
A very long decimal header could similarly raise outside the guarded parse.

The repair requires exactly one supported Content-Type, rejects any
Transfer-Encoding header and validates bounded ASCII Content-Length before parsing.
Valid ordinary/zero-padded lengths still dispatch once; rejected input never reaches
the native CLI. Existing bounded rejection draining remains unchanged. This is
application request validation, not an OS/network setting change. No source
repository, runtime manifest, backup/import schema or held migration patch changes.

`before.txt` retains the failing actual-handler reproduction (six tests; five
failing subcases and two errors). `after.txt` records all six new tests and four
existing rejection-drain tests passing. These use an in-memory HTTP handler
transport, **not real sockets**. Real CLI/preconnect/static-boundary tests could not
run locally because the freshly selected worktree has no built Rust binary; hosted
Windows/Linux native CI builds the binary and remains the integration gate.

Run:
```
python -m unittest discover -s native/foundry/tests -p test_request_framing.py
python -m unittest discover -s native/foundry/tests -p test_rejection_drain.py
```
No claim of entire native migration or source-repository retirement readiness.
