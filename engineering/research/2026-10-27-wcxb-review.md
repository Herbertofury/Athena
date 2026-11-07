# WCXB: heterogeneous extraction evidence, not a universal collector

Reviewed 2026-10-27; preprint submitted 2026-05-20, not a newly released paper today.
Sources: WCXB01, WCXB02. Status: research only; no dataset download or prototype execution.

The paper reports 2,008 pages from seven categories and 1,613 domains. Its useful
lesson is that article scores conceal much weaker performance on structured
pages. Limitations include predominantly English text, static HTML, weak coverage
of JavaScript-heavy pages, model-assisted annotations and one human adjudicator.
These are not full-gallery, attachment, authorized-account or playable-media tests.

There are checks to resolve before adopting its ranking:

- The paper compares 13 systems while the inspected repository README says 14.
- Its explanation calls the test split more article-heavy, but its own counts
  imply 257/511 = 50.3%, below 793/1497 = 53.0% in development. This inconsistency
  affects that explanation, not automatically every reported result.
- The benchmark author also lists an authored extractor among the systems;
  independent replication is preferable to treating its lead as settled.

The repository declares CC-BY-4.0 and describes its HTML as public-source
snapshots. That is not authorization to bypass restrictions on live sites.
Repository revision reviewed: c039d5ee9f5a3a984a0e167e63aacd04e76e78a9.

## Atlas decision

Keep this as a candidate corpus for permitted text-extraction comparisons. Freeze
revision and metric definitions, evaluate by page type, preserve the complete
source record, and assess media completeness separately. No winner, execution
result or recommendation to another project is claimed.
