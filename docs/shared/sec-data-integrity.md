# Tell secrecy, integrity and authenticity apart

Use a local hash experiment to learn what cryptography does and does not prove.

## Learning goals

- Select hashing, encryption, MACs or signatures by the needed property.
- Explain why a checksum needs a trusted reference.
- Distinguish a real calculation from a secure deployment.

## Learn

Encryption protects the secrecy of data from people without the required key, subject to the algorithm, implementation and key handling. Hashing transforms bytes into a fixed-length digest for comparison. A hash is not encrypted data and is not normally decrypted. Encoding such as Base64 only changes representation; it is not a secrecy mechanism.

SHA-256 can help detect a change when you compare a file’s digest to a trustworthy reference. The reference matters: if someone can replace both a downloaded file and the hash published next to it, a matching hash alone does not establish who supplied the file. A hash also does not tell you whether a file is safe, correct or recently created.

A message authentication code, such as HMAC, combines a key with message bytes so holders of that key can check integrity and key-based authenticity. Anyone holding the shared key can produce a valid tag, so HMAC does not prove which of those holders authored a message. Do not use a published tutorial key to protect real data.

A digital signature uses a private signing key and a corresponding public verification key. Verification must include trust in the public key and the intended protocol context. A certificate helps bind a key to an identity under a trust model. A valid signature proves a cryptographic relationship, not that the signed software is harmless or that a human read a contract.

Encryption at rest protects selected storage threats; it does not stop a compromised running application from reading data it is authorized to decrypt. Transport protection covers a connection, not every endpoint after delivery. Backups, logs and exports can create extra copies that need their own controls. Start by locating the data, then define who and what may use it.

The offline lab hashes synthetic bytes, copies a file in a newly created temporary directory and compares it after a one-byte change. It also compares HMAC tags using an explicitly public demonstration key. It never reads your files. The experiment makes integrity behavior visible; it does not generate credentials, encrypt storage or implement a production cryptographic protocol.

## Worked example

The fictional record is “booking=17;status=confirmed”. Changing only 17 to 18 changes the SHA-256 digest. Copying the original bytes to a restored file preserves the digest. If the original and tampered files are accompanied by their own freshly computed hashes, each can pass comparison to its own hash. You still need an independent trusted reference. The HMAC demonstration rejects changed bytes under the original tag, but its published key means anyone can make a new valid tag; it is teaching data, not authentication for a real system.

## Practice safely

1. Predict which comparisons should match before running the integrity command.
2. Run python3 labs/security-foundations/offline_lab.py integrity.
3. Identify identical-copy, changed-message, valid-tag and wrong-tag results.
4. Explain the role of the trusted baseline in a restored-file check.
5. Write one threat helped by storage encryption and one threat it does not solve.
6. Keep all examples synthetic and never substitute a real key, password or private file.

## Evidence to keep

- Actual integrity command output.
- Explanation of why the public demonstration key protects nothing outside the exercise.
- One limitation each for hashing, storage encryption and digital signatures.

## Original check 1

A file and its SHA-256 value come from the same untrusted location. Their match establishes what?

- The file has no malware
- The file is encrypted
- Its bytes match that supplied digest, without independently proving publisher authenticity
- The publisher’s identity is certain

<details><summary>Answer and explanation</summary>

Its bytes match that supplied digest, without independently proving publisher authenticity. A digest comparison checks bytes against a reference. The trustworthiness of that reference is a separate question.

</details>

## Original check 2

Which mechanism uses a shared key to authenticate message bytes?

- Base64
- A plain checksum without a key
- File compression
- HMAC

<details><summary>Answer and explanation</summary>

HMAC. HMAC is keyed. Encoding, compression and unkeyed hashes do not establish the same property.

</details>

## Original check 3

Why can encryption at rest fail to stop theft through a compromised application?

- The running application may have legitimate decryption access
- Encryption never works
- Hashing always reveals the key
- A certificate automatically exports all files

<details><summary>Answer and explanation</summary>

The running application may have legitimate decryption access. Storage encryption does not remove the application’s authorized data access. Endpoint and application controls still matter.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

No password hashing, TLS handshake, signature verification, encryption or key-management deployment is implemented by this exercise.

## Official references

- [NIST FIPS 180-4: Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)

- [Python hashlib documentation](https://docs.python.org/3/library/hashlib.html)

- [Python hmac documentation](https://docs.python.org/3/library/hmac.html)

