# Power BI Concepts: From Model to Evidence

Eight original lessons extend the Data & SQL workshop with semantic-model reasoning, transformations, DAX context concepts, dates, accessible report plans, storage/refresh choices and permissions/RLS. Open START-HERE.html for a script-free study guide, with expandable answer explanations. Registration in Athena's main catalog, navigation, progress system and built-in downloads remains pending.

This is conceptual preparation with local Python teaching models. **Power BI, Power Query M, DAX, Fabric, gateways, service permissions and actual report accessibility are unexecuted.** The models are not vendor emulators, production software, access controls or an exam-readiness assessment.

## Start safely

1. Read the [lab guide](labs/bi-workshop/README.md) and [coverage map](docs/BI-COVERAGE.md).
2. Predict a fixed model’s output on the [worksheet](labs/bi-workshop/WORKSHEET.md).
3. From this extracted folder, run `python3 labs/bi-workshop/run_lab.py transform` or another documented fixed command.
4. Compare the receipt with the [answer key](labs/bi-workshop/ANSWER-KEY.md). Explain differences before moving on.
5. Record what Python actually computed and which product checks remain pending. Paper reasoning is a supported alternative, but is not executed evidence.

The runner uses only Python’s standard library and synthetic data. It accepts an exercise name, not a path, URL, account or arbitrary expression. It does not install software or write output files. Redirecting its output to your own chosen file is optional, not performed by the runner. Use Python 3.12 for the tested reference; other interpreters and operating systems remain unverified.

## Commands

- transform: typed values, rejected data and count reconciliation.
- model: key/grain integrity and declared dimension-to-fact paths.
- context: row amounts, filter intersection and replacement analogies.
- dates: a full-year calendar, period cutoffs and cumulative arithmetic.
- report: explicit denominators and a declared accessibility-plan checklist.
- refresh: copied snapshot versus source-dependent read during an outage.
- access: a hypothetical Viewer/RLS role classifier, not actual authorization.
- capstone: integrated local evidence with unexecuted product tasks.

Run the supplied checks with `python3 -m unittest discover -s tests -v`. Passing these tests establishes only the fixed teaching behavior. All 24 original multiple-choice checks include rationales; none are official exam questions. These standalone checks do not record app XP or prove practical execution.

Official sources and review dates are in [research/bi-sources.json](research/bi-sources.json). The PL-300 comparison is partial and thematic. Use the current issuer guide for your exam date and language rather than inferring a coverage percentage.
