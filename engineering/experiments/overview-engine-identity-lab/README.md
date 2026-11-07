# Scope Overview reuse to the engine instance

October 30, 2026. Baseline `dbafcb04499a186deb013923c34f13fdc292f318` retains the renderer from `591f6c85eb28ea63d0dcb251eb4de2f2d362b5a3`. The [full-content candidates](../overview-content-identity-lab/README.md) remain isolated and their costs are retained.

## Actual repair and scope

The server creates one 128-bit random public instance label before opening its database/listener or starting its worker, then sends that label in `x-atlas-engine-instance` on both Overview serializer routes. The label is an ephemeral cache namespace, **not a credential, authorization capability, persistent grant or provider identity**. It uses pinned getrandom 0.4.3 already present in the lockfile and installed dependency cache; only the lab's direct dependency edge was added. Random-source failure prevents startup rather than silently reusing a namespace.

The renderer reuses keyed cards only within the same instance. It prepares all replacement cards before committing its instance label, map and counts. A malformed replacement preserves the previous successful view and namespace. Missing headers disable keyed reuse, so older servers do not silently keep stale output; malformed labels fail with last-good retention. Unchanged responses from the current engine still reuse their nodes, without serializing or retaining a second full copy of every result on each poll.

This repairs switching/restarting the local engine at the same address with colliding job IDs, states and attempts. It does **not** detect unsupported external replacement/editing of a database while that engine continues running. Normal queue completion writes terminal state and result together and does not edit terminal output in place. The broader same-instance mutable-content question remains a separate candidate, not silently declared solved.

## Evidence

Three new tests fail on the baseline and pass with the repair. An additional stress test makes 1,000 engine replacements with fifty generated cards each and verifies every complete recorded result, including unknown fields, null, booleans and Unicode. Existing exact-integer ID, failure retention and timeout contracts remain intact.

The two-process HTTP harness creates two new inactive copies of a retained public fixture database, adds distinct generated result markers without changing their state/attempt/ID, and sequentially serves them from the same loopback address. It checks header format, stability within each process and different labels across restarts. The actual served JavaScript receives those actual header values in the existing controlled-DOM harness. Baseline keeps stale output; repair shows the replacement and reuses unchanged cards. Source hashes, final job rows and SQLite integrity are checked. Neither provider requests nor working database swaps occur.

Raw alternating-order renderer samples cover the retained fixture, fifty generated eight-KiB fields and one near-two-MiB field. Repeated rendering includes input parsing. Observed p95 values were baseline/repair 0.409/0.282 ms, 2.455/2.612 ms and 14.659/10.343 ms respectively. These noisy single-environment diagnostics do not establish a general speed improvement or browser latency result. They show no repeat of the full-content serialization candidate's large extra work; there was no predeclared performance adoption threshold. This is a scoped correctness repair, not promotion of either content-comparison candidate.

## Reproduction and remaining gates

Run `node --test tests/overview-engine-identity.test.mjs` and the full repository suites. Build the pinned lab and run `python experiments/overview-engine-identity-lab/verify_http.py --source-db INACTIVE_FIXTURE.sqlite --binary apps/atlas-lab/target/debug/atlas-lab --output NEW_DIRECTORY --expect-correct`. The source must be at most 32 MiB, inactive, and contain one to fifty jobs. The test owns and stops only its own two sequential servers. Baseline mode omits `--expect-correct` to retain its failed renderer outcome.

The shared render harness now accepts an explicit engine label; its default is a fixed generated test label for older renderer tests. This does not simulate native paint, input, scrolling, focus or media playback. Browser runtime access still fails after the supported reset; no native-browser acceptance is claimed. No schema, durable-write policy, provider access, source data completeness, autoplay or other project was changed. Complete failed candidates and last-good evidence remain retained.
