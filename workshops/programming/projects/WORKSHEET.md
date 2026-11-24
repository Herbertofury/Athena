# Programming evidence worksheet

Name or study label: __________  Date: __________  Python version / OS: __________

Mark each result **predicted**, **executed reference**, or **executed my starter**. If you consulted a solution, say which function and what you learned. Keep private data out of the worksheet.

## 1. Values and contracts

- What are the types and units of quantity, unit_cents, subtotal_cents and display_subtotal?
- Why do `True`, `1`, `1.0` and `"1"` behave differently under the exact quantity contract?
- Write valid smallest/largest examples and three rejected inputs. What should each return or raise?
- Explain why cents fit this fictional calculation but do not solve every real currency problem.

## 2. Trace before running

For each quote fixture row, record quantity, unit cents, line cents, subtotal before and subtotal after. Predict the empty-list result. Explain the invariant. Predict a reset-inside-loop defect and an early-return defect before testing your hypothesis in a separate scratch example.

## 3. Ownership and functions

Draw the list/dictionary objects in the aliasing demonstration. Which names share each object? Why is a shallow outer-list copy insufficient? Why is a new flat dictionary sufficient only for this row schema? Show a no-mutation test on your own implementation.

## 4. Identity and ordering

Calculate quote groups. Explain why two FILTER lines are retained. Calculate distinct event counts and explain why the repeated EVT-001 is collapsed. Construct one conflict with the same event ID and different duration. State the expected error. Predict groups and the equal-duration tie order after reversing the input.

## 5. Input boundaries

Predict the outcome of: missing JSON key; extra key; duplicate JSON member name; `NaN`; whole-looking float quantity; CSV quoted comma; empty CSV; header-only CSV; a blank data row; duration `+5`, `005`, `5.0`, or `600001`; a conflicting event ID.

Explain which layer parses syntax, which validates shape and meaning, and which calculates results. Which error is unfinished learner code rather than invalid input? Do not hide all exceptions under one generic result.

## 6. Debugging journal

- Exact command and smallest failing input:
- Expected result and contract/source of that expectation:
- Observed result and error:
- Hypothesis:
- Smallest change:
- Focused retest and full-suite result:
- What remains untested:

Use [1,2] to explain why floor division is wrong for a fractional mean. Supply a second case that exposes a different potential defect. Avoid tests that only check that some output exists.

## 7. Capstone delivery

Complete both starter files. Preserve actual output from their acceptance suites and default CLI commands. Include one new boundary or property test without weakening the original tests. Write a short handoff with purpose, functions, input/output/error contracts, environment, commands, results, solution use and limits.

Select one small extension, such as reporting the count of zero-priced lines or adding a separately specified event-status filter. Before coding, specify its inputs, output, invalid cases and old behavior it must preserve. Add tests first. Do not extend into payments, external uploads, live monitoring or arbitrary file processing as part of this pack.

## Reflection rubric, not certification

- **Explain:** can I predict a new case and state why it follows from the contract?
- **Implement:** did my own starter pass all visible cases, and can I explain its structure?
- **Investigate:** can I reproduce a defect and show a meaningful regression?
- **Deliver:** can someone rerun my work from the recorded commands?
- **Limit:** can I say what I did not test or learn here?

A reference-only run is a useful study step, not a completed implementation. Passing visible tests is finite evidence, not proof of complete correctness or job readiness.
