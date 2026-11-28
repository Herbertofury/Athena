# Verify retained Feature Foundry preservation offline


Run `python3 -B migration/feature-foundry/verify_preservation.py` from the
Athena root with Python and Git installed. It checks the pinned bundle, restores
it into a disposable bare mirror, runs Git integrity checks, and compares the
refs, commits, source blobs, retained release bytes and the original checksum
list. It reads the original source ZIP without unpacking files, and does not
execute historical installers. A passing result identifies the retained
snapshot only, reports missing original release assets separately, and never
certifies retirement. Exit 2 means the proof was refused; leave originals
unchanged and recheck against the recorded ledger.
