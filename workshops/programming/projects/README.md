# Project guide: predict, implement, test, explain

These projects teach programming by making you implement functions, not only run a demonstration. Both use synthetic data bundled with the pack. They require Python 3.10 or later and no packages beyond its standard library. Commands below start in the extracted pack directory.

## Safe working boundary

Make a study copy of the pack and edit only your own starter and optional new test files. Do not supply personal files, credentials or real financial data. The supplied wrapper reads only the two fixed fixture names and prints JSON; it has no arbitrary path or network option. The JSON round-trip example creates a private temporary directory and cleans up only its own file. No command changes OS settings, installs anything, scans targets or touches production services.

Python runs with your normal account permissions. Importing the editable starter executes Python code; the runner is **not a sandbox**. Review your edits and never paste untrusted code into the starter or tests. No administrator command is needed. The supplied functions perform pure transformations; the runner owns the small amount of file I/O.

If Python is unavailable, trace the fixtures on paper using the worksheet and answer key. Clearly label those results as predictions rather than execution. Stop when an error is unclear; do not bypass OS protections to make an exercise run.

## Project 1: Repair Quotes

1. Read the [contract](repair_quotes/CONTRACT.md). Predict the three line subtotals and group totals before running anything.
2. Open `projects/repair_quotes/starter.py`. Implement `format_cents`, then `validate_item`. Keep return values separate from printing.
3. Run `python3 projects/repair_quotes/check.py`. Initially some or all tests will error. Read the named assertion and traceback; focus on the functions you have implemented.
4. Implement `quote_total`, including empty input, grouping, ordering and no mutation.
5. Implement `parse_quote_json`, including the duplicate-key and nonstandard-number hooks. Use the official JSON reference linked in the lesson.
6. Run all 21 visible acceptance tests, then the fixture command:

```sh
python3 projects/repair_quotes/check.py
python3 scripts/run_project.py repair_quotes
```

The fixture output must include `subtotal_cents: 4997`, `unit_count: 6`, `line_count: 3`, and `display_subtotal: "49.97"`. The BRUSH group has 3 units/1497 cents; FILTER has 3 units/3500 cents. The JSON key order is not semantically important, but the group-list order is specified.

**Hints, not the solution:** start with exact keys and types; compute each line once; initialize accumulators outside the loop; sort only when constructing output; reject invalid input rather than inventing a default value. Use `object_pairs_hook` when decoding JSON to detect duplicate member names before a dictionary loses that information.

## Project 2: Event Summary

1. Read the [contract](event_summary/CONTRACT.md). Count delivered rows separately from unique IDs.
2. Implement `validate_event`, then `parse_events_csv`. Use the CSV library rather than splitting on commas; one label contains a quoted comma.
3. Implement `summarize_events`: build a dictionary keyed by event ID, reject conflicting content and calculate aggregates from unique events.
4. Make output order explicit. The tie-breaker for equal duration is ascending event ID.
5. Run all 23 visible acceptance tests, then the fixture command:

```sh
python3 projects/event_summary/check.py
python3 scripts/run_project.py event_summary
```

Expect 5 input rows, 4 unique events, 1 duplicate row, 3 successes, 1 failure, total duration 800 ms and mean 200.0 ms. The slowest IDs are EVT-002, EVT-003, EVT-001. Empty input has mean `null` in JSON (`None` in Python), not zero.

**Hints:** define identity before deduplication; equality of normalized full event dictionaries distinguishes a repeated delivery from a conflict; group only the distinct events; a sort key can express descending duration and ascending ID; use `/` rather than `//` for the mean.

## Reference solutions and four demonstrations

Try first, then consult only the reference function you need. Record which parts you consulted. Compare behavior and explain it rather than copying blindly.

```sh
python3 projects/repair_quotes/check.py --target reference
python3 projects/event_summary/check.py --target reference
python3 scripts/run_project.py repair_quotes --implementation reference
python3 scripts/run_project.py event_summary --implementation reference
python3 examples/trace_total.py
python3 examples/aliasing_demo.py
python3 examples/bug_hunt.py
python3 examples/json_roundtrip.py
```

The check commands return exit code 0 when all tests pass and 1 when any fail. The fixed project wrapper returns 2 for an unfinished starter or rejected fixture input. Unexpected programming exceptions are not silently treated as valid data. The bug demonstration prints evidence of a known faulty mean and its correction; it does not make the entire pack's test suite intentionally fail.

## How to debug without weakening the contract

Preserve the failing input. Say what you expected and why, what happened, and your smallest explanation. Change one cause and rerun the focused case plus the full suite. Do not change an expected result only to match your implementation. If the specification itself appears wrong, write down the conflict before changing both.

Add a new test in your own file. The `specs.py` modules expose `make_suite(candidate)` so their same contract can test either implementation. For a portfolio extension, keep the original tests unchanged and add a clearly named new test for the new requirement.

Use the [worksheet](WORKSHEET.md) to record actual commands and outputs. The [answer key](ANSWER-KEY.md) explains core predictions without replacing the implementation exercise.
