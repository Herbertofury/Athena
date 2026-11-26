# Review the screen without stripping its meaning

A final pass should remove things that make the user hunt for meaning, not the meaning itself. Do this after the design direction is set. This is not a layout rewrite, a ban on visual personality, or an instruction to edit the whole repository.

**Source studied:** Felipe Basurto’s [Unslop UI](https://github.com/felipebasurto/unslop-ui/blob/78cf65d311da128c7f0a9ea25f62731056834251/skills/unslop-ui/SKILL.md), version 1.0.2 at the reviewed commit. It treats wording and visual noise as a scoped review, supports a plan-only pass, and keeps actual controls and data-driven state. The project’s [MIT license](https://github.com/felipebasurto/unslop-ui/blob/78cf65d311da128c7f0a9ea25f62731056834251/LICENSE) is linked for provenance. Athena adopts the review idea, not the skill code, global activation, or every stylistic rule.

## Make a signal inventory

1. **Scope to the start and finish of a real task.** Record the route, action and resulting state. List what the user needs to choose, act, monitor progress, recover from failure and distinguish success from unknown.
2. **Classify what you flag.** Mark it *keep* if it carries information, helps navigation or expresses the owner's established style; *rewrite* if the current label obscures a real action; *remove* if it has no job; or *verify* if its meaning is uncertain. Check the state, data source or click target before deciding. Static context can still be meaningful; dynamic markup alone is not proof that a claim is useful or accurate.
3. **Preserve product meaning in the diff.** Keep the same controls and destinations, visible form labels, keyboard behavior, accessible names, localization, required warnings, and data/units/series. Review spacing or motion only when in scope. Do not turn an unverified claim into a new claim. If the owner explicitly wants a colored separator, keep it unless there is a better, agreed cue for the same information.
4. **Exercise the result, not just the snapshot.** On the actual screen, follow the same route with mouse and keyboard, compare accessible names and roles, and encounter both success and failure. Check longest strings and affected themes. Use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) as the web reference for link purpose, labels, non-color cues and accessible status messages. A screenshot can show hierarchy, but it cannot prove a link or status announcement works.

## Five example decisions

| Flag | Decision |
| --- | --- |
| A link says “Learn more” but opens the upstream changelog | Rename it “Read the changelog.” Preserve the accessible destination and normal link behavior. |
| Every mod has a permanently glowing “Live” dot even when freshness is unknown | Remove the false cue. Preserve a plain “Not checked” state where the user needs to know why there is no update result. |
| A colored edge marks a version with an unresolved compatibility report | Keep the edge and its textual status. Verify the label distinguishes a report from a confirmed fault. |
| Two cards both show “12 updates,” but one count is per profile and the other is global | Keep both if both answer real questions; label their scopes. Equal numbers are not duplicate information. |
| A two-series chart repeats both series names in a key and beside each end point | Consider removing the key only if series, units and values remain readable at the narrow width and available in the accessible alternative. Keep the key if the direct labels collide. |

**Closeout record:** what changed, what stayed and why, uncertain claims left for review, and what the actual screen tests covered. Leaving a well-designed screen unchanged is a valid result. This is a repository review method, not proof that an app has been reworked, tested, or globally configured.
