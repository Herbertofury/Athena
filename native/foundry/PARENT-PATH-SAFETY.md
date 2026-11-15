# Portable external-path boundary · 2026-11-15

Baseline: `1c4d8490c2a938d41ed6c57e98c930e328c2e503`.

The launcher previously used `Path.absolute()` and a lexical package-root ancestry
check. Python retains literal parent components in that operation. For example,
a destination spelled `/tmp/other/../package/new.sqlite` is not lexically under
`/tmp/package`, although it addresses that directory when the intermediate path
exists. No symlink or concurrent writer is necessary.

This violates the explicit external-database contract: a new database could be
published inside the package, or an internal database opened through an alternate
spelling. It can contaminate the package's later file inventory verification.
It does **not** establish overwrite of an existing destination: exclusive creation
and hard-link publication remain separate safeguards.

## Narrow correction

Reject a literal `..` component in user database paths before converting to
absolute form. Do not resolve symlinks away: the existing symlink, package
containment, destination-family and exclusive-publication checks remain intact.
Apply the same helper to create destinations, backup/upgrade sources and
destinations, and normal launch. Direct absolute and relative paths remain valid;
users of a parent-relative spelling must supply the equivalent direct path.

## Evidence

A zero-write in-memory harness executed the exact fetched baseline launcher and
the proposed launcher, with filesystem existence predicates mocked and staging,
subprocess, publication and bridge loading replaced by failure sentinels.
The new five-method unittest suite covers create, backup/upgrade path roles,
normal launch, direct-path compatibility and preservation of symlink refusal.

Baseline: five methods ran with six failures and three errors (including missing
new helper assertions); fixed candidate: five methods passed. These are boundary
unit tests, not real filesystem end-to-end or Windows acceptance. The baseline
negative cases reach sentinels instead of rejecting the parent component.
No user database or package was created, modified or deleted.

Run the committed suite with:

```sh
python -m unittest discover -s native/foundry/tests -p 'test_parent_paths.py' -v
```

The existing native CI discovers `test_*.py` on Windows and Linux. Full hosted
package/native/browser checks must pass on the exact draft head before readiness.
Cloud disk exhaustion prevented full local builds; no files were deleted to
create space. Hostile concurrent-directory and SQLite destination-family race
limitations remain unchanged. The isolated WAL candidate and unpublished
portable-unified work are not included.
