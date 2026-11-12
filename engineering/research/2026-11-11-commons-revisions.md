# Commons revisions without losing upload history

Checked November 11, 2026. Base: Athena draft #43 at `7cbeb2c993a2bb53d8f914c4880ff2f6aeaea15d`. Evidence: official documentation/upstream source, four real anonymous metadata responses, offline replay and separately labeled synthetic defensive tests. No active collector, other application, account, file transfer or player change.

## Decision and existing gap

The existing [Commons audio projection](../experiments/commons-audio-lab/normalize.py) is deliberately a single-current-file gate: it rejects continuation and only accepts the previously tested audio format. Keep that behavior. The [WordPress collector](../experiments/site-extraction-lab/wordpress_collection.py) handles numbered REST pages, not MediaWiki's opaque continuation state. Neither can establish a scoped Commons upload-revision chain. The earlier [Commons guide](../docs/adapters/wikimedia-commons.md) explicitly lists history as unfinished.

Add a narrow [offline Imageinfo reconciler](../experiments/commons-audio-lab/revisions.py), reusing the unchanged strict JSON decoder already used by the audio projection. The official Action API remains the retrieval route; no HTML scraper, copied upstream implementation or extra dependency is introduced. This is a usable evidence component, not a target-project recommendation or speed claim.

## Documented protocol versus actual observation

- Imageinfo exposes file upload revisions, timestamps, URLs, sizes, hashes, uploader information and hidden-field indicators. Uploader is not necessarily creator; no license is implied. This experiment does not request costly extended metadata. [CMR11001]
- Replay the returned continuation fields together. An initial page, or batchcomplete when continuation is still present, cannot prove all matching results were visited. [CMR11002]
- The pinned upstream implementation uses iistart for single-title history continuation and can repeat a continuation when response budgets prevent progress. It selects the current file and old history separately. The source revision is not claimed to be the installed Commons revision. [CMR11005]
- Four serial anonymous requests used a descriptive research User-Agent with the Athena project link, maxlag=5, one revision per response, a one-MiB response cap and a delay between requests. No cookie jar, login, grants, proxies, media downloads or bypasses. All four returned HTTP 200; no throttling or access denial occurred. Future clients must stop or delay on limits, never evade them. [CMR11003] [CMR11004]

## Actual public evidence

