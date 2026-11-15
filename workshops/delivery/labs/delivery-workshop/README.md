# Local delivery workshop: executable Git evidence

This lab uses **actual Git** and Python's standard library. It is not a simulated terminal. Each command creates a fresh, synthetic repository in an owned temporary directory and removes that directory on exit. It does not open your repository, contact a remote, publish a release, or deploy anything.

Verified environment: Linux, Python 3.12.14, and Git 2.52.0 at `/usr/local/bin/git`. No pip packages are needed. The runner selects the first executable file in the fixed order `/usr/local/bin/git`, `/usr/bin/git`, `/bin/git`, ignoring your shell's PATH. It accepts no caller-provided executable and installs nothing. Fallback selection is unit-tested; other runtime versions, installation paths and operating systems have not been verified.

From the delivery workshop root:

```sh
python3 labs/delivery-workshop/run_lab.py snapshots
python3 labs/delivery-workshop/run_lab.py staging
python3 labs/delivery-workshop/run_lab.py branches
python3 labs/delivery-workshop/run_lab.py conflict
python3 labs/delivery-workshop/run_lab.py recovery
python3 labs/delivery-workshop/run_lab.py revision-tests
python3 labs/delivery-workshop/run_lab.py provenance
python3 labs/delivery-workshop/run_lab.py capstone
python3 -m unittest discover -s tests -p 'test_delivery_lab.py' -v
```

The only positional argument is one of those eight exercise names. There is no `--repo`, URL, file-upload, arbitrary command, or learner-code parameter. Read `WORKSHEET.md` before running, then compare evidence with `ANSWER-KEY.md`. `CONTRACTS.md` explains isolation, boundaries, and limits.

## What actually happens

- **snapshots:** commits a second version and reads both immutable committed versions with `git show`.
- **staging:** stages one text version, edits again, shows both diffs, and commits only the staged version. The working tree is intentionally dirty at the end of this exercise.
- **branches:** makes two divergent branches changing different files, then produces a real two-parent merge commit.
- **conflict:** creates a same-line conflict, records the unmerged index and conflict markers, writes an explicit resolution, and commits the merge.
- **recovery:** creates a bad release commit and an additive `git revert`; all three history entries remain.
- **revision-tests:** tests committed JSON with fixed assertions, rejects dirty and mismatched revisions, and demonstrates an assertion failure on a clean but invalid release.
- **provenance:** builds a deterministic in-memory source archive from committed tracked teaching files, hashes it, detects deliberate byte tampering, and explicitly denies that hashing alone authenticates the publisher.
- **capstone:** merges, checks the exact clean revision, then constructs provenance evidence for that same revision. A passing local gate is not remote publication, deployment, authorization, or a security guarantee.

## Reading the JSON

Successful output includes `runtime` (actual Python version, Git-reported version, executable path, and HEAD author observed through Git), `exercise`, `execution`, `result`, an `operations` trace (Git operation plus exit code), and flags for cleanup/no network/no user repository. These flags describe this fixed program's control flow, not an independent network audit. Full commit IDs and tree IDs bind evidence to revisions; they are not secrets or authenticity proofs.

Expected negative demonstrations are **successful lessons**: conflict records a merge exit code of 1 and resolves it; `revision-tests` records rejected gates without making the whole command fail. An unexpected Git failure, timeout, excessive output, or broken invariant makes the runner fail with exit code 1 and a JSON error on stderr. Invalid CLI usage exits 2. It never substitutes fabricated success evidence.

Archives are created in memory and measured, not saved to a release destination. Save stdout yourself only if you want a record; the runner accepts no output path.
