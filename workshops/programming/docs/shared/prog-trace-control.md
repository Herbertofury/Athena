# Trace a loop before trusting its output

Build the subtotal by maintaining a simple invariant at every step.

**Study time:** about 45 minutes, plus additional project practice at your own pace.

## You will learn to

- Explain branch and loop behavior in a small trace.
- Use a running-total invariant and a defined empty case.
- Choose boundary tests that expose off-by-one and reset errors.

## Learn

A program follows the control flow that its code expresses, not the intention in a comment. Conditions select a path; a loop repeats a body for a sequence of inputs. Indentation defines blocks in Python. When a result surprises you, trace the values before and after each relevant statement rather than changing several lines at once.

For the quote, initialize subtotal to zero before the loop. For each validated line, compute quantity times unit_cents and add that line amount once. A useful invariant is: after processing the first k lines, subtotal equals their sum. At the start k is zero and the empty sum is zero. After the last line, the invariant gives the desired total.

The location of an assignment matters. Resetting subtotal to zero inside the loop discards earlier work. Returning from inside the loop can stop after the first item. Including the last index twice can double-count. A three-line example often reveals these errors more clearly than a large file, because you can calculate each intermediate value by hand.

Define the empty case on purpose. Under this contract, an empty quote is valid and returns zero lines, zero units, zero subtotal and an empty grouping. That differs from an empty event summary’s mean, which is absent rather than zero. Similar-looking empty inputs can require different outputs because the questions differ.

Avoid modifying the sequence you are iterating over unless the behavior is deliberately designed. Here the input stays unchanged while separate accumulators build the answer. This makes the trace easier to explain and keeps a second caller from seeing unexpected edits. The next lessons extend the accumulators to grouped results.

The supplied trace_total example runs only fixed invented values and prints every step. Predict it before running. Seeing the expected final number once is useful, but the invariant explains why the algorithm should work for other allowed cases. Later tests exercise a bounded set of quantities and prices; they are evidence, not a proof over every possible program.

## Worked example

The three fixture line amounts are 2500, 1497 and 1000 cents. The running totals are 2500, 3997 and 4997. If a loop resets the total on each iteration, the final value becomes 1000, a plausible-looking but wrong amount. The empty quote returns zero without entering the loop. Both the multi-line trace and empty case are required evidence.

```python
subtotal = 0
for quantity, unit_cents in [(2, 1250), (3, 499), (1, 1000)]:
    line_cents = quantity * unit_cents
    subtotal += line_cents
# After each iteration: 2500, 3997, 4997.
```

The snippets illustrate the surrounding explanation; the complete runnable programs are in the projects and examples folders.

## Practice safely

1. Write the before, line amount and after values for all three fixture lines.
2. Run python3 examples/trace_total.py and compare the trace.
3. Explain the loop invariant in your own words.
4. Predict the result if initialization or return is moved inside the loop, without changing the reference.
5. Implement the ungrouped subtotal and unit count in your starter.
6. Test empty, one-line and multi-line input before adding grouping.

Use the [project guide](../../projects/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

After two fixture lines, what is the subtotal?

A. 1497
B. 2500
C. 4997
D. 3997

<details><summary>Answer and reasoning</summary>

D. 3997 The first two line amounts are 2500 and 1497, so their sum is 3997.

</details>

### Check 2

What does resetting subtotal inside every iteration usually do in this algorithm?

A. Discard earlier accumulated work
B. Preserve every previous line
C. Validate all input
D. Sort the rows

<details><summary>Answer and reasoning</summary>

A. Discard earlier accumulated work The running total must survive from one iteration to the next.

</details>

### Check 3

Why test the empty quote?

A. It proves all large inputs are fast
B. It defines the zero-work path without entering the loop
C. It removes the need for bounds
D. It makes every empty metric equal zero

<details><summary>Answer and reasoning</summary>

B. It defines the zero-work path without entering the loop Empty behavior is part of the contract and can expose initialization or return mistakes.

</details>

## Evidence to keep

- A hand-calculated and executed three-step trace.
- A stated invariant and empty-case result.
- Starter tests for zero, one and multiple lines.

## Limits

The fixed trace is not a performance benchmark or a proof that any arbitrary loop is correct.

## Official references

- https://docs.python.org/3.12/tutorial/controlflow.html
- https://docs.python.org/3.12/library/unittest.html
