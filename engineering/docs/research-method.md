# Research that can change an engineering decision

## Evidence levels

- **Primary documented:** official behavior/release statement, not a local performance result.
- **Hypothesis:** a proposed improvement with a reason and falsifiable test.
- **Measured:** exact experiment, workload, environment and raw evidence available.
- **Accepted in a target:** correctness/security/UX and performance gates passed in that target.
- **Rejected / superseded:** preserve why and what replaced it.

Do not convert “documented,” “new,” or “benchmarked elsewhere” into “best for this app.” Comparative recommendations in this atlas are our synthesis, not vendor endorsements.

## Research pass

1. State the decision and constraints.
2. Check current official docs, release notes and breaking changes; then upstream source and original papers when needed.
3. Record version/publication date separately from checked_at.
4. Identify competing approaches, portability limits and costs.
5. Design an equivalent-work experiment, including known-bad correctness cases.
6. Run and preserve results. State uncertainty and what would change the decision.
7. Revisit when a relevant release, workload or constraint changes.

A search snippet is a lead. Read the relevant source section before using a precise claim. A dynamic latest URL can change; record the observed version. Never upgrade a pinned game target just because its documentation landing page moved.

## Freshness

The source register records checked_at (UTC calendar date) and review_after_days. The local checker flags stale entries but does not claim to monitor the internet. Review volatile releases before use; stable principles still need version applicability checks. No automatic recurring research service is implied by this repository.

## Publication hygiene

Keep summaries original and concise. Link sources beside the claim. Publish sanitized evidence only with appropriate authority; exclude user-specific traces, secrets and proprietary assets. A benchmark fixture labeled synthetic must never appear in a performance-success announcement.

## Cross-project adoption gate

Keep unproven methods in the general Atlas. A result is eligible for a target project's recommendation or TODO only after a comparison against **that project's current implementation** demonstrates a meaningful benefit with its correctness, feature, security, durability and UX requirements preserved. A generated microbenchmark, vendor chart or different project's result is a research lead, not sufficient evidence for this gate. Record the actual target baseline revision, workload, environment and complete outputs before making the transfer. This rule is project-independent.

## Additive source registration

Use the [complete source-register layout](source-register-layout.md) for small additions without rewriting historical entries. Both repository validators load the baseline and indexed fragments; external readers must follow the index to obtain the complete register.
