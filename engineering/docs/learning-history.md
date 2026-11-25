# Native Learning History

Open `/learning` on the loopback Athena engine to browse recorded experiments.
The engine advertises this address in `/api/runtime`; the page links back to the
same Athena home and Engineering workspace. It is a compiled native route, not an
iframe or imported application. The main navigation offers a Learning History link
only at the exact native origin `http://127.0.0.1:41379`, after a bounded read of
the engine's same-origin capability. A missing or invalid capability leaves other
navigation usable and adds no link. Public Pages, local files, and other origins
do not make this discovery request. Opening the link navigates to the read-only
native page; discovery does not start an experiment.

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

## Explicit bounded execution

The Run bounded experiment button reuses the existing reviewed submission module
and fixed DedupExperiment queue job. Nothing starts on page load. The queue still
coalesces identical active jobs and retains its existing admission bound. A lost
receipt remains uncertain: the button stays disabled rather than automatically
resubmitting. Once accepted, this page polls a small read-only status endpoint up
to 60 times at one-second intervals, each read with an eight-second fetch deadline.
This is bounded observation, not a cancellation deadline. Navigation or a polling
failure does not cancel the job; the user is directed to Engineering Overview.

Dedup jobs now append the complete bounded runner output atomically with its
experiment evidence using the existing Journal record_run method. Cancelled runs
are retained too; a journal failure reports failure and preserves raw evidence in
the job result rather than inventing a history link. No automatic promotion occurs.
The detail endpoint returns only matching Dedup job state and exact string IDs,
not arbitrary job payloads. The browser test clicks the button, verifies one new
retained result and reopens that exact raw result after another engine restart.

Browser fault checks also cover a repeated click, an accepted request whose receipt
is deliberately lost, and an accepted job whose status read is deliberately lost.
These checks assert no automatic resubmission and a disabled uncertain-action
button. They do not prove exactly-once execution across a process crash: existing
lease recovery may rerun a job if the engine stops between journal commit and job
completion. The maximum polling duration can approach nine minutes when reads
reach their deadlines; it is not a 60-second wall-clock deadline.
