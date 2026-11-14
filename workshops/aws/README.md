# AWS Foundations: Evidence Before Architecture

Ten original lessons, 30 original explanatory practice checks and ten bounded offline exercises. Open START-HERE.html in a browser or read docs/WORKBOOK.md. The static workbook has semantic headings, keyboard-accessible links and native answer disclosures, a skip link, visible focus and wrapping code. It uses no external assets or scripts. These properties are design provisions, not a completed assistive-technology audit.

## Run locally

Use Python 3 from this workshop directory:

```sh
python3 labs/aws-workshop/run_lab.py capstone
python3 -m unittest discover -s tests -v
python3 scripts/render_aws_content.py
```

Read labs/aws-workshop/README.md and CONTRACTS.md before interpreting a receipt. No installation or dependencies are needed beyond Python standard library. No AWS account, credentials, CLI, SDK, API, network, provisioning, CloudFormation, Terraform, purchase or paid service is used. Python receipts are synthetic teaching results, not AWS configurations or service-engine execution.

## What is included

- scripts/aws_content.py is the authored source; render_aws_content.py produces deterministic JSON, Markdown and HTML.
- content/aws-lessons.json, aws-checks.json and aws-path.json are integration artifacts.
- docs/shared contains the full lessons; docs/paths contains the workshop path.
- docs/AWS-COVERAGE.md gives a dated, deliberately partial objective map.
- research/aws-sources.json and the accompanying research notes preserve verified official references and limits.
- labs/aws-workshop contains fixtures, fixed commands, contracts, worksheet and answer key.

The guide revisions published October 29, 2026 describe approximately a one-month lead before exam changes, not an exact effective date. Mapping reflects official guides reviewed November 8, 2026. Completion is neither exam readiness nor deployment approval. Architecture and troubleshooting exercises are SAA-oriented enrichment, not CLF implementation requirements. Athena here is the user's learning product, not the Amazon Athena query service.
