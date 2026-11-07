[← Atlas home](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home) · [Canonical source](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/adapters/discourse.md)

> **Publication status — November 3, 2026:** The November 2 repository package is prepared and locally validated; publication is pending. This reviewed wiki page does not establish that its referenced new code or expanded catalog is live. See the [Atlas home status](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home).

# Discourse topic extraction and evidence

[Adapter laboratory](https://github.com/Herbertofury/Engineering-Atlas/wiki/Site-Adapters) · Checked **November 2, 2026 UTC**

The [offline Discourse normalizer](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/site-extraction-lab/discourse.py) preserves supplied topic/post bodies, joins supplied user profiles and reports precisely which captured stream IDs are missing. It implements no HTTP client, login, account operation or file downloader. The [real-source validation receipt](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/site-extraction-lab/discourse-validation-2026-11-02.json) records **six public community cases, 85 normalized posts, four profile joins and six decoded images**. These are narrow, reproducible extraction observations; `fullSupportAccepted` remains false.

The input captures came from actual unauthenticated public topic/profile/post-batch requests. Replay is offline. The repository retains sanitized receipts, source URLs, input hashes and implementation hashes; it does not publish the captured third-party bodies. The [round-four source bundle](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/site-adapter-discovery/round4-forums-commerce-2026-11-02.json) maps the primary-source IDs used below. The [synthetic defensive tests](https://github.com/Herbertofury/Engineering-Atlas/blob/main/tests/test_site_extraction_discourse.py) exercise malformed inputs, merges, media contexts and receipt redaction separately from these real-source observations.

## What the six cases establish

| Community and actual topic | Supplied posts / captured stream IDs | Missing IDs after replay | Creator profile join | Concrete result |
|---|---:|---:|---|---|
| [Crate: Grim UI, topic 86207](https://forums.crateentertainment.com/t/86207.json) | 25 / 776 | 751 | [JMD, user 91](https://forums.crateentertainment.com/u/JMD.json) | Initial 20 posts plus an actual five-post batch merged; the uncollected middle remains visible in coverage. [RDROOT02014] [RDROOT02018] [RDROOT02019] |
| [Cfx.re: car-wash project, topic 5422887](https://forum.cfx.re/t/5422887.json) | 1 / 1 | 0 | [CrazyEyeStudio, user 1585446](https://forum.cfx.re/u/CrazyEyeStudio.json) | The one-post captured stream is covered; author avatar and three body images decoded separately. [RDROOT02015] [RDROOT02020] |
| [Cataclysm: DDA: degradation mod, topic 14081](https://discourse.cataclysmdda.org/t/14081.json) | 29 / 29 | 0 | [Zhilkin, user 3370](https://discourse.cataclysmdda.org/u/Zhilkin.json) | Initial 20 plus nine additional posts exhaust this captured stream. The source dates are historical, not current-game compatibility evidence. [RDROOT02016] [RDROOT02021] [RDROOT02022] |
| [Funcom: enhanced edition announcement, topic 297231](https://forums.funcom.com/t/297231.json) | 3 / 3 | 0 | [Dana profile](https://forums.funcom.com/u/Dana.json) returned 403 | `posts_count=1` contradicts the three stream IDs. Both values survive; post-level author data does not become a successful profile join. [RDROOT02017] [RDROOT02023] |
| [Stonehearth: ACE, topic 36671](https://discourse.stonehearth.net/t/36671.json) | 20 / 802 | 782 | [DaniAngione, user 259](https://discourse.stonehearth.net/u/DaniAngione.json) | First-post body and creator join replayed; most captured stream IDs remain uncollected. [RDROOT02024] [RDROOT02025] |
| [Microsoft Flight Simulator: Cessna project, topic 752909](https://forums.flightsimulator.com/t/752909.json) | 7 / 7 | 0 | [Sal1800 profile](https://forums.flightsimulator.com/u/Sal1800.json) returned 403 | All seven captured stream IDs are supplied, with the independent profile failure retained. [RDROOT02026] [RDROOT02027] |

`capturedStreamComplete=true` means every ID in that particular supplied `post_stream.stream` has a corresponding supplied post. It does not mean complete creator history, all topic revisions, deleted/private posts or future replies were collected. `completeHistory` remains false even for the four cases with no missing captured IDs. If a stream is absent, missing IDs are unknown rather than an empty exhausted list.

## Identity and missing-post handling

A Discourse post's `id` and `post_number` serve different purposes. In the actual Crate case, first-post ID **473918** has `post_number=1` in topic **86207**. Its permalink is `/t/86207/1`; a missing-post request uses the numeric post ID, not `1`. Discourse’s [post-number/post-ID explanation](https://meta.discourse.org/t/from-post-number-to-post-id/193247) documents this distinction. [RDROOT02003] [RDROOT02014] The normalizer checks that every post belongs to the supplied topic, preserves captured stream order and rejects contradictory post-number ordering. An identical post repeated across batches is counted as overlap; conflicting snapshots, duplicate IDs within a batch, duplicate post numbers, changed streams and unexpected post IDs fail validation.

`missing_post_requests(record, batch_size=20)` returns a **request plan**, with at most 20 missing IDs per planned request:

```text
GET https://forum.example/t/86207/posts.json?post_ids%5B%5D=898751&post_ids%5B%5D=909839
```

The [primary continuation discussion](https://meta.discourse.org/t/fetch-all-posts-from-a-topic-using-the-api/260886) describes stream-ID batching. [RDROOT02002] The function sets `executionPerformed=false` and makes no request. The actual Crate and CDDA batches in the validation receipt were collected separately before replay. Planning the remaining batches establishes no authorization, availability or completed pagination.

Post authors retain their same-forum numeric `user_id`, username, optional display name and avatar template. Avatar templates substitute `{size}` with `120`; an invalid or unresolved template remains unavailable. A missing author ID is preserved as incomplete identity with an `author_identity_incomplete` warning. Topic creator, each reply's author and quoted content remain distinct.

A supplied `/u/{username}.json` response joins posts only when **same forum origin, numeric user ID and username** agree. The join is not based on display name, avatar similarity or a copied byline. A profile with no numeric ID, a duplicate profile ID, an unmatched user or a username mismatch is rejected. Successful post-level identity for Dana or Sal1800 does not erase their profile-request 403s.

## Body, media and attribution boundaries

The runtime record retains each supplied `cooked` HTML body exactly and keeps optional `raw` Markdown separately. Missing `cooked`, explicit null and an empty body remain distinguishable. The HTML projection produces events in source order, with contexts for `own`, `quote` and `link_preview`. A quote or onebox image is therefore not silently presented as an original attachment by the current author.

A lightbox link and its nested image become one image event: the link supplies the original URL, while the nested image remains `previewUrl`. Repeated appearances elsewhere stay repeated; there is no global URL deduplication that could reorder or discard meaningful occurrences. Emoji and embedded avatar images receive separate roles from ordinary body media. Video, audio, source, iframe and validated YouTube provider references can be represented, but discovery of those references does not establish playback.

The projection omits executable script/style/template text, while the original HTML remains preserved in memory. HTML recovery warnings are counted. The actual first Crate body produced 14 recovery warnings, and the Stonehearth first body produced eight; neither is rewritten as a perfect parse. `projectionComplete=false` stays explicit because this selected projection does not certify every Discourse/plugin HTML variant.

The six actual image decodes were:

| Source role | Decoded result |
|---|---|
| [Crate JMD avatar](https://forums.crateentertainment.com/user_avatar/forums.crateentertainment.com/jmd/120/81200_2.png) | PNG, 120 × 120. [RDROOT02028] |
| [Crate first body image](https://forums.crateentertainment.com/uploads/default/original/3X/b/2/b245b65bbc5876ab635812128aa74850bc0ce84e.jpeg) | JPEG, 1920 × 1080. [RDROOT02029] |
| [Cfx.re CrazyEyeStudio avatar](https://forum.cfx.re/user_avatar/forum.cfx.re/crazyeyestudio/120/6898200_2.png) | JPEG, 96 × 96, despite its `.png` URL suffix. [RDROOT02030] |
| [Cfx.re first body image](https://forum-cfx-re.akamaized.net/original/5X/f/f/e/4/ffe4afa9b98a5904105eddfe87f0a07b6c0872aa.png) | PNG, 518 × 102. [RDROOT02031] |
| [Cfx.re second body image](https://forum-cfx-re.akamaized.net/original/5X/9/c/b/4/9cb4272f042545231e3ac2b5f18726a58159a3a8.png) | PNG, 519 × 169. [RDROOT02032] |
| [Cfx.re third body image](https://forum-cfx-re.akamaized.net/original/5X/a/3/d/4/a3d4990b064c73af2ace395d9f6641db7df9af4d.jpeg) | JPEG, 1254 × 776. [RDROOT02033] |

The validation receipt retains the exact URLs, response types, byte counts and SHA-256 hashes for those decodes. This verifies six particular static image responses. It establishes no GIF animation, video/audio playback, downloadable mod archive or general CDN support.

## Private-by-default publication receipts

`normalize_topic(..., access="unknown")` is the default. `access="authorized"` can describe a legitimate private capture for runtime processing, but it still does not authorize public publication. A public receipt requires the caller to explicitly select `public`, and the supplied topic must also be a visible, undeleted `regular` topic. A regular topic can belong to a private category, so its archetype alone cannot establish public access.

When these topic conditions fail, `receipt()` emits a redacted status without topic/post IDs, bodies, media or profile joins. Within an eligible public topic, hidden, user-deleted or deleted posts are redacted. Missing visibility/deletion flags do not count as explicit clearance. Only exact integer post types **1, 2 and 3** are eligible for publication; staff whispers (`4`), unknown or absent types and incorrectly typed values are redacted. These post-type distinctions follow Discourse's upstream [post types](https://github.com/discourse/discourse/blob/main/app/models/post.rb) and [visible-post filtering](https://github.com/discourse/discourse/blob/main/app/models/topic.rb). [RDROOT02006] [RDROOT02007] A permitted type never overrides another restriction.

The public receipt uses a whitelist. It includes eligible stable topic/post/profile references, timestamps, body hashes/counts, coverage and context-labelled media metadata. It omits raw bodies, titles, display names, alt text and arbitrary delivery paths. Media/avatar/attachment references publish **URL origin plus a digest of the full URL**, not a usable download URL. Removing a query alone would be insufficient because a URL path can itself contain a bearer capability. A profile join to a redacted post does not reveal that post's identity in the receipt.

The CLI also omits whole-input `inputReceipts` whenever any supplied post is restricted. A digest over the complete capture would otherwise depend on whisper/deleted content even though its per-post receipt is redacted. Public topic status alone does not authorize those digests. Forum origins canonicalize host case and the HTTPS default port; backslashes are rejected because browser URL interpretation can disagree with a parser's authority boundary. These additional cases have synthetic regression coverage; the dated public replay keeps its original implementation hashes.

Runtime records retain source HTML and full delivery URLs in memory; the public receipt is a different representation. Use the runtime record for further local processing and apply the caller's access/retention rules there. Do not use a sanitized receipt as a replacement source body.

## Exact offline CLI

The CLI accepts these flags from the repository root:

```bash
python experiments/site-extraction-lab/discourse.py \
  --topic /tmp/permitted-topic.json \
  --origin https://forum.example \
  --posts /tmp/permitted-post-batch.json \
  --profile /tmp/permitted-user.json \
  --access unknown \
  --output /tmp/discourse-receipt.json
```

| Flag | Meaning |
|---|---|
| `--topic` | Required local topic JSON file. |
| `--origin` | Required forum root origin, such as `https://forum.example`; HTTPS only, with no non-root path, query or fragment. Credentials are rejected. |
| `--posts` | Optional additional local post-batch JSON; repeat for multiple batches. |
| `--profile` | Optional local user-profile JSON; repeat for multiple profiles. |
| `--access` | `unknown` by default; choices are `unknown`, `authorized` and `public`. This is the caller's capture context, not an access grant. |
| `--output` | Optional receipt file; omit to print the receipt to standard output. |

Set `--access public` only for a capture whose public status has independently been established. The command itself does not discover that status. The HTTPS-root restriction governs the forum origin; supplied body references can contain HTTP or HTTPS URLs, but neither is fetched by this module. Each input file is bounded to 8 MB, structural limits apply, and duplicate JSON keys/non-finite values are rejected. Failed CLI output records the error type without echoing input paths or source content.

The focused synthetic suite can be run with:

```bash
python -m unittest discover -s tests -p test_site_extraction_discourse.py -v
```

## Remaining acceptance gates

For a larger topic, collect every missing ID through an independently permitted transport, reconcile stream changes and retain denials instead of declaring an exhausted history. Prove creator-history coverage separately from one topic's captured stream. Test future plugin HTML against the exact preserved body and verify quote/onebox attribution before claiming complete media extraction.

Native notification/follow import and mutations remain unimplemented: topic notification levels are not a global author-follow feed. Media delivery, manual playback, archive integrity, signed-in/private capture and target-application integration are separate future work. The current receipt records those boundaries explicitly; none follows from successful offline normalization or six image decodes.
