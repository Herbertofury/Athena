# Give a theme a job

A good theme makes the product easier to recognize **and** easier to use. Changing a generic dashboard from purple to teal is still a generic dashboard.

## What Theme Factory is useful for

[Anthropic's Theme Factory](https://github.com/anthropics/skills/blob/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/theme-factory/SKILL.md) documents ten starting palettes with font pairings and a custom direction when none fits. Its useful idea is to look at multiple directions on real content before committing. It is not evidence that an application has good layout, accessibility, or interaction design; those have to be checked in the product. The [upstream license](https://github.com/anthropics/skills/blob/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/theme-factory/LICENSE.txt) is a separate question from any proposed font or artwork license. Athena cites the workflow; this guide neither installs the skill nor bundles its presets, fonts, or showcase.

## Pick a direction using the actual product

1. **Name the job and what must not change.** Write one sentence about the user's main task and one about the project's visual identity. Preserve existing labels, shortcuts, information, and working interactions unless a separate change is justified. Keep the project’s established default; if the user asks for an alternate look, do not silently replace it.
2. **Compare two genuinely different directions with the same inputs.** Use real content and the same difficult states. Define what gets the user's attention first, where their next action is, and how the theme handles dense information. Choose a better hierarchy, not just a different palette. Keep work local and use installed or licensed fonts with a readable offline fallback.
3. **Map decisions to roles rather than hex codes.** Specify canvas, surface, primary text, secondary text, action, selection, focus, warning and error. Give headings, metadata and long text distinct roles. Status gets words or an icon as well as color. Use the accent for a reason, such as selection or the next action, rather than on every card.
4. **Do the anonymous screenshot test.** Hide the product name and temporarily view the screen in grayscale. Would someone still recognize what the product is for and know where to start? If a café, mod manager and game library could use the same layout unchanged, revisit structure and density before changing the colors again. Don't force novelty where a familiar control works.
5. **Review and keep a way back.** Show the proposed direction and baseline with the same data, viewport, and state. Check keyboard focus, long names, dense lists, empty/error states and any themes affected. For the web, use the applicable [WCAG 2.2 criteria](https://www.w3.org/TR/WCAG22/) for text/non-text contrast, use of color, and focus; do not infer conformance from a screenshot. Record what improved, what stayed the same, and what was not verified. An optional skin should be easy to turn off without changing user data or preferences unrelated to the theme.

## Two worked examples (proposals, not shipped changes)

| Surface | Choose based on the real task | Reject if |
| --- | --- | --- |
| A mod manager with a dense library | Keep the black workspace and recognizable section colors where already established. Make version, source and dependencies align like a useful workbench; give selection and keyboard focus different cues. Compare against an image-forward alternate view using the same long mod names and status mix. | The styled view hides dependency warnings, makes rows harder to scan, obscures focus, or makes existing controls harder to find. |
| A game library with artwork and discovery | Let approved cover art carry personality while keeping the same fast routes for installed games, search and ownership filters. Try a compact table for finding and an optional shelf for browsing; use the same library to see where each wins. | The new look needs a hero or animation to feel distinctive but makes search, filter state, or play controls harder to find. |

**Review receipt:** Product and screen · primary task · baseline/default preserved · two directions · selected direction and why · tested states/viewport · known gap · revert path. Keep the receipt short; evidence matters more than adjectives.

After building or restyling, use [Review the screen without stripping its meaning](UI_SIGNAL_REVIEW.md) for a scoped final pass on copy, decoration, and status cues.
