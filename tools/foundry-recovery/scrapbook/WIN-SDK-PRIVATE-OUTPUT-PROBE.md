# Test-only Windows SDK private publication probe

This probe tests only newly generated files on a GitHub-hosted Windows x64
runner with a local fixed NTFS temporary volume and a normal fixture token.
It accepts no payload, user path or original workspace. It does not install
software, change existing ACLs, enable privileges, or call production code.
It is not the Windows Scrapbook writer, and changes neither the approved
POSIX-only candidate nor the separate duplex I/O probe.

Athena's existing Windows matrix builds with the installed MSVC toolchain
and discovers `test_*cli.py`; this fixture discovers the same installed
toolchain by VSWhere and compiles with its actual SDK headers. No workflow,
manifest, permission or runtime files change. The exact earlier Server 2025
runner used [image 20261116.315](https://github.com/actions/runner-images/blob/win25-vs2026/20261116.315/images/windows/Windows2025-VS2026-Readme.md).
If the compiler, local NTFS, persistent ACLs, ordinary nonreparse path,
fixture SID or expected hold cannot be proven, the hosted test fails.
Self-hosted/personal Windows is outside scope and not a passing test.

The executable keeps directory handles, rejects a real fixture junction
without following it, verifies the exact protected owner-only file and
directory ACL on newly created handles, and tests an SDK-computed
`FILE_RENAME_INFO` with `RootDirectory` and `ReplaceIfExists=FALSE`. It
writes/syncs a same-directory owned stage and independently opens the final
name to verify the object ID, bytes and ACL. It verifies a preexisting and a
deterministic late competing name retain their own original ID and bytes.
The late case uses a separate handle after staging, not an uncontrolled
process-scheduling claim. A simulated abort after a real partial write
disposes only the owned staging handle without creating a destination.
No fallback to replace, absolute rename, or copy if the API refuses.
The synthetic junction and all files live in newly created runner temp
folders; no registry, Developer Mode, ACL of any existing file, or security
setting changes are permitted.

On Linux only the portable fixture-leaf code compiles and runs. The actual
Win32 branch explicitly skips; it is **unverified** until exact hosted
compile and runtime pass. The fixture does not establish cross-principal
denial, power-loss durability, arbitrary/reparse-mutating namespace safety,
installed Windows compatibility, a live profile migration, or deletion
readiness. A failure after a successful rename reports that observed
rename count rather than claiming no file appeared; application rollback is
not in scope. Useful first-party contracts:
[CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew),
[GetSecurityInfo](https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo),
[FILE_RENAME_INFO](https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_rename_info),
and [runner environment variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables).
