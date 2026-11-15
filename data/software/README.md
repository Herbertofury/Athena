# Athena software database

These are canonical researched application records used by Athena's main **Software discovery** workspace. The generated public database is `dist/workspaces/software/catalog.json`; do not edit that output directly.

| File | Responsibility |
| --- | --- |
| `systems.json` | System, hardware, files, recovery, security, networking and remote access |
| `creative.json` | Creative media, productivity, accessibility, science and specialist work |
| `development.json` | Development, automation, browsers, local AI, gaming and modding |
| `*-expanded.json` | Additional reviewed application batches; automatically loaded and deduplicated with the original partitions |
| `*-recipes.json` | Task-specific comparisons with explicit selection criteria and tradeoffs |
| `legacy-*-enrichment.json` | Dated metadata updates that preserve every original research field |
| `coverage-priorities.json` | Explicit gaps and evidence required for the next research batches |
| `taxonomy.json` | Canonical task categories, readable labels, explicit placements and backward-compatible aliases |
| `schema.json` | Machine-readable record structure and enumerated values |

The builder imports the original Windows PC catalog without editing it. It also exposes the complete original cleanup and creative-AI research records as a separately counted, searchable research library. Names, official identities, provenance and generated counts are validated before publication.

## Add or refresh an application

Read the relevant official sources, record their review dates and limit `sources[].supports` to facts those sources actually establish. Known license/pricing classifications, platforms and download fields require corresponding source annotations. Use `pricing_notes` for source-only distributions, paid installers or plan qualifications that a single price-model label cannot express. Fill every required field. Use `unknown` for unresolved pricing/license classification and `unverified` for unsupported maintenance status. Do not infer OS compatibility from the project language or assume an open-source license guarantees free prebuilt binaries.

Use a stable product ID. Preserve known prior names in `aliases` so renames remain searchable. The product's repository URL or exact official project URL is its canonical deduplication key. `alternatives` contains product names or known IDs; the builder resolves existing records into internal links and keeps unresolved alternatives visibly separate. A parent project and a wrapper are distinct records only when they have distinct products and capabilities.

Each task recipe needs a concrete description and at least two real catalog targets. Pick labels must describe a task-specific role. Every pick needs a reason and a tradeoff. Do not make an unsupported universal-best, speed, safety or measured reliability claim.

```sh
npm run build
npm run test:software
npm run test:software:browser
python3 scripts/check_software_links.py --output software-link-report.json
python3 scripts/report_software_coverage.py --output software-refresh-report.json
```

Review the generated app data and Wiki, update the explicit public runtime allowlist for reviewed runtime changes, and retain verification evidence. The existing GitHub Wiki workflow publishes managed pages after merge; a local Wiki directory alone does not prove the live Wiki changed.

See [selection methodology](../../wiki/Software-Methodology.md) and [expansion evidence](../../research/software-expansion-2026-11-14/README.md).
