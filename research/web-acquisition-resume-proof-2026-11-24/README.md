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

## Current-release comparison, matched build settings

I built the official curl 8.14.1 and 8.23.0 source archives with the same compiler, link configuration, OpenSSL and zlib, using separate disposable directories and no global install. Both upstream signatures verified against curl's [documented release signing key](https://github.com/curl/curl/blob/curl-8_23_0/docs/VERIFY.md). Source SHA-256: `f4619a1e2474c4bbfedc88a7c2191209c8334b48fa1f4e53fd584cc12e9120dd` (8.14.1), `8dadd7d2536a314f982ad05a651b713f426bf7d02cc2c76cffb9796f2218e6c5` (8.23.0). Upstream lists 8.23.0 as the current regular release in its [release history](https://curl.se/docs/versions.html) at this review.

Both builds used the same configure flags: `--disable-shared --enable-static --with-openssl --with-zlib --without-brotli --without-zstd --without-libpsl --without-nghttp2 --without-libssh2 --disable-ldap --disable-ldaps --without-librtmp`. Their advertised feature sets still differ because the releases themselves differ; these are matching HTTP settings, not identical builds for all protocols. I ran the unchanged fixture four times per release in counterbalanced paired order and a clean process environment. Compare [complete samples](matched-release-comparison.json), not a subset of successful transfers: 576 total curl and in-process controls, all with exact final bytes and original staging preserved.

| Curl case | 8.14.1 median | 8.23.0 median |
| --- | ---: | ---: |
| Same version, 206 | 21.358 ms | 22.245 ms |
| Replaced content, 200 | 19.882 ms | 21.218 ms |
| No range support, 200 | 21.151 ms | 21.615 ms |
| Already complete, 416 | 12.905 ms | 14.090 ms |

This measured loopback path established exact correctness on the current release, not a speed gain. The in-process Python control also shifted on several cases and host variation/startup can affect differences of this size. There is no basis here to roll back a dependency, assert a real product regression, or promote it as faster. Next compare persistent libcurl or Rust HTTP under controlled real transfer latencies, with the same completion and rollback gates.
