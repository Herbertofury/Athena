# Explain the three states before saving history

Observe working files, staged content and committed snapshots as different evidence.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Distinguish the working tree, index and HEAD without treating them as three folders.
- Predict what a plain commit records after a file changes twice.
- Describe author identity, authentication and publication as separate claims.

## Learn

Suppose you are preparing a small fictional project for a teammate. You edit a file, select the version worth saving, then make another edit before committing. Which version becomes history? A useful mental model names three states: the working tree is the files you can edit, the index holds the proposed next snapshot, and HEAD normally identifies the current branch and its current commit. These are related states, not three independent project copies.

A commit records a snapshot together with information such as its parent and message. The first commit has no parent; later history links changes to earlier states. A difference view helps a human understand what changed, but it is not the same thing as saying Git stores only the visible patch. In this workshop, read committed file content directly and compare it with the working file instead of inferring both from a success message.

Staging is a selection made at a particular time. When you add a file and then edit it again, the earlier staged contents remain selected until you add the new contents. A plain commit in our lab records the staged selection, not whichever version happens to be open in an editor. First run snapshots to compare two committed versions. In the next lesson, staging exposes the three-state distinction directly; use its two diffs and final working content to check your prediction.

A commit name identifies an object in the repository. A branch name can move as new commits are created, so “main” is not a permanent test receipt. Keep the full commit identifier when you need to identify exactly what was inspected. Different metadata or parents can change a commit identifier even if a particular file is identical; compare the relevant bytes as well as the history.

The author and committer fields are metadata, not proof of a signed-in account. The lab deliberately uses a fictional teaching identity, never your name or email. It does not authenticate to a host, create a signature or publish anything. Seeing a name in a log supports the narrow statement that the commit contains that field, not that the named human approved the work.

Every exercise creates and owns a new temporary repository. It excludes inherited Git configuration and environment settings, uses empty hooks and templates, and removes only its owned temporary work afterward. Run the supplied wrapper, not the illustrative internal Git commands in a personal project. A paper prediction remains useful if the required tools are unavailable; label it unexecuted rather than presenting expected output as an observation.

## Worked example

The snapshots command records “Decision: baseline” at one revision and “Decision: reviewed” at a later revision. Reading the earlier revision still returns baseline after the second commit; the current state is clean. This establishes retained snapshots. The following staging exercise separately demonstrates that staged and unstaged versions can differ. Both histories are temporary and local, not published releases.

```sh
# Run from this workshop folder. The wrapper creates its own disposable repo.
python3 labs/delivery-workshop/run_lab.py snapshots
# Internal inspection concepts, not commands to run in your own repository:
# git status --porcelain=v1
# git diff
# git diff --cached
# git show HEAD:<fixed-teaching-file>
# git rev-parse HEAD
```

Only the Python wrapper commands are runnable instructions. Commented Git snippets explain operations the wrapper performs in an owned disposable repository. Never paste them into a personal repository.

## Practice safely

1. Draw the working-tree, index and HEAD states, then predict the two committed versions in snapshots.
2. Run the supplied snapshots command and inspect its structured evidence.
3. Compare old_content and new_content at before and after; verify the final clean flag. Use staging in the next lesson for different working bytes.
4. Find the synthetic author fields and explain why they do not authenticate a person.
5. Record the actual Git/Python versions and the full observed commit identifiers.
6. State whether any remote was contacted or any persistent learner repository was created.

## Evidence to keep

- Two committed versions and their actual revision identifiers; a separate three-state prediction for staging.
- Full commit identifiers and the synthetic identity from an actual run.
- An explicit local-only, disposable-repository statement.

## Original check 1

You stage version A, edit the working file to version B, then make a plain commit. What is recorded?

A. Version A from the index
B. Version B because it is newest
C. Both as separate commits automatically
D. Neither until you sign in

<details><summary>Answer and reasoning</summary>

A. Version A from the index

The lab uses a plain commit of the staged selection. Later unstaged edits remain outside that snapshot.

</details>

## Original check 2

What does the synthetic author name in a commit prove?

A. That a hosting account authenticated
B. That the commit records that metadata
C. That a teammate approved it
D. That the release was uploaded

<details><summary>Answer and reasoning</summary>

B. That the commit records that metadata

Author metadata is distinct from account authentication, signatures, approval and publication.

</details>

## Original check 3

Why record a full commit identifier instead of only the branch name?

A. Branches encrypt files
B. Commit names are release approvals
C. A branch can move to another commit
D. A branch never changes

<details><summary>Answer and reasoning</summary>

C. A branch can move to another commit

The branch identifies a moving line of work. An exact revision makes the recorded observation specific.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

Only fixed synthetic files in owned temporary repositories are used. No user Git identity is changed; no authentication, signing, remote backup or publication is performed.

## Official references

- https://git-scm.com/docs/gitglossary
- https://git-scm.com/docs/git-add
- https://git-scm.com/docs/git-commit
- https://git-scm.com/docs/git
- https://git-scm.com/docs/git-init
- https://docs.python.org/3.12/library/tempfile.html
