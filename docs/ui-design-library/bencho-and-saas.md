# Bencho and BestSaaSWebDesigns: owner-selected research sources

Checked 2026-11-13. These are saved research follows, not an account-level social follow, subscription, endorsement of every entry or a claim of target improvement. No paid plan, MCP connection, persistent grant or asset reuse was created.

## Bencho

Official index: https://bencho.dev/ . A bounded read found167 block links; this is index coverage, not167 audits. Live homepage observation: a restrained monochrome hero with ample whitespace, centered primary action, compact navigation/search, rounded gesture-category filters and interactive component tiles. The page distinguishes Pro offerings. Only this composition was observed; interaction correctness and performance were not measured.

Official detail pages read:
- https://bencho.dev/blocks/resizable-panels describes neighboring panes that redistribute width and collapse at boundaries.
- https://bencho.dev/blocks/form-error describes input error feedback with an explanatory expansion.
- https://bencho.dev/blocks/context-meter describes context-usage visualization and compaction feedback.

Those are publisher descriptions, not verified demonstrations. Pricing distinguishes free selections from paid source/MCP access: https://bencho.dev/pricing . The licence page exists at https://bencho.dev/licence but its full terms were not exposed by text extraction. Public client FAQ text distinguishes product use from redistributing a component library; image reuse must not be assumed. Do not copy paid code, sounds, pictures or templates into Athena. Review complete applicable terms before any reuse; original implementation plans below require no copied assets. Unrelated GitHub projects named bencho are not its official source repository.

### Proposed original implementation studies

**Gallery navigation:** model each entry as identity, primary source, gesture category, preview access state, evidence level, rights and review date. Use actual links and a plain list fallback. Keep filters URL-addressable and keyboard operable; announce result counts without moving focus. Lazy-mount only bounded visible previews, stop offscreen work and preserve layout dimensions while loading. Tests: deep links, Back/Forward, empty/error results, hundreds of records, touch alternatives to hover and filter correctness. Autoplay remains off regardless of reference behavior.

**Resizable panels:** represent pane constraints separately from current sizes. Normalize available width, clamp both sides and define collapse/restore thresholds without oscillation. Expose separator role, direction and keyboard adjustment; retain user sizes only after a durable successful write. Test container shrink, all panes at minimum, nested scroll, zoom, RTL, pointer cancellation and restore after reload. Compare input latency and content visibility to Athena's current layout; a smooth drag alone does not justify replacement.

**Form errors:** preserve entered text and bind the error text through semantic description relationships. Separate client parsing, pending submission, server rejection and success. Do not use shake or red as the sole signal; reduced-motion disables decorative movement. Tests: IME composition, autofill, delayed validation, repeated submit, focus order and error recovery. Never exercise a real submission endpoint just to inspect a visual sample.

**Context meter:** use one canonical measured accounting model for all segments and totals, including unknown/stale data. Separate an optional visual compaction transition from actual backend completion. Preserve drafts/history and report failure without falsely reducing the displayed usage. Compare information comprehension and density against text plus a simple bar. Test zero/full/overfull, missing categories, rapid updates, screen-reader summary and reduced motion. No sound without explicit user action.

## BestSaaSWebDesigns

Official collection: https://bestsaaswebdesigns.com/ . User-selected social source: https://x.com/bestsaasdesigns . X returned403 in this pass; no post inventory or account follow is claimed.

The collection currently advertises443+ SaaS sites, section-specific browsing, category/style/stack filters, mobile captures and written reviews. These are publisher claims and metadata, not independently validated conversion or performance results. Sponsored entries are explicitly labeled. The site's footer states screenshots, logos and brand assets belong to their respective owners. Keep links and analytical notes rather than rehosting assets; verify each original site before accepting freshness or inferred implementation. No MCP integration was activated.

### Proposed use in Athena

Treat the collection as a discovery index, not the author of the underlying designs. Store curator URL separately from original-site URL, capture date, viewport, section type and sponsor status. Record inferred stack separately from source-confirmed dependencies. Compare equivalent sections and tasks: a landing-page hero cannot prove a dense application's navigation is better.

A review should identify information hierarchy, CTA sequence, content density, responsive ordering, keyboard reading order and loading behavior. Create original wireframes before borrowing visual motifs. For every candidate, test the actual target's retrieval/task success, time to useful content, mobile/zoom behavior and memory/input latency. Preserve unsuccessful comparisons, and do not label a design “best” merely because the curator uses that word.

## Next evidence

Bencho detail-page live states, complete reuse terms and target measurements remain open. BestSaaS needs a selected original-site inspection before any per-site implementation study. Broad scraping, exporting paid content and enrolling MCP services are outside this bounded reference-registration pass.
