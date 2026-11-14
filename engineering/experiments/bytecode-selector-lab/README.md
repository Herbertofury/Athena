# Bytecode selector laboratory

**Measured ASM observations of original synthetic classes. No Mixin execution, transformation or native game test.** This lab isolates a practical failure mode: source edits can preserve a name or count while changing the instructions an injection author intends to affect.

## Executed scope

- Eleven original Java fixtures, each compiled with and without debug metadata: **22 class observations**.
- Six predeclared count expectations per observation: **132/132 match** in the retained run.
- OpenJDK **21.0.13**, ASM **9.11.1**, Python **3.12.14**, Linux x86_64.
- Compiler options: `-source 21 -target 21 -proc:none`, UTF-8 and a separate temporary output/classpath per fixture. Debug modes use `-g:none` and `-g`.
- Class major version **65**. The fixture classes are read as bytes, never loaded or executed.

[Fixture manifest](cases.json) · [Original driver](BytecodeProbe.java) · [Offline runner](run.py) · [Dependency manifest](dependencies.json) · [Complete retained receipt](observed-2026-11-11.json) · [Preserved setup attempts](setup-attempts.json)

The manifest links each source path. Fixture inputs are synthetic; the observed compilation/inspection results are real. `all_expected` means these fixed count expectations matched, not that an injection or mod is compatible.

## Results that matter

| Fixture | Observation in `compute(I)I` |
|---|---|
| baseline | One exact target method, one own-owner hook invocation and one return |
| overload | Two methods share the name; exactly one has the selected descriptor |
| descriptor_drift | Name still exists, selected descriptor does not |
| extra_return | Two return opcodes, one hook invocation |
| throw_path | One return and one explicit throw opcode |
| always_throw | Zero returns and one explicit throw opcode |
| extra_call | Two matching hook calls; the first now receives the synthetic constant 100 |
| same_count_drift | Same six counts as baseline, but the immediate argument-producing instruction differs |
| different_owner | Name/descriptor-only call matching finds one; including owner finds zero |
| unrelated_call | Other invocation precedes the first matching hook; matching ordinal is not global call ordinal |
| nested_call | Two matching hook calls within one returned expression |

All eleven debug/no-debug pairs have **different class hashes** and **equal inspected method summaries**. Debug comparison is deliberately limited; it does not prove full class, control-flow, runtime or semantic equivalence.

The call context records the matching ordinal, instruction record and immediately preceding instruction. That predecessor is a local observation, not a general operand/data-flow analysis. An explicit `ATHROW` count is not a count of all possible runtime exceptions. Instruction indexes count visitor-emitted instructions; they are neither byte offsets nor Mixin instruction-list indexes.

## Reproduce

Use a compiler-capable JDK 21 and Python 3.10+. Only the environment above has been exercised. Obtain the exact ASM JAR from the official Maven Central URL in [dependencies.json](dependencies.json), review provenance/license, and place it outside the repository. No JAR or generated class is published. No Python packages are needed.

From `engineering/`:

```sh
python3 experiments/bytecode-selector-lab/run.py --dependency-dir /path/to/verified-dependencies > /path/to/new-receipt.json
python3 -m unittest discover -s tests -p 'test_bytecode_selector.py' -v
```

Use a new output file for every replay. Exit `0` means complete count observations match expectations, `1` means complete observations contain mismatches, and `2` means a setup/process/format failure. Keep failed stderr and partial attempts, rather than treating an empty or partial file as a receipt. The 47 offline tests do not run Java; the replay command does.

The runner does not download dependencies, inspect a mod installation or scan arbitrary classfiles. It verifies dependency bytes before execution, disables annotation processing for fixture compilation, uses an explicit classpath, and gives the Java process a 128 MiB heap cap and 45-second timeout. These are bounded experiment controls, **not an untrusted-code sandbox**. Only the reviewed original fixtures and pinned official library are in scope.

## What the receipt proves and omits

It records the exact runtime, compiler flags, UTC time, input hashes, dependency identity, class digests, all inspected method/instruction summaries, every expected/actual count, debug comparisons and complete driver stdout. The offline validator checks scope, input identity, row order/count, typed fields and type-strict consistency with raw output. It cannot authenticate evidence against an author who replaces all files or reconstruct class bytes from a digest.

The inventory omits frames, line/local-variable metadata, branch destinations, exception tables, annotations, full bootstrap arguments and other class attributes. It is not a full disassembler, bytecode verifier, control-flow analyzer or class equivalence checker. The simple literal matching in Python is original lab logic, **not Mixin's selector implementation**. No remapping, slices, callback insertion, local capture, cancellation, transformer order, native launch, gameplay or performance is exercised.

## Retained setup failures

The executor rejected both `--release 17` and `--release 21`. The final experiment uses explicit current-JDK source/target values and makes no cross-release API compatibility claim. An initial `-g:all` driver flag was invalid; it was corrected to `-g`. The partial observation from that attempt was not promoted to a completed run. Sanitized diagnostics and stage outcomes remain in [setup-attempts.json](setup-attempts.json).

See [injection acceptance](../../docs/mod-bytecode-acceptance.md) and the [dated research record](../../research/2026-11-11-mod-bytecode.md).
