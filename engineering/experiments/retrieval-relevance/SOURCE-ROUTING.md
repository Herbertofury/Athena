# Held-out query routing qualification

The main synthetic BM25 fixture is unchanged. This separate gate distinguishes
a correct exact source hit, an exact-source request that must return no result,
and a descriptive match with the original display title and source link.
The reported candidate is the verified [Memories #7 shared matcher](https://github.com/Herbertofury/memories/pull/7) running on its public metadata at the pinned commit. The two neighboring X IDs in this fixture are synthetic absent controls over that catalog; this does not assert whether those URLs exist on X. These IDs exceed JavaScript's safe number range and must stay strings.

`python gate_source_route.py memories-source-routing-receipt.json` checks the
retained observed result. To regenerate it from the exact local source bytes:
`node produce_memories_source_route.mjs EXACT_MEMORIES_CHECKOUT`. The generator
refuses other source/catalog bytes. It needs no model, media, private data or
network. A later Model UI must produce its own observed response receipt; a
good semantic score cannot waive a wrong exact result, an implicit fallback,
or a source link or name mismatch. This gate is not evidence of model or
production Athena integration.
