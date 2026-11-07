# Discord adapter research

[Adapter laboratory](README.md) · Reviewed October 26, 2026

## Current route

Messages expose attachments and embeds through permission-controlled APIs. Check message-content access and channel-history permissions for the actual application. Attachment availability can expire.

## Reuse before replacement

Use maintained official-API libraries and explicitly authorized bot/application access. Do not automate personal user tokens or export sessions into a scraper.

## Acceptance workload

Guild/channel/message identity; attachments versus embeds; spoilers; edit/delete reconciliation; expiry; rate limits; denied channels.

## Evidence status

Message schema reviewed; no bot grant or private-message collection configured. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://docs.discord.com/developers/resources/message) · [Shared collection contract](contract.md)

## October 28 research expansion

[Current platform-family research](social-platforms.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.

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

## October 31: executable message normalization

The earlier no-implementation statement above describes the October30 checkout. This pass adds [discord_message.py](../../experiments/site-extraction-lab/discord_message.py) and [18 synthetic defensive tests](../../tests/test_site_extraction_discord.py). These are offline transformations of caller-supplied official message payloads. No Discord login, app installation, bot grant, channel read, download or native follow was performed. [Round-three research](methods-round3.md).

```python
from discord_message import normalize_message, discord_receipt

record = normalize_message(payload, access="complete")
updated = normalize_message(partial_event, access="complete",
                            partial=True, previous=record)
safe_evidence = discord_receipt(updated)
```

The caller must supply truthful access state; `complete` describes the supplied access context, not a claim that the normalizer supports every Discord feature. The default state is unknown. Use the previous runtime record for partial updates, not its sanitized receipt. The module does not implement transport, event ordering, account permissions or persistence.

### Identities, body and media

String snowflakes remain exact. A normal user, webhook display identity, guild-specific avatar and global avatar have separate semantics. The parser preserves an unavailable avatar rather than substituting server artwork. Forwarded snapshots have no original author in their schema; the forwarder remains separate. Absent referenced-message data means unresolved, while an explicit null has different semantics. [RDSOC31001] [RDSOC31003] [RDSOC31004]

The ordered projection walks message text, embed fields/media, component text displays, nested containers, section accessories, media galleries and file components. It retains attachment identifiers, media role, spoiler state and available type/dimension/duration metadata. An unresolved component attachment ID produces an explicit warning. Unknown variants remain warnings, and `projectionComplete` stays false because features outside this selected projection are not silently certified. [RDSOC31002]

Partial updates preserve fields absent from the update. Denied or intent-limited refreshes cannot silently replace a known body with empty protected fields. An old retained body is labelled retained data, not a fresh successful read. Correctly resolving out-of-order events, deletes and lost permissions still requires the application's authorized transport and retention policy.

### Runtime URLs and public receipts

The runtime record retains an authorized signed delivery URL. The public receipt uses a restricted reference allowlist and hashes/counts; arbitrary external paths, Discord API/webhook paths, raw names, descriptions, waveform and filenames are omitted. Even a query-free URL may contain a credential in its path. A regression covers that case. Attachment receipts retain stable channel/attachment identity directories rather than publishing a potentially sensitive filename. These receipt references are not download URLs.

The test suite also covers malformed/rounded IDs, webhook/user separation, component media, missing references, partial updates, denied/intent-limited states and forward snapshots. Synthetic payloads establish defensive behavior only. A permitted real message fixture is still required before an authenticated extraction claim.

## Community discovery and following

Actual public Discord discovery pages were inspected for [Cyberpunk2077 Modding Community](https://discord.com/servers/cyberpunk-2077-modding-community-717692382849663036), [Modding Guild](https://discord.com/servers/872252014002843658), and [Skywind](https://discord.com/servers/skywind-145539675577122816). The pages expose stable guild identifiers, descriptions, separate server icons/splashes and community routes. They expose no member-post history or author avatars for private messages. Skywind states it publishes news there first. [RDSOC31005] [RDSOC31006] [RDSOC31007]

Keep named guilds under the Discord platform adapter. A local channel/thread watch can filter by stable poster identity after the app has a permitted read route. It is not a global author-following feed. Native announcement following, membership, notifications and an installed bot's permissions remain separate operations. Source login alone does not authorize self-bot collection or create an app grant.
