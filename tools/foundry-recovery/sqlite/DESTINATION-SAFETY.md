# New destination safety · 2026-11-15

A new SQLite destination requires all four names to be absent: the main file and
its `-wal`, `-shm`, and `-journal` siblings. Existing recovery state is preserved;
choose a different output name rather than deleting it.

The production preparation helper and portable launcher's create, backup and
upgrade-to-new-copy operations now check this family before work and immediately
before publishing. `lexists` also detects dangling symlinks. Exclusive main-file
creation/linking remains in place, so an existing main file is never overwritten.
These checks require trusted private directories. They are not an atomic family
reservation and do not protect against a hostile concurrent directory writer.
No claim is made that previously produced backups or user data were corrupted.

## Evidence and limits

Baseline `c8ecdfb3682f8912b241c9154de533d6a6beb6ff`, Python SQLite 3.53.1:
three disposable standalone source tests each published a new main file beside a
pre-existing synthetic destination WAL, SHM or rollback-journal sentinel. Source
and sentinel bytes remained unchanged. The resulting mixed destination was not
opened in SQLite. This demonstrates the missing publication guard, not a
reproduced recovery attack or user-data compromise.

After the change, local Linux checks passed:

- 15 SQLite helper tests, including initial/late sidecar refusal, dangling links,
  source preservation, handle cleanup and the existing pre-open WAL runtime gate.
- 3 portable publication-boundary tests, with subcases for create, backup and
  upgrade, each recovery suffix and late appearance. Native status is mocked;
  these do not establish native executable or packaged Windows acceptance.

Commands:

```sh
python -m unittest discover -s tools/foundry-recovery/sqlite -v
python -m unittest discover -s native/foundry/tests -p test_destination_state.py -v
```

The production Python SQLite <3.54.0 WAL rejection from #226 is unchanged. This
change does not invoke or promote the isolated native staged-WAL candidate.
Full hosted Windows/Linux package and native regression results must be verified
for the proposed commit before merge. No source repository or saved data is
removed by this change.

Initial hosted Windows run `43723295164` failed on test-fixture cleanup with
WinError 32: the Python transaction context did not close its SQLite connection.
The synthetic fixture now explicitly closes it with `contextlib.closing`; no
assertion or production guard was weakened. Ubuntu and learning checks passed
that initial head. Both operating systems must pass again at the corrected head.
