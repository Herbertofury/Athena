# Original MusicHub to native bridge parity acceptance

This extends, rather than claims to rediscover, the local all-room conversion acceptance recorded at Athena `1a8a7b88865e1b6e3e1b48d366fe674da05d974b`. That prior run tested all34 original-shaped contexts through fresh Rust CLI processes, all six providers and batch rollback at first/middle/last occupied destinations. The new maintained regression adds the actual current Python bridge's versioned HTTP handler contract and runs through the existing Windows/Linux native CI matrix.

## New maintained gate

`tools/foundry-recovery/music/test_bridge_parity.py` dynamically enumerates every current catalog room and generates synthetic original MusicHub v2 records, all six permitted provider families, Unicode labels, alternating optional provenance and exact millisecond timestamps. It invokes the actual converter command, upgrades a newly created private temporary SQLite store explicitly, imports through the real Rust CLI, and retrieves every row through the actual bridge handler/CLI path. The handler uses in-memory response capture, not a socket or browser. Two fresh bridge objects and independent Rust processes return exact records and stable version tokens. Reads and a refused repeated import retain exact DB bytes; original source/mapping remain byte-identical. Missing native binary fails acceptance rather than silently skipping this new gate.

No provider URL is visited. No owner data, credentials, source artwork, playback or arbitrary private directory is used. Temporary synthetic databases are never published. Native rendering, playback, live user import and repository retirement are not proven.

## Local versus hosted

The local13-test music suite passes using an existing schema15 executable with SHA-256 `f76da70849bb53aa75f13f28484383bbaa65f089f0de38245515dd1c22c7d6e0`. Its current-source rebuild was **not performed**: `cargo: command not found` in this environment. This is exploratory local coverage, not current-binary qualification. `local-tests.txt` retains the result. Hosted CI builds the exact PR's locked Rust source before running the same suite on Windows and Ubuntu; verify that result separately before acceptance.

No production code change was needed by this test locally. Original repositories and held patches are untouched.
