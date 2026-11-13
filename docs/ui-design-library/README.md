# UI design reference library

Athena is the canonical home for this library as Engineering Atlas is consolidated here. Reviewed 2026-11-13. This is a design study and favorites register, **not a claim that a referenced design is implemented, accessible, fast, or best for a particular application**.

## Starting references

- [Keshav Bagaade's portfolio](https://www.kshv.me/) and [X profile](https://x.com/kshvbgde): owner-selected creator reference. The portfolio lists 18 sandbox experiments and links several products. The structured inventory is [data/ui-design-library.json](../../data/ui-design-library.json).
- [Three.js account](https://x.com/threejs): follow/reference requested. Use [official Three.js documentation](https://threejs.org/docs/), [examples](https://threejs.org/examples/) and [source](https://github.com/mrdoob/three.js) to investigate a specific technique. An inaccessible social post is not evidence that its effect or code was inspected.

A favorite creator is not the same as an individually selected favorite design. Each design has its own identity and evidence state; preserve that distinction. This snapshot is not an exhaustive archive of either X account. No account follow, login grant, copied visual asset or continuous notification service is implied.

## Read each design in six passes

1. **Composition:** capture the source URL/date, desktop/mobile viewports, alignment grid, density, hierarchy, type roles, spacing, contrast, depth and state affordances. Separate observed values from estimates.
2. **Interaction:** enumerate idle, hover, focus, pressed, dragging, loading, empty, error and disabled states. Record input method and exact transition. A video demonstrates only its recorded states.
3. **Mechanism:** look for licensed source first. Record framework/version, layout model, rendering primitive, state machine, animation timing and ownership. Without code, label an implementation recipe as a hypothesis, never the author's actual implementation.
4. **Accessibility:** keyboard traversal, accessible names/roles/values, focus restoration, reduced-motion alternative, contrast, zoom, touch targets and a usable non-WebGL fallback.
5. **Cost and correctness:** actual baseline/candidate task, equivalent content and output, input-to-visible latency, scroll/frame timing, memory, GPU use, context loss/recovery, cleanup and background-tab behavior. Retain failures and loaded build identity.
6. **Transfer:** use original graphics/content and a minimal prototype. Test in the intended application's real workload. Only then promote a pattern into target guidance; novelty and a smooth demo are insufficient.

## Implementation worksheet

For each entry create `studies/<design-id>.md` with:

- Original link, checked date, author, access state, evidence files and source revision where available.
- Observed visual/interaction behavior, unanswered questions, and explicit limits of the inspection.
- Component tree, semantic HTML, state/event diagram, pointer and keyboard behavior.
- Rendering choice (CSS/SVG/Canvas/WebGL), why a simpler alternative was rejected, data model and cleanup.
- Responsive layout rules, fonts/assets and their licenses; no redistribution without permission.
- Motion parameters and reduced-motion design; do not claim guessed values are source facts.
- Implementation sequence and tests, including failure states and restart/recovery.
- Baseline/candidate measurements with unchanged requirements, verdict, rollback and remaining gates.

## Three.js implementation path

Start with an ordinary semantic DOM control. Add Three.js only for an identified scene requirement. Keep authoritative application state outside the render loop; map input to state and render state to the scene. Use a bounded device-pixel ratio, resize observer, requestAnimationFrame lifecycle and explicit disposal of geometry, material and textures. Pause unnecessary animation when hidden, respect reduced motion, and test WebGL context loss/restoration. Keep text, form interaction and essential navigation in accessible DOM overlays or alternatives.

These are implementation-study requirements, not a claim about any particular social example. Validate against the exact Three.js revision and official API before adoption. Compare a CSS/SVG candidate first for flat interface effects; do not turn ordinary UI into an unnecessary GPU workload.

## Tracking and ranking

The machine-readable register retains `evidence_level`, `implementation_status`, `comparison_status`, `license_status` and source access. Missing evidence stays missing. Record a ranking only for a named workload with the baseline, functional parity and measured outputs; do not create an overall best-to-worst list from screenshots.

Current inventory and inspection limits: [Keshav study queue](kshv-study-queue.md). All implementation exercises remain unimplemented until their own verification record says otherwise.

## Evidence collected

- [Source studies](source-studies.md): pinned Gradii and Colors source, with durability and licensing caveats; Three.js official study candidates.
- [Rendered observations](visual-studies.md): Compact and Sieve composition plus proposed original implementation plans. Behavior and performance remain untested.
- [Complete sandbox queue](kshv-study-queue.md): all 18 indexed examples; catalog evidence states are authoritative.

- [All remaining sandbox stills](sandbox-image-studies.md): per-design architecture and test plans, with static versus live evidence distinguished.
- [Deployed viewer source](viewer-source-study.md): verified routing, lazy loading, modal and motion mechanics, plus unresolved acceptance tests.

- [Bencho and BestSaaSWebDesigns](bencho-and-saas.md): additional owner-selected follows, bounded official-source research and original implementation plans.
