# Systems Workshop: Observe, Change, Recover

Eight applied lessons connect system state, files, owned processes, capacity, safe configuration, dependencies, durable records and troubleshooting.

An applied computing foundation, not complete A+, RHCSA or professional administration readiness. Actual exercises touch only newly created temporary files, a temporary SQLite database and fixed child processes owned by the lab. No real system configuration is changed.

## Prerequisites

- [Operating systems, processes and services](../shared/os-processes.md)
- [Files, identities and least privilege](../shared/files-permissions.md)
- [Shell pipelines and safe automation](../shared/shell-data.md)
- [Databases, transactions and durable data](../shared/databases.md)

## Ordered workshop

1. [Know the system before changing it](../shared/sys-baseline-contract.md)
2. [Follow a path to the bytes it names](../shared/sys-paths-bytes.md)
3. [Start work, prove readiness, stop cleanly](../shared/sys-process-readiness.md)
4. [Budget storage without mixing units](../shared/sys-capacity-headroom.md)
5. [Validate a change before making it active](../shared/sys-config-transactions.md)
6. [Order jobs and bound retries](../shared/sys-dependencies-retries.md)
7. [Keep a work record through failure and reopen](../shared/sys-durable-database.md)
8. [Resolve a systems incident from layered evidence](../shared/sys-diagnose-evidence.md)

## Offline practice

Download the workshop ZIP from the app, extract it and read its README before running any command. Run commands from that extracted workshop folder. The app does not execute Python or SQL, and a read mark is not lab evidence.

Source and editable exercises: [workshop folder](../../workshops/systems/README.md).

## Primary-source register

- [Python 3.12 pathlib: platform-aware paths](https://docs.python.org/3.12/library/pathlib.html)
- [Linux kernel: pathname lookup](https://docs.kernel.org/filesystems/path-lookup.html)
- [Python 3.12 os: filesystem operations and replacement semantics](https://docs.python.org/3.12/library/os.html)
- [Python 3.12 tempfile: scoped temporary resources](https://docs.python.org/3.12/library/tempfile.html)
- [Python 3.12 subprocess: communication, timeouts and process lifecycle](https://docs.python.org/3.12/library/subprocess.html)
- [Microsoft Win32 SERVICE_STATUS: service states](https://learn.microsoft.com/en-us/windows/win32/api/winsvc/ns-winsvc-service_status)
- [Python 3.12 json: parsing hooks and input considerations](https://docs.python.org/3.12/library/json.html)
- [Python 3.12 graphlib: dependency/topological ordering concepts](https://docs.python.org/3.12/library/graphlib.html)
- [Python 3.12 sqlite3: transactions, connection and backup APIs](https://docs.python.org/3.12/library/sqlite3.html)
- [SQLite: transaction control and rollback](https://www.sqlite.org/lang_transaction.html)
- [SQLite: backup API and snapshot copying](https://www.sqlite.org/backup.html)
- [Python 3.12 logging: event records and configured destinations](https://docs.python.org/3.12/library/logging.html)