The selected file is [File:Example.jpg](https://commons.wikimedia.org/wiki/File:Example.jpg), page ID 6428847. [CMR11006] The [sanitized receipt](../experiments/commons-audio-lab/revision-validation-2026-11-11.json) records capture times, byte counts, hashes, implementation identity and both replay outcomes. Full responses and headers remain external unpublished evidence; neither raw actor data nor server-provided cookie/client-address headers are committed.

1. Broad history, two pages: 654 and 684 response bytes. Both responses contain continuation; the second points to a third, uncaptured request. The result is **not exhausted**.
2. Selected window with iiend=2006-03-07T15:51:32Z, two pages: 654 and 643 bytes. The second is terminal with batchcomplete=true and no continuation. The captured request chain is **exhausted for that window**.
3. Both scopes contain upload times 2010-03-14T17:20:20Z and 2006-03-07T15:51:32Z. Their declared file size is 9,022 bytes and their SHA-1 is the same. These are two distinct upload events, not one record. Digest-only deduplication would discard history. No file bytes were fetched to revalidate those declarations.
4. Actual continuation uses iistart plus continue, not an assumed iicontinue-only cursor. The archived file URL embeds a different timestamp from the upload timestamp. Do not derive upload identity from the archive filename.

The first broad and selected responses are byte-identical but have distinct request-scope hashes. Equal response bytes do not make differently filtered histories equivalent. The broad last response stays incomplete even though the same two uploads cover the selected window.

## Reconciliation and access boundaries

The initial URL fixes one canonical Commons File title, JSON formatversion=2, the seven tested properties, page limit 1–50 and optional inclusive iistart/iiend window. Unsupported sites, generators, multiple titles, redirects, title normalization, write parameters, aliases and extended metadata are rejected rather than guessed. A timestamp/page-ID pair is a scoped upload identity, not a globally certified revision identifier; same-key content variants remain visible and block exhaustion.

Responses are joined by complete canonical request dictionaries. Missing links, cycles, conflicting variants, page-ID changes, overlap, reordered timestamps, unconnected responses and API warnings block scope exhaustion. Identical retries retain every attempt but do not duplicate records. Failed attempts stay visible when a later matching successful response establishes the chain. HTTP failure, rate limit, denied access, missing/foreign files and API errors are distinct outcomes. No automatic retry or HTTP request occurs.

Hidden file/uploader fields and missing metadata remain distinct; unknown creator/license fields are never filled from uploader names. Query exhaustion can coexist with hidden or partial metadata. AccessLabel is the caller's capture context, not an authenticated permission proof. CompleteHistory and fullSupportAccepted always remain false; snapshot consistency is unproven. Media transfer, decoding and playback are separately not_attempted.

The wire budget is at most 64 attempts, one MiB per body, eight MiB in aggregate, depth 64 and 50,000 JSON nodes per body. The existing strict decoder rejects duplicate keys and nonfinite numbers; the wrapper also rejects invalid UTF-8 and unpaired surrogates. Source bodies remain exact in memory. Arbitrary caller headers/extras are excluded from returned rawCaptures; retain original capture files separately. Public receipts exclude titles, source/media URLs, uploader names, cursor values, headers, MIME strings, raw source bodies and arbitrary error prose. IDs, timestamps and hashes remain linkable and still require publication review. Do not treat this public projection as anonymization or a download manifest.

## Retained rejected assumptions and repairs

Independent adversarial review was run after all 41 initial synthetic tests passed. It found four core problems, now retained as regressions:

- An empty initial page could advance continuation beyond the initial iistart and accept an out-of-window revision. Every row is now checked against both the current request and original window.
- Deeply nested arbitrary caller headers caused RecursionError during an unnecessary copy; oversized extras were also retained. The raw-capture return now retains only the needed primitive request/status/body fields.
- A synthetic File:.. and dot-segment media path passed identity checks. Canonical filename validation now excludes dot/path/edge-space forms.
- A malformed uploader object silently became missing. Nonhidden present uploader fields must now be strings; genuinely missing and hidden states remain separate.

A second review covered the newly added local manifest CLI. It found two further hazards: a manifest could reference parent-relative/absolute paths or escaping symlinks, and a FIFO body blocked before the bounded read. The CLI now permits only regular, single-link sibling files, rejects special files and links, and pins the parent directory descriptor. It checks identity before/after nonblocking no-follow opens and verifies post-read size/timestamps. FIFO manifests are also rejected. These descriptor checks follow the existing bounded-file-scan experiment's pattern. The local-file gate currently requires POSIX capabilities and fails explicitly elsewhere; callers on other platforms can supply byte captures to the offline API. A mutable filesystem is not an atomic multi-file snapshot, and hashes do not establish input authenticity.

The original failures, before/after independent probes and test logs remain in local review evidence. These are synthetic counterexamples, not observed Commons outages or private-access results. The live requests all succeeded. A documentation lookup initially used the historical lowercase includes/api path and returned 404; the upstream rename was inspected and the pinned current includes/Api source was then read. A local source-index update initially used the wrong field name and failed before writing the index; it was corrected to the existing files schema. Initial aggregate checks exposed three source-register errors because the baseline file was sorted among fragments; an intervening correction command used the wrong local working-directory prefix, so its following checks retained the same failures. Restoring baseline-first ordering fixed the index. The 420 Node tests passed during the failed aggregate; the root npm research-check bridge also failed while that incorrect index remained. Neither lookup/setup error nor those retained check failures are relabeled provider failure.

## Alternatives and remaining gates

- Keep the current audio-only parser for its existing strict single-file use. It is not a substitute for revision history, and this new module does not relax it.
- The maintained Action API avoids page-layout scraping; a maintained API client can own future transport, throttling and retries. No additional client dependency is justified by this offline experiment.
- Digest-only deduplication is concretely rejected by the two real upload events above. URL/archive timestamp identity is also rejected by the observed mismatch.
- Larger histories, deletions/restorations, same-timestamp collisions, title normalization, mixed-file batches, actual hidden revision fixtures, authenticated scopes, expiring media and live content drift remain outside acceptance. A bounded exhausted window is not a stable snapshot or complete public/deleted history.
- No benchmark or comparison against any target application's implementation was performed. Adoption needs that target's current baseline, equivalent output and correctness/security/UX checks; no target TODO or recommendation was added.

## Reproduce and sources

Use the manifest workflow in the [experiment README](../experiments/commons-audio-lab/README.md). [Synthetic regressions](../tests/test_commons_revisions.py) and [receipt contract tests](../tests/test_commons_revision_receipt.py) run offline. The receipt records focused checks; aggregate verification is recorded in the draft PR and publication handoff. Raw public captures remain external, so committed tests verify receipt identity/contracts rather than claim to rerun absent real inputs.

Source IDs: CMR11001, CMR11002, CMR11003, CMR11004, CMR11005, CMR11006. Six additive entries in [the source fragment](../data/sources.d/commons-revisions-20261111.json); all older source entries remain unchanged.
