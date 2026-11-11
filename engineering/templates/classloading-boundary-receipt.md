# Class-loading boundary receipt

- Evidence level and scope: source / synthetic JVM / measured loader / accepted native target.
- Target baseline revision, game/loader/fork/mappings/API and exact JDK:
- Complete classpath/module path, artifact hashes and defining/parent-loader identities:
- Required present and absent classes, including transitive dependencies:
- Classfile source/compiler/API target and processing/transformation chain:
- Operation reached: compile, discover, resolve/reflect, initialize or invoke:
- First failure, cause chain, relevant stack trace and initialization effects:
- Subsequent operation outcomes in the same process/loader:
- Changed conditions and whether any fresh process/loader was used:
- Constant-expression, reflection, static-initializer and guarded-body controls:
- Environment-specific entrypoint/annotation behavior actually exercised:
- Native client and dedicated-server launch paths actually tested:
- Logical authority, networking, world persistence and reload checks:
- All failures, incomplete stages and retained evidence:
- Comparison to the target's current implementation and unresolved acceptance gates:

Successful compilation or class discovery is not native compatibility. A new loader is not recovery of the old definition. Publish only authorized, sanitized evidence.
