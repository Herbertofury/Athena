# Schema-valid is not collection-complete

Reviewed October 27, 2026. Primary-source screening [PAD01], not a local model evaluation.

The [October 22 preprint](https://arxiv.org/html/2610.30997v1) studies string-list extraction with eight open-weight models and 558 documents. A displayed minimum increases over-counting from 34.5% to 55.4%; source-text matches can still be irrelevant additions. Allowing fewer items mitigates padding on average but sacrifices recall. Scope limits include one grammar engine, selected datasets, matcher uncertainty and no closed models. Multi-field media records were not tested.

## Atlas decision

Keep this as a model-extraction risk candidate, not a diagnosis of the current deterministic adapters. No inference service, author prototype or private corpus was used. The linked source repository revision was recorded as `0cf064a1f929921ad14836e9efe5f1bb9f79f0cd`; no prototype was downloaded or executed.

For a future permitted extraction experiment, compare exact item membership, omissions, duplicates, media roles and provenance against a separately reviewed answer set. Treat schema validity, grounding and completeness as independent checks. Do not force a gallery to a desired count or label a budget-truncated collection complete. A genuine domain minimum is a different contract from inventing missing source items.

No performance ranking, model superiority, target-project improvement or default change is established. This remains in Atlas; other projects receive no recommendation from this screening.

[Existing collection contract](../docs/adapters/contract.md) · [Source and raw experiment evidence](../docs/experiment-evidence.md)
