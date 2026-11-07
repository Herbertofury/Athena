# Dependency advisory delta, 2026-10-29

Checked 18:08 UTC against the official RustSec database. The database advanced from `40f5be6fb12ed93fc591bf4ab23b7d793b3f2239` to `ee1a49a2769a24a596afc1c20cb33748d2769586`. This review covers five newly added advisories, not every software ecosystem.

## Applicability before action

The three pinned Atlas lockfiles contain none of `juniper`, `juniper_hyper`, `juniper_warp` or `libz-sys`. The application and compression locks do contain `cc` 1.10.0, but that alone does not make the libz-sys build-script advisory applicable. Do not infer secret leakage merely from the compiler-helper version.

The existing guarded audit runner checked all three locks with a clean, newly fetched, independently pinned database and the previously verified audit binary. Raw results, input hashes and completion status are [retained here](../experiments/dependency-audit-lab/guarded-run-2026-10-29T1808.json). All three runs report zero known matches, no ignored advisories and no warnings. This does not certify source code, every optional dependency, system packages, private projects or future versions. No credentials were inspected or rotated, caches removed, dependencies upgraded or other projects changed.

## New findings

- Juniper before 0.17.2 has document-depth/fragment-recursion and amplified validation/execution resource-use issues. The patched release adds bounded parsing/expanded-field work and repairs repeated traversal. These are scope-specific upstream fixes, not locally reproduced performance results. Sources: [RSEC0416], [RSEC0417].
- `juniper_hyper` before 0.10.1 and `juniper_warp` before 0.9.1 can collect unbounded HTTP request bodies. Their patched defaults cap bodies at 2 MiB and return an oversize response. Atlas already has separate body-limit and timeout regression evidence; these advisories do not establish Atlas exposure. Sources: [RSEC0415], [RSEC0419].
- `libz-sys` 1.0.21 through 1.1.30 can write build-environment values into build output on affected Unix probe paths when paired with `cc` 1.6.0 or later. Version 1.1.31 removes the command-debug logging. Updating does not erase previously recorded values. Any cache removal or secret rotation requires separately established exposure and authorization; neither is needed by this scoped lockfile result. Source: [RSEC0418].

No blanket stack ranking follows. Keep complete-data correctness, resource limits and safe logging as independent acceptance gates; never label a clean known-advisory scan a guarantee of safety.
