# HD2 Arsenal: workflow evidence and adoption lab

Reviewed 2026-11-17. [Official product](https://rsnl.gg/), [documentation](https://docs.rsnl.gg/), [release repository](https://github.com/Orbit-Studios/hd2arsenal-release).

## Scope and honest completion boundary

This pass adds Arsenal to Athena's actual searchable Software discovery database and provides fourteen source-attributed engineering studies with executable integrity checks. Read `study.json` for each documented observation, proposed application and concrete acceptance test.

**This is documentation-level research, not recovered application source or a completed installation review.** The release README explicitly states development is private. GitHub's automatically named “Source code” archive therefore must not be represented as the application source. The official installer download was restricted in this session; no binary was downloaded, unpacked or run. The existing installed copy was not accessible. Installer SHA in the study is a publisher-reported value, not a locally verified hash. Application redistribution/reuse terms remain unknown. No proprietary code or assets are included.

Documentation pages were fetched as HTML and read as text. The study records source URLs, retrieval date, byte lengths and SHA-256 for those bounded snapshots. Upstream HTML is retained only in the working research cache, not republished. A later page change is evidence drift, not permission to rewrite the original observation silently. The official website lists 0.37.2; inspected documentation identifies its scope as 0.36 and later. Neither proves identical behavior across builds or platforms.

## What Athena and the managers should learn

The highest-value candidates are deployment truth separate from browsing state; immutable/shared content with profile-scoped choices; visual state with explicit unknown/error explanations; stable list navigation; nonblocking conflict evidence; and resumable, provenance-preserving acquisition. These fit Athena, MO2R, Mod Hunter, Modding-Knowledge and Noxviola's relevant project-follow experiences. They are design candidates, not changes already shipped in those products.

Do not copy unsafe or surprising behavior just to claim parity. The studies explicitly propose better recovery, explicit batch choices, provider-neutral identities and accessible state indicators. Keep the user's default deep-black visual design, media-first organization, progress transparency and Rust-first new-core preference. Do not replace existing implementations merely because a reference differs. No active Mod Hunter release files are changed here.

## Teaching exercise: state is not a color

Use synthetic, owned files in a disposable fixture, never a live game directory.

1. Model three records: library artifact/version, editable profile revision, and actual deployed snapshot. Show their identifiers side by side.
2. Create two profiles referencing one artifact with different option choices. Change only a presentation label; deployment equality must not depend on the label.
3. Switch profiles without deployment. Describe precisely why the edited view and game state differ.
4. Prepare a deployment plan identifying every destination, prior owner/hash, winning source and recovery action. Preview without writing.
5. Inject interruption before write, after partial write, before journal commit and after commit. Unknown/partial state must remain visible. Never mark success from intent alone.
6. Introduce an external edit and an unmanaged file. Reconciliation must detect the edit and preserve the unmanaged file during rollback.
7. Test repeated launch/deploy clicks, cancellation and process restart. Actions need durable identity and idempotent retry semantics.
8. Add color, thumbnail, text label and accessible announcement only after state correctness is established. Benchmark rendering separately from correctness.

Record fixture digest, adapter version, profile revision, observed results, failures, elapsed time and screenshots. This exercise is an acceptance design, not an implemented deployer or a successful runtime test.

## Full installation continuation checklist

- Obtain the actual authorized installed directory or official package through an available supported route. Respect the current restricted-download result; do not substitute a mirror to evade it.
- Record product/build/OS, package digest, signature status and license/EULA without exposing user paths, tokens or account data.
- Inventory files, package metadata, bundled runtimes/libraries, notices, storage schema and update manifests. Distinguish observed code from inferred architecture.
- Inspect scripts/config and readable bundled code where permitted, mapping every claim to file/hash/range. Do not label bundled/minified code as original source. No source reuse until rights are known.
- Run onboarding only in an isolated test profile with owned fixtures; inventory actual filesystem effects, URI handlers, services/startup entries and outbound endpoints before enabling integrations.
- Verify import cancellation, archive safety, duplicate inputs, version migration, profile isolation, option identity, interrupted deploy, purge ownership, updater failure, uninstall preservation and restore.
- Inspect every visible UI region, keyboard/reduced-motion/accessibility states, actual progress and large-library stability. Record failures and remaining coverage, not only screenshots.
- Evaluate accounts/lobby separately; no login, credential extraction, paid service or external sharing is implied by this research artifact.

Full install/code/runtime research remains open. Features marked `proposed-not-implemented` must not be promoted to delivered until implementation and acceptance evidence exist.

## Validate

`python3 tests/arsenal_study_test.py`

`npm run test:software`

Packaging requires the reviewed runtime catalog hash in `config/runtime-public-preview.json` to match the generated database. The public Wiki only changes after the appropriate publication workflow; generated local pages are not proof of deployment.
