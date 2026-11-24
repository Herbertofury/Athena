# Mirrors, indexes and original-source provenance

[Adapter laboratory](README.md)

Mirror and index sites need first-class records because users encounter them during mod discovery. They also need a different identity and access model from a creator's own publication. A robust adapter can preserve a discovered link, attributed creator, source service, post/file identity and availability without claiming that the mirror is the original author or proves the user's entitlement.

## Candidate coverage

| Site/family | Research position | Required distinction |
|---|---|---|
| [Dwemer Mods](dwemer-mods.md) | Public listing, metadata and separate known-author directory observed | Original author versus uploader versus community-maintained author record |
| [WCIF](wcif.md) | Index and own-hosted content need different resolvers | Indexed source post versus WCIF item and attribution |
| [Plumbdex](plumbdex.md) | Documented file-index/creator relation and public page structure | Inferred/moderated credits versus creator-owned identity |
| [TS4 Rebels](ts4-rebels.md) | Public forum structure observed; authenticated link/file tests pending | Forum member/uploader versus credited mod creator |
| [Kemono documentation](https://kemono.cr/documentation/api) | Candidate retained from the wider creator ecosystem; documentation page returned no readable body in this research tool | Source-service/creator/post claims versus mirror import identity and date |

No Kemono endpoint or authenticated operation is accepted by this pass. A third-party extractor's implementation can be a research lead, but it does not establish current service documentation, permission, ownership or access. Do not copy an origin site's credentials into a mirror or use a mirror as evidence that a locked original post is available to the user's account.

## Proposed provenance graph

Retain separate records for original publication, reblog/repost, index entry, mirror copy, file-host object and in-app saved item. Relations should name the assertion source and its confidence. Keep original publication time, mirror import time and first-seen time separate. Preserve author, uploader and curator roles, and flag conflicting attribution instead of choosing whichever page was scraped last.

Content hashes can help identify byte-identical files, but matching bytes do not establish authorship or redistribution permission. Similar filenames and avatars are weaker signals still. Keep source links visible and make a mistaken identity merge reversible. Prefer creator-controlled outbound links or an explicit confirmed relationship when joining accounts across services.

Support useful local following and discovery while leaving unverified content and native-account operations explicitly unavailable. When an original source disappears, record the event; do not silently replace it with a mirror or change attribution. Any retrieval of mirrored files needs the same authorized-access and rights review as other file sources, with no paywall, DRM or access-control bypass route.
