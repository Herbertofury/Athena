# Programming: values, control flow and functions

Build a precise mental model before memorizing frameworks.

## Learn

A program transforms inputs into outputs through explicit rules. Distinguish values, variables, types and operations. A string that looks like a number is not necessarily a numeric value; validate and convert inputs at the boundary.

Conditions choose paths; loops repeat work; functions package behavior with named inputs and outputs. Make assumptions visible. A function that silently changes shared state is harder to reason about than one with a clear contract.

Errors are part of the design. Define what happens for missing input, invalid values and unavailable dependencies. Small examples, tracing and tests reveal misunderstandings faster than a large unexamined program.

## Worked example

A price calculator should reject a negative quantity and distinguish integer item counts from decimal currency. Parsing user input without validation can turn a useful calculation into NaN or an incorrect total.

## Practice safely

1. Write a function that computes a total from quantity and unit price.
2. Specify accepted types and bounds.
3. Test zero, a normal case, a negative value and malformed input.
4. Explain each branch without running it.

## Check your understanding

Where should external input be validated?

- Only after saving it
- Never, if it looks numeric
- At a clearly defined boundary before relying on it
- Only in a visual label

<details><summary>Answer and explanation</summary>

At a clearly defined boundary before relying on it. Boundary validation prevents malformed values from contaminating internal assumptions.

</details>

## Further study

- https://docs.python.org/3/tutorial/
- https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

