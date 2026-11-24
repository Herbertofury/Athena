# Reject bad input without hiding the reason

Separate syntax, schema and meaning, then make failure behavior testable.

## Learning goals

- Distinguish parsing from domain validation.
- Reject ambiguous keys, malformed numbers and unsupported data.
- Handle expected input errors without swallowing programming defects.

## Learn

Parsing answers whether text follows a representation’s grammar. Validation asks whether the resulting values meet your program’s contract. Valid JSON can still contain the wrong root type, a negative quantity or an unknown field. CSV can have correct quoting but an invalid status. Keep these questions separate so an error points to the right layer.

Be explicit about acceptance rather than guessing what a user meant. Quote rows require exactly three keys; event rows require four. The JSON parser rejects duplicate keys, because silently taking one value can hide contradictory input. Both parsers have byte and row limits appropriate to these small exercises. These bounds are teaching controls, not a complete hostile-input defense.

CSV cells start as text. The event duration column accepts ASCII digit text in a bounded length, then converts it to an integer and checks the numeric range. It does not accept a sign, decimal point, spaces or a look-alike Unicode digit. These strict rules are stated in the project contract; other products may intentionally choose different input conventions.

Choose meaningful failure behavior. The quote rejects the entire invalid input rather than returning a partial subtotal that looks complete. The event summary rejects a conflicting ID rather than silently discarding one version. Error messages help locate the issue, but callers should not depend on every word of a message unless that wording is part of the public contract.

Use exception handling at a boundary where you can respond appropriately. The CLI reports expected validation failures and exits nonzero. It does not catch every exception and print a success-shaped empty report. During development, a traceback for an unexpected bug is useful evidence. Hiding it behind a generic “all fine” response makes debugging harder.

Do not evaluate data as program code. JSON and CSV parsing do not require eval, shell commands or importing a filename supplied by the data. The supplied runner chooses between fixed local starter/reference modules and fixed synthetic fixtures. Running your edited Python still uses your normal permissions; only run code you wrote or trust, because the exercise runner is not a security sandbox.

## Worked example

The quote parser rejects an item that contains quantity twice, even if both values are integers. The event parser accepts a quoted label containing a comma because CSV quoting defines one field, but rejects duration="1.5" because this contract requires integer milliseconds. If row 3 is invalid, returning totals for rows 1 and 2 without an error would misrepresent the requested report. Tests therefore expect ValueError for the whole input.

```python
if type(quantity) is not int or not 1 <= quantity <= 1000:
    raise ValueError("quantity must be an integer from 1 to 1000")
# Parse first, then validate the domain.
# Do not replace invalid quantities with zero.
```

## Practice safely

1. List syntax, schema and meaning errors for each project.
2. Implement expected ValueError paths without returning partial success.
3. Run duplicate-key, wrong-root, invalid-status and conflicting-ID tests.
4. Explain why broad except-and-ignore would conceal useful evidence.
5. Keep all fixture data synthetic and never insert commands into input files.
6. Record one validation rule that is specific to this project rather than a universal rule.

## Evidence to keep

- A categorized invalid-input checklist.
- Actual negative-case test results.
- A boundary error policy without partial-success ambiguity.

## Original check 1

A JSON document parses but contains quantity=-1. Which layer rejects it?

- DNS
- Only text encoding
- Domain/schema validation
- No layer can reject parsed JSON

<details><summary>Answer and explanation</summary>

Domain/schema validation. Representation syntax and allowed business values are separate checks.

</details>

## Original check 2

An invalid late row is encountered. What does the quote contract require?

- Return a partial subtotal as if complete
- Reject the input with a defined error
- Ignore the row silently
- Change the quantity to zero

<details><summary>Answer and explanation</summary>

Reject the input with a defined error. A partial success-shaped answer would hide missing work.

</details>

## Original check 3

Why avoid catching every exception and returning an empty report?

- Because empty reports are always illegal
- Because Python cannot catch errors
- Because it can hide programming defects and misstate failure as success
- Because errors should be sent to strangers

<details><summary>Answer and explanation</summary>

Because it can hide programming defects and misstate failure as success. Expected input errors can be handled clearly while unexpected defects remain visible during development.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

These bounded parsers are not a security audit, arbitrary-file ingestion service or guarantee against every malicious input.

## Official references

- [https://docs.python.org/3.12/tutorial/errors.html](https://docs.python.org/3.12/tutorial/errors.html)

- [Python 3.12 json: parsing hooks and input considerations](https://docs.python.org/3.12/library/json.html)

- [https://docs.python.org/3.12/library/csv.html](https://docs.python.org/3.12/library/csv.html)

