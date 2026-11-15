# Native Learning History

Open `/learning` on the loopback Athena engine to browse recorded experiments.
The engine advertises this address in `/api/runtime`; the page links back to the
same Athena home and Engineering workspace. It is a compiled native route, not an
iframe or imported application. Frozen packaged assets are unchanged. A permanent
home-navigation entry remains a separate future integration step.

History is read-only: no new experiment, migration, restore, promotion or external
service request is triggered by browsing. Lists use descending ID keyset pages of
20 records, with bounded summary text. IDs travel as decimal strings so JavaScript
cannot round SQLite integers. Details retain the original evidence/run strings,
with at most 2 MiB each. Legacy journals without a complete run show an explicit
unavailable/unsupported/over-budget state rather than inventing a result.

Retained JSON is displayed verbatim through text nodes, never parsed/reformatted
through JavaScript numbers or inserted as HTML. Selection tokens
prevent a late response replacing a newer choice. A record fragment survives
reload. Existing loopback Host/origin middleware applies; writes are not routed.
Four blocking reads can run concurrently, with SQLite's one-second busy timeout.
This is not a hard I/O/VM deadline or a hostile-database sandbox. The journal must
be the explicitly configured, locally trusted owner journal. Summaries and
recorded decisions are evidence, not automatic authority or proof of intelligence.

Tests cover legacy pagination, unchanged source bytes and missing records. The
actual unified portable browser harness creates a generated offline run before
starting the engine, later visits history after its existing process restart,
adds an explicitly synthetic integer beyond JavaScript precision to its retained
raw run, compares the displayed string byte-for-byte, reloads the record,
and checks invalid cursor/missing record/write refusal. No owner data is used.
Local formatting/JavaScript syntax checks do not substitute for hosted exact-source
Windows/Linux compilation and Chromium acceptance. No migration-retirement or
production-release completeness is claimed.
