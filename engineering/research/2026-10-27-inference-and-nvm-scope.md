# Screening fast candidates by their actual contract

Reviewed October 27, 2026. Neither prototype was downloaded or executed. These are research candidates, not recommendations or local reproductions.

## GUIFlow [GUIFLOW01]

The [October 26 preprint](https://arxiv.org/html/2610.34959v1) concerns incremental vision-language-model inference, not card rendering. Tables 1–2 label their 3.39×/3.49× headline results as FLOPs ratios. Table 3 separately reports 1.94–2.55× processing-latency ratios, excluding environment execution; online runs can follow different trajectories.

Quality is not uniformly unchanged: GUI-Owl strict success falls from 47.09% to 44.60%, while the Qwen online result improves. Appendix B uses RTX 4090 GPUs and distinguishes missing timing samples from task failures. Therefore “broadly comparable” is not complete-data or no-loss parity.

Atlas decision: retain as an inference research lead only. Require controlled end-to-end measurements, task-level failure retention, memory/cost budgets and a predefined quality floor before any experiment or promotion. A screenshot-reuse result cannot establish faster browser cards, permitted collection coverage or safe autonomous self-modification. No target implementation comparison exists here.

## FlintKV [FLINT01]

The [July 2 preprint](https://arxiv.org/html/2607.02401v1) is newly reviewed here, not newly released today. It targets byte-addressable persistent memory with atomic batches and snapshot iteration. Its reported up-to-75% throughput improvement is against NVM-oriented baselines, not Atlas SQLite on ordinary storage. Section 7 uses a 496 GiB Optane PMEM module and RocksDB db_bench workloads.

A useful methodology detail is that the authors repaired ListDB crash-consistency defects before benchmarking the corrected baseline. This supports comparing equivalent durability guarantees rather than rewarding a fast implementation that loses acknowledged writes. It does not verify those repairs locally.

Atlas decision: hardware-specific research lane. No compatible PMEM testbed has been established for this pass, so do not substitute RAM or ordinary disk and call it a reproduction. Independent crash, snapshot, batch, memory and complete-record tests remain prerequisites.

## Current ranking

Neither candidate is ranked above the current app stack. GUIFlow is outside the present card-rendering/storage workload; FlintKV requires a different persistence substrate. Keep both in Atlas until a relevant, authorized target comparison establishes improvement without losing requirements.
