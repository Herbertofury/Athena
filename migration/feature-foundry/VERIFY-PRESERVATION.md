# Verify retained Feature Foundry preservation offline


Run `python3 -B migration/feature-foundry/verify_preservation.py` from the
Athena root with Python and Git installed. It checks the pinned bundle, restores
it into a disposable bare mirror, runs Git integrity checks, and compares the
refs, commits, source blobs, retained release bytes and the original checksum
list. It reads the original source ZIP without unpacking files, and does not
execute historical installers. A passing result identifies the retained
snapshot only, distinguishes private custody from files in the checkout, and never
certifies retirement. Exit 2 means the proof was refused; leave originals
unchanged and recheck against the recorded ledger.


## Verify all six original release files

The default checkout verifies four release files. The two original web and
complete-release ZIPs are retained privately and intentionally remain outside
Git. Pass the folder containing their exact original filenames:

    python3 -B migration/feature-foundry/verify_preservation.py --private-release-dir /path/to/local/originals

The verifier requires both ZIPs to match the recorded sizes and SHA-256
values and cross-checks all five release digests against the retained original
533-byte checksum file. It neither extracts nor runs the ZIPs and does not
print the private directory. `verified-original-release-bytes` means all six
exact release files verified in this run, not that an installed cutover or
retirement passed. Without that directory, `outsideCheckout` and
`missingReleaseAssets` identify the two files absent from this invocation.
