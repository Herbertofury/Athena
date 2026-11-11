# Preserve Discord component-embed projections

Checked November 11, 2026. Baseline: Athena #43 at `7ba88d30229f3073c9aa738f087b9199ffae16ae`. No integration into #43, active Foundry release or other target app is performed.

## Existing gap and source facts

The existing normalizer already walks top-level message components, but the embed loop ignored the separate `components` array. Discord documents `components` as a distinct embed type and announced its link-preview representation on October 5. Reuse the existing walker, keeping its incomplete-projection boundary, rather than duplicate a renderer. [DCE11001] [DCE11002] [DCE11006]

The official source example has a container with text, buttons, a gallery and a thumbnail. This public code sample is not a message retrieved from Discord. A pinned source revision and its licensing statement make a small, openly reproducible fixture possible without account data or API grants. [DCE11003] [DCE11004]

## Evidence and measured outcome

The [experiment](../experiments/discord-component-embed-lab/README.md) includes the complete MIT-licensed JSON sample and full notice, capture provenance, exact implementation hashes and an offline replay. Raw source documentation/prose is not republished. The parsed component value is unchanged; only formatting and an explicitly synthetic message envelope are added.

The baseline retains the full raw field but projects none of its components, text or media. Candidate output adds 15 components, 7 text/label events and 4 media references in source order. It emits 4 button links; two additional Markdown links remain in text. Both versions retain the identical raw-projection digest. No artwork was downloaded and no source link was visited.

Separate synthetic tests check access-state preservation, partial replacement, unknown/malformed trees, attachment scope and forward snapshots. A request for public source documentation is not an API message test. Authenticated visibility, sender identity, rendering, decoding, playback and history remain unverified.

## Tradeoffs and retained failures

Ignoring the nested tree loses useful projected preview information. Flattening it into top-level components loses embed scope and ordering. A second renderer would duplicate existing behavior. The chosen repair reuses the current projection and preserves explicit incompleteness.

During implementation, an attachment guard was initially too broad: it blocked ordinary rich-embed attachment references as well as the new component-link-preview subtree. That compatibility failure is retained and the guard is narrowed; existing rich embeds must continue to match baseline output. Unsupported component-link-preview references must not borrow enclosing-message attachments.

A 12-test candidate regression suite was replayed against baseline, producing 27 expected failing assertions/subtests; an earlier version produced 23. Both runs remain retained. This is retained missing-feature evidence, not an actual provider incident. Full local results and independent review must be recorded separately from hosted acceptance.

## Related current visibility warning

Discord schedules its HTTP guild-channel filtering change for November 16, 2026. Missing channels after permission filtering cannot establish deletion. The current Athena corpus has no channel collector to repair or test; this is a documented future acceptance boundary, not observed runtime behavior. No bot opt-in, grant or channel request was made. [DCE11005] [DCE11006]

## Sources

Sources DCE11001 through DCE11006 are registered in the additive [source fragment](../data/sources.d/discord-component-embeds-20261111.json). Original dated entries remain unchanged. The [public-form receipt](../experiments/discord-component-embed-lab/public-validation-2026-11-11.json) is explicitly a documentation-example comparison. No target-project recommendation follows without that target's actual baseline and complete requirements.

## Final local validation

Final source passed 996 engineering Python tests, 420 engineering Node tests, root
build/tests and seven generated checks. Focused coverage is 18 unchanged Discord
tests, 13 new synthetic tests and 4 source-document receipt checks. Nine independent
tests passed, including fixture/license provenance and ordinary rich-embed parity.
The guide's unsupported `access="complete"` example was corrected to the existing
`available` state, with the prior error identified. Research checks retain 135
stale-source notices. No browser/Rust, hosted-CI or live-message result is implied.
