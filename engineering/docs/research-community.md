# Community reports and GitHub signals

The [research explorer](explorer/index.html) keeps three kinds of comparison separate: dated GitHub popularity, moderated community experience, and benchmark observations within a named comparable cohort. A community rating describes one account's experience with one candidate in one evaluation track. It does not establish a universal winner or promote a candidate to an Atlas-measured result. The [research method](research-method.md) and [benchmark format](benchmark-format.md) define the stronger evidence needed for that promotion.

## Submit an experience report

Open the **Research experience report** issue form from the explorer's contribution link or the [issue chooser](https://github.com/Herbertofury/Engineering-Atlas/issues/new/choose). Use the exact candidate ID and evaluation track ID in the catalog. Record the version or revision used, workload, environment, relevant costs, failures, and public evidence. Disclose affiliation with the project when relevant. Select your own score; the form has no preselected rating.

| Score | Meaning for the stated workload |
| --- | --- |
| 1 | Poor fit; substantial unresolved problems |
| 2 | Limited fit; significant tradeoffs or workarounds |
| 3 | Adequate; useful with material limitations |
| 4 | Strong fit; worked well with stated caveats |
| 5 | Excellent fit; supported by detailed experience and limitations |

Keep the five generated headings unchanged: **Candidate ID**, **Evaluation track**, **Rating**, **Version used**, and **Experience and evidence**. Do not add further level-three headings inside the evidence field. Reports may use paragraphs, lists, and public links. The parser rejects missing fields, repeated or changed headings, unknown candidates, mismatched tracks, non-integer scores, bot accounts, and pull requests. GitHub converts issue-form responses into an editable issue body; form field IDs are also used for URL prefills. See [GHS05 — GitHub issue-form syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms), [GHS06 — GitHub's form schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema), and [GHS08 — issue creation URL parameters](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue#creating-an-issue-from-a-url-query).

Only the newest eligible approved report for each `(GitHub numeric account ID, candidate ID, evaluation track)` counts. Newest means the latest GitHub issue `updated_at`, with issue number breaking a tie. The stable account ID prevents a login rename from becoming an extra vote. Several accounts can still belong to one person, and neither GitHub accounts nor moderation prove independent use. These remain **public account reports**, with selection bias and possible coordinated voting. Moderators should investigate suspicious patterns and evidence without treating popularity as proof.

## Moderate and approve a report

Review the report for relevance, clear version and environment, honest limitations, and publishable evidence. Approval means the report is suitable for inclusion; it does not independently validate its performance claims. Keep personal information, credentials, private logs, and proprietary assets out of public evidence.

An eligible report needs both the `research-rating-approved` label and a current maintainer's approval of its exact body. Labels alone do not approve mutable content. A SHA-256 marker binds approval to the raw UTF-8 issue body returned by GitHub, including whitespace. The script never posts a comment or applies a label.

1. Review the current issue and resolve necessary edits with its author.
2. From the repository root, print a marker for that exact body, replacing `123` with the issue number:

   ```sh
   python scripts/refresh_research_signals.py --approval-hash 123
   ```

3. Check that the printed issue URL is the report reviewed. Manually post the printed `atlas-rating-approved: sha256=...` line as the entire content of a new comment. Do not wrap it in a code fence or add other text to that comment.
4. Apply `research-rating-approved`. Create that repository label if it does not exist. The optional `research-rating` label helps collect submissions but is never approval.
5. Run a ratings refresh and inspect the resulting JSON diff before publishing it.

The approval author must be the repository's current individual owner or have a current `triage`, `triage_plus`, `write`, `maintain`, or `admin` role verified through GitHub. The script verifies the numeric identity returned by the permission endpoint. A plain organization membership or historical contributor association is insufficient. Custom roles with a verified `write` or `admin` base permission qualify; an unrecognized custom role with only a `read` base permission does not. GitHub's permission endpoint maps maintain to write and triage to read while exposing the named role separately; see [GHS03 — repository permissions for a user](https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#get-repository-permissions-for-a-user).

**An edit invalidates the old body hash.** Review the revised body and post a fresh marker before its next inclusion. An unchanged body remains approved when unrelated discussion is added. Remove the approval label, delete the approval comment, or close the issue to withdraw the report on the next complete successful refresh. If a second eligible approved report from the same account exists, the newest remaining eligible report counts. Refreshes are snapshots, so moderation changes become visible after a successful refresh, rebuild, and publication.

The initial approved-issue listing is compared with a second full listing before replacement. This catches changed bodies, closure, labels, comment counts, and unstable pagination during collection. GitHub does not supply an atomic transaction spanning these endpoints; the retained approval hash and comment URL support subsequent audit.

## Community ranking rule

The explorer's community ordering uses a fixed prior of **3 stars with the weight of 5 reports**, and requires **at least 3 distinct eligible account reports** before a candidate is ranked by community score:

```text
adjusted score = (sum of submitted scores + 5 × 3) / (report count + 5)
```

For example, three scores of 5 yield `(15 + 15) / 8 = 3.75`; three scores of 1 yield `(3 + 15) / 8 = 2.25`. These are explanatory calculations, not real candidate results. The prior reduces the effect of very small samples; it is an explicit project policy, not a claim that 3 is an empirically calibrated population average. Display the report count with the score. Fewer than three reports means insufficient community evidence, not zero quality.

Rank within the selected evaluation track. Version and environment remain visible in the underlying reports, and a collection of ratings across versions is not a controlled benchmark. External leaderboard observations keep their own cohort, protocol, metric direction, configuration, and source. Atlas measurements require actual retained experiment artifacts. GitHub stars do not substitute for either type of evidence.

## Refresh public signals manually

The Python standard-library script [refresh_research_signals.py](../scripts/refresh_research_signals.py) makes **GET requests only**. It reads the checked-in catalog, updates local JSON, and prints a small status summary. It does not post, label, comment, commit, publish, run retrieved content, or schedule future work.

```sh
python scripts/refresh_research_signals.py --only repositories --max-repos 25
python scripts/refresh_research_signals.py --only ratings
python scripts/refresh_research_signals.py --only all --max-repos 50
```

`GITHUB_TOKEN` is optional and is read only from the process environment. Use the environment's normal secret mechanism when authentication is needed; never put the token in a command argument, URL, issue, evidence file, or commit. The script sends it only in an Authorization header to `https://api.github.com`, and rejects redirects to other hosts or to HTTP. Public repository metadata can be read without a token; verifying non-owner reviewer permissions can require authenticated repository metadata access. If that verification fails, the previous community snapshot is retained.

The non-owner permission endpoint explicitly supports GitHub App installation access tokens with repository **Metadata: read**; it does not document a write permission requirement for this lookup ([GHS03](https://docs.github.com/en/rest/collaborators/collaborators?apiVersion=2022-11-28#get-repository-permissions-for-a-user)). The token must have access to the repository being checked. Permission failures remain collection failures, so the collector never assumes that an unreadable reviewer is authorized. Owner approvals use the confirmed public repository owner's numeric ID and do not require this collaborator lookup.

Repository refreshes deduplicate catalog repository names case-insensitively, fetch missing or oldest observations first, and process at most `--max-repos` repositories. A successful response records stars, forks, archive state, SPDX license identifier when known, last push time, canonical GitHub URL, and the UTC observation time. License absence or GitHub's `NOASSERTION` stays unknown. Stars and forks are popularity signals; last push time is not proof of maintenance quality. A redirect to a renamed public repository can update its canonical URL while preserving the catalog lookup key.

Requests are serial, time out after 20 seconds, and accept at most 5 MiB per response. A 403 or 429 response stops further network requests for that run. The error records the `Retry-After` or exhausted-limit reset time when available; otherwise it uses a conservative one-minute retry indication. No automatic retry loop runs. Rerun manually after the reported retry time and resolve access errors before retrying. This follows [GHS04 — GitHub REST best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api) and [GHS07 — REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

Issue and comment collections follow every next-page link, with up to 100 items per page. `--max-pages` defaults to 100 per collection and may be raised explicitly up to 1000. Hitting the limit, a changed pagination target or filter, an unreadable page, a permission lookup error, or an inconsistent final issue listing prevents the community snapshot from being replaced. The collector filters out pull requests because [GHS01 — the issues endpoint](https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues) includes them; approval bodies come from [GHS02 — the issue comments endpoint](https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#list-issue-comments).

## Snapshot and failure behavior

| File | Successful refresh | Incomplete or failed refresh |
| --- | --- | --- |
| `data/research-signals.json` | Updates each successfully read repository and its `observed_at` | Retains each failed repository's previous values and date; missing data stays missing |
| `data/research-community.json` | Replaces ratings and advances `last_completed_at` only after all required collections and permissions are complete | Retains the entire previous ratings array and `last_completed_at`, including all report dates and approval provenance |

Both files retain historical error records and update `last_attempted_at`. The community snapshot also records `last_completed_at`: the UTC time when the most recent complete collection finished, including a successful collection with no eligible reports. It starts as `null` and stays unchanged on any failed or partial refresh. Each report's `updated_at` remains the issue update time supplied by GitHub; refreshing does not rewrite it. Thus the attempt time describes when collection was tried, the completion time describes the freshness of the retained collection, and the report time describes the underlying issue. An attempted refresh date is not a new observation date.

Each recorded operational failure names its safe subject and error type without including response bodies, credentials, or headers. A rejected report records a reason; it does not make a complete collection operationally incomplete. Closing or unlabeling every report therefore produces an empty ratings snapshot only after a complete successful read, never because a fetch failed.

Exit code `0` means the selected refreshes completed without new operational errors; report exclusions remain visible in the summary and errors array. Exit code `1` means a selected refresh encountered an operational failure. Repository refreshes can still contain genuine partial progress while retaining failed entries. Local output files are replaced atomically, and malformed existing top-level snapshot schemas are refused. Review error records and diffs before rebuilding the explorer.

## Verification

The mocked-network tests in [test_research_signals.py](../tests/test_research_signals.py) exercise missing data, rate limits, secret-safe errors, complete pagination, moderation identity, body edits, deduplication, and full snapshot preservation. Their synthetic accounts and counts are test fixtures, never research evidence.

```sh
python -m unittest discover -s tests -p 'test_research_signals.py' -v
python scripts/check_research.py
```
