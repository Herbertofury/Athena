# Safe offline Systems Workshop

This workshop uses invented data and disposable resources. It does not inspect your real services, read personal files, access the network, manage accounts, change security settings, install a scheduler or alter disks.

## Requirements

Python 3.10 or later with the sqlite3 standard-library module. No package installation is needed. The preparation environment used Python 3.12.14 and SQLite 3.53.1 on Linux. Windows/macOS execution has not been verified. A restricted environment may prohibit child processes; if so, use the paper alternative and report that command as unrun. Do not bypass the restriction.

Run commands from the extracted pack or integrated repository root:

```sh
python3 labs/systems-workshop/offline_lab.py files
python3 labs/systems-workshop/offline_lab.py process
python3 labs/systems-workshop/offline_lab.py capacity
python3 labs/systems-workshop/offline_lab.py config
python3 labs/systems-workshop/offline_lab.py dependencies
python3 labs/systems-workshop/offline_lab.py database
python3 labs/systems-workshop/offline_lab.py incident
```

On Windows with the Python launcher, `py -3` may replace `python3`; that platform remains untested. Do not add a hostname, user path, PID, shell command or credentials. The CLI rejects extra arguments.

## Exactly what runs

- **files:** creates a fresh temporary directory, writes five-character/six-byte synthetic UTF-8 text, reads and copies it, observes metadata and expected absence, then removes only its own directory.
- **process:** creates only fixed Python children owned by the wrapper. Uses local pipes, no socket or shell. Exercises a normal response, a deliberate exit status 7 and a short timeout. Timeout cleanup kills and waits only for that exact owned child. The parent environment is not copied into children; Windows may receive only SystemRoot for interpreter startup.
- **capacity:** integer arithmetic on two synthetic storage cases. It does not measure, fill or resize your disk.
- **config:** actual validation, dry run, staging, file replacement, no-op and rollback inside a fresh temporary directory. The failure is injected before replacement, not a simulated power cut. No real application settings are touched.
- **dependencies:** pure dependency ordering, cycle rejection and retry decisions. No scheduler, delay loop or network retry is run.
- **database:** actual SQLite transactions, payload-aware deduplication, deliberate rollback, backup, close/reopen and checks, all inside a fresh temporary directory. No production database is opened.
- **incident:** correlates supplied invented events and receipts. No live logs or processes are inspected.

Each command outputs JSON with explicit result and scope fields. Exit 0 means the wrapper completed its intended demonstration; individual negative outcomes can be correct. The failed child’s status 7, a capacity shortfall and an invalid configuration are expected teaching cases.

## Before and after

Read the short source if you want to see exactly what executes. Predict the outcome in the worksheet, run one command, and preserve the observation. A repeated run creates independent resources. It does not depend on a previous run’s temporary files. Cleanup is automatic for the created resources; do not run separate deletion commands against your own directories.

If interrupted by an environment crash, automatic cleanup may not finish. Do not delete unfamiliar temporary files. The normal-run receipts test cleanup only for this program’s created objects; they do not guarantee cleanup after every operating-system failure.

## Paper-only alternative

Open the fixture JSON as text and calculate capacity, dependencies and job reconciliation by hand. For real file/process/config/database exercises, predict the expected outputs and compare with the answer key. Mark this as paper practice, not an executed system test. Nothing requires a paid VM or changing your current machine.

## Optional pack validation

```sh
python3 scripts/render_systems_pack.py
python3 -m unittest discover -s tests -p 'test_systems_workshop.py' -v
```

Tests execute the same bounded temporary operations and owned child processes. They do not launch a browser or touch the active Athena project. If your environment disallows subprocesses, report that limitation rather than weakening the tests.

## Accessibility and safety

All material is plain text with headings, numbered steps and explicit labels. No color-only result, drag operation, audio, timer or mouse-only interaction is required. Independent screen-reader and accessibility conformance review remains open. Stop if an adaptation asks for real credentials, privileged settings, personal files, remote targets or destructive operations; that is outside this workshop.
