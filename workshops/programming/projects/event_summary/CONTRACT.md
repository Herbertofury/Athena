# Event Summary: exact contract

Summarize a bounded synthetic event dataset. This is not telemetry collection, production monitoring, a log-upload service or a distributed delivery guarantee. All three functions return data, do not print or read files and leave caller-owned inputs unchanged. Invalid input raises `ValueError` (including subclasses); exact wording is not required.

## validate_event(event)

Input is a dictionary with exactly `event_id`, `label`, `duration_ms`, `status`.

- `event_id`: string matching `EVT-` followed by 3–6 ASCII digits. No case conversion or trimming.
- `label`: Python string with 1–40 characters, no leading/trailing whitespace and no characters U+0000 through U+001F. This is a deliberately narrow character policy, not a general Unicode sanitization rule. Internal ordinary spaces and commas are allowed. Length counts Python string characters, not encoded bytes or displayed glyphs.
- `duration_ms`: exact Python `int` from 0 through 600000 inclusive. Booleans, floats and numeric strings are rejected by this function.
- `status`: exactly the string `ok` or `failed`.

Return a new flat dictionary containing the four normalized fields. No data transformation beyond the separately specified CSV duration conversion is performed.

## parse_events_csv(text)

Input is a string of at most 16384 UTF-8 bytes, inclusive. Use the standard CSV reader with strict parsing enabled and newline-preserving text input. The first record must be exactly these columns in this order:

```csv
event_id,label,duration_ms,status
```

At most 200 data records are allowed. Each has exactly four fields. Duration text must be 1–6 ASCII digits, then convert to integer and validate the row. Leading zeros are allowed; signs, surrounding spaces, decimals, exponent notation and non-ASCII digits are not. The numeric upper bound remains 600000. A correctly quoted comma is part of the label, not a fifth field. CSV syntax failures reported by the strict reader are rejected. This does not claim to implement every possible external CSV dialect or RFC rule.

Header-only input is valid and returns `[]`. Empty input, wrong header order, extra or missing columns and blank data records are rejected. A normal final line terminator is not an extra blank record. A byte order mark is not silently removed from the exact header. Do not replace parsing with `split(',')`.

## summarize_events(events, slowest_limit=3)

Input is a list of at most 200 events, each validated. `slowest_limit` is an exact integer from 0 through 10 inclusive. Default is 3; booleans are rejected.

An identical normalized event with the same ID is repeated delivery of one logical event. Count it only once in all event metrics. The same ID with any different normalized field is a conflict and raises `ValueError`. Do not silently overwrite conflicting content. Duplicate counting applies only to event IDs in this project, not quote SKUs.

Return a dictionary with:

- `input_rows`: count of supplied rows.
- `unique_events`: count of distinct valid event IDs.
- `duplicate_rows`: input_rows minus unique_events.
- `successes` and `failures`: counts across unique events.
- `total_duration_ms`: sum across unique events.
- `mean_duration_ms`: total divided by unique count using ordinary Python division, or `None` for no events. The float is an approximate summary, not an exact currency amount.
- `by_label`: list of dictionaries with `label`, `events`, `failures`, `duration_ms`, computed from unique events, sorted by ordinary Python string order of label, not locale collation.
- `slowest`: up to slowest_limit dictionaries with `event_id`, `duration_ms`. Sort descending by duration, then ascending by event ID. A limit of 0 returns an empty list.

Empty input has zero counts and total, `None` mean and empty group/slowest lists. Reversing input preserves the full result. Each call creates fresh accumulators; inputs and earlier results remain unchanged.

## Fixture and checkpoints

The five data rows include an identical repeat of EVT-001. Four unique durations are 100, 400, 200 and 100 ms: total 800, mean 200.0. Three unique events succeed, one fails. The slowest default IDs are EVT-002 (400), EVT-003 (200), EVT-001 (100); EVT-001 wins its tie with EVT-004.

Groups in order: inspection, 1 event/1 failure/400 ms; repair, 2 events/0 failures/200 ms; repair, detail, 1 event/0 failures/200 ms. The last label contains a comma.

Milestones: (1) validate, (2) parse and convert, (3) establish identity, (4) aggregate, (5) order deterministically, (6) pass the 23 visible tests and explain an additional meaningful case. Tests include multiple subcases.
