# Fast-file-read pillar and implementation backlog

Source: owner request 2026-11-17, study WizTree MFT scanning and apply beneficial
optimizations across projects, including NTFS plus folder/network/USB/non-NTFS fallback.

Completed foundation: `crates/project-file-inventory` implements read-only supported
Windows volume metadata enumeration and portable streaming traversal; tested parser
and traversal; cross-compiled Windows check; synthetic Linux benchmark recorded.

Not complete: live Windows/NTFS correctness and performance, consumer runtime wiring,
hard-link/path reconstruction, allocation totals, incremental journal refresh, UI
progress and bounded IPC, dedicated network-cancellation worker policy. These are
release gates, not silently dropped scope. No user security setting changed.

Adopt only after representative measurement shows preserved results and benefit.
Projects: Athena, MO2R, Modhunter, Noxviola, Modding-Knowledge. Their shared feature
contracts must stay compatible while features remain independently usable. Avoid
confusing faster metadata inventory with faster content/semantic parsing.
