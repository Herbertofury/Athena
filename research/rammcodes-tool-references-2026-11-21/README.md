# Four software comparison references

These four upstream projects were named in [rammcodes's post](https://x.com/rammcodes/status/2124218896546992453) and its [author follow-up](https://x.com/rammcodes/status/2124218899952750662). The posts identify the references. The pinned upstream documentation and license files support the descriptions below.

This is a **reference-only research entry**, not an installation recommendation or an addition to Athena's generated Software discovery database. Read it as a comparison of ideas for software you own or are expressly authorized to inspect and test. No tool was installed, connected to an agent, or run. Performance, parity, portability and safety were not independently measured.

| Project | Distinct idea to compare | Evidence boundary |
| --- | --- | --- |
| [REA](https://rea.tools/) · [repository](https://github.com/morluto/rea) | Make behavior findings traceable to evidence, with uncertainty visible. | [Pinned documentation](https://github.com/morluto/rea/blob/d777c3c55f90421a35a7a032336c6f4f1c21dd17/README.md) describes this design. It does not establish coverage or permission to inspect a given target. [Athena's existing REA study](https://github.com/Herbertofury/Athena/pull/283) was a pending draft at review time; this entry does not duplicate or depend on it. |
| [Craft Anything](https://github.com/storytold/craft-anything) | Compare a clean-room implementation of one authorized feature with the behavior its specification requires. | The [pinned README](https://github.com/storytold/craft-anything/blob/e64d7cb73d7f39323b7040a984e0f9b3f7981146/README.md) describes analysis/build/comparison as separate stages and explicitly says the workbench is not a sandbox. A match claim is not independent verification. |
| [rust-anything](https://github.com/erkamyaman/rust-anything) | Translate one owned component while preserving its caller contract; use behavior checks to test the boundary. | The [pinned README](https://github.com/erkamyaman/rust-anything/blob/f60094c63a2fc271fb72bed6d52b752786d995d5/README.md) describes an incremental, replay-based port. Replay covers the cases it contains; missing cases remain unknown. |
| [fast-anything](https://github.com/EL4CTEO/fast-anything) | Profile an owned application before deciding whether replacing a single bottleneck is worth the work. | The [pinned README](https://github.com/EL4CTEO/fast-anything/blob/0db84ddc3a91d4d1ef047c7b22f2cd451c951bff/README.md) distinguishes profiling, behavioral comparison and function-level replacement. Its benchmark examples are author reports, not Athena measurements or transferable speed promises. |

## What to carry into owned projects

For feature parity, start with an independent behavior specification and original fixtures. Include failures, boundaries and representative inputs, and record what remains untested. For speed work, keep the original workload and correctness checks fixed, measure the baseline, and report uncertainty and regressions alongside any improvement. Never treat tooling agreement, matching visible output or a successful narrow replay as whole-application parity.

Nothing here grants rights to copy code, assets or private traces, to inspect an unauthorized target, or to add new agent access. The linked repository licenses apply to those repositories, not to software used as an input. Athena has not validated the four projects' portability or cleared them for execution.

The [structured ledger](tool-references.json) carries the exact source revisions, license links and publication boundaries for reuse without copying third-party material.
