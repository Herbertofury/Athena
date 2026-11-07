# Dwemer Mods adapter research

[Adapter laboratory](README.md) · Public HTTP inspection: October 28, 2026 UTC

## Preferred candidate and observed evidence

Use the site's canonical public pages for discovery, its structured metadata for a first record, and a separately tested rendered detail parser for the complete accessible item. No documented public API was established in this review. A public page is not proof of complete downloads, gallery extraction or native author following.

The [mod library](https://dwemermods.com/mods) exposes game filters, pagination, item links and upload-account links. Its guest view states that adult listings require registration and the account's content setting. The [known-author directory](https://dwemermods.com/known-authors/) is a separate community-maintained identity system with aliases. Treat it as an attribution claim with provenance, not a verified account owned by the original creator.

The inspected [mod detail](https://dwemermods.com/mods/5467) contains `CreativeWork` JSON-LD with name, description, canonical URL, cover image, publication/update times and an author name. The structured author is **CinnaMewRoll**; the [upload account](https://dwemermods.com/users/ericthehushed) is **Ericthehushed**. This establishes an actual author/uploader distinction. The page's sparse extracted text does not establish that every detail, file or gallery element is present in static HTML.

## Proposed mapping

| Data | Mapping and verification requirement |
|---|---|
| Item identity | Preserve the numeric item ID from the actual canonical link, plus game and source origin |
| Original creator | JSON-LD author name or explicit credits; retain unknown stable ID until a linked profile/source proves it |
| Uploader | The actual `/users/…` link observed on the listing/profile; separate role and avatar |
| Known-author entry | Its observed canonical URL, aliases and community provenance; do not silently merge with a user account |
| Avatar | Author-owned profile image when established; the inspected uploader uses a default avatar, which is not the original author's portrait |
| Body and media | Preserve the structured description as a partial discovery field; inspect the detail's own body/gallery subtree before claiming full content |
| Files | Read authorized file/version controls and actual destinations; retain file metadata and original-source links |
| Following | Local follow of verified creator/account relations; native follow/read-back behavior still needs a signed-in fixture |

Use a DOM parser and strict JSON decoding; never execute the site's script bundle to obtain fields. Do not mistake the site's logo, game icon or language flags for mod media. Preserve date strings without inventing a timezone when none is supplied. Gallery-empty, gallery-not-loaded and gallery-inaccessible are distinct states.

## Next evidence required

Test an item with multiple files, a true multi-image gallery, original creator links, a custom author avatar, pagination and an authorized account. Compare guest and signed-in representations. Exercise update/removal behavior and any native follow control without assuming an upload account and a known-author entry are the same target.

The site's [terms](https://dwemermods.com/terms) describe attribution and moderation expectations. An archive's possession of a file does not prove authorship, redistribution rights or the user's entitlement on another service. This adapter's supported scope must remain tied to the operation and source actually verified.

[Sanitized public observation receipt](../../experiments/site-adapter-discovery/public-observations-2026-10-28.json) · [Author/media contract](author-post-media-contract.md)
