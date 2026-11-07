# Systems Workshop: Observe, Change, Recover

Eight applied lessons connect system state, files, owned processes, capacity, safe configuration, dependencies, durable records and troubleshooting.

**Scope:** An applied computing foundation, not complete A+, RHCSA or professional administration readiness. Actual exercises touch only newly created temporary files, a temporary SQLite database and fixed child processes owned by the lab. No real system configuration is changed.

## Before you begin

Basic familiarity with files, programs and a terminal helps. Each lesson explains its terms. You can use a text editor and the paper worksheet if Python is unavailable. The optional executable lab needs Python 3.10 or later, including sqlite3; it uses no third-party packages. Tested here on Python 3.12.14/Linux. Other platforms remain unverified.

There are no timers, accounts, administrator permissions or network targets. Predict first, run only the supplied fixed command, then explain the observation. A negative result is often the intended lesson.

## Eight lessons

1. [Know the system before changing it](../shared/sys-baseline-contract.md)
2. [Follow a path to the bytes it names](../shared/sys-paths-bytes.md)
3. [Start work, prove readiness, stop cleanly](../shared/sys-process-readiness.md)
4. [Budget storage without mixing units](../shared/sys-capacity-headroom.md)
5. [Validate a change before making it active](../shared/sys-config-transactions.md)
6. [Order jobs and bound retries](../shared/sys-dependencies-retries.md)
7. [Keep a work record through failure and reopen](../shared/sys-durable-database.md)
8. [Resolve a systems incident from layered evidence](../shared/sys-diagnose-evidence.md)

## Practice and reflection

- [Safe offline lab guide](../../labs/systems-workshop/README.md)
- [Evidence worksheet and capstone](../../labs/systems-workshop/WORKSHEET.md)
- [Answer key](../../labs/systems-workshop/ANSWER-KEY.md)
- [Coverage and gaps](../SYSTEMS-COVERAGE.md)

The existing Athena lesson schema supports the first check per lesson. All 24 checks are available in these documents and the content data; the 16 supplemental checks need explicit app support before being advertised as interactive. A standalone navigation route also needs integration.
