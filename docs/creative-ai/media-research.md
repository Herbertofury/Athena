# Athena creative AI: music, audio and video candidates

Reviewed 2026-11-13 using public upstream repositories, model cards and documentation. **Research only: no installs, inference, hardware benchmarks, license acceptance, grants or purchases.** Rankings below are evaluation priorities, not measured winners. Repository availability, documentation and release announcements are not proof of active maintenance or native acceptance. Pin code revision, model revision and license before implementation.

## Priority candidates

### ACE-Step 1.5: local music generation
- Code: MIT. Official base and bundled turbo model cards identify MIT weights. Do not confuse the earlier ACE-Step repository's Apache license with 1.5.
- Supports text-conditioned songs, references, covers and repainting. Base variants support extraction/completion features absent from turbo/SFT variants.
- Upstream describes Windows/Linux CUDA, Windows ROCm and Apple Silicon MLX launch paths. Its GPU table starts with 2B turbo, no LM, INT8/offload at ≤6 GB; XL requires ≥12 GB with offload/quantization or ≥20 GB without offload. These are upstream requirements, not measurements here.
- Current README includes April 2026 XL announcement and profiling script. Exact latest commit/CI health not established.
- Evaluate first for local songwriting, loops and owned-media transformations. Check lyric intelligibility, structure, reference leakage, seam quality and reproducibility. Do not repeat superiority or seconds-per-song marketing as established performance.
- Sources: [code and setup](https://github.com/ace-step/ACE-Step-1.5), [MIT base model](https://huggingface.co/ACE-Step/acestep-v15-base), [bundled turbo weights](https://huggingface.co/ACE-Step/Ace-Step1.5/tree/main/acestep-v15-turbo).

### Whisper + faster-whisper: transcription/subtitles
- Whisper explicitly licenses code and weights MIT; faster-whisper implementation is MIT. Alternate converted/distilled checkpoints still need their own model record.
- Whisper upstream VRAM estimates: tiny/base ~1 GB, small ~2 GB, medium ~5 GB, large ~10 GB, turbo ~6 GB. Transcription is not music generation or video editing.
- faster-whisper offers CPU INT8 and NVIDIA inference; current requirements specify Python ≥3.9, CUDA 12/cuBLAS and cuDNN 9 for GPU. PyAV bundles FFmpeg libraries. Pin CTranslate2 compatibility.
- Benchmark claims in the upstream table are source-reported, not Athena results. Consume the returned segments generator fully when timing: inference is lazy.
- Evaluate subtitle word error, timing drift, silence hallucination, language handling, CPU/RAM and VRAM on user-relevant clips. Review subtitles before publishing.
- Sources: [Whisper](https://github.com/openai/whisper), [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [implementation license](https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE).

### Wan2.2 TI2V-5B: local video generation
- Repository and exact TI2V-5B model card identify Apache-2.0. Record each other checkpoint separately.
- Text/image-to-video candidate, not a timeline editor. Official offload command requires at least 24 GB VRAM; larger 80 GB configuration can omit offload flags. 720p mode uses 1280×704 or portrait transpose.
- Official repository includes inference scripts, task-specific dependencies and tests. Fresh commit/CI activity was not independently audited.
- Evaluate temporal coherence, identity consistency, prompt adherence, real latency, memory, output decode correctness and failure recovery. Do not present published aesthetic rankings as measured superiority.
- Sources: [repository/setup](https://github.com/Wan-Video/Wan2.2), [exact model card](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B).

### Kdenlive: real editing host with transcription integration
- Useful comparator/host rather than another generation model. Official documentation describes VOSK and Whisper speech-to-text configuration and subtitle workflows.
- Keep editor licensing, transcription engine licensing and downloaded model licensing separate. Exact packaged license/dependency inventory remains to verify before bundling.
- Current public manual identifies 26.08, evidence of maintained documentation, not verification of local package or native behavior.
- Test complete edit/export workflow, subtitle timing, proxy media, recoverability, audio sync and project reopen, not just successful model startup.
- Sources: [speech-to-text](https://docs.kdenlive.org/en/effects_and_filters/speech_to_text.html), [plugin setup](https://docs.kdenlive.org/en/getting_started/configure_kdenlive/configuration_plugins.html).

## Restricted or mixed-license research lane

### AudioCraft / MusicGen / AudioGen
- Code MIT; model weights **CC-BY-NC 4.0**. Label noncommercial-weight research, not unrestricted open-source production.
- Useful text/melody-conditioned music and audio baseline. Model choice and environment requirements must be pinned; no local setup or performance validated.
- Inspect current dependency/maintenance status before allocating benchmark time. Compare controllability and output quality, not age or popularity.
- Source: [official repository and explicit code/weight licenses](https://github.com/facebookresearch/audiocraft).

### Stable Audio Open 1.0
- `stable-audio-tools` code MIT; model card lists **stable-audio-community** license and gated acceptance/data sharing. This is not equivalent to unrestricted MIT weights.
- Model card specifies up to 47 seconds stereo 44.1 kHz, with stable-audio-tools or Diffusers. Hardware minimum not established in this pass.
- Upstream says sound effects/field recordings are stronger than music; realistic vocals unsupported, English descriptions favored. Suitable for sound-design experiments, not the default full-song candidate.
- Do not accept gated terms or download on behalf of user without appropriate workflow; commercial suitability depends on exact current terms.
- Sources: [model/limitations/access](https://huggingface.co/stabilityai/stable-audio-open-1.0), [code license](https://github.com/Stability-AI/stable-audio-tools/blob/main/LICENSE).

### LTX-2 family / LTX Desktop
- LTX-2 code Apache-2.0; separate `LICENSE-2` and `LICENSE-2_x` govern models. The latter defines commercial/noncommercial purposes and entity thresholds. Treat as custom-license/open-weight until exact selected revision is reviewed.
- Current official quickstart references LTX-2.5 audio-video generation and roughly 66 GiB of model assets; gated download requires accepting model terms. No acceptance performed.
- Distinguish open local models from Desktop's API-only Pro variants. The Desktop documentation describes local NVIDIA ≥24 GB VRAM (32 GB recommended); this is not a universal minimum for every LTX pipeline.
- Strong candidate for synchronized audio/video evaluation, not automatically a replacement for an editor. Pin family/version: old LTX-Video OpenRAIL discussions cannot classify all LTX-2 weights.
- Sources: [code/setup](https://github.com/Lightricks/LTX-2), [model license](https://github.com/Lightricks/LTX-2/blob/main/LICENSE-2_x), [Desktop scope/hardware](https://github.com/Lightricks/LTX-Desktop).

## Maintenance and packaging traps

### Demucs
- MIT source-separation baseline. Meta repository explicitly archived Jan 1, 2025. README points to author fork but says it is not actively maintained, with important bug fixes only.
- Keep as reproducible legacy comparator, not a new actively maintained flagship. Verify exact model licensing and dependency lock before deployment. Evaluate stem leakage, transient preservation, clipping and recombination error on owned audio.
- Source: [upstream archival notice/license](https://github.com/facebookresearch/demucs).

### Chatterbox
- Code and official model card identify MIT, but current official README explicitly states **retired research, no longer maintained as of August 2026**, with no support/updates.
- README lists English Turbo/Nano and multilingual variants; Nano CPU throughput figures are publisher claims, not tests here. Useful archival TTS baseline, not a maintained default.
- Voice cloning must use authorized voices. Measure intelligibility, pronunciation, speaker consistency and watermark preservation; do not imply a code license grants voice/personality rights.
- Sources: [retirement/setup](https://github.com/resemble-ai/chatterbox), [weights](https://huggingface.co/ResembleAI/chatterbox).

### Auto-Editor
- Repository is Unlicense/public-domain; online/application assets have a separate proprietary license and released binaries may incorporate other open-source licenses.
- Catalog as deterministic/assisted editing, not generative AI. Do not infer desktop commercial-feature entitlement from source license.
- Evaluate cut accuracy, preserved speech boundaries, sync and export interoperability; exact build/runtime requirements remain unverified.
- Source: [official source/packaging distinction](https://github.com/wyattblue/auto-editor).

## Athena acceptance protocol

For every candidate retain exact code commit, model revision/hash, code/model/dependency licenses, source URL and check date; separate discovery, licensed-for-use, installed, generated, evaluated and adopted states. Use a bounded owned/public-domain fixture set. Keep raw outputs, seeds/prompts, warm/cold latency, total setup/download cost, memory peaks, failure logs and human-quality ratings. Evaluate real editor round trips and final exports. A fast synthetic kernel or successful launch is not target-project evidence. Never auto-promote these research candidates into other projects' recommended TODOs without a controlled comparison preserving their requirements.
