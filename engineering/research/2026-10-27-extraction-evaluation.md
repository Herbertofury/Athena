# Extraction evaluation without a universal winner · 2026-10-27

Sources [PAPER06], [COL03], [UI06].

WCXB is a May 2026 preprint and public main-text dataset: 2,008 pages across seven types, with development and held-out splits. Authors report that article performance does not predict results on structured pages. Limits include predominantly English static snapshots, article-heavy weighting and LLM-assisted annotations with one final human reviewer. The paper also identifies its author as the author of rs-trafilatura, a highly ranked candidate; independent reproduction matters. No paper prototype or extractor was executed here.

Atlas inference: consider this corpus for text completeness/boilerplate evaluation, not proof of complete galleries, playable media, attachment ordering or authenticated access. Word-overlap scores can miss identity and structural failures. Retain per-type results, unknown states and exact media-role checks. Do not copy leaderboard rankings into project recommendations.

The [Modrinth batch experiment](../experiments/modrinth-batch-lab/README.md) tests an actual Atlas request path with real projections. Fewer requests were verified; mixed network timings remain visible. The [grouped card experiment](../experiments/card-density-lab/README.md) remains an unsuccessful scroll candidate despite its faster initial-rendering proxy.

The memory API draft describes isolated-context estimates, not peak RSS. No browser security settings were weakened to enable measurement, and no memory result is inferred from absent measurements.
