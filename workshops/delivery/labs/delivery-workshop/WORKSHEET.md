# Delivery evidence worksheet

For each exercise, write your prediction **before** running it. Copy evidence fields, explain what they establish, and name one thing they do not establish. Re-run an exercise to check whether the evidence is reproducible. Record the top-level runtime.python_version, runtime.git_version, runtime.git_executable and runtime.observed_head_author; the author is synthetic commit metadata, not account authentication. If using only paper predictions, mark every result unexecuted.

## 1. Snapshots are durable states

Run `python3 labs/delivery-workshop/run_lab.py snapshots`.

1. Predict whether writing a new working file changes the old commit's contents.
2. Record `before`, `after`, `old_content`, and `new_content`.
3. Explain why two revisions can contain different values for the same path.
4. Check `clean`. Does a clean working tree prove the release meets its requirements?

## 2. The index is a deliberate selection

Run `python3 labs/delivery-workshop/run_lab.py staging`.

1. Predict the committed content after staging and then editing the same file again.
2. Explain both `M` characters in `status_before`.
3. Compare `staged_diff` and `unstaged_diff`. Which comparison is HEAD-to-index? Which is index-to-working-tree?
4. Record `committed_content`, `working_content`, and `clean`. Explain the intentionally dirty ending.

## 3. Branches and an actual merge

Run `python3 labs/delivery-workshop/run_lab.py branches`.

1. Record `base`, `feature`, `main_before_merge`, and `merged`.
2. Match both entries in `parents` to the two branch tips. Why is this not a fast-forward?
3. Verify resolved_content contains the feature decision and release_content contains version 2 from main. Explain why changing different files merges cleanly here but does not prove all independent edits are semantically compatible.

## 4. Conflict is a decision, not a catastrophe

Run `python3 labs/delivery-workshop/run_lab.py conflict`.

1. Inspect `conflict_markers` and identify the two competing decisions. Compare the observed unmerged_before index entries with the final empty unmerged_after.
2. Find the merge operation's exit code. Why can the overall lesson still succeed?
3. Explain why the selected resolution is a human decision encoded by the teaching program, not a decision Git can make.
4. Verify `unmerged_after`, `parents`, and `clean`. Name a test you would want for a real semantic merge.

## 5. Recovery without rewriting history

Run `python3 labs/delivery-workshop/run_lab.py recovery`.

1. Predict whether reverting deletes the bad commit.
2. Match every entry of `history` to `baseline`, `bad`, and `revert`.
3. Compare observed `baseline_content` with `restored_content` and verify `baseline_restored=true`; both describe feature=false and version=1.
4. Explain why this additive reversal is different from a history-rewriting reset. The lab never runs reset.

## 6. Bind tests to the exact clean revision

Run `python3 labs/delivery-workshop/run_lab.py revision-tests`.

1. Inspect `baseline_pass.checks` and explain each fixed data assertion.
2. Explain `dirty_rejected.reason` and `mismatch_rejected.reason`. Why is a previous green result insufficient?
3. Compare the passing revisions and their postcheck_revision/clean fields. Explain why the new revision needs new evidence and why source changes during a check are rejected.
4. Inspect `bad_release_rejected`. Why can a clean, exact revision still fail?
5. State the scope: these assertions inspect committed JSON, not arbitrary code, dependencies, integration services, or the production environment.

## 7. Artifact integrity and its limits

Run `python3 labs/delivery-workshop/run_lab.py provenance`.

1. Record a file's path, byte count, and digest from `manifest`.
2. Explain `repeat_identical`: which archive metadata must remain fixed?
3. Compare `sha256` and `tampered_sha256` and inspect `tamper_detected`.
4. Imagine an attacker replacing both the archive and its published hash. Would equality authenticate the author?
5. Explain why `authenticated=false` is the correct statement even when the digest matches.

## 8. Integrated local delivery gate

Run `python3 labs/delivery-workshop/run_lab.py capstone`.

1. Prove that `merge.merged`, `tests.actual_revision`, and `artifact.revision` are identical.
2. Check two merge parents, passing tests, archive reproducibility, and tamper detection.
3. Write a release-review note describing exactly what passed and what is still untested.
4. Include the fact that `remote_publication=false` and `production_deployment=false`. List the separate approvals, CI evidence, trusted provenance, access control, operational checks, and rollback planning a real release could require.
