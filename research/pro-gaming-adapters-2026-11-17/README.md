# PC gaming and mod-source research checkpoint

Research-only evidence batch reviewed 2026-11-17, based on Athena main
`22aeac716a8bb642e5269fdc8b3c38b99055bad6`. Existing application records,
identities, runtime code and unrelated branches are unchanged.

## Evidence gate

`verified-findings.json` contains four independently reviewed official-documentation
findings. It is not an automatic import of generated chat output. Documentation
review is not live API, installed-app, owner-device or filesystem testing.
`acceptance-queue.json` records twelve proposed tests, all explicitly **not run**.
No credential was obtained, copied or transmitted; no private files, email,
GitHub permissions or Drive permissions were accessed through the research chat.
No assets or mod binaries are redistributed. Provider authorization, distribution
terms, author consent and per-file licenses remain separate requirements.

## Priority follow-through

1. **CurseForge CDN authentication:** incorporate the dated official enforcement
   announcement into the adapter contract and test 401 handling, redaction and
   last-good state. Do not reinterpret auth failure as file removal or bypass it.
2. **Modrinth identity and throttling:** retain project/version/file identity
   separately, handle mutable labels, respect actual response quota headers and
   use a specific client User-Agent.
3. **Portable data acceptance:** use Prism and Playnite as documented examples,
   not proof that every external process or plugin is portable. Trace actual
   writes and relocation. Portable storage does not itself establish security.
4. **Credential boundary:** never make secrets plaintext merely to make a folder
   movable. Explicit reauthentication is preferable to silently weakening storage.
5. **Catalog promotion:** match existing product IDs and validate each field,
   release/platform/license qualification and source before importing chat proposals.
   Broad comparisons and proposed numerical rankings are not measured benchmarks.

## Remaining scope

Nexus, GitHub Releases, Steam Workshop, Sims-specific identity and compatibility,
file-level addon variants, source consent and rate-limit details need additional
claim-level verification. Tests here are a queue, not adapter implementation.
Full rendered/Windows acceptance, source migration, held work and repository
retirement gates remain unchanged. No ModHunter PR #49 changes are included.
