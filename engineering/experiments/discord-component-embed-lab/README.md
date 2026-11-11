# Discord component-embed projection

This is an offline repair to the existing [message normalizer](../site-extraction-lab/discord_message.py), not a Discord client or live-message acceptance test. It reuses the component walker rather than building another renderer.

## Reproducible public source example

The [fixture](fixtures/official-component-example.json) is the complete code-sample JSON from Discord's official Full Example at source commit `36adecb2e0bbbf500c430147ef4acbe9aa1a389e`. It was parsed and reformatted without changing any values. Discord's [pinned README](https://github.com/discord/discord-api-docs/blob/36adecb2e0bbbf500c430147ef4acbe9aa1a389e/README.md) assigns code samples to MIT; the full [copyright and license notice](fixtures/LICENSE-CODE) accompanies this fixture. Documentation prose remains outside the repository.

[Capture provenance](public-validation-2026-11-11.json) retains source hashes, lengths, timestamps, the verified Git blob, license evidence and transformation steps. The rendered official example matched the pinned source. No source script was executed or example URL fetched.

The [probe](probe.py) places that unchanged source tree into an explicitly synthetic message envelope. Message `1` and channel `2` are test markers, not observed identities; no author/account is invented. This is not an authenticated API response, anonymous message read, provider rendering test or private fixture.

## Measured projection change

Exact baseline #43 is `7ba88d30229f3073c9aa738f087b9199ffae16ae`. The old normalizer retained source data in its raw body but omitted the component embed from projected text/media events. [Before](before.json) and [after](after.json) use the same fixture and preserve the same raw-projection hash.

- Before: zero projected components, text or media references; only three surrounding events.
- After: 15 component nodes, 7 text/label events, 4 ordered media references and 4 button-link events, within 50 total events. The last media reference retains its spoiler state.
- The source's two Markdown links remain in text. Six source link occurrences do not mean six distinct projected link events.

Media references remain unfetched and undecoded, with no playback or renderer acceptance. Projection completeness stays false. Container-wide spoiler inheritance, content-scanning metadata, full Markdown rendering and comprehensive component validation are not added by this repair.

## Defensive boundaries

Nested components use embed-specific source paths between the existing embed start/end events. Top-level components and ordinary rich embeds retain their prior behavior. Mismatched embed types and empty component trees produce explicit warnings; missing/non-array component payloads fail. Unknown component variants remain unsupported observations.

The new component-link-preview context must not resolve message-private attachments by filename or ID. Existing rich-embed and top-level attachment handling remains separate. Partial updates, denied/intent-limited refreshes, forwarded snapshots and sanitized public receipts retain their existing boundaries. No account, grant, channel collector, transport or runtime changed.

## Reproduction

From the repository root:

```sh
python3 engineering/experiments/discord-component-embed-lab/probe.py
python3 -m unittest discover -s engineering/tests -p 'test_discord_component_embeds.py' -v
python3 -m unittest discover -s engineering/tests -p 'test_site_extraction_discord.py' -v
```

To reproduce the baseline, pass `--module /path/to/baseline/discord_message.py`. The public fixture makes the projection comparison reproducible without a service account, stored private capture or network request.

Synthetic defensive tests are separately labeled. They test parser behavior, not provider access, entitlement, moderation, complete history or target compatibility. No benchmark or target recommendation follows.

## Retained failures and final local checks

A 12-test regression suite replayed against baseline produced 27 expected failing
assertions/subtests; an earlier version produced 23. Both logs remain retained.
An intermediate guard also rejected an ordinary rich-embed attachment case; the
corrected explicit component-embed context matches complete baseline records for
six ordinary rich-embed variants.
Those failures remain in local evidence. They are not live provider incidents.

Final module SHA-256:
`b522913010d9ca91f6e39f0338323a72809df169da4234a34e2937c78f783948`.
All 996 engineering Python tests, 420 engineering Node tests, root build/tests
and seven generated-asset checks pass. The final focused suite includes 18
unchanged Discord tests, 13 new synthetic tests and 4 documentation-receipt checks.
Nine independent tests also pass. Research checks accept 2,420 sources and 288
Markdown files, retaining 135 existing stale-source notices.

The adjacent adapter example's unsupported `access="complete"` argument was
corrected to the existing `access="available"` state; no API changed. Browser,
Rust, hosted CI, live account access and target adoption remain separately
unverified. Local checks do not authorize integration, merge or deployment.

## Follow-up receipt reconciliation

The separate [media-state follow-up](../discord-media-state-lab/README.md) changes the shared module's hash. The exact historical PR54 result is preserved as [after.json](after.json); [current-after.json](current-after.json) is the current offline replay. The original sample, license, before result and capture provenance remain unchanged. The limits and test totals above describe the original repair, not the later module. No example flags were fabricated to support a live-data claim.
