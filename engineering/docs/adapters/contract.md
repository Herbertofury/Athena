# Collection, media and session contract

[Adapter laboratory](README.md)

## Identity and scope

Record provider, canonical item ID, source URL, retrieval time, API/extractor version, access state, media-role provenance and completeness. Separate post/gallery identity from creator avatars, recommendations, advertisements and unrelated embeds. Preserve original/preview relationships, ordering, dimensions, MIME type and expiry where supplied. Empty, partial, login-required, rate-limited, removed and unknown are distinct states.

A safety budget may stop an operation, but must produce an explicit partial result and continuation, never silently label a truncated gallery complete. Deduplicate exact owned assets without collapsing distinct variants or items. Preserve failed attempts and last verified results.

## Reuse and measure

Inventory existing adapters and tests first. Prefer documented provider APIs/players when sufficient, then evaluate maintained specialist extractors and established parsers. A general crawler provides orchestration, not site-specific media knowledge. Compare the existing implementation with the candidate on the same permitted corpus: complete output, first-correct-card and complete-enrichment timing, decoded images, playable video, memory, storage and recovery.

Separate fixture, public-live and authenticated-entitlement tests. Synthetic cards isolate rendering; real cards expose decode, networking, expiry and playback failures. Neither substitutes for the other. Never execute scraped HTML in the app's trusted UI. Render text safely and allowlist media/player destinations.

## Sessions and secrets

Use secure sign-in and retain valid sessions for authorized future tests. Never publish passwords, API secrets, cookies, refresh tokens or signed private media URLs in fixtures, logs or wiki pages. Browser sessions do not automatically grant API access. New persistent grants require explicit approval. Expiry, logout and revocation must become actionable states, not empty data.

Authenticated fixtures stay private. Publish sanitized methodology and evidence only. Do not bypass paywalls, access controls, provider limits or browser warnings. No cookie export, token harvesting, stealth identities or proxy rotation to evade blocks.

## Media cards

Autoplay is off by default. Preserve attribution and access/licensing boundaries. Distinguish image loaded, image decoded, player ready and actual playback. Show blocked/unavailable states truthfully. Represent captions, posters, variants and attachments when exposed and authorized; do not replace a complete post with its first thumbnail.

No promotion without target-baseline improvement and preserved requirements.

## Provider binding regression · 2026-10-26

The public workbench validator now binds each source link to its declared provider, rejects cross-provider YouTube player entries and unreviewed player kinds, and validates optional Steam poster hosts. Previously, globally allowlisted hosts could pass without all of those relationships being checked. Four new adversarial checks failed against the previous implementation and pass after the repair; the complete 4-card, 19-gallery-image, 18-video fixture is unchanged and validation does not mutate it.

