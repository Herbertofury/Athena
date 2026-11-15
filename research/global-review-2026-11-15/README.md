# Global human review: Plannotator-inspired Athena candidate

Reviewed 2026-11-15 UTC. **R&D only, not a shipped Inbox, remote agent integration,
or proof of autonomous intelligence.** Existing native Continuity is the integration
base; do not add an embedded Plannotator app or a competing memory store.

## Verified upstream evidence

- [Official repository](https://github.com/backnotprop/plannotator): local browser review of plans, documents, artifacts and code, plus a nonblocking Inbox that routes feedback to the originating agent session. These are upstream capabilities, not Athena capabilities.
- [Release v0.28.65](https://github.com/backnotprop/plannotator/releases/tag/v0.28.65), published 2026-11-15 00:07:22 UTC: cancellation of not-yet-handed-over replies, linked-machine tags and explicit failure/delivery states. Its reported performance measurements are upstream's, not independently reproduced here. It also removes its experimental SQLite backend. That is **not** evidence that SQLite/rusqlite is wrong for Athena or Modding-Knowledge; compare actual workloads.
- [Pinned package declaration](https://github.com/backnotprop/plannotator/blob/v0.28.65/package.json): Bun monorepo with shared packages and host-specific apps, React/diff/markdown components, agent SDKs and UI dependencies. A whole-stack transplant would bring unnecessary integrations and maintenance surface.
- [MIT license](https://github.com/backnotprop/plannotator/blob/v0.28.65/LICENSE-MIT) and [Apache license](https://github.com/backnotprop/plannotator/blob/v0.28.65/LICENSE-APACHE): root package declares `MIT OR Apache-2.0`. MIT requires retaining its copyright and permission notice in copies/substantial portions. Check individual assets and dependencies separately before reuse. This candidate copies no upstream code or assets.
- [Delivery implementation](https://github.com/backnotprop/plannotator/blob/v0.28.65/packages/core/inbox-delivery-line.ts) and [row view](https://github.com/backnotprop/plannotator/blob/v0.28.65/packages/inbox/rowDelivery.ts): shared state-derived wording distinguishes saved, queued, sending, delivered, uncertain and stopped states; recipient/session identity is meaningful, not cosmetic.
- [Guided review implementation recap](https://github.com/backnotprop/plannotator/blob/v0.28.65/adr/recap-guided-review-20260702-220407.md): chapters reuse real diff annotations, validate changed-file references and retain otherwise-unplaced files. Its recorded limitations include non-durable guide state and navigation gaps; copying the concept does not erase those engineering requirements.

## Athena interpretation

Athena should unite the user's judgment across projects, designs, reusable features,
research, modding knowledge and experiments. Human input is durable evidence with
context, not an unquestionable global rule. Disagreeing evidence stays visible.

| Pattern | Native Athena adaptation | Acceptance evidence still required |
| --- | --- | --- |
| One asynchronous Inbox | Cross-project review agenda over Continuity, with linked evidence and project scope | Actual route, search, keyboard navigation, no dropped items, large-corpus latency |
| Annotate an exact artifact | Pin comments to artifact revision/hash and location; changed content explicitly invalidates old positioning | Renames, replaced files, stale comments, media and diff fixtures |
| Guided review | Group by consequence and unresolved tradeoff, not a summary that hides omissions | Every relevant artifact reachable; uncertain grouping visible |
| Truthful delivery | Separate local save, export, queued, handed-over and acknowledged receipts | Durable outbox, idempotency, crash/retry, wrong-session tests before connectors |
| Take back before handover | Retractable local draft; never promise recall after delivery | Handover race and restart evidence |
| Shared decisions | Source-linked reasoning feeds reusable components, templates and experiments | Scoped application, conflicting evidence, reversible overrides, no silent propagation |

Keep optional review informative: users can defer or dismiss it and continue
unrelated work. A review label is not executable authorization. Do not install hooks,
create grants, launch agents, publish data or import browser sessions as a side effect.

## Tested implementation in this candidate

`review-agenda.mjs` is an original read-only adapter importing Athena's existing
Continuity schema validator, not duplicating storage. It exposes all nonignored
projects with source and revision, distinguishes unreviewed/considered/revisit/
changed-since-review, keeps original review receipts and retains orphan evidence.
Invalid or future-version receipts fail visibly. Inputs are not modified.

Run: `node --test research/global-review-2026-11-15/review-agenda.test.mjs`.
Six synthetic contract tests passed locally on Node; no real user data, provider,
browser UI, persistence transport or runtime integrations were tested. This folder
is not wired into the served application. General app tests and hosted CI were not
run for this isolated candidate. Next: integrate with the existing Continuity route
only after coordinating its active restore work; verify save/restart/quota recovery
and real browser keyboard/scroll behavior. No main runtime manifest change is needed
until that tested native UI integration exists.
