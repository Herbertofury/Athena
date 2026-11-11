# Discord media visibility and flag namespaces

Checked November 11, 2026. This focused contribution follows exact draft #54 at `9ff4679a30baa1840bb16c357d0bb3f0866b88d6`; it does not integrate, merge or deploy #43 or a target project. [Experiment](../experiments/discord-media-state-lab/README.md).

## Source facts

The current [message schema](https://docs.discord.com/developers/resources/message) assigns attachment spoiler to bit 3 and attachment animation to bit 5. Rich-embed media also uses animation bit 5, but the embed object's own bit 5 identifies an inventory entry. Attachment and embed scan hints use bits 4, 6 and 7. These namespaces must not be collapsed. [DMS11001] [DMS11003]

The [component schema](https://docs.discord.com/developers/components/reference) gives unfurled media animation bit 0, with a separate content-scan object whose bits 0, 1 and 2 describe scan hints. Container spoiler state encompasses the contained components. The schema documents that scan metadata may arrive after the original message. An absent field does not establish that media is clean or inspected. [DMS11002] [DMS11004]

Pinned official source provides field definitions, not a real response corpus. The prior complete official preview example is preserved and replayed unchanged. Positive new flag/spoiler cases are explicitly synthetic because the inspected official example contains neither. Hashes establish retained byte identity, not provider authenticity, permission, safety, renderer behavior or availability.

## Problem and scope

The existing walker checked only an immediate media wrapper or spoiler filename, dropping ancestor-container visibility. Animation handling used the component path prefix and merged media flags, which could miss component-embed animation and mistake attachment bits for unfurled-media bits. Raw source fields were already retained; these are projection defects, not a claim that source data was destroyed.

The repair stays inside the offline normalizer and its tests. Access assertions, denied/intent-limited retention, attachment identity resolution, source ordering, raw fields, partial-array replacement and `projectionComplete=false` remain. Full message-schema validation, Markdown spoiler parsing, transport, ordering of remote events, account grants and moderation decisions remain separate.

## Reuse and rejected alternative

Reuse the existing component traversal and source-specific attachment binding. A shared numeric mask applied after merging attachment and media dictionaries is rejected: the same number is not the same field meaning. New dependencies or a renderer replacement are unnecessary for this projection repair. No recommendation transfers to an app or mod without comparing that target's real baseline and full requirements.

## Verification record

Module SHA-256: `a4d690e7b129e86fe44dbfe042afdfdc3f407608854653d5070ec1d360e9859b`.

- 11 new synthetic tests and 4 preservation tests pass; 35 previous Discord tests retain their gates. The one current-replay test now reads a separately named current receipt, with full equality and exact module-hash assertions intact.
- All 1,011 engineering Python tests and 420 engineering Node tests pass. Root build, 141 root Node tests, 105 Media tests, 313 Python tests and seven generated-asset checks pass.
- Ten independent tests cover 1,096 mask/combination cases plus malformed metadata, snapshots, partial updates, visibility boundaries and privacy.
- Twenty complete normalized-record comparisons to PR54 are identical, including six ordinary rich-attachment variants and the unchanged official example under available/unknown access. [Reproduction and result](../experiments/discord-media-state-lab/README.md).
- Research checks accept 2,424 sources and 290 Markdown files, with 135 existing stale-source notices retained.

The initial seven-test baseline had 66 failing assertions/subtests and one error. Its log remains retained. Intermediate aggregate checks retained the expected shared-module hash mismatch and a documentation-composition error while the new source fragment and schema receipt were unfinished. Independent testing initially made two incorrect assumptions that unknown scan hints would be explicit; its corrected harness honors the documented omission-as-unknown contract, and the original errors remain retained. A parent launcher also used the wrong working directory before any checks ran; that failed launch is retained separately.

The original official fixture, license, before/after receipts and source provenance are unchanged. [Receipt reconciliation](../experiments/discord-component-embed-lab/media-state-reconciliation.json) records the current hash separately. Flat body text remains preserved content, not a safe-to-display preview; consumers must honor scoped event spoilers. Public receipt allowlists remain unchanged and do not expose full scan metadata.

Browser/Rust suites, live Discord responses, rendering, media downloads/playback and target adoption were not run. Local checks do not establish hosted CI success or permission to merge/deploy.
