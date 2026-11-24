# Athena Systems Workshop

Eight applied lessons, 24 original checks and seven safe offline commands help you understand how to observe, change and recover a small system. No accounts, network targets, administrator access or paid services are needed.

Start with [the learning path](docs/paths/systems-workshop.md), [offline lab guide](labs/systems-workshop/README.md), [worksheet](labs/systems-workshop/WORKSHEET.md) and [coverage limits](docs/SYSTEMS-COVERAGE.md).

This is a standalone foundation, not complete A+, RHCSA or professional administrator readiness. Real local exercises use only new temporary files, an invented SQLite database and fixed child processes owned by the lab. Other data is synthetic. There are no changes to your existing applications, accounts, network or disks.

## Optional validation

```sh
python3 scripts/render_systems_pack.py
python3 -m unittest discover -s tests -p 'test_systems_workshop.py' -v
```

Python 3.10 or later, including sqlite3, is required for executable work. No extra packages are needed. Use the paper alternative if your environment blocks subprocesses; do not bypass its restrictions. Platform and verification limits are recorded in the coverage page and lab guide.
