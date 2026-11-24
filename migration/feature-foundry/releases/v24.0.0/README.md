# Feature Foundry v24.0.0 partial release preservation

This directory preserves four original release files without modifying or executing them:

- `Feature-Foundry-v24.0.0-source.zip`
- `Feature-Foundry-v24.0.0-windows-x64-setup.exe`
- `Feature-Foundry-v24.0.0-windows-x64.msi`
- `SHA256SUMS.txt`

The three ZIP/installer bytes match the SHA-256 digests in the [original v24.0.0 release](https://github.com/Herbertofury/Feature-Foundry/releases/tag/v24.0.0). The original checksum file is also retained unchanged; its own SHA-256 is `7c936936de7f3cf0d4efb9e35a1d6229db31b9e140efd951f2dd70f0a4517686`.

The checksum file lists five artifacts. The web ZIP and complete release ZIP are **not included here**. Their listed hashes are an inventory, not evidence that those files have been transferred. This directory is a partial repository copy, not a GitHub Release or a completed release migration.

The original source archive has 98 file entries and two directory entries. All 98 file bytes match the source already preserved in [Athena preservation PR #3](https://github.com/Herbertofury/Athena/pull/3). The original source includes its historical Drive metadata and packaging command unchanged. No build or packaging command was run for this copy.

The Windows installers are historical release files. They were not run, rebuilt, signed, or modified. Static checks do not establish malware safety, runtime correctness, or native application acceptance. The original release describes the binaries as not Authenticode-signed.

Source/history migration, application integration, runtime acceptance, and the remaining release files must be verified separately. **Do not delete Feature-Foundry based on this partial copy.**
