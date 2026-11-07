# App study wiki publication package

**Prepared, not published to the separate wiki.** The canonical article-focused guide is [docs/app-study](../app-study/README.md). Main-repository publication does not update GitHub's wiki.

Prepared pages:

- [App-Study.md](App-Study.md)
- [App-Study-Tools.md](App-Study-Tools.md)
- [App-Study-Workflows.md](App-Study-Workflows.md)
- [App-Study-References.md](App-Study-References.md)
- [Append-only navigation blocks](navigation-additions.md)
- [Expected page hashes](manifest.json)

## Current publication blocker

The wiki was read successfully at revision `57872b9` on November 6, 2026. An HTTPS Git write preflight failed before any change because no authenticated Git credentials are available in this workspace. No browser/computer tool is available here. No credential, persistent grant, password or token was created or requested. Wiki publication is pending a supported existing authenticated Git or browser session, not an assumption that repository-content API access covers the wiki.

## Publish without overwriting other work

1. Fetch the latest separate wiki repository and inspect the four page names for existing or concurrent edits.
2. Reconcile any changes with the canonical documents before replacing these four pages. Preserve all unrelated pages and navigation.
3. Copy only the four prepared page files. Add the supplied Home/Sidebar navigation once, retaining every existing section.
4. Review the full diff, publish using existing authorized access, and retain the actual wiki commit.
5. Fetch/read back all four pages and compare their bytes or SHA-256 values with `manifest.json`. Check the live Home/Sidebar links and all four page URLs. A local copy, main commit or successful tool submission alone is insufficient.
6. Record the verified commit and exact check outcome here only after publication. The current pending statement must not be changed to success on a failed or uncertain write.
