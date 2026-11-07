# Athena Programming Workshop

**Small Programs, Clear Contracts** is an original, practical beginner module with eight lessons, 24 reasoning checks, four worked demonstrations and two editable Python projects. Work locally at your own pace. No network service, account, credential or payment is needed.

Open **START-HERE.html** for a complete, self-contained reading guide in a browser, including all lessons, checks, contracts and worksheets. It needs no server, scripts or internet connection. Alternatively, start with the [learning path](docs/paths/programming-workshop.md), then the [project guide](projects/README.md). The complete [coverage statement](docs/PROGRAMMING-COVERAGE.md) separates what this pack teaches from broader programming readiness.

## What you will build

- **Repair Quotes:** validate fictional line items, use exact integer-cents arithmetic, group repeated stock identifiers, parse bounded JSON and format results.
- **Event Summary:** parse a small CSV dataset, validate rows, distinguish duplicate delivery from conflicting identities, aggregate metrics and produce deterministic output.

The starter functions are deliberately unfinished. Implement them in a study copy, using the visible contracts and tests. Separate reference solutions let you compare after trying. The reference passing is not evidence that you completed a starter.

## Quick start

From the extracted pack directory, using Python 3.10 or later:

```sh
python3 --version
python3 examples/trace_total.py
python3 projects/repair_quotes/check.py
```

The third command initially exits with test errors caused by `NotImplementedError`. That is expected. Begin by implementing `format_cents` and `validate_item` in `projects/repair_quotes/starter.py`. Use the detailed guide for milestones and the second project. If your system calls Python `python` or `py -3`, substitute the appropriate launcher. Do not install unrelated tools just to run this pack.

## Verify the supplied material

```sh
python3 projects/repair_quotes/check.py --target reference
python3 projects/event_summary/check.py --target reference
python3 -m unittest discover -s tests -v
```

The final command verifies the distributed references, fixtures, documentation structure, fixed wrappers and intentionally unfinished starters. It is not a learner grade. After you edit a starter, use its project acceptance command; a distribution-integrity test expecting unfinished placeholders may then fail by design.

All examples and exercises are original. Official Python sources are linked in each lesson and registered in [the source record](research/programming-sources.json). Tested on Python 3.12.14/Linux. Other Python versions and operating systems are not verified. This is a bounded offline foundation, not a certification, full programming course or production security assessment.
