# Rendered observations: Compact and Sieve

Observed on the creator's live portfolio on 2026-11-13. These are screenshot observations, not proof of functional behavior, implementation identity, accessibility or performance. No artwork or source was copied. Primary index: https://www.kshv.me/ . Open named experiments from that index; do not guess unverified detail URLs.

## Compact

Observed: white rounded chat panel, contextual inline tool-status rows, right-aligned short gray user bubbles, bottom composer with circular 94% budget indicator and “6% left before it compacts on its own”. This is a conceptual sample; compaction and sending were not demonstrated.

Proposed original implementation: semantic message list with stable message IDs, independent tool-status records and composer state. Derive budget percentage and remaining label from the same measured value; distinguish unknown/stale capacity from zero. Preserve drafts during any compaction and expose an explicit progress/failure state. Do not imply real token telemetry until a backend supplies it. Provide non-color status labels, polite live-region announcements, keyboard-operable controls and focus preservation. Compare text density, overflow, long tool output, zoom, keyboard traversal and input latency against Athena's current UI before adoption.

## Sieve

Observed: dark rounded review graph, colored paths leading to severity/evidence cards labeled “Proven” versus “Best guess”, compact timeline and fix count. Graph navigation and fix actions were not demonstrated.

Proposed original implementation: evidence records separate severity, confidence, proof links, state and suggested action. Render accessible flat list/table first, with optional SVG graph derived from the same records. A colored connection must not be the only way to identify relationships. Clearly separate verified failures from hypotheses; retain rejected evidence and explain empty/error/loading states. Test keyboard reading order, screen-reader equivalence, contrast, narrow screens, 200% zoom, high record count and graph rendering cost against the flat baseline. No ranking or replacement recommendation until target testing proves value.

## Headroom and remaining sandbox

Headroom's observed mostly empty white panel with a small colorful icon grid/line was insufficient to infer behavior. It and the other 15 sandbox entries remain indexed, not analyzed. Complete state captures and source identity remain required. See [queue](kshv-study-queue.md) and [source studies](source-studies.md).
