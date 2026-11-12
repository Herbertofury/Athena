# Build dependency resolution receipt

- Evidence level and exact scope:
- Project baseline, game/loader/plugin tuple and authorized change:
- Gradle binary URL/hash/source revision; JVM and compiler targets:
- Resolvable configuration, task, attributes/capabilities and exact file-consuming API:
- Repository locations, metadata sources, authentication scope and cache state:
- Direct/transitive requested selectors and constraint/force/substitution rules:
- Actual selected components, reasons and unresolved edges:
- Lock mode, original lockfile, proposed changes and missing/new-version controls:
- Expected artifact and POM/module-metadata bytes/hashes and how trust was established:
- Verification mode, metadata/signature settings and exception rules:
- Known-bad JAR and metadata tests through the real terminal task:
- Exact commands, exits, unabridged diagnostics and retained failed attempts:
- Actual final file identities after transforms/remapping/packaging:
- Binary/API, client/server, loader, save and native compatibility results:
- Differences from the target's current implementation and unmet gates:

Keep graph selection, version stability, artifact integrity, provenance and native behavior separate. Generating a lock or checksum file does not establish all five. Never publish private paths, credentials, private dependency metadata or unapproved artifacts.
