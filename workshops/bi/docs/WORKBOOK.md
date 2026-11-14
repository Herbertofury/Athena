# Athena Power BI conceptual workshop

Pack key: bi. Lesson path: bi-workshop. Eight 45-minute lessons.

All runnable exercises are fixed local Python teaching models. They execute no Power BI, M, DAX, gateway or authorization system. The code prints JSON and writes no files under the supplied lab contract. Run from the extracted pack, choose one named command, and never substitute an arbitrary data path. Only synthetic data is used.

The eight commands are transform, model, context, dates, report, refresh, access and capstone. Each is invoked as python3 labs/bi-workshop/run_lab.py followed by its name.

## Learner evidence worksheet

For every command record: prediction; actual receipt; any mismatch and explanation; what the local model checked; what Power BI evidence remains absent. Do not fill the actual-result field from this answer guide.

1. Transform: received 7, valid 6, rejected 1, total 16000 cents. F7 quantity is malformed. No SQL pushdown, merge or unpivot is executed.
2. Model: 6 facts, 3 products, 2 regions, 365 dates. Describe duplicate-key and orphan-case rejection. Do not claim engine relationship validation.
3. Context: Hardware 9000; North with Hardware 3000; replace North with South and retain Hardware 6000; intersect North and South on the same region column yields empty/None. Row F1 is 2000 versus total 16000.
4. Dates: full-year 2026 has 365 dates. Removing January 2 creates a gap. The contiguous 59-date January/February subset fails the full-year teaching rule. January/February totals are 6000/10000, growth 2/3. YTD is 6000 on January 2, 14000 on February 1, 16000 on February 2.
5. Report: Hardware/Supply/Service totals are 9000/3000/4000. Hardware is 56.25% of all revenue or 100% of selected Hardware. Plan checks flag missing alt text, order and units; rendered accessibility is untested.
6. Refresh: copied F1–F4 snapshot totals 12000 versus later F1–F6 source 16000. Interpret the simulated outage without claiming provider availability. Direct Lake framing is unmodeled.
7. Access: North Viewer and Viewer with Build both 7000; elevated roles 16000; two region roles union to 16000; missing Viewer membership is denied by local policy. All fixture data remains readable; no actual security is created.
8. Capstone: reconcile accepted facts, model validity and month totals. Retain separate unexecuted-product tasks. No certificate, readiness score or deployment approval follows.

## Optional paper extensions

SQL pushdown, unpivot, separate order/ship date roles, weighted ratios and stock snapshots are discussion exercises only. They are not extra wrapper outputs. The fixed fixture has no ship-date calculation.

## Dated partial objective-gap map

The official guide read on 2026-11-07 uses objectives effective 2026-04-20; the page update is 2026-10-30. Lessons 1–2 touch preparation; 2–4 touch modeling; 5 touches report design; 6–7 touch management/security. This is a thematic partial mapping, not a coverage percentage. Native connectors and privacy settings, M and DAX engine practice, calculation groups, performance tools, native visuals and interactions, Copilot, service publication and distribution, gateways, effective RLS and governance need separate product work. Check the current guide before exam planning.

Source: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300

## Review gate

Every numerical claim must match the final contract. Every vendor-execution claim must remain explicitly unperformed. A local plan-field check is not accessibility testing; local filtering is not RLS; a complete Python calendar is not Power BI date-table configuration.
