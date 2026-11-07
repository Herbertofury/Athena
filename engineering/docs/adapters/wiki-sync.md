# Adapter wiki maintenance

[Adapter laboratory](README.md) · [Validation and review policy](validation-and-adoption.md)

The canonical adapter documents live under `docs/adapters/`. The wiki is a separate Git repository. Publishing to the main repository does not automatically update it. [GitHub's wiki editing guide](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages)

## Review and prepare

1. Fetch the latest main repository and wiki revision. Read the applicable contribution instructions and inspect wiki changes since the last projection. Reconcile edits back into canonical source before regenerating.
2. Update only the claims reviewed against current primary sources. Keep failed retrieval, historical sources, missing fields and authenticated gaps explicit. Never refresh every site's review date after checking only a few sites.
3. Update the catalog and source register; preserve previous implementation and experiment receipts. Run the repository's required checks.
4. Run the projection from the main repository, with the path to the separate wiki checkout:

```bash
python scripts/export_adapter_wiki.py ../Engineering-Atlas.wiki
python scripts/export_adapter_wiki.py ../Engineering-Atlas.wiki --check
```

The [page map](../../data/wiki-adapter-pages.json) names the managed pages. The exporter rewrites local links to their wiki equivalent, or to canonical repository files when they are not wiki pages. Every projected page links back to its source. It writes only mapped pages, leaves unrelated pages and the sidebar alone, and performs no network request, commit or publication.

## Publish and verify

Review the prepared diff against the latest wiki head. Preserve unrelated edits and update sidebar navigation deliberately. Publish through an authenticated wiki Git remote or GitHub's wiki editor. Verify the actual live hub and several deep links after publication; a local projection or main-repository commit is not evidence of a live wiki update.

Repository-content API credentials do not necessarily authenticate the wiki's separate Git endpoint. If the available connection cannot write the wiki, retain the complete canonical source and prepared projection, identify publication as pending, and use a supported secure sign-in/handoff. Do not request passwords, tokens or cookies in chat.

## Maintenance scope

Review active API/access-policy/download changes frequently and rotate the larger discovery catalog. A new official route is a candidate until its required fields and account states pass fixtures. Keep a dated decision note with changed sources, stale/unreachable entries, exact test scope, publication status and any remaining user action. Continue to enforce the private target comparison before moving a method into GameSync Next.

## Verified publication: October 28, 2026

The recovered cloud browser published all 40 mapped pages and additive sidebar navigation. A subsequent fetch of the wiki repository verified every projected page byte-for-byte at wiki commit `b403c4a7b69f56858e61d502882292a33b3ef226`. The [exact publication receipt](../../experiments/site-adapter-discovery/wiki-publication-verified-2026-10-28.json) supersedes the earlier pending queue for that batch. Unrelated wiki pages and the existing sidebar prefix were preserved. This verifies that batch only; any later source changes must pass the same projection and read-back process.

## Second-round methods publication

The second-round browser publication added three pages and updated fifteen existing managed pages plus the sidebar. All **43 managed pages** matched the prepared canonical projection byte-for-byte at wiki commit `647c2e88fa6f50fe41df663c76ede76f7565f624`. Concurrent edits to `Experiment-Evidence.md` were retained. The [method-publication receipt](../../experiments/site-adapter-discovery/wiki-methods-publication-verified-2026-10-28.json) records the exact read-back and subsequent maintenance update. This verifies the wiki publication; canonical repository synchronization was subsequently completed; the earlier rejected write remains part of the historical publication record.
