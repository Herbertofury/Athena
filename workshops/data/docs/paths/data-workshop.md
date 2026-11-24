# Data & SQL Workshop: From Rows to Reliable Answers

Eight connected lessons use synthetic CSV and actual local SQLite to teach grain, validation, filters, NULL-aware metrics, joins, time series, quality and reproducible reporting.

**Scope:** Actual local SQLite/CSV practice only. No Power BI or external database is used; this is not full PL-300 coverage, exam readiness or production assurance.

## Before you begin

Basic familiarity with files, programs and a terminal helps. Each lesson explains its terms. You can use a text editor and the paper worksheet if Python is unavailable. The optional executable lab needs Python 3.10+ with SQLite 3.37+; it uses no third-party packages. Tested here on Python 3.12.14, SQLite 3.53.1/Linux. Other platforms remain unverified.

There are no timers, accounts, administrator permissions or network targets. Predict first, run only the supplied fixed command, then explain the observation. A negative result is often the intended lesson. These commands execute actual local SQLite and CSV operations on synthetic fixtures. Power BI-specific work remains unexecuted; this is not full PL-300 coverage.

## Eight lessons

1. [Define the question and the row grain](../shared/data-question-grain.md)
2. [Load CSV with explicit types and missing-value rules](../shared/data-csv-types.md)
3. [Filter a population and order it deliberately](../shared/data-filter-population.md)
4. [Calculate counts and averages without erasing missingness](../shared/data-null-metrics.md)
5. [Prevent join fan-out from changing the metric](../shared/data-join-cardinality.md)
6. [Build a complete time series with an explicit window](../shared/data-time-series.md)
7. [Use constraints and rollback to protect the dataset](../shared/data-quality-transactions.md)
8. [Deliver a reproducible analysis with honest limits](../shared/data-explain-deliver.md)

## Practice and reflection

- [Safe offline lab guide](../../labs/data-workshop/README.md)
- [Evidence worksheet and capstone](../../labs/data-workshop/WORKSHEET.md)
- [Answer key](../../labs/data-workshop/ANSWER-KEY.md)
- [Coverage and gaps](../DATA-COVERAGE.md)

The existing Athena lesson schema supports the first check per lesson. All 24 checks are available in these documents and the content data; the 16 supplemental checks need explicit app support before being advertised as interactive. A standalone navigation route also needs integration.
