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

## Independent web rebuild and installer cross-check (2026-11-25)

The retained verified 98-file source ZIP, restored into an empty workspace, passes the original structural/authority checks, TypeScript checking and Vite 8.2.1 production build using its lockfile. The resulting five browser JavaScript/CSS assets are independently corroborated by both original installer payloads, not just by matching filenames.

| Rebuilt asset | SHA-256 of uncompressed file |
| --- | --- |
| `index-ChOrZxUF.js` | `b48875c172f9dabb3a8542afbd060f6fb1eddbf3c208fcd0a24ac893751ce535` |
| `index-ChT7XlBL.css` | `994d3779cbff1b9cc7b38ed09dcb98dd520944db02336fd7055a87bbc1ba6728` |
| `tauri-runtime-jPfj2eaH.js` | `dcae54d29fc98d13834673f5d63508dc97c53958aedb33a63086249cc43ac982` |
| `three-runtime-DCtEFbR0.js` | `e42c07e32749b73623e9ce17eca08fee604124de2a374917cb4395aa3d7c3b2c` |
| `world-catalogs-BD2SjGZf.js` | `2ae99b343ce3f03b71b70cbe5b1475b53157478895895017f69232b700beb266` |

Method: verify both installer wrappers against the retained checksums, then use [7-Zip 26.06](https://github.com/ip7z/7zip/releases/tag/26.06) to read the application members as data. Neither installer nor application was executed. The two 5,195,776-byte members differ at exactly two bytes, both inside the Tauri bundle-type marker (NSS vs MSI). With the source lockfile's Brotli 8.0.4 and [the pinned Tauri code generator's release compression setting](https://docs.rs/tauri-codegen/2.6.3/src/tauri_codegen/embedded_assets.rs.html), each rebuilt asset compressed to a contiguous stream found byte-for-byte in both original members. Flipping one byte in the rebuilt main JavaScript caused only that asset to stop matching. The rebuilt `index.html` was not matched to the installer bytes and is not classified as byte-exact.

The default build writes root-absolute references in its HTML. On a disposable HTTP server serving the build only under a nested directory, all five entry assets returned 404. An independent `npm run build -- --base ./ --outDir dist-relocatable` left all five asset payloads unchanged and all five URLs returned 200 with matching bytes under a nested mount. This verifies static delivery only, not full browser execution, native app acceptance, or permission to serve the legacy UI from Athena. No archive was recreated or published. The original web and complete ZIPs remain missing; this evidence does **not** satisfy the source-retirement gate.
