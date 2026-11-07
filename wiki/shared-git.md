# Git, review and reproducible changes

Keep work reviewable and recoverable.

## Learn

Git records snapshots and their history. A branch is a movable reference, not a copy of the whole project. The working tree, staging area and committed history are distinct states.

Before changing shared work, inspect status, recent commits and remote state. Make small coherent commits, run tests and review the diff for accidental files or secrets. Never force-push over unknown work.

A good pull request explains the problem, the change, tests and remaining risks. Reproducible builds require pinned dependencies and a documented environment, not merely a successful run on one laptop.

## Worked example

A passing test result from an earlier commit does not automatically validate a later edit. Associate test receipts with the exact source revision.

## Practice safely

1. Create a disposable local repository.
2. Commit a tiny program and test.
3. Make a branch, edit it and inspect the diff.
4. Practice reverting your own harmless commit, not deleting history.

## Check your understanding

What should a test receipt identify?

- The exact source revision and test environment
- Only the project name
- Only the author avatar
- A future planned version

<details><summary>Answer and explanation</summary>

The exact source revision and test environment. Evidence is useful only when it can be tied to the code actually tested.

</details>

## Further study

- https://git-scm.com/book/en/v2

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

