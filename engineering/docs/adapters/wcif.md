# WCIF.cc adapter research

[Adapter laboratory](README.md) · Public review: October 28, 2026 UTC

## Site role and preferred candidate

WCIF is both a discovery/index surface and a site with its own hosted-item and community views. Its [home page](https://wcif.cc/) names Patreon, Tumblr, CurseForge, The Sims Resource, other websites and Sim File Share as search sources, and links its own latest uploads separately. Preserve that distinction in every record: an indexed Patreon result is not a Patreon API response or an entitlement grant.

The [creator directory](https://wcif.cc/creators) exposes source/social-link columns and category filters. The earlier unauthenticated HTTP response remained a loading placeholder. A subsequent October 28 cloud-browser fixture successfully rendered the directory, creator history and an indexed item, as detailed below. Preserve the original shell result as an HTTP-method limitation; do not interpret it as zero creators.

The observed method is rendered DOM extraction of the actual creator/item component. No public developer API or stable internal endpoint was verified here. Do not invent an `/api/…` route from the framework or site name.

## Rendered directory, creator, item and continuation fixture

The [sanitized browser receipt](../../experiments/site-adapter-discovery/wcif-browser-2026-10-28.json) records a guest session, with the site's Sign In link visible. The rendered directory contained **100 rows** and eleven columns: creator name, items, favorites, sources, style, active, CAS, build/buy, mods, specialties and social links. Extract headers first and map cells by their semantic column. A checked SVG and an empty-square SVG are different values; an icon-only cell is not missing data. The creator name was a clickable element rather than an anchor, so its numeric identity was obtained from the real navigation result, not invented from the display name.

| Field | Actual fixture and extraction boundary |
|---|---|
| Creator identity | [RIMINGS profile](https://wcif.cc/creators/14342-rimings), ID `14342`; `h1` supplies display name. Preserve the original spelling of linked bylines. |
| Creator image | The heading's profile container had **zero images** and a visible `R` initial fallback. Return a null avatar with `initial_letter_fallback`; do not use a mod preview or the WCIF logo. |
| Linked accounts | The profile explicitly links its Tumblr and Patreon accounts. Store these as claimed profile relationships with source provenance. |
| Counts | 885 indexed items and 1,745 public favorites were displayed. Neither number is a user's native following list. |
| Item identity | [Observed item](https://wcif.cc/cc/cc_1791961885606_eaid4k6pw-rimings-weekend-escape-outfit-early-access-by-rimings). Retain the opaque `cc_…` ID as a string; do not interpret its digits as a source publication timestamp. |
| Byline and original source | `section[aria-label="Item details"] a[href]` links creator `14342` and a Patreon post ending in `172243497`. The latter is an original-source relationship, not a file response. |
| Metadata | `h1` gives the title. The details section displays source and publication date; its displayed date has day precision. JSON-LD is a `DigitalDocument` whose `url` points to Patreon, while the page canonical points to WCIF. Preserve both namespaces. |
| Body | The 88-character schema description is generated item metadata. This fixture showed no original post body. The outer `article` also contains comments and related results; collecting its whole text would contaminate the body. |
| Media | The primary item preview decoded at **267 × 267**. It is a thumbnail, not proof of the original post's entire gallery or of a creator portrait. Related-post images must stay outside the target item's media array. |
| Access | The item had a Locked label and an original Patreon link. This is an index classification, not an authenticated entitlement check on Patreon. |

The creator page initially exposed 50 `a[href^="/cc/"]` item links. One ordinary **Load More Results** click increased the list to **100 unique items**, preserving the initial 50 as the prefix. More results remained available. Record `exhausted: false`, retain a continuation, and deduplicate by WCIF item identity. This establishes one live pagination transition; it does not establish an exhaustive 885-item import or an API cursor contract.

Preview delivery uses signed object-storage query parameters. The receipt retains the stable image path, parameter names and decode dimensions, with **all query values removed**. Treat the URL as temporary delivery state: reacquire it from an authorized page when it expires, keep it out of public logs, and never use its signature as an image identity. The query-free path is an identity/provenance reference, not a promise that unsigned requests succeed.

For this observed external item, the next extraction step belongs to the Patreon adapter. No original-source full body, entitled gallery, hosted-file transfer, native follow mutation or follow-list import was proven by this WCIF fixture.

## Proposed field and follow mapping

Store WCIF's own item/creator identity when visible, the original content URL and provider, uploader/indexer identity, claimed original creator, tags, game/type/style, preview images and original-source links. Resolve author portraits from the correct creator/profile component; a WCIF result thumbnail does not establish an avatar. Keep source timestamps separate from the time WCIF added the index entry.

For indexed content, dispatch to the original provider adapter to retrieve the full authorized post and files. For hosted content, use a WCIF-specific file record and verify its access/download behavior. Preserve the connection between the index record and the original record instead of creating duplicate feed entries or replacing original author links.

The page advertises favorites/following concepts, but no authenticated native operation was tested. Support local follows as app state; mark native follows, favorite import and native-state read-back as `authenticated_fixture_needed`. A search filter for paywalled items classifies a result; it does not unlock the source post.

## Acceptance fixtures

Still require a creator profile with a custom avatar, a WCIF-hosted item and its file delivery, an external Tumblr item, changed original URLs, an incorrect creator match, missing previews, complete history and guest versus authenticated follow state. The observed no-avatar profile, external Patreon item and one history continuation are retained fixtures, not substitutes for these remaining cases. Confirm that loading, no-results and denied-access states are distinguishable. Return partial results with a continuation when pagination has not finished.

[Search UI observed from the site's own latest-upload link](https://wcif.cc/search?hostedOnly=true&sortBy=normalizedAdded&sortOrder=desc&sources=patreon,tumblr,curseforge,thesimsresource,website) · [Public observation receipt](../../experiments/site-adapter-discovery/public-observations-2026-10-28.json) · [Login workflow](authenticated-research.md)
