# Testing, debugging and release evidence

Test behavior, boundaries and failure recovery.

## Learn

Unit tests isolate small behavior; integration tests exercise component boundaries; end-to-end tests cover real workflows. Each provides different evidence. A mocked browser-like environment is not a real-browser test.

Write tests for contracts and failure cases, not only implementation details. Include repeated actions, interrupted operations, invalid input and recovery. A bug regression should fail on the old code and pass on the repair.

Release evidence should identify exact code, environment, commands and results. Record failed and unrun checks honestly. A green CI badge is useful only for the commit and scope it actually covered.

## Worked example

A save button that works once may duplicate data on a double-click. Test repeated submission and uncertain responses, not just a successful first request.

## Practice safely

1. Write a failing regression for a small bug.
2. Fix the implementation without weakening the assertion.
3. Add a boundary and recovery case.
4. Document what the tests do not cover.

## Check your understanding

What is a strong regression test?

- One that passes on every implementation
- One that only checks a screenshot exists
- One that fails on the known defect and passes after the fix
- One that skips errors

<details><summary>Answer and explanation</summary>

One that fails on the known defect and passes after the fix. A regression test must distinguish the defective behavior from the repaired contract.

</details>

## Further study

- https://docs.python.org/3/library/unittest.html
- https://nodejs.org/api/test.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

