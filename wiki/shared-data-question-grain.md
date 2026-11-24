# Define the question and the row grain

Turn an ambiguous service-desk question into a metric contract before querying.

## Learning goals

- State what one row represents in each table.
- Specify a metric population, numerator, denominator and snapshot.
- Separate a cohort status measure from events occurring during a period.

## Learn

An analysis begins with a decision and a question, not a chart type. “How are tickets doing?” is too vague to test. Ask which tickets, which period, which status definition, which unit and which audience. A query can run successfully while answering the wrong question, so write the intended interpretation before trusting a result.

The grain is what one row represents. In this pack, tickets has one current-state row per ticket identifier; touches has one interaction row per interaction identifier; queues has one descriptive row per queue. Multiple touches can belong to one ticket. Those grains are different even when two tables share a ticket_id column.

Our main population is tickets opened from November 1, 2026 at 00:00 UTC up to, but not including, November 3 at 00:00 UTC. Status and work values come from an invented frozen snapshot labelled November 5. The question is the share of that opening cohort whose snapshot status is closed. It is not the number closed during those two days.

The CSV has no resolution timestamp, historical status changes or service-level target. Therefore it cannot establish when closure happened, how long resolution took or whether an SLA was met. Do not fill those gaps with assumptions because a dashboard would look more complete. A useful limitation explains exactly which missing field or definition prevents the stronger conclusion.

Microsoft’s star-schema guidance distinguishes descriptive dimensions from observations or events and emphasizes consistent granularity. The small queue table plays a descriptive role here. This is an introductory relationship design, not a complete Power BI semantic model or a warehouse with historical dimension management. Keep the business meaning ahead of any tool-specific labels.

Run the profile command to verify nine tickets, nine touches and four queues. Equal row counts do not mean one-to-one relationships: their keys and relationships determine that. Record the source as synthetic fixtures, not real company records. Your final handoff should make the population, grain, time basis and missing evidence easy for someone else to repeat and challenge.

## Worked example

Seven tickets belong to the main opening cohort, and five have closed snapshot status: 5/7, about 71.4%. That does not mean five were resolved inside the reporting window. There are nine total tickets and nine total touch rows, but some tickets have several touches and others none. Matching table counts do not establish matching row identities.

```sql
SELECT COUNT(*) AS all_ticket_rows FROM tickets;
-- The reporting cohort adds an explicit opened_at interval.
-- Status describes the frozen synthetic snapshot, not a closure event time.
```

## Practice safely

1. Write the service-desk question in one testable sentence.
2. Define the row grain and primary identifier for all three CSV files.
3. State the main population, snapshot, numerator and denominator.
4. Run python3 labs/data-workshop/run_lab.py profile.
5. Name two questions the absent resolution history prevents you answering.
6. Record synthetic provenance and avoid claiming real operational performance.

## Evidence to keep

- A complete metric contract.
- Three explicit grain definitions and profile output.
- A list of questions the data cannot answer.

## Original check 1

What is the grain of touches?

- One queue
- One current-state ticket
- One interaction per touch identifier
- One reporting month

<details><summary>Answer and explanation</summary>

One interaction per touch identifier. Each touch is an interaction and several can belong to one ticket.

</details>

## Original check 2

What does the 5/7 closed share mean here?

- Five tickets necessarily closed during November 1–2
- Five of seven tickets opened in the interval are closed in the frozen snapshot
- Every queue met an SLA
- The average resolution time is known

<details><summary>Answer and explanation</summary>

Five of seven tickets opened in the interval are closed in the frozen snapshot. The filter selects an opening cohort; the status field comes from the snapshot, not a closure timestamp.

</details>

## Original check 3

Both tickets and touches contain nine rows. What follows?

- Their relationship must be one-to-one
- All tickets have exactly one touch
- Nothing about cardinality without examining keys and matches
- The data is duplicated

<details><summary>Answer and explanation</summary>

Nothing about cardinality without examining keys and matches. Total row counts alone do not reveal how records relate.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

The dataset is invented. It contains no resolution history, SLA target or real staff performance evidence; this is not a complete Power BI model.

## Official references

- [https://learn.microsoft.com/en-us/power-bi/guidance/star-schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)

- [https://www.sqlite.org/lang_select.html](https://www.sqlite.org/lang_select.html)

