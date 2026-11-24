# Offline site extraction lab

This executable experiment replays **eight scoped parser families** against caller-supplied local bytes. It retains rich bodies in memory and emits sanitized evidence receipts. It performs no network requests, account actions, file transfers or media playback. A successful replay establishes the selected fixture relationships and boundaries; `fullSupportAccepted` remains false.

The October 28, 2026 replay covers nine real public cases: Modrinth, Planet Minecraft, WordPress REST, two RSS feeds, Dwemer, ModPub, SubscribeStar and SimsFinds. Twenty-four separate regression tests use explicitly labeled synthetic fixtures. The real bodies and browser fragments remain external inputs, excluded from this repository.

The separate October 31 [itch.io DOM experiment](itch.py) is documented in the [itch.io adapter guide](../../docs/adapters/itch-io.md). It retains [two actual public DOM replays](../site-adapter-discovery/itch-io-dom-replay-2026-10-31.json) and [nine defensive regression tests](../../tests/test_site_extraction_itch.py). These scoped observations cover selected project/devlog boundaries; complete history, authenticated access, file transfers and full support remain unaccepted. The eight-family and nine-case October 28 results above retain their original scope.

## October31 social normalizers

Two additional modules preserve message/feed-specific identity and media without changing the earlier eight-family or itch.io results:

| Module | Actual scope | Evidence boundary |
|---|---|---|
| [Discord](discord_message.py) | User/webhook identity; guild/global avatar; ordered attachments, embeds and component media; forward snapshots; absent-field partial updates; access-limited retention; restricted public receipt | Documented schemas and synthetic defensive tests. No bot grant or live message fixture. [Guide](../../docs/adapters/discord.md). |
| [Bluesky](bluesky.py) | Post URI/author DID join; text and UTF-8 facets; image/video/external/quote embeds; repost actor; profiles; paginated follows | Actual public AppView captures from EightSidedSquare and The Aether, plus synthetic defensive cases. No native follow mutation, complete account import or playback. [Guide](../../docs/adapters/bluesky.md). |

Run the site-extraction tests with `python -m unittest discover -s tests -p 'test_site_extraction*.py' -v` from repository root. The [social validation receipt](social-normalizer-validation-2026-10-31.json) records exact implementation identities, real input hashes/counts and bounded media checks. Raw third-party bodies and API captures are external, uncommitted inputs. The normalizers make no network calls.

## Run

Requires Python 3 and the dependency in [requirements.txt](requirements.txt). From the repository root:

```sh
python3 -m pip install -r experiments/site-extraction-lab/requirements.txt
python3 experiments/site-extraction-lab/replay.py --family rss --origin https://example.org/ --input feed=/your/fixtures/feed.xml --output /your/results/receipt.json
python3 experiments/site-extraction-lab/replay.py --manifest /your/fixtures/cases.json --output /your/results/receipt.json
python3 -m unittest discover -s tests -p test_site_extraction_lab.py -v
```

Paths above are caller-selected examples. A manifest is a nonempty JSON list. Relative paths resolve against its containing directory; direct `--input ROLE=PATH` paths resolve against the working directory. For example:

```json
[
  {
    "label": "public-feed",
    "family": "rss",
    "origin": "https://example.org/",
    "inputs": {"feed": "feed.xml"}
  }
]
```

| Family | Required input roles | Scoped relationship and limitation |
|---|---|---|
| `modrinth` | `project`, `members`, `versions`, `uploader` | Validate project/team/member/version/uploader joins; select the first supplied version explicitly, retaining all its files and changelog. Project members and release uploader remain separate roles. Organization ID is opaque. Markdown is preserved; its mixed event projection is deliberately incomplete. |
| `pmc` | `item`, `profile` | Resource ID and author ID join the scoped byline to the profile avatar's `data-mid`. Outbound discovery links remain unverified transfer candidates. |
| `wordpress` | `post` | One REST post object or one-element array; embedded author ID must match. Protected body stays absent. Excerpt and featured media remain separate from body/avatar. Select a post explicitly before replaying a multi-post response. |
| `rss` | `feed` | Parse every item in the supplied RSS window; prefer `content:encoded` as body and retain description as metadata. Hash the complete source GUID for identity before stripping URL query values. Display names establish neither creator IDs nor avatars. |
| `dwemer` | `page`, `description`, `files`, `images`, `changelog`, `profile` | Parse separate observed fragments. Original credited author remains distinct from uploader. Uploader/profile name equality is a sample check, weaker than a stable numeric join. Missing file IDs stay null and login gates stay explicit. |
| `modpub` | `page`, `files`, `profile` | `user-content` is body; Schema.org description is summary. Profile name equality is a sample check. Scope file title to `h5.mb-0` within its gray box; disabled file IDs are not URLs. |
| `subscribestar` | `fragments` | Fragment JSON carries `postId` and `parts[].html`. Join author/avatar profile links and check the permalink against post ID. Parse only observed public Trix body; deferred uploads stay unverified. |
| `simsfinds` | `fragments`; optional `profile_receipt` | Select custom item JSON by semantic keys, independently of Schema.org and script position. Join numeric creator ID to the scoped byline. Use a `figure[data-image]` selector despite duplicated DOM IDs. Keep creator note separate. Optional browser receipt must match creator ID and profile URL. |

