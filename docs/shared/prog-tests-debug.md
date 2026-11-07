# Make a test distinguish a real mistake

Use boundaries, regressions and invariants instead of collecting green badges.

## Learning goals

- Read a failing assertion and form a small debugging hypothesis.
- Write a regression that fails on a known defect.
- Use deterministic property checks without claiming exhaustive proof.

## Learn

A test compares observed behavior with an expectation. A passing test is useful only if the expectation matches the intended contract and the test actually reaches the relevant behavior. “The program ran” is weaker than checking the exact subtotal, output shape, duplicate policy and input preservation.

Start with one small failing case. Read the assertion, input and traceback; reproduce it; state a hypothesis; change one relevant cause; then rerun the focused test and the full project suite. Do not rewrite the expected value merely because the implementation produced something different. If the contract is wrong, revise it deliberately and explain the consequences.

The bug-hunt example uses floor division for a mean. For durations 1 and 2, that returns 1 instead of the required 1.5. A fixture whose mean is already an integer would miss the defect. The supplied regression explicitly distinguishes the buggy and corrected functions. This is a concrete reason to choose cases that exercise a difference.

Boundary tests explore the edges of allowed input: zero-price, minimum/maximum quantity, just-outside bounds, empty data, duplicate IDs, malformed CSV and a conflicting late row. A negative test should verify the intended failure, not accept any unrelated crash as success. Here public validation failures are ValueError; unfinished starters raise NotImplementedError and therefore do not accidentally satisfy those tests.

Useful properties complement exact examples. Reversing valid quote rows should preserve the summary. Adding an identical event delivery should increase duplicate_rows without changing unique metrics. A bounded grid of quantities and prices checks the multiplication rule across more than one example. Such loops cover the chosen finite cases, not all inputs or all future changes.

Keep test state isolated. Each test gets fresh data where mutation matters, and reference functions do not retain mutable accumulators. The project acceptance suites are visible and can run against either implementation. The pack’s overall checks validate the supplied references and that the starters remain intentionally unfinished; they are not a score of your personal coding skill.

## Worked example

buggy_mean([1,2]) returns 1; corrected_mean([1,2]) returns 1.5. The regression expects 1.5 and must fail on the former. Event Summary’s fractional-mean test preserves this distinction. A different test verifies input order independence, and another verifies that a duplicate event with changed duration raises ValueError. These checks target different contracts; none should be replaced by “result is truthy.”

```python
expected = 1.5
buggy = sum([1, 2]) // len([1, 2])
corrected = sum([1, 2]) / len([1, 2])
assert buggy != expected  # The chosen case exposes the known defect.
assert corrected == expected
```

## Practice safely

1. Run python3 examples/bug_hunt.py and explain the distinguishing fixture.
2. Implement one starter function, then run its focused and full acceptance cases.
3. Record the first failure, your hypothesis, the change and the result.
4. Add one new meaningful test without weakening the existing tests.
5. Explain the difference between an exact example and an order-invariance property.
6. Keep starter failures separate from reference verification in your evidence journal.

## Evidence to keep

- A regression that distinguishes the known buggy mean.
- Your own failure/hypothesis/change/retest record.
- An additional boundary or property test with a reason.

## Original check 1

Which input exposes truncation in a mean calculated with //?

- [1, 2]
- [2, 2]
- [] alone
- Any filename

<details><summary>Answer and explanation</summary>

[1, 2]. Its correct mean is fractional, so floor division produces a distinguishable wrong result.

</details>

## Original check 2

A test fails because the implementation disagrees with the contract. What is the best first response?

- Change the expected value immediately
- Delete the test
- Hide the exception
- Reproduce the small case and examine the contract and implementation

<details><summary>Answer and explanation</summary>

Reproduce the small case and examine the contract and implementation. Debugging starts by understanding the discrepancy, not removing the evidence.

</details>

## Original check 3

A bounded property test passes on 25 cases. What does it establish?

- Evidence for those cases and the tested property
- A proof over every possible input
- Guaranteed production safety
- That no more tests are useful

<details><summary>Answer and explanation</summary>

Evidence for those cases and the tested property. Finite checks are valuable evidence with a defined scope, not universal proof.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

Visible tests are not exhaustive, independently assessed or a security certification. Passing the supplied solution does not grade the learner’s implementation.

## Official references

- [https://docs.python.org/3.12/library/unittest.html](https://docs.python.org/3.12/library/unittest.html)

- [https://docs.python.org/3.12/tutorial/errors.html](https://docs.python.org/3.12/tutorial/errors.html)

- [https://docs.python.org/3.12/tutorial/floatingpoint.html](https://docs.python.org/3.12/tutorial/floatingpoint.html)

