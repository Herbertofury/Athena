# Decompilation receipt consistency experiment

Original Athena utility, informed by the [FNV primary-source study](../../research/fnv-decomp/STUDY.md). No FNV code or game data included.

Run `python -m unittest discover -s experiments/decomp-claim-gate -v` from the repository root. The ten fixtures are synthetic, not FNV validation.

`assess(receipt)` checks caller-declared identities/counters and distinguishes invalid, incomplete and internally consistent declared scope. It never asserts independently verified truth, source reuse permission or a playable port. A forged but internally consistent receipt can pass: authenticated runner attestations, exact manifest binding and independent recomputation remain mandatory integration work. It cannot detect a caller intentionally declaring a smaller scope; UI must bind scope IDs to a trusted task manifest and display denominators. Unknown fields do not override computed status.

No file access, target execution, network or permanent persistence occurs. Inputs must be private sanitized metadata; this does not grant permission to publish executable bytes or private paths. The study includes the real follow-through backlog. App UI is not wired to this experimental Python helper.
