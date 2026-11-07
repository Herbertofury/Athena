# Additive source-register layout

Reviewed 2026-10-28. Existing `data/sources.json` bytes remain unchanged. New citations may be added as small JSON-list files in `data/sources.d/`; `data/source-index.json` enumerates the complete set in deterministic order.

The research checker and Explorer builder share `scripts/source_registry.py`. It concatenates every baseline row and every addition without overriding or filtering records. Duplicate IDs across files, contradictory JSON keys, non-finite values, non-list fragments, mismatched indexes and paths escaping the repository fail closed. Existing source-field, date, URL, evidence and stale-review checks remain in place.

For Python callers, use `load_sources(repository_root)`. Other consumers must read every file listed by the versioned index. A consumer reading only the legacy JSON sees the preserved baseline, not future additions. No uninspected external consumer is claimed compatible.

This avoids rewriting the full catalog for one new citation and reduces concurrent-edit conflicts. It is a maintenance/publication improvement, not evidence that application runtime or collection has become faster. Full historical data remains available and raw test evidence is retained.

Add a fragment and update the small index together; do not suppress duplicate IDs or omit old records to get checks passing. Run the repository source, Explorer and regression checks before publishing.
