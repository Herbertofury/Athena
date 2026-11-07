# Plumbdex / Plumdex adapter research

[Adapter laboratory](README.md) · Public HTTP and official-documentation review: October 28, 2026 UTC

The user-supplied [creator-directory URL](https://dev-pd.gametimedev.de/creators) currently calls the service **Plumbdex**; the official wiki styles it **PlumbDex**. Retain “Plumdex” as a search alias. The observed host is a development-labelled origin, so bind data and sessions to the actual origin and review any future migration rather than guessing a production domain.

## What the official documentation establishes

PlumbDex builds a Sims 4 file catalog from Mod Manager users' reported folders; it describes itself as an index that points to sources, not a host for the mod files. Its catalog and collections have a public route. [Platform overview](https://wiki.gametimedev.de/plumbdex)

Creator attribution can come from filename tags, CurseForge matches or a moderator. Creator pages include biography, associated files and outbound social/source links. Following requires an account and connects to the service's home view and related tools. User-added social links can fill an empty network slot without replacing an existing one; this is useful discovery evidence, not the same as creator-controlled identity proof. [Creators documentation](https://wiki.gametimedev.de/plumbdex/creators)

File lookup supports filenames, SHA-256 hashes and fingerprints. File pages distinguish community download links and CurseForge-matched links, show internal file characteristics and attribution basis, and may contain turntable media. The documentation describes a separate signed-in preference for adult content. [Finding mods](https://wiki.gametimedev.de/plumbdex/finding-mods)

## Observed public extraction route

The directory's initial HTML already includes creator links and avatar image URLs. The inspected [creator page](https://dev-pd.gametimedev.de/creators/148dazed) includes the display identity, a sign-in-to-follow control, follower count, source link, associated file links and a Show more control. It also warns that file matches can be wrong. The first render is not the complete associated-file history.

The page has Angular hydration data, but the inspected `ng-state` object did not supply the full creator list as a reusable documented API. Prefer the rendered/SSR semantic content actually present, and investigate pagination using the site's normal public controls. Do not treat hashed bundle names or hydration internals as a stable API contract.

## Proposed mapping

| Field | Candidate mapping |
|---|---|
| Creator | Exact canonical creator link and visible name; stable internal ID only if actually exposed |
| Portrait | Image in the creator's own card/profile; retain default/absent state and provenance |
| File identity | Observed file URL and explicitly documented SHA-256/fingerprint; do not infer the meaning of an arbitrary URL segment without the file page |
| Attribution | Preserve `filename_tag`, `curseforge_match` or `moderator` evidence, with conflicts and confidence |
| Source links | Keep creator social links and file download links in separate roles, with community/verified provenance |
| Media | File previews and turntables belong to the file; avatars belong to the creator |
| Follow | Local follow now as a design capability; native follow exists in official docs but needs an authenticated implementation test |

This is a particularly useful **identity and file-discovery adapter**, not a substitute for the original creator's post feed or purchase entitlement. Resolve original content through its own provider adapter. Test false attribution, merged/recolour files, missing source links, full pagination, a custom avatar, native-follow read-back and migration of the development host before claiming complete support.

[Sanitized observation receipt](../../experiments/site-adapter-discovery/public-observations-2026-10-28.json) · [Author/content contract](author-post-media-contract.md)
