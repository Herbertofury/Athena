# Review the staged change, not just the working file

Use two distinct diffs and a clear commit reason to avoid saving the wrong revision.

## Learning goals

- Explain which endpoints plain diff and cached diff compare.
- Detect a file that has both staged and unstaged changes.
- Evaluate a commit message against the actual selected change.

## Learn

A reviewable change has a purpose, a bounded set of selected contents and evidence that those contents match the purpose. “Save everything” is not a reliable review strategy. Our fictional teammate needs the intended correction without a later draft accidentally joining it. The staging exercise makes that difference visible in one small file so the selection is easy to inspect.

With the ordinary forms used here, git diff compares working content with the index, while git diff --cached compares the index with HEAD. One answers what is still unstaged; the other answers what the next plain commit proposes. An empty working diff does not establish that there is nothing staged. An empty cached diff does not establish that the working tree is unchanged.

A short status has two columns for a tracked path: the index change relative to HEAD and the working-tree change relative to the index. A file marked MM can therefore contain both a staged change and a later unstaged change. Read each column as a relationship, not as a vague urgency level. Untracked files need separate attention because an ordinary diff does not list their full contents.

Review the complete staged patch before deciding that the commit is coherent. Check names, values, removed lines and any unrelated material, not only the number of files changed. In a real review, a plausible message does not make a wrong patch correct. Here the fixture is synthetic and fixed; do not introduce passwords, personal data or user files to make the demonstration feel realistic.

A useful message explains why the selected change exists in language another maintainer can understand. It cannot substitute for the diff or for a behavioral test. Write one candidate message after examining the evidence, then point to the exact staged lines that justify it. If the evidence and the message disagree, revise your explanation rather than quietly claiming that the latest working draft was saved.

The supplied command performs inspection and a temporary local commit under the lab safety contract. It does not offer a repository-path option or a free-form Git shell. That narrow interface is intentional: the learning task is to reason about selected contents, not to try broad commands in whatever directory your terminal happens to occupy. Keep both diffs in your worksheet so someone can audit your prediction.

## Worked example

Imagine HEAD contains “draft”, the index contains “reviewed”, and the working file contains “reviewed plus unapproved experiment”. The staged diff should describe draft to reviewed, while the unstaged diff should describe the extra experiment. A message claiming that the experiment was committed would contradict the selected snapshot even if the commit command returned success.

```sh
# Safe runnable entry point; it never accepts a repository path.
python3 labs/delivery-workshop/run_lab.py staging
# The wrapper inspects these relationships in its own temporary repository:
# git status --porcelain=v1
# git diff --cached
# git diff
# Compare selected content with the resulting committed content.
```

## Practice safely

1. Predict which text belongs in each diff before reading the output.
2. Run staging and identify staged and unstaged evidence separately.
3. Explain each column of a tracked-file status entry such as MM.
4. Write a commit message justified by the selected patch, not by the latest working draft.
5. Explain why an untracked file requires status inspection even when diff is empty.
6. Keep the final selected-content comparison and any remaining-change status.

## Evidence to keep

- Two labelled diffs and a correct status-column explanation.
- A proposed commit message tied to specific selected lines.
- The observed distinction between committed and remaining working content.

## Original check 1

Which ordinary command reviews the proposed next plain commit relative to HEAD?

- git diff alone
- A branch name without a command
- Reading only the commit message
- git diff --cached

<details><summary>Answer and explanation</summary>

git diff --cached. The cached or staged diff compares the index with the current commit by default.

</details>

## Original check 2

What can MM mean for a tracked path in short status?

- The index and working tree both differ from their comparison states
- The file is encrypted twice
- Two remote servers approved it
- No change can be committed

<details><summary>Answer and explanation</summary>

The index and working tree both differ from their comparison states. The first column describes the index relative to HEAD, and the second the working tree relative to the index.

</details>

## Original check 3

The plain working diff is empty. What conclusion is still unsafe?

- There are no differences in that comparison
- There cannot be staged or untracked changes
- The compared working contents match the index
- Another status check may be useful

<details><summary>Answer and explanation</summary>

There cannot be staged or untracked changes. A single diff view is not a complete inventory of staged and untracked state.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

This is full-file staging of fixed text, not an interactive patch editor, secret scanner, code-review approval or proof of business correctness. No real repository is inspected or modified.

## Official references

- [Git diff reference](https://git-scm.com/docs/git-diff)

- [Git status reference](https://git-scm.com/docs/git-status)

- [Git add reference](https://git-scm.com/docs/git-add)

- [Git commit reference](https://git-scm.com/docs/git-commit)

