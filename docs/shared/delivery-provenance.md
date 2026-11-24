# Identify an artifact without overstating its trust

Compare deterministic bytes and explain what a SHA-256 digest does and does not establish.

## Learning goals

- Connect a local artifact to committed inputs and an explicit construction recipe.
- Distinguish source revision identity from an artifact-byte digest.
- Explain why a matching unauthenticated hash is not proof of publisher identity.

## Learn

A source revision and a delivered artifact answer different questions. The revision identifies source history; the artifact is the exact file someone would receive. Packaging choices can add timestamps, change file order or omit important inputs. The provenance exercise creates a small local artifact from fixed committed teaching files and records a manifest so that the relationship is inspectable.

A deterministic recipe controls the inputs that affect its output. For this exercise, file names, file bytes, ordering and archive metadata are fixed rather than taken from the current clock or a random directory listing. Building the same recipe twice should produce equal bytes under the tested implementation. That is a specific repeatability observation, not proof that every operating system or independent toolchain will emit the same artifact.

A SHA-256 digest is calculated from the artifact bytes. Compare it with the digest of a deliberately modified copy to detect that change. Keep the full digest in the receipt; a short prefix is useful for conversation but weaker as an exact record. A digest is not encryption, and knowing one does not provide the underlying source or a recovery copy.

Integrity checks require a meaningful reference. If an attacker can replace both a file and its unauthenticated checksum, a matching pair can still describe the attacker’s file. A manifest written by the same local process helps explain the run, but does not independently authenticate its author. The synthetic commit name is likewise not a signature or a verified publisher identity.

Signed provenance systems address a different trust question by connecting claims about a build with an identity and verification policy. GitHub documents artifact attestations as signed provenance claims. This workshop uses that distinction to explain what is missing; it does not generate attestations, use signing keys or assert compliance with a supply-chain assurance level. Even authenticated provenance would not prove that source code is free of defects.

Review the manifest, the artifact membership, the repeated-build comparison and the tamper comparison together. Then state exactly what the exercise established: fixed local inputs produced an observed byte sequence, its digest was measured, and a changed sequence was detected. The artifact exists only in memory, while the owned temporary repository is cleaned up; the JSON evidence is the durable thing you can copy into your worksheet.

## Worked example

Two builds of the same fixed committed input set yield identical bytes and digest D. Flipping one payload byte in a copy yields a different digest. That demonstrates repeatability and change detection for this recipe. It does not demonstrate who published either file, whether the software is safe or whether an independent machine can reproduce it.

```sh
# Produces and checks a temporary local source artifact, then cleans it up.
python3 labs/delivery-workshop/run_lab.py provenance
# Conceptual byte checks implemented with Python standard-library hashlib:
# SHA256(first_build_bytes) == SHA256(second_build_bytes)
# SHA256(first_build_bytes) != SHA256(tampered_copy_bytes)
# A matching digest does not authenticate a publisher.
```

## Practice safely

1. Run provenance and identify the source revision and artifact digest separately.
2. Explain which construction choices make the local output deterministic.
3. Verify the repeated-byte result and deliberately changed-copy result.
4. List the archive members and check they are the intended committed files.
5. Describe how replacing both an artifact and an unauthenticated hash defeats publisher attribution.
6. State that signing, independent rebuilding and remote publication were not performed.

## Evidence to keep

- A source revision, artifact membership and full SHA-256 digest.
- Repeated-build equality and changed-copy inequality observations.
- A provenance statement that clearly excludes authentication and independent reproducibility.

## Original check 1

What does comparing an artifact with a trusted expected SHA-256 digest primarily check?

- Whether the observed bytes match that reference
- Whether the author is morally trustworthy
- Whether every requirement is satisfied
- Whether the file is encrypted

<details><summary>Answer and explanation</summary>

Whether the observed bytes match that reference. The digest comparison concerns byte integrity relative to the expected reference, not correctness or identity by itself.

</details>

## Original check 2

Why control archive timestamps and file order?

- They authenticate the publisher
- They replace all tests
- They publish a release automatically
- Those packaging inputs can otherwise change the output bytes

<details><summary>Answer and explanation</summary>

Those packaging inputs can otherwise change the output bytes. A deterministic artifact recipe must control metadata and ordering as well as source-file contents.

</details>

## Original check 3

A file and its checksum were both replaced by an untrusted sender. They match. What remains unproven?

- The intended publisher and authorized build provenance
- That a checksum can be computed
- That the two received values are consistent
- That bytes exist

<details><summary>Answer and explanation</summary>

The intended publisher and authorized build provenance. An unauthenticated matching pair can be manufactured together. Identity and trusted provenance require additional evidence.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

The artifact is a temporary deterministic teaching bundle, not a compiled release. No signatures, hosted attestations, independent builder, SBOM, package registry, malware scan or publication is performed.

## Official references

- [Python 3.12 hashlib](https://docs.python.org/3.12/library/hashlib.html)

- [GitHub Actions artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations)

- [Git show reference](https://git-scm.com/docs/git-show)

- [Python 3.12 tempfile: scoped temporary resources](https://docs.python.org/3.12/library/tempfile.html)

