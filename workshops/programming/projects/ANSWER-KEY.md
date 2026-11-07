# Programming prediction key

Use after making your predictions. Full reference implementations are deliberately separate from this explanation.

## Types and arithmetic

Quantity and unit price are exact integers; their units are units and cents per unit. The product is cents. Display text is a string and does not replace the numeric amount. `True` is related to integers in Python, but this contract rejects it with an exact type check. `1.0` and `"1"` have different types. Boundary decisions come from the stated contract, not accidental coercion.

The three line subtotals are 2500, 1497, 1000. Running totals are 2500, 3997, 4997. The empty list has all zero counts and an empty grouping. Resetting inside the loop loses prior amounts; returning inside it can ignore later lines. At each iteration, subtotal equals the sum of all rows processed so far.

Integer cents avoids floating approximation for this exact sum/product, but this pack has no currencies, rounding policies, tax, exchange rates or payment behavior. The event mean is a different question and can be fractional.

## Aliasing and state

An alias names the same list. A shallow list copy has a new outer list but still shares inner dictionaries. Changing its first dictionary also changes the original. A list of new flat dictionaries does not share those dictionaries, so its quantity remains 1 while the original becomes 3. This is only sufficient because nested mutable values are absent. Per-call accumulators and fresh result dictionaries prevent later calls from changing earlier results under this schema.

## Identity

BRUSH totals 3 units/1497 cents; FILTER totals 3 units/3500 cents. A repeated stock item is not automatically a duplicate mistake. The two FILTER prices differ, so the grouped result reports totals and no invented unit price.

Five event deliveries represent four unique IDs. EVT-001 repeats identically. Unique durations sum to 800 ms, average 200.0; there are 3 successes and 1 failure. Groups sort as inspection, repair, repair, detail. The last item is one label containing a comma. Slowest order is EVT-002, EVT-003, EVT-001, EVT-004; default output takes the first three. Reversing input does not change this. A changed duration for EVT-001 conflicts with its identity and raises `ValueError`.

## Validation

Missing/extra JSON fields, duplicate member names, `NaN` and float quantities are rejected. Syntax success alone is not semantic validation. Quoted CSV commas are valid inside a field. Empty CSV is rejected; header-only CSV gives no events. A blank data record is invalid. `+5` and `5.0` fail the duration text rule; `005` becomes 5; `600001` parses as integer but fails the numeric bound. The file byte limits and row limits are separate checks.

`NotImplementedError` means a starter placeholder still needs implementation. It is not a corrupt fixture. Targeted input errors should not hide unrelated defects. The wrapper reports anticipated invalid input or unfinished work, but lets unexpected exceptions remain visible for debugging.

## Tests and delivery

For [1,2], `//` gives 1 while `/` gives 1.5. Testing only [2,2] would miss the defect. Useful additional cases include a zero-price line, maximum allowed count, mutation check, repeated identical event or equal-duration ordering. Choose an expectation independently from the code being tested.

The distributed references have 21 quote and 23 event tests. Tests contain subcases, so test count is not input coverage. The learner starters initially fail intentionally. After your own implementation, record which commands passed, on which version, and what you consulted. A finite passing suite is not an independent assessment, universal correctness proof, certification or production approval.
