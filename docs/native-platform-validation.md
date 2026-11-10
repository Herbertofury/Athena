# Native platform validation

The independent native-platform workflow tests the already-public local backend
on Linux x64 and Windows x64. It does not launch a browser, ship an installer,
publish an application release, or include the pending Foundry frontend.

It preserves repository bytes without CRLF conversion, pins Rust 1.99.1, uses
the dependency lockfile, runs library/binary tests and
warnings-denied Clippy, then builds an actual release executable. A Python
standard-library harness starts that executable against a verified runtime and
new synthetic journal in a directory containing spaces. It checks exact assets,
Host/Origin/request-marker protections, the original catalog, history writes,
restart readback and SQLite integrity. Existing user state is never discovered.

The test refuses an occupied fixed loopback port and terminates only the process
it created. Linux uses SIGINT. Windows deliberately uses forced process
termination after a confirmed write and says so in its receipt. That is not a
graceful-shutdown or power-loss guarantee.

Windows snapshot storage remains unsupported. The gate requires its capability
to report `unsupported_platform`, both snapshot routes to return 501, and an
explicit snapshot-directory startup request to fail. Linux without snapshot
configuration must report `not_configured` and return 503. No platform guard or
secure filesystem constraint is weakened.

Receipts contain source, binary and manifest identities, platform/architecture,
checks and exact remaining limits. A successful Windows job establishes native
x64 backend execution only, not Windows GUI, ARM64, installer, original-state
migration, provider playback or integrated Athena acceptance. The existing
browser workflows and their unresolved gates remain unchanged.
