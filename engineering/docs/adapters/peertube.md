# PeerTube selected-video adapter

[Adapter laboratory](README.md) · [Dated research](../../research/2026-11-11-peertube-videos.md) · [Offline experiment](../../experiments/peertube-video-lab/README.md)

Checked November 11, 2026. PeerTube is an instance-based video provider with structured public metadata. The current experiment reads only previously captured bytes for one selected video and caption-metadata response. It neither authenticates nor requests media, renders Markdown, follows channels, joins peers or accepts a target integration.

## Preserve the information a later client needs

- Scope local numeric IDs to the queried instance and retain UUID, short UUID and canonical URL separately. Preserve account, channel and channel-owner roles. Public publisher metadata is not verified original authorship.
- Keep full description, truncated description and support text separate. The pinned current VideoDetails contract calls description full Markdown; ambiguous legacy schema must retain unknown completeness. Exact source is independent of an incomplete event projection.
- Inspect both top-level files and HLS streamingPlaylists. Empty top-level files does not imply absence of media. Preserve ordered representations and original role fields, including direct/download, manifest, torrent and magnet references. Do not fetch any merely because it was returned.
- Treat thumbnails and captions as their own media roles. Modern fileUrl fields can be available even if deprecated relative-path fields are null. Relative paths need the actual instance context; remote storage does not establish author identity.
- Bind caption evidence to its request UUID, instance and operation. A matching total/count is a response-scope check, not proof of a complete transcript, accurate automatic captioning or playback.
- Retain missing/null/empty values, contradictions, failed HTTP attempts, partial captures and unsupported extensions. A 404 is absence or inaccessibility at this observation, not proof of deletion.

## What was actually observed

One official-documentation public sample has a full 890-byte description and a 255-byte summary, no root file entries, one HLS playlist with six representation entries, five thumbnail entries and one automatically generated caption reference. NodeInfo reports PeerTube 8.3.2. All three anonymous JSON responses were bounded and hashed; no media was requested. The exact schema snapshot, capture hashes, privacy rules and failure limits are recorded in the linked experiment and research note.

## Before using this in an application

Check the actual server contract, allowed access, required fields, current privacy and processing states. Separately validate media retrieval, ranges/redirects, declared versus actual MIME/codec, manifest completeness, caption parsing and synchronized accessible playback. Do not enable peer-to-peer sharing or install a player as a side effect of reading metadata. Respect reuse licensing and preserve meaningful uncertainty.

A target recommendation requires comparison against that application's actual current reader and renderer with its correctness, security, accessibility and workload gates preserved. This research does not provide that comparison.
