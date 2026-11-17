# Security/privacy research: evidence-gated intake

Reviewed 2026-11-17. A completed ChatGPT Pro research pass supplied 25 product
writeups, a proposed record structure, an ingestion manifest, and 16 proposed
acceptance tests. This package promotes **six independently checked source-claim
groups**, not the entire model answer. Private conversation identifiers are not
published. No software was installed, security settings changed, or execution
benchmarks performed during this review.

## Useful confirmed distinctions

- Windows Sandbox enables networking and clipboard sharing by default. Treat
  those as separate integration boundaries, not proof of complete isolation.
- VeraCrypt documents qualified BSD platform support. Its Windows portable mode
  still needs administrator privileges and a driver and can leave registry
  evidence; documented driver-unload exceptions exist.
- KeePassXC lets users choose the database location, but configuration and local
  state are separate. Its guide documents `KPXC_CONFIG` and `KPXC_CONFIG_LOCAL`
  overrides. A portable database is not proof that all application state stays
  beside the executable.
- Official documentation identifies SDelete 2.06 (March 5, 2026) and ClamAV 1.5.4.
  These dated observations are not promises that those versions remain latest.

See [source-checks.json](source-checks.json) for exact official URLs, review
method, untested behavior and proposed portability acceptance checks. These are
source checks, not security certifications or independent execution results.

## Intake rules for Athena and downstream databases

Keep documented claims, implementation inference, unknowns and measured results
separate. Attach evidence per claim, not a single global `verified: true` flag.
Preserve separate dimensions for binary, database, configuration, state, cache,
logs, temporary files, registry, drivers, services and administrator dependency.
A ZIP/AppImage or user-selected database path must never imply fully portable
storage. Use synthetic data and isolated owned test machines for later tests.

## Backlog and status

- Complete: actual Pro research generation, six representative primary-source
  checks, portable-data distinction and machine-readable source ledger.
- Not promoted: remaining product claims, pricing, telemetry defaults, platform
  matrices, audit status and performance assertions pending individual review.
- Not run: the proposed portability/residue, migration, crash, update and restore
  tests. The ledger explicitly records this boundary.
- Follow-up: map each reviewed claim to existing canonical product IDs before
  changing catalog facts; preserve existing records and avoid duplicate entries.
- Publication: this focused research package is a review candidate, not evidence
  of live application ingestion, merged code, or deployment.

## Validation

```sh
python3 research/security-pro-2026-11-17/validate.py
python3 scripts/build_software_catalog.py --check
python3 -m unittest discover -s tests -p 'software*_test.py'
```
