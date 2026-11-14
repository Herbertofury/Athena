# Azure Foundations: Administrative Evidence and Boundaries

Open **START-HERE.html** for a self-contained, keyboard-accessible workbook containing all ten lessons, examples and thirty original checks. Python is needed only for the optional offline model runs. No account or internet connection is required for learning or execution; official reference links are optional reading.

## Begin

1. Read [workbook instructions](docs/WORKBOOK.md) and [coverage and gaps](docs/AZURE-COVERAGE.md).
2. Read a lesson, predict the fixed fixture result, then run its exact local Python command from this directory.
3. Compare the actual receipt with the prediction. Keep paper alternatives separate from executed results.
4. Retain evidence and write the remaining real-world validation gaps.

```sh
python3 labs/azure-workshop/run_lab.py hierarchy
python3 scripts/render_azure_content.py
python3 -m unittest discover -s tests -v
```

[Lab guide](labs/azure-workshop/README.md) · [Worksheet](labs/azure-workshop/WORKSHEET.md) · [Answer key](labs/azure-workshop/ANSWER-KEY.md) · [Learning path](docs/paths/azure-workshop.md) · [Public official sources](research/azure-sources.json)

## Honest scope

This is partial AZ-900 conceptual coverage with broader Azure administrative enrichment. It is not a full AZ-900 or AZ-104 course, examination bank, practical-readiness assessment or production approval. Official AZ-104 material retrieved during the 2026-11-08 review conflicted about its effective date. Version verification remains incomplete; mappings refer to stable domains only.

All real Azure operations are unexecuted. No Azure CLI, SDK, APIs, credentials, provisioning, external network calls, public writes, payment or browser use is involved in the executable labs. Models are ordinary local Python, not Azure service emulators. Results apply only to supplied fixtures and documented rules.

## Authored and generated files

The original lesson source is `scripts/azure_content.py`; `scripts/render_azure_content.py` deterministically generates the content JSON, ten shared lesson documents, path and HTML. Reference metadata is the public `research/azure-sources.json`. Re-render after editing source, then run both lab and content tests. Do not replace a failed or ambiguous receipt with a paper prediction.
