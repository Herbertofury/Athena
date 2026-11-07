# YouTube adapter research

[Adapter laboratory](README.md) · Reviewed October 27, 2026

## Current route

Use the official IFrame player for playback. Metadata, player availability and account authorization are distinct capabilities. Owners can disable embedding; missing client identification can also fail playback.

## Reuse before replacement

Compare official API/player routes with maintained yt-dlp metadata extraction only where permitted. Extractor coverage is not permission to bypass restrictions.

## Acceptance workload

Exact video/channel ID; thumbnails; playlists; captions; live state; embed errors; user-initiated playback; no autoplay by default.

## Evidence status

Earlier tests reached player-ready but remained buffering. The v10 public test reached actual official-player playback and Pause for M7lc1UVf-VE, after approximately 123.536 seconds from Play, including the retained 30-second unverified timeout. Its thumbnail still failed. This is one public example, not reliable playback or authenticated coverage. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://developers.google.com/youtube/iframe_api_reference) · [Shared collection contract](contract.md)

## Scoped identity repair and deployed evidence

The single-watch-video workbench binds source, canonical card, player and thumbnail video IDs. Nine generated mismatches fail while retained fields remain unchanged. Channels, playlists, Shorts source routes and multi-video collection schemas remain outside this contract. URL agreement does not establish ownership or complete collection.

[Retained before/after, raw public playback receipt and exact implementation verification](https://github.com/Herbertofury/Engineering-Atlas/tree/0cca1cca404351a0680a0914937eb7e6f37ce969/experiments/youtube-identity-lab). All nine served assets matched v10. All five cards, 19 gallery entries and 19 video entries remain. 22 of 23 previews decoded; the failed thumbnail and delayed playback remain recorded. Pause was confirmed and reload cleanup left zero players. Autoplay remains off. No playback-speed improvement is attributed to the identity repair.

## October 28 research expansion

[Current platform-family research](social-platforms.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
