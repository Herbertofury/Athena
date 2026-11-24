# Verified resume: byte fidelity before concurrency

November 24, 2026. This is a runnable evidence slice for the [web-acquisition benchmark queue](../web-acquisition-frontier-2026-11-24/README.md), not a product integration, package recommendation, or Windows performance result.

## What passed

`python3 resume_fixture.py` uses only the installed curl CLI, Python standard library and a disposable HTTP/1.1 server bound to an ephemeral local loopback port. There is no external network, real payload, credentials, live account, daemon left running, or installation. A synthetic file has 8 MiB of deterministic content, a saved 3 MiB prefix, and a trusted fixture checksum. There are two distinct versions with the same size. Each backend ran four cases nine times; a result is accepted only after exact full length and SHA-256 match, and every old staged input is checked for byte preservation.

| Origin answer | Verified outcome | Response bytes | Python / curl median |
| --- | --- | ---: | ---: |
| 206, same strong ETag and exact range | Reassembled and verified the original | 5,242,880 | 15.351 / 24.869 ms |
| 200, changed strong ETag | Kept the old prefix untouched; separately verified a full replacement against its independently known fixture hash | 8,388,608 | 14.691 / 25.399 ms |
| 200, ranges ignored | Treated response as a full file, not a suffix | 8,388,608 | 15.870 / 29.574 ms |
| 416, old local stage is already whole | No body bytes, but still verified the local complete file | 0 | 8.517 / 15.916 ms |

The exact raw samples and tool version are in [receipt.json](receipt.json). Full verification time includes subprocess startup for curl and suffix reassembly in both paths. It excludes initial fixture writes and the later old-prefix assertion. The unchanged 206 case used 37.5% fewer response bytes than a full file; that does **not** establish a reproducible WAN, parallel, CDN or disk speedup. The curl CLI comparison does not rank libcurl inside a persistent process. The installed curl is not the current release from the research queue; Ghost Downloader, aria2, Firecrawl, Rust HTTP, Windows filesystems, unreliable connections and persistent crash recovery were not tested.

## Reuse this contract, not the fixture code

- Persist the exact expected artifact identity, prefix length, byte representation and a strong validator. For a ranged request use `If-Range`, identity encoding and the exact expected offset. Validate a single-range 206 extent and total, payload length and validator before assembly. Verify the entire staged artifact against a trusted digest before publication; a validator is not an authenticity proof.
- A 200 is a complete representation. Stage separately; do not overwrite or append to the partial. A different validator requires explicit resolution of the intended release/file identity and an independently expected digest, not automatic acceptance of a new download.
- A 416 is not success. If the local file could already be complete, verify its exact expected length and digest before accepting it. Otherwise request a new transfer while preserving the previous state.
- Reuse in a portable download engine only after same-input comparisons also cover capped streaming, real interruptions, validated checkpoints, cancellation, redirects under provider policy, disk-full/restart, atomic publication and rollback. The fixture intentionally does not replace those application guarantees.

Primary references: [HTTP Semantics, RFC 9110 §13.1.5 and §14](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.5), [everything curl: resuming and ranges](https://everything.curl.dev/usingcurl/downloads/resume.html), and [curl CLI manual](https://curl.se/docs/manpage.html).
