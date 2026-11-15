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
