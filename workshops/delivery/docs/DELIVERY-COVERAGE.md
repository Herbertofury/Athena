# Coverage and evidence boundaries

## Executed local capability

The eight fixed CLI exercises use real Git in newly created owned temporary repositories. They demonstrate retained committed snapshots; different staged/unstaged content; divergent nonconflicting two-parent merge; deliberate same-line conflict and explicit resolution; additive revert preserving the mistaken commit; fixed JSON predicates tied to an exact clean revision; deterministic in-memory USTAR construction from committed teaching files; SHA-256 comparison and deliberate byte tampering; and a local candidate whose merged, tested and packaged revisions agree.

The `revision-tests` checks are Python predicates over fixed committed JSON data. They are not compilation or execution of learner programs. The separate unittest suite validates the teaching runner, including boundaries, rejected inputs, real command effects, repeated runs, environment/configuration isolation, ordinary cleanup and explicit injected failures. Synthetic fixtures make results easy to reason about; they do not represent a production application.

## Taught with explicit limits

- Working tree, index and HEAD are distinct. `snapshots` shows retained versions; `staging` supplies the three-state observation.
- Full revision identity is stronger evidence than a moving branch label, but does not authenticate the author.
- A clean textual merge can still contain a semantic defect.
- A revert corrects source history additively and does not undo external side effects.
- A test receipt must describe the actual source and environment, and cannot approve a newer revision automatically.
- CI revision context depends on its triggering event. GitHub Actions references are read, not executed.
- Matching bytes under a fixed local recipe are a bounded repeatability result. Independent rebuilding and cross-platform reproducibility are not established.
- A digest is not encryption or publisher authentication. Signed provenance is discussed only to explain what the exercise lacks.

## Not performed

No user repository; no remote, clone, push, pull, fetch or hosted pull request; no account authentication, credential saving, signing keys, signatures or attestations; no external hooks; no global configuration writes; no destructive Git cleanup; no arbitrary learner code; no hosted CI run; no package registry; no deployment or production rollback; no network scanner; no browser or graphical Git tool; no release upload or external learner-pack publication.

The runner is trusted source with fixed inputs, not an arbitrary-code sandbox. It excludes network operations from its allowlist and environment but does not enforce OS network isolation or provide a packet capture. Timeouts and output limits are bounded controls for known tiny commands, not a guarantee against a compromised executable or operating-system failure. Ordinary cleanup cannot guarantee removal after forced process termination.

## Verified environment

Linux with Python 3.12.14 and the installed `/usr/local/bin/git` 2.52.0. The runner deliberately avoids inherited PATH and records the actual resolved executable/version. Python 3.12 reference pages currently identify maintenance documentation 3.12.16. Other versions, installations and operating systems remain unverified; no universal minimum-version compatibility promise is made.

## Learner evidence rubric

A complete local handoff includes:

1. Correct predictions and explanations for snapshots, staging and parent relationships.
2. The observed conflict and rejection steps, not only successful terminal states.
3. Exact source/test/package identifiers reconciled within the same capstone run.
4. Actual runtime, command, outcome, manifest and complete artifact digest.
5. Clear distinction between author metadata, authentication, integrity and provenance.
6. A precise local-only statement and one residual risk with a proposed verification step.

The answer key is a reasoning aid, not proof of execution. If tools are unavailable, use the worksheet as a paper exercise and mark all expected outputs as unexecuted. Eight primary checks and sixteen supplemental practice checks are original course questions, not certification questions or an exam-readiness assessment.
