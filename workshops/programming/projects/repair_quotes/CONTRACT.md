# Repair Quotes: exact contract

This is a fictional subtotal calculator. There is no seller, charge, tax, discount, currency conversion or payment integration. Names and prices are synthetic. All four functions return data, do not print, do not read files and do not mutate their inputs. Invalid input raises `ValueError` (including its subclasses); exact error wording is not part of the contract.

## validate_item(item)

Input is a dictionary with exactly `sku`, `quantity`, `unit_cents`. No extra or missing keys are accepted.

- `sku`: string of 1–20 ASCII uppercase letters A–Z, digits 0–9 or hyphens. No trimming or case conversion is performed.
- `quantity`: exact Python `int`, from 1 through 1000 inclusive. Booleans, floats and numeric strings are rejected.
- `unit_cents`: exact `int`, from 0 through 1,000,000 inclusive. Zero is allowed. Booleans are rejected.

Return a new flat dictionary with those three validated values. It must compare equal to valid input but must not be the same dictionary object.

## quote_total(items)

Input is a list of at most 100 validated-or-unvalidated item dictionaries; validate every row. Empty input is valid. Return a new dictionary with exactly these fields:

- `line_count`: number of input rows, integer.
- `unit_count`: sum of quantities, integer.
- `subtotal_cents`: sum of quantity × unit_cents across all rows, integer.
- `by_sku`: list sorted by SKU in ordinary Python string order. Each member has `sku`, aggregate `quantity` and aggregate `subtotal_cents`.

Repeated SKUs are legitimate lines, including lines with different unit prices. Add their quantities and individual line subtotals. Do not deduplicate them or invent a single group price. An empty list produces 0, 0, 0 and `[]`. The maximum allowed subtotal is 100,000,000,000 cents. Reversing input order preserves the full summary. No partly computed answer is returned if a late row is invalid.

## format_cents(cents)

Input is an exact `int` from 0 through 100,000,000,000 inclusive. Return a decimal display string with exactly two fractional digits and no currency symbol or grouping commas. Examples: 0 → `"0.00"`; 5 → `"0.05"`; 4997 → `"49.97"`. Keep integer arithmetic; avoid converting through a binary float.

## parse_quote_json(text)

Input is a Python string whose UTF-8 encoding is at most 8192 bytes, inclusive. Decode JSON, require a list of at most 100 rows and validate every item using the contract above. Return a new list of fresh validated dictionaries.

Reject duplicate JSON object member names at any level, even if values match. Reject the nonstandard `NaN`, `Infinity` and `-Infinity` forms accepted by some decoder defaults. Reject malformed JSON, invalid row shape/types/bounds and a non-list root. JSON numbers such as `1.0` do not become integer quantities merely because their value is whole. Empty JSON list `[]` is valid. Byte length, not character count, is the limit.

A bounded parser is not a universal hostile-input defense. This teaching program only consumes the bundled synthetic fixture through its wrapper. It is not an upload endpoint or a financial system.

## Fixture and checkpoints

`fixtures/quote.json` contains FILTER 2 × 1250, BRUSH 3 × 499, FILTER 1 × 1000. Line amounts are 2500, 1497 and 1000; total is 4997 cents. FILTER aggregates to quantity 3/subtotal 3500; BRUSH to quantity 3/subtotal 1497. Group order is BRUSH, FILTER.

Milestones: (1) validate and format, (2) trace and total, (3) group, (4) parse bounded structured input, (5) run all acceptance tests and explain one new boundary case. Read the visible `specs.py`; 21 tests include multiple subcases, not merely 21 input values.
