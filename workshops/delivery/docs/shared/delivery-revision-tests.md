# Attach a test receipt to the revision actually tested

Reject stale and dirty evidence before treating a local result as a delivery gate.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Record source revision, cleanliness, command, environment and outcome together.
- Explain why an old passing result cannot approve a newer revision.
- Separate local executed tests from unexecuted CI and broader quality claims.

## Learn

“Tests passed” omits the most important question: which contents did they test? A branch may have moved, a working file may differ from its commit, or a receipt may refer to yesterday’s code. The revision-tests exercise ties a small fixed test run to an exact clean source revision and deliberately challenges that relationship with stale or dirty state.

A useful local receipt includes the full revision, the check command, actual tool versions, the outcome and whether the inspected state remained unchanged. Cleanliness is part of this workshop’s contract, not a universal proof of hermeticity. Untracked or ignored generated files, external dependencies and environment differences can matter in larger projects. The fixed assertions read release.json from the named commit, not from working-tree files. The clean-checkout gate is a separate local handoff policy, not a claim that those assertions consume modified working bytes.

Record the expected source identity before testing and check the repository state again afterward. If the source is dirty or the identity differs, refuse to relabel an older result as evidence for the new contents. This protects the meaning of the receipt even if the code change looks harmless. It does not establish that every possible concurrent filesystem change is impossible.

A test must be able to disagree with the implementation. The supplied fixed checks exercise documented behavior and relevant boundaries rather than merely checking that a process printed something. A failing assertion is a result to explain, not a reason to remove the assertion until everything turns green. Keep the result tied to the exact scenario that produced it.

CI systems also expose revision information, but its meaning depends on the event. GitHub’s documentation notes that github.sha depends on what triggered the workflow; a pull-request workflow can concern a merge result rather than simply the contributor’s branch tip. In a real CI review, inspect the checked-out revision and event semantics. This workshop reads that documentation but never creates or runs a hosted workflow.

Our local test gate is evidence for the fixed teaching behavior under the recorded environment. It is not a coverage percentage, security assessment or promise that the program has no defects. In your handoff, write the narrow supported claim and list the unexecuted checks. A refusal to accept dirty or stale evidence is an intended successful guardrail, not an excuse to manufacture a passing receipt.

## Worked example

Receipt R reports a pass for clean revision A. The branch then advances to B, or a file is edited without committing. R remains evidence about A; it does not become evidence about B or the edited working tree. The lab demonstrates the accepted clean run and rejected mismatches so the rule is observable rather than only advisory.

```sh
# Executes fixed local checks and tests the receipt guards.
python3 labs/delivery-workshop/run_lab.py revision-tests
# Receipt reasoning:
# expected revision == observed clean revision
# run fixed checks; retain exit/result evidence and tool versions
# verify the tested source identity again before accepting the receipt
# No GitHub Actions workflow is submitted or executed.
```

Only the Python wrapper commands are runnable instructions. Commented Git snippets explain operations the wrapper performs in an owned disposable repository. Never paste them into a personal repository.

## Practice safely

1. Run revision-tests and locate the exact revision attached to the accepted result.
2. Identify which outputs demonstrate dirty-state and stale-revision rejection.
3. List command, environment, outcome and source-state fields needed by a reviewer.
4. Explain why a moving branch name cannot replace the recorded full revision.
5. Write a two-sentence local-test claim and one important limitation.
6. Describe the CI event question you would verify before trusting a future hosted result.

## Evidence to keep

- An executed local receipt with full revision and environment.
- Observed rejection of dirty or stale evidence.
- A statement separating local tests, hosted CI and untested behavior.

## Original check 1

A receipt passed for revision A, but the branch now points to B. What is supported?

A. B is automatically approved
B. All future commits passed too
C. The branch name invalidates all historical evidence
D. The receipt is still evidence for A only

<details><summary>Answer and reasoning</summary>

D. The receipt is still evidence for A only

Evidence stays attached to the tested source. A new revision needs its own relevant checks.

</details>

## Original check 2

Why reject a dirty working tree under this lab’s test-receipt contract?

A. It violates this local handoff’s clean-checkout requirement, even though the assertions read committed data
B. Dirty means the computer has malware
C. Git cannot read any modified file
D. The author identity is missing by definition

<details><summary>Answer and reasoning</summary>

A. It violates this local handoff’s clean-checkout requirement, even though the assertions read committed data

Dirty state fails a separate checkout-state gate before assertions. The fixed data checks read release.json from the recorded commit; they do not test modified working-tree files.

</details>

## Original check 3

What should you verify before treating github.sha as the contributor’s exact branch tip?

A. Only the job name
B. The workflow event and actual checked-out revision
C. Only that the badge is green
D. Whether the commit message sounds confident

<details><summary>Answer and reasoning</summary>

B. The workflow event and actual checked-out revision

CI revision semantics depend on the event. The documented context is not a substitute for inspecting the run.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

Only the supplied fixed local checks run. No hosted CI, credentials, network, arbitrary learner code, coverage measurement, concurrency proof or production assurance is included.

## Official references

- https://git-scm.com/docs/git-rev-parse
- https://git-scm.com/docs/git-status
- https://docs.python.org/3.12/library/unittest.html
- https://docs.python.org/3.12/library/subprocess.html
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
