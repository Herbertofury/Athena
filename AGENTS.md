# Working on Athena

Read README.md, wiki/Athena-Vision.md and docs/integration/STATUS.md first. Honor scoped instructions, preserve concurrent changes, and use an isolated branch/worktree. Athena owns native learning, research and reusable project workflows; links and embedded predecessors are not capability parity. Preserve source repositories, history and user data until separately accepted migration gates are met.

## Repair the system, not the explanation

For each reproduced defect, first consider removing the invalid state through an API or ownership change, then an enforceable type/lint/contract check, then a repeatable runtime regression. Use a short written rule only for context those mechanisms cannot express. Retain human review for risk and judgment; no document or passing check grants permissions. See guidance/docs/AGENT-CORRECTION.md.

Do not blanket-ban effects, timers or comments because a reference project did. Identify the actual fault and preserve useful rationale, accessibility, license notices and safe lifecycle cleanup. Do not weaken tests or add suppressions to conceal a failure.

## Find and prove the affected workflow

Use guidance/registry/verification-map.json to find existing source, checks and acceptance paths. It is a starter map, not exhaustive coverage or a pass receipt. Inspect the code before reusing a pattern. Add missing affected workflows rather than inventing parallel harnesses. Run the narrow regression first, applicable aggregate checks next, and the actual changed workflow against the final artifact when available. For UI, inspect real output and verify keyboard, empty/error, repeated action, cancellation, reduced-motion and persistence behavior where relevant. A screenshot proves appearance, not correctness, responsiveness or durability.

Report exact commands, revision, results, evidence paths and remaining gaps. Separate passed, failed and not-run checks; local edits, remote publication and deployed behavior are distinct states. Never claim all abilities, exhaustive parity or completion from a sample, static build, fixture or plan. When blocked, preserve evidence and continue independent authorized work without bypassing access controls.

## Repository commands

- Build generated content: `npm run build`.
- Aggregate application checks: `npm test` (read package.json for current scope).
- Runtime acceptance entry point: `npm run test:browser` (requires its documented browser/Rust dependencies).
- Guidance core: `python guidance/tools/repository_governance.py check`.
- Guidance tests and map integrity: `python -m unittest discover -s guidance/tests -v`.

Canonical shared standards are digest-pinned in guidance/registry/repository-governance.json. Change them through the existing release workflow, never by editing consumer snapshots or silently repinning a consumer. Root instructions and the verification map are Athena-local, not automatic fleet policy.
