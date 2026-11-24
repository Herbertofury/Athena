# Data & SQL coverage and gaps

## Included and actually executed

Eight lessons cover question/metric contracts, grain, typed CSV ingestion, fixed UTC filters, ordering, NULL-aware aggregates, ratios, dimensions/relationships, left joins, fan-out, preaggregation, calendar completeness, a cumulative window function, constraints, explicit transactions and reproducible export.

Eight fixed commands execute real local SQLite operations on synthetic fixtures. The quality command performs and verifies a transaction rollback. The export command writes/reads a temporary CSV and verifies cleanup. This is not simulated SQL. It remains bounded local practice, not production workload evidence.

The pack includes 24 original explained checks, complete SQL files, a data dictionary, worksheet/capstone, answer key and script-free offline guide. Eleven official SQLite, Python and Microsoft sources were opened on 2026-11-07. Examples and tests are original rather than copied exam material.

## What the dataset cannot answer

There is no closure timestamp, historical status sequence, SLA target, real collection process or representative business sample. The main measure concerns closed snapshot statuses among tickets opened in a specified interval. It cannot establish closures during that interval, resolution time, causation, statistical significance or real team performance. Work-minute and touch-minute measures are deliberately separate.

## Not full PL-300 coverage

The official study guide includes Power BI-specific preparation, modeling, visualization/analysis, management and security, with Power Query and DAX skills. This pack provides transferable data/SQL foundations only. It has no objective-by-objective completeness claim, readiness score, official assessment or certification status.

**Unexecuted:** Power BI Desktop/service, Power Query transformations, DAX/filter context, semantic-model implementation, DirectQuery/Import/DirectLake behavior, report/dashboard creation, refresh/gateway setup, publishing, workspace sharing, row-level security and administration. No account, license, permission or external connection was configured.

Other gaps include production ingestion, large-data optimization, indexing/query plans, concurrent writers, crash durability, warehouse history, deeper dimensional modeling, statistics and comprehensive visualization/accessibility practice.

## Verification boundaries

Tested on Python 3.12.14 with SQLite 3.53.1/Linux. Python 3.10+ and SQLite 3.37+ are design requirements; other combinations are not verified. The SQL dialect is SQLite, not a promise of portability to SQL Server, PostgreSQL or DAX. STRICT tables still allow applicable conversions; Python source validation remains separate.

Isolated DOM checks verify content compatibility and static guide structure, not real-browser rendering or screen-reader behavior. Current Athena shows one primary check per lesson; 16 supplemental checks and worked SQL snippets need explicit UI support. A distinct path route also needs integration. Nothing is claimed published.
