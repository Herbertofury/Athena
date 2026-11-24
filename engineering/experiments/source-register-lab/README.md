# Additive source-register verification

2026-10-28. The existing 1,156-row baseline register remains byte-identical. One indexed addition brings the aggregate to 1,157 sources. Both known production readers, the research checker and Explorer builder, use the shared loader. The adapter wiki exporter and signal refresher were inspected and do not read this register.

Eight focused tests cover complete row/order/unknown-field preservation, duplicate-ID rejection, malformed/contradictory JSON, repository path containment, exact manifest enumeration, Windows path normalization and the actual full register. Full local checks passed 103 Python tests in normal and optimized modes and 173 JavaScript tests.

The actual 215-entry Explorer bundle remains identical before and after the loader change, including all imported retained measurement cohorts. Its 495,951-byte canonical representation has the same SHA-256. A complete build using the current public templates and stack guide also preserves every output and input document byte across both implementations. [Bundle parity](explorer-parity.json) and [12-file build/input comparison](explorer-build-parity.json).

New citations use small additive files instead of replacing the whole catalog. This changes source-registration maintenance, not measured application performance. External consumers reading only the legacy file must adopt the index before claiming complete future coverage. [Format and consumer contract](../../docs/source-register-layout.md). No other project is modified.
