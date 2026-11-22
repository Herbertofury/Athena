# Test-only native Scrapbook readback experiment

This tests bounded duplex pipe collection against a **new disposable SQLite
fixture**, not a destination writer. Nothing calls it from production code.
It neither stages a candidate nor opens an existing database or proposes a
Windows access, permissions, or file publication policy. It does not change
the POSIX-only Scrapbook candidate work.

The existing native Foundry workflow runs Python 3.13 on Ubuntu and Windows,
builds the native store with Cargo, then discovers
`tools/foundry-recovery/scrapbook/test_*cli.py`. The test needs no change to
those steps, permissions or their variables. In that hosted environment it
requires `GITHUB_WORKSPACE` to match the checkout and uses exactly the built
`crates/athena-foundry-store/target/debug/athena-foundry-store[.exe]`. A missing
or mismatched build is a failure, not a skipped native test. An explicit local
`ATHENA_FOUNDRY_STORE_BINARY` override requires
`ATHENA_PIPE_PROBE_EXPECTED_SHA256` from an independently trusted build record;
a passed-in checksum is not, by itself, authorization to execute anything.
On Windows the test passes an absolute existing `SystemRoot` and fixture-local
temporary paths to the child, without passing through the outer shell env.

Run on a prepared checkout:

```sh
python -B -m unittest discover -s tools/foundry-recovery/scrapbook -p 'test_duplex_readback_probe_cli.py' -v
```

The actual native test sends a synthetic input larger than a normal pipe buffer,
reopens schema 15, verifies exact complete JSON at the output cap and rejects
one byte less. It verifies the disposable database and compiled executable
bytes stayed unchanged during readback. The companion process tests verify
bounded binary I/O under backpressure, zero and exact cap, overrun while
input is blocked, absolute timeout, EOF before exit, broken input and nonzero
exit. They check the direct child was reaped and both worker threads/pipe
objects terminated. Windows remains untested until that exact hosted matrix
case is observed; Python object closure is not a kernel handle leak audit.

A two-second failure cleanup budget is separate from the monotonic command
deadline. Initial OS process creation may not be interruptible. Output is
capped at the pipe reader, not buffered with `communicate`. The runner assumes
one trusted direct child; it neither supervises arbitrary descendants that
inherit standard I/O handles nor provides OS-level containment. It is a
qualification of the readback concept, not of migration, ACLs, no-replace
publication, live-state consistency or source retirement.
