# REA source study and Athena adoption backlog

Reviewed 2026-11-17. Canonical upstream: [morluto/rea](https://github.com/morluto/rea), pinned at `d5a942177fad030d3caf0f8d39856c116e3e5cda`, package `rea-agents` 6.9.0. The package repository field and official README agree on identity. Similar-name repositories were not substituted.

## What is delivered

- A real entry in Athena's searchable **Software discovery** database, built from `data/software/rea-expanded.json`, not just a chat recommendation.
- `study.json`: ten original, actionable findings linked to twenty explicitly bounded source/doc/test ranges and full-file SHA-256 values. Each proposed Athena application remains marked **not implemented**.
- A 57-module coverage queue. Enumeration is not review: untouched modules remain **queued**, and inspected modules are **partially reviewed**, not complete.
- This workflow and exercise, plus a regression test to keep source coverage, adoption status and catalog identity honest.

This is a first source-level investigation, **not** a claim that Athena has learned everything, that REA was installed, or that all of its tools work. No upstream code was executed. No entire-source, arbitrary-app reconstruction, quality or token-saving guarantee is made.

## Actual architecture and what to adopt

The exact pinned line ranges are in `study.json`; links there are the evidence, not screenshots or promotional claims.

### One application core, multiple front ends

`src/composition/binary.ts` constructs provider registries and a shared binary-session runtime for CLI and MCP. It wires Hopper, Ghidra, IDA and Kuna, with additional provider declarations rather than treating every tool as a universal capability. `LazyAnalysisProvider.ts` exposes metadata without importing implementations until the client executes. Rejected loading clears the promise so a subsequent attempt can recover.

**Athena application:** one investigation/job service behind native UI, CLI and the future Hermes integration. A provider record needs supported target kinds, host prerequisites, version, availability reason, effects and lifecycle. Browsing a tool's card must not install or start it. Rust is the preferred new core implementation, but the existing TypeScript upstream should remain an external adapter until a measured reason justifies replacing it.

**Acceptance:** the same owned fixture through two front ends produces equivalent structured results and errors; metadata browsing never starts a provider; cancellation and retry are tested independently of UI.

### Evidence is a database model, not a citation pasted at the end

`domain/evidence.ts` separates committed target identity from display path, records provider identity/version, and models source locations. `EvidenceLedger.ts` authenticates input, deduplicates semantic identities, budgets retention and stages bundle changes. The inspected portion does not establish every invariant of the complete ledger.

**Athena application:** persist target hash/version, tool version, settings, source coordinates, observations, derivations and links to prior evidence. A path rename should not invent a new content fact. Imports should validate before partially modifying a shared collection. Keep raw assets local and permission-scoped; public study notes must not contain private binaries, secrets or user paths.

**Acceptance:** duplicate import is idempotent, changed bytes are a distinct target, conflicting input cannot partly mutate the collection, and a failed persistence operation never displays 'saved'.

### Unknowns survive research, cancellation and publication

`residualUnknown.ts` defines revision-linked questions, relationships, required authority/confidence/environment and evidence-qualified resolution. The residual-unknown tests show explicit conflict expectations. `ToolResultDelivery.partialRetention.test.ts` distinguishes facts retained by the ledger, refused retention and uncertain retention. `externalMutationAdmission.ts` preserves already-completed effects when later cancellation or session retirement fails.

**Athena application:** 'observed', 'derived', 'inferred', 'contradicted', 'unresolved' and 'not tested' must remain searchable. A queue must remember the next probe needed, not just an optimistic summary. Preserve completed file/tool effects when a later phase fails; do not blindly repeat the entire job.

**Acceptance:** a partial import/cancel shows exact completed effects and remaining work. A hypothesis cannot be promoted to a verified lesson solely because an agent repeated it. Reopening a study retains unanswered questions and prior revisions.

### Reduce context without hiding authority or claiming free tokens

`ProgressiveToolCatalog.ts` captures only in-scope enabled registrations. Discovery cannot re-enable excluded tools. It serializes and budget-checks the reply before changing visibility. `catalogDiscovery.ts` keeps four hot tools, has a three-tool default page and a twenty-tool maximum. `LazyAnalysisProvider.ts` separately delays implementation loading.

**Athena application:** small tool metadata search followed by exact schema retrieval; bounded pages and full-catalog fallback for clients that cannot refresh. A visible tool is not permission to execute it. Retain full accessible evidence outside the immediate context rather than discarding it to save tokens.

**Acceptance:** over-budget discovery changes no visibility; excluded families remain excluded; failed provider load can retry; measure input/output tokens, time, costs and task correctness against a full-catalog baseline. No token-saving percentage is established by this source study.

### Static structure and runtime behavior need different proofs

`JavaScriptRuntimeReconciliationService.ts` resolves static and passive runtime evidence and validates identity before reconciliation. The application-workflow guide explicitly limits runtime observations to tested versions/environments. The reconstruction section of the MCP contract distinguishes correlation from causation and ties an overall structural claim to constituent dimensions and active unknowns.

**Athena/Noxviola application:** trace a feature from modules, routes, IPC and native dependencies into controlled behavioral cases. For browser parity, code observations can explain how a sidebar is wired, but smoothness, keyboard focus, persistent layout, accessibility and session restoration still need tests. For mod changelogs, decoded record/field changes are evidence; changed byte length alone is not a semantic changelog. Do not imply REA already supplies Bethesda xEdit or Sims package-specific adapters.

**Acceptance:** every parity/changelog statement identifies target versions, observed dimensions, untested dimensions, expected behavior and reproduction. A runtime capture for one release cannot silently validate another.

### Ownership and rights are part of correctness

`ProcessOwnershipEvidence.ts` keeps generation/token evidence separate from PID-only relations and explicitly records unknown process-table coverage. The inspected Ghidra provider imports show its dependency on installation checks, profile resolution and cleanup ownership, not proof that every host configuration succeeds. Source import policy has explicit ignore/secret policy mechanisms; their presence is not a completed security audit.

REA's own license is MIT. `THIRD_PARTY_NOTICES.md` separately records dependency and external-engine licenses, including documented notice gaps. A target's code/assets do not acquire MIT rights because REA analyzes them.

**Athena application:** maintain separate records for REA, engines, dependencies and analyzed targets. Verify provenance and permissions per artifact. Never use an arbitrary PID as ownership proof or automatically execute recovered target code. No upstream implementation was copied into this change.

## Original teaching exercise: evidence-driven feature investigation

Use a tiny app the learner owns, with source plus two intentionally different builds. Do not use proprietary browser binaries as the default exercise.

1. Record both build hashes, source revision, environment and the exact question (for example, 'does the collapse action preserve focus?').
2. Inspect the relevant event handler and state transition. Record file/line evidence as static, not runtime.
3. Run a controlled case in each owned build; capture input sequence, result, environment and cancellation behavior.
4. Compare observations with the source hypothesis. Keep contradictions rather than rewriting the hypothesis as a fact.
5. Produce a semantic change record with before/after behavior, supporting IDs and remaining unknowns.
6. Repeat the import and verify no duplicate logical fact is added. Change one byte or source revision and verify the target identity changes.
7. Interrupt after observation but before save. The UI must distinguish observed-but-unsaved from persisted evidence and allow safe recovery.
8. Compare an agent using all tool schemas with one using scoped discovery. Count real tokens and correctness; record results even if savings are absent.

Completion requires evidence and assertions for all eight steps. Reading this document alone does not award curriculum completion. This exercise is original; it is not an upstream REA benchmark or test result.

## Remaining backlog

- Finish source review across all 57 module groups in `study.json`, prioritizing provider contracts, static JavaScript/Electron, resource limits, comparison and evidence serialization. Review whole files and tests beyond the bounded first-pass ranges.
- Select an owned fixture and an actual supported Node/provider environment. Review installer effects first. Run upstream tests and safe fixture probes; retain exact tool versions and logs.
- Design a versioned, privacy-aware Athena importer for REA evidence, with Rust core feasibility assessment. Do not treat the current research JSON as a supported REA bundle adapter.
- Add native study cards, source browsing, unknown resolution, evaluation and lesson admission only after compatibility with existing video/FNV work is established.
- Add creator/project release watching for the canonical REA repository without blindly accepting new releases. Revalidate source claims and dependency notices when the pin changes.
- No merge, deployment, external engine installation or connection to a user's machine is part of this source-study patch.