For programmatic use, import `extractors.py` and call `extract(family, inputs, origin)`, with a dictionary of input bytes. HTML bodies preserve the selected node serialization, literal descendant text and ordered text/link/media events. Node tails outside the selected boundary are excluded. Original Markdown stays intact. Missing fields remain null or absent; metadata summaries never fill a missing full body. Bodies are source material, not sanitized HTML suitable for direct rendering.

## Evidence and counts

[live-replay-receipt.json](live-replay-receipt.json) is the deterministic nine-case offline replay. Each case records input byte counts/hashes; the top-level implementation hashes identify `extractors.py` and `replay.py`. Reproduce using the manifest command above with the same named public fixtures and role mapping. No absolute fixture path or raw manifest is published. [replay-validation.json](replay-validation.json) records concrete assertions, source receipt hashes, implementation identity, normalization rules and retained failed assumptions.

`characters` counts literal `text_content()` Unicode characters, including whitespace. `whitespaceCollapsedCharacters` counts `" ".join(text.split())`. `rawSha256` hashes the selected serialized body; it does not claim byte parity with the original full response. Original input bytes have independent SHA-256 receipts.

| Real sample | Literal body characters | Whitespace-collapsed characters | Interpretation |
|---|---:|---:|---|
| Dwemer | 730 | 730 | Explicit UTF-8 parsing corrects the earlier 734-character result caused by implicit Latin-1 interpretation of a UTF-8 fragment. The 734 count was rejected. |
| ModPub | 3039 | 2922 | Literal DOM whitespace is retained. The earlier candidate's 2922 normalized count used whitespace collapsing; neither count implies a different body boundary. |
| SubscribeStar post 701675 | 416 | 402 | Eight images remain in observed public body order. Avatar is a separate creator image. |
| SimsFinds | 204 | 201 | Main body is separate from creator note. Creator is account 1077254; supplied profile receipt reports display name `usagi` and a 600×600 avatar. Preview is a different 800×800 image. |

The latest WordPress REST item and first RRe36 RSS item have equal literal text and ordered image sources in this snapshot. Their serialized HTML differs; a text/media check does not establish raw HTML equality or complete feed history.

Historical fixture assumptions remain explicit: Dwemer's main file card has no `data-file-id`; requiring one was rejected. ModPub's gray box contains a second nested `h5`; selecting all headings as the filename was ambiguous and was replaced by `h5.mb-0`. Synthetic regressions exercise both corrected boundaries, as well as wrong joins/avatars, missing/duplicate IDs, truncated metadata, protected/missing bodies, unsafe schemes, JSON duplicate keys, XML entities and malformed CLI inputs.

## Publication and acceptance boundaries

Receipts contain public identities and references, ordered event kinds, counts and hashes. Full body/changelog/summary prose and raw DOM/form attributes are excluded. All URL query values and fragments are removed, and unsafe schemes, userinfo and control characters are rejected. This intentionally loses query-based delivery information. The raw input and selected in-memory body preserve source context; the receipt is not a runnable download manifest. CLI failures expose exception types, excluding exception messages and personal input paths.

The parser does not independently decode an avatar when it imports a browser receipt. SimsFinds' reported profile avatar decode/dimensions retain that provenance. Its gate is `download_transfer_not_performed_by_offline_parser`: separate [SimsFinds browser evidence](../site-adapter-discovery/simsfinds-browser-2026-10-28.json) and [delivery evidence](../../docs/adapters/simsfinds.md) establish only their own observed transfer, including the retained initial event timeout and later ZIP/DBPF inspection. See the [Sims 4 guide](../../docs/adapters/games/sims-4.md) and [SubscribeStar guide](../../docs/adapters/subscribestar.md) for access, download and playback boundaries. These separate observations do not turn this offline replay into transfer, entitlement, native follow/import or full adapter acceptance.

Research context: [research method](../../docs/research-method.md), [Minecraft methods](../../docs/adapters/games/minecraft.md), [Skyrim methods](../../docs/adapters/games/skyrim-se.md), and [October 28 methods record](../../research/2026-10-28-adapter-methods-round2.md). No target application integration or production performance claim is made.
