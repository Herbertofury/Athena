# Build small functions without hidden state

Separate calculation from I/O and avoid accidental mutation through aliases.

**Study time:** about 45 minutes, plus additional project practice at your own pace.

## You will learn to

- Give each function a focused input/output contract.
- Distinguish returning a value from printing it.
- Recognize aliasing and the limits of a shallow copy.

## Learn

A function is a named operation with inputs and a result or effect. Small functions let you reason about one decision at a time. validate_item checks a row; quote_total calculates a summary; format_cents creates a display string. A command-line wrapper decides when to read a fixture and print JSON. Combining all those jobs in one loop makes failures harder to isolate.

Returning a value lets another function or test inspect and reuse it. Printing produces output for a user or another process. A calculator that only prints a number is harder to combine with grouping or formatting. Our project functions return ordinary data and do not read files, make requests or print; the wrapper owns those I/O choices.

Prefer explicit arguments over hidden global configuration for this exercise. A function whose result depends on a mutable global counter can change behavior across tests or repeated runs. A fresh accumulator inside each call prevents one summary from leaking into the next. Repeating the same pure calculation should produce an equal result without altering the supplied input.

Assignment can create another name for the same object. If alias = original, changing a mutable object through either name affects the shared object. A shallow copy creates a new outer container but can still share nested items. In the supplied example, copying a list of dictionaries does not automatically copy each dictionary.

Copy only what the contract requires. The quote and event rows contain flat primitive values, so building a fresh dictionary is sufficient for those rows. A future nested schema would need its own mutation policy. Deep copying everything is not a universal fix; it can duplicate data that should remain shared and add cost without clarifying ownership.

Modules help organize related functions. Importing a module should not unexpectedly run the CLI or overwrite a file. The provided scripts use an explicit main entry point. Their import paths are fixed to the bundled learner or reference module; this is a convenience for the exercise, not a sandbox for arbitrary untrusted code.

## Worked example

original is a list containing {quantity:1}. alias refers to that same list. shallow = list(original) creates a different list, but shallow[0] and original[0] still refer to the same dictionary. Setting shallow[0][quantity] to 3 changes original too. A separate list made from new flat dictionaries keeps quantity=1 in this example. The aliasing demo reports all three relationships instead of claiming every copy is independent.

```python
original = [{"quantity": 1}]
shallow = list(original)
separate = [dict(row) for row in original]
shallow[0]["quantity"] = 3
# original[0]["quantity"] is now 3.
# separate[0]["quantity"] is still 1.
```

The snippets illustrate the surrounding explanation; the complete runnable programs are in the projects and examples folders.

## Practice safely

1. Predict python3 examples/aliasing_demo.py before running it.
2. Explain which objects are shared and which are new.
3. Keep project calculations free of printing and file access.
4. Add or run an input-not-mutated test for your starter.
5. Call your summary twice, then call it with empty input to check for leaked accumulators.
6. Explain why the flat-row copy policy must be revisited if nested data is added.

Use the [project guide](../../projects/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Why do project functions return data instead of only printing it?

A. Because printing never works
B. To guarantee zero memory use
C. So callers and tests can inspect and reuse the result
D. To avoid defining an output contract

<details><summary>Answer and reasoning</summary>

C. So callers and tests can inspect and reuse the result Returning separates calculation from presentation and makes composition easier.

</details>

### Check 2

After shallow = list(original), are nested dictionaries necessarily independent?

A. Yes, every copy is deep
B. Only their values are always encrypted
C. Lists cannot contain dictionaries
D. No, nested objects may still be shared

<details><summary>Answer and reasoning</summary>

D. No, nested objects may still be shared A new outer list does not automatically duplicate its nested items.

</details>

### Check 3

Which design best avoids one summary leaking into the next?

A. A fresh accumulator created for each call
B. A shared mutable global accumulator
C. An unexplained cache of old results
D. Returning before every loop

<details><summary>Answer and reasoning</summary>

A. A fresh accumulator created for each call Local per-call state keeps independent calculations separate under this project’s contract.

</details>

## Evidence to keep

- Executed aliasing predictions and explanations.
- Input-mutation and repeated-call test results.
- A function diagram separating calculation from I/O.

## Limits

These conventions support small pure programs; they do not eliminate all shared-state, concurrency or object-lifecycle problems.

## Official references

- https://docs.python.org/3.12/tutorial/modules.html
- https://docs.python.org/3.12/library/copy.html
