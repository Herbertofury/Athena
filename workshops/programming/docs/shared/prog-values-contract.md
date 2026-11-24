# Give every value a meaning and a unit

Start a repair-quote calculator with explicit types, bounds and expected results.

**Study time:** about 45 minutes, plus additional project practice at your own pace.

## You will learn to

- Distinguish text, integer counts and display strings.
- Keep amount arithmetic in explicit integer cents for the project.
- Write a function contract before its implementation.

## Learn

A useful program starts with a question precise enough to answer. Our fictional repair workshop needs a subtotal for supplied line items, not a payment system. Each line has a stock identifier, a quantity and a price in cents. Before writing code, decide the allowed input, the output and the behavior for invalid data. These choices form the program’s contract.

The text "3" and the integer 3 are different values. Repeating text and multiplying a quantity are different operations even when the same symbol appears. Conversion should happen at a defined boundary with validation, not everywhere a value is used. A display string such as "49.97" is for a reader; it is not the internal arithmetic representation in this project.

Use whole-number cents for the quote’s exact additions and multiplications. Two items at 1250 cents produce 2500 cents. This avoids binary floating-point approximation for this narrow arithmetic. Real currency systems also need currency identity, rounding rules, tax, discounts and other requirements. Integer cents is a project decision, not a claim that every financial domain has two decimal places.

State bounds deliberately. Quantity is an integer from 1 to 1000; unit_cents is an integer from 0 to 1000000. Zero-price items are valid, but zero quantity is not a line item under this contract. Python treats booleans as related to integers, so the validator requires an exact integer type rather than accepting true as one unit.

A contract also describes what does not change. validate_item returns a new flat dictionary and leaves the caller’s input untouched. Errors should be explicit rather than silently replacing invalid data with zero. The visible tests encode those decisions so that implementation and expectations can be discussed independently.

Open projects/repair_quotes/starter.py and implement one function at a time. The placeholders intentionally fail until you replace them. The reference file is available for comparison after you have tried the exercise. Do not copy a passing test result into your evidence as proof that you personally implemented the function; distinguish your work from running the supplied solution.

## Worked example

For a line with sku=FILTER, quantity=2 and unit_cents=1250, the line subtotal is 2500 cents. format_cents(5) must produce "0.05", not "0.5". The validator rejects quantity=true even though a casual arithmetic expression might treat it as 1. These are explicit product choices tested at their boundaries. The program never charges anyone or contacts a merchant.

```python
quantity = 2
unit_cents = 1250
line_cents = quantity * unit_cents
# line_cents is 2500; its unit is cents.
display = f"{line_cents // 100}.{line_cents % 100:02d}"
# display is "25.00", a presentation string.
```

The snippets illustrate the surrounding explanation; the complete runnable programs are in the projects and examples folders.

## Practice safely

1. Read the Repair Quotes contract before opening the reference solution.
2. Write examples for smallest, largest, zero-price and invalid-quantity inputs.
3. Implement format_cents and validate_item in a private copy of starter.py.
4. Run the starter acceptance tests and inspect the first relevant failure.
5. Explain why True, 1, 1.0 and "1" are not interchangeable under this contract.
6. Record what you implemented and what you only observed in the reference.

Use the [project guide](../../projects/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Which value is the quote project’s internal representation of a 12.50 unit price?

A. The integer 1250 with the unit cents
B. The string "12.50"
C. A currency symbol alone
D. The boolean True

<details><summary>Answer and reasoning</summary>

A. The integer 1250 with the unit cents The contract uses integer cents for arithmetic and a separate formatting function for display.

</details>

### Check 2

Why is quantity=true rejected?

A. Booleans cannot exist in Python
B. The contract requires an exact integer count, not a truth value
C. Every quantity must be text
D. It prevents all possible financial errors

<details><summary>Answer and reasoning</summary>

B. The contract requires an exact integer count, not a truth value Explicit type requirements prevent accidental coercion. This is a narrow input rule, not a complete financial control.

</details>

### Check 3

What should format_cents(5) return?

A. "5.00"
B. "0.5"
C. "0.05"
D. The integer 5

<details><summary>Answer and reasoning</summary>

C. "0.05" Five cents needs two fractional display digits. Internal and presentation values are separate.

</details>

## Evidence to keep

- A written input/output/error contract.
- Your two implemented starter functions and actual test result.
- Boundary examples with explicit units.

## Limits

This is fictional subtotal arithmetic, not pricing advice, tax calculation, billing, payment processing or a complete currency library.

## Official references

- https://docs.python.org/3.12/tutorial/introduction.html
- https://docs.python.org/3.12/tutorial/floatingpoint.html
