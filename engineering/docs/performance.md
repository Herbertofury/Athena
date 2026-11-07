# Substantial performance engineering

**Goal:** reduce the user's actual time to a complete, correct outcome. Not merely a different loading screen.

## 1. Define the measured journey

Record input event → usable result → fully verified result → durable save where relevant. Break the trace into queue wait, IO, parsing, matching, hashing, IPC/serialization, rendering and commit time. Measure tail latency, not only average throughput. Test realistic small, typical and large workloads on target hardware.

## 2. Remove expensive work without removing required work

- Replace repeated linear owner/dependency searches with a prebuilt index when profiles show repeated matching.
- Parse each required archive index once per scan rather than reopening it for each candidate path.
- Share identical in-flight requests while preserving cancellation ownership and failure reporting.
- Batch small IO/IPC operations where per-call overhead dominates.
- Bound parallel work and queue memory. More workers can worsen storage contention and UI responsiveness.
- Keep expensive parsing/analysis out of the UI-critical process. Distinguish CPU-bound work from asynchronous IO. [E01](sources.md#e01)[N01](sources.md#n01)
- Use incremental computation with explicit invalidation, and verify the complete output against a full baseline. Cached display must be labeled when not yet revalidated.

## 3. Establish causality

Use paired baseline/candidate runs in alternating or randomized order. Keep the corpus, environment, correctness contract and condition identical. Record concurrent load and thermal/storage conditions. A cold-versus-warm comparison is not a code speedup. Separate profiler overhead from normal runtime.

## 4. Accept an improvement

Define the task-specific target before looking at results. Report absolute time saved, relative change, p50/p95, memory/IO, output equivalence and regressions. A single fast run is not a general claim. A faster first result with unchanged completion time is a responsiveness improvement, not full completion acceleration.

Keep separate results for cold, warm, incremental, cancellation/restart and error paths. Do not normalize away warnings, missing records, source identities, ordering that matters, confidence or correctness-relevant values. Only documented nonsemantic fields may be excluded from comparison.

## 5. Current-source caution

Node workers are appropriate for CPU-heavy JavaScript; its documentation warns that asynchronous IO need not benefit from workers. Tokio's filesystem facade uses blocking work internally and recommends batching. Use the right mechanism for the measured hotspot rather than renaming everything async. [N01](sources.md#n01)[R02](sources.md#r02)

## Stabilize the reference without deleting information

If baseline results change while testing, retain the before/after outputs and identify whether inputs, discovered metadata or actual semantics changed. A richer ownership explanation or newly discovered warning is not timing noise to strip. Re-run against the same recorded discovery generation, or explicitly report the comparison as unresolved. Measure in-application readiness separately from automation waiting, and keep first-use discovery distinct from steady-state results. See the [benchmark contract](benchmark-format.md#mutable-discovery-is-part-of-the-workload).

## Card density and storage workloads

Card performance needs independent measurements of time until the required visible cards are usable, input/scroll latency, layout shifts, image decoding, peak memory and complete data availability. Vary both record count and bytes/fields per record. Measure cold navigation separately from revisits and incremental updates. Keep filtering, keyboard navigation, details, accessibility and full-record search working under every candidate strategy.

Compare keyed incremental DOM updates, containment, windowing and data projections against a measured baseline. A projection is acceptable only when the complete record remains available through an explicit tested path; it must not masquerade as a complete response. Offscreen rendering optimizations do not excuse missing records. Use browser frame/input instrumentation and label proxies such as a double-animation-frame wait honestly: they are not direct proof of physical pixel presentation or an INP score.

For storage, retain the same transaction boundaries and durability configuration across the comparison. Measure committed writes, reopening/readback, full payload equality and integrity, not only in-memory inserts. More data per card can shift bottlenecks from queries to serialization, transport, parsing, image decode, layout or memory. Identify the dominant stage before choosing the intervention.

General lab wins remain research candidates until they outperform a target project's actual current implementation with its requirements intact.

Primary background for these experiments: [UI01], [UI02], [DB06], [DB07]. Documented methods are not measured wins.

## Full-result serialization: isolated Atlas evidence

The [checked JSON forwarding experiment](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/overview-serialization-lab/README.md) removes repeated result-tree allocation without dropping fields or relying on a result cache. Naive raw forwarding weakened number, Unicode and depth checks; the repaired streaming validator retained those checks. Complete-output comparisons and qualified Linux memory readings are published. This is component evidence, not a universal method or an accepted replacement for the normal HTTP route.

## Apply current methods at the measured bottleneck

*Primary documentation checked 2026-10-31. The examples below are proposed implementation patterns, not executed Atlas benchmarks.*

### Account for complete work across scheduling boundaries

Give each operation an input identity, generation and terminal outcome: completed, failed or cancelled. Record queue admission, execution, result transfer, validation and final publication separately. If the operation promises persistence, include acknowledged commit and required readback. A worker finishing computation does not mean its result has reached the caller; an empty queue does not mean running tasks have finished.

Keep counts for accepted, completed, failed and cancelled work. Reconcile them at shutdown and after restart. Preserve warnings and errors alongside successful outputs. Cancellation can stop future publication while already-started side effects still need reconciliation. Declare that contract before measuring it.

Measure responsiveness and full completion together. An intervention is useful when it meets the target's interaction budget without unacceptable completion, memory or correctness regressions. Save those budgets before observing the candidate results.

### Yield browser work with a real fallback

When the trace shows a long main-thread computation, divide it at boundaries where state remains valid. Feature-detect `scheduler.yield()`; its continuation can inherit priority and cancellation from `scheduler.postTask()`. The API remains unavailable in some browsers. A timer fallback creates another task, but does not reproduce the scheduler's priority or cancellation behavior and can incur timer delays. [RT31012](https://wicg.github.io/scheduling-apis/) [RT31013](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)

```js
async function yieldToBrowser() {
  const scheduler = globalThis.scheduler;
  if (typeof scheduler?.yield === "function") {
    await scheduler.yield();
  } else {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

Use this helper between measured chunks, with cancellation and generation checks before work resumes and immediately before final publication. Keep intermediate results private until the complete-result gate passes. If partial presentation is a feature, label its completeness explicitly.

Choose the chunk budget using recorded input latency and full completion, including slow devices. A single expensive item may still block the thread; it needs a smaller algorithmic unit or a worker. Yielding introduces scheduling opportunities rather than parallel execution. Handle a rejected continuation as a terminal cancellation/error path, and test the fallback independently.

### Bound worker ownership as well as worker count

Piscina exposes worker limits, queue limits, transferable inputs and cancellation. Its documentation warns that already asynchronous Node/libuv operations may gain little from being moved into workers. Start with a measured CPU-heavy JavaScript operation. [RT31010](https://github.com/piscinajs/piscina)

This illustrative configuration uses explicit budgets; four workers and eight queued tasks are experiment parameters, not recommended defaults:

```js
import Piscina from "piscina";

const pool = new Piscina({
  filename: new URL("./cpu-worker.mjs", import.meta.url).href,
  minThreads: 1,
  maxThreads: 4,
  maxQueue: 8,
});

const result = await pool.run(
  { generation, input: ownedBuffer },
  { transferList: [ownedBuffer], signal },
);
```

Here `ownedBuffer` is a dedicated transferable `ArrayBuffer`. After transfer, the sender must stop using its storage. Specify who owns inputs, output buffers and retry material. Aborting a running Piscina task stops its worker; cancellation does not automatically restore transferred input. A worker must await its own asynchronous work before returning. [RT31010](https://github.com/piscinajs/piscina)

Admission control must also bound queued bytes and upstream read-ahead. Pause producers before saturation, handle rejected submissions, and observe every task promise. Do not eagerly create a promise and large buffer for every input. Reject stale generations before publication. Measure worker startup separately from pool reuse, then report queue wait, transfer, complete result delivery, process-tree memory and foreground latency.

### Skip offscreen rendering without hiding required content

For a long document whose DOM memory is acceptable, test containment before replacing the rendering framework:

```css
.result-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

The placeholder size is illustrative; choose it from representative content and measure layout shifts. `auto` can skip offscreen rendering while retaining DOM and accessibility content. It does not eliminate the retained data or DOM. The `hidden` value has different find, focus and selection behavior and cannot substitute for `auto` when those features are required. [RT31014](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)

Test keyboard traversal, browser search, screen-reader output, expanding media and scrolling back to previously skipped sections. MDN also documents a subtlety: descendants hidden by styles can remain exposed in the accessibility tree while offscreen styles are skipped. Audit intentionally hidden descendants and apply correct accessibility semantics; do not hide whole valid sections merely to silence the problem. [RT31014](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)

Retain complete search/export paths. If memory is the bottleneck, investigate virtualization separately and preserve its focus, selection and full-data contract.

### Budget nested compilers, then evaluate optimized binaries

A build coordinator, compiler and linker can each create parallel work. TypeScript 7's experimental `--builders` and `--checkers` multiply: four of each permits sixteen type checkers. External concurrent compiler processes multiply this again. Parsing, emission and other processes add further work, so that product is a planning estimate, not a total CPU cap. Pin checker settings and verify diagnostics when changing them. [RT31034](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)

Choose one aggregate CPU/memory allowance and tune outer jobs together with inner parallelism. ThinLTO's documented lld control is `-Wl,--thinlto-jobs=N`; other linkers use different controls. Compare clean and warm backend-cache builds separately. Report full build completion and peak process-tree memory, not only the fastest individual compiler process. [RT31008](https://clang.llvm.org/docs/ThinLTO.html)

For profile-guided optimization, freeze training and held-out evaluation inputs before collecting profiles. Clang supports distinct instrumented and sampled approaches; record which one produced each profile, its binary/source identity and collection overhead. Keep compiler version, numeric semantics and other optimization settings fixed in the first comparison. [RT31007](https://clang.llvm.org/docs/UsersManual.html)

Evaluate cold startup, frequent operations, rare/error paths and full completion on held-out inputs. Include profile collection and rebuilding in the maintenance cost. Fail the candidate for changed outputs, incompatible profiles or unacceptable tail regressions even if its trained hot path improves. Add ThinLTO or BOLT combinations only after individual effects are understood.

### Treat measurement-runner upgrades as protocol changes

Hyperfine 2.0 executes benchmark commands directly by default. Commands relying on pipelines, redirection or shell expansion require explicit shell selection, such as `--shell bash` where Bash is the declared environment. Setup/preparation hooks still run through a shell. Validate the actual command and its exit status before timing it. [RT31026](https://github.com/sharkdp/hyperfine/releases/tag/v2.0.0)

Its JSON schema is now version 2. For example, the old `results[i].mean` path becomes `results[i].summary.time_wall_clock.mean`. Update consumers deliberately, retain per-run measurements and units, and treat unavailable counters as missing rather than zero. Do not merge old and new exports without an explicit conversion and protocol check. [RT31026](https://github.com/sharkdp/hyperfine/releases/tag/v2.0.0)

For Python, pyperf's processes, calibration and metadata help separate run variability from inner-loop repetition. Keep cold imports and JIT startup visible when the user journey includes them. [RT31027](https://pyperf.readthedocs.io/en/latest/)

A runner supplies measurements; the application supplies the correctness oracle. Preserve raw samples, input/artifact hashes, command configuration and failures. Confirm a promising isolated result in the complete journey before accepting the change.
