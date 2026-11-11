# npm package metadata adapter

[Offline experiment](../../experiments/npm-metadata-lab/README.md) · [Dated research](../../research/2026-11-11-npm-metadata.md) · [Actual capture receipt](../../experiments/npm-metadata-lab/public-validation-2026-11-11.json)

## Problem and existing foundation

A package card needs the selected version's description and attribution, plus an honestly scoped README. Package-level fields, individual-version fields and an installation-oriented representation are not interchangeable. The current Athena extraction lab already preserves source Markdown and rejects duplicate JSON keys. Reuse those helpers; the new isolated gate supplies npm-specific identity, representation and completeness rules. No runtime, dependency lockfile or target application is changed.

The official [metadata contract](https://github.com/npm/registry/blob/ae49abf1bac0ec1a3f3f1fceea1cca6fe2dc00e1/docs/responses/package-metadata.md) documents full JSON and the smaller application/vnd.npm.install-v1+json representation. Full package responses include hoisted package fields and a version map. Abbreviated responses focus on installation metadata and omit many card fields. A missing abbreviated README is not an empty or deleted README.

## Identity and body provenance

- Choose a package plus an exact version or explicit dist-tag. Do not rank versions, silently choose latest or interpret a dependency declaration as a solved graph.
- Keep the returned package name, selected map key and nested version identity aligned. Dist-tag resolution is an observed publisher-managed pointer. Preserve changes rather than overwrite their evidence.
- Keep package fields and selected-version fields in separate scopes. A newer package description is not a fallback for an older version.
- The detailed npm contract describes the root README as a size-limited field from the most recently published version. It does not prove correspondence to the chosen version or even the current latest tag. Preserve that uncertainty, including when the API body is fully received.
- Author, contributors, maintainers and publisher metadata have different roles. These are source claims, not verified ownership or permission evidence.

The gate retains exact README Markdown privately and uses the existing incomplete projection to identify some media references. It does not render or fetch them. Source text may contain untrusted links or markup and is not safe HTML simply because it was parsed. Missing, null, empty, malformed and present fields remain distinct. An unavailable response is not evidence of package deletion.

## Actual bounded comparison

Three anonymous registry API requests captured 48,345 bytes on November 11, 2026. The full and abbreviated is-number packuments both describe 15 versions and point latest to 7.0.0. The full response is 36,183 bytes; the abbreviated response is 9,995 bytes. This byte-count observation is not an end-to-end performance benchmark.

The selected 6.0.0 version has a different description from the package-level description. The full root README contains 6,514 UTF-8 bytes and four inline image markers, while no version object supplies a README. The abbreviated version omits description, author and license fields present in the full representation. These observations demonstrate why root fallback and representation-blind completeness would be incorrect.

A third documented exact-version route returns 2,167 bytes and matches the full packument's 6.0.0 object. The initial gate intentionally handles packuments only, so the standalone route remains a retained unsupported-route observation. Route support is explicit, not inferred from valid JSON. Raw third-party responses stay outside the repository; public evidence contains hashes, counts and state labels.

## Access and acceptance

The [public registry reference](https://github.com/npm/registry/blob/ae49abf1bac0ec1a3f3f1fceea1cca6fe2dc00e1/docs/REGISTRY-API.md) and [crawler policy](https://docs.npmjs.com/policies/crawlers/) support the chosen metadata route. No account, authentication, grant, paid API, npm website scraping or registry-wide crawling was used. The offline gate itself performs no requests. It does not automatically retry or follow redirects and links.

This work establishes only bounded, selected-package metadata interpretation. It does not establish package safety, archive integrity, signature verification, installation, dependency resolution, source authenticity, media playback, full README coverage, complete registry history, reuse rights or compatibility with an application or mod. Those require separate work and authorization. No target adoption recommendation follows without a comparison against that target's actual implementation.

## Alternatives and remaining work

Using abbreviated metadata alone saves observed transfer bytes but loses card content. Using package-level fields for every version appears convenient but fails the real older-version comparison. A mature npm client remains the baseline for package resolution and installation; rebuilding that behavior in a metadata card adapter is out of scope. Generic JSON or Markdown parsing remains reusable, but does not supply npm-specific scope rules.

A later authorized collector would need response negotiation, rate control, cache/conditional-response handling and explicit support for scoped packages, registry variants and authenticated content. Synthetic defensive tests cover some parser boundaries; they are not live evidence for those services or access conditions. Keep failures and unknown states visible until actual permitted observations establish more.
