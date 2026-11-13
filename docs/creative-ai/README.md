# Creative AI tool observatory

Athena's maintained research register for open-source creative tools, AI integrations and models across web design, graphics/photo, music/audio and video. **A shortlist is not a leaderboard.** No entry is a proven improvement to Athena or any other project until equivalent target workloads are compared.

The machine-readable inventory is [creative-ai-tools.json](../../data/creative-ai-tools.json). Each entry separates code from model-weight licensing, source-review date, practical setup, upstream hardware guidance and unresolved limits. Restricted or unverified models remain explicitly marked, even when their UI or inference code is open source. “Open weights” alone does not establish open-source licensing or unrestricted commercial use. Output rights, training-data provenance, likeness/voice consent, fonts and third-party plugins require their own review.

## Choose by task, not novelty

- **Web/UI design:** seek editable component/code output, semantic structure, responsive behavior and accessible keyboard/focus states. A generated screenshot is not a working website. Run generated code only after review in an isolated development environment.
- **Graphics/photo:** prioritize nondestructive edits, masks/layers, color profiles, full-resolution exports and retention of originals. Record the exact model, revision and conditioning assets, not just the host UI name.
- **Music/audio:** distinguish generation, transcription, source separation, voice synthesis and conventional editing. Test timing, stems, clipping, licensing and speaker consent separately.
- **Video:** distinguish generation from timeline editing, restoration, tracking and captions. Validate complete exports, synchronization, codecs, frame rates and recovery, not a few attractive preview frames.

## Maintenance procedure

1. Review official repository, release notes, license files and model cards. Record upstream source URLs and verification date. A repository being reachable does not prove active maintenance; preserve archive/deprecation notices and uncertainty.
2. Check code, weights and each adapter/plugin license independently. Never silently replace a reviewed model with a differently licensed “latest” model. Retain prior entries and last-good revisions when upstream changes or disappears.
3. Before installation, identify OS/runtime, upstream disk/RAM/VRAM guidance, network downloads and any paid services. “CPU supported” is not a usable latency claim. No purchases, account grants or API keys are required by this catalog.
4. Use original or permissively licensed fixtures; keep private work, credentials and account data out of public evidence. Record failures and attempted recovery as well as successful output.
5. Compare candidates with the current target implementation on the same workload and requirements. Record exact commit/model hash, hardware/driver, dependency lock, settings, cold/warm runs, output quality and correctness, latency, memory, full storage/durable writes and restart recovery. Generated microbenchmarks cannot establish target superiority.
6. Promote `source-reviewed` to `runtime-tested` only with retained evidence. Promote to `target-compared` only after equivalent target tests. Recommendations in another project's wiki/TODO require the latter evidence, not this shortlist.

Validate changes with `node scripts/validate_creative_ai_catalog.cjs` and `node --test tests/creative-ai-catalog.test.cjs`. These validate metadata and evidence gates, **not model quality, runtime security or creative output**. No model was executed merely by adding it to this register.

## Bounded comparison record

For each actual experiment retain: baseline and candidate revisions; model/weights license and hash; fixture source/license; OS/CPU/GPU/RAM/VRAM; install lock and disk footprint; exact command/settings; output hashes; complete logs including failures; quality rubric and blinded judgments where appropriate; repeated cold/warm measurements; peak memory; full export/reopen/restart checks; privacy/network behavior; rollback instructions and conclusion. Use `evidence/creative-ai/<date>/<tool-id>/` for future measured evidence, without fabricating empty “passed” reports.
