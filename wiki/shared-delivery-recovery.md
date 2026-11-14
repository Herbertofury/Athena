# Undo a mistake without erasing the record

Use an additive revert and verify restored behavior alongside preserved history.

## Learning goals

- Distinguish reverting a change from deleting a commit.
- Identify the exact mistaken revision before choosing a recovery.
- Explain why restored file bytes and restored external state are different claims.

## Learn

A recoverable workflow makes it possible to explain what happened, not merely to hide a bad result. In the recovery exercise a baseline is committed, a deliberately wrong change is committed, and a new revert commit reverses that change. The bad commit remains in history. This lets a reviewer see both the mistake and the corrective action.

Before undoing anything, identify the revision and inspect the change you intend to reverse. Reverting an unrelated commit because its message sounds similar would be a new mistake. The fixed lab records the baseline, mistaken revision and final revision separately, then compares contents and parent relationships. Your explanation should name the target, not say “undo the last thing” without evidence.

Git revert records a new change that reverses an earlier change. It is not the same operation as moving a branch pointer backward or discarding working files. This workshop chooses the additive approach because it exposes the correction in inspectable history. It does not demonstrate destructive commands, rewrite shared history or encourage broad cleanup in personal repositories.

The important checks are independent: the corrected contents match the intended baseline, the mistaken commit remains an ancestor, and the new correction is a distinct commit. Merely comparing the first and last file is not enough to prove that history was preserved. Merely counting commits is not enough to prove that the right content returned.

A revert is not always conflict-free and does not erase consequences outside Git. Later edits may depend on the reverted change. A database migration, an email already sent or a deployed side effect needs its own recovery plan. Even when a source file returns to its old bytes, you have not thereby restored a database or proven that a live service is healthy.

Our exercise uses a simple linear history with no external effects, so the result is intentionally bounded. A real recovery decision needs ownership, impact and validation appropriate to that system. Here your deliverable is the observed additive history plus a short explanation of what was restored and what was never present. Do not turn a passing local revert into a claim of incident-response readiness.

## Worked example

For baseline A, mistaken change B and corrective commit C, the final file can match A while HEAD identifies C, not A. B remains in C’s ancestry. That is the central observation: the content was corrected by adding history rather than pretending the mistake never existed.

```sh
# Safe, fixed linear-history recovery in a disposable repository.
python3 labs/delivery-workshop/run_lab.py recovery
# The wrapper targets its own recorded mistaken commit with git revert.
# It compares initial and final bytes, then inspects the history.
# No reset --hard, clean, force push or deletion of user history is used.
```

## Practice safely

1. Predict the final contents and final number of commits in the simple scenario.
2. Run recovery and identify the baseline, mistaken and corrective revisions.
3. Verify both content restoration and continued presence of the mistaken commit.
4. Explain why the final commit identifier should differ from the baseline.
5. Give an external side effect that a source revert would not undo.
6. State which more complicated recovery cases were not executed.

## Evidence to keep

- Three actual revisions and an additive parent chain.
- A baseline/final content comparison and preserved mistaken commit.
- A bounded recovery statement that excludes external side effects.

## Original check 1

After an additive revert, where is the mistaken commit?

- Necessarily erased from every repository
- Converted into a password
- Still present in the recorded history
- Automatically published as a release

<details><summary>Answer and explanation</summary>

Still present in the recorded history. The correction is a new commit; it does not remove the original commit from the ancestry.

</details>

## Original check 2

The final file matches the baseline. Must the final commit identifier also match?

- Yes, equal files force equal commits
- No; the corrective commit has its own parent and metadata
- Only if a remote is configured
- Only when the branch name is short

<details><summary>Answer and explanation</summary>

No; the corrective commit has its own parent and metadata. Commit identity depends on more than one file’s contents, including the history relationship.

</details>

## Original check 3

What cannot be concluded from this successful local revert?

- The fixed file was restored
- A corrective commit was created
- A production database and all external side effects were rolled back
- The earlier mistake remains visible

<details><summary>Answer and explanation</summary>

A production database and all external side effects were rolled back. This repository has no production system or external effects. Source recovery does not perform those separate operations.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

The lab reverts one simple non-merge commit. It does not rewrite history, perform disaster recovery, reverse deployment effects or test complicated revert conflicts.

## Official references

- [Git revert reference](https://git-scm.com/docs/git-revert)

- [Git show reference](https://git-scm.com/docs/git-show)

- [Git glossary](https://git-scm.com/docs/gitglossary)

