# Bounded experiment worker

2026-10-27: implementation and local HTTP validation, not an autonomous code-rewriting system. Published in commit `f06dcb9c64b179252973f6f86d32791301e3e00f`; Windows/Linux CI and Pages passed.

The fixed deduplication comparison now runs through the local queue. Explicit UI control only; no automatic startup work or arbitrary commands. Defaults: 6,000 generated IDs, two warmups, 15 paired measurements, 10,000 differential stress cases, cooperative 15-second budget. Individual operations may finish after the deadline; this is not a hard real-time limit.

`worker-http-2026-10-27.json` retains all 23 passing HTTP/storage checks, raw successful-run timings and cancelled partial evidence. Tested origin rejection, unsupported commands, duplicate active jobs, full parity, missing-evidence promotion block, append-only journal, graceful shutdown, retained prior success and SQLite integrity.

Peak memory and per-strategy cancellation remain unmeasured, so eligibility remains Incomplete. A successful execution is not candidate promotion. Generated IDs are not target-application evidence. Visual browser interaction acceptance remains pending. The measured times share a service process and must not be generalized to app performance.

Run `worker_http_check.py` only with the matching release binary available and port 41379 unused. It refuses to overwrite its prior SQLite evidence; choose fresh output paths for another run. Historical collection receipts retaining a disabled-runner response describe the older version, not this implementation.
