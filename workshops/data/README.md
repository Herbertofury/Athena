# Athena Data & SQL Workshop

**From Rows to Reliable Answers** is an original eight-lesson foundation with 24 explained checks and eight runnable SQLite/CSV exercises. It teaches how to ask a precise question, preserve row grain, validate input, handle NULLs, avoid join fan-out and deliver reproducible results.

Open **START-HERE.html** for a self-contained, script-free guide with all lessons, SQL examples, instructions, worksheet and answer key. Alternatively, use the [learning path](docs/paths/data-workshop.md) and [lab guide](labs/data-workshop/README.md).

## Actual local practice

These exercises execute real SQLite queries on synthetic CSV data in a fresh in-memory database. The quality lab performs a real transaction rollback. The export lab writes and reads a CSV inside an owned temporary directory, then cleans it up. No existing database, account, personal data or external service is used.

Requirements: Python 3.10+ with SQLite 3.37+ for STRICT tables. Only standard-library modules are needed. Tested on Python 3.12.14 with SQLite 3.53.1 on Linux; other versions and operating systems remain unverified.

```sh
python3 -c "import sqlite3; print(sqlite3.sqlite_version)"
python3 labs/data-workshop/run_lab.py metrics
python3 labs/data-workshop/run_lab.py joins
python3 -m unittest discover -s tests -v
```

The guide provides all eight commands and paper alternatives. If your SQLite version is too old or Python is unavailable, study the SQL and worksheet without claiming execution. Do not connect a production database as a workaround.

**This is not full PL-300 coverage or exam readiness.** No Power BI Desktop/service, Power Query, DAX, report publishing, refresh or security workflow was executed. The [coverage statement](docs/DATA-COVERAGE.md) lists those gaps. All examples and checks are original; [official sources](research/data-sources.json) support the language/library behavior and broader study boundaries.
