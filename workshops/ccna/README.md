# CCNA Foundations: Network Decisions and Evidence

Open **[START-HERE.html](START-HERE.html)** in a browser for the complete accessible static workbook. No server, account or internet connection is needed for lessons and local exercises. Official links are optional references requiring internet access. The workbook uses standard HTML, keyboard-accessible links and expandable answer explanations, with no external scripts or fonts.

Ten original lessons extend Athena's Packet Trail into VLAN-scoped learning, loop control, LACP compatibility, IPv6, route preference, OSPF prerequisites, ACL/NAT reasoning, WLAN planning, typed automation and evidence-led review. This is not a renamed packet journey: each lesson has a new model decision, six explanation paragraphs, three goals, a worked example tied to a fixed receipt, six practice steps, three evidence items and three original checks. No copied examination questions are included.

## Begin

1. Complete the [Packet Trail prerequisites](docs/paths/ccna-workshop.md) or review the corresponding catalog lessons.
2. Read the [workbook instructions](docs/WORKBOOK.md) and [coverage limits](docs/CCNA-COVERAGE.md).
3. Predict each fixed result before running its command. Python 3.12 and the standard library are sufficient; no installation or credentials are needed.
4. Keep calculations and receipts separate from unexecuted paper alternatives.

From this workshop directory:

```sh
python3 -B labs/ccna-workshop/run_lab.py vlans
python3 -B scripts/render_ccna_content.py
python3 -B -m unittest discover -s tests -v
```

The renderer writes only this workshop's generated JSON, lesson Markdown, path page and static HTML. The lab command reads only fixed packaged fixtures and prints synthetic JSON. Neither tool connects to equipment or implements Cisco IOS. Use the [lab guide](labs/ccna-workshop/README.md), [contracts](labs/ccna-workshop/CONTRACTS.md), [worksheet](labs/ccna-workshop/WORKSHEET.md) and [answer key](labs/ccna-workshop/ANSWER-KEY.md).

## Contents and scope

- [Lesson JSON](content/ccna-lessons.json), [30 checks](content/ccna-checks.json), [path](content/ccna-path.json).
- [Official reference register](research/ccna-sources.json), reviewed 2026-11-08, with source scope and retrieval limits.
- [Detailed objective gap map](research/ccna-objective-gap-map.json), separating conceptual discussion from local model evidence.
- [Readable lesson sequence](docs/paths/ccna-workshop.md).

No device, emulator, network traffic, credentials, API operations or configuration changes are used. No publication is performed. Completion is neither full CCNA coverage nor evidence of exam readiness or operational competence. Current mappings refer only to selected CCNA 200-301 v1.1 concepts; the announced v2.0 transition requires a new mapping before use for that version.
