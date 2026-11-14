# Remaining source draft #9 portability parity

The original gallery draft also contained two independent portability fixes. This pass restores them without touching native Gallery, Lab or Audio:

- Research Explorer manifest keys and stale-output diagnostics use POSIX-relative paths on every host. The real builder is exercised with Windows `PureWindowsPath` relative-path semantics. The new test fails before the two-line fix and passes afterward.
- Engineering-scoped Git attributes pin seven asset/evidence extensions to LF. The historical adapter catalog keeps its exact CRLF bytes. The rule is scoped here instead of changing all Athena files or migration archives.

Source: preserved Atlas draft #9 `a723e81c73f403190ef44a9f8bea26e0f564f4f1`, relative to `990447b5f82b51d4a77f2d1c404836f3781e485f`. The source repository was not changed.

Validation: all 367 Python tests passed; source structure, Explorer generation, Media and Card asset identities passed. Actual Git checkout-index with `core.autocrlf=true` compared all 1,194 affected files byte-for-byte against the index, with zero mismatches. The catalog retained all 2,474 CRLF pairs and its original SHA-256 (receipt alongside this document).

An initial overbroad checkout assertion also compared unrelated extensions such as Rust/Python/YAML and failed because the seven-extension rule intentionally does not control those paths. It was corrected to the actual source#9 attribute scope; no broader formatting policy or normalization was silently introduced. This is Linux-based Windows-path and Git-conversion simulation, not native Windows acceptance. Existing Windows Rust CI does not establish Windows Explorer acceptance.
