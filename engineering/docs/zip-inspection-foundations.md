# Inspect compressed packages without trusting their declarations

**Evidence state:** executed generated ZIP fixtures, checked 2026-11-11. This is a restrictive read-only experiment, not a production archive parser or an accepted app/mod installer change. [Runnable lab](../experiments/zip-inspection-lab/README.md) · [Dated research](../research/2026-11-11-zip-inspection-foundations.md).

## The gap and decision

An app may need to identify a configuration or manifest inside a package without installing anything. The archive's name list, declared sizes and convenient name lookup are not enough to establish an unambiguous, fully checked inventory. Duplicate entries may select a different body than expected; declared expansion sizes may conceal additional decoded bytes; interrupted inspection may leave only a verified prefix.

This lab tests a specific hypothesis: admission before metadata allocation, complete member identity checks, and bounded full-stream decoding can make those failures explicit for a small declared ZIP subset. It never extracts, recursively opens nested archives, executes package content or interprets a game manifest. It complements [archive/change-tracking research](archive-and-change-tracking.md), rather than changing its planned performance comparisons.

## Primary facts that constrain the experiment

- Python's ZIP APIs allow member selection with a ZipInfo object when names are duplicated. Its documentation warns about decompression resource exhaustion and incomplete results after interruption. [Python zipfile](https://docs.python.org/3.12/library/zipfile.html#decompression-pitfalls).
- Zlib's nonzero max_length bounds one returned output chunk. Unconsumed input must be fed again; eof identifies stream completion and unused_data identifies bytes beyond it. Flush's length is an initial buffer size, not an output limit. [Python zlib](https://docs.python.org/3.12/library/zlib.html#decompression-objects).
- ZIP records, feature versions and filename encodings are defined by [PKWARE APPNOTE 6.3.10](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT). The lab implements an intentionally smaller policy, not the full format.
- Windows naming has reserved device names and characters and cautions against assuming case sensitivity. [Microsoft file naming](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file). The policy also excludes the [console device names](https://learn.microsoft.com/en-us/windows/console/console-handles) CONIN$ and CONOUT$.
- Normalization concerns equivalent character sequences, not filesystem identity. [UAX #15](https://unicode.org/reports/tr15/). Python 3.12's [Unicode database](https://docs.python.org/3.12/library/unicodedata.html) is version 15.0.0; the current annex page is newer. The execution receipt records the actual runtime data version.

The acceptance policy below is original experiment design. Neither the documents nor this test result recommend replacing a production library with this code.

## Explicit supported subset

Immutable in-memory bytes containing one ZIP32 archive; STORE or raw DEFLATE; ordinary files and empty stored directory entries; UTF-8-flagged or CP437 names; contiguous local records in central-directory order. The metadata decoder from the installed zipfile module is used only after bounded raw-record preflight.

The lab refuses archive/member comments, extra fields, data descriptors, ZIP64, split volumes, encryption, nonordinary member types, volume labels, unknown feature flags, prefixes, trailing archive bytes and alternative record ordering. Several refusals exclude valid ZIPs. “Unsupported” does not mean corrupt, malicious or unusable in a suitable library. The subset is far too narrow to claim general mod JAR/ZIP compatibility.

Default limits are 1 MiB input, 64 entries, 512 UTF-8 name bytes, eight path components, 32 KiB decoded per member, 64 KiB decoded overall and 4 KiB output chunks. These are fixture policy, not recommended production defaults. Limits are trusted caller configuration, checked for positive integer values.

## Executed pipeline and what each boundary establishes

1. **Admission:** reject an oversized immutable byte string before metadata construction or hashing. The caller has already allocated that string, so this does not bound download or source-file acquisition.
2. **Record preflight:** check declared count and actual record traversal, extents, local/central agreement and unsupported fields before constructing ZipInfo objects. A forged count cannot silently hide leftover directory records in the tested cases.
3. **Member identity:** preserve original names while checking a separate conservative comparison key. Reject duplicate keys, files occupying parent-directory positions, traversal/absolute forms, backslashes, NUL/control characters, selected reserved names and unsupported member types. No destination path is created.
4. **Decode:** stream the explicitly bounded compressed span, independently count returned output and hash/check CRC. Do not stop merely because the header's uncompressed size was reached. Require full stream termination, no extra compressed payload and observed size agreement.
5. **Receipt:** only all-verified entries yield complete. On decode failure or cancellation, keep each verified prefix entry, mark the failed entry, retain later entries as not attempted and report partial. A metadata admission failure is refused before member decoding; it is not a complete inventory or a list of every defect.

The implementation does not retain decoded member bodies. A single sentinel byte may be returned to prove an output budget has been exceeded. This byte is counted, never hidden. Per-member and aggregate observed output therefore stop at the chosen limit plus at most one byte. Chunk output remains within the configured chunk size. These are owned counters, not an RSS, allocation, CPU-time or process-sandbox guarantee.

Cancellation is cooperative between bounded decoding calls and before preflight. It does not interrupt a native zlib call, a callback that blocks, or arbitrary caller code. There is no elapsed-time deadline or subprocess isolation here.

## Negative controls and measured findings

The nine-case receipt retains the actual generated archive bytes in base64, their SHA-256 identities, code hashes, all inspection results and runtime versions. It contains two deliberately limited ordinary-library controls:

- Two entries named `same` contain `first` and `second`. Name-based zipfile read returns `second` on the tested runtime. The candidate refuses the ambiguity rather than silently choosing an owner.
- A generated DEFLATE member expands to 100 `A` bytes, but declares one byte and supplies that prefix's CRC. Name-based zipfile read returns one `A` on the tested runtime. The candidate observes 100 bytes and refuses the size disagreement. This is a scoped malformed-input observation, not a general vulnerability claim about zipfile or evidence that every library behaves the same way.

A separate high-expansion fixture contains one million generated `A` bytes behind a small declaration. With a 32-byte member budget and seven-byte chunks, inspection stops at 33 observed bytes. The demonstration does not pass that fixture to an unbounded library-read control. A low compression ratio is not required: honest small highly compressible files remain acceptable within the declared absolute budgets.

Other scenarios retain verified/failed/not-attempted states after CRC corruption, refuse traversal and normalization collisions, and preserve partial cancellation. A trailing-stream regression records three decoded bytes even though the member is rejected for extra compressed bytes. Independent review found the original counters skipped those three bytes on the error path; the repaired evidence and initial finding are both retained.

## Name comparison is policy, not a filesystem emulator

The comparison key normalizes each component, casefolds it and normalizes again using the installed Python Unicode data. Original names are unchanged. This catches the tested composed/decomposed accents, case variants and full-casefold collisions. It deliberately rejects some names that a particular filesystem could store separately.

It does not model Windows short-name aliases, every Win32/NT namespace rule, APFS behavior, filesystem-specific collation, mount options, reparse points or hostile destination changes. Nested archives remain opaque byte members with their own digest; their contents are not covered by the outer receipt. An outer complete result is not permission to open, install or execute them.

## Alternatives, costs and adoption gates

- For ordinary trusted packages, an established library with the target's required feature support may be simpler and more compatible. Test that exact version and workload; don't substitute this restrictive parser.
- For hostile or larger packages, evaluate a mature parser inside a bounded worker/process, with source-size, metadata, output, time, cancellation and privilege controls. That architecture is a proposal here, not tested isolation.
- Metadata-only indexing avoids decoding cost but cannot claim the full payload/CRC result measured by this lab. If the product only needs a name list, label it accordingly instead of presenting it as complete content validation.
- Compression-ratio heuristics can supplement absolute budgets but may reject legitimate repetitive data. They cannot replace actual output accounting.
- CRC verifies accidental corruption checks within this experiment; it is not publisher authenticity. A SHA-256 identity without a trusted expected digest or signature does not establish provenance either.

Before target adoption, record its current parser/library revision, accepted ZIP feature set, representative authorized package corpus and actual user problem. Require equivalent required coverage and diagnostics, parser differential/fuzz tests, platform acquisition rules, realistic resource/latency measurements and safe failure UX. Extraction adds a separate destination-containment, link, permissions, conflict and partial-write recovery problem; no extraction result is established here. No target recommendation, performance ranking or application change follows from this generated experiment.
