# Data structures and algorithmic trade-offs

Choose representations from operations and constraints.

## Learn

Arrays, lists, maps, sets, queues and trees support different operations. A map can provide fast key lookup under its implementation assumptions; a sorted structure supports ordered traversal and range queries.

Big-O describes how work grows with input size, not exact runtime on one machine. Constant factors, memory locality, allocation and input distribution also matter. Measure the actual workload without sacrificing correctness.

Every optimization needs a baseline, a representative workload and invariants. Test empty input, duplicates, boundaries and adversarial cases. Retain failed measurements rather than selecting only favorable runs.

## Worked example

Repeatedly searching a long list for each incoming ID can create quadratic work. A set of known IDs can reduce typical membership checks, at the cost of memory and hashing behavior.

## Practice safely

1. Implement duplicate detection with a nested scan and a set.
2. Verify identical results on empty, duplicate-heavy and unique inputs.
3. Measure several sizes after warm-up.
4. Explain time and memory trade-offs rather than declaring one universally best.

## Check your understanding

What does O(n) primarily describe?

- An exact number of milliseconds
- Guaranteed low memory
- A security certification
- Growth in work with input size

<details><summary>Answer and explanation</summary>

Growth in work with input size. Asymptotic complexity is a growth model, not a wall-clock prediction.

</details>

## Further study

- https://docs.python.org/3/tutorial/datastructures.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

