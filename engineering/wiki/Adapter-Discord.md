[← Atlas home](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home) · [Canonical source](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/adapters/discord.md)

# Discord adapter research

[Adapter laboratory](https://github.com/Herbertofury/Engineering-Atlas/wiki/Site-Adapters) · Reviewed October 26, 2026

## Current route

Messages expose attachments and embeds through permission-controlled APIs. Check message-content access and channel-history permissions for the actual application. Attachment availability can expire.

## Reuse before replacement

Use maintained official-API libraries and explicitly authorized bot/application access. Do not automate personal user tokens or export sessions into a scraper.

## Acceptance workload

Guild/channel/message identity; attachments versus embeds; spoilers; edit/delete reconciliation; expiry; rate limits; denied channels.

## Evidence status

Message schema reviewed; no bot grant or private-message collection configured. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://docs.discord.com/developers/resources/message) · [Shared collection contract](https://github.com/Herbertofury/Engineering-Atlas/wiki/Collection-and-Media-Contract)

## October 28 research expansion

[Current platform-family research](https://github.com/Herbertofury/Engineering-Atlas/wiki/Social-and-Publishing-Adapters) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](https://github.com/Herbertofury/Engineering-Atlas/wiki/Site-Adapter-Coverage) and [authenticated fixtures](https://github.com/Herbertofury/Engineering-Atlas/wiki/Adapter-Login-and-Authenticated-Research) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.

## October 30: completeness and expiring attachments

Documentation review only; no Discord account, bot grant, channel request or attachment download was used. The local app, tests and adapter-parser experiment contain no Discord-specific implementation in this checkout. Reuse the existing snapshot, byte-limit and last-good contracts before adding transport.

The current [message schema](https://docs.discord.com/developers/resources/message) separates attachments from media referenced by embeds/components. Missing message-content intent can empty several content fields; absent history permission can yield no messages. Neither result alone proves a genuinely empty post or channel. Preserve author/webhook identity and optional attachment type, size, dimensions, description, duration, waveform and spoiler state. A proxy URL is not universal file transport: unsupported attachment types can return 415. [DISCORDMSG30]

[Signed attachment URLs](https://docs.discord.com/developers/reference#signed-attachment-cdn-urls) expire. A newly fetched authorized message can supply refreshed URLs. Removing signature parameters is documented for certain fields submitted to Discord, not as a general external-download renewal technique. Standard CDN endpoints have different expiry semantics. [DISCORDCDN30]

### Reuse and acceptance decisions

The maintained [discord.py raw message-edit event](https://discordpy.readthedocs.io/en/stable/api.html#discord.on_raw_message_edit) exposes partial payloads, including embed-only edits without content. Its raw delete event works independently of the message cache. These are reuse candidates, not an installed dependency or accepted Atlas integration. [DISCORDPY30]

Atlas-specific proposed tests, not completed acceptance:

- Keep permission/intent-limited, unknown, empty and complete states distinct. Never clear last-good content merely because a refresh is partial or denied.
- Preserve attachment, embed and component media separately; verify deduplication by stable identity without dropping alternate descriptions or representations.
- Record URL expiry separately from message deletion. Renew only through an already authorized official route; respect revoked access and retention rules. Do not export signed private URLs or bodies into public fixtures.
- Replay partial edits and deletes out of order, with uncached messages, missing history permissions, expired URLs and unsupported proxy formats. Retain failures and provenance.
- Keep metadata-visible, bytes-verified, player-ready and actually-playing states separate. Require manual playback; autoplay stays off.

A generated fixture cannot establish permission parity, authenticated completeness or performance. Browser login alone supplies no app API grant. New persistent access still needs specific approval. No other project recommendation follows.
