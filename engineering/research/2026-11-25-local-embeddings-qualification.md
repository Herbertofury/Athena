# Qualification for local text and artwork retrieval

No candidate was downloaded, executed, or selected for production here. Source IDs: EMB001–EMB005 in the indexed source register.

| Lane | Candidate and source | Use and constraint |
| --- | --- | --- |
| Text baseline | [Athena frozen BM25 and exact-ID fixture](../experiments/retrieval-relevance/judgments.json) | Preserve an independently tested exact-ID route. Model-based recall cannot replace source identity, version, or license checks. |
| Text first trial | [EmbeddingGemma 2](https://gemma.ai/models/embeddinggemma/model-card-v2/) | The 270M text configuration is a useful first trial rather than a speed or quality finding. Start at 256 dimensions and measure relevance and storage against 768 before promoting. |
| Text comparison | [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B), [BGE-M3](https://huggingface.co/BAAI/bge-m3) | Keep Qwen query instructions and BGE dense, lexical or multi-vector choices separate. Larger context is not evidence of better caption matching. |
| Artwork / clips | [EmbeddingGemma 2 multimodal](https://gemma.ai/models/embeddinggemma/multimodal/), [Qwen3-VL-Embedding-2B](https://huggingface.co/Qwen/Qwen3-VL-Embedding-2B) | Test user-authorized local images separately with matched preprocessing and held-out judgments. Qwen's card documents text, image and video, not standalone audio. For EmbeddingGemma 2 use supported BF16 or FP32; do not use FP16 activations. |

Pin source version, weights and projection mode; keep independent index identity
per model revision, prompt, preprocessing, dimension, and normalization policy.
After truncation, re-normalize before cosine ranking. As a planning calculation,
256 float32 components require 1 KiB per vector before metadata and index overhead,
vs 3 KiB at 768. This is not RAM usage or a prediction of total database size.
Test runtime/video compatibility and build/licensing indicators before shipping.

## Actual measured synthetic relevance

`python score.py` in `engineering/experiments/retrieval-relevance` computes a
lexical baseline over 14 authored questions and 14 short factual sample records.
It produced top-3 macro recall **0.821429** and NDCG **0.851237**, with all four
mandatory exact first hits. It retrieved neither target for the two cross-language
questions. This exposes a specific candidate gap; it cannot establish that
embeddings are better for the full catalog. The sample is public and not a user
repository analysis.

Use `python score.py --emit-baseline` for the strict ranking exchange format.
`python score.py --candidate local-ranking.json` compares only the same frozen
question hash and known document IDs. Scores are computed locally; no model,
network or file write is triggered by the evaluator. Never accept a candidate
whose aggregate score masks a wrong exact file or revision. Compare image/audio
lanes with their own rights-reviewed judgments, then measure p95, memory, bytes
on disk, rebuild time, and offline failure handling on the actual target device.
