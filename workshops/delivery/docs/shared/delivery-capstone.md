# Hand off a local candidate with defensible evidence

Connect review, integration, recovery, tests and artifact identity into a bounded delivery decision.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Write a release-candidate claim that each recorded observation actually supports.
- Reconcile the tested revision, packaged revision and artifact digest.
- Separate local readiness for review from authorization and evidence for publication.

## Learn

The capstone is a decision exercise: can another person tell what changed, what was tested, what was packaged and what remains unknown? A collection of green outputs is not enough if the outputs describe different revisions. Work backward from a concise handoff statement, then identify which observations are necessary to support each part of it.

Run the fixed capstone to assemble a temporary local candidate and its evidence. Compare its recorded source identity, local checks and artifact identity. The earlier exercises remain useful supporting evidence about how staging, merges, conflicts and revert behave, but their separate temporary histories are not automatically the capstone’s history. Never join unrelated identifiers into a story just because all commands passed.

A practical handoff has three layers. First describe the intended change and the relevant reviewed contents. Next state the exact tested and packaged revision with the commands, environment and outcomes. Finally give the artifact digest and the limits on trust and readiness. This structure is an original teaching contract, not a universal release standard or a replacement for a team’s requirements.

Investigate mismatches before delivering a confident summary. A packaged revision that differs from the tested revision needs explanation and new relevant verification. A dirty state means the named commit alone is insufficient. A changed digest means the bytes differ from the recorded reference. These are distinct problems, so do not repair them by editing the receipt to fit the answer you wanted.

Use precise verbs in the final note. “Created a temporary local commit,” “ran the fixed local checks” and “measured these artifact bytes” are supported observations when actually executed. “Published,” “CI passed,” “signed,” “approved” and “production ready” require different evidence and, where relevant, authorization. A local commit does not upload itself and a downloadable exercise archive is not a release of the learner’s project.

Close with a next-step boundary. The work can be ready for a human to review as a local teaching candidate while remote collaboration, broader testing, approval and real distribution remain unperformed. Explain one residual risk and the evidence that would address it. If you completed only the paper alternative, submit the predictions and reasoning clearly labelled as unexecuted rather than fabricating identifiers or results.

## Worked example

A defensible note says: “The local candidate at the recorded full revision passed the supplied checks under the printed environment. The artifact was constructed from the recorded committed input set and has the printed SHA-256 digest. These are local teaching results; no hosted CI, signature, remote upload or production deployment was performed.” Replace general labels with actual observed fields in your worksheet.

```sh
# Executes the bounded local handoff scenario; no remote or publication step.
python3 labs/delivery-workshop/run_lab.py capstone
# Re-run the workshop verification from this workshop folder:
python3 -m unittest discover -s tests -v
# In the worksheet, reconcile source revision, tested revision and artifact.
# Record unexecuted stages instead of claiming they passed.
```

Only the Python wrapper commands are runnable instructions. Commented Git snippets explain operations the wrapper performs in an owned disposable repository. Never paste them into a personal repository.

## Practice safely

1. Complete the prior predictions and explain every expected negative result.
2. Run capstone and reconcile its own revisions, local tests and artifact fields.
3. Write a reviewable handoff with exact observations instead of generic green-check claims.
4. Run the supplied unittest suite and keep its actual outcome separate from the capstone checks.
5. Name one uncovered failure mode and the additional evidence it would require.
6. Complete the worksheet rubric, including the local-only and no-publication statements.

## Evidence to keep

- A reconciled capstone receipt and a short original handoff note.
- The actual workshop unittest outcome, separate from the candidate checks.
- A residual-risk statement and unexecuted-stage checklist.

## Original check 1

The tested revision and packaged revision differ without explanation. What should the handoff do?

A. Hide the older identifier
B. Stop the readiness claim and reconcile or retest the actual candidate
C. Reuse the green result because branch names match
D. Claim publication to avoid confusion

<details><summary>Answer and reasoning</summary>

B. Stop the readiness claim and reconcile or retest the actual candidate

A delivery claim must refer to the contents actually tested and packaged; unexplained mismatches invalidate that connection.

</details>

## Original check 2

Which statement fits this workshop’s completed local capstone?

A. The production service is deployed
B. GitHub approved all pull requests
C. The bounded local candidate and evidence were produced; hosted publication remains unperformed
D. A real publisher identity was cryptographically verified

<details><summary>Answer and reasoning</summary>

C. The bounded local candidate and evidence were produced; hosted publication remains unperformed

The exercise is deliberately local, synthetic and temporary. Its evidence must stay within that scope.

</details>

## Original check 3

Why keep a limitation in an otherwise successful handoff?

A. It turns a passing test into a failure
B. It makes exact revisions unnecessary
C. It authorizes remote distribution
D. It tells the next reviewer which claims the evidence does not support

<details><summary>Answer and reasoning</summary>

D. It tells the next reviewer which claims the evidence does not support

Clear limits make the next decision safer and more efficient without erasing the successful bounded observations.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

This capstone ends with a temporary local teaching candidate and evidence. It is not a remote release, hosted CI pass, certification assessment, production deployment or general software supply-chain assurance.

## Official references

- https://git-scm.com/docs/git-rev-parse
- https://docs.python.org/3.12/library/unittest.html
- https://docs.python.org/3.12/library/hashlib.html
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- https://docs.github.com/en/actions/concepts/security/artifact-attestations
