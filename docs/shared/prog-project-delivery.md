# Finish a small program someone else can verify

Turn two editable projects into a precise, honest portfolio handoff.

## Learning goals

- Complete both starter contracts without relying on hidden behavior.
- Package commands, assumptions and evidence for another reader.
- Separate a tested local project from production readiness.

## Learn

Finishing a small program means more than making the happy path work once. Another person should be able to understand its purpose, allowed inputs, failure behavior, execution command, test command and limits. A compact README and a few meaningful examples often demonstrate more practical ability than a long list of technologies.

Complete Repair Quotes first: validation, exact cents arithmetic, grouping, formatting and bounded JSON. Then complete Event Summary: CSV parsing, normalization, identity conflicts, aggregation and deterministic ordering. The later project reuses principles while changing the data model. Explain why repeated SKUs and repeated event IDs intentionally behave differently.

Use the reference solution as a study resource, not a substitute for explanation. If you consult it, note which part clarified your thinking, close it and reproduce the idea in your own implementation. Being able to predict a new case and explain a failure is stronger evidence than copying code until all tests turn green.

Before delivery, run the starter acceptance suites against your completed files, run both CLI fixtures through the starter and preserve exact commands and results. Do not relabel reference output as starter output. The supplied placeholders are intentionally unfinished in the distributed pack, so initial red tests are expected. Your evidence begins when your own code changes.

Keep the scope modest and truthful. These programs calculate fictional subtotals and summarize bounded synthetic events. They have no account system, payment flow, database service, network endpoint, packaging installer or cloud deployment. A command-line project can be complete within that scope without being enterprise-ready or a full programming education.

Choose one next extension only after the baseline passes. Examples are a new deterministic report field or a clearly specified filter. Write acceptance criteria first, identify existing behavior that must remain, add tests and implement the change. Real financial rules, untrusted uploads, arbitrary paths or external services require new requirements and safety work rather than a casual switch in this exercise.

## Worked example

A trustworthy handoff says: “My starter implementations pass the 21 quote and 23 event acceptance tests on my recorded Python version. The quote fixture totals 4997 cents; the event fixture has four unique events, one duplicate delivery and an 800 ms total. I added a test for my chosen boundary. The tools use fixed synthetic input, are not payment or monitoring systems, and have not been deployed.” Change that statement if any part was not actually run or if you used only the reference.

```python
# After implementing the starter functions:
# python3 projects/repair_quotes/check.py
# python3 projects/event_summary/check.py
# python3 scripts/run_project.py repair_quotes
# python3 scripts/run_project.py event_summary
# Preserve your actual outputs and explain their limits.
```

## Practice safely

1. Complete both starter files in a private study copy of the pack.
2. Run all 44 visible acceptance tests against your implementations, not only reference.
3. Run both default CLI commands and compare to the documented fixture results.
4. Add one original regression or property test and explain its purpose.
5. Write a short README/handoff with versions, commands, results and limitations.
6. Choose one small extension and specify it before changing code.

## Evidence to keep

- Both learner acceptance suites and fixture outputs, or an honest unrun label.
- One new test with reasoning.
- A reproducible scoped project handoff.

## Original check 1

Which portfolio claim is most trustworthy?

- Production-ready because the reference passed
- Exact tested behavior, commands and known limits for your own implementation
- A list of frameworks not used
- A guarantee that all inputs are safe

<details><summary>Answer and explanation</summary>

Exact tested behavior, commands and known limits for your own implementation. Precise evidence lets another person evaluate the work without inflated claims.

</details>

## Original check 2

When should a new extension’s acceptance criteria be written?

- Only after it breaks existing behavior
- Never for small programs
- Before implementation, alongside the existing invariants to preserve
- Only if a cloud service is used

<details><summary>Answer and explanation</summary>

Before implementation, alongside the existing invariants to preserve. Explicit criteria make the change reviewable and testable.

</details>

## Original check 3

The distributed starter tests fail with NotImplementedError. What does that mean?

- The reference tests necessarily failed
- The operating system must be reinstalled
- The tests should be deleted
- The learning placeholders still need implementation

<details><summary>Answer and explanation</summary>

The learning placeholders still need implementation. The starter is deliberately unfinished so the learner has real work to implement.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

This module is a Python programming foundation, not a full computer-science curriculum, language certification, web-service deployment or job-readiness assessment.

## Official references

- [https://docs.python.org/3.12/tutorial/modules.html](https://docs.python.org/3.12/tutorial/modules.html)

- [https://docs.python.org/3.12/library/unittest.html](https://docs.python.org/3.12/library/unittest.html)

- [https://docs.python.org/3.12/library/argparse.html](https://docs.python.org/3.12/library/argparse.html)

