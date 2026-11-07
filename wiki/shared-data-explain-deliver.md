# Deliver a reproducible analysis with honest limits

Export a small result, preserve missing-value semantics and explain the finding.

## Learning goals

- Produce and verify a real local CSV export.
- State a supported finding with population and uncertainty.
- Separate SQL foundations from unexecuted Power BI and PL-300 work.

## Learn

A useful analysis handoff lets another person reproduce the result and understand what it means. Include the source description, snapshot, grain, population, SQL, environment, outputs and limitations. A polished number without those details can be less trustworthy than a simple table with a clear definition and a reproducible query.

The export command runs the queue summary, writes four rows to a CSV inside its own temporary directory, reads them back as text and compares them with the documented representation. SQL NULL becomes an empty CSV field. Counts remain explicit numeric text, including zero for Training. This convention must travel with the file because CSV itself does not preserve SQL types or NULL meaning.

The temporary export is a practice round trip, not a persistent user report. Its directory is cleaned up and no personal file is overwritten. The pack includes the query and expected results so you can reproduce the process. Do not treat successful byte or field serialization as proof that the underlying metric was well chosen; earlier grain and denominator checks still matter.

A supported summary is: seven synthetic tickets opened in the main UTC interval; five are closed in the frozen snapshot; observed work averages 26.25 minutes across four measurements, with three missing. A useful next question is why measurements are missing. The data does not support claiming faster resolution, staff superiority, causation or a real operational trend.

Choose a display that serves the question. A small labelled table can show ticket counts alongside observation counts and missingness. If later creating a chart, state the unit and time window, avoid hiding zero categories and provide a text explanation rather than relying only on color. This module supplies analysis reasoning and an accessible text guide, not a complete dashboard design course.

PL-300 covers Power BI-specific skills beyond this pack, including Power Query, DAX, semantic modeling, visualization, management and security. No Power BI Desktop or service, DAX measure, refresh, publishing or row-level-security workflow was executed. Use the current official study guide for that broader plan. Finishing these local foundations is progress, not full PL-300 coverage, exam readiness or certification.

## Worked example

The export round trip produces four queue rows. Training has ticket count "0" but empty work sum, mean and rate fields, representing SQL NULL. A good handoff includes that distinction and the differing main/daily intervals. It records local SQLite execution while marking Power BI implementation and assessment as unexecuted.

```sql
-- Reproducible summary comes from queries/groups.sql.
-- Export uses csv.DictWriter, then reads the file back as text.
-- Empty exported aggregate fields represent SQL NULL under this contract.
-- No Power BI dataset or report is published.
```

## Practice safely

1. Run python3 labs/data-workshop/run_lab.py export.
2. Verify four rows, round-trip equality, Training’s zero count and empty aggregates.
3. Write a one-paragraph finding with denominator, snapshot and missingness.
4. Complete the capstone worksheet and include exact SQL/commands.
5. Add one original boundary or cardinality test without weakening baseline tests.
6. List Power BI and PL-300 areas still unexecuted or uncovered.

## Evidence to keep

- Actual local export verification.
- A reproducible, caveated analysis handoff.
- An explicit Power BI/PL-300 gap list.

## Original check 1

What does Training’s empty exported mean field represent?

- A recorded zero-minute mean
- SQL NULL under the documented CSV convention
- A deleted queue
- A guaranteed spreadsheet error

<details><summary>Answer and explanation</summary>

SQL NULL under the documented CSV convention. The queue has no cohort observations, so its mean is absent, not zero.

</details>

## Original check 2

Which conclusion is supported?

- A real team is faster than another
- The SQL pass guarantees PL-300 readiness
- The synthetic cohort has five closed snapshot statuses among seven tickets, with stated measurement gaps
- Missing values can be ignored without disclosure

<details><summary>Answer and explanation</summary>

The synthetic cohort has five closed snapshot statuses among seven tickets, with stated measurement gaps. The statement stays within the actual population, snapshot and available evidence.

</details>

## Original check 3

Does this pack complete PL-300 preparation?

- Yes, SQL is the whole exam
- Yes, because it exports CSV
- Only the artifact filename matters
- No; Power BI-specific work and broader objectives remain unexecuted or uncovered

<details><summary>Answer and explanation</summary>

No; Power BI-specific work and broader objectives remain unexecuted or uncovered. This is a data/SQL foundation, not full Power BI implementation practice or an exam-readiness assessment.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

No Power BI software, DAX, refresh, publishing, permissions or exam assessment is performed. This pack does not claim full PL-300 coverage or readiness.

## Official references

- [https://docs.python.org/3.12/library/csv.html](https://docs.python.org/3.12/library/csv.html)

- [https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300)

