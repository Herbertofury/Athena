# Data dictionary and executable contracts

## Provenance and time basis

All data is synthetic. The invented snapshot label is 2026-11-05T00:00:00Z. Main cohort: opened_at ≥ 2026-11-01T00:00:00Z and < 2026-11-03T00:00:00Z. The daily exercise alone ends at 2026-11-05T00:00:00Z. Status and cumulative work describe the snapshot, not events that necessarily occurred inside the opening interval. No resolution timestamp, SLA target or status history is available.

## Tables and grain

- queues: one descriptive row per queue_id. `queue_id` matches Q- followed by one uppercase ASCII letter; queue_name is unique, nonempty descriptive text.
- tickets: one current-state row per ticket_id, matching T- plus three ASCII digits. queue_id must refer to queues. opened_at is a valid fixed-width UTC timestamp `YYYY-MM-DDTHH:MM:SSZ`. status is open or closed. work_minutes is a nullable integer from 0 through 1440. summary is nonempty text. Work is a recorded ticket-level measure, not resolution duration.
- touches: one interaction per touch_id, matching X- plus three ASCII digits. ticket_id refers to tickets. minutes is a non-null integer from 0 through 1440. These interaction minutes are separate measurements, not required to equal ticket work.
- calendar: one row for each UTC date November 1–4, 2026. This is a finite fixture, not a global date dimension.

Queues and tickets have a one-to-many relationship. Tickets and touches also have one-to-many potential. Some queues have no cohort tickets; some tickets have no touches. Every identifier must be unique within its own table, but identical numeric measurements across different tickets are legitimate.

## CSV ingestion

`parse_csv(kind, text)` supports only queues, tickets and touches, with exact headers and column order shown in the fixtures. Input is a string of at most 32768 UTF-8 bytes and at most 1000 data rows. The CSV reader uses strict mode and newline-preserving input. Malformed CSV reported by that reader, extra/missing columns and duplicate primary identifiers are rejected with ValueError. A normal final newline is not an empty extra record; an actual blank data record is invalid. Header-only input is permitted.

Fields begin as text. Minutes must be 1–4 ASCII digits and convert to an integer in 0–1440. Signs, spaces, decimals, non-ASCII digits and literal NULL are rejected. Only ticket work_minutes may be empty, mapping to None/SQL NULL. Zero remains zero. Labels are 1–100 trimmed characters with no U+0000–U+001F controls; quoted internal commas are valid. Timestamps must have valid calendar dates and exact UTC Z format; mixed offsets or fractional seconds are not accepted.

The parser validates one file’s shape and values. Cross-file foreign-key relationships are checked by SQLite during loading. It does not silently discard or impute rows. These are teaching-schema rules, not a universal CSV convention or a public upload security boundary.

## SQLite construction and lifetime

Requires SQLite 3.37+ for STRICT tables. `connect()` creates only `:memory:`, enables/verifies foreign keys and loads the bundled schema. `load_database()` parses the fixed fixtures and loads them in one explicit transaction. A failure rolls the load back and closes the connection. Every CLI command uses a fresh database and closes it in a finally block. No existing database is opened.

STRICT tables still allow applicable lossless type conversions; they do not replace source-text validation. The schema checks primary/foreign keys, allowed status and minute bounds. Calendar validation is performed by the Python parser, not a comprehensive SQL date constraint.

## Queries and parameters

`query(conn, name, window)` accepts only filters, metrics, groups, joins_naive, joins_correct or dates. Query files are fixed, trusted source capped at 8192 bytes. Window contains exactly start and end, both valid canonical UTC timestamps with start < end. Values are bound separately; they are not concatenated into SQL.

The dates query additionally requires midnight boundaries and an interval contained in November 1 through November 5 exclusively. It uses the four-row calendar. Other queries can evaluate any valid interval against the fixed dataset. Output is a list of dictionaries. Filters have explicit opened_at/ticket_id order; groups sort by queue_name/queue_id; dates sort by day.

The templates are trusted teaching code, not a sandbox for arbitrary SQL. Do not add ATTACH, external connections, extension loading or user-file operations. The CLI accepts no arbitrary SQL or file path.

## Metrics and missingness

COUNT(*) counts selected ticket rows; COUNT(work_minutes) counts observed non-NULL measurements, including zero. Work sum/mean use observed values only. Empty population counts are zero; work sum, mean and closed_share are NULL. closed_share uses closed snapshot statuses divided by cohort tickets, with an undefined result for zero denominator. It is not an in-period closure flow, SLA percentage or resolution-time measure.

The groups query preserves all queues with a LEFT JOIN and date conditions in ON. Training’s zero matched tickets do not make its absent work sum/mean/rate zero. The naive join is intentionally wrong for summing ticket-level work. The corrected join preaggregates touches to one row per ticket.

## Quality and export exercises

`quality_demo` makes and explicitly rolls back an invalid two-row batch inside the owned in-memory database. The first valid insert must not remain. It verifies foreign-key enforcement, unchanged row count, no relationship violations and structural integrity. It does not prove business truth, crash safety or concurrent-writer behavior.

`export_demo` runs the queue query and uses a standard CSV writer inside a new owned temporary directory. It rereads the output as text, verifies each field against the documented string conversion, and cleans up the directory. None becomes an empty field; numeric values become text. This is a verified practice export, not a persistent output report or unknown-spreadsheet sanitizer.
