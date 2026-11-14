# Resolve a disagreement and verify the result

Treat conflict markers as a prompt to decide meaning, then complete the merge explicitly.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Identify the unresolved state instead of treating a conflict as a completed merge.
- Explain a deliberate same-line resolution using an agreed teaching requirement.
- Verify resolved content, staging state and final merge parents.

## Learn

A conflict is a pause in integration, not proof that either contributor is careless. The conflict exercise changes the same baseline line differently on two branches. Git cannot select the intended final meaning from those competing edits, so the merge stops. A nonzero result at this planned point is expected evidence, while an unrelated command failure would be a lab error.

Conflict markers display alternative contents around an unresolved region. They are not useful final program or document text. In a simple two-branch merge, the current side and incoming side correspond to the histories being combined, but labels alone do not decide which requirement wins. Read the original intent and both changes before choosing the final content.

The supplied scenario defines its final resolved text explicitly. The wrapper writes that resolution in the temporary repository, stages it and completes the merge. This is an actual conflict and actual resolution, not a string pretending to be terminal output. Predict the unresolved and resolved states before running so you can explain why each transition is necessary.

Removing marker lines is insufficient when the retained content is wrong. A useful resolution must satisfy the teaching requirement and preserve the changes that should survive. The output therefore includes the conflict state, the final text and the completed merge relationship. If a real disagreement has no clear intended behavior, the responsible step is to clarify the requirement rather than picking a side to make status look clean.

Staging a resolution tells Git that the selected content resolves the unmerged path. Completing the merge records that result in history. These are separate actions. Inspect the final status and parent count, then inspect the bytes or test the behavior. A clean state says there is no pending difference under the checked conditions; it does not establish that your resolution was a good product decision.

The conflict is restricted to a fresh synthetic repository with no preexisting work to preserve. The exercise does not teach forceful cleanup commands as a universal recovery method. Record the expected failed merge alongside the successful resolution; hiding the negative step removes the most important evidence that the conflict-handling path really ran.

## Worked example

The intended trace is: create a shared baseline; commit two incompatible edits; observe a stopped merge with an unmerged path; write the specified resolved content; stage it; complete a two-parent commit; verify no unresolved entries remain. The intermediate failure is successful exercise coverage, not a failed final outcome.

```sh
# Runs the deliberate conflict and its explicit fixed resolution locally.
python3 labs/delivery-workshop/run_lab.py conflict
# Internal inspection concepts only:
# git status --porcelain=v1
# git ls-files --unmerged
# After selecting the documented resolved text: stage, commit, inspect.
# No arbitrary repository path, merge tool or external editor is launched.
```

Only the Python wrapper commands are runnable instructions. Commented Git snippets explain operations the wrapper performs in an owned disposable repository. Never paste them into a personal repository.

## Practice safely

1. Predict the merge return status and explain why failure is expected at that point.
2. Run conflict and distinguish unresolved evidence from final resolved evidence.
3. Write a one-sentence rationale for the chosen final text.
4. Verify that markers and unmerged entries are absent after resolution.
5. Check the final contents and both merge parents, not only clean status.
6. Describe what you would ask a teammate if the intended resolution were ambiguous.

## Evidence to keep

- Observed expected conflict status and unresolved-path evidence.
- A reasoned resolution, final contents and two-parent commit.
- An explanation separating mechanical resolution from semantic correctness.

## Original check 1

What does the expected conflict return code mean in this lab?

A. All history was lost
B. The merge paused for a required resolution
C. The merge is already fully committed
D. A remote rejected your password

<details><summary>Answer and reasoning</summary>

B. The merge paused for a required resolution

The scenario deliberately creates an incompatible edit so the unresolved path can be inspected.

</details>

## Original check 2

Which sequence properly completes the fixed conflict scenario?

A. Delete only the marker symbols and assume success
B. Publish before inspecting the result
C. Choose correct final content, stage it, complete the merge and verify
D. Rename the branch without resolving the path

<details><summary>Answer and reasoning</summary>

C. Choose correct final content, stage it, complete the merge and verify

Content selection, staging, history recording and verification each answer a different part of the task.

</details>

## Original check 3

Why is a clean final status insufficient evidence that a resolution is correct?

A. Clean status means there is no history
B. Git refuses every valid resolution
C. All tests run automatically on every commit
D. Incorrect content can also be fully committed

<details><summary>Answer and reasoning</summary>

D. Incorrect content can also be fully committed

Git records the chosen contents; the requirement and behavioral checks determine whether those contents are appropriate.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

One deliberate text conflict is executed. Rename/delete conflicts, binary files, multiple merge bases, interactive tools and recovery of existing user work are outside this exercise.

## Official references

- https://git-scm.com/docs/git-merge
- https://git-scm.com/docs/git-status
- https://git-scm.com/docs/git-add
- https://docs.python.org/3.12/library/unittest.html
