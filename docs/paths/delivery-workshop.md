# Version Control & Reproducible Delivery Workshop

Eight connected lessons use real Git in isolated temporary repositories to make staging, merges, conflict resolution, additive recovery, exact-revision tests and local artifact provenance observable.

Actual fixed local Git/Python practice only. No user repository, remote, credentials, hooks, signatures, hosted CI or publication is used. A temporary local commit is not a published release.

## Prerequisites

- [Git, review and reproducible changes](../shared/git.md)
- [Testing, debugging and release evidence](../shared/testing.md)

## Ordered workshop

1. [Explain the three states before saving history](../shared/delivery-snapshots.md)
2. [Review the staged change, not just the working file](../shared/delivery-staging.md)
3. [Combine independent work with a visible merge](../shared/delivery-branches.md)
4. [Resolve a disagreement and verify the result](../shared/delivery-conflicts.md)
5. [Undo a mistake without erasing the record](../shared/delivery-recovery.md)
6. [Attach a test receipt to the revision actually tested](../shared/delivery-revision-tests.md)
7. [Identify an artifact without overstating its trust](../shared/delivery-provenance.md)
8. [Hand off a local candidate with defensible evidence](../shared/delivery-capstone.md)

## Offline practice

Download the workshop ZIP from the app, extract it and read its README before running any command. Run commands from that extracted workshop folder. The app does not execute Python or SQL, and a read mark is not lab evidence.

Source and editable exercises: [workshop folder](../../workshops/delivery/README.md).

## Primary-source register

- [Git glossary](https://git-scm.com/docs/gitglossary)
- [Git add reference](https://git-scm.com/docs/git-add)
- [Git diff reference](https://git-scm.com/docs/git-diff)
- [Git status reference](https://git-scm.com/docs/git-status)
- [Git commit reference](https://git-scm.com/docs/git-commit)
- [Git branch reference](https://git-scm.com/docs/git-branch)
- [Git merge reference](https://git-scm.com/docs/git-merge)
- [Git revert reference](https://git-scm.com/docs/git-revert)
- [Git show reference](https://git-scm.com/docs/git-show)
- [Git rev-parse reference](https://git-scm.com/docs/git-rev-parse)
- [Git configuration reference](https://git-scm.com/docs/git-config)
- [Git command and environment reference](https://git-scm.com/docs/git)
- [Git init reference](https://git-scm.com/docs/git-init)
- [Python 3.12 tempfile](https://docs.python.org/3.12/library/tempfile.html)
- [Python 3.12 subprocess](https://docs.python.org/3.12/library/subprocess.html)
- [Python 3.12 unittest](https://docs.python.org/3.12/library/unittest.html)
- [Python 3.12 hashlib](https://docs.python.org/3.12/library/hashlib.html)
- [GitHub Actions workflow events reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [GitHub Actions contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [GitHub Actions artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations)
