# Bytecode injection compatibility and acceptance

**Question:** does an injection still change the intended behavior in the exact shipped environment? Compilation, a matched method and a successful injector count answer different questions. This guide is source-backed test design, not a recommendation to patch a named project.

## Start with the behavior contract

Describe what must happen, what must not happen, which side/thread owns it, and which success, failure and cancellation paths need coverage. Check whether a public callback supplies the correct timing and data before choosing bytecode modification. Fabric documents events as a common alternative, but the callback's actual contract must satisfy the requirement. [BI11015](https://docs.fabricmc.net/develop/events/)

Record the target game/loader versions, actual Mixin implementation and artifact digest, compiler, mappings namespace, config, applied mod set and launch path. Fabric documents its modified Mixin fork, including behavior that differs from upstream. Its current guide separates obfuscated pre-26.1 Minecraft lanes from later names. Do not treat upstream source, Fabric's fork and every installed loader as one tested implementation. [BI11007](https://docs.fabricmc.net/develop/loader/)

## Preserve selector identity and intended cardinality

| Concern | Evidence to retain | Failure to exercise |
|---|---|---|
| Target method | Owner, name and full descriptor; deliberate wildcard scope | Overload added, parameter/return type changed, method moved |
| Call/field target | Declaring owner, name, descriptor and relevant opcode | Similar member on a different owner |
| Injection point | Kind, slice, ordinal and shift, all resolved in the target namespace | Added/removed/reordered instruction or changed slice |
| Match expectation | Intended minimum and maximum with configuration defaults | Zero, too few, too many and same-count wrong-location cases |
| Callback behavior | Arguments, locals, cancellation/return contract and state invariants | Local layout change, early exit, exception and conflicting modification |

The JVM descriptor includes parameter and return types. A method's name alone does not identify its signature. [BI11012](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.3.3)

Mixin's reference applies member matching before ordinal selection. The ordinal chooses within the matching instructions, not all calls in the method. A stable ordinal can still point at a different logical operation after a code change. `At` also exposes shifts; an opcode offset is not a semantic anchor. [BI11002](https://github.com/SpongePowered/Mixin/wiki/Injection-Point-Reference) [BI11004](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/injection/At.java)

## Counts are necessary evidence, not complete acceptance

In the inspected upstream `Inject` annotation:

- `require` is a minimum; its default delegates to configuration.
- `expect` is checked when `mixin.debug.countInjections` is enabled, so it is not an unconditional production guard.
- `allow` is an upper sanity check, not a query truncation limit. Values below 1 or below `require` have special documented handling; do not use them as an assumed exact-zero constraint.
- Cancellation and local capture affect behavior beyond locating instructions.

Pin the installed implementation before relying on these rules. Record defaults and active debug settings, not just annotation text. [BI11003](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/injection/Inject.java) The older callback guide is useful background, not a substitute for a version-matched check. [BI11001](https://github.com/SpongePowered/Mixin/wiki/Advanced-Mixin-Usage---Callback-Injectors)

The [laboratory](../experiments/bytecode-selector-lab/README.md) provides measured counterexamples using compiled original classes:

1. An overload changes name-only counts while an exact descriptor remains unambiguous.
2. An extra return path and an exception path produce different opcode evidence. A method that always throws can have **zero return instructions**. RETURN is not a universal finally/exception hook. Pinned upstream `BeforeReturn` searches typed return opcodes. [BI11006](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/injection/points/BeforeReturn.java)
3. Two fixtures have identical method/call/return counts but different immediate argument-producing instructions. Count parity does not prove the intended operation is unchanged.
4. Debug metadata changes class hashes while the deliberately limited inspected method summaries remain equal. Neither hash inequality nor summary equality is by itself a compatibility verdict.

These are ASM observations, **not Mixin injection results**. The lab does not implement Mixin selectors, remapping, slices, local capture or transformation ordering.

## Keep failure evidence and inspect the right stage

Use the exact loader's supported diagnostics in an authorized isolated test. Upstream exposes post-Mixin export, injection counting and failed-target dumps as separate options. Record which was used, at what transformation stage, and under which mod set. A dump from failure is not the final successful class. [BI11005](https://github.com/SpongePowered/Mixin/blob/4053421aa10aaac6127d969028a29c94fe3054f6/src/main/java/org/spongepowered/asm/mixin/MixinEnvironment.java)

Do not publish game bytecode, proprietary mods, private paths or raw user logs merely because debugging produced them. Keep originals within their authorized location; publish only permitted sanitized identities and findings. This contribution contains original synthetic Java sources and no game or upstream implementation copies.

## Acceptance matrix

Start each scenario as `not_run` in the [receipt](../templates/mod-injection-receipt.md):

- Exact supported game/loader/fork and normal packaged launch, separately from development.
- Client and dedicated-server applicability, class loading and thread ownership.
- Target absent or moved; overload and descriptor changes; zero/extra matches; same-count semantic drift.
- Normal result, early result, exception and cancellation, including cleanup and state invariants.
- Relevant competing modifications together, with complete warnings and transformed-stage evidence.
- Save/reload, networking and sustained gameplay relevant to the changed behavior.
- Debug-disabled production behavior and explicitly enabled development diagnostics.

Do not repair an unexplained failure by blindly setting `remap=false`, relaxing count checks, raising priority or deleting a conflicting mod. Those change the contract or environment. Diagnose the exact namespace, installed fork and transformed target first; any authorized candidate must be compared with the current target and required behavior preserved.

## Alternatives and limits

A public event can reduce dependence on implementation details when it exposes the required moment and data. A precise injection can reach behavior with no adequate public hook, at the cost of transformation and compatibility obligations. A whole-method overwrite or broad ordinal/shift shortcut has a different conflict surface and needs its own justification. No universal winner or target-project change is established here.

A useful next experiment is an authorized native test fixture on the target's **actual** Mixin fork, with known-bad matches and competing modifiers. The present inspection lab is preparation, not that acceptance gate.
