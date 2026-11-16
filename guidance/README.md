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

## Adoption exception recovery

Explicit `repository_governance.py apply` stages the complete write set before changing snapshots, commits the adoption lock last, and rolls back committed writes if an I/O exception or handled keyboard interruption occurs. It preserves project-owned instructions and refuses legacy adoption as before. If rollback itself fails or a committed destination changed concurrently, it reports failure and retains a local `.athena-adoption-*` recovery directory containing original bytes and a path index. Keep that directory private and inspect it before any retry; it is not a public evidence artifact.

This is **exception rollback, not crash-atomic or power-loss-durable storage**. Serialize writers and use a stable checkout. Abrupt process termination, hostile filesystem mutation and hardware failure still require backup/recovery procedures. No real consumer was changed to qualify this implementation; injected-failure tests operate only on disposable fixture repositories.

## Inspect policy changes before any transition

`python guidance/tools/review_policy_changes.py --target /explicit/legacy-consumer`
compares the 16 known legacy policy snapshots with the checked Athena release.
Default JSON contains only fixed relative paths, hashes, observed changes and pin
matches. Add `--include-content` to explicitly include local unified text diffs;
these can reveal private local edits, so keep that report local. Reports never
include root/nested project instructions or echo unrecognized lock path names.

This is a review companion, not an apply patch or proof of policy equivalence.
Missing or locally edited files stay explicit and untouched. Unknown lock entries
are counted, not silently accepted. Foreign locks, links/junctions, nonregular
files, invalid UTF-8 and excessive input are refused. Read budgets are 1 MiB per
file and 8 MiB total; no truncation is presented as a complete comparison. LF and
CRLF policy text is compared using the existing portable manifest convention.
Use a stable checkout: concurrent mutations are not a snapshot guarantee. No
network access, fleet scan, source execution, consumer write or retirement
certification occurs. Existing transition/adoption restrictions remain unchanged.

## Recoverable local Git history checkpoint

`python guidance/tools/history_bundle.py --source /explicit/repository --output /outside/source/new.bundle`
creates a local bundle of every locally available ref plus HEAD, restores it into
an independent temporary bare repository, checks complete object connectivity,
and compares exact refs/HEAD before publishing the new bundle. Source files and
refs are not modified. No checkout, source execution, remote refresh or upload
occurs; lazy fetching is disabled. Shallow history, replacements and grafts are
rejected. Existing outputs are never overwritten; the verified file is published
with an exclusive hard link, so the output filesystem must support hard links.
POSIX mode 0600 is requested; this is not a Windows ACL guarantee.

Keep the bundle private until complete history rights and private-data review.
The summary emits only head/hash/count/verification flags, not names or content.
Uncommitted files, reflogs, unreachable objects, LFS objects, submodule repositories,
wiki, releases and external dependencies remain separate gates. A local recovery
check is neither an off-machine durable backup nor repository-deletion approval.
Temporary restore files are removed after the check; the final bundle is retained.
Use a stable source. Ref changes during capture are rejected, but concurrent
history/working-tree changes are not a full filesystem snapshot guarantee.

Git bundle refs retain object IDs, not symbolic alias configuration. The isolated
restore uses a detached HEAD; branch checkout and symbolic remote-HEAD settings
need separate restoration if required. This is Git object/history recovery, not
a complete clone configuration backup.

## Self-contained history recovery capsule

`history_capsule.py` adds the metadata absent from a plain Git bundle: exact local
ref object IDs, symbolic aliases, attached/detached HEAD and object format. It
stores those with the bundle in a private ZIP and independently verifies recovery
before exclusively publishing the new file. It reuses `history_bundle.py` rather
than changing the earlier bundle or any source repository.

```sh
python guidance/tools/history_capsule.py create --source /selected/repo --output /outside/source/new-capsule.zip
python guidance/tools/history_capsule.py verify /selected/capsule.zip
python guidance/tools/history_capsule.py restore /selected/capsule.zip --destination /new/empty-path.git
```

Verification needs no original checkout. Restore creates a **new bare repository**,
never checks out or executes source, refuses existing destinations, restores exact
symbolic targets/HEAD, checks all object connectivity and compares metadata.
A failed restore can leave a new partial destination for inspection; do not treat
it as verified or overwrite an existing repository. The capsule is never changed.
POSIX destination mode 0700 is requested, not a Windows ACL guarantee.

The ZIP accepts exactly two stored members; encryption, unexpected/duplicate
members, wrong hashes, unsafe refs and alias cycles are rejected. Budgets are
32 MiB bundle, 1 MiB manifest and 10,000 refs. Larger collections need an explicit
larger-capacity design, not truncation. Digests detect internal inconsistency, not
independent authenticity: an adversary can rewrite both manifest and payload.
Do not trust or execute a recovered source merely because verification passes.

Names and full historical content are inside the private capsule. Keep it private
until rights and sensitive-data review; default stdout reports counts/hash only.
Git LFS content, submodule repositories, working changes, reflogs, unreachable
objects, remote freshness, wiki, release assets and consumer dependencies remain
separate gates. This improves history recovery, **not deletion readiness**.

## Athena-local agent corrections

[Root agent instructions](../AGENTS.md), the [correction workflow](docs/AGENT-CORRECTION.md), and the [starter verification map](registry/verification-map.json) connect existing standards to executable checks. The map is validated by the guidance test suite; it records no execution status and does not change the pinned shared release or consumer instructions.
