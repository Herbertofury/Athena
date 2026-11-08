# Synthetic BI reasoning workshop

## What this is

Eight original, standard-library Python teaching models for practicing business-intelligence reasoning with seven invented sales rows. Six rows are accepted; one deliberately malformed row is rejected. All dollar amounts are fictional USD cents. No customer, account, production data or credentials are involved.

**This does not execute Power BI, Power Query M, DAX, a gateway or a semantic model.** It does not enforce RLS or establish accessibility compliance. Passing local tests says nothing about certification or exam readiness. Actual platform tasks remain explicitly unexecuted.

## Run safely

Python 3.9 or newer, with no packages to install. From the extracted pack root:

```
python3 labs/bi-workshop/run_lab.py --help
python3 labs/bi-workshop/run_lab.py transform
python3 labs/bi-workshop/run_lab.py model
python3 labs/bi-workshop/run_lab.py context
python3 labs/bi-workshop/run_lab.py dates
python3 labs/bi-workshop/run_lab.py report
python3 labs/bi-workshop/run_lab.py refresh
python3 labs/bi-workshop/run_lab.py access
python3 labs/bi-workshop/run_lab.py capstone
python3 -B -m unittest discover -s tests -v
```

Choose one exercise per invocation. The CLI accepts only the eight fixed names and help; it does not accept input/output paths, URLs, code or account settings. It prints deterministic JSON to stdout, writes no files (including bytecode), and makes no network calls. Invalid CLI arguments exit with code 2. Help and valid commands exit with code 0. Tests invoke the CLI without `-B` as well, checking its own bytecode suppression. The test invocation uses `-B` so the test runner itself does not write bytecode.

The fixture is generated in memory by `raw_fixture()` in `lab.py`. Each call returns new rows. Nothing is read from external data files or saved as a report. Tests use subprocess only to invoke this fixed local CLI, never a shell or a supplied command.

## Learning method

1. Predict before running. Write the numerator, denominator, relevant rows or validation invariant, not only the final number.
2. Run one fixed model. Compare your prediction with its JSON `result`.
3. Explain a mismatch by identifying which rows, assumptions or scope changed.
4. State the evidence still needed in the actual platform. Do not label a local result a “Power BI lab pass.”

A correct number is not necessarily a correct explanation. North + Hardware is 3000 cents because F2 is the only row satisfying both predicates, not because one filter always wins. A contiguous calendar is not necessarily complete. A report checklist is not a rendered accessibility test. A hypothetical role classification is not a permission boundary.

## Case and invariants

- F1–F6 total 16000 cents. North = 7000; South = 9000.
- Supply = 3000; Hardware = 9000; Service = 4000.
- January = 6000; February = 10000. The other months have no fact rows.
- Three product rows and two region labels are unique dimension keys. The calendar covers every day from January 1 through December 31, 2026: 365 unique dates. Facts occupy only a few dates, but that does not shorten the calendar requirement.
- Fact grain is one synthetic sales line, identified by a unique F-number. Repeated date/product/region combinations are not themselves duplicate facts.

Transformation is deliberately strict: numeric fields must be positive ASCII integer strings of 1–9 digits; leading zeroes are allowed, signs/decimals/spaces/scientific notation are not. This is our teaching policy, not a financial-system specification. Returns and zero-priced items are outside this fixture. Region labels alone are trimmed and case-normalized to North/South. Product IDs and filter values are exact and case-sensitive. Dates must be exact ISO dates with no time component and within 2026. Unknown fields, products and regions are rejected. A seen fact ID is reserved even if another field fails, so a second occurrence cannot silently repair the first. No malformed row silently becomes zero.

Amounts are integer products of quantity and unit cents. Aggregating an empty row list returns Python `None`, encoded as JSON `null`; a ratio with a zero or absent denominator is also `null`. This intentionally distinguishes no observations from a measured zero. It is not a general emulation of DAX BLANK. Rational shares/growth use reduced numerator/denominator objects rather than rounded decimal strings. The report additionally presents the exactly representable fixture percentages 56.25 and 100.

## Output contract

Every receipt has exactly these top-level fields:

- `schema_version`: integer 1.
- `exercise`: the fixed exercise name.
- `scope`: the explicit local-only scope warning.
- `result`: exercise-specific data below.

`transform`: accepted `valid_rows`, indexed `rejected_rows` with a reason and bounded `raw_record` evidence, `total_cents`, `query_folding` untested. Each rejection retains `row_index` and `reason`. An independent, unnormalized `raw_record` copy is included only for exact dictionaries with the six expected string keys and exact-string values of at most 256 characters each. F7 therefore retains its ID and `quantity: "many"`. Unsupported schemas, non-string objects and oversized fields have no `raw_record`; they are not stringified or serialized. This evidence limit does not change acceptance/rejection rules and is not a general ingestion interface.

`model`: `facts`, `products`, `regions`, `dates` counts; declared `relationships`; `controlled_rejections` for duplicate product key and orphan fact. A relationship label is not an instantiated engine relationship.

`context`: `hardware_cents`, `north_hardware_cents`, `replace_south_cents`, `keep_south_cents`, `f1_row_amount_cents`, `overall_measure_cents`.

`dates`: calendar diagnostics (`valid_full_year`, `date_count`, `contiguous`, `missing`, `extra`) for the full year, missing January 2 and Jan/Feb-only examples; monthly and YTD totals; difference and rational growth. Order of input dates is immaterial; uniqueness and full-year membership matter.

`report`: category totals, rational all-category shares, Hardware percentages under two denominators, missing checklist declarations and an explicit untested rendered-accessibility statement.

`refresh`: four invented mode/availability combinations, each with availability, total and explanation; explicit Direct Lake exclusion. “Source-required” is a Python branch, not a DirectQuery implementation.

`access`: hypothetical workspace-role classifications, Viewer+Build, role union, missing assignment and warning. All raw rows remain readable by anyone with this pack.

`capstone`: reconciliation, model counts, monthly totals and six separately required unexecuted platform tasks. No score or certificate.

## Transfer without overclaiming

- Cleaning: inspect real query steps, source data types and query folding separately. String validation here does not demonstrate source-side execution or production refresh performance.
- Modeling: inspect actual cardinality, cross-filter direction, key quality and ambiguous paths. The teaching validator rejects orphans rather than reproducing unknown/blank-member behavior.
- Context: Python sets illustrate replacement, intersection and union. They do not implement CALCULATE, context transition, expanded tables or engine evaluation.
- Dates: the calendar is full-year and gap-free; no date table has been marked or configured in Power BI. Classic and calendar-based time-intelligence behavior are not executed.
- Reports: declare intent, then test the rendered experience with real assistive technology and users. A filled-in string can still be poor alt text or an unusable reading order.
- Operations: source availability and cached freshness are separate questions. No provider guarantee, gateway behavior, credentials, scheduling, Direct Lake framing or fallback is modeled.
- Access: verify effective permissions with authorized real test identities and relevant sharing/export/embedded paths. Never use this program as access control.

Read `WORKSHEET.md` before `ANSWER-KEY.md`. The root `LAB-CONTRACT.md` is the fixed numerical and scope contract.
