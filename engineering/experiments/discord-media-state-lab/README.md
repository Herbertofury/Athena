# Discord media-state projection

This is an offline follow-up to [component previews](../discord-component-embed-lab/README.md), based on that draft's exact commit `9ff4679a30baa1840bb16c357d0bb3f0866b88d6`. It changes the existing [message normalizer](../site-extraction-lab/discord_message.py), not a running Discord client or target application.

## Separate evidence classes

- **Primary documented:** current official message/component schemas, pinned upstream source, and the distinct field masks recorded in [schema provenance](schema-evidence.json).
- **Synthetic regression:** generated container, attachment, embed and update payloads. No positive spoiler/returned-flag case here is an observed Discord API response.
- **Preservation replay:** the complete, unchanged MIT-licensed official code sample already retained in the component-preview experiment. It contains no positive container spoiler or returned flag bits, so it tests preservation, not the newly added cases.
- **Not established:** live extraction, permission parity, moderation accuracy, complete rendering, downloads, playback, history, performance or target-project acceptance.

No account, bot, message, channel, invite or widget endpoint is used. No example artwork, external link or executable is fetched. Raw source documentation stays outside the repository; schema facts and hashes identify the source without republishing its prose.

## Decision

Preserve source-scoped metadata before a consumer chooses presentation. Attachment flags, embed-level flags, embed-media flags and unfurled component-media flags are not interchangeable. Container visibility also applies to its descendants; a child cannot clear an ancestor's spoiler state, and a sibling must not inherit it.

An absent scan field is unknown. Explicit zero records only that the supplied field has no listed bits; it is not a clean-file verdict. Discord documents later scan updates, and supplied arrays still replace arrays under the existing partial-update contract. No automatic moderation action, message deletion or rehosting is added.

Reuse the existing walker, attachment resolution, access gate, partial-update handling and receipt allowlist. The alternative of deriving all media flags from a merged dictionary or a source-path prefix is rejected because the same bit has different meanings. A separate renderer or newly installed SDK would not correct this offline projection by itself. Maintained official-API libraries remain the transport route for a future explicitly authorized integration.

## Evidence and reproduction

See [dated research](../../research/2026-11-11-discord-media-states.md) for results and limits. Run the focused synthetic tests and the existing official-example probe from the repository root:

```sh
python3 -m unittest discover -s engineering/tests -p 'test_discord_media_states.py' -v
python3 engineering/experiments/discord-component-embed-lab/probe.py
python3 -m unittest discover -s engineering/tests -p 'test_discord_media_preservation.py' -v
python3 engineering/experiments/discord-media-state-lab/compare_records.py --baseline /path/to/pr54-checkout
```

The original PR54 `after.json` is retained byte-for-byte as [the prior receipt](../discord-component-embed-lab/after.json). Updating the current replay hash must not erase its historical module identity or turn its example into a live response. The original source fixture, license, before receipt and provenance are unchanged.

[Full-record preservation result](preservation-result.json): 20 complete record comparisons, including the unchanged official sample and synthetic ordinary cases, were identical to PR54. This is bounded preservation, not full provider acceptance.
