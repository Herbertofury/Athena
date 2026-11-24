# Data & SQL Workshop: From Rows to Reliable Answers

Eight connected lessons use synthetic CSV and actual local SQLite to teach grain, validation, filters, NULL-aware metrics, joins, time series, quality and reproducible reporting.

Actual local SQLite/CSV practice only. No Power BI or external database is used; this is not full PL-300 coverage, exam readiness or production assurance.

## Prerequisites

- [Data cleaning and reproducible transformations](shared-data-quality)
- [Star schemas, relationships and DAX context](shared-data-model)
- [Databases, transactions and durable data](shared-databases)

## Ordered workshop

1. [Define the question and the row grain](shared-data-question-grain)
2. [Load CSV with explicit types and missing-value rules](shared-data-csv-types)
3. [Filter a population and order it deliberately](shared-data-filter-population)
4. [Calculate counts and averages without erasing missingness](shared-data-null-metrics)
5. [Prevent join fan-out from changing the metric](shared-data-join-cardinality)
6. [Build a complete time series with an explicit window](shared-data-time-series)
7. [Use constraints and rollback to protect the dataset](shared-data-quality-transactions)
8. [Deliver a reproducible analysis with honest limits](shared-data-explain-deliver)

## Offline practice

Download the workshop ZIP from the app, extract it and read its README before running any command. Run commands from that extracted workshop folder. The app does not execute Python or SQL, and a read mark is not lab evidence.

Source and editable exercises: [workshop folder](https://github.com/Herbertofury/Athena/blob/main/workshops/data/README.md).

## Primary-source register

- [https://www.sqlite.org/lang_select.html](https://www.sqlite.org/lang_select.html)
- [https://www.sqlite.org/lang_aggfunc.html](https://www.sqlite.org/lang_aggfunc.html)
- [https://www.sqlite.org/nulls.html](https://www.sqlite.org/nulls.html)
- [https://docs.python.org/3.12/library/sqlite3.html](https://docs.python.org/3.12/library/sqlite3.html)
- [https://docs.python.org/3.12/library/csv.html](https://docs.python.org/3.12/library/csv.html)
- [https://www.sqlite.org/foreignkeys.html](https://www.sqlite.org/foreignkeys.html)
- [https://www.sqlite.org/lang_transaction.html](https://www.sqlite.org/lang_transaction.html)
- [https://www.sqlite.org/lang_datefunc.html](https://www.sqlite.org/lang_datefunc.html)
- [https://www.sqlite.org/stricttables.html](https://www.sqlite.org/stricttables.html)
- [https://learn.microsoft.com/en-us/power-bi/guidance/star-schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)
- [https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300)
