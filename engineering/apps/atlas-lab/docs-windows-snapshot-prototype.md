# Windows snapshot prototype, 2026-11-10

**Experimental tests only. Production Windows persistence still returns
`UnsupportedPlatform`. This is not a usable Windows snapshot release or native
acceptance.** The Linux implementation and its tests are unchanged.

## Deliberately narrow envelope

The Windows module is reachable only under `cfg(all(windows, test))`. It requires
an explicit existing drive-absolute directory on local NTFS. It does not discover
or create an application directory, repair ACLs, elevate, change privileges,
accept UNC/device/relative paths, or follow reparse components. An opened drive
root must have an exact normalized GUID-volume-root name; nested SUBST mappings
are refused. Every directory is opened one component at a time through
`NtCreateFile` with `RootDirectory` and `FILE_OPEN_REPARSE_POINT`, then inspected
by handle. Case-sensitive directories, unknown case flags, and unavailable
inspection queries fail closed. Subsequent I/O uses the retained final handle,
not a re-resolved directory pathname. Live directory relocation is unsupported:
Windows refuses the ordinary rename while the permanent sidecar is open. Closing
all stores before moving the directory, then reopening its new explicit path,
is required. No share flags are relaxed to make live relocation succeed.

The final directory and snapshot/lock objects require the current effective
user's SID as owner and a protected valid non-null DACL containing exactly one
non-inheriting ordinary allow ACE granting that SID full file access. This is a
strict experimental subset, not a general Windows effective-access evaluator.
Group, inherited, conditional, object, deny, and other ACE forms are unsupported.
SID/ACE bounds are checked before SID APIs. The directory, sidecar and existing
snapshot are revalidated per operation and before replacement. File type, reparse
tag, link count, volume and file identity are checked by opened handles.

A permanent protected sidecar is held without delete sharing. Operations use
nonblocking shared/exclusive `LockFileEx`, and re-open the named sidecar to check
its identity against the held handle. Staging uses 128 random bits, exclusive
creation and an explicit owner-only descriptor. After exact-byte JSON validation,
write and file flush, `NtSetInformationFile(FileRenameInformation)` replaces the
fixed basename relative to the retained directory. There is no copy/truncate,
read-only override, POSIX-rename fallback or privileged volume flush. Cleanup
addresses the owned staging handle, not a possibly substituted name.

A returned receipt means rename committed. `directory_synced` is always false;
there is no claim of directory-entry durability across power loss. Precommit
failures keep the last good snapshot; a killed process can leave a private orphan
stage that the backend deliberately does not discover or delete.

The format remains exact UTF-8 JSON raw bytes, including unknown fields, duplicate
keys, large integer spelling and whitespace, bounded to 16 MiB on both save and
load. This module is not wired to UI, HTTP, production commands or discovery.

The test-only `Store` is not wired into the server or production
`FoundrySnapshotStore`. Enabling it requires explicit per-instance operation
serialization and a `Send`/`Sync` review: the existing Linux outer mutex is part
of its concurrency contract. Cross-process lock tests alone do not establish
shared-instance safety. Do not add unsafe trait implementations merely to satisfy
server integration.

## Threat boundary and remaining acceptance gates

This is not compare-and-swap against an arbitrary malicious same-user process.
Linux likewise rechecks then calls `renameat`, rather than implementing CAS.
Owner/admin modification of names, ACLs, contents or the system between checks
is not claimed impossible. The Windows acceptance suite must demonstrate that
replacement does not follow destination reparse points to an outside target and
rejects unsafe collisions it encounters before commit.

Native tests are present for exact bytes and boundary, invalid/oversize data,
partial write and precommit failure, live-directory-rename refusal and
close/rename/reopen recovery, hardlinks,
junction/file-symlink/dangling-symlink collisions, strict ACL and foreign owner,
permanent lock, actual child-process contention, two writers with readers,
crash lock release and crash after staging flush. All writable fixtures are
fresh synthetic temporary directories. No security settings or privileges are
changed. File-symlink creation and assigning a foreign owner can be unavailable
under a runner's existing token. These tests fail with an explicit fixture error;
they are not silently skipped or counted as demonstrated acceptance.

Still required before any production proposal:

- Exact-head native Windows execution and independent review of its results.
- Native hostile POSIX lock disposition/rename variants and malformed ACE tests.
- Native denied-local/non-NTFS/remote/case-sensitive fixtures, including unavailable
  query behavior, with no privileged or system-setting setup.
- Testing on the intended Windows versions and token types, not just a CI host.
- Explicit treatment of actual power loss; this prototype promises only an honest
  unconfirmed-directory-sync receipt.

## First native result and corrected platform expectation

Both initial Windows MSVC jobs at exact head
`8c97c4219b9277f7d83ceca1af4ca56a49e2df5d` passed 205 of 206 library tests.
The sole failure was the test expecting a live directory rename to succeed;
Windows returned error 5, `ERROR_ACCESS_DENIED`, at that rename. Both original
failed logs are retained. This was not evidence of snapshot corruption.

The registered **WINNTRENAME10** documentation says a directory cannot be renamed
when it or its subdirectories contains a file with open handles, except for the
stated batch-oplock exception. The held permanent sidecar makes Linux's successful
live-relocation expectation inappropriate here. The corrected test requires the
observed error 5 specifically; it checks unchanged directory and lock identities,
entries, last-good bytes and absent destination, then continued save/load. After
all store handles close, the same rename must succeed and reopening must retain
both identities and exact snapshot bytes. That causal control prevents unrelated
fixture permission failures from passing as protective behavior.

Only the test and this documentation change for the correction. The backend and
its share flags stay byte-identical. This is a documented platform limitation,
not a claim that every hostile same-owner or POSIX rename mechanism is blocked.
A new exact-head native run is still required to validate the corrected test;
the first failures are not relabeled as passes.

## Reproduce and interpret evidence

On a permitted native Windows NTFS test host, from `engineering/apps/atlas-lab`:

```powershell
cargo test --locked --lib foundry_snapshot::windows_experimental -- --test-threads=1 --nocapture
```

Local Linux verification retained outside the source tree: all 14 existing Linux
snapshot tests passed. The actual unchanged production module plus new Windows
tests also passed a standalone `cargo check --tests --target
x86_64-pc-windows-gnu` using Rust 1.99.1's official target standard library and
windows-sys 0.61.2. That checks Windows-target types and generated ABI declarations;
it does not link or execute the native tests, and is not a full application
Windows build. Early failed typechecks were retained, not erased. Final aggregate
and exact-head CI results belong in the release evidence, not inferred here.

## Primary sources

Sources were read on 2026-11-10 and registered in
[`windows-snapshot-prototype-20261110.json`](../../data/sources.d/windows-snapshot-prototype-20261110.json).

- **WINNTCREATEFILE10**: [NtCreateFile](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile), relative root handles and reparse-open behavior.
- **WINNTRENAME10**: [FILE_RENAME_INFORMATION](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/ns-ntifs-_file_rename_information), generated layout, relative basename and replacement restrictions.
- **WINGETSECURITY10**: [GetSecurityInfo](https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo), opened-handle owner/DACL inspection and allocation ownership.
- **WINSYSSNAP0612**: [windows-sys 0.61.2](https://crates.io/crates/windows-sys/0.61.2), pinned generated bindings inspected rather than handwritten ABI.

These documented primitives motivate the prototype; they do not establish its
native correctness, security acceptance or production readiness.
