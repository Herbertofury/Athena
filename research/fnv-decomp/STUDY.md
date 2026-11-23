# FNV matching-decompilation study and Athena application

Reviewed 2026-11-16. User reference: https://youtu.be/Ff8su9nY4os .

## Evidence boundary

The video page exposes its title, but no transcript or playable contents were inspected. A direct official timed-text lookup was throttled; transcript searches did not yield a primary transcript. This is a deep **primary-source implementation study**, not a claim to have watched or transcribed the video. Keep video-specific lessons pending.

Read-only source pinned to `momusdigital/fnv_decomp@91e1b6e8d8bb0f9a33e8cf88e77268757449e0a6`. Inspected README, LICENSE, build recipe metadata, comparison/build tools, CI workflow and one inline-assembly example. No compiler, upstream script, game executable or decompiled game code was executed. No game bytes, proprietary assets, upstream implementation or symbol corpus is copied into Athena.

## What the success actually establishes

The project reports matching the in-scope PC Steam1.4.0.525 functions, not delivering a linked playable executable. Its own README explicitly describes object files for comparison, not a source port. The frozen site reports70,611 functions and11,537,067 bytes, with runtime/compiler exclusions. These are **upstream-reported results**, not independently reproduced here. [Report](https://fnvdecomp.com/)

The pinned recipe declares2,989 units,68,657 functions,11,458,056 function bytes,1,954 exception tails and138,526 tail bytes in its totals metadata. Independent enumeration finds68,667 raw unit function entries totaling11,458,254 bytes, including ten repeated addresses. Deduplicating by(address,size) yields68,657 unique functions and11,458,056 bytes, agreeing with declared function totals. Do not count repeated unit entries as additional coverage. Declared function+tail counts equal the headline function count, but simply adding the declared byte totals does not equal the frozen headline. Do not silently collapse those measures: retain accounting definitions, overlap/exclusion policy and snapshot date, and resolve the denominator before claiming a reproduced percentage. [Recipe](https://github.com/momusdigital/fnv_decomp/blob/91e1b6e8d8bb0f9a33e8cf88e77268757449e0a6/build/units.json)

## Actual implementation findings

### Build identity and bounded claims

The pinned build recipe selects2,714 SP1 units,274 RTM units and one VC8 unit. README pins cl15.00.30729.01,15.00.21022.08 and14.00.50727.762 respectively. A generic “MSVC2008” label loses real compiler diversity; retain unit-specific compiler/flags and fingerprint the installed toolchain.

`build_and_match.py` selects units using optional only/every/limit arguments. Its success exit concerns the selected set, not automatically the entire recipe. Image admission checks selected function fingerprints with a threshold; this is not a cryptographic full-image identity assertion. Athena must separately record full local input hash, authorized version, compiler binaries/options, checker revision, recipe revision, requested scope and actually checked scope. Public receipts should expose hashes/counts, not original bytes or personal paths. [Verifier](https://github.com/momusdigital/fnv_decomp/blob/91e1b6e8d8bb0f9a33e8cf88e77268757449e0a6/tools/build_and_match.py)

### Relocations are not irrelevant bytes

`compare.py` checks canonical spans, maps symbols/fold aliases to original addresses, bounds section-local resolution and handles several x86 relocation kinds. It checks target addresses before excluding relocation bytes from ordinary byte comparison. A pooled identical literal can be treated as equivalent at another address. Unsupported relocation and unresolved symbol paths produce errors. Thus do not advertise an unqualified raw linked-executable hash match. Export relocation-aware equivalence separately from raw equality, with the literal-normalization rule visible. [Comparator](https://github.com/momusdigital/fnv_decomp/blob/91e1b6e8d8bb0f9a33e8cf88e77268757449e0a6/tools/compare.py)

### Exception handling and trusted baselines

Exception tails can live outside the parent function. The verifier follows anchors and exception-table relationships, distinguishes inferred bindings, and checks conflicting bindings across units. PR comparison uses baseline-owned helper-name/EH evidence rather than assuming ordinary function matching covers unwind behavior. The PR check compares base and head; its connection to the original depends on separately maintained original-image validation. A green differential check preserves a trusted baseline only if that baseline and evaluator remain trustworthy. [PR comparison](https://github.com/momusdigital/fnv_decomp/blob/91e1b6e8d8bb0f9a33e8cf88e77268757449e0a6/tools/compare_builds.py)

### Matching is not recovered author intent

The inspected BSDiscBootSystemUtility file contains an inline `__asm` block. This proves some code is not portable high-level C++ alone; it does not quantify the whole repository's assembly use. Likewise a byte-preserving rename does not prove its proposed name/comment correct. Treat inferred semantic labels as reviewable hypotheses with provenance, not recovered original source. [Inspected example](https://github.com/momusdigital/fnv_decomp/blob/91e1b6e8d8bb0f9a33e8cf88e77268757449e0a6/src/bssystemutilities/bsdiscbootsystemutility.cpp)

### Rights and source provenance

LICENSE grants no licence to reconstructed code or contributor additions; third-party code has separate terms. Public visibility is not permission to vendor, train on or redistribute it. Study methods and independently author Athena code; keep the project reference-only pending explicit rights review. Do not import leaked SDK/source/debug-symbol materials because an upstream naming scheme mentions them. [License](https://github.com/momusdigital/fnv_decomp/blob/91e1b6e8d8bb0f9a33e8cf88e77268757449e0a6/LICENSE)

## Actionable Athena workflow

1. **Inventory before agents.** Define target/version and authorized inputs, partition units, preserve unknown regions. Track estimated work by bytes/complexity as well as task count. Tiny tasks must not hide a few huge uncompleted ones.
2. **Keep the judge separate.** Agents may propose implementations, never alter evaluator or golden evidence within the same approval lane. Test the evaluator with intentional wrong outputs, missing units, truncated spans, unresolved references and stale receipts.
3. **Fix shared blockers first.** Build-error clustering should identify missing shared types/fields/dependencies. Prioritize a single verified declaration fix that unlocks many tasks rather than paying for repeated model retries.
4. **Use bounded portfolios.** Deterministic generators for repetitive work, cheaper models for simple units, larger models after measured failure. Track total tokens/tool calls/retries/wall time per accepted result. Upstream cost and training claims are not Athena benchmarks.
5. **Keep local/global proof distinct.** Function acceptance, integrated rebuild, original-target comparison and actual runtime behavior are separate gates. A subset pass, compilation success or model statement cannot promote the next gate.
6. **Preserve uncertainty and recoverability.** Names, inferred types and behavioral explanations carry sources/confidence. Retract disputed annotations independently of verified behavior. Store reviewed generic method examples, not restricted source bodies.
7. **Make progress useful.** Show checked/expected units and bytes, unresolved bindings, failed builds, retries, active worker, elapsed time and cancellation. Never label an unknown denominator100%.

The project's explanation supports the shared-blueprint bottleneck, tiered model allocation and compile/compare loop, but its numerical performance anecdotes are not independently reproduced. [Method account](https://fnvdecomp.com/how)

## Delivered and remaining

Delivered here: this implementation study, pinned source register, independently authored receipt-claim gate with adversarial synthetic tests. The gate checks internal completeness claims, **not binaries**, authenticity, correctness or source rights. It deliberately cannot certify a playable port or promote arbitrary JSON to independently reproduced truth.

Open backlog: obtain authorized video transcript/media review; reconcile headline/recipe byte accounting; integrate evidence receipts and progress UI in Athena's existing research workspace without duplicating active Studio work; qualify a trusted runner using openly licensed synthetic targets before any separately authorized real target; add measured cost routing and shared-blocker prioritization. No FNV binary rebuild, engine port, full-code review or Athena runtime integration is claimed.
