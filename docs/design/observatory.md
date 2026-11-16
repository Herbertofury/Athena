# Athena Observatory design foundation

This change upgrades the actual shared desktop/web shell and home route, not a standalone mockup. It preserves route ownership, local progress, settings, native workspaces, lesson dialogs and the original owner-provided mascot.

## Intent

Athena should feel like an exploratory instrument: editorial typography, purposeful depth, tactile navigation, warm mineral accents and a quiet working surface. The home orbit links connect directly to learning, research and authoring. The pathway reminder is derived from existing learning state. Six launch cards make the existing capabilities discoverable, without inventing metrics or representing pending work as complete.

## Reference research integration

The requested reference is The Explainer and its interactive demonstrations. Current researcher observations identify Liquid Glass and Exploded View as valuable interaction patterns: inspectable layers, coherent materials, live content, reversible interaction and tangible controls. These are design lessons, not source-code claims. No reference source, third-party asset or unverified license is imported by this change.

HTML-in-Canvas must be progressive enhancement. Ordinary HTML remains the interaction and accessibility baseline. This foundation deliberately does not pretend that CSS glow equals refractive live-DOM rendering. Actual experimental rendering, browser capability validation and useful layered inspectors remain subsequent engineering work, coordinated with the reference research worker.

## Accessibility and resource behavior

- Semantic links and buttons work without experimental browser APIs.
- No continuous animation loop, shader, network dependency or additional JavaScript event listener.
- Dark/light themes reuse the saved preference and shared semantic colors.
- Reduced motion removes hover displacement; forced colors removes decorative orbit graphics.
- Original mascot remains uncropped, with its accessible description.
- Mobile breakpoint collapses the composition and launch grid; narrow layouts retain full route access.

## Verification boundaries

The 54 existing UI, accessibility, route and mascot tests passed during implementation. New tests exercise actual home navigation structure, next-lesson opening and retained theme state. These are DOM tests, not visual browser or Windows certification. Real browser screenshot/layout acceptance and native Windows smoke tests remain required before declaring this design visually validated. No comprehensive Athena parity or completion claim is made.
