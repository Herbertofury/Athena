# Athena Guidance

Athena's shared repository-alignment and reusable-agent capability. The first native source port owns a versioned engineering core and a local-safe plan/apply/status implementation under **Athena**, not Foundry. This is executable Athena source, not a remote embed. The native `#guidance` library adds shared search and source-attributed reference exports; editing, installed Skill workflows and full Agent-Foundry migration remain incomplete.

- [Repository guidance and explicit adoption](docs/REPOSITORY-GOVERNANCE.md)
- [Shared adapter](templates/AGENTS.repository.md)
- [Product invariants](PRODUCT_INVARIANTS.md)
- [Machine-readable governance release](registry/repository-governance.json)
- [Migration/retirement ledger](../docs/integration/AGENT-GUIDANCE.md)

Validate from the Athena repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python guidance/tools/repository_governance.py check
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s guidance/tests -v
```

## Read-only consumer dependency audit

Before migration, inspect only explicitly selected checkouts:

```sh
python guidance/tools/audit_consumers.py --target /path/to/consumer
```

The audit verifies known lock identities, complete snapshot paths, digest drift and tracked old-source references without changing repositories or emitting file contents. Local instructions remain local. It reports uninspected paths; references can be provenance rather than active dependencies. This is not a deletion approval, automatic fleet discovery, or a migration writer. See [the Noxviola public-checkout receipt](evidence/noxviola-consumer-audit-2026-11-15.json). That one target is not the fleet.

## Provenance and rights

Ported with the repository owner's authorization from Herbertofury/Agent-Foundry commit `87166b5f6a621c61b90bbbfe90835a3752c1c51b`. This port contains its owner-authored governance standards, repository governance implementation, the small standard-library JSON helper and related tests, adapted to Athena identity. Original source inventory and SHA-256 hashes are retained in [the source inventory](registry/agent-foundry-source-inventory.json). Protocol registry is a preserved source snapshot, not a freshly reverified claim.

No repository-wide license is inferred or newly granted. Third-party Skills, assets, archives, installers and bundled source have **not** been imported in this slice. Their rights and provenance require individual review. The source repository and its history remain preserved.

## Reproducible core reference bundle

`python guidance/tools/reference_bundle.py --output /chosen/new-reference.zip` creates a deterministic ZIP of the 16 reviewed canonical documents and an exact-content receipt. Existing outputs are refused. `--verify /chosen/new-reference.zip` verifies against the local checked canonical release, without extraction, execution or installation. Fixed ordering, timestamps, modes and uncompressed bytes make repeat builds identical. Verification rejects unexpected/duplicate/traversal paths, tampered content, changed metadata and oversized input.

This is a portable reference pack, not a signed release, Skill installer, fleet update or complete source archive. It excludes local project instructions, domain Skills/assets and credentials. Digest parity proves integrity relative to the selected local canonical source, not external trust or permission. Component rights still need review; no repository-wide license is inferred. Only explicit repository plan/apply operations can adopt guidance.

## Read-only Skill source preflight

`python guidance/tools/skill_preflight.py /explicit/skill-directory` inventories one selected source without executing its code or treating its instructions as authority. It checks a deliberately limited single-line frontmatter subset, matching name/directory, required description, generated caches and bounded file/byte counts. Links and nonregular files are refused rather than followed. Unsupported YAML needs review; it is not declared invalid for every Skill host. No source discovery, installation, private-content output or propagation occurs.

A structural pass is **not** security, licensing, host compatibility or runtime acceptance. Review filenames before publishing reports. Use a stable checkout: this is not a sandbox for concurrently hostile filesystem mutation. The retained eight-Skill source receipt is an inventory checkpoint only; domain assets and instruction semantics remain unreviewed for migration.

## Legacy adoption transition review

`python guidance/tools/plan_transition.py --target /explicit/consumer-checkout` produces a **read-only proposal**, reusing the consumer audit. It maps all 16 legacy snapshots to Athena paths, checks destination collisions and existing dual locks, and carries uninspected files and legacy-reference digests into review. Even matching unmanaged destinations are preserved for review, not silently adopted. Project-owned instructions and every legacy file remain untouched. A reviewable proposal is not authorization, policy-semantic equivalence or installed-harness acceptance; no apply command is provided. Review report filenames before sharing.

The public Noxviola transition receipt is a real selected-consumer plan, not a completed migration. Existing `repository_governance.py apply` still refuses legacy locks until a separately reviewed transition exists.
