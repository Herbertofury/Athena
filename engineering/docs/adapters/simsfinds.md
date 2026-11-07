# SimsFinds: post, creator and delivery extraction

[Adapter laboratory](README.md) · [Sims 4 research](games/sims-4.md) · Observed October 28, 2026

The actual [Robin Hair RIGHT item](https://www.simsfinds.com/downloads/407711/robin-hair-right-sims4) and its [linked account](https://www.simsfinds.com/user1077254) were inspected in a guest browser. This establishes a sample-specific DOM and embedded-data recipe. The [sanitized observation](../../experiments/site-adapter-discovery/simsfinds-browser-2026-10-28.json) records body hashes, identity, image decoding, an initial download-event timeout and a subsequent successful normal-link transfer; it does not certify the whole platform.

## Select the actual item record

Parse each `script[type="application/ld+json"]` as data, then discriminate by shape. On this page the scripts include a genuine Schema.org object, localized hashtag dictionaries, a custom item object, a preceding-item object and locale information. The MIME label alone does not make every payload a Schema.org object.

The custom item has `id="407711"`, `creator="1077254"`, `game="62"`, `title`, `seo`, `image`, `hashtags`, `is_paid`, `is_monetized` and `type`. Require the item ID to match the requested page. Do not choose the first JSON object, execute scripts, or treat a previous-item object as the current mod. The image record supplies an image identity and several variants; retain the observed variant relationships without manufacturing delivery URLs from filenames.

| Field | Observed extraction boundary | Validation |
|---|---|---|
| Title | `#dl9d578e6t` | Matches custom item title and the requested item |
| Post body | `#dl8d749e5a [data-sfp-paragraphy]` | 204 rendered characters; 232 HTML characters in this sample |
| Creator note | `#dl9d238e7a [data-sfp-paragraphy]` | Separate 60-character note; not silently merged into the post |
| Publication time | `#dl9d246e7c [data-sfp-date]` | Raw `2026-10-11 06:27:00`; timezone unstated |
| Account link | `a[data-link="1077254,"]` within the creator section | Numeric account matches the custom record |
| Post avatar | `#dl7d368e9a figure[data-image]` | Creator-scoped CSS background; not the item preview |
| Preview image | Image inside `#fg8r654e9g` | Actual browser decode: 800 × 800 |
| Profile name | `#pr8f297e5t` on the linked account | Displays Usagi, while the item byline displays `user1077254` |
| Profile avatar | Image inside `#pr9f462e5c` | Actual browser decode: 600 × 600 |

These generated-looking IDs are observed selectors, not a stability promise. Detect missing/multiple matches and fall back to a review state. In particular, `dl7d368e9f` appears on both the avatar figure and a follower-count element. An unscoped `getElementById` mapping is unsafe. Scope by semantic element and attribute, then validate its enclosing creator section.

Two Show More controls existed in the DOM but were not visible for this short post. Do not infer truncation solely from the presence of a hidden expansion control. Conversely, a long post requires a separate expansion/completeness fixture.

## Preserve identity differences

Keep account `1077254`, handle `user1077254`, profile display name Usagi and the external Patreon link to SonyaSims as separate observed facts. The profile itself repeats that outbound Patreon link. This is an identity claim worth retaining, not sufficient evidence to replace the stable account or assert that every linked creator name is equivalent.

The profile's avatar and item preview are different assets. Its current profile image is a decoded 600-pixel PNG; the small item avatar is a separately observed JPEG variant. A successful decode of one variant does not establish the other variant's byte content.

## Files and follows

The ordinary guest Download flow completed its visible countdown and exposed a link on `click.simsfinds.com/download`. That link contained temporary query parameters. An initial normal click with an event observer timed out after 20 seconds without a download event; that failure remains recorded.

A subsequent attempt used the browser's supported file-link download helper on the visible `#dl8d497e5a a._bt-download`, after completing the same normal countdown. It delivered a **98,134,687-byte ZIP**, SHA-256 `898d1828c898f5a8314a55e56e0091e504e55623b3aa1fbcd1db2e6fab0df27e`. The single entry, `UsagiSims 069 Robin Hair (Right).package`, is 98,418,790 bytes uncompressed, begins with DBPF magic `4442504602000000`, and passed the ZIP CRC check. It was read for archive validation without installation or execution. Internal consistency and the filename are useful evidence; they do not independently prove publisher authenticity or game compatibility.

Keep the canonical item as the durable source and resolve a fresh permitted delivery link when needed. Neither temporary query values nor the binary are published. A missing browser download event alone is insufficient to conclude that the file route is unavailable; the successful helper demonstrates a different supported observation/transfer method on the same ordinary site link.

The account profile exposes a native `follow` button. It was observed without mutation. Profile item links can support a proposed local follow, but complete pagination, update detection, native follow-list import and signed-in behavior remain untested. A Premium subscription control elsewhere on the page is a separate operation.

## Required next fixtures

Test a long expanded body, multiple gallery images, animation/video, a renamed or deleted account, a post with separate uploader/original-creator credits, full profile continuation and expired delivery-link recovery. Compare guest and signed-in states using the [secure authentication workflow](authenticated-research.md). Keep each operation's outcome separate; this single item and file are not complete SimsFinds support.
