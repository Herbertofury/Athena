# NASA Image and Video Library adapter

[Adapter laboratory](README.md) · [Dated evidence](../../research/2026-11-11-nasa-media.md) · [Offline gate](../../experiments/nasa-media-lab/README.md)

Checked November 11, 2026. The documented public REST API supplies search metadata, asset manifests and separate metadata/caption locations. The isolated gate processes captured JSON only. It neither requests media nor renders content or changes a target application.

## Preserve endpoint roles

Search data describes a selected query result. Keep the source description, accessible description, center and creator fields separate. Link rel/render values describe preview, alternate or other references; they are not proof of an original file's successful delivery. An asset manifest is an ordered reference list. A metadata/caption location is a pointer, not file contents.

Bind each response to the selected ID, operation and supplied request. Preserve wrong/ambiguous identities, duplicate matches, missing/null/empty fields, unknown roles, transport failures and contradictory observations. API response href text can differ from the actual request scheme; retain it as source evidence, not an instruction to downgrade or follow a URL.

## Real discrepancy to preserve

For an official example video, the exact filtered search returned zero results, while the asset manifest returned 52 references and the caption endpoint returned a location. The adapter must retain that partial evidence without inventing descriptive metadata or treating absence from search as deletion. The linked research note records exact hashes and scope; it makes no claim about why the discrepancy occurred.

An official image example returned one descriptive row with 723 bytes of source description, five links, a six-reference manifest and a metadata pointer. No linked image, video, caption or metadata file was downloaded. All six response captures are anonymous and bounded.

## Application adoption gates

Validate the actual application's query and identity rules, reference handling, MIME/codec/size checks, redirects, rendering and accessible playback separately. Do not infer complete search history from page counts, transcript completeness from a caption pointer, or licensing from a NASA hostname. Check NASA's current media usage guidance and any item-specific third-party rights before reuse.

No player, credentials, download action, endpoint polling, dependency change or target compatibility recommendation is enabled by this research.
