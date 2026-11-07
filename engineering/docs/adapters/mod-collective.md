# Mod Collective: observed extraction and authenticated download

[Adapter laboratory](README.md) · [Sims 4 ecosystem](games/sims-4.md) · [Identity and media contract](author-post-media-contract.md)

**Checked October 27, 2026 in America/Denver / October 28 UTC.** A user-authorized signed-in browser completed one free creation download and extracted the creation's title, description, linked creator, creator avatar and three gallery images. This is a concrete single-creation result, not a completed platform adapter or a paid-content acceptance.

## The tested creation

[Royal Dining Room Wallpaper](https://www.modcollective.gg/sims4/details/creation/philo-royal-dining-room-elegant-wallpaper) identifies creation **17427** and links [Philo's artist profile](https://www.modcollective.gg/sims4/artist/philo). The public text-retrieval pass and later browser pass are separate observations. [SIMS002] [SIMS003]

| Required field or operation | Actual observation | Limit |
|---|---|---|
| Title | Rendered `h1` identifies Royal Dining Room Wallpaper | One creation layout |
| Creation identity | Visible `creation ID` label gives `17427` | Do not substitute the current human-readable slug for the provider ID |
| Author | The `Created by` region links Philo; its linked `h2` supplies the display name | Profile slug is observed; a separate numeric account ID is not established |
| Body | `#about .markdown-body` returned 400 text characters and 407 HTML characters | Only the About body; comments and collection descriptions are separate |
| Gallery | Three ordered main gallery images all reached `complete === true` and nonzero natural dimensions | Browser-selected variants decoded at 1363 × 766; original-resolution recovery is untested |
| Author image | The avatar inside the Philo profile link decoded at 48 × 48 | This proves the sampled image; complete creator history and other profiles remain untested |
| Files | The Files tab listed one free file; the normal authenticated flow emitted a download event | One file, not every version or creation |
| Downloaded bytes | 3,407,157 bytes, `DBPF` header, SHA-256 recorded below | No installation or in-game compatibility test |
| Native following | Public profile retrieval exposed Follow and Followers | No native follow mutation, follow-list import or synchronization tested |
| Video and GIF | Not present in this selected creation fixture | No playback or animation acceptance |

The [sanitized browser receipt](../../experiments/site-adapter-discovery/modcollective-browser-2026-10-28.json) preserves the exact observed image URLs, variants, decode results, body hash and download evidence. It excludes the account identifier, credentials, session storage, authentication URLs, signed download URLs, the complete post body and the downloaded mod binary.

## Field extraction that was actually exercised

Use the creation's detail page and wait for its relevant content region to render. Initial server-rendered navigation showed guest controls briefly after an authenticated navigation; later rendered controls showed Notifications and ModQ, and the authorized download flow succeeded. A first snapshot is therefore insufficient to classify the final account state.

For this fixture, `#about .markdown-body` isolates the post's description. Reading the entire `#about` container also collects the related collection text; reading the page body also collects comments, recommendations, marketing and navigation. Preserve sanitized body HTML and text as different representations. The receipt publishes their lengths and a text hash instead of republishing the creator's prose.

The observed author mapping is the account link in `Created by`, with a linked `h2` for the display name and an adjacent linked `img[alt="Avatar"]`. Both point to `/sims4/artist/philo`. A generic image search would also find related-card avatars and site images; those cannot establish the detail author's identity. ImageObject metadata from the profile used creation names in `creator.name`, so that property is unsuitable for resolving this human account. [SIMS003]

The gallery contains responsive thumbnails and main slides, with duplicate thumbnail nodes for layout. The tested main slides use the creation-specific alt text and preserve their order. Keep their `src`, `srcset` and actual `currentSrc` separate. The browser chose a responsive variant; neither the requested width nor a URL suffix proves original resolution. Advancing the visible gallery loaded its initially lazy third image. Deduplicate responsive representations within a media item without collapsing distinct ordered items.

The avatar URL ends in **`.null`**, but the rendered browser successfully decoded it. Earlier text-tool image retrieval failed, and that failure is retained. Do not reject a usable image solely because its path lacks a familiar image extension. Conversely, an `Avatar` label alone is not proof that its bytes loaded. Use the observed load/decode result and a typed media response where the integration exposes one.

The observed DOM selectors are a starting fixture, not a promise that every Mod Collective layout uses them. A reusable adapter still needs collection pages, other games, mixed media, missing avatars, inaccessible creations, edits and several creators. Fail closed on an ambiguous author region instead of taking the first profile link on the page.

## Login and file delivery

The site offered Google, an emailed code and a password alternative. The selected Google flow required account verification, then returned to a free-member continuation page. A successful credential submission was not treated as success until target-site controls and the authorized download flow supplied evidence.

The tested file flow was:

1. Open the creation and choose Download.
2. Read the free-download quota dialog. This session displayed a ten-download rolling one-hour allowance; this is an observed free-account state, not a universal API limit.
3. Choose Continue with download.
4. Wait for the site's visible ad countdown to reach zero.
5. Choose the now-enabled Continue control.
6. Receive the browser download event and verify the saved bytes.

The file began with hexadecimal `44 42 50 46`, the `DBPF` signature. It was not a ZIP archive. The SHA-256 of the received bytes was:

```text
30256f54dfa191347ee69fcad686b41124a12b70dbddb897b124fc57233302bf
```

This records the downloaded artifact, not a comparison against a provider-published checksum. The browser's saved path was opaque, so an original filename was not asserted. The package was not installed, executed, modified or redistributed.

The creation also displayed **Failed to load** for a customization area. The file download succeeded independently. Keep that failed capability visible instead of converting a working download into whole-page acceptance.

## Following and history

The public Philo profile exposed Follow, a follower count, identity text and a creation list. These observations support a candidate native-follow integration; they do not prove the action, caller's follow list, notifications, or a complete author archive. ModQ, likes, membership and donations are separate features. None was used as a substitute for following. [SIMS003]

Local following can retain the canonical profile and its identity status without changing the source account. A source-follow mutation needs a selected creator and an explicit desired action. History collection must establish continuation and termination, preserve creation IDs across slug changes, and distinguish updated versions from newly published creations.

## Retained failures and remaining gates

An initial uppercase exact-name locator did not match the mixed-case Continue with download control; its wait produced no download. A subsequent event wait ended before the final post-countdown Continue step. The successful attempt used the observed current control and received a real event. These failures remain in the receipt.

After the download, creator-profile navigation began, but the browser connection subsequently timed out. Profile-wide extraction and native follow behavior were not completed. No paid-tier test, entitlement expiry, video playback, GIF animation, all-history enumeration or production adapter acceptance follows from this fixture.

The result is eligible for a focused prototype in Engineering Atlas. It is not evidence of an improvement against another application's current implementation. Keep any target adoption behind the [comparison and acceptance gate](validation-and-adoption.md).
