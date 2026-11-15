# Portable package inventory boundaries

The portable launcher validates the complete package file inventory before opening
any path listed by that inventory. A manifest is an integrity record, not authority
to read outside its package directory. This changes the launcher, not the reviewed
runtime asset manifest or its allowlist.

Both supported operating systems use the same conservative portable filename
rules: canonical relative paths, ASCII printable characters, no parent components,
Windows drive/ADS syntax, reserved device names, backslashes, trailing dots/spaces,
NULs or case aliases. The manifest cannot list itself. Unknown shapes, non-integer
or negative sizes and malformed SHA-256 strings fail closed. Limits are 1 MiB of
manifest bytes, 2,000 entries and 600 MiB of declared package data. File hashing
reads exactly the validated size plus one byte to detect growth, rather than
following an unbounded growing file. This is not a wall-clock I/O deadline.

Files and package ancestors must remain non-symlinks and non-reparse-points,
including Windows junctions, and files must be regular. Final inventory traversal
uses an explicit walk capped at 4,000 filesystem entries; it refuses links before
descending. Schema booleans and case aliases of the manifest itself are rejected.
Existing full inventory/hash verification remains. These checks assume trusted,
quiescent directories; they do not protect against hostile concurrent path swaps
or prove signed authenticity. Database operations, production WAL gates, source
repositories, runtime assets and held changes are unaffected.

Synthetic acceptance covers late malicious entries before any listed-file read,
typed fields, case aliases, entry/aggregate byte bounds and an unchanged valid
package. Existing archive tests and actual extracted native browser acceptance
remain required on Windows and Linux. No user files or native synthetic executable
are opened by the new tests.

Local failure retained: an initial entry-count fixture exceeded the existing 1 MiB
manifest-size gate, so it was correctly rejected before the test's expected
manifest read. The fixture now contains 2,001 compact entries to exercise the
intended count gate. Seven inventory tests, six existing package tests and eight
archive tests passed locally; hosted exact-head validation is still required.

A first local traversal regression caught an unapplied walk replacement; the
explicit bounded walk was then installed and the regression passed. Windows
junction refusal is exercised with a real disposable junction, not a mock.
