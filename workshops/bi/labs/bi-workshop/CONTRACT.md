# BI conceptual-model contract

These are fixed, local Python teaching models. They do not execute Power BI, Power Query M, DAX, a gateway, a semantic model or authorization checks. No accounts, API, network, arbitrary input path or repository is accepted. The CLI prints synthetic JSON and writes no files. Only an allowlisted exercise name is accepted.

Commands from the extracted pack: `python3 labs/bi-workshop/run_lab.py transform|model|context|dates|report|refresh|access|capstone` (choose one name, not a literal pipe expression).

## Fixed case and totals

Synthetic sales facts after transformation:

- F1: 2026-01-01, North, P1 Supply, quantity 2, unit price 1000 cents, amount 2000 cents.
- F2: 2026-01-02, North, P2 Hardware, quantity 1, unit price 3000 cents, amount 3000 cents.
- F3: 2026-01-02, South, P1 Supply, quantity 1, unit price 1000 cents, amount 1000 cents.
- F4: 2026-02-01, South, P2 Hardware, quantity 2, unit price 3000 cents, amount 6000 cents.
- F5: 2026-02-01, North, P3 Service, quantity 1, unit price 2000 cents, amount 2000 cents.
- F6: 2026-02-02, South, P3 Service, quantity 1, unit price 2000 cents, amount 2000 cents.

A seventh raw row F7 has quantity 'many' and is rejected explicitly. Raw numeric fields are strings and region labels are trimmed/canonicalized under our own documented policy. Prices are fictional USD amounts represented as integer cents, not live rates or payments.

Totals: 16000 cents overall; North 7000; South 9000; Hardware 9000; Supply 3000; Service 4000; January 6000; February 10000. No matching rows returns None in the teaching aggregate, to remind learners that an empty result is not necessarily a measured zero. This is not a universal emulation of DAX BLANK semantics.

## Eight receipts

1. transform: six valid rows, one rejected row with reason, total 16000. Local cleaning/validation only; query folding is explicitly untested.
2. model: six facts, three products, two regions and a complete 365-date calendar for the full year 2026. Declared one-to-many, single-direction dimension-to-fact relationships. Controlled duplicate-key and orphan-fact examples are rejected by the teaching validator. It does not emulate Power BI blank members, relationship inference or engine behavior.
3. context: Hardware 9000, North+Hardware 3000, replace North with South while retaining Hardware 6000; keep both North and South on the same region column gives empty/None. F1 row amount 2000 versus overall measure 16000. This is Python set filtering/arithmetic, not DAX execution or a complete CALCULATE/context-transition model.
4. dates: complete full-year calendar 365 dates; deleting January 2 yields one missing date. A Jan/Feb-only 59-date list is contiguous but fails this full-year teaching contract. January 6000; February 10000; YTD at January 2=6000, February 1=14000, February 2=16000. February minus January 4000, growth 2/3. A calendar list check is not Power BI date-table setup or execution of either classic or calendar-based time intelligence.
5. report: category totals and shares against all-category 16000 denominator; Hardware 56.25% of all versus 100% of selected Hardware. A fixed report-plan checklist flags missing alt text, order and units; declaring those fields is not rendered accessibility validation.
6. refresh: invented import snapshot contains F1–F4 total 12000, later source F1–F6 total 16000. The model illustrates stale copied data versus a simulated source-required read during an outage. No provider freshness/availability guarantee. Direct Lake framing/fallback is explicitly not modeled.
7. access: in this deliberately restricted hypothetical model, Viewer assigned North sees 7000; Viewer with Build remains 7000; Member/Contributor/Admin are not constrained by the teaching RLS filter and see 16000. Two assigned region roles union North+South=16000. Missing viewer role is denied by the teaching policy. This is classification/set filtering, NOT actual authorization or a security boundary; all fixture data remains readable. No claims about every Power BI sharing/export/embedded situation.
8. capstone: reconcile transformed facts, model validity, January/February totals and scope notes; retain a list of separately required unexecuted Power BI tasks. No readiness score or certificate. Only the local computations in this receipt were executed.

Official examples of M/DAX may be shown as commented illustrative snippets, clearly marked unexecuted. Never call these Python results a Power BI lab pass. Predict first, run one fixed model, explain mismatch, and state the actual platform evidence still required.
