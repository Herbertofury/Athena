# Supplemental workshops: additive review candidate

These 46 original lessons and 138 explained checks are available as local, script-free HTML study guides with safe fixed exercises. They are **not yet registered in Athena's main catalog, navigation, progress system, built-in downloads or public runtime package**. The existing 90-lesson application and five workshops remain unchanged. Catalog integration and its separate acceptance work remain pending.

Open [the supplemental study index](../workshops/START-HERE.html) locally after downloading the repository, or use the Markdown lesson paths below. HTML pages use native links and expandable answers; they do not run commands, connect to cloud services or record progress.

| Workshop | Lessons / explained checks | Begin | Execution boundary |
| --- | --- | --- | --- |
| Version Control & Reproducible Delivery | 8 / 24 | [Guide](../workshops/delivery/README.md), [lessons](../workshops/delivery/docs/paths/delivery-workshop.md) | Actual Git only in fresh, owned temporary repositories with synthetic files; no remote or personal repository. |
| Power BI Concepts | 8 / 24 | [Guide](../workshops/bi/README.md), [lessons](../workshops/bi/docs/paths/bi-workshop.md) | Local Python reasoning models; Power BI, M, DAX, Fabric, permissions and report workflows remain unexecuted. |
| AWS Foundations | 10 / 30 | [Guide](../workshops/aws/README.md), [lessons](../workshops/aws/docs/paths/aws-workshop.md) | Cost-free local architecture models, not AWS operations or an AWS emulator. |
| Azure Foundations | 10 / 30 | [Guide](../workshops/azure/README.md), [lessons](../workshops/azure/docs/paths/azure-workshop.md) | Cost-free local administration models, not Azure deployment, configuration, backup or recovery. |
| CCNA Foundations | 10 / 30 | [Guide](../workshops/ccna/README.md), [lessons](../workshops/ccna/docs/paths/ccna-workshop.md) | Synthetic network decision models; no equipment, IOS, emulator, radio or network protocol execution. |

## Study and verify

Start with each guide's prerequisites, predict the fixed exercise outcome, run only the documented wrapper commands and explain the result before revealing answers. Paper predictions are supported but must be labeled unexecuted. Tests validate the bounded teaching models, not learner competence or real-world operation.

From the repository root, run each independent pack's test suite without changing the existing application test registration:

```sh
for pack in delivery bi aws azure ccna; do
  (cd "workshops/$pack" && python3 -B -m unittest discover -s tests -v) || exit 1
done
```

The tested reference is Linux with Python 3.12.14 and Git 2.52.0. Each pack includes its official-source register, dated review details, objective gaps, lab guide, worksheet and answer key. No cloud account, credential, paid resource or real device is required. The Delivery runner's own temporary repository cleanup does not delete user repositories.

## Coverage limits

These are original foundation lessons, not copied examination questions, complete certification coverage or evidence of exam readiness. PL-300, AWS, Azure and Cisco mappings remain partial. Actual vendor workflows, production operation and broader objectives require further study and authorized practice.

- AWS source notes distinguish current CLF-C02/SAA-C03 guide revisions from an unverified exam-effective date.
- AZ-900 uses the readable current guide. Conflicting AZ-104 page metadata leaves its current task-effective date unverified; its mapping is limited to stable conceptual domains.
- CCNA maps selected v1.1 topics only. Cisco announced the last v1.1 test date as February 2, 2027 and first v2.0 test date as February 3, 2027. The official v1.1 PDF link redirected to v1.0 during review, so the register instead identifies the indexed topics, readable release notes and announcement; no v2.0 mapping is claimed.

This additive candidate does not change runtime code, accessibility code, existing tests, CI workflows or deployment configuration. Hosted CI for the unchanged app does not automatically run the new pack tests or establish browser acceptance of these new guides. Catalog integration remains pending and must not be inferred from the presence of app-compatible JSON.
