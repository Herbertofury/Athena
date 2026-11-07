# Bilibili adapter research

[Adapter laboratory](README.md) · Reviewed October 26, 2026

## Current route

The official open platform describes authorized account and video capabilities. Dynamically rendered documentation needs further endpoint and permission review.

## Reuse before replacement

Evaluate maintained yt-dlp support and existing adapters after checking exact routes and terms. Prefer official playback/access paths where supported.

## Acceptance workload

BV/AV identity; multi-part videos; gallery boundaries; subtitles; region/access failures; signed-media expiry; playable versus poster-only results.

## Evidence status

Research entry created; no live complete-media or authenticated acceptance. No recommendation transfers to a project until it beats that project's actual baseline without sacrificing requirements.

[Primary platform reference](https://openhome.bilibili.com/doc) · [Shared collection contract](contract.md)

## Official public embed · 2026-10-27

The [official external-player documentation](https://player.bilibili.com/) supplies the public BV1B7411m7LV example. Atlas now includes that one media card using the supported iframe route, canonical source/video binding, explicit loading and autoplay=0. No poster URL is guessed: the poster stays inside the official player. Gallery, captions, multipart completeness and account-only data remain uncollected.

Real cloud-browser checks passed both directly and inside the deployed sandboxed Atlas iframe: explicit play/pause, reload with one frame, immediate unload with zero remaining frames and no stale loaded event. The original four card objects remain unchanged. Seven served assets matched the build; 62 Node and 53 Python tests passed, and source CI passed on Linux/Windows.

The application correctly reports only frame lifecycle. Actual playing/paused observations are external test evidence, not an implemented cross-origin playback API. YouTube was rechecked only to ready; a Steam HLS trailer was rechecked playing/paused. All players were unloaded after testing. [Raw receipts, exact source and limits](https://github.com/Herbertofury/Engineering-Atlas/tree/ab5a35a03df55bfa83ac188e28652dc94f1be2ff/experiments/bilibili-player-lab).

## October 28 research expansion

[Current platform-family research](social-platforms.md) adds author/avatar attribution, full body/media/files, follow/import distinctions and current interface limits. [Coverage catalog](coverage-catalog.md) and [authenticated fixtures](authenticated-research.md) describe the remaining work. This update preserves the evidence status above; it does not broaden an earlier narrow success or erase a failure.
