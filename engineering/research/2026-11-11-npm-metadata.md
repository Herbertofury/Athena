# npm metadata scope and card evidence: November 11, 2026

## Decision and scope

Add an isolated offline npm packument gate to Athena's provider research. The inspected #43 source tree had reusable JSON and Markdown helpers but no npm metadata adapter or test family. This contribution complements those helpers without replacing their implementation. It changes no active app, held contribution, deployment or package dependency.

The decision is about truthful package cards, not package selection or installation. A selected version's data must remain separate from package-level presentation metadata. A complete HTTP transfer is not a complete card, README or registry history.

## Primary sources

- NPM11001: pinned npm/registry API reference, upstream commit ae49abf1bac0ec1a3f3f1fceea1cca6fe2dc00e1 dated May 7, 2024.
- NPM11002: the same pinned repository's detailed full/abbreviated metadata contract, including README limits and informational maintainer records.
- NPM11003: npm README presentation guidance, checked November 11, 2026.
- NPM11004: publisher-managed dist-tags, checked November 11, 2026.
- NPM11005: official crawler policy, checked November 11, 2026.
- NPM11006–NPM11008: the three actual anonymous API observations, with separate Accept representations and retained response hashes.

Source dates are not claimed as current package releases. The public source registry links each document and endpoint. Only fixed public metadata was read; no tarball, image, code or linked document was retrieved through these responses.

## Hypothesis and observed comparison

Hypothesis: representation-aware and version-aware normalization prevents plausible-looking but incorrectly attributed cards while preserving source data.

The full and abbreviated packuments contain the same 15 version keys and latest pointer. Their selected 6.0.0 objects agree on every field returned by the abbreviated representation. However, the full object contains card attribution and description fields that the abbreviated response lacks. The root description differs from the selected version's description. The root README contains 6,514 bytes; no individual version object has a README field.

These are actual source differences, not generated examples. Keeping the scopes separate retains both bodies instead of silently joining them. The 36,183-byte full, 9,995-byte abbreviated and 2,167-byte exact-version responses total 48,345 bytes. The exact-version response matches the corresponding full version object but uses an unsupported initial-gate route; the refusal remains evidence. Neither smaller bytes nor an identical nested object establishes performance, safety or support for that route.

## Experiment and validation

[The laboratory](../experiments/npm-metadata-lab/README.md) describes the API, limits and local commands. [The sanitized receipt](../experiments/npm-metadata-lab/public-validation-2026-11-11.json) binds actual replay outcomes to implementation hashes. Synthetic tests cover malformed identities and envelopes, missing/null/empty states, transport failures, bounded parsing, conflict preservation and public receipt isolation. Synthetic access failures must not be described as live observations.

The normalizer retains source responses privately, produces restricted public evidence and leaves all target acceptance gates false. It reuses strict JSON decoding and incomplete source-Markdown projection. It does not issue requests, resolve dependencies or infer author identity from a publisher or maintainer list.

## Alternatives, limits and adoption

An abbreviated-only card loses real README and attribution fields. Root-field fallback misstates an older version in the actual comparison. A generic parser alone cannot establish the request identity or representation. Existing npm tooling remains appropriate for full client operations; this experiment should not grow into a replacement resolver based on these three fixtures.

No benchmark or project integration was performed. Media references remain unfetched and unrendered. Full and abbreviated responses are sequential observations, not an atomic registry snapshot. The documentation's bounded package README does not prove the complete repository README or selected-version body. More route, scoped-package, missing-package, authenticated, caching and rate-limit observations require separate permitted evidence. Do not adopt this in a target application without its baseline comparison and correctness, security and UX checks.

## Recorded local checks

The final module passed 13 synthetic tests and three stored-public-receipt tests. An independent read-only review passed 53 additional adversarial cases and verified the three actual response hashes and replays. The complete engineering suite passed 995 Python tests and 420 Node tests. Root build and tests, five research generators and the two root generation checks passed. The source validator covers 2,422 sources and 289 Markdown files; 135 pre-existing stale-source flags remain visible rather than being refreshed without evidence.

During assembly, the research checker reported the not-yet-written public receipt link. That incomplete-artifact failure was retained; the completed artifact later passed. Parent inspection also required explicit UTF-8 decoding, a distinct null-versus-missing selected-version boundary, selector Unicode checks and retained projection errors. Their regressions are included. The actual zero-image projection limitation remains unresolved by design in this isolated metadata contribution, with the complete source field preserved.

These are local checks, not hosted CI or browser/Rust release acceptance. Source-only paths are ignored by the existing learning workflow. The base integration's prior browser failure remains separate and unresolved; this contribution does not change that harness or rerun its workflow.
