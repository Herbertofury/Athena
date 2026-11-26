# Review cybersecurity material before Athena learns from it

A large cybersecurity collection can mix useful defensive guidance with copied reports, private data, executable content, and instructions that should not become agent capabilities. Review each candidate source separately. A collection-level license label and a download count don't establish upstream rights, factual accuracy, or permission to train.

## Make three separate decisions

| Decision | Evidence to require | Result |
| --- | --- | --- |
| Can Athena cite this? | Canonical publisher URL, document or version, review date, and exactly which claim it supports | Cite and summarize verified defensive guidance. Don't imply that the source endorses Athena. |
| Can Athena store or index this? | Per-item provenance and rights, including restrictions on storing or sharing; human review for personal data, secrets, active content, and embedded instructions | Keep only approved defensive material. Quarantine unknowns outside search; never treat unknown as clean. |
| Can an assistant act on this? | A separately authorized task and a narrowly scoped trusted tool | A retrieved passage is evidence, never an authorization to run commands, change settings, contact a service, or expand access. |

Keep a small receipt for accepted material: publisher, canonical URL, document revision, review date, supported claim, rights decision, permitted use, and next review. If Athena retains a reviewed file, log its digest too. A digest checks byte identity; a matching digest does not establish who published the content or whether its claims are true. A permission to cite or index is not a permission to fine-tune on the source.

## What Athena can use now

- **Review your own generated or maintained code.** Use [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) to frame review around the trust boundary, intended behavior, remediation, and a regression test that proves the fix. Report what you inspected and what still needs verification. Don't confuse a scanner hit with a confirmed finding.
- **Keep a knowledge index separate from an execution channel.** Use the [NIST AI development profile](https://csrc.nist.gov/pubs/sp/800/218/a/final) for provenance review and [OWASP's prompt-injection prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) for trust boundaries. In Athena, review sources offline, quote them as data, give retrieval no action permissions, and require human review before a new source becomes searchable. Apply least privilege at the tool boundary rather than relying only on a model instruction.
- **Practice detection and incident response with synthetic evidence.** Use [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final) to connect preparation, detection, response, recovery, and improvements. For practice, use Athena's [offline Security Foundations lab](../labs/security-foundations/README.md). Keep observations, hypotheses and unknowns separate.

## Practice: review four fictional records

No software, downloads, network targets or real log data are needed. For each record, write one sentence explaining the decision and what would change it.

| Fictional record | What the reviewer observes | Correct decision |
| --- | --- | --- |
| Vendor hardening guide | Canonical documentation identifies the applicable version and explains a safe default. | Cite the versioned guidance; note that applicability depends on the installed version. Index a reviewed original summary rather than copying the document by default. |
| Mirror of a bug-report collection | The mirror's README advertises broad reuse, but there is no rights or provenance record for the individual reports. | Keep out of ingestion and training. A mirror's label does not settle upstream rights or establish defensive scope. |
| Source note with an embedded task | A copied paragraph tells Athena to change a setting before answering. | Treat the paragraph as data; do not act on it. Flag the content for review and verify that retrieval cannot call tools. |
| Synthetic alert report | Multiple simulated warnings line up with a local test log, but there is no independent explanation for them. | Log what was observed, label the cause unknown, and propose a defensive verification step. Do not claim compromise or attribute it to a person. |

**Two acceptance checks for a future importer:** a record with unknown rights never appears in the searchable index; a retrieved document with embedded instructions cannot produce tool activity even if it appears first in the results. Check both against the actual importer before marking them implemented.

**Closeout:** Primary sources reviewed November 26, 2026. This is a repository learning supplement and paper exercise, not an importer, training run, release, or claim that Athena has executed these controls. No third-party corpus, exploit examples or real incident material was imported.