This establishes provider-host consistency, not ownership of every asset or a complete security audit. Live playback results remain separately versioned. [Raw regression receipt](https://github.com/Herbertofury/Athena/blob/main/engineering/experiments/real-media-lab/provider-binding-receipt-2026-10-26.json) retains before/after identities and test scope.

## Per-video identity binding · 2026-10-27

[YouTube workbench repair](../../experiments/youtube-identity-lab/README.md) binds
its single-video source page, canonical card ID, official player ID and thumbnail
URL namespaces. Nine generated mismatches passed the former host-only guard and
are now rejected. Complete retained public fields remain unchanged. This is URL
identity consistency, not ownership verification or complete YouTube coverage;
unsupported collection/source shapes remain explicit future work.

## Cross-repository implementation checkpoint · 2026-11-24

Use the [shared capability routing index](../../../guidance/registry/shared-capabilities.json) and [M1 issue #363](https://github.com/Herbertofury/Athena/issues/363) as the one coordination path. Compare at the operation level (identity, discovery, metadata, versions, dependencies, full media, updates, follow, permitted transfer, caching and recovery), not just domain coverage. A platform label or a fast preview is not full adapter parity.

### Maintained implementations to reuse

| Source | Strong capability to share | Evidence and boundary |
| --- | --- | --- |
| [Athena provider release contract](../../experiments/provider-release-contract/README.md) | Exact GitHub repo/release/asset identity; expected size and provider digest; staged backpressure-aware download and last-good preservation. | Four local test groups pass on Node 22.16.0, including loopback HTTP. Exact committed source/test blobs checked. No live provider, range-resume or performance proof. |
| [GameSync request coalescing](https://github.com/Herbertofury/Gamesync/blob/bce6c1bcb31c63d31c64185fef143a53d9c4d35f/app/shared/request-dedup-module.js) | Exact request options and header matching, independent response bodies, caller cancellation separation and stale-entry-safe cleanup. | Two local regression groups pass on Node 22.16.0; exact source blob 4e290ffc4c833d90c2e4ead7d7e35287bb364ef0 and test blob 2045c9470d48ca0b3522021ea6092f12593fc36a match. Browser/CI acceptance remains open. |
| [GameSync Next provider profiles](https://github.com/Herbertofury/GameSync-Next/blob/d3117d3c7edddf8e2be99b213feb45aa433053b9/packages/shared/src/providerProfiles.ts) | Broad capability profiles and shared site definitions; inventory feature gaps before inventing new adapters. | Source inspection; actual per-operation support must be tested. |
| [GameSync Next adoption](https://github.com/Herbertofury/GameSync-Next/blob/d3117d3c7edddf8e2be99b213feb45aa433053b9/apps/asset-orchestrator/docs/SHARED-PROVIDER-CONTRACT.md) | Both download call paths use pinned Athena transfer source, GitHub release assertions, exact archive fallback, corrected completion and nested concurrency. | Consumer integration CI failed with unavailable logs/steps (run 45500013804, rerun also failed). Do not promote until repaired and qualified. |
| [Enderloom fast lane](https://github.com/Herbertofury/Enderloom/blob/f3cf32ff77c6c682eb76ffbaa2a02a612d69babb/src/provider-api-fastlane.js) and [Modrinth batch resolver](https://github.com/Herbertofury/Enderloom/blob/f3cf32ff77c6c682eb76ffbaa2a02a612d69babb/src/modrinth-batch.js) | Exact provider binding before early media, batched case-sensitive Modrinth ID/slug lookup with fallback, full enrichment and explicit original/preview relationships. | Changes and fixture scripts committed; native/live acceptance and Hangar sample confirmation open. Preserve existing resolver rather than introduce a second request. |
| [Modhunter source adapters](https://github.com/Herbertofury/Modhunter/blob/30ad245e546f7314f3be86f3c7004c66258110ca/mo2_update_arsenal/source_adapters.py) | Provider capability distinctions, native Rust exact release selection, conditional revalidation and explicit rate-limit states. | Source and existing tests inspected, not rerun during this pass; preserve exact-file mapping and compare with compatible consumers. |
| [Minecraft Mod Vault provider contract](https://github.com/Herbertofury/Minecraft-Mod-Vault/blob/c50f67157224734540067c39861ae708340d7797/PROVIDER-IDENTITY-CONTRACT.md) | File identity, hash-based verification and compatible version selection. | Source inspection; port verified contracts and authorized transfer methods, not unreviewed credential redirects or synthesized download routes. |

GameSync CI run 45500485725 likewise failed without retrievable logs/steps; the isolated local regression result does not establish a complete extension build. No release was qualified in this checkpoint.

### Acceptance and sharing rules

The reference modules are maintained at Athena; GameSync Next's source copy has a pinned origin documented in its local adoption guide. Prefer a versioned shared library or reproducible sync after two-host proof; until then, audit source-copy drift before upgrades and return fixes to the authoritative owner. GameSync owns its repaired request coalescing implementation. Other runtimes may port its tested behavior instead of copying a language-incompatible module. Do not make Athena a live network dependency at startup.

For every provider, prove the same authorized project/file/media set before and after, preserve exact IDs and variant relations, distinguish absent release from denied/throttled/failed request, and carry all available provider integrity assertions through the actual writer. Keep previous valid data when acquisition fails. Separate official API, authorized browser and manual-only lanes; do not convert research catalog coverage into runtime claims. For a newer upstream version, apply the existing fix-forward policy and record any evidence-backed compatibility hold.

Next priorities within existing M1: qualify the GameSync Next and GameSync CI/runtime integrations; validate Enderloom fixtures and public-live scope; compare Modhunter's native exact release/cache path and Vault's provider routes; then review broader GameSync profiles and authorized extraction methods against MediaForge, UltraDeck, Noxviola and other actual consumers. Expand provider by provider, beginning with Modrinth, CurseForge, GitHub and Nexus. No full fleet parity, current-every-provider version audit, benchmark winner, or release approval is claimed.
