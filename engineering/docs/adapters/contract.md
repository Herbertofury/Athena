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

This establishes provider-host consistency, not ownership of every asset or a complete security audit. Live playback results remain separately versioned. [Raw regression receipt](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/real-media-lab/provider-binding-receipt-2026-10-26.json) retains before/after identities and test scope.

## Per-video identity binding · 2026-10-27

[YouTube workbench repair](../../experiments/youtube-identity-lab/README.md) binds
its single-video source page, canonical card ID, official player ID and thumbnail
URL namespaces. Nine generated mismatches passed the former host-only guard and
are now rejected. Complete retained public fields remain unchanged. This is URL
identity consistency, not ownership verification or complete YouTube coverage;
unsupported collection/source shapes remain explicit future work.
