# Encryption, hashing and key management

Use the right primitive and protect its keys.

## Learn

Encryption transforms data so authorized key holders can recover it. Hashing produces a digest and is not designed to be reversed. Digital signatures support integrity and signer verification, not secrecy by themselves.

Password storage needs a purpose-built, salted password-hashing algorithm rather than a fast general hash alone. Encryption at rest and in transit address different threats. Neither protects data after an authorized application decrypts it for an attacker controlling that application.

Key lifecycle includes generation, storage, access, rotation, revocation and recovery. A strong cipher with exposed keys offers little protection. Use managed key services and proven libraries instead of inventing cryptographic schemes.

## Worked example

A file’s SHA-256 digest can detect accidental changes when compared against a trusted expected digest. A digest delivered by the same compromised source as the file is not independent authenticity evidence.

## Practice safely

1. Hash a harmless local text file before and after an edit.
2. Explain why the digest changes.
3. Draw where TLS keys and storage keys are used in an application.
4. Write a key-recovery and rotation checklist without handling real secrets.

## Check your understanding

Which primitive best describes a one-way integrity digest?

- Hashing
- Symmetric encryption
- Compression
- NAT

<details><summary>Answer and explanation</summary>

Hashing. A hash summarizes content; it does not encrypt it for later decryption.

</details>

## Further study

- https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

