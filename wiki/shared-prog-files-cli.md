# Move structured data through a small command-line program

Use standard parsers, explicit encoding and a predictable output contract.

## Learning goals

- Read CSV quoting correctly and distinguish strings from parsed values.
- Separate modules, the CLI wrapper and file I/O.
- Verify a local JSON round-trip without overwriting user files.

## Learn

Files carry bytes; a text encoding turns those bytes into characters. This workshop uses UTF-8 explicitly. Structured formats add another layer: CSV describes rows and quoting, while JSON describes values and containers. Neither format should be interpreted by ad hoc string operations when a supported parser can express the rules.

Splitting a CSV line on every comma is not a CSV parser. A quoted label such as "repair, detail" is one field. The event project uses the standard CSV reader and requires an exact header and column count. It then converts only the duration field under its explicit lexical rules. Header-only input is a valid empty dataset here; a blank data row is not.

Keep the command-line wrapper small. It chooses a fixed project and implementation, reads one bounded bundled fixture, calls pure functions and writes one JSON result to standard output. Expected input problems go to standard error with a nonzero exit status. This makes the result easier for a person or another program to distinguish from an error.

The wrapper defaults to your starter, so an unfinished implementation reports that it is unfinished. Selecting reference is an explicit way to see the supplied solution’s behavior, not a claim that your starter passed. Importing a reference module does not run the CLI or create a file because execution is guarded by its entry point.

The JSON round-trip example writes one invented report to a new temporary directory, reads it back and compares the logical result. It exercises actual local I/O while protecting existing files. It removes only that created directory on normal completion. This does not test atomic replacement, power-loss durability, permissions or an independent backup.

A report should state units and scope. The event mean is a floating-point millisecond value for the supplied distinct events, not an SLO or production latency guarantee. An empty dataset has mean=None because no observations exist. Serializing that value to JSON gives null. Zero milliseconds would falsely suggest an observed average of zero.

## Worked example

The fixture’s quoted repair, detail label remains one field, so the parser produces five rows. After identity deduplication there are four events, total duration 800 ms and mean 200.0 ms. The quote CLI prints subtotal_cents=4997 and display_subtotal="49.97". The JSON example separately verifies a temporary file round-trip. None of these commands reads a personal file or contacts a service.

```python
import csv
import io
rows = list(csv.reader(io.StringIO('label,duration_ms\n"repair, detail",200\n'), strict=True))
# rows[1] is ["repair, detail", "200"].
# The duration is still text until deliberately converted.
```

## Practice safely

1. Run each project CLI with --implementation reference and inspect its JSON.
2. Run the default starter CLI and distinguish an unfinished result from a reference pass.
3. Implement CSV parsing with the standard library, not split(",").
4. Run python3 examples/json_roundtrip.py and record its narrow real-I/O result.
5. Explain stdout, stderr and exit status for the provided wrapper.
6. Check that an empty event summary uses null/None for the absent mean.

## Evidence to keep

- Actual JSON outputs from both reference CLIs.
- Correct quoted-field handling and empty-data behavior.
- A temporary JSON write/read result with scope stated.

## Original check 1

How many fields are in the CSV row "repair, detail",200?

- Three because there are two commas
- One because all text is quoted
- It must be executed to know
- Two under the quoted CSV grammar

<details><summary>Answer and explanation</summary>

Two under the quoted CSV grammar. The comma inside the quoted label belongs to that field.

</details>

## Original check 2

What does selecting --implementation reference prove?

- The supplied reference’s behavior on that fixture
- Your starter is complete
- Every future input is valid
- The project was published

<details><summary>Answer and explanation</summary>

The supplied reference’s behavior on that fixture. Reference execution and learner implementation are different evidence.

</details>

## Original check 3

Why is the empty event mean None/null instead of zero?

- JSON cannot represent zero
- There are no observations from which to compute a mean
- All missing data should be a string
- It means the program crashed

<details><summary>Answer and explanation</summary>

There are no observations from which to compute a mean. Absence of a measurement differs from a measured value of zero.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

The CLI reads only fixed fixtures. No arbitrary files, network service, spreadsheet formula execution, production monitoring or deployment is involved.

## Official references

- [https://docs.python.org/3.12/library/csv.html](https://docs.python.org/3.12/library/csv.html)

- [https://docs.python.org/3.12/tutorial/inputoutput.html](https://docs.python.org/3.12/tutorial/inputoutput.html)

- [https://docs.python.org/3.12/library/argparse.html](https://docs.python.org/3.12/library/argparse.html)

