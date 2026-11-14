# Combine independent work with a visible merge

Trace two diverging branches and verify that their changes survive integration.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Draw branch pointers and parent relationships before and after a merge.
- Distinguish a fast-forward from a two-parent merge commit.
- Check integrated content instead of equating a clean merge with correct behavior.

## Learn

A branch names a line of work by pointing to a commit. Creating another branch does not copy an entire project into a second folder. In our exercise, two branches start from the same baseline, then each gains its own commit. Drawing the shared ancestor before looking at output makes it easier to predict why neither tip alone contains both changes.

The branches exercise assigns independent files to the two lines of work. One records a change on the main line, the other a change on a feature line. The changes are deliberately nonconflicting so you can learn the shape of integration without also solving a disputed requirement. The teaching scenario is small enough to verify every final file rather than relying on an impressive-looking graph.

When one tip already contains the other as an ancestor, a fast-forward can move the branch pointer without adding a merge commit. In the divergent example, both sides have new work, so the lab creates a merge commit with two parents. Those parents record the two histories being combined. Count and identify them in the evidence instead of assuming that every merge command must produce the same history shape.

A nonconflicting textual merge is a mechanical outcome. Two changes can touch different files and still disagree about an interface, unit or behavior. For example, a caller could begin sending cents while a separately edited callee still treats the number as dollars. No overlapping line is required for that defect. After combining work, test the integrated behavior that matters, not merely each branch in isolation.

The current branch matters when integrating. A merge updates the branch you have selected, incorporating the other history into that branch. In the fixed lab this target is explicit. Your worksheet should name the target branch, both input commits and the resulting commit so a reader can tell what was combined and where the result lives.

The exercise keeps both histories in a temporary local repository and verifies final file content and clean state. It does not delete branches, contact a host or decide that a pull request is ready to merge. Branch protection, collaboration permissions and required checks belong to a separate real-project workflow with its own authorization and evidence.

## Worked example

Draw baseline A splitting into main commit B and feature commit C. The integration commit M has parents B and C, and its contents include both independent edits. The two-parent shape records ancestry; the separate content assertions establish that the intended bytes survived. Neither alone proves that a real application works.

```sh
# Runs only a fixed divergent-branch scenario in an owned disposable repo.
python3 labs/delivery-workshop/run_lab.py branches
# Internal observations include the selected branch and parent identities:
# git rev-parse HEAD
# git show -s --format=%P HEAD
# git log --oneline --all
# Final fixed-file content is also verified.
```

Only the Python wrapper commands are runnable instructions. Commented Git snippets explain operations the wrapper performs in an owned disposable repository. Never paste them into a personal repository.

## Practice safely

1. Draw A, B, C and M, labelling the two branch pointers and parent arrows.
2. Run branches and map the observed identifiers to your drawing.
3. Verify that the merge result has two parents and retains both independent changes.
4. Name the target branch rather than saying only that two branches were merged.
5. Invent a semantic incompatibility that would not require a textual conflict.
6. Separate the successful local merge from unperformed remote review and publication.

## Evidence to keep

- A parent graph labelled with actual full revisions.
- Both independent changes visible in the merged contents.
- A semantic-risk example and an explicit local-only statement.

## Original check 1

What is the strongest reason this divergent merge has two parents?

A. Every commit has two parents
B. Two files force two parents
C. Each branch contains work after their shared ancestor
D. A remote server was contacted

<details><summary>Answer and reasoning</summary>

C. Each branch contains work after their shared ancestor

The merge joins two distinct histories; the file count and network activity do not determine that relationship.

</details>

## Original check 2

A merge completes without a textual conflict. What still needs checking?

A. Nothing, correctness is guaranteed
B. Only the color of the branch label
C. Whether Git created a hosting account
D. The integrated behavior and intended final contents

<details><summary>Answer and reasoning</summary>

D. The integrated behavior and intended final contents

Mechanically compatible edits can still be semantically incompatible.

</details>

## Original check 3

What happens in a fast-forward integration?

A. The branch can advance to an existing descendant without a new merge commit
B. All commits are erased
C. Every file gets copied into a second project
D. Authentication becomes unnecessary for future pushes

<details><summary>Answer and reasoning</summary>

A. The branch can advance to an existing descendant without a new merge commit

A fast-forward changes the reference because the desired history already contains the earlier tip.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

Only a small two-branch, nonconflicting merge is executed. No remote branches, pull requests, protection rules, distributed collaboration or production integration checks are exercised.

## Official references

- https://git-scm.com/docs/git-branch
- https://git-scm.com/docs/git-merge
- https://git-scm.com/docs/gitglossary
- https://git-scm.com/docs/git-show
